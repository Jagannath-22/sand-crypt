// frontend/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuthContext = () => useContext(AuthContext);

export const AuthContextProvider = ({ children }) => {
    const [authUser, setAuthUser] = useState(null);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem("chat-user");
            if (storedUser) {
                const parsedUser = JSON.parse(storedUser);
                setAuthUser(parsedUser);
                console.log("AuthContext: Loaded user:", parsedUser);
            } else {
                console.log("AuthContext: No stored user found, setting to null");
                setAuthUser(null);
            }
        } catch (error) {
            console.error("AuthContext: Error parsing user from localStorage:", error);
            setAuthUser(null);
        }
    }, []);

    return (
        <AuthContext.Provider value={{ authUser, setAuthUser }}>
            {children}
        </AuthContext.Provider>
    );
};
