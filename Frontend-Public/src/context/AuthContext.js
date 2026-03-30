import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiService } from '../api/apiService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        try {
            const userData = await SecureStore.getItemAsync('userInfo');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (error) {
            console.error('Error cargando usuario de SecureStore', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await apiService.login({ email, password });
        if (response.ok) {
            setUser(response.data);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(response.data));
            return true;
        }
        return false;
    };

    const register = async (name, email, password) => {
        const response = await apiService.register({ name, email, password });
        if (response.ok) {
            setUser(response.data);
            await SecureStore.setItemAsync('userInfo', JSON.stringify(response.data));
            return true;
        }
        return false;
    };

    const logout = async () => {
        await SecureStore.deleteItemAsync('userInfo');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
