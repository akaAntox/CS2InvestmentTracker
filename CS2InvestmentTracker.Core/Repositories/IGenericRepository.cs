using System.Linq.Expressions;

namespace CS2InvestmentTracker.Core.Repositories;

public interface IGenericRepository<T> where T : class
{
    Task<List<T>> GetAllAsync();
    Task DeleteAsync(Expression<Func<T, bool>> predicate);
    Task<T> AddAsync(T entity);
    Task UpdateAsync(T entity);
    Task<int> SaveAsync();
    Task<T> SelectAsync(Expression<Func<T, bool>> predicate);
}