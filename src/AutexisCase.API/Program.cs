using AutexisCase.API.Middleware;
using AutexisCase.Application.Interfaces;
using System.Text.Json.Serialization;

using AutexisCase.Infrastructure;
using Microsoft.EntityFrameworkCore;


using AutexisCase.Infrastructure.Services;


using Microsoft.AspNetCore.Authentication.JwtBearer;


var builder = WebApplication.CreateBuilder(args);


// Database
builder.Services.AddDbContext<AutexisCaseDbContext>(options => options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AutexisCaseDbContext>());



// Services
builder.Services.AddHttpContextAccessor();

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IUserSyncService, UserSyncService>();


// Mediator & Validation
builder.Services.AddMediator(options => { options.ServiceLifetime = ServiceLifetime.Scoped; });
builder.Services.AddScoped(typeof(Mediator.IPipelineBehavior<,>), typeof(AutexisCase.Application.Behaviors.ValidationBehavior<,>));


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
builder.Services.AddSwaggerGen();

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
}

var app = builder.Build();


// Database migration
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AutexisCaseDbContext>();
    dbContext.Database.Migrate();
}


// Middleware pipeline
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
