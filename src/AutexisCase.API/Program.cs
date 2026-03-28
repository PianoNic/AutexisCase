using AutexisCase.API.Middleware;
using AutexisCase.Application.Interfaces;
using System.Text.Json.Serialization;

using AutexisCase.Infrastructure;
using Microsoft.EntityFrameworkCore;

using AutexisCase.Infrastructure.Services;

using FluentValidation;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.OpenApi;


var builder = WebApplication.CreateBuilder(args);


// Database
builder.Services.AddDbContext<AutexisCaseDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AutexisCaseDbContext>());



// Services
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUserSyncService, UserSyncService>();
builder.Services.AddSingleton<IOcrService, OcrService>();
builder.Services.AddHttpClient<OpenFoodFactsService>();
builder.Services.AddScoped<IOpenFoodFactsService>(sp => sp.GetRequiredService<OpenFoodFactsService>());
builder.Services.AddHttpClient<RoutingService>();
builder.Services.AddScoped<IRoutingService>(sp => sp.GetRequiredService<RoutingService>());
builder.Services.AddScoped<IEpcisService, EpcisService>();
builder.Services.AddSingleton<IChatService, ChatService>();


// Mediator, Validation & Authorization
builder.Services.AddMediator(options => { options.ServiceLifetime = ServiceLifetime.Scoped; });
builder.Services.AddValidatorsFromAssemblyContaining<IAppDbContext>();
builder.Services.AddScoped(typeof(Mediator.IPipelineBehavior<,>), typeof(AutexisCase.Application.Behaviors.ValidationBehavior<,>));
builder.Services.AddScoped(typeof(Mediator.IPipelineBehavior<,>), typeof(AutexisCase.Application.Behaviors.AuthorizationBehavior<,>));


// Authentication (JWT/OIDC)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Oidc:Authority"];
        options.RequireHttpsMetadata = builder.Configuration.GetValue("Oidc:RequireHttpsMetadata", true);
        options.TokenValidationParameters.NameClaimType = "name";
        options.TokenValidationParameters.RoleClaimType = "role";
        options.TokenValidationParameters.ValidateAudience = false;
    });
builder.Services.AddAuthorization(options => options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());


// API
builder.Services.AddControllers().AddJsonOptions(options => options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddHttpClient();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme { Type = SecuritySchemeType.Http, Scheme = "bearer", BearerFormat = "JWT", In = ParameterLocation.Header, Description = "Enter your JWT token" });
    options.AddSecurityRequirement(doc => new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference("Bearer", doc)] = new List<string>() });
});

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
}

var app = builder.Build();


// Database migration
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AutexisCaseDbContext>();
    dbContext.Database.Migrate();
    await SeedData.SeedAsync(dbContext);

    // Seed EPCIS events from journey data
    if (app.Environment.IsDevelopment())
    {
        var epcis = scope.ServiceProvider.GetRequiredService<IEpcisService>();
        await EpcisSeedData.SeedAsync(dbContext, epcis, app.Logger);
    }
}


// Middleware pipeline
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "AutexisCase API V1"));
}

app.UseRouting();
if (app.Environment.IsDevelopment())
    app.UseCors();

app.UseAuthentication();

app.UseAuthorization();
app.MapControllers();

app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();
