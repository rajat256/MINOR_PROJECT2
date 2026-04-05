const ORDER_STATUS_META = {
    Ordered: {
        label: "Pending",
        className: "bg-amber-100 text-amber-800 border border-amber-200",
    },
    Confirmed: {
        label: "Accepted",
        className: "bg-sky-100 text-sky-800 border border-sky-200",
    },
    Shipped: {
        label: "Shipped",
        className: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    },
    Delivered: {
        label: "Delivered",
        className: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    },
    Cancelled: {
        label: "Cancelled",
        className: "bg-rose-100 text-rose-800 border border-rose-200",
    },
};

export const getDisplayStatus = (status) => ORDER_STATUS_META[status]?.label || status;

const OrderStatusPill = ({ status }) => {
    const meta = ORDER_STATUS_META[status] || {
        label: status,
        className: "bg-slate-100 text-slate-700 border border-slate-200",
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${meta.className}`}>
            {meta.label}
        </span>
    );
};

export default OrderStatusPill;
