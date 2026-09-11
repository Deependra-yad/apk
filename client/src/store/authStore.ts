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
  publicKey?: string;
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
    if (user?.id) {
      import('../utils/crypto').then(({ ensureUserKeyPair }) => {
        ensureUserKeyPair(user.id, token);
      }).catch(() => {});
    }
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('liquid_') || key === 'token' || key === 'user') {
          localStorage.removeItem(key);
        }
      });
      import('./chatStore').then(({ useChatStore }) => {
        useChatStore.getState().resetChatStore();
      }).catch(() => {});
    }
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
        const currentUser = get().user;
        const newUser = res.data.user;
        localStorage.setItem('liquid_user', JSON.stringify(newUser));
        
        // E2EE Key Management
        try {
          const { ensureUserKeyPair, exportPublicKey } = await import('../utils/crypto');
          const keyPair = await ensureUserKeyPair(newUser.id, token);
          if (keyPair && !newUser.publicKey) {
            newUser.publicKey = await exportPublicKey(keyPair.publicKey);
          }
        } catch (err) {
          console.error('Failed to initialize E2EE keys:', err);
        }

        if (!currentUser || 
            currentUser.id !== newUser.id || 
            currentUser.username !== newUser.username || 
            currentUser.liquidNumber !== newUser.liquidNumber || 
            currentUser.avatar !== newUser.avatar ||
            currentUser.about !== newUser.about ||
            currentUser.publicKey !== newUser.publicKey) {
          set({ user: newUser, token });
        }
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

