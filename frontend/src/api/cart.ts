import apiClient from "./client";

export interface CartItem {
  productId: number;
  productName: string;
  imageUrl: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  cartId: number;
  items: CartItem[];
  total: number;
}

export interface AddToCartPayload {
  productId: number;
  quantity: number;
}

export const cartApi = {
  getCart: async (): Promise<Cart> => {
    const res = await apiClient.get("/cart");
    return res.data;
  },

  addItem: async (payload: AddToCartPayload): Promise<{ message: string }> => {
    const res = await apiClient.post("/cart/items", payload);
    return res.data;
  },

  updateItem: async (
    productId: number,
    payload: AddToCartPayload
  ): Promise<{ message: string }> => {
    const res = await apiClient.put(`/cart/items/${productId}`, payload);
    return res.data;
  },

  removeItem: async (productId: number): Promise<{ message: string }> => {
    const res = await apiClient.delete(`/cart/items/${productId}`);
    return res.data;
  },

  clearCart: async (): Promise<{ message: string }> => {
    const res = await apiClient.delete("/cart");
    return res.data;
  },
};
