import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import AdminSidebar from "../components/AdminSidebar";
import { getAdminUsers, toggleUserStatus } from "../services/api";

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await getAdminUsers({ search, role: roleFilter, limit: 50 });
            setUsers(data.users);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async (id) => {
        try {
            const { data } = await toggleUserStatus(id);
            setUsers(users.map(u => u._id === id ? { ...u, isActive: data.user.isActive } : u));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update user");
        }
    };

    const content = (
        <main className="flex-1 p-6 lg:p-8 bg-gray-50 min-h-[calc(100vh-64px)] overflow-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">User Management 👥</h1>

            <div className="card p-5 mb-6 bg-white border border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        className="input-field max-w-sm"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <select
                        className="input-field max-w-[200px]"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">All Roles</option>
                        <option value="farmer">Farmers</option>
                        <option value="customer">Customers</option>
                    </select>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-slate-50 text-xs uppercase text-slate-700 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Name</th>
                                <th className="px-6 py-4 font-semibold">Email</th>
                                <th className="px-6 py-4 font-semibold">Role</th>
                                <th className="px-6 py-4 font-semibold">Joined</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center">
                                        <div className="inline-block animate-spin text-2xl mb-2">⏳</div>
                                        <p>Loading users...</p>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                                        No users found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                users.map(user => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                                                user.role === 'farmer' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.isActive ? (
                                                <span className="flex items-center gap-1.5 text-green-600 font-medium text-xs">
                                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-red-500 font-medium text-xs">
                                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Banned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleToggleStatus(user._id)}
                                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                                                    user.isActive 
                                                        ? "text-red-600 bg-red-50 hover:bg-red-100" 
                                                        : "text-green-600 bg-green-50 hover:bg-green-100"
                                                }`}
                                            >
                                                {user.isActive ? "Ban User" : "Unban User"}
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

export default AdminUsers;
