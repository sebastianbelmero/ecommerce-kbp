namespace backend.DTOs;

public record CartItemResponse(int ProductId, string ProductName, string ImageUrl, decimal UnitPrice, int Quantity, decimal Subtotal);
public record CartResponse(int CartId, List<CartItemResponse> Items, decimal Total);
public record AddToCartRequest(int ProductId, int Quantity);
