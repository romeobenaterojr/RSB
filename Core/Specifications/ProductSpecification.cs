using System;
using Core.Entities;

namespace Core.Specifications;

public class ProductSpecification : BaseSpecification<Product>

{
    public ProductSpecification(string? brand, string? type, string? sort) :base(x =>
    (string.IsNullOrWhiteSpace(brand) || x.Brand == brand) &&
    (string.IsNullOrWhiteSpace(type) || x.Type == type)
    )
    {
        switch (sort)
        {
            case "priceAsc":
                AddOrderby(x => x.Price);
                break;
            case "priceDesc":
                AddOrderbyDescending(x => x.Price);
                break;
            default:
                AddOrderby(x => x.Name);
                break;
        }
    }
}
