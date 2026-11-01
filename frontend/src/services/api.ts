import axios from 'axios';

// Centralized API client using Vite env variable
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple wrapper to handle errors uniformly
export const get = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

export const post = async <T, R = any>(url: string, data: T): Promise<R> => {
  const response = await api.post<R>(url, data);
  return response.data;
};

export const patch = async <T, R = any>(url: string, data: T): Promise<R> => {
  const response = await api.patch<R>(url, data);
  return response.data;
};

export default api;

