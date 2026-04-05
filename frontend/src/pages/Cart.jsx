import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CartItem from "../components/CartItem";
import OrderSummary from "../components/OrderSummary";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Trash2 } from "lucide-react";

const CART_STORAGE_KEY = "farmfresh_cart";
const PROMO_RATE = 0.1;
const MAX_QUANTITY = 99;

const clampQuantity = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(MAX_QUANTITY, Math.max(1, parsed));
};

const safeNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const sanitizeCartItem = (item) => {
    if (!item || item.productId == null) return null;

    return {
        ...item,
        quantity: clampQuantity(item.quantity),
        price: safeNumber(item.price),
    };
};

const loadInitialCart = () => {
    try {
        const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        if (!Array.isArray(stored)) return [];
        return stored.map(sanitizeCartItem).filter(Boolean);
    } catch {
        return [];
    }
};

const Cart = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [cart, setCart] = useState(loadInitialCart);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [removingItemIds, setRemovingItemIds] = useState([]);
    const removeTimersRef = useRef(new Map());

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        return () => {
            removeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
            removeTimersRef.current.clear();
        };
    }, []);

    const handleRemove = useCallback((productId) => {
        setRemovingItemIds((prev) => (prev.includes(productId) ? prev : [...prev, productId]));

        if (removeTimersRef.current.has(productId)) {
            window.clearTimeout(removeTimersRef.current.get(productId));
        }

        const timerId = window.setTimeout(() => {
            setCart((prev) => prev.filter((item) => item.productId !== productId));
            setRemovingItemIds((prev) => prev.filter((id) => id !== productId));
            removeTimersRef.current.delete(productId);
        }, 220);

        removeTimersRef.current.set(productId, timerId);
    }, []);

    const handleUpdateQuantity = useCallback((productId, quantity) => {
        const nextQuantity = clampQuantity(quantity);
        setCart((prev) =>
            prev.map((item) =>
                item.productId === productId
                    ? { ...item, quantity: nextQuantity }
                    : item
            )
        );
    }, []);

    const handleClearCart = useCallback(() => {
        if (cart.length === 0) return;
        const shouldClear = window.confirm("Clear all items from your cart?");
        if (shouldClear) {
            setCart([]);
            setRemovingItemIds([]);
            removeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
            removeTimersRef.current.clear();
        }
    }, [cart.length]);

    const handleCheckout = useCallback(async () => {
        if (!user || cart.length === 0 || isCheckingOut) return;
        setIsCheckingOut(true);
        await new Promise((resolve) => setTimeout(resolve, 700));
        navigate("/checkout");
        setIsCheckingOut(false);
    }, [user, cart.length, isCheckingOut, navigate]);

    const { subtotal, totalItems } = useMemo(
        () =>
            cart.reduce(
                (acc, item) => {
                    const quantity = clampQuantity(item.quantity);
                    const linePrice = safeNumber(item.price) * quantity;
                    acc.subtotal += linePrice;
                    acc.totalItems += quantity;
                    return acc;
                },
                { subtotal: 0, totalItems: 0 }
            ),
        [cart]
    );

    const discount = useMemo(() => Number((subtotal * PROMO_RATE).toFixed(2)), [subtotal]);
    const finalTotal = useMemo(() => Number(Math.max(0, subtotal - discount).toFixed(2)), [subtotal, discount]);

    const hasSidebarLayout = user?.role === "customer";

    const content = (
        <div className="space-y-7 animate-fade-in">
            <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-200 p-6 md:p-7 flex items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="relative">
                    <h1
                        className="text-[2rem] md:text-[2.25rem] text-slate-900 tracking-tight"
                        style={{ fontFamily: "Sora, sans-serif", fontWeight: 650, letterSpacing: "-0.02em" }}
                    >
                        Your Cart
                    </h1>
                    <p className="text-sm md:text-base font-medium text-slate-500 mt-1">{totalItems} item(s) selected for checkout</p>
                </div>
                <div className="relative hidden sm:flex items-center gap-2 text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span className="text-sm font-semibold">Fresh picks, fast delivery</span>
                </div>
            </div>

            {cart.length === 0 ? (
                <div className="card p-10 text-center py-24">
                    <div className="text-7xl mb-4">🛒</div>
                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
                    <p className="text-gray-500 mb-6">Browse our selection of fresh vegetables</p>
                    <Link to="/products" className="btn-primary px-8 py-3">Browse Vegetables</Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
                    {/* Cart Items */}
                    <section className="space-y-4">
                        <div className="card rounded-3xl border border-slate-200 bg-white/90 p-4 md:p-5 space-y-4">
                            {cart.map((item) => (
                                <CartItem
                                    key={item.productId}
                                    item={item}
                                    isRemoving={removingItemIds.includes(item.productId)}
                                    maxQuantity={MAX_QUANTITY}
                                    onRemove={handleRemove}
                                    onUpdateQuantity={handleUpdateQuantity}
                                />
                            ))}

                            <div className="pt-1 border-t border-slate-100">
                                <button
                                    onClick={handleClearCart}
                                    className="mt-3 inline-flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg px-3 py-2 transition"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Clear cart
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Order Summary */}
                    <aside className="xl:w-[360px]">
                        <OrderSummary
                            cart={cart}
                            discount={discount}
                            totalItems={totalItems}
                            finalTotal={finalTotal}
                            isCheckingOut={isCheckingOut}
                            canCheckout={Boolean(user)}
                            onCheckout={handleCheckout}
                        />
                    </aside>
                </div>
            )}
        </div>
    );

    if (hasSidebarLayout) {
        return (
            <div className="flex min-h-screen page-bg">
                <Sidebar />
                <main className="flex-1 p-6 lg:p-8 overflow-auto">{content}</main>
            </div>
        );
    }

    return (
        <div className="page-bg min-h-screen">
            <Navbar cartCount={totalItems} />
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">{content}</div>
        </div>
    );
};

export default Cart;
