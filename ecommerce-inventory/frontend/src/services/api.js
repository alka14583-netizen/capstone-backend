import axios from "axios";

// One axios instance for the whole app. Base URL comes from .env (VITE_API_URL).
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });

// Attach the access token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the access token expired (401), use the refresh token once to get a new pair, then retry.
let refreshing = null;
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refreshToken = localStorage.getItem("refreshToken");
    if (error.response?.status === 401 && !original._retry && refreshToken && !original.url.includes("/auth/")) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("accessToken", data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        ["accessToken", "refreshToken", "user"].forEach((k) => localStorage.removeItem(k));
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Turns an axios error into a readable message
export const errMsg = (e) => e.response?.data?.errors?.[0]?.message || e.response?.data?.message || "Something went wrong";
export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
export const fallbackImg = (id) => `https://picsum.photos/seed/${id}/600/420`;
export default api;
