import { memo } from "react";
import { Link } from "react-router-dom";
import { Eye, Heart, MapPin, ShieldCheck, Star, User } from "lucide-react";
import { motion } from "framer-motion";

const formatDisplayPrice = (value) => {
    const numericValue = Number(value) || 0;
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numericValue);
};

const getStockInfo = (value) => {
    const numericValue = Number(value) || 0;
    if (numericValue <= 0) {
        return { label: "Out of Stock", classes: "bg-rose-50 text-rose-700 border-rose-200" };
    }
    if (numericValue <= 10) {
        return { label: "Low Stock", classes: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { label: "In Stock", classes: "bg-emerald-50 text-emerald-700 border-emerald-200" };
};

const VegetableCard = ({
    product,
    onAddToCart,
    onQuickView,
    onToggleWishlist,
    isWishlisted,
    isAddingToCart,
    isLoggedIn,
    userRole,
}) => {
    const { _id, name, price, quantity, image, location, farmerName, rating } = product;
    const stockInfo = getStockInfo(quantity);
    const isOutOfStock = Number(quantity) <= 0;
    const numericRating = Number(rating);
    const hasRating = Number.isFinite(numericRating) && numericRating > 0;

    const defaultImage = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=700&q=80";
    const imageSource = image?.startsWith("http") ? image : image ? `http://localhost:5000${image}` : defaultImage;

    return (
        <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-48px" }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{ duration: 0.2 }}
            className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 flex flex-col h-full relative"
        >
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 items-end">
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-sm ${stockInfo.classes}`}>
                    {stockInfo.label}
                </span>
            </div>

            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full border border-slate-200 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                <span className="text-[11px] font-semibold text-slate-700">Verified</span>
            </div>

            <button
                type="button"
                onClick={() => onToggleWishlist?.(_id)}
                className="absolute z-10 right-3 top-11 w-8 h-8 rounded-full border border-slate-200 bg-white/95 backdrop-blur-sm flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 transition-colors"
                title="Toggle wishlist"
            >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500 text-rose-500" : "text-slate-500"}`} />
            </button>

            <Link to={`/products/${_id}`} className="block relative aspect-[4/3] bg-slate-100 overflow-hidden">
                <img
                    src={imageSource}
                    alt={name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                        e.currentTarget.src = defaultImage;
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <button
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        onQuickView?.(product);
                    }}
                    className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/95 text-slate-700 text-xs font-semibold border border-slate-200"
                >
                    <Eye className="w-3.5 h-3.5" />
                    Quick View
                </button>
            </Link>

            <div className="p-4 flex flex-1 flex-col">
                <div className="mb-2 mt-1 flex items-start justify-between gap-2">
                    <Link to={`/products/${_id}`} className="min-w-0">
                        <h3 className="font-semibold text-slate-900 text-lg leading-tight truncate hover:text-emerald-700 transition-colors">
                            {name || "Fresh Produce"}
                        </h3>
                    </Link>
                    {hasRating && (
                        <div className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-xs font-semibold text-amber-700">{numericRating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-1.5 mb-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{farmerName?.trim() || "FarmFresh Verified"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{location?.trim() || "Location not specified"}</span>
                    </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col gap-3 mt-auto">
                    <div className="flex items-end justify-between gap-2">
                        <div className="min-w-0">
                            <span
                                className="text-[1.45rem] sm:text-2xl font-bold text-emerald-600 block leading-none tracking-tight"
                                style={{ fontFamily: "Manrope, sans-serif", fontWeight: 700 }}
                            >
                                {formatDisplayPrice(price)}
                            </span>
                            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">per kg</span>
                        </div>
                    </div>

                    {isLoggedIn && userRole === "customer" ? (
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onAddToCart?.(product)}
                            disabled={isOutOfStock || isAddingToCart}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {isAddingToCart ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                    Adding...
                                </>
                            ) : isOutOfStock ? (
                                "Sold Out"
                            ) : (
                                "Add to Cart"
                            )}
                        </motion.button>
                    ) : !isLoggedIn ? (
                        <Link to="/login" className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center transition-colors">
                            Login to Buy
                        </Link>
                    ) : null}
                </div>
            </div>
        </motion.article>
    );
};

export default memo(VegetableCard);
