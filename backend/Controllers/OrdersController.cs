using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;

    public OrdersController(AppDbContext db)
    {
        _db = db;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.PaymentMethod))
            return BadRequest(new { message = "Payment method is required." });

        var userId = GetUserId();

        var cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null || !cart.Items.Any())
            return BadRequest(new { message = "Your cart is empty." });

        // Validate all items still have sufficient stock
        var insufficientItems = cart.Items
            .Where(i => i.Product.StockQuantity < i.Quantity)
            .Select(i => i.Product.Name)
            .ToList();

        if (insufficientItems.Any())
            return BadRequest(new { message = $"Insufficient stock for: {string.Join(", ", insufficientItems)}" });

        using var transaction = await _db.Database.BeginTransactionAsync();
        try
        {
            var totalAmount = cart.Items.Sum(i => i.Product.Price * i.Quantity);

            var order = new Order
            {
                UserId = userId,
                PaymentMethod = req.PaymentMethod,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                TotalAmount = totalAmount
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            // Copy cart items to order items using LINQ projection
            var orderItems = cart.Items
                .Select(i => new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = i.ProductId,
                    Quantity = i.Quantity,
                    UnitPrice = i.Product.Price
                })
                .ToList();

            _db.OrderItems.AddRange(orderItems);

            // Reduce stock for each product using LINQ
            foreach (var item in cart.Items)
            {
                item.Product.StockQuantity -= item.Quantity;
            }

            // Clear the cart
            _db.CartItems.RemoveRange(cart.Items);

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Order placed successfully.",
                orderId = order.Id,
                totalAmount = order.TotalAmount,
                paymentMethod = order.PaymentMethod,
                status = order.Status
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return StatusCode(500, new { message = "Checkout failed. Please try again.", detail = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders()
    {
        var userId = GetUserId();

        var orders = await _db.Orders
            .Where(o => o.UserId == userId)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new OrderResponse(
                o.Id,
                o.TotalAmount,
                o.PaymentMethod,
                o.Status,
                o.CreatedAt,
                o.Items
                    .Select(i => new OrderItemResponse(
                        i.ProductId,
                        i.Product.Name,
                        i.Quantity,
                        i.UnitPrice,
                        i.UnitPrice * i.Quantity
                    ))
                    .ToList()
            ))
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrderById(int id)
    {
        var userId = GetUserId();

        var order = await _db.Orders
            .Where(o => o.Id == id && o.UserId == userId)
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .Select(o => new OrderResponse(
                o.Id,
                o.TotalAmount,
                o.PaymentMethod,
                o.Status,
                o.CreatedAt,
                o.Items
                    .Select(i => new OrderItemResponse(
                        i.ProductId,
                        i.Product.Name,
                        i.Quantity,
                        i.UnitPrice,
                        i.UnitPrice * i.Quantity
                    ))
                    .ToList()
            ))
            .FirstOrDefaultAsync();

        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(order);
    }
}
