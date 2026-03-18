namespace backend.DTOs;

public record RegisterRequest(string Username, string Email, string Password);
public record LoginRequest(string Email, string Password);
public record UserResponse(int Id, string Username, string Email, string Role);
