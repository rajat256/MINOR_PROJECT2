import { useState, useEffect } from "react";
import { PackageOpen, Leaf, IndianRupee, MapPin, Loader2, Image as ImageIcon } from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
    getMyProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const formatCurrency = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

const MAX_VEGETABLE_PRICE = 1000;

const emptyForm = {
    name: "",
    price: "",
    quantity: "",
    description: "",
    image: "",
    location: "",
};

const FarmerDashboard = () => {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [imageFile, setImageFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("products");
    const [error, setError] = useState("");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [pRes, oRes] = await Promise.all([getMyProducts(), getOrders()]);
            setProducts(pRes.data.products);
            setOrders(oRes.data.orders);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditProduct(null);
        setForm({ ...emptyForm, location: user?.location || "" });
        setImageFile(null);
        setShowModal(true);
        setError("");
    };

    const openEditModal = (product) => {
        setEditProduct(product);
        setForm({
            name: product.name,
            price: product.price,
            quantity: product.quantity,
            description: product.description || "",
            image: product.image || "",
            location: product.location || "",
        });
        setImageFile(null);
        setShowModal(true);
        setError("");
    };

    const closeModal = () => {
        setShowModal(false);
        setImageFile(null);
    };

    const buildProductPayload = () => {
        if (!imageFile) return form;

        const payload = new FormData();
        payload.append("name", form.name);
        payload.append("price", form.price);
        payload.append("quantity", form.quantity);
        payload.append("description", form.description || "");
        payload.append("location", form.location || "");
        if (form.image) {
            payload.append("image", form.image);
        }
        payload.set("image", imageFile);
        return payload;
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p._id !== id));
        } catch (err) {
            alert(err.response?.data?.message || "Delete failed");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const numericPrice = Number(form.price);
        if (Number.isNaN(numericPrice) || numericPrice < 0 || numericPrice > MAX_VEGETABLE_PRICE) {
            setError(`Price must be between ${formatCurrency(0)} and ${formatCurrency(MAX_VEGETABLE_PRICE)}`);
            return;
        }

        setSubmitting(true);
        try {
            const payload = buildProductPayload();
            if (editProduct) {
                const { data } = await updateProduct(editProduct._id, payload);
                setProducts((prev) => prev.map((p) => (p._id === editProduct._id ? data : p)));
            } else {
                const { data } = await createProduct(payload);
                setProducts((prev) => [data, ...prev]);
            }
            closeModal();
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed");
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusUpdate = async (orderId, status) => {
        try {
            const res = await fetch(`http://localhost:5000/api/orders/${orderId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("farmfresh_token")}`,
                },
                body: JSON.stringify({ orderStatus: status }),
            });
            if (res.ok) {
                setOrders((prev) =>
                    prev.map((o) => (o._id === orderId ? { ...o, orderStatus: status } : o))
                );
            }
        } catch (err) {
            console.error(err);
        }
    };

    const totalEarnings = orders
        .filter((o) => o.orderStatus === "Delivered")
        .reduce((sum, o) => sum + o.totalPrice, 0);

    const stats = [
        { label: "Total Products", value: products.length, icon: <Leaf className="w-8 h-8" />, color: "bg-green-50 text-green-700" },
        { label: "Total Orders", value: orders.length, icon: <PackageOpen className="w-8 h-8" />, color: "bg-blue-50 text-blue-700" },
        { label: "Total Earnings", value: formatCurrency(totalEarnings), icon: <IndianRupee className="w-8 h-8" />, color: "bg-amber-50 text-amber-700" },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Farmer Dashboard</h1>
                        <p className="text-gray-500 mt-1">Welcome back, {user?.name}! 👋</p>
                    </div>
                    <button onClick={openAddModal} className="btn-primary" id="add-product-btn">
                        + Add Vegetable
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    {stats.map((s) => (
                        <div key={s.label} className={`card p-5 flex items-center gap-4 ${s.color}`}>
                            <span className="text-4xl">{s.icon}</span>
                            <div>
                                <p className="text-2xl font-bold">{s.value}</p>
                                <p className="text-sm font-medium opacity-80">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-200">
                    {["products", "orders"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-5 py-2.5 -mb-px font-medium text-sm capitalize transition-colors flex items-center gap-2 ${activeTab === tab
                                    ? "border-b-2 border-primary-600 text-primary-600"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            {tab === "products" ? <><Leaf className="w-4 h-4" /> My Products ({products.length})</> : <><PackageOpen className="w-4 h-4" /> Received Orders ({orders.length})</>}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary-500" /> Loading...
                    </div>
                ) : activeTab === "products" ? (
                    <>
                        {products.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-500">No products yet</p>
                                <p className="text-sm mt-1 text-gray-400">Click "Add Vegetable" to list your first product!</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto card">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50">
                                            {["Vegetable", "Price", "Quantity", "Location", "Actions"].map((h) => (
                                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map((p) => (
                                            <tr key={p._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                            <img
                                                                src={p.image || `https://placehold.co/40x40/e8f5e9/16a34a?text=${p.name[0]}`}
                                                                alt={p.name}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { e.target.src = `https://placehold.co/40x40/e8f5e9/16a34a?text=${p.name[0]}`; }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{p.name}</p>
                                                            <p className="text-xs text-gray-400 line-clamp-1">{p.description}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 font-semibold text-primary-600">{formatCurrency(p.price)}<span className="text-xs text-gray-500 font-normal">/kg</span></td>
                                                <td className="px-4 py-4">
                                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${p.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                        {p.quantity} kg
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-gray-500 font-medium text-sm flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {p.location}</td>
                                                <td className="px-4 py-4">
                                                    <div className="flex gap-2">
                                                        <button onClick={() => openEditModal(p)} className="text-xs btn-secondary py-1 px-3">Edit</button>
                                                        <button onClick={() => handleDelete(p._id)} className="text-xs btn-danger py-1 px-3">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {orders.length === 0 ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                                <PackageOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-500">No orders yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div key={order._id} className="card p-5">
                                        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                            <div>
                                                <p className="font-semibold text-gray-800">Order #{order._id.slice(-8).toUpperCase()}</p>
                                                <p className="text-sm text-gray-500">Customer: {order.customerName} • {new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`badge-${order.orderStatus.toLowerCase()}`}>{order.orderStatus}</span>
                                                <span className="font-bold text-primary-600 text-lg">{formatCurrency(order.totalPrice)}</span>
                                            </div>
                                        </div>
                                        <div className="text-sm text-gray-600 mb-4">
                                            {order.products.map((p) => (
                                                <span key={p.productId} className="inline-flex items-center bg-gray-50 rounded-lg px-3 py-1 mr-2 mb-2">
                                                    {p.productName} × {p.quantity}
                                                </span>
                                            ))}
                                        </div>
                                        {order.orderStatus !== "Delivered" && (
                                            <div className="flex gap-2">
                                                {order.orderStatus === "Pending" && (
                                                    <button onClick={() => handleStatusUpdate(order._id, "Accepted")} className="btn-primary text-sm py-1.5 px-4">Accept Order</button>
                                                )}
                                                {order.orderStatus === "Accepted" && (
                                                    <button onClick={() => handleStatusUpdate(order._id, "Delivered")} className="btn-accent text-sm py-1.5 px-4">Mark Delivered</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </main>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editProduct ? "Edit Vegetable" : "Add New Vegetable"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vegetable Name *</label>
                                    <input className="input-field" placeholder="e.g. Tomato" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price per kg *</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <IndianRupee className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <input className="input-field pl-9" type="number" min="0" max={MAX_VEGETABLE_PRICE} placeholder="40" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">Maximum allowed price is {formatCurrency(MAX_VEGETABLE_PRICE)} per kg.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg) *</label>
                                    <input className="input-field" type="number" min="0" placeholder="e.g. 100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea className="input-field" rows={2} placeholder="Describe your vegetable..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Upload Image</label>
                                    <input
                                        className="input-field"
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">Choose an image file from your device (max 5MB).</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                                    <input className="input-field" placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input className="input-field" placeholder="e.g. Nashik, Maharashtra" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-2">
                                <button type="button" onClick={closeModal} className="btn-secondary flex-1">Cancel</button>
                                <button type="submit" disabled={submitting} className="btn-primary flex-1">
                                    {submitting ? "Saving..." : editProduct ? "Update" : "Add Product"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FarmerDashboard;
