using System;
using Core.Entities;
using Core.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query;

namespace Infrastructure.Data;

public class SpecificationEvaluator<T> where T : BaseEntity
{
    public static IQueryable<T> GetQuery(IQueryable<T> query, ISpecification<T> spec)
    {
        if (spec.Criteria != null)
        {
            query = query.Where(spec.Criteria);

        }
        if (spec.Orderby != null)
        {
            query = query.OrderBy(spec.Orderby);
        }

        if (spec.OrderbyDescending != null)
        {
            query = query.OrderByDescending(spec.OrderbyDescending);
        }

        if (spec.IsDistinct)
        {
            query = query.Distinct();
        }

        if (spec.IsPagingEnabled)
        {
            query = query.Skip(spec.Skip).Take(spec.Take);
        }

        query = spec.Includes.Aggregate(query, (current, include) => current.Include(include));
        query = spec.IncludeStrings.Aggregate(query, (current, include) => current.Include(include));
        return query;
    }
     public static IQueryable<TResult> GetQuery<TSpec, TResult>(IQueryable<T> query,
         ISpecification<T, TResult> spec)
    {
        if (spec.Criteria != null)
        {
            query = query.Where(spec.Criteria);

        }
        if (spec.Orderby != null)
        {
            query = query.OrderBy(spec.Orderby);
        }

        if (spec.OrderbyDescending != null)
        {
            query = query.OrderByDescending(spec.OrderbyDescending);
        }

        var selectQuery = query as IQueryable<TResult>;

        if (spec.Select != null)
        {
            selectQuery = query.Select(spec.Select);

        }
         if (spec.IsDistinct)
        {
            selectQuery = selectQuery?.Distinct();
        }
        
        if (spec.IsPagingEnabled)
        {
            selectQuery = selectQuery?.Skip(spec.Skip).Take(spec.Take);
        }

        return selectQuery ?? query.Cast<TResult>();
    }


}
