using System;
using System.Linq;
using System.Threading.Tasks;
using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Services;

public class PaymentService(
    IConfiguration config,
    IUnitOfWork unit,
    ICartService cartService
) : IPaymentService
{
    public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string cartId)
    {
        if (string.IsNullOrEmpty(cartId))
            throw new ArgumentException("CartId cannot be null or empty", nameof(cartId));

        // Set Stripe API key
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"]
            ?? throw new InvalidOperationException("Stripe secret key is missing");

        var cart = await cartService.GetCartAsync(cartId);
        if (cart == null) return null;

        decimal shippingPrice = 0m;

        if (cart.DeliveryMethodId.HasValue)
        {
            var deliveryMethod = await unit.Repository<DeliveryMethod>().GetByIdAsync(cart.DeliveryMethodId.Value);
            if (deliveryMethod == null) return null;
            shippingPrice = deliveryMethod.Price;
        }

        // Ensure item prices are up-to-date
        foreach (var item in cart.Items)
        {
            var productItem = await unit.Repository<Core.Entities.Product>().GetByIdAsync(item.ProductId);
            if (productItem == null) return null;

            if (item.Price != productItem.Price)
                item.Price = productItem.Price;
        }

        var totalAmount = cart.Items.Sum(x => x.Quantity * x.Price) + shippingPrice;

        // Stripe requires a minimum amount (50 centavos PHP)
        if (totalAmount < 0.5m)
            totalAmount = 0.5m;

        var amountInCentavos = (long)(totalAmount * 100);

        var service = new PaymentIntentService();
        PaymentIntent intent;

        if (string.IsNullOrEmpty(cart.PaymentIntentId))
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = amountInCentavos,
                Currency = "php",
                PaymentMethodTypes = new List<string> { "card" }
            };

            intent = await service.CreateAsync(options);

            // Save PaymentIntent info to cart
            cart.PaymentIntentId = intent.Id;
            cart.ClientSecret = intent.ClientSecret;
        }
        else
        {
            var options = new PaymentIntentUpdateOptions
            {
                Amount = amountInCentavos
            };

            intent = await service.UpdateAsync(cart.PaymentIntentId, options);
        }

        await cartService.SetCartAsync(cart);

        return cart;
    }
}
