import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, PackageOpen, CreditCard, CheckCircle2, Leaf, MapPin } from "lucide-react";
import Sidebar from "../components/Sidebar";
import { getProducts, getOrders } from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const CustomerDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [pRes, oRes] = await Promise.all([
                    getProducts({ sortBy: "newest" }),
                    getOrders(),
                ]);
                setProducts(pRes.data.products.slice(0, 4));
                setOrders(oRes.data.orders.slice(0, 5));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const cart = JSON.parse(localStorage.getItem("farmfresh_cart") || "[]");
    const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);

    const stats = [
        { label: "Active Orders", value: orders.filter((o) => o.orderStatus !== "Delivered").length, icon: <PackageOpen className="w-8 h-8" />, color: "text-blue-600 bg-blue-50" },
        { label: "Cart Items", value: cart.length, icon: <ShoppingCart className="w-8 h-8" />, color: "text-accent-600 bg-accent-50" },
        { label: "Cart Total", value: formatCurrency(cartTotal), icon: <CreditCard className="w-8 h-8" />, color: "text-purple-600 bg-purple-50" },
        { label: "Total Orders", value: orders.length, icon: <CheckCircle2 className="w-8 h-8" />, color: "text-green-600 bg-green-50" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Welcome, {user?.name}! 👋</h1>
                    <p className="text-gray-500 mt-1">Here's your shopping overview for today.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {stats.map((s) => (
                        <div key={s.label} className={`card p-5 flex items-center gap-3 ${s.color}`}>
                            <span className="text-3xl">{s.icon}</span>
                            <div>
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-xs font-medium opacity-80">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <Link to="/products" className="card card-hover p-5 flex items-center gap-4 text-left group">
                        <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center text-primary-700 group-hover:bg-primary-200 transition-colors">
                            <Leaf className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">Browse Vegetables</p>
                            <p className="text-sm text-gray-500">Explore fresh produce</p>
                        </div>
                    </Link>
                    <Link to="/cart" className="card card-hover p-5 flex items-center gap-4 text-left group">
                        <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center text-accent-700 group-hover:bg-accent-200 transition-colors">
                            <ShoppingCart className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">View Cart</p>
                            <p className="text-sm text-gray-500">{cart.length} items • {formatCurrency(cartTotal)}</p>
                        </div>
                    </Link>
                    <Link to="/orders" className="card card-hover p-5 flex items-center gap-4 text-left group">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 group-hover:bg-blue-200 transition-colors">
                            <PackageOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800">My Orders</p>
                            <p className="text-sm text-gray-500">{orders.length} total orders</p>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Products */}
                    <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-800">Latest Vegetables</h2>
                            <Link to="/products" className="text-sm text-primary-600 hover:underline">View all →</Link>
                        </div>
                        {loading ? (
                            <p className="text-gray-400 text-sm">Loading...</p>
                        ) : (
                            <div className="space-y-3">
                                {products.map((p) => (
                                    <Link to={`/products/${p._id}`} key={p._id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                            <img src={p.image || `https://placehold.co/48x48/e8f5e9/16a34a?text=${p.name[0]}`} alt={p.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = `https://placehold.co/48x48/e8f5e9/16a34a?text=${p.name[0]}`; }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-800 truncate">{p.name}</p>
                                            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {p.location}
                                            </p>
                                        </div>
                                        <span className="text-primary-600 font-bold text-sm">{formatCurrency(p.price)}/kg</span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Orders */}
                    <div className="card p-5">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-semibold text-gray-800">Recent Orders</h2>
                            <Link to="/orders" className="text-sm text-primary-600 hover:underline">View all →</Link>
                        </div>
                        {loading ? (
                            <p className="text-gray-400 text-sm">Loading...</p>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-10 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                <PackageOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No orders placed yet</p>
                                <Link to="/products" className="text-primary-600 text-sm mt-2 inline-block hover:underline font-semibold">Start shopping &rarr;</Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {orders.map((o) => (
                                    <div key={o._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">Order #{o._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-xs text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`badge-${o.orderStatus.toLowerCase()}`}>{o.orderStatus}</span>
                                            <p className="text-sm font-bold text-primary-600 mt-1">{formatCurrency(o.totalPrice)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CustomerDashboard;
