import { motion } from "framer-motion";
import { IndianRupee, Package, Clock3 } from "lucide-react";

const formatCurrency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

const OrdersAnalytics = ({ orders }) => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((order) => order.orderStatus === "Ordered").length;
    const revenue = orders
        .filter((order) => order.orderStatus !== "Cancelled")
        .reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);

    const cards = [
        {
            title: "Total Orders",
            value: totalOrders,
            icon: Package,
            accent: "from-emerald-500/10 to-lime-400/10 border-emerald-200",
            iconBg: "bg-emerald-100 text-emerald-700",
        },
        {
            title: "Revenue",
            value: formatCurrency(revenue),
            icon: IndianRupee,
            accent: "from-sky-500/10 to-cyan-400/10 border-sky-200",
            iconBg: "bg-sky-100 text-sky-700",
        },
        {
            title: "Pending Orders",
            value: pendingOrders,
            icon: Clock3,
            accent: "from-amber-500/10 to-orange-400/10 border-amber-200",
            iconBg: "bg-amber-100 text-amber-700",
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
            {cards.map((card, idx) => (
                <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className={`rounded-2xl border p-4 bg-gradient-to-br ${card.accent}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-500 font-semibold">{card.title}</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1 tabular-nums">{card.value}</p>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

export default OrdersAnalytics;
