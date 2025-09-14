using System;
using System.Linq.Expressions;
using System.Xml.XPath;
using Core.Interfaces;

namespace Core.Specifications;

public class BaseSpecification<T>(Expression<Func<T, bool>>? criteria) : ISpecification<T>
{
    protected BaseSpecification() : this(null) { }

    public Expression<Func<T, bool>>? Criteria => criteria;

    public Expression<Func<T, object>>? Orderby { get; private set; }

    public Expression<Func<T, object>>? OrderbyDescending { get; private set; }

    public bool IsDistinct { get; private set; }

    public int Take { get; private set; }

    public int Skip { get; private set; }

    public bool IsPagingEnabled { get; private set; }

    public List<Expression<Func<T, object>>> Includes { get; } = [];
    public List<string> IncludeStrings { get; } = [];

    public IQueryable<T> ApplyCriteria(IQueryable<T> query)
    {
        if (Criteria != null)
        {
            query = query.Where(Criteria);
        }
        return query;
    }

    protected void AddInclude(Expression<Func<T, object>> includeExpression)
    {
        Includes.Add(includeExpression);
    }
    protected void AddInclude(string includeStrings)
    {
        IncludeStrings.Add(includeStrings);
        
    }

    protected void AddOrderby(Expression<Func<T, object>> orderByExpression)
    {
        Orderby = orderByExpression;

    }
    protected void AddOrderbyDescending(Expression<Func<T, object>> orderByDescExpression)
    {
        OrderbyDescending = orderByDescExpression;

    }
    protected void ApplyDistinct()
    {
        IsDistinct = true;
    }
    protected void ApplyPaging(int skip, int take)
    {
        Skip = skip;
        Take = take;
        IsPagingEnabled = true;
    }
}
public class BaseSpecification<T, TResult>(Expression<Func<T, bool>> creteria)
    : BaseSpecification<T>(creteria), ISpecification<T, TResult>
{
    protected BaseSpecification() : this(null!) { }
    public Expression<Func<T, TResult>>? Select { get; private set; }
    protected void AddSelect(Expression<Func<T, TResult>> selectExpression)
    {
        Select = selectExpression;
        
    }
}
