using CS2InvestmentTracker.Core.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Reflection;

namespace CS2InvestmentTracker.Core.Data;

public class ApplicationDbContext : IdentityDbContext
{
    private readonly IConfiguration _configuration;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, IConfiguration configuration)
        : base(options)
    {
        _configuration = configuration;
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
        base.OnModelCreating(builder);
    }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)
        {
            optionsBuilder.UseSqlite(_configuration.GetConnectionString("DefaultConnection"));
        }
        base.OnConfiguring(optionsBuilder);
    }

    public DbSet<Category> Categories { get; set; }
    public DbSet<EventLog> EventLogs { get; set; }
    public DbSet<Item> Items { get; set; }
}
