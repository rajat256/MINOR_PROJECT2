import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const ADMIN_SIDEBAR_COLLAPSED_KEY = "farmfresh_admin_sidebar_collapsed";

const AdminSidebar = () => {
    const { pathname } = useLocation();
    const { logout } = useAuth();
    const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_KEY) === "1");
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_KEY, isCollapsed ? "1" : "0");
    }, [isCollapsed]);

    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    const links = [
        { path: "/admin/dashboard", icon: "📊", label: "Dashboard" },
        { path: "/admin/users", icon: "👥", label: "Users" },
        { path: "/admin/orders", icon: "📦", label: "Orders" },
        { path: "/admin/products", icon: "🥬", label: "Products" },
        { path: "/profile", icon: "⚙️", label: "Settings" },
    ];

    const navLinks = ({ collapsed = false }) => (
        <nav className="space-y-1.5">
            {links.map((link) => (
                <Link
                    key={link.path}
                    to={link.path}
                    title={collapsed ? link.label : undefined}
                    className={`group relative flex items-center ${collapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 rounded-xl font-medium transition-all duration-200 ${
                        pathname === link.path
                            ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                >
                    <span className="text-xl leading-none">{link.icon}</span>
                    <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${collapsed ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"}`}>{link.label}</span>
                    {collapsed && (
                        <span className="pointer-events-none absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-lg z-30">
                            {link.label}
                        </span>
                    )}
                </Link>
            ))}
        </nav>
    );

    return (
        <>
            <aside className={`hidden lg:flex ${isCollapsed ? "w-20" : "w-64"} bg-white border-r border-slate-200 flex-col min-h-[calc(100vh-64px)] overflow-y-auto z-10 sticky top-16 shadow-sm transition-[width] duration-300`}>
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

                <div className={`p-6 pb-2 ${isCollapsed ? "px-3" : ""}`}>
                    <span className={`text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block transition-all duration-200 ${isCollapsed ? "opacity-0 max-h-0 overflow-hidden mb-0" : "opacity-100"}`}>
                        Admin Menu
                    </span>
                    {navLinks({ collapsed: isCollapsed })}
                </div>

                <div className="mt-auto p-6 pt-2 border-t border-slate-100">
                    <button
                        onClick={logout}
                        title={isCollapsed ? "Logout" : undefined}
                        className={`group relative flex items-center ${isCollapsed ? "justify-center px-2" : "gap-3 px-4"} py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 hover:text-red-700 w-full transition-all duration-200`}
                    >
                        <span className="text-lg">🚪</span>
                        <span className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100"}`}>Logout</span>
                        {isCollapsed && (
                            <span className="pointer-events-none absolute left-full ml-2 hidden group-hover:block whitespace-nowrap bg-slate-900 text-white text-xs px-2 py-1 rounded-md shadow-lg z-30">
                                Logout
                            </span>
                        )}
                    </button>
                </div>
            </aside>

            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-md flex items-center justify-center"
                aria-label="Open admin sidebar"
            >
                <Menu className="w-5 h-5" />
            </button>

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
                        <p className="text-sm font-semibold text-slate-800">Admin Menu</p>
                        <button
                            type="button"
                            onClick={() => setIsMobileOpen(false)}
                            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-6 pt-4">{navLinks({ collapsed: false })}</div>

                    <div className="mt-auto p-6 pt-2 border-t border-slate-100">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 hover:text-red-700 w-full transition-all duration-200"
                        >
                            <span className="text-lg">🚪</span>
                            Logout
                        </button>
                    </div>
                </aside>
            </div>
        </>
    );
};

export default AdminSidebar;
