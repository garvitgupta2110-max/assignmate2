import axios from "axios";
import { useAuthStore } from "../store/auth-store";
import { useToastStore } from "../store/toast-store";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

const triggerToast = (title: string, description: string, variant: "default" | "destructive" | "success" = "default") => {
  const id = Math.random().toString(36).substring(2, 9);
  useToastStore.getState().addToast({
    id,
    title,
    description,
    variant,
    open: true,
  });
};

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle global errors (network issues, timeouts, unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (error.code === "ECONNABORTED") {
      triggerToast("Connection Timeout", "The request took too long. Please check your network and try again.", "destructive");
    } else if (!error.response) {
      triggerToast("Network Error", "Unable to connect to server. Please ensure the backend server is running.", "destructive");
    } else {
      const status = error.response.status;
      const message = error.response.data?.message || "An unexpected error occurred.";

      if (status === 401) {
        // Trigger toast and logout if the token is invalid (unauthorized)
        triggerToast("Unauthorized", "Session expired or invalid credentials. Please sign in.", "destructive");
        useAuthStore.getState().logout();
      } else if (status === 500) {
        triggerToast("Server Error", "A server error occurred. Please try again later.", "destructive");
      } else {
        triggerToast("Error", message, "destructive");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
