import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { getAdminProducts, deleteAdminProduct } from "../services/api";

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminProducts();
            setProducts(data.products);
        } catch (err) {
            console.error("Failed to fetch products", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Are you sure you want to remove "${name}" from the platform?`)) return;
        try {
            await deleteAdminProduct(id);
            setProducts(products.filter(p => p._id !== id));
            alert("Product removed successfully");
        } catch (err) {
            alert(err.response?.data?.message || "Failed to delete product");
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.farmerId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const content = (
        <main className="flex-1 p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Product Moderation 🥬</h1>

            <div className="card p-5 mb-6 bg-white border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        <input
                            type="text"
                            placeholder="Search products or farmers..."
                            className="input-field pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <p className="text-sm font-medium text-gray-500">
                        Total Listings: {products.length}
                    </p>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Product</th>
                                <th className="px-6 py-4 font-semibold">Farmer</th>
                                <th className="px-6 py-4 font-semibold">Price/Qty</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center">
                                        <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
                                        <p>Refreshing inventory...</p>
                                    </td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-10 text-center text-gray-400 font-medium">
                                        No products found listed on the platform.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map(product => (
                                    <tr key={product._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                                                    <img 
                                                        src={product.image} 
                                                        alt={product.name} 
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.src = "https://via.placeholder.com/40?text=📦"}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900">{product.name}</div>
                                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{product.category}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-gray-700 font-medium">{product.farmerId?.name}</div>
                                            <div className="text-xs text-gray-400">{product.farmerId?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-primary-600">₹{product.price}/kg</div>
                                            <div className="text-xs text-gray-400">Stock: {product.quantity}kg</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {product.quantity > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-[10px] font-bold">IN STOCK</span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-[10px] font-bold">OUT OF STOCK</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDelete(product._id, product.name)}
                                                className="text-white bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
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

export default AdminProducts;
