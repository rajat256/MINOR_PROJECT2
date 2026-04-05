import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, registerUser } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("farmfresh_token"));
    const [loading, setLoading] = useState(true);

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("farmfresh_token");
        localStorage.removeItem("farmfresh_user");
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("farmfresh_user");
        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                logout();
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
        const { data } = await loginUser({ email, password });
        setUser(data);
        setToken(data.token);
        localStorage.setItem("farmfresh_token", data.token);
        localStorage.setItem("farmfresh_user", JSON.stringify(data));
        return data;
    };

    const register = async (formData) => {
        const { data } = await registerUser(formData);
        setUser(data);
        setToken(data.token);
        localStorage.setItem("farmfresh_token", data.token);
        localStorage.setItem("farmfresh_user", JSON.stringify(data));
        return data;
    };

    const updateUser = (updatedData) => {
        const merged = { ...user, ...updatedData };
        setUser(merged);
        localStorage.setItem("farmfresh_user", JSON.stringify(merged));
    };

    return (
        <AuthContext.Provider
            value={{ user, token, loading, login, register, logout, updateUser }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
};

export default AuthContext;
