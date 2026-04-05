const OrdersSkeleton = ({ count = 3 }) => {
    return (
        <div className="space-y-4">
            {Array.from({ length: count }).map((_, idx) => (
                <div key={idx} className="card p-5 sm:p-6 border border-slate-200 rounded-2xl bg-white">
                    <div className="skeleton h-5 w-48 rounded mb-3" />
                    <div className="skeleton h-4 w-72 rounded mb-4" />
                    <div className="flex flex-wrap gap-2 mb-4">
                        <div className="skeleton h-10 w-44 rounded-lg" />
                        <div className="skeleton h-10 w-44 rounded-lg" />
                        <div className="skeleton h-10 w-44 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        <div className="skeleton h-11 rounded-lg" />
                        <div className="skeleton h-11 rounded-lg" />
                    </div>
                    <div className="skeleton h-10 w-36 rounded-lg" />
                </div>
            ))}
        </div>
    );
};

export default OrdersSkeleton;
