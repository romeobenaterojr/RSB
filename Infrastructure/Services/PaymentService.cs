using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Services;

public class PaymentService(
    IConfiguration config,
    IGenericRepository<Core.Entities.Product> productRepo, 
    ICartService cartService,
    IGenericRepository<DeliveryMethod> dmRepo
) : IPaymentService
{
    public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string cartId)
    {
        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];

        var cart = await cartService.GetCartAsync(cartId);
        if (cart == null) return null;

        decimal shippingPrice = 0m;

        if (cart.DeliveryMethodId.HasValue)
        {
            var deliveryMethod = await dmRepo.GetByIdAsync(cart.DeliveryMethodId.Value);
            if (deliveryMethod == null) return null;
            shippingPrice = deliveryMethod.Price;
        }

        // Ensure item prices are up-to-date
        foreach (var item in cart.Items)
        {
            var productItem = await productRepo.GetByIdAsync(item.ProductId);
            if (productItem == null) return null;

            if (item.Price != productItem.Price)
                item.Price = productItem.Price;
        }

        var totalAmount = cart.Items.Sum(x => x.Quantity * x.Price) + shippingPrice;

        // Stripe requires a minimum of 50 centavos in PHP
        if (totalAmount < 0.5m)
            totalAmount = 0.5m;

        var amountInCentavos = (long)(totalAmount * 100);

        var service = new PaymentIntentService();
        PaymentIntent? intent = null;

        if (string.IsNullOrEmpty(cart.PaymentIndentId))
        {
            var options = new PaymentIntentCreateOptions
            {
                Amount = amountInCentavos,
                Currency = "php",
                PaymentMethodTypes = ["card"]
            };

            intent = await service.CreateAsync(options);
            cart.PaymentIndentId = intent.Id;
            cart.ClientSecret = intent.ClientSecret;
        }
        else
        {
            var options = new PaymentIntentUpdateOptions
            {
                Amount = amountInCentavos
            };

            intent = await service.UpdateAsync(cart.PaymentIndentId, options);
        }

        await cartService.SetCartAsync(cart);
        return cart;
    }
}
