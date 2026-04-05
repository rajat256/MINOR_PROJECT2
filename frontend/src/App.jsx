import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import FarmerDashboard from "./pages/FarmerDashboard";
import CustomerDashboard from "./pages/CustomerDashboard";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import OrderTracking from "./pages/OrderTracking";
import OrderSuccess from "./pages/OrderSuccess";
import ClaimTracking from "./pages/ClaimTracking";
import Requests from "./pages/Requests";
import Notifications from "./pages/Notifications";
import MarketInsights from "./pages/MarketInsights";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminOrders from "./pages/AdminOrders";
import AdminProducts from "./pages/AdminProducts";

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-5xl animate-bounce mb-4">🌿</div>
          <p className="text-gray-500 font-medium">Loading FarmFresh...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole) {
    const redirectPath = user.role === "admin" ? "/admin/dashboard" : `/${user.role}/dashboard`;
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

// Guest-only route (redirect logged in users away from login/register)
const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) {
    const redirectPath = user.role === "admin" ? "/admin/dashboard" : `/${user.role}/dashboard`;
    return <Navigate to={redirectPath} replace />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:id" element={<ProductDetails />} />

      {/* Guest only */}
      <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />
      <Route path="/forgot-password" element={<GuestRoute><ForgotPassword /></GuestRoute>} />
      <Route path="/reset-password/:token" element={<GuestRoute><ResetPassword /></GuestRoute>} />

      {/* Farmer only */}
      <Route path="/farmer/dashboard" element={
        <ProtectedRoute allowedRole="farmer"><FarmerDashboard /></ProtectedRoute>
      } />

      {/* Customer only */}
      <Route path="/customer/dashboard" element={
        <ProtectedRoute allowedRole="customer"><CustomerDashboard /></ProtectedRoute>
      } />
      <Route path="/cart" element={
        <ProtectedRoute allowedRole="customer"><Cart /></ProtectedRoute>
      } />
      <Route path="/checkout" element={
        <ProtectedRoute allowedRole="customer"><Checkout /></ProtectedRoute>
      } />
      <Route path="/order-success/:id" element={
        <ProtectedRoute allowedRole="customer"><OrderSuccess /></ProtectedRoute>
      } />

      {/* Admin only */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRole="admin"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRole="admin"><AdminUsers /></ProtectedRoute>
      } />
      <Route path="/admin/orders" element={
        <ProtectedRoute allowedRole="admin"><AdminOrders /></ProtectedRoute>
      } />
      <Route path="/admin/products" element={
        <ProtectedRoute allowedRole="admin"><AdminProducts /></ProtectedRoute>
      } />

      {/* Both roles */}
      <Route path="/orders" element={
        <ProtectedRoute><Orders /></ProtectedRoute>
      } />
      <Route path="/orders/:id" element={
        <ProtectedRoute><OrderTracking /></ProtectedRoute>
      } />
      <Route path="/orders/:id/claims/:claimId" element={
        <ProtectedRoute><ClaimTracking /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/requests" element={
        <ProtectedRoute><Requests /></ProtectedRoute>
      } />
      <Route path="/notifications" element={
        <ProtectedRoute><Notifications /></ProtectedRoute>
      } />
      <Route path="/insights" element={
        <ProtectedRoute><MarketInsights /></ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
