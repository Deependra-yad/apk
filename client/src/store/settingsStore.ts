import { create } from 'zustand';
import axios from 'axios';

export type PrivacyAudience = 'everyone' | 'contacts' | 'nobody';

interface SettingsState {
  theme: 'dark' | 'light' | 'system';
  lastSeenPrivacy: PrivacyAudience;
  profilePhotoPrivacy: PrivacyAudience;
  aboutPrivacy: PrivacyAudience;
  statusPrivacy: PrivacyAudience;
  groupsPrivacy: PrivacyAudience;
  readReceipts: boolean;
  enterToSend: boolean;
  notificationSound: boolean;
  wallpaper: string | null;
  blockedUsers: any[];

  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  updateSettings: (token: string, newSettings: Partial<SettingsState>) => Promise<void>;
  fetchSettings: (token: string) => Promise<void>;
  fetchBlockedUsers: (token: string) => Promise<void>;
  toggleBlockUser: (token: string, blockedId: string) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: 'dark',
  lastSeenPrivacy: 'everyone',
  profilePhotoPrivacy: 'everyone',
  aboutPrivacy: 'everyone',
  statusPrivacy: 'contacts',
  groupsPrivacy: 'everyone',
  readReceipts: true,
  enterToSend: true,
  notificationSound: true,
  wallpaper: null,
  blockedUsers: [],

  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      if (theme === 'light') {
        document.documentElement.classList.add('light-theme');
      } else {
        document.documentElement.classList.remove('light-theme');
      }
    }
  },

  fetchSettings: async (token) => {
    try {
      const res = await axios.get('/api/users/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({
        theme: res.data.theme || 'dark',
        lastSeenPrivacy: res.data.lastSeenPrivacy || 'everyone',
        profilePhotoPrivacy: res.data.profilePhotoPrivacy || 'everyone',
        aboutPrivacy: res.data.aboutPrivacy || 'everyone',
        statusPrivacy: res.data.statusPrivacy || 'contacts',
        groupsPrivacy: res.data.groupsPrivacy || 'everyone',
        readReceipts: res.data.readReceipts !== undefined ? res.data.readReceipts : true,
        enterToSend: res.data.enterToSend !== undefined ? res.data.enterToSend : true,
        notificationSound: res.data.notificationSound !== undefined ? res.data.notificationSound : true,
        wallpaper: res.data.wallpaper || null
      });
    } catch (e) {}
  },

  updateSettings: async (token, newSettings) => {
    set(newSettings);
    try {
      await axios.put('/api/users/settings', newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}
  },

  fetchBlockedUsers: async (token) => {
    try {
      const res = await axios.get('/api/users/blocked', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ blockedUsers: Array.isArray(res.data) ? res.data : [] });
    } catch (e) {
      set({ blockedUsers: [] });
    }
  },

  toggleBlockUser: async (token, blockedId) => {
    try {
      const res = await axios.post('/api/users/block', { blockedId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      get().fetchBlockedUsers(token);
      return res.data.isBlocked;
    } catch (e) {
      return false;
    }
  }
}));
