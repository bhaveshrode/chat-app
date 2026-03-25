import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:5000/api'
});

export const setAuthToken = (token) => {
  api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : '';
};
