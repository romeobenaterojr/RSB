using System;
using System.Linq.Expressions;
using Core.Entities.OrderAggregate;

namespace Core.Specifications
{
    public class OrderSpecification : BaseSpecification<Order>
    {
        // Single private ctor that sets common includes
        private OrderSpecification(Expression<Func<Order, bool>> criteria)
            : base(criteria)
        {
            AddInclude(x => x.OrderItems);
            AddInclude(x => x.DeliveryMethod);
        }

        // Find all orders for a buyer (with ordering)
        public static OrderSpecification ForBuyer(string email)
        {
            var spec = new OrderSpecification(x => x.BuyerEmail == email);
            spec.AddOrderbyDescending(x => x.OrderDate);
            return spec;
        }

        // Find a specific order for a buyer by id
        public static OrderSpecification ForBuyerOrder(string email, int id)
        {
            return new OrderSpecification(x => x.BuyerEmail == email && x.Id == id);
        }

        // Find order by PaymentIntentId
        public static OrderSpecification ForPaymentIntent(string paymentIntentId)
        {
            return new OrderSpecification(x => x.PaymentIntentId == paymentIntentId);
        }
    }
}


