const Product = require("../models/Product");

const buildWeatherSummary = (data) => {
    const current = data?.current;
    if (!current) {
        return null;
    }

    return {
        temperature: current.temperature_2m,
        windSpeed: current.wind_speed_10m,
        weatherCode: current.weather_code,
        isDay: current.is_day,
        time: current.time,
    };
};

const getWeather = async (req, res) => {
    try {
        const lat = Number(req.query.lat || 28.6139);
        const lon = Number(req.query.lon || 77.209);

        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code,is_day&hourly=temperature_2m&timezone=auto`
        );

        if (!response.ok) {
            throw new Error("Weather provider unavailable");
        }

        const payload = await response.json();
        res.json({ success: true, weather: buildWeatherSummary(payload), raw: payload });
    } catch (error) {
        res.status(200).json({
            success: true,
            weather: {
                temperature: 29,
                windSpeed: 9,
                weatherCode: 1,
                isDay: 1,
                time: new Date().toISOString(),
            },
            source: "fallback",
            note: `Weather API fallback: ${error.message}`,
        });
    }
};

const getMarketPrices = async (req, res) => {
    try {
        const products = await Product.find({}).select("name category price").lean();
        const grouped = products.reduce((acc, item) => {
            const key = item.category || "Vegetable";
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(item.price);
            return acc;
        }, {});

        const mandiPrices = Object.entries(grouped).map(([category, values]) => {
            const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
            const min = Math.min(...values);
            const max = Math.max(...values);
            const trend = avg >= 35 ? "rising" : "stable";
            return {
                category,
                avgPrice: Number(avg.toFixed(2)),
                minPrice: min,
                maxPrice: max,
                trend,
                updatedAt: new Date().toISOString(),
            };
        });

        res.json({ success: true, mandiPrices });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getSmartPricingSuggestion = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const sameCategory = await Product.find({ category: product.category }).select("price").lean();
        const marketAvg = sameCategory.length
            ? sameCategory.reduce((sum, item) => sum + item.price, 0) / sameCategory.length
            : product.price;

        const premiumFactor = product.quantity < 20 ? 1.06 : 1.02;
        const demandFactor = marketAvg > product.price ? 1.04 : 0.98;
        const suggested = marketAvg * premiumFactor * demandFactor;

        res.json({
            success: true,
            product: {
                id: product._id,
                name: product.name,
                currentPrice: product.price,
                category: product.category,
                quantity: product.quantity,
            },
            marketAverage: Number(marketAvg.toFixed(2)),
            suggestedPrice: Number(suggested.toFixed(2)),
            recommendedRange: {
                min: Number((suggested * 0.95).toFixed(2)),
                max: Number((suggested * 1.05).toFixed(2)),
            },
            reasoning: [
                "Based on live listed market prices in your category",
                "Adjusts for stock availability and current demand",
                "Helps avoid underpricing while staying competitive",
            ],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getWeather,
    getMarketPrices,
    getSmartPricingSuggestion,
};
