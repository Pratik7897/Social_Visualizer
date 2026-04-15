import axios from 'axios';

const api = axios.create({
  baseURL: '/_/backend',
  timeout: 10000,
});

// Attach JWT token to every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sc_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sc_token');
      // window.location.href = '/login'; // Disabled to prevent redirect loops in bypass mode
    }
    return Promise.reject(err);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// Users
export const usersAPI = {
  search: (q) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
  suggestions: () => api.get('/users/suggestions'),
  getUser: (id) => api.get(`/users/${id}`),
  getFriends: (id) => api.get(`/users/${id}/friends`),
  getUserGraph: (id) => api.get(`/users/${id}/graph`),
};

// Friends
export const friendsAPI = {
  getAll: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
  getSent: () => api.get('/friends/sent'),
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  accept: (id) => api.put(`/friends/accept/${id}`),
  reject: (id) => api.put(`/friends/reject/${id}`),
  unfriend: (userId) => api.delete(`/friends/unfriend/${userId}`),
};

// Posts
export const postsAPI = {
  getFeed: () => api.get('/posts/feed'),
  getUserPosts: (userId) => api.get(`/posts/user/${userId}`),
  create: (data) => api.post('/posts', data),
  like: (id) => api.post(`/posts/${id}/like`),
  delete: (id) => api.delete(`/posts/${id}`),
  getBtreeStats: () => api.get('/posts/btree-stats'),
  rangeQuery: (start, end) => api.get(`/posts/range?start=${start}&end=${end}`),
};

// DS Visualization
export const dsAPI = {
  getAVL: () => api.get('/ds/avl'),
  getGraph: () => api.get('/ds/graph'),
  getBTree: () => api.get('/ds/btree'),
  getBFSPath: (targetId) => api.get(`/ds/bfs/${targetId}`),
};

export default api;
