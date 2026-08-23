import { create } from 'zustand';

export interface User {
  id: string;
  username: string;
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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    localStorage.setItem('liquid_token', token);
    localStorage.setItem('liquid_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('liquid_token');
    localStorage.removeItem('liquid_user');
    set({ user: null, token: null });
  },
  initAuth: () => {
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
  }
}));
