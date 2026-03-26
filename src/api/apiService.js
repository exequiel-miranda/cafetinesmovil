import { BASE_URL } from './config.js';

const handleResponse = async (response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error en la petición');
    }
    return response.json();
};

export const apiService = {
    // Auth
    login: async (credentials) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });
        return handleResponse(res);
    },
    
    register: async (userData) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        return handleResponse(res);
    },

    forgotPassword: async (email) => {
        const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return handleResponse(res);
    },

    resetPassword: async (data) => {
        const res = await fetch(`${BASE_URL}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        return handleResponse(res);
    },

    // Categories
    getCategories: async () => {
        const res = await fetch(`${BASE_URL}/categories`);
        return handleResponse(res);
    },

    // Products
    getProducts: async (params = {}) => {
        const queryParams = new URLSearchParams();
        if (params.type) queryParams.append('type', params.type);
        if (params.categoryId) queryParams.append('categoryId', params.categoryId);
        if (params.popular) queryParams.append('popular', params.popular);

        const res = await fetch(`${BASE_URL}/products?${queryParams.toString()}`);
        return handleResponse(res);
    },

    getFeaturedProducts: async () => {
        const res = await fetch(`${BASE_URL}/products/featured`);
        return handleResponse(res);
    },

    getProductById: async (id) => {
        const res = await fetch(`${BASE_URL}/products/${id}`);
        return handleResponse(res);
    },

    // Orders
    getOrders: async () => {
        const res = await fetch(`${BASE_URL}/orders`);
        return handleResponse(res);
    },

    createOrder: async (orderData) => {
        const res = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        });
        return handleResponse(res);
    },

    updateOrderStatus: async (id, status) => {
        const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
        return handleResponse(res);
    }
};
