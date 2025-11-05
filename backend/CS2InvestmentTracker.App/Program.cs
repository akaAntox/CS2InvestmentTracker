using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Repositories;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// ---- Database Configuration ----
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connectionString));

// ---- Dependency Injection for Repositories ----
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ItemRepository>();
builder.Services.AddScoped<CategoryRepository>();
builder.Services.AddScoped<EventLogRepository>();

// ---- HTTP + API services ----
builder.Services.AddSingleton<HttpClient>();
builder.Services.AddSingleton<SteamApi>();
builder.Services.AddControllers();

// ---- CORS Configuration ----
const string FrontendCorsPolicy = "FrontendCorsPolicy";
builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader()));

var app = builder.Build();

// ---- Middleware Pipeline Configuration ----
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseCors(FrontendCorsPolicy);
//app.UseHttpsRedirection();
app.UseRouting();

app.MapControllers();

await app.RunAsync();
