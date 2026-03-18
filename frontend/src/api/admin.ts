import apiClient from "./client";
import type { Product } from "./products";

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface RecentOrderItem {
  id: number;
  username: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: RecentOrderItem[];
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export interface AdminOrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface AdminOrder {
  id: number;
  userId: number;
  username: string;
  email: string;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: AdminOrderItem[];
}

export interface AdminOrdersResponse {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  data: AdminOrder[];
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
}

// ─── Payloads ─────────────────────────────────────────────────────────────────

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
}

export type UpdateProductPayload = CreateProductPayload;

// ─── API ──────────────────────────────────────────────────────────────────────

export const adminApi = {
  // Dashboard
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await apiClient.get("/admin/dashboard");
    return res.data;
  },

  // Products
  getAllProducts: async (): Promise<Product[]> => {
    const res = await apiClient.get("/admin/products");
    return res.data;
  },

  createProduct: async (payload: CreateProductPayload): Promise<Product> => {
    const res = await apiClient.post("/admin/products", payload);
    return res.data;
  },

  updateProduct: async (
    id: number,
    payload: UpdateProductPayload
  ): Promise<Product> => {
    const res = await apiClient.put(`/admin/products/${id}`, payload);
    return res.data;
  },

  deleteProduct: async (id: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/admin/products/${id}`);
    return res.data;
  },

  // Orders
  getAllOrders: async (
    status?: string,
    page = 1,
    pageSize = 20
  ): Promise<AdminOrdersResponse> => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const res = await apiClient.get(`/admin/orders?${params.toString()}`);
    return res.data;
  },

  updateOrderStatus: async (
    id: number,
    status: string
  ): Promise<{ message: string; orderId: number; status: string }> => {
    const res = await apiClient.put(`/admin/orders/${id}/status`, { status });
    return res.data;
  },

  // Users
  getAllUsers: async (): Promise<AdminUser[]> => {
    const res = await apiClient.get("/admin/users");
    return res.data;
  },

  updateUserRole: async (
    id: number,
    role: string
  ): Promise<{ message: string }> => {
    const res = await apiClient.put(`/admin/users/${id}/role`, { role });
    return res.data;
  },
};
