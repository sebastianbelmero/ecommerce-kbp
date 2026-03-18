using System.Security.Claims;
using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace backend.Controllers;

[ApiController]
[Route("api/cart")]
[Authorize]
public class CartController : ControllerBase
{
    private readonly AppDbContext _db;

    public CartController(AppDbContext db)
    {
        _db = db;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetCart()
    {
        var userId = GetUserId();

        var cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return Ok(new CartResponse(0, new List<CartItemResponse>(), 0));

        var items = cart.Items
            .Select(i => new CartItemResponse(
                i.ProductId,
                i.Product.Name,
                i.Product.ImageUrl,
                i.Product.Price,
                i.Quantity,
                i.Product.Price * i.Quantity
            ))
            .ToList();

        var total = items.Sum(i => i.Subtotal);

        return Ok(new CartResponse(cart.Id, items, total));
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem([FromBody] AddToCartRequest req)
    {
        if (req.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be at least 1." });

        var userId = GetUserId();

        var product = await _db.Products.FindAsync(req.ProductId);
        if (product == null)
            return NotFound(new { message = "Product not found." });

        if (product.StockQuantity < req.Quantity)
            return BadRequest(new { message = $"Insufficient stock. Only {product.StockQuantity} item(s) available." });

        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
        {
            cart = new Cart { UserId = userId };
            _db.Carts.Add(cart);
            await _db.SaveChangesAsync();
        }

        var existingItem = cart.Items.FirstOrDefault(i => i.ProductId == req.ProductId);
        if (existingItem != null)
        {
            var newQty = existingItem.Quantity + req.Quantity;
            if (newQty > product.StockQuantity)
                return BadRequest(new { message = $"Cannot add more. Only {product.StockQuantity} item(s) in stock." });

            existingItem.Quantity = newQty;
        }
        else
        {
            cart.Items.Add(new CartItem
            {
                CartId = cart.Id,
                ProductId = req.ProductId,
                Quantity = req.Quantity
            });
        }

        await _db.SaveChangesAsync();
        return Ok(new { message = "Item added to cart." });
    }

    [HttpPut("items/{productId:int}")]
    public async Task<IActionResult> UpdateItem(int productId, [FromBody] AddToCartRequest req)
    {
        if (req.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be at least 1." });

        var userId = GetUserId();

        var cart = await _db.Carts
            .Include(c => c.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return NotFound(new { message = "Cart not found." });

        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
            return NotFound(new { message = "Item not found in cart." });

        if (req.Quantity > item.Product.StockQuantity)
            return BadRequest(new { message = $"Only {item.Product.StockQuantity} item(s) available." });

        item.Quantity = req.Quantity;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Cart item updated." });
    }

    [HttpDelete("items/{productId:int}")]
    public async Task<IActionResult> RemoveItem(int productId)
    {
        var userId = GetUserId();

        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return NotFound(new { message = "Cart not found." });

        var item = cart.Items.FirstOrDefault(i => i.ProductId == productId);
        if (item == null)
            return NotFound(new { message = "Item not found in cart." });

        cart.Items.Remove(item);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Item removed from cart." });
    }

    [HttpDelete]
    public async Task<IActionResult> ClearCart()
    {
        var userId = GetUserId();

        var cart = await _db.Carts
            .Include(c => c.Items)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (cart == null)
            return Ok(new { message = "Cart is already empty." });

        _db.CartItems.RemoveRange(cart.Items);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Cart cleared." });
    }
}
