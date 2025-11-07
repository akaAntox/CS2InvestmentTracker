using CS2InvestmentTracker.Core.Data;
using CS2InvestmentTracker.Core.Models;
using CS2InvestmentTracker.Core.Repositories;
using CS2InvestmentTracker.Core.Repositories.Custom;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

var builder = WebApplication.CreateBuilder(args);

// Add connection string and database context.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
builder.Services.AddDbContext<ApplicationDbContext>(options => options.UseSqlite(connectionString));

// Add repositories.
builder.Services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
builder.Services.AddScoped<ItemRepository>();
builder.Services.AddScoped<CategoryRepository>();
builder.Services.AddScoped<EventLogRepository>();

// Add identity, razor pages and controllers. 
builder.Services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "CS2 Investment API",
        Version = "v1",
        Description = "API documentation for CS2-Investment"
    });

    c.EnableAnnotations();

    // Aggiungi i commenti XML (opzionale ma consigliato)
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// Add singletons.
builder.Services.AddSingleton<HttpClient>();
builder.Services.AddSingleton<SteamApi>();

// Add CORS policy to allow all origins, methods, and headers.
const string FrontendCorsPolicy = "FrontendCorsPolicy";
builder.Services.AddCors(options => options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:3000")
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader()));

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseMigrationsEndPoint();
}
else
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseCors(FrontendCorsPolicy);
app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseSwagger();
app.UseSwaggerUI(s =>
{
    s.SwaggerEndpoint("/swagger/v1/swagger.json", "CS2 Investment API v1");
    s.RoutePrefix = "api/docs";
});

app.UseAuthorization();
app.MapControllers();

await app.RunAsync();