namespace backend.DTOs;

public record ProductResponse(int Id, string Name, string Description, decimal Price, int StockQuantity, string ImageUrl);
