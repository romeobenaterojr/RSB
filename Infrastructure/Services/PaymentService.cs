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

    public async Task<string> RefundPayment(string paymentIntendId)
    {
         StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"]
        ?? throw new InvalidOperationException("Stripe secret key is missing");
        var refundOptions = new RefundCreateOptions
        {
            PaymentIntent = paymentIntendId
        };

        var refundService = new RefundService();
        var result = await refundService.CreateAsync(refundOptions);

        return result.Status;
        
    }
    public async Task<ShoppingCart?> CreateOrUpdatePaymentIntent(string cartId)
    {
        if (string.IsNullOrEmpty(cartId))
            throw new ArgumentException("CartId cannot be null or empty", nameof(cartId));


        StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"]
            ?? throw new InvalidOperationException("Stripe secret key is missing");

        var cart = await cartService.GetCartAsync(cartId)
            ?? throw new Exception("Cart not found");


        var shippingPrice = await GetShippingPriceAsync(cart);


        await ValidateCartItemsAsync(cart);


        var subtotal = cart.Items.Sum(x => x.Quantity * x.Price);


        if (cart.Coupon != null)
        {
            subtotal = await ApplyDiscountAsync(cart.Coupon, subtotal);
        }


        var totalAmount = subtotal + shippingPrice;
        if (totalAmount < 0.5m) totalAmount = 0.5m;

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

  

    private async Task<decimal> GetShippingPriceAsync(ShoppingCart cart)
    {
        if (!cart.DeliveryMethodId.HasValue) return 0m;

        var deliveryMethod = await unit.Repository<DeliveryMethod>()
            .GetByIdAsync(cart.DeliveryMethodId.Value)
            ?? throw new Exception("Delivery method not found");

        return deliveryMethod.Price;
    }

    private async Task ValidateCartItemsAsync(ShoppingCart cart)
    {
        foreach (var item in cart.Items)
        {
            var productItem = await unit.Repository<Core.Entities.Product>()
                .GetByIdAsync(item.ProductId)
                ?? throw new Exception($"Product with ID {item.ProductId} not found");

            if (item.Price != productItem.Price)
                item.Price = productItem.Price;
        }
    }

    private async Task<decimal> ApplyDiscountAsync(AppCoupon appCoupon, decimal amount)
    {
        var couponService = new Stripe.CouponService();
        var coupon = await couponService.GetAsync(appCoupon.CouponId)
            ?? throw new Exception("Coupon not found in Stripe");

        if (coupon.AmountOff.HasValue)
        {
            amount -= (decimal)(coupon.AmountOff.Value / 100m); 
        }

        if (coupon.PercentOff.HasValue)
        {
            var discount = amount * ((decimal)coupon.PercentOff.Value / 100m);
            amount -= discount;
        }

        if (amount < 0) amount = 0;
        return amount;
    }

}
