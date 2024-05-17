using CS2InvestmentTracker.Core.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace CS2InvestmentTracker.Core.Repositories;
public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly ApplicationDbContext DbContext;

    public GenericRepository(ApplicationDbContext context)
    {
        DbContext = context;
    }

    public async Task<List<T>> GetAllAsync()
    {
        return await DbContext.Set<T>().ToListAsync();
    }

    public async Task<T> GetByIdAsync(int id)
    {
        return await DbContext.Set<T>().FindAsync(id);
    }

    public async Task DeleteAsync(Expression<Func<T, bool>> predicate)
    {
        var entity = await DbContext.Set<T>().Where(predicate).FirstAsync();
        DbContext.Set<T>().Remove(entity);
        await DbContext.SaveChangesAsync();
    }

    public async Task<T> AddAsync(T entity)
    {
        await DbContext.Set<T>().AddAsync(entity);
        return entity;
    }

    public async Task UpdateAsync(T entity)
    {
        DbContext.Set<T>().Update(entity);
        await DbContext.SaveChangesAsync();
    }

    public async Task<int> SaveAsync()
    {
        return await DbContext.SaveChangesAsync();
    }

    public async Task<T> SelectAsync(Expression<Func<T, bool>> predicate)
    {
        return await DbContext.Set<T>().Where(predicate).FirstOrDefaultAsync();
    }
}

