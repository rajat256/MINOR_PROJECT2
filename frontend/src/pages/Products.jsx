import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import VegetableCard from "../components/VegetableCard";
import { getProducts } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ProductQuickViewModal from "../components/ProductQuickViewModal";
import { Leaf, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CART_STORAGE_KEY = "farmfresh_cart";
const WISHLIST_STORAGE_KEY = "farmfresh_wishlist";

const loadCart = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const loadWishlist = () => {
    try {
        const parsed = JSON.parse(localStorage.getItem(WISHLIST_STORAGE_KEY) || "[]");
        return new Set(Array.isArray(parsed) ? parsed : []);
    } catch {
        return new Set();
    }
};

const useDebouncedValue = (value, delay = 300) => {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timer = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(timer);
    }, [value, delay]);

    return debounced;
};

const formatRupeeValue = (value) => `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;

const Products = () => {
    const { user } = useAuth();
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState(loadCart);
    const [filters, setFilters] = useState({ search: "", maxPrice: 1000, location: "", category: "", sortBy: "newest" });
    const [wishlist, setWishlist] = useState(loadWishlist);
    const [addingToCartId, setAddingToCartId] = useState("");
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const [toast, setToast] = useState("");
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [fetchError, setFetchError] = useState("");
    const priceInitializedRef = useRef(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        const onStorage = () => setCart(loadCart());
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(Array.from(wishlist)));
    }, [wishlist]);

    const fetchProducts = async () => {
        setLoading(true);
        setFetchError("");
        try {
            const { data } = await getProducts();
            const products = Array.isArray(data?.products) ? data.products : [];
            setAllProducts(products);
        } catch (err) {
            console.error(err);
            setFetchError("Unable to load products right now. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const showToast = useCallback((msg) => {
        setToast(msg);
        window.setTimeout(() => setToast(""), 2500);
    }, []);

    const handleAddToCart = useCallback((product) => {
        if (Number(product.quantity) <= 0) return;

        setAddingToCartId(product._id);

        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product._id);
            if (existing) {
                return prev.map((i) =>
                    i.productId === product._id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    productId: product._id,
                    name: product.name,
                    price: Number(product.price) || 0,
                    image: product.image,
                    farmerId: product.farmerId?._id || product.farmerId,
                    quantity: 1,
                },
            ];
        });

        showToast(`${product.name} added to cart`);
        window.setTimeout(() => setAddingToCartId(""), 450);
    }, [showToast]);

    const toggleWishlist = useCallback((productId) => {
        setWishlist((prev) => {
            const next = new Set(prev);
            if (next.has(productId)) {
                next.delete(productId);
            } else {
                next.add(productId);
            }
            return next;
        });
    }, []);

    const sliderMaxPrice = useMemo(() => {
        const pricePoints = allProducts
            .map((item) => Number(item.price) || 0)
            .filter((value) => value > 0)
            .sort((a, b) => a - b);

        if (pricePoints.length === 0) return 1000;

        // Ignore extreme outliers so the slider remains usable.
        const p90Index = Math.floor((pricePoints.length - 1) * 0.9);
        const p90 = pricePoints[p90Index] || pricePoints[pricePoints.length - 1];
        const normalized = Math.ceil(p90 / 50) * 50;

        return Math.min(20000, Math.max(1000, normalized));
    }, [allProducts]);

    useEffect(() => {
        setFilters((prev) => {
            const currentRaw = Number(prev.maxPrice);
            const current = Number.isFinite(currentRaw) ? currentRaw : sliderMaxPrice;
            if (!priceInitializedRef.current) {
                priceInitializedRef.current = true;
                return { ...prev, maxPrice: sliderMaxPrice };
            }

            const nextMax = Math.min(current, sliderMaxPrice);
            return nextMax === current ? prev : { ...prev, maxPrice: nextMax };
        });
    }, [sliderMaxPrice]);

    const clearFilters = useCallback(() => {
        setFilters({ search: "", maxPrice: sliderMaxPrice, location: "", category: "", sortBy: "newest" });
    }, [sliderMaxPrice]);

    const debouncedSearch = useDebouncedValue(filters.search.trim().toLowerCase(), 280);
    const debouncedLocation = useDebouncedValue(filters.location.trim().toLowerCase(), 280);

    const filteredProducts = useMemo(() => {
        let next = [...allProducts];

        if (debouncedSearch) {
            next = next.filter((item) =>
                [item.name, item.category, item.description]
                    .filter(Boolean)
                    .some((value) => value.toLowerCase().includes(debouncedSearch))
            );
        }

        if (filters.category) {
            next = next.filter((item) => (item.category || "").toLowerCase() === filters.category.toLowerCase());
        }

        const isPriceFilterActive = Number(filters.maxPrice) < Number(sliderMaxPrice);
        if (isPriceFilterActive) {
            const selectedMax = Number.isFinite(Number(filters.maxPrice)) ? Number(filters.maxPrice) : sliderMaxPrice;
            next = next.filter((item) => Number(item.price) <= selectedMax);
        }

        if (debouncedLocation) {
            next = next.filter((item) => (item.location || "").toLowerCase().includes(debouncedLocation));
        }

        if (filters.sortBy === "price_asc") {
            next.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        } else if (filters.sortBy === "price_desc") {
            next.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        } else {
            next.sort((a, b) => {
                const aTs = new Date(a.createdAt || 0).getTime();
                const bTs = new Date(b.createdAt || 0).getTime();
                return bTs - aTs;
            });
        }

        return next;
    }, [allProducts, debouncedSearch, debouncedLocation, filters.category, filters.maxPrice, filters.sortBy, sliderMaxPrice]);

    const categories = useMemo(() => {
        return Array.from(new Set(allProducts.map((item) => item.category).filter(Boolean))).sort();
    }, [allProducts]);

    const cartCount = useMemo(() => cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [cart]);

    const hasActiveFilters = Boolean(
        filters.search.trim() ||
        filters.location.trim() ||
        filters.category ||
        Number(filters.maxPrice) !== Number(sliderMaxPrice)
    );

    return (
        <div className="page-bg">
            <Navbar cartCount={cartCount} />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className="fixed top-20 right-4 z-50 bg-gray-900 border border-gray-700 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold"
                    >
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                            ✓
                        </div>
                        {toast}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Page Header */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="bg-white/90 backdrop-blur-xl border border-slate-200 rounded-[24px] p-6 lg:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3 tracking-tight">
                                Fresh Vegetables
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                                    <Leaf className="w-6 h-6 text-emerald-600" />
                                </div>
                            </h1>
                            <p className="text-slate-500 mt-2 font-medium">Browse and buy directly from verified farmers</p>
                        </div>
                        <div className="inline-flex self-start md:self-auto items-center gap-2 text-cyan-700 bg-cyan-50 border border-cyan-200 px-4 py-2.5 rounded-2xl text-sm font-bold shadow-sm">
                            <Sparkles className="w-4 h-4" />
                            Fresh picks updated daily
                        </div>
                    </div>
                </motion.div>

                <div className="flex flex-col lg:flex-row gap-6 items-start relative">

                    <div className="lg:hidden w-full sticky top-20 z-30 mb-2">
                        <button
                            onClick={() => setIsMobileFiltersOpen(true)}
                            className="w-full bg-white/95 backdrop-blur-md border border-gray-200 shadow-sm rounded-xl p-3 flex items-center justify-between font-semibold text-gray-800"
                        >
                            <span className="flex items-center gap-2">
                                <SlidersHorizontal className="w-5 h-5 text-green-600" />
                                Show Filters
                            </span>
                            {hasActiveFilters && (
                                <span className="bg-green-100 text-green-700 text-xs px-2.5 py-0.5 rounded-full">
                                    Active
                                </span>
                            )}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isMobileFiltersOpen && (
                            <motion.div
                                className="lg:hidden fixed inset-0 z-40 bg-slate-900/35"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsMobileFiltersOpen(false)}
                            >
                                <motion.div
                                    initial={{ x: -280 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -280 }}
                                    transition={{ duration: 0.2 }}
                                    className="w-[86%] max-w-xs h-full bg-white border-r border-slate-200 p-5"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="font-semibold text-slate-900 text-base flex items-center gap-2">
                                            <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                                            Filters
                                        </h2>
                                        <button
                                            className="w-8 h-8 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100"
                                            onClick={() => setIsMobileFiltersOpen(false)}
                                        >
                                            <X className="w-4 h-4 mx-auto" />
                                        </button>
                                    </div>
                                    <div className="h-[calc(100%-2rem)] overflow-y-auto pr-1">
                                        <FilterFields
                                            filters={filters}
                                            setFilters={setFilters}
                                            categories={categories}
                                            clearFilters={clearFilters}
                                            hasActiveFilters={hasActiveFilters}
                                            sliderMaxPrice={sliderMaxPrice}
                                        />
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <aside className="hidden lg:block lg:w-[280px] lg:sticky lg:top-24 z-20">
                        <div className="card p-5 lg:shadow-sm border border-gray-100 rounded-2xl bg-white/95 backdrop-blur-xl shadow-lg">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="font-bold text-gray-900 text-[15px] flex items-center gap-2">
                                    <SlidersHorizontal className="w-4 h-4 text-green-600" />
                                    Filters
                                </h2>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 font-semibold hover:underline">Clear all</button>
                                )}
                            </div>
                            <FilterFields
                                filters={filters}
                                setFilters={setFilters}
                                categories={categories}
                                clearFilters={clearFilters}
                                hasActiveFilters={hasActiveFilters}
                                sliderMaxPrice={sliderMaxPrice}
                            />
                        </div>
                    </aside>

                    {/* Products Grid */}
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-5 bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-4 py-3">
                            <p className="text-sm text-gray-500 font-medium">
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                                        Loading...
                                    </span>
                                ) : `${filteredProducts.length} product${filteredProducts.length !== 1 ? "s" : ""} found`}
                            </p>
                            <span className="text-xs text-slate-500">Verified sellers only</span>
                        </div>

                        {fetchError && (
                            <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                                {fetchError}
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="card overflow-hidden border border-gray-100 shadow-sm rounded-2xl">
                                        <div className="aspect-[4/3] skeleton" />
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <div className="h-5 w-3/4 skeleton rounded" />
                                                <div className="h-4 w-1/2 skeleton rounded" />
                                            </div>
                                            <div className="pt-3 border-t border-gray-50 flex items-end justify-between">
                                                <div className="h-6 w-1/3 skeleton rounded" />
                                                <div className="h-10 w-24 skeleton rounded-xl" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200 animate-fade-in shadow-sm">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-100 shadow-inner">
                                    <Leaf className="w-8 h-8 text-gray-400" />
                                </div>
                                <p className="text-xl font-bold text-gray-800 mb-1.5">No products found</p>
                                <p className="text-sm text-gray-500 mb-6">We couldn't find anything matching your criteria.</p>
                                {hasActiveFilters && (
                                    <button onClick={clearFilters} className="btn-primary text-sm px-6 py-2.5">Clear all filters</button>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                                {filteredProducts.map((product, i) => (
                                    <div key={product._id} className="animate-fade-in-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                        <VegetableCard
                                            product={product}
                                            onAddToCart={handleAddToCart}
                                            onQuickView={setQuickViewProduct}
                                            onToggleWishlist={toggleWishlist}
                                            isWishlisted={wishlist.has(product._id)}
                                            isAddingToCart={addingToCartId === product._id}
                                            isLoggedIn={!!user}
                                            userRole={user?.role}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ProductQuickViewModal
                product={quickViewProduct}
                open={Boolean(quickViewProduct)}
                onClose={() => setQuickViewProduct(null)}
            />
        </div>
    );
};

const FilterFields = ({
    filters,
    setFilters,
    categories,
    clearFilters,
    hasActiveFilters,
    sliderMaxPrice,
}) => {
    return (
        <>
            <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Search</label>
                <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        id="search-input"
                        type="text"
                        placeholder="Tomato, Carrot..."
                        className="input-field pl-[38px] text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50/50"
                        value={filters.search}
                        onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                    />
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Category</label>
                <select
                    className="input-field text-sm cursor-pointer focus:ring-green-500 focus:border-green-500 bg-gray-50/50"
                    value={filters.category}
                    onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
                >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>

            <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">
                    Max Price (₹/kg)
                    <span className="float-right text-green-600 font-extrabold">{formatRupeeValue(filters.maxPrice)}</span>
                </label>
                <input
                    type="range"
                    min="0"
                    max={Math.ceil(sliderMaxPrice)}
                    step="10"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters((prev) => ({ ...prev, maxPrice: Number(e.target.value) }))}
                />
                <div className="flex justify-between text-[11px] font-semibold text-gray-400 mt-1.5">
                    <span>{formatRupeeValue(0)}</span>
                    <span>{formatRupeeValue(sliderMaxPrice)}</span>
                </div>
            </div>

            <div className="mb-6">
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Location</label>
                <input
                    type="text"
                    placeholder="City or state..."
                    className="input-field text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50/50 transition-colors"
                    value={filters.location}
                    onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                />
            </div>

            <div className="mb-4">
                <label className="block text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Sort By</label>
                <select
                    className="input-field text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50/50 cursor-pointer transition-colors"
                    value={filters.sortBy}
                    onChange={(e) => setFilters((prev) => ({ ...prev, sortBy: e.target.value }))}
                >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {hasActiveFilters && (
                <button onClick={clearFilters} className="w-full mt-2 btn-secondary text-sm">Reset Filters</button>
            )}
        </>
    );
};

export default Products;
