import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  withCredentials: true, // Always send HttpOnly cookies with every request
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor: if 401, clear any local auth state by dispatching an event
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Dispatch a custom event so AuthContext can react and clear user state
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export default apiClient;
