import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import {
    getMarketPrices,
    getMyProducts,
    getSmartPricingSuggestion,
    getWeather,
} from "../services/api";
import { useAuth } from "../context/AuthContext";

const MarketInsights = () => {
    const { user } = useAuth();
    const [weather, setWeather] = useState(null);
    const [marketPrices, setMarketPrices] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState("");
    const [suggestion, setSuggestion] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [weatherRes, marketRes] = await Promise.all([
                    getWeather({ lat: 28.6139, lon: 77.209 }),
                    getMarketPrices(),
                ]);
                setWeather(weatherRes.data.weather || null);
                setMarketPrices(marketRes.data.mandiPrices || []);

                if (user?.role === "farmer") {
                    const pRes = await getMyProducts();
                    setProducts(pRes.data.products || []);
                }
            } catch (error) {
                console.error(error);
            }
        };

        load();
    }, [user?.role]);

    useEffect(() => {
        const loadSuggestion = async () => {
            if (!selectedProduct) {
                setSuggestion(null);
                return;
            }
            try {
                const res = await getSmartPricingSuggestion(selectedProduct);
                setSuggestion(res.data);
            } catch (error) {
                console.error(error);
            }
        };

        loadSuggestion();
    }, [selectedProduct]);

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Market & Weather Insights</h1>
                    <p className="text-sm text-gray-500 mt-1">Weather, live mandi trend, and smart price guidance.</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="card p-5">
                        <p className="text-xs uppercase font-semibold text-gray-500">Real-time Weather</p>
                        {weather ? (
                            <>
                                <p className="text-3xl font-bold text-gray-900 mt-2">{weather.temperature}°C</p>
                                <p className="text-sm text-gray-600 mt-1">Wind {weather.windSpeed} km/h</p>
                                <p className="text-xs text-gray-400 mt-3">Updated: {new Date(weather.time).toLocaleString("en-IN")}</p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 mt-2">Loading weather...</p>
                        )}
                    </div>

                    <div className="card p-5">
                        <p className="text-xs uppercase font-semibold text-gray-500">Live Mandi Prices</p>
                        {marketPrices.length === 0 ? (
                            <p className="text-sm text-gray-500 mt-2">No market prices yet.</p>
                        ) : (
                            <div className="mt-3 space-y-2">
                                {marketPrices.map((item) => (
                                    <div key={item.category} className="flex justify-between text-sm">
                                        <span className="text-gray-700">{item.category}</span>
                                        <span className="font-semibold text-gray-900">₹{item.avgPrice}/kg ({item.trend})</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {user?.role === "farmer" && (
                    <div className="card p-5">
                        <p className="text-xs uppercase font-semibold text-gray-500">Smart Pricing Suggestion</p>
                        <div className="mt-3 max-w-md">
                            <select
                                className="input-field"
                                value={selectedProduct}
                                onChange={(e) => setSelectedProduct(e.target.value)}
                            >
                                <option value="">Select your product</option>
                                {products.map((item) => (
                                    <option key={item._id} value={item._id}>
                                        {item.name} (current ₹{item.price}/kg)
                                    </option>
                                ))}
                            </select>
                        </div>

                        {suggestion && (
                            <div className="mt-4 border rounded-xl p-4 bg-gray-50">
                                <p className="font-semibold text-gray-800">Suggested Price: ₹{suggestion.suggestedPrice}/kg</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Range: ₹{suggestion.recommendedRange.min} - ₹{suggestion.recommendedRange.max}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MarketInsights;
