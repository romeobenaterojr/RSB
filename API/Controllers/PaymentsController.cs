using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.SignalR;
using Stripe;
using API.SignalR;
using API.Extensions;

namespace API.Controllers;

[Route("api/[controller]")]
public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;
    private readonly IUnitOfWork _unit;
    private readonly ILogger<PaymentsController> _logger;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly string _whSecret;

    public PaymentsController(
        IPaymentService paymentService,
        IUnitOfWork unit,
        ILogger<PaymentsController> logger,
        IConfiguration config,
        IHubContext<NotificationHub> hubContext)
    {
        _paymentService = paymentService;
        _unit = unit;
        _logger = logger;
        _hubContext = hubContext;

        _whSecret = config["StripeSettings:WhSecret"]
            ?? throw new ArgumentNullException(nameof(config), "StripeSettings:WhSecret not found");
    }

    // ✅ Create or update PaymentIntent
    [Authorize]
    [HttpPost("{cartId}")]
    public async Task<ActionResult<ShoppingCart>> CreateOrUpdatePaymentIntent(string cartId)
    {
        if (string.IsNullOrWhiteSpace(cartId))
            return BadRequest("CartId cannot be null or empty");

        var cart = await _paymentService.CreateOrUpdatePaymentIntent(cartId);
        if (cart == null) return BadRequest("Problem with your cart");

        if (!string.IsNullOrEmpty(cart.PaymentIntentId))
        {
            var spec = OrderSpecification.ForPaymentIntent(cart.PaymentIntentId);
            var order = await _unit.Repository<Core.Entities.OrderAggregate.Order>().GetEntityWithSpec(spec);

            if (order != null)
            {
                order.PaymentIntentId = cart.PaymentIntentId;
                _unit.Repository<Core.Entities.OrderAggregate.Order>().Update(order);
                await _unit.Complete();

                _logger.LogInformation("💾 Linked PaymentIntent {PaymentIntentId} to Order {OrderId}",
                    cart.PaymentIntentId, order.Id);
            }
        }

        return Ok(cart);
    }

    // ✅ Delivery methods
    [HttpGet("delivery-methods")]
    public async Task<ActionResult<IReadOnlyList<DeliveryMethod>>> GetDeliveryMethods()
    {
        var methods = await _unit.Repository<DeliveryMethod>().ListAllAsync();
        return Ok(methods);
    }

    // ✅ Stripe webhook handler
    [AllowAnonymous]
    [HttpPost("webhook")]
    public async Task<IActionResult> StripeWebhook()
    {
        using var reader = new StreamReader(Request.Body);
        var json = await reader.ReadToEndAsync();

        var signature = Request.Headers["Stripe-Signature"].ToString();
        if (string.IsNullOrEmpty(signature)) return Ok();

        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                json, signature, _whSecret, throwOnApiVersionMismatch: false);

            await ProcessStripeEvent(stripeEvent);
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "❌ Stripe webhook signature verification failed");
        }

        return Ok();
    }

    // ✅ Dispatch Stripe events
    private async Task ProcessStripeEvent(Event stripeEvent)
    {
        switch (stripeEvent.Type)
        {
            case "payment_intent.succeeded":
                if (stripeEvent.Data.Object is PaymentIntent succeededIntent)
                    await HandlePaymentIntentSucceeded(succeededIntent);
                break;

            case "payment_intent.payment_failed":
                if (stripeEvent.Data.Object is PaymentIntent failedIntent)
                    await HandlePaymentIntentFailed(failedIntent);
                break;

            default:
                _logger.LogInformation("ℹ️ Unhandled Stripe event: {Type}", stripeEvent.Type);
                break;
        }
    }

    // ✅ Handle payment success
    private async Task HandlePaymentIntentSucceeded(PaymentIntent intent)
    {
        var orderRepo = _unit.Repository<Core.Entities.OrderAggregate.Order>();
        var order = await orderRepo.GetEntityWithSpec(OrderSpecification.ForPaymentIntent(intent.Id));

        if (order == null)
        {
            _logger.LogWarning("⚠️ No order found for PaymentIntent {Id}", intent.Id);
            return;
        }

        var expectedCents = (long)(order.GetTotal() * 100);
        if (expectedCents != intent.Amount)
        {
            order.Status = OrderStatus.PaymentMismatch;
            _logger.LogWarning("⚠️ Payment mismatch for Order {OrderId}: Expected {Expected}, Got {Received}",
                order.Id, expectedCents, intent.Amount);
        }
        else
        {
            order.Status = OrderStatus.PaymentReceived;
            _logger.LogInformation("✅ Payment confirmed for Order {OrderId} (Amount: {Amount})",
                order.Id, intent.Amount);
        }

        orderRepo.Update(order);
        await _unit.Complete();

        // 🔔 SignalR notification
        var connectionId = NotificationHub.GetConnectionIdByEmail(order.BuyerEmail);
        if (!string.IsNullOrEmpty(connectionId))
        {
            _logger.LogInformation("📡 Sending OrderCompleteNotification to {Email}, ConnectionId={ConnectionId}",
                order.BuyerEmail, connectionId);

            try
            {
                await _hubContext.Clients.Client(connectionId)
                    .SendAsync("OrderCompleteNotification", order.ToDto());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ Failed to send notification for Order {OrderId}", order.Id);
            }
        }
        else
        {
            _logger.LogWarning("⚠️ No active SignalR connection for {Email}, notification skipped", order.BuyerEmail);
        }
    }

    // ✅ Handle payment failure
    private async Task HandlePaymentIntentFailed(PaymentIntent intent)
    {
        var orderRepo = _unit.Repository<Core.Entities.OrderAggregate.Order>();
        var order = await orderRepo.GetEntityWithSpec(OrderSpecification.ForPaymentIntent(intent.Id));

        if (order == null)
        {
            _logger.LogWarning("⚠️ No order found for failed PaymentIntent {Id}", intent.Id);
            return;
        }

        order.Status = OrderStatus.PaymentFailed;
        orderRepo.Update(order);
        await _unit.Complete();

        _logger.LogWarning("❌ Payment failed for Order {OrderId}", order.Id);
    }
}
