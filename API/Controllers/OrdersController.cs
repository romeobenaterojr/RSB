using System;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
using API.DTOs;
using API.Extensions;
using API.SignalR;
using Core.Entities;
using Core.Entities.OrderAggregate;
using Core.Interfaces;
using Core.Specifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace API.Controllers;

[Authorize]
public class OrdersController(
    ICartService cartService,
    IUnitOfWork unit,
    IHubContext<NotificationHub> hubContext   // 👈 inject SignalR hub
) : BaseApiController
{
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder(CreateOrderDto orderDto)
    {
        var email = User.GetEmail();

        // Get the cart
        var cart = await cartService.GetCartAsync(orderDto.CartId);
        if (cart == null) return BadRequest("Cart not found");
        if (string.IsNullOrEmpty(cart.PaymentIntentId)) return BadRequest("No payment intent for this order");

        // Prepare order items
        var items = new List<OrderItem>();
        foreach (var item in cart.Items)
        {
            var productItem = await unit.Repository<Product>().GetByIdAsync(item.ProductId);
            if (productItem == null) return BadRequest("Problem with the order item");

            var itemOrdered = new ProductItemOrdered
            {
                ProductId = item.ProductId,
                ProductName = item.ProductName,
                PictureUrl = item.PictureUrl
            };

            var orderItem = new OrderItem
            {
                ItemOrdered = itemOrdered,
                Price = productItem.Price,
                Quantity = item.Quantity
            };

            items.Add(orderItem);
        }

        // Get delivery method
        var deliveryMethod = await unit.Repository<DeliveryMethod>()
            .GetByIdAsync(orderDto.DeliveryMethodId);
        if (deliveryMethod == null) return BadRequest("Invalid delivery method");

        var subtotal = items.Sum(x => x.Price * x.Quantity);

        // Default order status is Pending
        var status = OrderStatus.Pending;

        // Optionally check Stripe PaymentIntent status
        try
        {
            var service = new Stripe.PaymentIntentService();
            var intent = await service.GetAsync(cart.PaymentIntentId);
            status = intent.Status switch
            {
                "succeeded" => OrderStatus.PaymentReceived,
                "requires_payment_method" or "requires_action" => OrderStatus.Pending,
                "canceled" => OrderStatus.PaymentFailed,
                _ => OrderStatus.Pending
            };
        }
        catch
        {
            // If Stripe fails, keep status as Pending
            status = OrderStatus.Pending;
        }

        // Create the order
        var order = new Order
        {
            OrderItems = items,
            DeliveryMethod = deliveryMethod,
            ShippingAddress = orderDto.ShippingAddress,
            Subtotal = subtotal,
            PaymentSummary = orderDto.PaymentSummary,
            PaymentIntentId = cart.PaymentIntentId,
            BuyerEmail = email,
            Status = status
        };

        unit.Repository<Order>().Add(order);

        if (await unit.Complete())
        {
            // ✅ Push order notification to the connected client
            var connectionId = NotificationHub.GetConnectionIdByEmail(email);
            if (!string.IsNullOrEmpty(connectionId))
            {
                await hubContext.Clients.Client(connectionId)
                    .SendAsync("OrderCompleteNotification", order.ToDto());
            }

            return Ok(order);
        }

        return BadRequest("Problem creating order");
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderDto>>> GetOrdersForUser()
    {
        var spec = OrderSpecification.ForBuyer(User.GetEmail());
        var orders = await unit.Repository<Order>().ListAsync(spec);
        var ordersToReturn = orders.Select(o => o.ToDto()).ToList();
        return Ok(ordersToReturn);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<OrderDto>> GetOrderById(int id)
    {
        var spec = OrderSpecification.ForBuyerOrder(User.GetEmail(), id);
        var order = await unit.Repository<Order>().GetEntityWithSpec(spec);
        if (order == null) return NotFound();
        return order.ToDto();
    }
}
