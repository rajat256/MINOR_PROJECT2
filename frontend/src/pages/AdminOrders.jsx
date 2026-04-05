import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { getAdminOrders } from "../services/api";

const statusColors = {
    Ordered: "badge-ordered",
    Confirmed: "badge-confirmed",
    Shipped: "badge-shipped",
    Delivered: "badge-delivered",
    Cancelled: "badge-cancelled",
};

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("all");

    useEffect(() => {
        fetchOrders();
    }, [statusFilter]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminOrders({ status: statusFilter, limit: 50 });
            setOrders(data.orders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const content = (
        <main className="flex-1 p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Order Oversight 📦</h1>

            <div className="card p-5 mb-6 bg-white border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <p className="text-sm font-medium text-gray-500">
                        {orders.length} order{orders.length !== 1 && "s"} found
                    </p>
                    <select
                        className="input-field max-w-[200px]"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Statuses</option>
                        <option value="Ordered">Ordered</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                    </select>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 text-gray-400 font-medium">
                        <div className="animate-spin text-4xl mb-3">⏳</div> Loading orders...
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-xl border border-slate-200 border-dashed">
                        <div className="text-5xl mb-4">👻</div>
                        <h2 className="text-lg font-semibold text-gray-700">No orders found</h2>
                    </div>
                ) : (
                    orders.map((order) => (
                        <div key={order._id} className="card p-6 flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="font-bold text-gray-800">
                                        Order #{order._id.slice(-8).toUpperCase()}
                                    </span>
                                    <span className={statusColors[order.orderStatus]}>{order.orderStatus}</span>
                                </div>
                                <div className="text-sm text-gray-500 space-y-1 mb-3">
                                    <p>🛒 Customer: <span className="font-medium text-gray-700">{order.customerName}</span></p>
                                    <p>📅 Date: {new Date(order.createdAt).toLocaleString()}</p>
                                    <p>💳 Payment: {order.paymentMethod} ({order.paymentStatus})</p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {order.products.map((p, i) => (
                                        <div key={i} className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1">
                                            <span className="text-xs font-semibold text-gray-700">{p.productName}</span>
                                            <span className="text-[10px] text-gray-400">×{p.quantity}kg</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-right shrink-0 min-w-[120px]">
                                <div className="text-xs text-gray-400 uppercase font-semibold tracking-wider mb-1">Total Amount</div>
                                <div className="text-2xl font-extrabold text-primary-600">₹{order.totalPrice.toFixed(2)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <AdminSidebar />
                {content}
            </div>
        </div>
    );
};

export default AdminOrders;
