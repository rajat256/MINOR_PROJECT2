import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { getAdminStats } from "../services/api";

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await getAdminStats();
                setStats(data.stats);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const content = (
        <main className="flex-1 p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Dashboard 📊</h1>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin text-4xl">⏳</div>
                </div>
            ) : !stats ? (
                 <div className="text-center text-gray-500 py-10">Failed to load statistics.</div>
            ) : (
                <div className="space-y-6">
                    {/* Top Stats Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card p-5 border-l-4 border-l-blue-500">
                            <p className="text-sm font-semibold text-gray-500 mb-1">Total Revenue</p>
                            <p className="text-3xl font-extrabold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="card p-5 border-l-4 border-l-green-500">
                            <p className="text-sm font-semibold text-gray-500 mb-1">Total Users</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                            <p className="text-xs text-gray-400 mt-2">
                                {stats.totalFarmers} Farmers · {stats.totalCustomers} Customers
                            </p>
                        </div>
                        <div className="card p-5 border-l-4 border-l-purple-500">
                            <p className="text-sm font-semibold text-gray-500 mb-1">Total Orders</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
                        </div>
                        <div className="card p-5 border-l-4 border-l-orange-500">
                            <p className="text-sm font-semibold text-gray-500 mb-1">Active Products</p>
                            <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Daily Orders Trend */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Past 7 Days Revenue</h2>
                            <div className="space-y-3">
                                {stats.dailyOrders.length === 0 ? (
                                    <p className="text-sm text-gray-400">No recent orders</p>
                                ) : (
                                    stats.dailyOrders.map(day => (
                                        <div key={day._id} className="flex items-center justify-between">
                                            <span className="text-sm text-gray-500">{day._id}</span>
                                            <div className="flex items-center gap-4">
                                                <span className="text-xs text-gray-400">{day.count} orders</span>
                                                <span className="text-sm font-bold text-gray-800 w-20 text-right">₹{day.revenue.toFixed(0)}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Order Status Breakdown */}
                        <div className="card p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Order Status Breakdown</h2>
                            <div className="space-y-4">
                                {stats.statusBreakdown.map(stat => {
                                    const percent = stats.totalOrders > 0 ? (stat.count / stats.totalOrders) * 100 : 0;
                                    let colorStr = "bg-gray-500";
                                    if (stat._id === "Delivered") colorStr = "bg-green-500";
                                    else if (stat._id === "Cancelled") colorStr = "bg-red-500";
                                    else if (stat._id === "Confirmed" || stat._id === "Shipped") colorStr = "bg-blue-500";
                                    else if (stat._id === "Ordered") colorStr = "bg-amber-500";

                                    return (
                                        <div key={stat._id}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-medium text-gray-700">{stat._id}</span>
                                                <span className="text-gray-500">{stat.count} ({percent.toFixed(1)}%)</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div className={`${colorStr} h-2 rounded-full`} style={{ width: `${percent}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="flex">
                <AdminSidebar />
                {content}
            </div>
        </div>
    );
};

export default AdminDashboard;
