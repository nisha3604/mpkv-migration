using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Mpkv.Api.Data;
using Mpkv.Api.Middleware;
using Mpkv.Api.Services;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// ── Controllers — camelCase JSON responses ────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
        opts.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase);

// ── Swagger ───────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "MPKV Diploma Unified API", Version = "v1", Description = "Single API for Candidate, College, and Admin — Mpkv_diplomaNew" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter: Bearer {token}", Name = "Authorization",
        In = ParameterLocation.Header, Type = SecuritySchemeType.ApiKey, Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
        Array.Empty<string>()
    }});
});

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtKey    = builder.Configuration["Jwt:Key"]!;
var jwtIssuer = builder.Configuration["Jwt:Issuer"]!;
var jwtAud    = builder.Configuration["Jwt:Audience"]!;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true, ValidateAudience = true,
            ValidateLifetime = true, ValidateIssuerSigningKey = true,
            ValidIssuer = jwtIssuer, ValidAudience = jwtAud,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
        };
    });

builder.Services.AddAuthorization();

// ── CORS — allow React dev server ─────────────────────────────────────────────
var allowedOrigins = builder.Configuration["AllowedOrigins"] ?? "http://localhost:5174";
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactApp", policy =>
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials());
});

// ── Dependency Injection ──────────────────────────────────────────────────────
builder.Services.AddSingleton<DbAccess>();
builder.Services.AddSingleton<DbConnectionFactory>();

// Shared / Auth
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMessagingService, MessagingService>();

// Candidate services
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IHomeService, HomeService>();
builder.Services.AddScoped<IRegistrationService, RegistrationService>();
builder.Services.AddScoped<IAccountRecoveryService, AccountRecoveryService>();
builder.Services.AddScoped<IApplicationFormService, ApplicationFormService>();
builder.Services.AddScoped<IFeeService, FeeService>();
builder.Services.AddScoped<ICandidateService, CandidateService>();

// College services
builder.Services.AddScoped<ICollegeService, CollegeService>();
builder.Services.AddScoped<ICollegeDashboardService, CollegeDashboardService>();
builder.Services.AddScoped<IAllotmentService, AllotmentService>();
builder.Services.AddScoped<ICheckApplicationIDService, CheckApplicationIDService>();
builder.Services.AddScoped<ICounsellingService, CounsellingService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IUserProfileService, UserProfileService>();

builder.Services.AddHttpClient();  // for NSDL polling

var app = builder.Build();

// ── Middleware Pipeline ───────────────────────────────────────────────────────
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "MPKV Diploma Unified API v1"));
}

app.UseMiddleware<ExceptionMiddleware>();
app.UseCors("ReactApp");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
