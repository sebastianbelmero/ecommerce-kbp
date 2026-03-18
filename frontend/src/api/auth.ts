import apiClient from "./client";

export interface User {
  id: number;
  username: string;
  email: string;
  role: "User" | "Admin";
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<{ message: string }> => {
    const res = await apiClient.post("/auth/register", payload);
    return res.data;
  },

  login: async (payload: LoginPayload): Promise<User> => {
    const res = await apiClient.post("/auth/login", payload);
    return res.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const res = await apiClient.post("/auth/logout");
    return res.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get("/auth/me");
    return res.data;
  },
};
