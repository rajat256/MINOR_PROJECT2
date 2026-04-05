import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getOrders, updateOrderStatus, cancelOrder } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { CreditCard, MapPin, Search, Funnel, BellRing, RefreshCw } from "lucide-react";
import OrderStatusPill from "../components/orders/OrderStatusPill";
import OrdersSkeleton from "../components/orders/OrdersSkeleton";
import OrdersAnalytics from "../components/orders/OrdersAnalytics";
import OrderDetailsModal from "../components/orders/OrderDetailsModal";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const Orders = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [liveNotice, setLiveNotice] = useState("");
    const [lastSyncedAt, setLastSyncedAt] = useState(null);
    const cart = JSON.parse(localStorage.getItem("farmfresh_cart") || "[]");

    useEffect(() => {
        const fetchOrders = async (silent = false) => {
            try {
                const { data } = await getOrders();
                const incomingOrders = data.orders || [];

                setOrders((prevOrders) => {
                    if (prevOrders.length && incomingOrders.length > prevOrders.length) {
                        const newOrdersCount = incomingOrders.filter(
                            (incoming) => !prevOrders.some((existing) => existing._id === incoming._id)
                        ).length;

                        if (newOrdersCount > 0) {
                            setLiveNotice(`${newOrdersCount} new order${newOrdersCount > 1 ? "s" : ""} received`);
                            setTimeout(() => setLiveNotice(""), 3500);
                        }
                    }
                    return incomingOrders;
                });

                setLastSyncedAt(new Date());
            } catch (err) {
                console.error(err);
            } finally {
                if (!silent) setLoading(false);
            }
        };

        fetchOrders();
        const pollId = setInterval(() => fetchOrders(true), 15000);
        return () => clearInterval(pollId);
    }, []);

    const updateOrderInState = (orderId, status) => {
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, orderStatus: status } : o)));
        setSelectedOrder((prev) => (prev && prev._id === orderId ? { ...prev, orderStatus: status } : prev));
    };

    const handleStatusUpdate = async (orderId, status, promptText) => {
        if (promptText && !window.confirm(promptText)) return;
        try {
            await updateOrderStatus(orderId, status);
            updateOrderInState(orderId, status);
        } catch (err) {
            alert(err.response?.data?.message || "Update failed");
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm("Are you sure you want to cancel this order?")) return;
        try {
            await cancelOrder(orderId);
            updateOrderInState(orderId, "Cancelled");
            alert("Order cancelled successfully");
        } catch (err) {
            alert(err.response?.data?.message || "Cancellation failed");
        }
    };

    const filterOptions = ["All", "Pending", "Accepted", "Delivered", "Cancelled"];

    const statusMatches = (order) => {
        if (statusFilter === "All") return true;
        if (statusFilter === "Pending") return order.orderStatus === "Ordered";
        if (statusFilter === "Accepted") return order.orderStatus === "Confirmed";
        return order.orderStatus === statusFilter;
    };

    const textMatches = (order) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;

        const inCustomer = (order.customerName || "").toLowerCase().includes(query);
        const inProducts = (order.products || []).some((product) =>
            (product.productName || "").toLowerCase().includes(query)
        );

        return inCustomer || inProducts;
    };

    const filteredOrders = orders.filter((order) => statusMatches(order) && textMatches(order));

    const isFarmer = user?.role === "farmer";
    const hasSidebarLayout = user?.role === "farmer" || user?.role === "customer";

    const content = (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto [font-family:'Segoe_UI',Roboto,'Helvetica_Neue',Arial,sans-serif]">
            <AnimatePresence>
                {liveNotice && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2"
                    >
                        <BellRing className="w-4 h-4" />
                        {liveNotice}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 mb-5 shadow-sm">
                <div>
                    <p className="text-[11px] sm:text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">Orders</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">{isFarmer ? "Received Orders" : "My Orders"}</h1>
                    <p className="text-slate-500 mt-1 text-sm">Track all your order activity with live updates.</p>
                </div>

                <div className="mt-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
                    <div className="xl:col-span-2 relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by customer or product name"
                            className="input-field pl-9 py-2.5"
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                        <Funnel className="w-4 h-4 text-slate-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent text-sm text-slate-700 font-medium w-full focus:outline-none"
                        >
                            {filterOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2">
                        {filteredOrders.length} of {orders.length} order{orders.length !== 1 ? "s" : ""}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5" />
                        Auto-refresh every 15s{lastSyncedAt ? ` · Last sync ${lastSyncedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}` : ""}
                    </div>
                </div>
            </div>

            <OrdersAnalytics orders={orders} />

            {loading ? (
                <OrdersSkeleton count={3} />
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-slate-300 rounded-2xl bg-white">
                    <div className="text-5xl mb-3">🌾</div>
                    <h2 className="text-xl font-semibold text-slate-700 mb-2">No matching orders</h2>
                    <p className="text-slate-500 mb-4">Try changing search text or selecting a different filter.</p>
                    <button
                        onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("All");
                        }}
                        className="btn-secondary px-4 py-2 rounded-lg"
                    >
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order, idx) => (
                        <motion.div
                            key={order._id}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: idx * 0.03 }}
                            className="card p-5 sm:p-6 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-lg hover:shadow-slate-200/70 transition-all duration-200 cursor-pointer"
                            onClick={() => setSelectedOrder(order)}
                        >
                            {/* Header */}
                            <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100 mb-4">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 text-lg sm:text-xl leading-none tracking-tight">
                                        Order #{order._id.slice(-8).toUpperCase()}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1.5 truncate">
                                        {isFarmer ? `Customer: ${order.customerName}` : `${order.products.length} item(s)`}
                                        {" · "}
                                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <OrderStatusPill status={order.orderStatus} />
                                    <span className="font-bold text-primary-700 text-lg sm:text-xl leading-none tracking-tight tabular-nums">{formatCurrency(order.totalPrice)}</span>
                                </div>
                            </div>

                            {/* Products */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {order.products.map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2">
                                        {p.productImage && (
                                            <img
                                                src={p.productImage}
                                                alt={p.productName}
                                                className="w-7 h-7 rounded-md object-cover border border-slate-200"
                                                onError={(e) => { e.target.style.display = "none"; }}
                                            />
                                        )}
                                        <span className="text-sm text-slate-700 font-semibold leading-none">{p.productName}</span>
                                        <span className="text-xs text-slate-400">x {p.quantity}kg</span>
                                        <span className="text-xs text-primary-700 font-semibold tabular-nums">{formatCurrency(p.price * p.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Delivery & Payment Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                                {order.deliveryAddress && (
                                    <span className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                        <MapPin className="w-4 h-4 mt-0.5 text-slate-500 shrink-0" />
                                        <span className="line-clamp-2">Deliver to: {order.deliveryAddress}</span>
                                    </span>
                                )}
                                {order.paymentMethod && (
                                    <span className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                                        <CreditCard className="w-4 h-4 text-slate-500 shrink-0" />
                                        <span>Payment: {order.paymentMethod}</span>
                                    </span>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2.5 mt-4 pt-4 border-t border-slate-100">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedOrder(order);
                                    }}
                                    className="btn-secondary text-sm py-2 px-4 rounded-lg"
                                >
                                    View Details
                                </button>

                                {!isFarmer && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/orders/${order._id}`);
                                        }}
                                        className="text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-4 py-2 rounded-lg transition-colors shrink-0"
                                    >
                                        Open Tracking
                                    </button>
                                )}
                                
                                {!isFarmer && ["Ordered", "Confirmed"].includes(order.orderStatus) && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCancelOrder(order._id);
                                        }}
                                        className="text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-lg transition-colors shrink-0"
                                    >
                                        Cancel Order
                                    </button>
                                )}

                                {!isFarmer && order.orderStatus === "Delivered" && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/orders/${order._id}`);
                                        }}
                                        className="text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-lg transition-colors shrink-0"
                                    >
                                        Rate Farmer
                                    </button>
                                )}

                                {/* Farmer Actions */}
                                {isFarmer && order.orderStatus !== "Delivered" && order.orderStatus !== "Cancelled" && (
                                    <div className="flex gap-2">
                                        {order.orderStatus === "Ordered" && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusUpdate(order._id, "Confirmed", "Accept this order?");
                                                    }}
                                                    className="btn-primary text-sm py-2 px-4 rounded-lg"
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleStatusUpdate(order._id, "Cancelled", "Reject this order? This cannot be undone.");
                                                    }}
                                                    className="text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg transition-colors"
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        {["Confirmed", "Shipped"].includes(order.orderStatus) && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusUpdate(order._id, "Delivered", "Mark this order as delivered?");
                                                }}
                                                className="btn-accent text-sm py-2 px-4 rounded-lg"
                                            >
                                                Mark Delivered
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <OrderDetailsModal
                open={Boolean(selectedOrder)}
                order={selectedOrder}
                isFarmer={isFarmer}
                onClose={() => setSelectedOrder(null)}
                onAccept={() => {
                    if (!selectedOrder) return;
                    handleStatusUpdate(selectedOrder._id, "Confirmed", "Accept this order?");
                }}
                onReject={() => {
                    if (!selectedOrder) return;
                    handleStatusUpdate(selectedOrder._id, "Cancelled", "Reject this order? This cannot be undone.");
                }}
                onDeliver={() => {
                    if (!selectedOrder) return;
                    handleStatusUpdate(selectedOrder._id, "Delivered", "Mark this order as delivered?");
                }}
            />
        </main>
    );

    if (hasSidebarLayout) {
        return (
            <div className="flex min-h-screen page-bg">
                <Sidebar />
                {content}
            </div>
        );
    }

    return (
        <div className="min-h-screen page-bg">
            <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {content}
            </div>
        </div>
    );
};

export default Orders;
