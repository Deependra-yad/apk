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
    const currentToken = get().token || (typeof window !== 'undefined' ? localStorage.getItem('liquid_token') : null);
    if (currentToken) {
      axios.post('/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${currentToken}` }
      }).catch(() => {});
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('liquid_token');
      localStorage.removeItem('liquid_user');
      localStorage.removeItem('liquid_pending_chat');
      localStorage.removeItem('liquid_fcm_token');
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
        if (res.data.user.isBanned) {
          get().logout();
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
            window.location.href = '/auth?error=AccountBanned';
          }
          return;
        }

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
    } catch (e: any) {
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        console.warn("Session expired or unauthorized. Logging out cleanly...");
        get().logout();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth?error=SessionExpired';
        }
      } else {
        console.warn("Failed to refresh user profile from /api/auth/me", e);
      }
    }
  },
  initAuth: () => {
    if (typeof window === 'undefined') return;

    // Check if authenticated credentials were passed via URL parameters (cross-subdomain redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get('token');
    const urlUser = urlParams.get('user');

    if (urlToken) {
      let parsedUser: any = null;
      if (urlUser) {
        try {
          parsedUser = JSON.parse(decodeURIComponent(urlUser));
        } catch {
          try {
            parsedUser = JSON.parse(urlUser);
          } catch {}
        }
      }

      localStorage.setItem('liquid_token', urlToken);
      if (parsedUser) {
        localStorage.setItem('liquid_user', JSON.stringify(parsedUser));
      }
      set({ user: parsedUser, token: urlToken });

      // Clean query params from URL without page reload
      urlParams.delete('token');
      urlParams.delete('user');
      const newQuery = urlParams.toString() ? `?${urlParams.toString()}` : '';
      window.history.replaceState({}, '', `${window.location.pathname}${newQuery}`);

      get().fetchMe(urlToken);
      return;
    }

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

