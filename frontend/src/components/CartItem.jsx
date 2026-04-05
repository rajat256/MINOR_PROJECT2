import { memo } from "react";

const CartItem = ({ item, onRemove, onUpdateQuantity, isRemoving = false, maxQuantity = 99 }) => {
    const { productId, name, image, price, quantity } = item;
    const safeQuantity = Number.isFinite(Number(quantity)) ? Math.max(1, Number(quantity)) : 1;

    const formatCurrency = (value) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(Number(value) || 0);

    const defaultImage = `https://placehold.co/80x80/e8f5e9/16a34a?text=${encodeURIComponent(name?.[0] || "V")}`;
    const imageSource = image?.startsWith("http")
        ? image
        : image
        ? `http://localhost:5000${image}`
        : defaultImage;

    return (
        <div className={`card border border-slate-200 p-4 md:p-5 flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-200 ${isRemoving ? "opacity-0 scale-[0.98] translate-x-2" : "opacity-100 scale-100 translate-x-0"}`}>
            {/* Image */}
            <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 border border-slate-200 self-start sm:self-auto">
                <img
                    src={imageSource}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.src = defaultImage; }}
                />
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0 w-full">
                <h4 className="font-semibold text-slate-900 truncate text-lg leading-tight">{name}</h4>
                <p className="text-primary-700 font-bold text-xl mt-1 tracking-tight">{formatCurrency(price)}/kg</p>
                <p className="text-sm font-medium text-slate-500">Subtotal: {formatCurrency(price * safeQuantity)}</p>
            </div>

            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3">
                {/* Quantity Controls */}
                <div className="inline-flex items-center gap-2 flex-shrink-0 bg-slate-50 border border-slate-200 rounded-full px-2 py-1">
                    <button
                        onClick={() => onUpdateQuantity(productId, Math.max(1, safeQuantity - 1))}
                        disabled={safeQuantity <= 1}
                        className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        −
                    </button>
                    <span className="w-10 text-center font-semibold text-slate-900">{safeQuantity}</span>
                    <button
                        onClick={() => onUpdateQuantity(productId, Math.min(maxQuantity, safeQuantity + 1))}
                        disabled={safeQuantity >= maxQuantity}
                        className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        +
                    </button>
                </div>

                {/* Remove */}
                <button
                    onClick={() => onRemove(productId)}
                    className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    title="Remove item"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default memo(CartItem);
