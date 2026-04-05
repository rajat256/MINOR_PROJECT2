import { io } from "socket.io-client";

let socketInstance = null;

export const getSocket = () => {
    if (socketInstance) return socketInstance;

    const baseUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
    const token = localStorage.getItem("farmfresh_token");

    socketInstance = io(baseUrl, {
        transports: ["websocket"],
        auth: { token },
    });

    return socketInstance;
};

export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};
