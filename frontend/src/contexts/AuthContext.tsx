import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, LoginData, RegisterData } from '@/services/authService';

interface User {
    id: number;
    email: string;
    name: string;
    role: 'employee' | 'admin';
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: LoginData) => Promise<User>;
    register: (data: RegisterData) => Promise<User>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
    }, []);

    const login = async (data: LoginData) => {
        const response = await authService.login(data);
        const { accessToken, user: userData } = response.data;

        setToken(accessToken);
        setUser(userData);

        localStorage.setItem('token', accessToken);
        localStorage.setItem('user', JSON.stringify(userData));

        return userData as User;
    };

    const register = async (data: RegisterData) => {
        const response = await authService.register(data);
        const userData = response.data;

        // Note: Registration does not return a token, user must login separately or backend must be updated.
        // For now, we just return the created user.
        return userData as User;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isAuthenticated: !!token,
                isLoading,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
