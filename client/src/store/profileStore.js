import { create } from 'zustand';
import * as api from '../services/api.js';

const useProfileStore = create((set, get) => ({
  identities: [],
  profiles: [],
  activeProfileId: null,
  currentUser: null,
  loading: false,
  error: null,

  get activeProfile() {
    const state = get();
    return state.profiles.find((p) => p._id === state.activeProfileId) || null;
  },

  loadIdentities: async () => {
    const res = await api.fetchIdentities();
    set({ identities: res.data });
    return res.data;
  },

  selectProfile: async (id) => {
    const res = await api.selectIdentity(id);
    set({ activeProfileId: res.data._id, currentUser: res.data });
    // After switching profile, reload identities (they're role-scoped)
    return res.data;
  },

  loadCurrentUser: async () => {
    const res = await api.fetchCurrentIdentity();
    set({ activeProfileId: res.data.id, currentUser: res.data });
    return res.data;
  },

  setActiveProfile: (id) => set({ activeProfileId: id }),

  loadProfiles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.fetchProfiles();
      const profiles = res.data;
      set((state) => ({
        profiles,
        loading: false,
        activeProfileId: state.activeProfileId && profiles.find((p) => p._id === state.activeProfileId)
          ? state.activeProfileId
          : state.activeProfileId,
      }));
    } catch (err) {
      set({ loading: false, error: err.message });
    }
  },

  createProfile: async (data) => {
    const res = await api.createProfile(data);
    const profile = res.data;
    set((state) => ({
      profiles: [...state.profiles, profile].sort((a, b) => {
        if (a.role === 'Admin' && b.role !== 'Admin') return -1;
        if (a.role !== 'Admin' && b.role === 'Admin') return 1;
        return a.name.localeCompare(b.name);
      }),
    }));
    return profile;
  },

  updateProfile: async (id, data) => {
    const res = await api.updateProfile(id, data);
    const updated = res.data;
    set((state) => ({
      profiles: state.profiles.map((p) => (p._id === id ? updated : p)),
      // If we updated our own profile, update currentUser too
      currentUser: state.currentUser?.id === id || state.currentUser?._id === id
        ? { ...state.currentUser, ...updated, id: updated._id }
        : state.currentUser,
    }));
    return updated;
  },

  logout: async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    set({ activeProfileId: null, currentUser: null, profiles: [], identities: [] });
  },
}));

export default useProfileStore;
