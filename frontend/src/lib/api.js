import axios from 'axios';
import { getToken } from './supabase';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

// OCR API
export const ocrAPI = {
  extract: (image_base64, language = 'en') => 
    api.post('/ocr', { image_base64, language }),
};

// Quiz APIs
export const quizAPI = {
  generate: (text, difficulty, num_questions, language) => 
    api.post('/quiz/generate', { text, difficulty, num_questions, language }),
  submit: (data) => api.post('/quiz/submit', data),
  history: () => api.get('/quiz/history'),
};

// Dashboard API
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Leaderboard API
export const leaderboardAPI = {
  get: () => api.get('/leaderboard'),
};

// Friends APIs
export const friendsAPI = {
  list: () => api.get('/friends'),
  request: (friend_id) => api.post('/friends/request', { friend_id }),
  accept: (request_id) => api.post(`/friends/accept/${request_id}`),
  remove: (friend_id) => api.delete(`/friends/${friend_id}`),
  search: (q) => api.get('/users/search', { params: { q } }),
};

// Groups APIs
export const groupsAPI = {
  list: () => api.get('/groups'),
  create: (name, members = []) => api.post('/groups', { name, members }),
  addMember: (group_id, friend_id) => 
    api.post(`/groups/${group_id}/members`, { friend_id }),
};

// Messages APIs
export const messagesAPI = {
  get: (group_id) => api.get(`/messages/${group_id}`),
  send: (group_id, content) => api.post('/messages', { group_id, content }),
};

// Profile API
export const profileAPI = {
  update: (data) => api.put('/profile', data),
};

export default api;
