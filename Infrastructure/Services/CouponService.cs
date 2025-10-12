using Core.Entities;
using Core.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;

namespace Infrastructure.Services
{
    public class CouponService : ICouponService
    {
        public CouponService(IConfiguration config)
        {
            StripeConfiguration.ApiKey = config["StripeSettings:SecretKey"];
        }

        public async Task<AppCoupon?> GetCouponFromPromoCode(string code)
        {
            var promoService = new PromotionCodeService();
            var options = new PromotionCodeListOptions { Code = code };
            var promotionCodes = await promoService.ListAsync(options);
            var promoCode = promotionCodes.FirstOrDefault();

            if (promoCode?.Coupon == null) return null;

            return new AppCoupon
            {
                Name = promoCode.Coupon.Name,
                AmountOff = promoCode.Coupon.AmountOff,
                PercentOff = promoCode.Coupon.PercentOff,
                CouponId = promoCode.Coupon.Id,
                PromotionCode = promoCode.Code
            };
        }
    }
}
