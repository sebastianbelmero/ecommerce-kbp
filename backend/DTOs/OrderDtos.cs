namespace backend.DTOs;

public record CheckoutRequest(string PaymentMethod);
public record OrderItemResponse(int ProductId, string ProductName, int Quantity, decimal UnitPrice, decimal Subtotal);
public record OrderResponse(int Id, decimal TotalAmount, string PaymentMethod, string Status, DateTime CreatedAt, List<OrderItemResponse> Items);
