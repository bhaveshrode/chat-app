import axios from 'axios';

export const api = axios.create({
    baseURL: 'http://localhost:5000/api'
});

export const setAuthToken = (token) => {
    api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : '';
};

// Auth APIs
export const registerUser = async (data) => {
    const res = await api.post('/auth/register', data);
    return res.data;
};

export const loginUser = async (data) => {
    const res = await api.post('/auth/login', data);
    return res.data;
};