import apiClient from "./client";

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CheckoutPayload {
  paymentMethod: string;
}

export interface CheckoutResponse {
  message: string;
  orderId: number;
  totalAmount: number;
  paymentMethod: string;
  status: string;
}

export const ordersApi = {
  checkout: async (payload: CheckoutPayload): Promise<CheckoutResponse> => {
    const res = await apiClient.post("/orders/checkout", payload);
    return res.data;
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await apiClient.get("/orders");
    return res.data;
  },

  getOrderById: async (id: number): Promise<Order> => {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data;
  },
};
