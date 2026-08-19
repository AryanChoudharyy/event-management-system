import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — unwrap { success, data, message }
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ----- Auth -----

export const fetchIdentities = () => api.get('/auth/identities');
export const selectIdentity = (profileId) => api.post('/auth/select-profile', { profileId });
export const fetchCurrentIdentity = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');

// ----- Profiles -----

export const fetchProfiles = () => api.get('/profiles');
export const fetchEventRelatedProfiles = () => api.get('/profiles/event-related');
export const fetchAssignableProfiles = () => api.get('/profiles/assignable');
export const createProfile = (data) => api.post('/profiles', data);
export const updateProfile = (id, data) => api.patch(`/profiles/${id}`, data);

// ----- Events -----

export const fetchEvents = (params = {}) => api.get('/events', { params });
export const fetchEvent = (id) => api.get(`/events/${id}`);
export const createEvent = (data) => api.post('/events', data);
export const updateEvent = (id, data) => api.patch(`/events/${id}`, data);

// ----- Event Logs -----

export const fetchEventLogs = (eventId) => api.get(`/events/${eventId}/logs`);

export default api;
