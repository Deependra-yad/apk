import { create } from 'zustand';
import axios from 'axios';

export interface User {
  id: string;
  username: string;
  liquidNumber?: string;
  avatar: string;
  about?: string;
  lastSeen?: string;
  isAdmin?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  initAuth: () => void;
  fetchMe: (tokenOverride?: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('liquid_token', token);
    localStorage.setItem('liquid_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('liquid_token');
    localStorage.removeItem('token');
    localStorage.removeItem('liquid_user');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
  fetchMe: async (tokenOverride?: string) => {
    const token = tokenOverride || get().token || (typeof window !== 'undefined' ? localStorage.getItem('liquid_token') : null);
    if (!token) return;
    try {
      const res = await axios.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.user) {
        localStorage.setItem('liquid_user', JSON.stringify(res.data.user));
        set({ user: res.data.user, token });
      }
    } catch (e) {
      console.warn("Failed to refresh user profile from /api/auth/me", e);
    }
  },
  initAuth: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('liquid_token');
    const userStr = localStorage.getItem('liquid_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token });
      } catch (e) {
        console.error("Failed to parse user from local storage");
      }
    }
    // Always refresh latest user data from server (including liquidNumber)
    if (token) {
      get().fetchMe(token);
    }
  }
}));

