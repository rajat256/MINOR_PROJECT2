import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const Navbar = ({ cartCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAdmin = user?.role === "admin";
  const isFarmer = user?.role === "farmer";
  const isAdminRoute = pathname.startsWith("/admin");
  const showAdminTopbar = isAdmin && isAdminRoute;
  const dashboardPath = isAdmin
    ? "/admin/dashboard"
    : isFarmer
      ? "/farmer/dashboard"
      : "/customer/dashboard";

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (showAdminTopbar) {
    return (
      <nav className="bg-white/95 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2.5 group"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-700/25">
                  <span className="text-white text-lg">🌿</span>
                </div>
                <span className="text-xl font-extrabold text-primary-800 tracking-tight">
                  Farm<span className="text-accent-500">Fresh</span>
                </span>
              </Link>
              <span className="hidden md:inline-flex text-xs font-bold uppercase tracking-wide text-primary-700 bg-primary-50 border border-primary-100 px-2.5 py-1 rounded-full">
                Admin
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/admin/dashboard"
                className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/users"
                className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                Users
              </Link>
              <Link
                to="/admin/orders"
                className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                Orders
              </Link>
              <Link
                to="/admin/products"
                className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                Products
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/profile"
                className="flex items-center gap-2 text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-3 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-xs font-bold text-primary-700">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                {user.name?.split(" ")[0] || "Admin"}
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium px-3 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                Logout
              </button>
            </div>

            <button
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100 flex flex-col gap-1 animate-fade-in">
              <Link
                to="/admin/dashboard"
                className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/admin/users"
                className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Users
              </Link>
              <Link
                to="/admin/orders"
                className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Orders
              </Link>
              <Link
                to="/admin/products"
                className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Products
              </Link>
              <Link
                to="/profile"
                className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Settings
              </Link>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-red-500 hover:bg-red-50 font-semibold py-2.5 px-3 rounded-xl transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-slate-200/60 dark:border-gray-800 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md shadow-primary-700/25 group-hover:shadow-lg group-hover:shadow-primary-700/30 transition-shadow duration-300">
              <span className="text-white text-lg">🌿</span>
            </div>
            <span className="text-xl font-extrabold text-primary-800 tracking-tight">
              Farm<span className="text-accent-500">Fresh</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!isAdmin && (
              <Link
                to="/products"
                className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
              >
                Browse Vegetables
              </Link>
            )}

            {user ? (
              <>
                {isAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/admin/users"
                      className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/admin/products"
                      className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                    >
                      Products
                    </Link>
                  </>
                ) : isFarmer ? (
                  <Link
                    to="/farmer/dashboard"
                    className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/customer/dashboard"
                      className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/cart"
                      className="relative text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                    >
                      <span className="flex items-center gap-1.5">
                        🛒 <span className="hidden sm:inline">Cart</span>
                      </span>
                      {cartCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 bg-accent-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-sm">
                          {cartCount > 9 ? "9+" : cartCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {!isAdmin && (
                  <Link
                    to="/orders"
                    className="text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm"
                  >
                    Orders
                  </Link>
                )}
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-slate-600 hover:text-primary-700 hover:bg-primary-50/60 font-semibold px-3 py-2 rounded-xl transition-all duration-200 text-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center text-xs font-bold text-primary-700">
                    {user.name?.[0]?.toUpperCase()}
                  </div>
                  {user.name.split(" ")[0]}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-red-600 hover:bg-red-50 font-medium px-3 py-2 rounded-xl transition-all duration-200 text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="w-px h-6 bg-slate-200 mx-1" />
                <Link
                  to="/login"
                  className="text-slate-600 hover:text-primary-700 font-semibold px-4 py-2 rounded-xl transition-all duration-200 text-sm hover:bg-primary-50/60"
                >
                  Login
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2">
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 flex flex-col gap-1 animate-fade-in">
            {!isAdmin && (
              <Link
                to="/products"
                className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse Vegetables
              </Link>
            )}
            {user ? (
              <>
                <Link
                  to={dashboardPath}
                  className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin/users"
                      className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Users
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Orders
                    </Link>
                    <Link
                      to="/admin/products"
                      className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Products
                    </Link>
                  </>
                )}
                {user.role === "customer" && (
                  <Link
                    to="/cart"
                    className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cart {cartCount > 0 && `(${cartCount})`}
                  </Link>
                )}
                {!isAdmin && (
                  <Link
                    to="/orders"
                    className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Orders
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="text-slate-700 font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  ⚙️ Settings
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-left text-red-500 hover:bg-red-50 font-semibold py-2.5 px-3 rounded-xl transition-colors text-sm"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-slate-100 my-1" />
                <div className="flex gap-2 px-3 py-2">
                  <Link
                    to="/login"
                    className="btn-secondary text-sm flex-1 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary text-sm flex-1 text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
