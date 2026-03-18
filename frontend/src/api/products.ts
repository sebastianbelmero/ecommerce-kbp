import apiClient from "./client";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  imageUrl: string;
}

export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const res = await apiClient.get("/products");
    return res.data;
  },

  getById: async (id: number): Promise<Product> => {
    const res = await apiClient.get(`/products/${id}`);
    return res.data;
  },
};
