import { AnimatePresence, motion } from "framer-motion";
import { CreditCard, MapPin, UserRound, CalendarClock } from "lucide-react";
import OrderStatusPill, { getDisplayStatus } from "./OrderStatusPill";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const OrderDetailsModal = ({
    open,
    order,
    isFarmer,
    onClose,
    onAccept,
    onReject,
    onDeliver,
}) => {
    if (!open || !order) return null;

    const canAcceptOrReject = isFarmer && order.orderStatus === "Ordered";
    const canDeliver = isFarmer && ["Confirmed", "Shipped"].includes(order.orderStatus);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-sm p-4 sm:p-6"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 28, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="p-5 sm:p-6 border-b border-slate-100 bg-gradient-to-r from-white to-emerald-50/60">
                        <div className="flex flex-wrap gap-3 items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-[0.14em] font-semibold text-slate-500">Order Details</p>
                                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">Order #{order._id.slice(-8).toUpperCase()}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <OrderStatusPill status={order.orderStatus} />
                                <span className="text-lg font-bold text-emerald-700 tabular-nums">{formatCurrency(order.totalPrice)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-2">
                                <UserRound className="w-4 h-4 text-slate-500 mt-0.5" />
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Customer</p>
                                    <p className="font-semibold text-slate-800">{order.customerName || "Unknown"}</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-2">
                                <CalendarClock className="w-4 h-4 text-slate-500 mt-0.5" />
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Order Date</p>
                                    <p className="font-semibold text-slate-800">
                                        {new Date(order.createdAt).toLocaleString("en-IN", {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-2 md:col-span-2">
                                <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Delivery Address</p>
                                    <p className="font-semibold text-slate-800">{order.deliveryAddress || "No address provided"}</p>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex gap-2 md:col-span-2">
                                <CreditCard className="w-4 h-4 text-slate-500 mt-0.5" />
                                <div>
                                    <p className="text-slate-500 text-xs uppercase tracking-wide">Payment Method</p>
                                    <p className="font-semibold text-slate-800">{order.paymentMethod || "Not specified"}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                                <p className="text-sm font-semibold text-slate-800">Order Summary</p>
                            </div>
                            <div className="divide-y divide-slate-100">
                                {order.products?.map((item, idx) => (
                                    <div key={`${item.productId || item.productName}-${idx}`} className="px-4 py-3 flex items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-800">{item.productName}</p>
                                            <p className="text-xs text-slate-500">{item.quantity} kg x {formatCurrency(item.price)}</p>
                                        </div>
                                        <p className="font-semibold text-slate-800 tabular-nums">{formatCurrency((item.price || 0) * (item.quantity || 0))}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-700">Total ({getDisplayStatus(order.orderStatus)})</p>
                                <p className="text-lg font-bold text-emerald-700 tabular-nums">{formatCurrency(order.totalPrice)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-white flex flex-wrap gap-2 justify-end">
                        <button onClick={onClose} className="btn-secondary px-4 py-2 rounded-lg">Close</button>
                        {canAcceptOrReject && (
                            <>
                                <button onClick={onReject} className="text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-4 py-2 rounded-lg transition-colors">Reject</button>
                                <button onClick={onAccept} className="btn-primary text-sm px-4 py-2 rounded-lg">Accept</button>
                            </>
                        )}
                        {canDeliver && (
                            <button onClick={onDeliver} className="btn-primary text-sm px-4 py-2 rounded-lg">Mark Delivered</button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default OrderDetailsModal;
