namespace backend.DTOs;

// ─── Dashboard ────────────────────────────────────────────────────────────────
public record DashboardStats(
    int TotalUsers,
    int TotalProducts,
    int TotalOrders,
    decimal TotalRevenue,
    List<RecentOrderItem> RecentOrders
);

public record RecentOrderItem(
    int Id,
    string Username,
    decimal TotalAmount,
    string PaymentMethod,
    string Status,
    DateTime CreatedAt
);

// ─── Products ─────────────────────────────────────────────────────────────────
public record CreateProductRequest(
    string Name,
    string Description,
    decimal Price,
    int StockQuantity,
    string ImageUrl
);

public record UpdateProductRequest(
    string Name,
    string Description,
    decimal Price,
    int StockQuantity,
    string ImageUrl
);

// ─── Orders ───────────────────────────────────────────────────────────────────
public record AdminOrderResponse(
    int Id,
    int UserId,
    string Username,
    string Email,
    decimal TotalAmount,
    string PaymentMethod,
    string Status,
    DateTime CreatedAt,
    List<OrderItemResponse> Items
);

public record UpdateOrderStatusRequest(string Status);

// ─── Users ────────────────────────────────────────────────────────────────────
public record AdminUserResponse(
    int Id,
    string Username,
    string Email,
    string Role,
    DateTime CreatedAt,
    int TotalOrders,
    decimal TotalSpent
);

public record UpdateUserRoleRequest(string Role);
