import { create } from 'zustand';
import * as api from '../services/api.js';

const useEventStore = create((set) => ({
  events: [],
  loading: false,
  error: null,

  loadEvents: async (profileId) => {
    set({ loading: true, error: null });
    try {
      const params = profileId ? { profileId } : {};
      const res = await api.fetchEvents(params);
      set({ events: res.data, loading: false });
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  loadEvent: async (id) => {
    const res = await api.fetchEvent(id);
    return res.data;
  },

  createEvent: async (data) => {
    const res = await api.createEvent(data);
    const event = res.data;
    set((state) => ({
      events: [...state.events, event].sort(
        (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
      ),
    }));
    return event;
  },

  updateEvent: async (id, data) => {
    const res = await api.updateEvent(id, data);
    const updated = res.data;
    set((state) => ({
      events: state.events.map((e) => (e._id === id ? updated : e)),
    }));
    return updated;
  },
}));

export default useEventStore;
