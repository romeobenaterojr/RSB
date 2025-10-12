using System;
using System.Linq.Expressions;
using Core.Entities.OrderAggregate;

namespace Core.Specifications
{
    public class OrderSpecification : BaseSpecification<Order>
    {

        private OrderSpecification(Expression<Func<Order, bool>> criteria)
            : base(criteria)
        {
            AddInclude(x => x.OrderItems);
            AddInclude(x => x.DeliveryMethod);
        }

        public static OrderSpecification ForBuyer(string email)
        {
            var spec = new OrderSpecification(x => x.BuyerEmail == email);
            spec.AddOrderbyDescending(x => x.OrderDate);
            return spec;
        }


        public static OrderSpecification ForBuyerOrder(string email, int id)
        {
            return new OrderSpecification(x => x.BuyerEmail == email && x.Id == id);
        }


        public static OrderSpecification ForPaymentIntent(string paymentIntentId)
        {
            return new OrderSpecification(x => x.PaymentIntentId == paymentIntentId);
        }

        public OrderSpecification(OrderSpecParams specParams) : base(x =>
            string.IsNullOrEmpty(specParams.Status) || x.Status == ParseStatus(specParams.Status))
        {
            AddInclude(x => x.OrderItems);
            AddInclude(x => x.DeliveryMethod);
            ApplyPaging(specParams.PageSize * (specParams.PageIndex - 1), specParams.PageSize);
            AddOrderbyDescending(x => x.OrderDate);
        }
     
        public OrderSpecification(int id) : base(x => x.Id ==id)
        {
            AddInclude(x => x.OrderItems);
            AddInclude(x => x.DeliveryMethod);
        }


        private static OrderStatus? ParseStatus(string Status)
        {
            if (Enum.TryParse<OrderStatus>(Status, true, out var result)) return result;
            return null;
        }
    }
}


