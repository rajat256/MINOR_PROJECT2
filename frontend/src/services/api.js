import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor — attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("farmfresh_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("farmfresh_token");
            localStorage.removeItem("farmfresh_user");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

// Auth
export const registerUser = (data) => api.post("/auth/register", data);
export const loginUser = (data) => api.post("/auth/login", data);
export const getMe = () => api.get("/auth/me");
export const updateProfile = (data) => api.put("/auth/profile", data);
export const getSecuritySettings = () => api.get("/auth/security");
export const setupMfa = (data) => api.post("/auth/mfa/setup", data);
export const verifyAuthenticatorMfa = (data) => api.post("/auth/mfa/verify", data);
export const sendEmailMfaOtp = () => api.post("/auth/mfa/send-otp");
export const verifyEmailMfaOtp = (data) => api.post("/auth/mfa/verify-otp", data);
export const disableMfa = () => api.post("/auth/mfa/disable");
export const changePassword = (data) => api.put("/auth/change-password", data);
export const requestPasswordReset = (data) => api.post("/auth/forgot-password", data);
export const resetPasswordWithToken = (token, data) => api.post(`/auth/reset-password/${token}`, data);

// Products
export const getProducts = (params) => api.get("/products", { params });
export const getProductById = (id) => api.get(`/products/${id}`);
export const getMyProducts = () => api.get("/products/farmer/my");
export const createProduct = (data) =>
    api.post("/products", data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
export const updateProduct = (id, data) =>
    api.put(`/products/${id}`, data, data instanceof FormData ? { headers: { "Content-Type": "multipart/form-data" } } : undefined);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Orders
export const placeOrder = (data) => api.post("/orders", data);
export const createRazorpayOrder = (data) => api.post("/orders/payment/razorpay/order", data);
export const verifyRazorpayPayment = (data) => api.post("/orders/payment/razorpay/verify", data);
export const getOrders = () => api.get("/orders");
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id, status) =>
    api.put(`/orders/${id}/status`, { orderStatus: status });
export const cancelOrder = (id) => api.put(`/orders/${id}/cancel`);
export const createOrderClaim = (orderId, data) => api.post(`/orders/${orderId}/claims`, data);
export const getOrderClaims = (orderId) => api.get(`/orders/${orderId}/claims`);
export const getClaimById = (orderId, claimId) => api.get(`/orders/${orderId}/claims/${claimId}`);
export const updateClaimStatus = (orderId, claimId, data) =>
    api.put(`/orders/${orderId}/claims/${claimId}/status`, data);

// Requests
export const createRequest = (data) => api.post("/requests", data);
export const getRequests = () => api.get("/requests");
export const updateRequestStatus = (id, data) => api.put(`/requests/${id}/status`, data);

// Notifications
export const getNotifications = () => api.get("/notifications");
export const markNotificationRead = (id) => api.patch(`/notifications/${id}/read`);

// Reviews
export const createReview = (data) => api.post("/reviews", data);
export const getFarmerReviews = (farmerId) => api.get(`/reviews/farmer/${farmerId}`);

// Weather, mandi prices, smart pricing
export const getWeather = (params) => api.get("/insights/weather", { params });
export const getMarketPrices = () => api.get("/insights/market-prices");
export const getSmartPricingSuggestion = (productId) => api.get(`/insights/smart-pricing/${productId}`);

// Chat
export const getOrderMessages = (orderId) => api.get(`/chat/${orderId}/messages`);
export const postOrderMessage = (orderId, message) => api.post(`/chat/${orderId}/messages`, { message });

// Admin
export const getAdminStats = () => api.get("/admin/stats");
export const getAdminUsers = (params) => api.get("/admin/users", { params });
export const toggleUserStatus = (id) => api.put(`/admin/users/${id}/status`);
export const getAdminOrders = (params) => api.get("/admin/orders", { params });
export const getAdminProducts = () => api.get("/admin/products");
export const deleteAdminProduct = (id) => api.delete(`/admin/products/${id}`);

export default api;
