
using System.Text;
using backend.Data;
using backend.Models;
using backend.Services;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

// Load .env file from project root
Env.Load();

var builder = WebApplication.CreateBuilder(args);

// Inject environment variables into IConfiguration
builder.Configuration.AddEnvironmentVariables();

// ─── CORS ────────────────────────────────────────────────────────────────────
var corsOrigin = Environment.GetEnvironmentVariable("CORS_ORIGIN") ?? "http://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(corsOrigin)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Required so browser sends HttpOnly cookies
    });
});

// ─── Database (MariaDB via Pomelo) ───────────────────────────────────────────
var connString = Environment.GetEnvironmentVariable("DB_CONNECTION")
    ?? throw new InvalidOperationException("DB_CONNECTION environment variable is not set.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connString, ServerVersion.AutoDetect(connString)));

// ─── JWT Authentication (token read from HttpOnly Cookie) ────────────────────
var jwtSecret   = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new InvalidOperationException("JWT_SECRET environment variable is not set.");
var jwtIssuer   = Environment.GetEnvironmentVariable("JWT_ISSUER")   ?? "ecommerce-api";
var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ecommerce-frontend";

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer              = jwtIssuer,
            ValidAudience            = jwtAudience,
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ClockSkew                = TimeSpan.Zero
        };

        // Read the JWT from the "jwt" HttpOnly cookie instead of Authorization header
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                if (ctx.Request.Cookies.TryGetValue("jwt", out var token))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// ─── Application Services ────────────────────────────────────────────────────
builder.Services.AddScoped<JwtService>();
builder.Services.AddControllers();

var app = builder.Build();

// ─── Auto-migrate + Seed on startup ──────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Apply any pending migrations
    db.Database.Migrate();

    // Seed default users if they don't exist yet
    await SeedDefaultUsersAsync(db);
}

// ─── Middleware Pipeline ──────────────────────────────────────────────────────
app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// ─── Seeder ───────────────────────────────────────────────────────────────────
static async Task SeedDefaultUsersAsync(AppDbContext db)
{
    // Seed Admin account
    if (!db.Users.Any(u => u.Email == "admin@kbp.com"))
    {
        db.Users.Add(new User
        {
            Username     = "admin",
            Email        = "admin@kbp.com",
            PasswordHash = HashPassword("admin123"),
            Role         = "Admin",
            CreatedAt    = DateTime.UtcNow
        });
        Console.WriteLine("[Seed] Admin account created → admin@kbp.com / admin123");
    }

    // Seed regular User account
    if (!db.Users.Any(u => u.Email == "user@kbp.com"))
    {
        db.Users.Add(new User
        {
            Username     = "user",
            Email        = "user@kbp.com",
            PasswordHash = HashPassword("password123"),
            Role         = "User",
            CreatedAt    = DateTime.UtcNow
        });
        Console.WriteLine("[Seed] User account created → user@kbp.com / password123");
    }

    await db.SaveChangesAsync();
}

static string HashPassword(string password)
{
    return BCrypt.Net.BCrypt.HashPassword(password);
}
