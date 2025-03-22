import axios from 'axios';
import { toast } from 'react-toastify';

const instance = axios.create({
    baseURL: 'http://localhost:3000',
    withCredentials: true,
    timeout: 10000, // 10 seconds timeout
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Add a request interceptor
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.token = token;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Add a response interceptor
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === 'ERR_NETWORK') {
            console.error('Network Error - Server might be down');
            toast.error('Server connection failed. Please check if the server is running and try again.');
        } else if (error.code === 'ECONNABORTED') {
            console.error('Request timed out');
            toast.error('Request timed out. Please try again.');
        } else if (error.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        } else if (error.response?.status === 0) {
            console.error('CORS Error - Server might be down or CORS not configured');
            toast.error('Unable to connect to server. Please check if the server is running.');
        } else {
            console.error('API Error:', error);
            toast.error(error.response?.data?.message || 'An unexpected error occurred');
        }
        return Promise.reject(error);
    }
);

export default instance; 