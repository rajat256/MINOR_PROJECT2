import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { getNotifications, markNotificationRead } from "../services/api";
import { getSocket } from "../services/socket";

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await getNotifications();
                setNotifications(res.data.notifications || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchNotifications();

        const socket = getSocket();
        const onNewNotification = (payload) => {
            setNotifications((prev) => [payload, ...prev]);
        };

        socket.on("notification:new", onNewNotification);
        return () => {
            socket.off("notification:new", onNewNotification);
        };
    }, []);

    const markRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications((prev) =>
                prev.map((item) => (item._id === id ? { ...item, read: true } : item))
            );
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 overflow-auto">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">Notifications</h1>

                {loading ? (
                    <p className="text-gray-500">Loading notifications...</p>
                ) : notifications.length === 0 ? (
                    <div className="card p-8 text-center text-gray-500">No notifications yet.</div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((item) => (
                            <div
                                key={item._id}
                                className={`card p-4 border-l-4 ${item.read ? "border-gray-200" : "border-blue-500"}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">{item.title}</p>
                                        <p className="text-sm text-gray-600 mt-1">{item.message}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            {new Date(item.createdAt).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    {!item.read ? (
                                        <button
                                            type="button"
                                            onClick={() => markRead(item._id)}
                                            className="text-xs btn-secondary"
                                        >
                                            Mark read
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Notifications;
