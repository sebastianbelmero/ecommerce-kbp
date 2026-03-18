using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db)
    {
        _db = db;
    }

    // ─── Dashboard ────────────────────────────────────────────────────────────

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var totalUsers    = await _db.Users.CountAsync(u => u.Role == "User");
        var totalProducts = await _db.Products.CountAsync();
        var totalOrders   = await _db.Orders.CountAsync();
        var totalRevenue  = await _db.Orders
            .Where(o => o.Status != "Cancelled")
            .SumAsync(o => (decimal?)o.TotalAmount) ?? 0;

        var recentOrders = await _db.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new RecentOrderItem(
                o.Id,
                o.User.Username,
                o.TotalAmount,
                o.PaymentMethod,
                o.Status,
                o.CreatedAt
            ))
            .ToListAsync();

        return Ok(new DashboardStats(
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            recentOrders
        ));
    }

    // ─── Products ─────────────────────────────────────────────────────────────

    [HttpGet("products")]
    public async Task<IActionResult> GetAllProducts()
    {
        var products = await _db.Products
            .OrderBy(p => p.Id)
            .Select(p => new ProductResponse(
                p.Id,
                p.Name,
                p.Description,
                p.Price,
                p.StockQuantity,
                p.ImageUrl
            ))
            .ToListAsync();

        return Ok(products);
    }

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Product name is required." });

        if (req.Price <= 0)
            return BadRequest(new { message = "Price must be greater than 0." });

        if (req.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        var product = new Product
        {
            Name          = req.Name.Trim(),
            Description   = req.Description?.Trim() ?? string.Empty,
            Price         = req.Price,
            StockQuantity = req.StockQuantity,
            ImageUrl      = req.ImageUrl?.Trim() ?? string.Empty
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProductById), new { id = product.Id },
            new ProductResponse(product.Id, product.Name, product.Description,
                product.Price, product.StockQuantity, product.ImageUrl));
    }

    [HttpGet("products/{id:int}")]
    public async Task<IActionResult> GetProductById(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        return Ok(new ProductResponse(product.Id, product.Name, product.Description,
            product.Price, product.StockQuantity, product.ImageUrl));
    }

    [HttpPut("products/{id:int}")]
    public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductRequest req)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Product name is required." });

        if (req.Price <= 0)
            return BadRequest(new { message = "Price must be greater than 0." });

        if (req.StockQuantity < 0)
            return BadRequest(new { message = "Stock quantity cannot be negative." });

        product.Name          = req.Name.Trim();
        product.Description   = req.Description?.Trim() ?? string.Empty;
        product.Price         = req.Price;
        product.StockQuantity = req.StockQuantity;
        product.ImageUrl      = req.ImageUrl?.Trim() ?? string.Empty;

        await _db.SaveChangesAsync();

        return Ok(new ProductResponse(product.Id, product.Name, product.Description,
            product.Price, product.StockQuantity, product.ImageUrl));
    }

    [HttpDelete("products/{id:int}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        // Check if product is in any active cart
        var inCart = await _db.CartItems.AnyAsync(ci => ci.ProductId == id);
        if (inCart)
            return BadRequest(new { message = "Cannot delete product that is currently in a user's cart." });

        _db.Products.Remove(product);
        await _db.SaveChangesAsync();

        return Ok(new { message = $"Product '{product.Name}' deleted successfully." });
    }

    // ─── Orders ───────────────────────────────────────────────────────────────

    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders(
        [FromQuery] string? status = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1)    page     = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var query = _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(o => o.Status.ToLower() == status.ToLower());

        var total = await query.CountAsync();

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new AdminOrderResponse(
                o.Id,
                o.UserId,
                o.User.Username,
                o.User.Email,
                o.TotalAmount,
                o.PaymentMethod,
                o.Status,
                o.CreatedAt,
                o.Items.Select(i => new OrderItemResponse(
                    i.ProductId,
                    i.Product.Name,
                    i.Quantity,
                    i.UnitPrice,
                    i.UnitPrice * i.Quantity
                )).ToList()
            ))
            .ToListAsync();

        return Ok(new
        {
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling((double)total / pageSize),
            data = orders
        });
    }

    [HttpGet("orders/{id:int}")]
    public async Task<IActionResult> GetOrderById(int id)
    {
        var order = await _db.Orders
            .Include(o => o.User)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Where(o => o.Id == id)
            .Select(o => new AdminOrderResponse(
                o.Id,
                o.UserId,
                o.User.Username,
                o.User.Email,
                o.TotalAmount,
                o.PaymentMethod,
                o.Status,
                o.CreatedAt,
                o.Items.Select(i => new OrderItemResponse(
                    i.ProductId,
                    i.Product.Name,
                    i.Quantity,
                    i.UnitPrice,
                    i.UnitPrice * i.Quantity
                )).ToList()
            ))
            .FirstOrDefaultAsync();

        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(order);
    }

    [HttpPut("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest req)
    {
        var validStatuses = new[] { "Pending", "Paid", "Shipped", "Delivered", "Cancelled" };

        if (!validStatuses.Contains(req.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new
            {
                message = $"Invalid status. Must be one of: {string.Join(", ", validStatuses)}"
            });

        var order = await _db.Orders.FindAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        var previousStatus = order.Status;
        order.Status = req.Status;
        await _db.SaveChangesAsync();

        return Ok(new
        {
            message  = $"Order #{id} status updated from '{previousStatus}' to '{req.Status}'.",
            orderId  = order.Id,
            status   = order.Status
        });
    }

    // ─── Users ────────────────────────────────────────────────────────────────

    [HttpGet("users")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _db.Users
            .OrderBy(u => u.Id)
            .Select(u => new AdminUserResponse(
                u.Id,
                u.Username,
                u.Email,
                u.Role,
                u.CreatedAt,
                _db.Orders.Count(o => o.UserId == u.Id),
                _db.Orders
                    .Where(o => o.UserId == u.Id && o.Status != "Cancelled")
                    .Sum(o => (decimal?)o.TotalAmount) ?? 0
            ))
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleRequest req)
    {
        var validRoles = new[] { "User", "Admin" };

        if (!validRoles.Contains(req.Role, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Role must be 'User' or 'Admin'." });

        var currentAdminId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        if (id == currentAdminId)
            return BadRequest(new { message = "You cannot change your own role." });

        var user = await _db.Users.FindAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found." });

        user.Role = req.Role;
        await _db.SaveChangesAsync();

        return Ok(new { message = $"User '{user.Username}' role updated to '{req.Role}'." });
    }
}
