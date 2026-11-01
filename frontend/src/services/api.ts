import axios from 'axios';

// Centralized API client using Vite env variable
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple wrapper to handle errors uniformly
export const get = async <T = any>(url: string, params?: Record<string, any>): Promise<T> => {
  const response = await api.get<T>(url, { params });
  return response.data;
};

export const post = async <R = any, T = any>(url: string, data?: T): Promise<R> => {
  const response = await api.post<R>(url, data);
  return response.data;
};

export const patch = async <R = any, T = any>(url: string, data?: T): Promise<R> => {
  const response = await api.patch<R>(url, data);
  return response.data;
};

export default api;
