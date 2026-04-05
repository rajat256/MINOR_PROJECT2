import { memo, useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Percent, Truck } from "lucide-react";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const OrderSummary = ({
    cart,
    discount,
    totalItems,
    finalTotal,
    canCheckout,
    isCheckingOut,
    onCheckout,
}) => {
    const lineItems = useMemo(
        () =>
            cart.map((item) => ({
                id: item.productId,
                label: `${item.name} x ${item.quantity}kg`,
                amount: Number(item.price) * Number(item.quantity),
            })),
        [cart]
    );

    return (
        <div className="card p-6 sticky top-20 border border-slate-200 rounded-3xl bg-white/95 shadow-sm animate-fade-in-up">
            <h2 className="text-2xl font-semibold text-slate-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm max-h-52 overflow-auto pr-1">
                {lineItems.map((entry) => (
                    <div key={entry.id} className="flex justify-between text-slate-600 gap-3">
                        <span className="truncate">{entry.label}</span>
                        <span className="font-medium text-slate-800 whitespace-nowrap tabular-nums">{formatCurrency(entry.amount)}</span>
                    </div>
                ))}
            </div>

            <div className="border-t border-dashed border-slate-200 my-4" />

            <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-2">
                        <Percent className="w-4 h-4 text-emerald-600" />
                        Promo Savings
                    </span>
                    <span className="text-emerald-700 font-semibold">-{formatCurrency(discount)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-blue-600" />
                        Delivery
                    </span>
                    <span className="text-emerald-700 font-semibold">FREE</span>
                </div>
            </div>

            <div className="flex justify-between items-end text-slate-800 mb-1">
                <span className="text-lg font-semibold">Total</span>
                <span
                    className="text-primary-700 text-[1.35rem] md:text-[1.5rem] leading-none tracking-tight"
                    style={{
                        fontFamily: "Manrope, sans-serif",
                        fontWeight: 800,
                        fontVariantNumeric: "normal",
                        fontFeatureSettings: "normal",
                    }}
                >
                    {formatCurrency(finalTotal)}
                </span>
            </div>
            <p className="text-sm font-medium text-slate-500 mb-5">{totalItems} items · Free delivery</p>

            <button
                disabled={!canCheckout || isCheckingOut || totalItems === 0}
                onClick={onCheckout}
                className="w-full py-3 text-base rounded-xl flex items-center justify-center gap-2 uppercase tracking-wide font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                id="checkout-btn"
            >
                {isCheckingOut ? (
                    <>
                        <span className="inline-block w-4 h-4 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        Proceed to Checkout
                        <ChevronRight className="w-4 h-4" />
                    </>
                )}
            </button>

            {!canCheckout && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Please login to continue checkout.
                </p>
            )}

            <Link to="/products" className="block text-center text-sm text-primary-600 hover:underline mt-4 font-medium">
                Continue Shopping →
            </Link>
        </div>
    );
};

export default memo(OrderSummary);
