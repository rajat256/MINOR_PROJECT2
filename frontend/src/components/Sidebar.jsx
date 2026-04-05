import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";

const farmerLinks = [
    { to: "/farmer/dashboard", label: "Dashboard", icon: "📊" },
    { to: "/requests", label: "Requests", icon: "🧾" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
    { to: "/insights", label: "Market Insights", icon: "📈" },
    { to: "/products", label: "Browse Market", icon: "🛒" },
    { to: "/orders", label: "My Orders", icon: "📦" },
    { to: "/profile", label: "Settings", icon: "⚙️" },
];

const customerLinks = [
    { to: "/customer/dashboard", label: "Dashboard", icon: "🏠" },
    { to: "/requests", label: "Requests", icon: "🧾" },
    { to: "/notifications", label: "Notifications", icon: "🔔" },
    { to: "/insights", label: "Market Insights", icon: "🌦️" },
    { to: "/products", label: "Browse Vegetables", icon: "🥬" },
    { to: "/cart", label: "My Cart", icon: "🛒" },
    { to: "/orders", label: "My Orders", icon: "📦" },
    { to: "/profile", label: "Settings", icon: "⚙️" },
];

const SIDEBAR_COLLAPSED_KEY = "farmfresh_sidebar_collapsed";

const Sidebar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const links = useMemo(() => (user?.role === "farmer" ? farmerLinks : customerLinks), [user?.role]);
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, isCollapsed ? "1" : "0");
    }, [isCollapsed]);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const renderNavItems = ({ collapsed = false }) => (
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
            {links.map(({ to, label, icon }) => {
                const isActive = location.pathname === to;
                return (
                    <Link
                        key={to}
                        to={to}
                        title={collapsed ? label : undefined}
                        className={`group relative flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                            isActive
                                ? "bg-gradient-to-r from-primary-50 to-cyan-50 text-primary-800 shadow-sm border border-primary-100"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        }`}
                    >
                        <span className="text-lg shrink-0 leading-none">{icon}</span>

                        <span
                            className={`whitespace-nowrap overflow-hidden transition-all duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}
                        >
                            {label}
                        </span>

                        {isActive && !collapsed && <div className="ml-auto w-1.5 h-5 bg-primary-500 rounded-full" />}

                        {collapsed && (
                            <span className="pointer-events-none absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-lg z-30">
                                {label}
                            </span>
                        )}
                    </Link>
                );
            })}
        </nav>
    );

    const userCard = ({ collapsed = false }) => (
        <div className={`p-4 border-b border-slate-100 ${collapsed ? "px-3" : "px-4"}`}>
            <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3"}`}>
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-lg font-extrabold text-primary-800 shadow-inner">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                </div>

                <div
                    className={`overflow-hidden transition-all duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-[180px] opacity-100"}`}
                >
                    <p className="font-bold text-slate-800 truncate">{user?.name}</p>
                    <span
                        className={`text-xs font-semibold capitalize px-2 py-0.5 rounded-full ${
                            user?.role === "farmer" ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"
                        }`}
                    >
                        {user?.role}
                    </span>
                </div>
            </div>
        </div>
    );

    const footerActions = ({ collapsed = false }) => (
        <div className="p-3 border-t border-slate-100">
            <Link
                to="/"
                title={collapsed ? "FarmFresh" : undefined}
                className={`group relative flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 text-sm text-slate-500 hover:text-slate-700 rounded-xl hover:bg-slate-50 transition-colors mb-1`}
            >
                <span>🌿</span>
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"}`}>FarmFresh</span>
                {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-lg z-30">
                        FarmFresh
                    </span>
                )}
            </Link>

            <button
                onClick={logout}
                title={collapsed ? "Logout" : undefined}
                className={`group relative w-full flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 text-sm text-red-500 hover:bg-red-50 rounded-xl transition-colors font-semibold`}
            >
                <span>🚪</span>
                <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"}`}>Logout</span>
                {collapsed && (
                    <span className="pointer-events-none absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-lg z-30">
                        Logout
                    </span>
                )}
            </button>
        </div>
    );

    return (
        <>
            {/* Desktop Collapsible Sidebar */}
            <aside
                className={`hidden lg:flex ${isCollapsed ? "w-20" : "w-64"} min-h-screen bg-white/90 backdrop-blur-md border-r border-slate-200 flex-col shadow-sm transition-[width] duration-300 ease-in-out relative`}
            >
                <button
                    type="button"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    className="absolute -right-3 top-5 z-20 w-6 h-6 rounded-full border border-slate-200 bg-white text-slate-600 flex items-center justify-center shadow-sm hover:bg-slate-50"
                    aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2.5" />
                        <path d="M9 6.5v11" />
                        {isCollapsed ? <path d="M13.5 9.5l3 2.5-3 2.5" /> : <path d="M15 9.5l-3 2.5 3 2.5" />}
                    </svg>
                </button>

                {userCard({ collapsed: isCollapsed })}
                {renderNavItems({ collapsed: isCollapsed })}
                {footerActions({ collapsed: isCollapsed })}
            </aside>

            {/* Mobile Drawer Trigger */}
            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md flex items-center justify-center"
                aria-label="Open sidebar menu"
            >
                <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Drawer */}
            <div className={`lg:hidden fixed inset-0 z-50 ${isMobileOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
                <div
                    onClick={() => setIsMobileOpen(false)}
                    className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${isMobileOpen ? "opacity-100" : "opacity-0"}`}
                />

                <aside
                    className={`absolute left-0 top-0 h-full w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-xl flex flex-col transform transition-transform duration-300 ${
                        isMobileOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
                >
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-800">Menu</p>
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {userCard({ collapsed: false })}
                    {renderNavItems({ collapsed: false })}
                    {footerActions({ collapsed: false })}
                </aside>
            </div>
        </>
    );
};

export default Sidebar;
