import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

export const getRfqs = () => api.get('/rfqs');
export const getRfqById = (id) => api.get(`/rfqs/${id}`);
export const createRfq = (data) => api.post('/rfqs', data);
export const placeBid = (id, data) => api.post(`/rfqs/${id}/bids`, data);

// backend sends { message: '...' } on errors
export const getErrorMessage = (error) =>
  error.response?.data?.message || 'Something went wrong, please try again';
