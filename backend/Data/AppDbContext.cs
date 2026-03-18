using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        modelBuilder.Entity<Cart>()
            .HasOne(c => c.User)
            .WithOne(u => u.Cart)
            .HasForeignKey<Cart>(c => c.UserId);

        modelBuilder.Entity<Product>().HasData(
            new Product
            {
                Id = 1,
                Name = "Laptop Pro 15",
                Description = "High-performance laptop with 16GB RAM and 512GB SSD.",
                Price = 12500000,
                StockQuantity = 10,
                ImageUrl = "https://placehold.co/400x300?text=Laptop+Pro+15"
            },
            new Product
            {
                Id = 2,
                Name = "Wireless Headphones",
                Description = "Noise-cancelling over-ear headphones with 30hr battery.",
                Price = 850000,
                StockQuantity = 25,
                ImageUrl = "https://placehold.co/400x300?text=Headphones"
            },
            new Product
            {
                Id = 3,
                Name = "Mechanical Keyboard",
                Description = "TKL layout with Cherry MX Blue switches, RGB backlit.",
                Price = 650000,
                StockQuantity = 15,
                ImageUrl = "https://placehold.co/400x300?text=Keyboard"
            },
            new Product
            {
                Id = 4,
                Name = "4K Monitor 27\"",
                Description = "IPS panel, 144Hz refresh rate, HDR400.",
                Price = 4200000,
                StockQuantity = 8,
                ImageUrl = "https://placehold.co/400x300?text=Monitor"
            },
            new Product
            {
                Id = 5,
                Name = "USB-C Hub 7-in-1",
                Description = "HDMI, USB 3.0 x3, SD Card, PD 100W charging.",
                Price = 320000,
                StockQuantity = 30,
                ImageUrl = "https://placehold.co/400x300?text=USB-C+Hub"
            },
            new Product
            {
                Id = 6,
                Name = "Gaming Mouse",
                Description = "16000 DPI optical sensor, 6 programmable buttons.",
                Price = 450000,
                StockQuantity = 20,
                ImageUrl = "https://placehold.co/400x300?text=Gaming+Mouse"
            }
        );
    }
}
