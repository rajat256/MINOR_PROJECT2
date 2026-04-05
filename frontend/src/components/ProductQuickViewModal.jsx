import { X, MapPin, Star, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const formatPrice = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const ProductQuickViewModal = ({ product, open, onClose }) => {
    if (!open || !product) return null;

    const defaultImage = "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=900&q=80";
    const imageSource = product.image?.startsWith("http")
        ? product.image
        : product.image
        ? `http://localhost:5000${product.image}`
        : defaultImage;
    const numericRating = Number(product.rating);
    const hasRating = Number.isFinite(numericRating) && numericRating > 0;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 16 }}
                    transition={{ duration: 0.18 }}
                    className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
                        <h3 className="text-xl font-semibold text-slate-900">Quick View</h3>
                        <button onClick={onClose} className="w-11 h-11 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 transition-colors">
                            <X className="w-5 h-5 mx-auto" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:min-h-[460px]">
                        <div className="bg-slate-100 p-4 md:p-5">
                            <div className="relative w-full h-[320px] md:h-[520px] rounded-2xl overflow-hidden">
                                <img
                                    src={imageSource}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = defaultImage;
                                    }}
                                />
                            </div>
                        </div>
                        <div className="p-6 md:p-7 flex flex-col">
                            <h4 className="text-3xl font-semibold text-slate-900 leading-tight">{product.name || "Fresh Produce"}</h4>
                            {hasRating && (
                                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 w-fit">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="text-sm font-semibold text-amber-700">{numericRating.toFixed(1)}</span>
                                </div>
                            )}
                            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 inline-flex flex-col w-fit">
                                <p className="text-emerald-700 text-4xl font-bold tracking-tight leading-none">{formatPrice(product.price)}</p>
                                <p className="text-xs font-semibold text-emerald-600/75 uppercase tracking-wide mt-1">per kg</p>
                            </div>

                            <div className="mt-6 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>{product.farmerName?.trim() || "FarmFresh Verified"}</span>
                                </div>
                                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                    <span>{product.location?.trim() || "Location not specified"}</span>
                                </div>
                            </div>

                            <p className="mt-6 text-sm text-slate-500 leading-relaxed">
                                {product.description?.trim() || "Freshly harvested produce from trusted farmers. Tap on the product card to view complete details."}
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ProductQuickViewModal;
