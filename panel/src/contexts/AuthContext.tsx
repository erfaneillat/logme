import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AdminUser } from '../services/auth.service';

interface AuthContextType {
    user: AdminUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, user: AdminUser) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AdminUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const savedToken = authService.getToken();
        const savedUser = authService.getUser();

        if (savedToken && savedUser) {
            // Verify token is still valid
            authService.getProfile(savedToken).then((response) => {
                if (response.success && response.data?.user) {
                    setToken(savedToken);
                    setUser(response.data.user);
                } else {
                    // Token is invalid, clear storage
                    authService.logout();
                }
                setIsLoading(false);
            });
        } else {
            setIsLoading(false);
        }
    }, []);

    const login = (newToken: string, newUser: AdminUser) => {
        authService.saveToken(newToken);
        authService.saveUser(newUser);
        setToken(newToken);
        setUser(newUser);
    };

    const logout = () => {
        authService.logout();
        setToken(null);
        setUser(null);
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

