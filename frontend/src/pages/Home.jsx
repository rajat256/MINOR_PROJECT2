import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

const features = [
    { icon: "🌽", title: "100% Fresh", desc: "Sourced directly from farms, harvested the same day for peak freshness." },
    { icon: "💰", title: "Best Prices", desc: "No middlemen. Pay fair prices and support local farmers directly." },
    { icon: "🚚", title: "Fast Delivery", desc: "Vegetables delivered fresh right to your doorstep within hours." },
    { icon: "👨‍🌾", title: "Verified Farmers", desc: "All farmers on our platform are trusted, verified, and certified." },
];

const steps = [
    { step: "01", title: "Browse Vegetables", desc: "Explore fresh produce from farmers near you.", icon: "🔍" },
    { step: "02", title: "Add to Cart", desc: "Select quantities and add items to your cart.", icon: "🛒" },
    { step: "03", title: "Place Order", desc: "Checkout securely and track your order in real time.", icon: "📦" },
];

const Home = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* ── Hero Section ── */}
            <section className="relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-primary-400/20 blur-[120px]" />
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-400/15 blur-[100px]" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-400/10 blur-[140px]" />
                </div>
                {/* Subtle grid pattern */}
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h40v40H0z\' fill=\'none\' stroke=\'%23fff\' stroke-width=\'.5\'/%3E%3C/svg%3E")' }} />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36 flex flex-col md:flex-row items-center gap-16">
                    <div className="text-center md:text-left max-w-2xl animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-full px-5 py-1.5 text-sm text-white/90 mb-8">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            Farm fresh vegetables at your door
                        </div>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                            Fresh Vegetables,{" "}
                            <span className="bg-gradient-to-r from-accent-300 to-accent-400 bg-clip-text text-transparent">Directly</span> From Farmers
                        </h1>
                        <p className="mt-6 text-lg text-primary-100/80 leading-relaxed max-w-xl">
                            FarmFresh connects you with local farmers. Get the freshest
                            vegetables at fair prices — no middlemen, no markup.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <Link
                                to="/products"
                                className="group bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-xl text-center inline-flex items-center justify-center gap-2"
                            >
                                Shop Now
                                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
                            </Link>
                            <Link
                                to="/register"
                                className="border-2 border-white/30 hover:border-white/50 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 text-center backdrop-blur-sm"
                            >
                                Sell as Farmer 👨‍🌾
                            </Link>
                        </div>

                        <div className="mt-12 flex items-center gap-10 justify-center md:justify-start">
                            {[
                                { val: "500+", label: "Farmers" },
                                { val: "10K+", label: "Customers" },
                                { val: "50+", label: "Vegetables" },
                            ].map((stat, i) => (
                                <div key={stat.label} className="text-center animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                                    <p className="text-2xl md:text-3xl font-bold text-white">{stat.val}</p>
                                    <p className="text-sm text-primary-200/70 mt-0.5">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Hero visual */}
                    <div className="hidden md:flex flex-col items-center gap-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                        <div className="relative">
                            <div className="w-72 h-72 rounded-[2.5rem] bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg border border-white/10 flex items-center justify-center shadow-2xl shadow-primary-900/40">
                                <span className="text-[7rem] animate-float">🥦</span>
                            </div>
                            <div className="absolute -top-4 -right-6 w-20 h-20 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur border border-white/10 flex items-center justify-center shadow-lg animate-float-delayed">
                                <span className="text-4xl">🍅</span>
                            </div>
                            <div className="absolute -bottom-3 -left-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 backdrop-blur border border-white/10 flex items-center justify-center shadow-lg animate-float-slow">
                                <span className="text-3xl">🥕</span>
                            </div>
                            <div className="absolute bottom-8 -right-8 w-14 h-14 rounded-xl bg-gradient-to-br from-accent-400/20 to-accent-400/10 backdrop-blur border border-white/10 flex items-center justify-center shadow-lg animate-float">
                                <span className="text-2xl">🌽</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Wave separator */}
                <div className="absolute bottom-0 left-0 right-0">
                    <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                        <path d="M0 60L1440 60L1440 30C1200 0 960 45 720 30C480 15 240 50 0 30L0 60Z" fill="#f9fafb"/>
                    </svg>
                </div>
            </section>

            {/* ── Features Section ── */}
            <section className="py-24 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full mb-4">Why Choose Us</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                            Why Choose FarmFresh?
                        </h2>
                        <p className="mt-4 text-gray-500 text-lg max-w-2xl mx-auto">
                            The freshest produce with the most trusted delivery — straight from verified farms.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <div key={f.title} className="card card-hover p-7 text-center group animate-fade-in-up" style={{ animationDelay: `${i * 0.08}s` }}>
                                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5 group-hover:scale-110 group-hover:bg-primary-100 transition-all duration-300">
                                    {f.icon}
                                </div>
                                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <span className="inline-block text-sm font-semibold text-primary-600 bg-primary-50 px-4 py-1.5 rounded-full mb-4">Simple Process</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900">How It Works</h2>
                        <p className="mt-4 text-gray-500 text-lg">Order in 3 simple steps</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-14 left-[20%] right-[20%] h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200" />
                        {steps.map((s, i) => (
                            <div key={s.step} className="flex flex-col items-center text-center relative z-10 animate-fade-in-up" style={{ animationDelay: `${i * 0.12}s` }}>
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-3xl flex flex-col items-center justify-center mb-6 shadow-xl shadow-primary-700/25">
                                    <span className="text-2xl mb-0.5">{s.icon}</span>
                                    <span className="text-xs font-bold opacity-70">{s.step}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                                <p className="text-gray-500 text-sm max-w-xs leading-relaxed">{s.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Section ── */}
            <section className="py-24 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900" />
                <div className="absolute inset-0">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-accent-400/10 blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-primary-400/15 blur-[80px]" />
                </div>
                <div className="relative max-w-3xl mx-auto text-center px-4">
                    <div className="text-5xl mb-6">🥗</div>
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        Ready to Eat Fresh?
                    </h2>
                    <p className="mt-4 text-primary-100/70 text-lg max-w-xl mx-auto">
                        Join thousands of customers who get fresh vegetables delivered weekly. Start your healthy journey today.
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/register" className="bg-white text-primary-700 hover:bg-primary-50 font-bold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-xl">
                            Get Started Free →
                        </Link>
                        <Link to="/products" className="border-2 border-white/30 hover:border-white/50 hover:bg-white/10 text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 backdrop-blur-sm">
                            Browse Vegetables
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="bg-gray-950 text-gray-400 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                                <span className="text-white text-lg">🌿</span>
                            </div>
                            <span className="text-xl font-bold text-white">Farm<span className="text-accent-400">Fresh</span></span>
                        </div>
                        <p className="text-sm text-gray-500">© 2026 FarmFresh. Connecting farmers to customers directly.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;
