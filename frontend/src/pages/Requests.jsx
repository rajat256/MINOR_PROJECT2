import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { createRequest, getProducts, getRequests, updateRequestStatus } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Requests = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");
    const [form, setForm] = useState({
        productId: "",
        quantity: 1,
        requestedPrice: "",
        message: "",
    });

    const isCustomer = user?.role === "customer";

    const fetchData = async ({ silent = false } = {}) => {
        try {
            if (silent) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError("");
            const reqRes = await getRequests();
            setRequests(reqRes.data.requests || []);

            if (isCustomer) {
                const productRes = await getProducts({ sortBy: "newest" });
                setProducts(productRes.data.products || []);
            }

            setLastUpdated(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
        } catch (error) {
            console.error(error);
            setError(error.response?.data?.message || "Failed to load Request Center data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();

        const timer = setInterval(() => {
            fetchData({ silent: true });
        }, 10000);

        return () => clearInterval(timer);
    }, [isCustomer]);

    const onSubmitRequest = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const payload = {
                productId: form.productId,
                quantity: Number(form.quantity),
                requestedPrice: form.requestedPrice ? Number(form.requestedPrice) : undefined,
                message: form.message,
            };
            const res = await createRequest(payload);
            setRequests((prev) => [res.data.request, ...prev]);
            setForm({ productId: "", quantity: 1, requestedPrice: "", message: "" });
            setSuccess("Request sent successfully. Farmer will respond soon.");
        } catch (error) {
            setError(error.response?.data?.message || "Failed to send request");
        } finally {
            setSubmitting(false);
        }
    };

    const onUpdateStatus = async (id, status) => {
        setError("");
        setSuccess("");
        try {
            const res = await updateRequestStatus(id, { status });
            setRequests((prev) => prev.map((item) => (item._id === id ? res.data.request : item)));
            setSuccess(`Request ${status.toLowerCase()} successfully.`);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to update request");
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <div className="mb-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">Request Center</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {isCustomer ? "Send custom crop requests to farmers" : "Accept or reject incoming buyer requests"}
                            </p>
                            {lastUpdated ? (
                                <p className="text-xs text-gray-400 mt-1">Last updated: {lastUpdated}</p>
                            ) : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => fetchData({ silent: true })}
                            disabled={refreshing || loading}
                            className="btn-secondary text-sm"
                        >
                            {refreshing ? "Refreshing..." : "Refresh"}
                        </button>
                    </div>
                </div>

                {error ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {success ? (
                    <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                    </div>
                ) : null}

                {isCustomer && (
                    <form onSubmit={onSubmitRequest} className="card p-5 mb-6 grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Product</label>
                            <select
                                className="input-field mt-1"
                                value={form.productId}
                                onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
                                required
                                disabled={products.length === 0}
                            >
                                <option value="">Select product</option>
                                {products.map((product) => (
                                    <option key={product._id} value={product._id}>
                                        {product.name} - {product.farmerName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {products.length === 0 ? (
                            <div className="md:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                No listed products found yet. Ask a farmer to list at least one product first, then you can send requests.
                            </div>
                        ) : null}

                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Quantity (kg)</label>
                            <input
                                type="number"
                                min="1"
                                className="input-field mt-1"
                                value={form.quantity}
                                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Requested Price (optional)</label>
                            <input
                                type="number"
                                min="0"
                                className="input-field mt-1"
                                value={form.requestedPrice}
                                onChange={(e) => setForm((prev) => ({ ...prev, requestedPrice: e.target.value }))}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase text-gray-500">Message</label>
                            <input
                                type="text"
                                className="input-field mt-1"
                                value={form.message}
                                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                                placeholder="Any special request"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <button type="submit" disabled={submitting || products.length === 0} className="btn-primary">
                                {submitting ? "Sending..." : "Send Request"}
                            </button>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p className="text-gray-500">Loading requests...</p>
                ) : requests.length === 0 ? (
                    <div className="card p-8 text-center text-gray-500">No requests yet.</div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((item) => (
                            <div key={item._id} className="card p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.productName} • {item.quantity} kg</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {isCustomer ? `Farmer: ${item.farmerName}` : `Buyer: ${item.buyerName}`}
                                        </p>
                                    </div>
                                    <span className={`badge-${item.status.toLowerCase()}`}>{item.status}</span>
                                </div>

                                {item.message ? <p className="text-sm text-gray-600 mt-3">{item.message}</p> : null}

                                {!isCustomer && item.status === "Pending" && (
                                    <div className="flex gap-2 mt-4">
                                        <button onClick={() => onUpdateStatus(item._id, "Accepted")} className="btn-primary text-sm py-1.5 px-4">
                                            Accept
                                        </button>
                                        <button onClick={() => onUpdateStatus(item._id, "Rejected")} className="btn-danger text-sm py-1.5 px-4">
                                            Reject
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Requests;
