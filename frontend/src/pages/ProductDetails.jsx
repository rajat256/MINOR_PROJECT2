import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getProductById } from "../services/api";
import { useAuth } from "../context/AuthContext";

const ProductDetails = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("farmfresh_cart") || "[]"));
    const [toast, setToast] = useState("");

    useEffect(() => {
        const fetch = async () => {
            try {
                const { data } = await getProductById(id);
                setProduct(data);
            } catch {
                navigate("/products");
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleAddToCart = () => {
        if (!user) return navigate("/login");
        const existing = cart.find((i) => i.productId === product._id);
        let updated;
        if (existing) {
            updated = cart.map((i) =>
                i.productId === product._id ? { ...i, quantity: i.quantity + quantity } : i
            );
        } else {
            updated = [...cart, {
                productId: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                farmerId: product.farmerId?._id || product.farmerId,
                quantity,
            }];
        }
        setCart(updated);
        localStorage.setItem("farmfresh_cart", JSON.stringify(updated));
        setToast(`${product.name} (× ${quantity}) added to cart!`);
        setTimeout(() => setToast(""), 2500);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex justify-center items-center h-96">
                    <div className="animate-spin text-5xl">⏳</div>
                </div>
            </div>
        );
    }

    if (!product) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} />

            {toast && (
                <div className="fixed top-20 right-4 z-50 bg-primary-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
                    🛒 {toast}
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <button onClick={() => navigate(-1)} className="btn-secondary mb-6 text-sm">← Back</button>

                <div className="card overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Image */}
                        <div className="h-72 md:h-[640px] bg-gray-100 overflow-hidden">
                            <img
                                src={product.image || `https://placehold.co/600x400/e8f5e9/16a34a?text=${encodeURIComponent(product.name)}`}
                                alt={product.name}
                                className="w-full h-full object-cover object-center"
                                onError={(e) => { e.target.src = `https://placehold.co/600x400/e8f5e9/16a34a?text=${encodeURIComponent(product.name)}`; }}
                            />
                        </div>

                        {/* Details */}
                        <div className="p-6 md:p-8 flex flex-col justify-between md:h-[640px]">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-800">{product.name}</h1>
                                <p className="text-4xl font-extrabold text-primary-600 mt-3">
                                    ₹{product.price}
                                    <span className="text-lg font-normal text-gray-500">/kg</span>
                                </p>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <span>📦</span>
                                        <span className={`font-medium ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                                            {product.quantity > 0 ? `${product.quantity} kg available` : "Out of stock"}
                                        </span>
                                    </div>
                                    {product.location && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>📍</span><span>{product.location}</span>
                                        </div>
                                    )}
                                    {product.farmerId && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>👨‍🌾</span>
                                            <span>Sold by: <strong>{product.farmerId.name || product.farmerName}</strong></span>
                                        </div>
                                    )}
                                    {product.farmerId?.phone && (
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>📞</span><span>{product.farmerId.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {product.description && (
                                    <div className="mt-5">
                                        <h3 className="font-semibold text-gray-700 mb-1">Description</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed">{product.description}</p>
                                    </div>
                                )}
                            </div>

                            {/* Add to cart */}
                            {user?.role === "customer" && product.quantity > 0 && (
                                <div className="mt-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <label className="text-sm font-medium text-gray-700">Quantity (kg):</label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">−</button>
                                            <span className="w-8 text-center font-semibold">{quantity}</span>
                                            <button onClick={() => setQuantity(Math.min(product.quantity, quantity + 1))} className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold">+</button>
                                        </div>
                                        <span className="text-gray-400 text-sm">= ₹{(product.price * quantity).toFixed(2)}</span>
                                    </div>
                                    <button onClick={handleAddToCart} className="btn-primary w-full py-3 text-base" id="add-to-cart-btn">
                                        🛒 Add to Cart
                                    </button>
                                </div>
                            )}

                            {!user && (
                                <div className="mt-6">
                                    <button onClick={() => navigate("/login")} className="btn-accent w-full py-3 text-base">
                                        Login to Purchase
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
