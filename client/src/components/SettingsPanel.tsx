"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, Shield, Palette, Volume2, 
  HelpCircle, LogOut, Moon, Sparkles, Check, Edit2, 
  Trash2, AlertTriangle, UserX, Database, HardDrive, 
  ChevronRight, Lock, Eye, MessageSquare, Sun, Smartphone, QrCode,
  FileText, Image as ImageIcon, Music, Video, CheckSquare, Square,
  RefreshCw, X, Filter, CheckCircle2, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useSettingsStore, PrivacyAudience } from '@/store/settingsStore';
import UserQrModal from '@/components/UserQrModal';
import LinkedDevicesModal from '@/components/LinkedDevicesModal';
import axios from 'axios';

export default function SettingsPanel() {
  const { user, token, setAuth, logout } = useAuthStore();
  const { socket } = useChatStore();
  const { 
    theme, setTheme, 
    lastSeenPrivacy, profilePhotoPrivacy, aboutPrivacy, statusPrivacy, groupsPrivacy,
    readReceipts, enterToSend, notificationSound, 
    blockedUsers, fetchSettings, fetchBlockedUsers, updateSettings, toggleBlockUser 
  } = useSettingsStore();

  const [activeSection, setActiveSection] = useState<'main' | 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help'>('main');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState(user?.about || 'Hey there! I am using Liquid Chat 🌊');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cacheClearedToast, setCacheClearedToast] = useState(false);
  const [isLinkedDevicesOpen, setIsLinkedDevicesOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Storage State
  const [storageData, setStorageData] = useState<any>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [storageFilter, setStorageFilter] = useState<'all' | 'large' | 'media' | 'audio' | 'docs'>('all');
  const [selectedChatFilter, setSelectedChatFilter] = useState<string | null>(null);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [isDeletingFiles, setIsDeletingFiles] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [storageToast, setStorageToast] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetchSettings(token);
      fetchBlockedUsers(token);
    }
  }, [token, fetchSettings, fetchBlockedUsers]);

  useEffect(() => {
    if (user?.about) {
      setAboutText(user.about);
    }
  }, [user?.about]);

  const loadStorage = async () => {
    if (!token) return;
    setIsLoadingStorage(true);
    try {
      const res = await axios.get('/api/media/storage/manage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStorageData(res.data);
    } catch (e) {
      console.error('Failed to load storage details:', e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'storage') {
      loadStorage();
      setSelectedFileIds([]);
      setSelectedChatFilter(null);
    }
  }, [activeSection]);

  const handleSaveAbout = async () => {
    if (!token || !user) return;
    try {
      const res = await axios.put('/api/auth/profile', {
        about: aboutText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuth(res.data.user, token);
      socket?.emit('profile_updated', res.data.user);
      setIsEditingAbout(false);
    } catch (e) {}
  };

  const handleGenerateNewAvatar = async () => {
    if (!token || !user) return;
    const newSeed = `${user.username}-${Math.floor(Math.random() * 1000)}`;
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${newSeed}`;

    try {
      const res = await axios.put('/api/auth/profile', {
        avatar: newAvatar
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuth(res.data.user, token);
      socket?.emit('profile_updated', res.data.user);
    } catch (e) {}
  };

  const handlePermanentDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await axios.delete('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { clearCryptoDB } = await import('@/utils/crypto');
      await clearCryptoDB();
      logout();
      window.location.href = '/auth';
    } catch (e) {
      console.error(e);
      setIsDeleting(false);
    }
  };

  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleClearCache = async () => {
    if (!token) return;
    setIsClearingCache(true);
    try {
      await axios.delete('/api/users/me/storage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCacheClearedToast(true);
      setTimeout(() => setCacheClearedToast(false), 2500);
      loadStorage();
    } catch (e) {
      console.error(e);
    } finally {
      setIsClearingCache(false);
    }
  };

  const handleDeleteSelectedFiles = async () => {
    if (!token || selectedFileIds.length === 0) return;
    setIsDeletingFiles(true);
    try {
      const res = await axios.post('/api/media/storage/delete', {
        messageIds: selectedFileIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStorageToast(`Permanently deleted ${res.data.deletedCount} file(s) from server disk & database (${res.data.formattedFreed} freed).`);
      setTimeout(() => setStorageToast(null), 4000);
      setSelectedFileIds([]);
      setDeleteConfirmOpen(false);
      loadStorage();
    } catch (e) {
      console.error('Failed to delete files:', e);
    } finally {
      setIsDeletingFiles(false);
    }
  };

  // Filtered files in Storage view
  const filteredFiles = useMemo(() => {
    if (!storageData?.files) return [];
    let list = storageData.files;

    if (selectedChatFilter) {
      list = list.filter((f: any) => f.chatId === selectedChatFilter);
    }

    if (storageFilter === 'large') {
      list = list.filter((f: any) => f.bytes >= 5 * 1024 * 1024);
    } else if (storageFilter === 'media') {
      list = list.filter((f: any) => f.type === 'image' || f.type === 'video');
    } else if (storageFilter === 'audio') {
      list = list.filter((f: any) => f.type === 'audio');
    } else if (storageFilter === 'docs') {
      list = list.filter((f: any) => f.type === 'file');
    }

    return list;
  }, [storageData, storageFilter, selectedChatFilter]);

  const toggleFileSelection = (id: string) => {
    setSelectedFileIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const selectAllFilteredFiles = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(filteredFiles.map((f: any) => f.id));
    }
  };

  const selectedTotalBytes = useMemo(() => {
    if (!storageData?.files) return 0;
    return storageData.files
      .filter((f: any) => selectedFileIds.includes(f.id))
      .reduce((sum: number, f: any) => sum + (f.bytes || 0), 0);
  }, [storageData, selectedFileIds]);

  const formatSize = (bytes: number) => {
    if (bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            {activeSection === 'main' ? 'Settings' : 
             activeSection === 'storage' ? 'Manage Storage' :
             activeSection === 'privacy' ? 'Privacy Settings' :
             activeSection === 'chats' ? 'Chats & Appearance' :
             activeSection === 'notifications' ? 'Notifications' :
             activeSection === 'account' ? 'Account Profile' : 'Help & About'}
          </h2>
          <p className="text-xs text-foreground/60">
            {activeSection === 'storage' ? 'Inspect and permanently wipe server media' : 'Preferences, privacy & accounts'}
          </p>
        </div>
        {activeSection !== 'main' && (
          <button onClick={() => setActiveSection('main')} className="text-xs text-liquid-accent font-semibold hover:underline">
            All Settings
          </button>
        )}
      </div>

      {/* Main Settings Navigation */}
      {activeSection === 'main' && (
        <div className="space-y-4">
          {/* Profile Summary Card */}
          <div 
            onClick={() => setActiveSection('account')}
            className="bg-foreground/5 hover:bg-foreground/10 rounded-2xl p-4 border border-foreground/5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary shrink-0">
                <img src={user?.avatar} alt={user?.username} className="w-full h-full rounded-full object-cover bg-liquid-base" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{user?.username}</h3>
                <p className="text-xs text-foreground/60 truncate max-w-[150px]">{user?.about || 'Available'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsQrModalOpen(true);
                }}
                className="p-2 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-400 border border-pink-500/25 transition-all active:scale-95"
                title="My QR Code"
              >
                <QrCode size={18} />
              </button>
              <ChevronRight size={18} className="text-foreground/50" />
            </div>
          </div>

          {/* Menu Sections List */}
          <div className="space-y-1.5">
            {/* Linked Devices (WhatsApp Web style) */}
            <button
              onClick={() => setIsLinkedDevicesOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-violet-500/20 text-violet-400">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Linked Devices</h4>
                  <p className="text-[10px] text-foreground/60">Scan QR code to log into Liquid Web</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>

            {/* My QR Code */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">My QR Code</h4>
                  <p className="text-[10px] text-foreground/60">Share your Liquid ID & scan contacts</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>

            {user?.isAdmin && (
              <a
                href="/admin"
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-liquid-accent/10 hover:bg-liquid-accent/20 border border-liquid-accent/20 transition-all text-left mb-4"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-liquid-accent/20 text-liquid-accent">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-liquid-accent">Admin Dashboard</h4>
                    <p className="text-[10px] text-liquid-accent/60">Manage users and server storage</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-liquid-accent/50" />
              </a>
            )}

            <button
              onClick={() => setActiveSection('privacy')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Privacy</h4>
                  <p className="text-[10px] text-foreground/60">Status, last seen, photo, groups, blocked</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>

            <button
              onClick={() => setActiveSection('chats')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Chats & Theme</h4>
                  <p className="text-[10px] text-foreground/60">Theme, enter-to-send, wallpaper</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>

            <button
              onClick={() => setActiveSection('notifications')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Notifications</h4>
                  <p className="text-[10px] text-foreground/60">Sound effects, ringing, alerts</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>

            {/* Storage & Data */}
            <button
              onClick={() => setActiveSection('storage')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Storage and Data</h4>
                  <p className="text-[10px] text-foreground/60">Manage media & delete permanently from server</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>

            <button
              onClick={() => setActiveSection('help')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground">Help & About</h4>
                  <p className="text-[10px] text-foreground/60">FAQ, license, version 3.0 PRO</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-foreground/50" />
            </button>
          </div>

          {/* Logout & Account Actions */}
          <div className="pt-2">
            <button
              onClick={() => {
                logout();
                window.location.href = '/auth';
              }}
              className="w-full h-11 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/80 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-foreground/5"
            >
              <LogOut size={16} />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      )}

      {/* 1. Account Section */}
      {activeSection === 'account' && (
        <div className="space-y-4">
          <div className="bg-foreground/5 rounded-2xl p-4 border border-foreground/5 flex flex-col items-center text-center">
            <div className="relative group mb-3">
              <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-lg">
                <img src={user?.avatar} alt={user?.username} className="w-full h-full rounded-full object-cover bg-liquid-base" />
              </div>
              <button
                onClick={handleGenerateNewAvatar}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-liquid-accent text-liquid-dark hover:scale-110 transition-transform shadow-md"
                title="Randomize Liquid Avatar"
              >
                <Sparkles size={14} />
              </button>
            </div>

            <h3 className="text-base font-bold text-foreground">{user?.username}</h3>
            <p className="text-xs text-liquid-accent font-medium mb-3">Online Citizen</p>

            <div className="w-full bg-background/30 rounded-xl p-3 border border-foreground/5 text-left">
              <div className="flex justify-between items-center text-xs text-foreground/60 mb-1">
                <span>About Status</span>
                {!isEditingAbout ? (
                  <button onClick={() => setIsEditingAbout(true)} className="text-liquid-accent hover:underline flex items-center gap-1">
                    <Edit2 size={11} /> Edit
                  </button>
                ) : (
                  <button onClick={handleSaveAbout} className="text-green-400 hover:underline flex items-center gap-1">
                    <Check size={11} /> Save
                  </button>
                )}
              </div>
              {isEditingAbout ? (
                <input
                  type="text"
                  value={aboutText}
                  onChange={(e) => setAboutText(e.target.value)}
                  className="w-full bg-transparent border-b border-liquid-accent outline-none text-foreground text-xs py-1"
                />
              ) : (
                <p className="text-xs text-foreground/80 italic">"{user?.about || 'Hey there! I am using Liquid Chat 🌊'}"</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full h-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-medium text-xs flex items-center justify-center gap-2 transition-all"
          >
            <Trash2 size={16} />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      )}

      {/* 2. WhatsApp-Style Detailed Privacy Section */}
      {activeSection === 'privacy' && (
        <div className="space-y-4">
          <div className="bg-foreground/5 rounded-2xl p-4 border border-foreground/5 space-y-4">
            {/* Status Privacy */}
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="text-xs font-semibold text-foreground">Status / Stories Privacy</label>
                <span className="text-[10px] text-pink-400 font-mono">🌸 Contact Isolated</span>
              </div>
              <p className="text-[10px] text-foreground/50 mb-2">
                Choose who can view your 24-hour status stories. Status updates are never shared globally.
              </p>
              <select
                value={statusPrivacy}
                onChange={(e) => token && updateSettings(token, { statusPrivacy: e.target.value as PrivacyAudience })}
                className="w-full bg-background/40 border border-foreground/10 rounded-xl px-3 py-2 text-foreground text-xs outline-none"
              >
                <option value="contacts">My Contacts Only (Mutual Chat Contacts)</option>
                <option value="nobody">Nobody (Private to Me)</option>
                <option value="everyone">All Added Contacts</option>
              </select>
            </div>

            {/* Profile Photo Privacy */}
            <div className="pt-3 border-t border-foreground/5">
              <label className="text-xs font-semibold text-foreground block mb-1">Profile Photo</label>
              <select
                value={profilePhotoPrivacy}
                onChange={(e) => token && updateSettings(token, { profilePhotoPrivacy: e.target.value as PrivacyAudience })}
                className="w-full bg-background/40 border border-foreground/10 rounded-xl px-3 py-2 text-foreground text-xs outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            {/* About / Bio Privacy */}
            <div className="pt-3 border-t border-foreground/5">
              <label className="text-xs font-semibold text-foreground block mb-1">About / Bio</label>
              <select
                value={aboutPrivacy}
                onChange={(e) => token && updateSettings(token, { aboutPrivacy: e.target.value as PrivacyAudience })}
                className="w-full bg-background/40 border border-foreground/10 rounded-xl px-3 py-2 text-foreground text-xs outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            {/* Last Seen & Online */}
            <div className="pt-3 border-t border-foreground/5">
              <label className="text-xs font-semibold text-foreground block mb-1">Last Seen & Online Status</label>
              <select
                value={lastSeenPrivacy}
                onChange={(e) => token && updateSettings(token, { lastSeenPrivacy: e.target.value as PrivacyAudience })}
                className="w-full bg-background/40 border border-foreground/10 rounded-xl px-3 py-2 text-foreground text-xs outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            {/* Groups Privacy */}
            <div className="pt-3 border-t border-foreground/5">
              <label className="text-xs font-semibold text-foreground block mb-1">Groups</label>
              <p className="text-[10px] text-foreground/50 mb-2">Who can add me to groups</p>
              <select
                value={groupsPrivacy}
                onChange={(e) => token && updateSettings(token, { groupsPrivacy: e.target.value as PrivacyAudience })}
                className="w-full bg-background/40 border border-foreground/10 rounded-xl px-3 py-2 text-foreground text-xs outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts Only</option>
                <option value="nobody">Nobody (Disallow Group Adds)</option>
              </select>
            </div>

            {/* Read Receipts */}
            <div className="flex items-center justify-between pt-3 border-t border-foreground/5">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Read Receipts</h4>
                <p className="text-[10px] text-foreground/50">Show blue/cyan checkmarks when read</p>
              </div>
              <button
                onClick={() => token && updateSettings(token, { readReceipts: !readReceipts })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${readReceipts ? 'bg-liquid-accent' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${readReceipts ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          {/* Blocked Users List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider px-1">
              Blocked Contacts ({blockedUsers.length})
            </span>
            {blockedUsers.length === 0 ? (
              <div className="p-4 text-center bg-foreground/5 rounded-xl text-foreground/50 text-xs">
                No blocked contacts
              </div>
            ) : (
              blockedUsers.map(bUser => (
                <div key={bUser.id} className="flex items-center justify-between p-2.5 rounded-xl bg-foreground/5 border border-foreground/5">
                  <div className="flex items-center gap-2.5">
                    <img src={bUser.avatar} alt={bUser.username} className="w-8 h-8 rounded-full" />
                    <span className="text-xs font-semibold text-foreground">{bUser.username}</span>
                  </div>
                  <button
                    onClick={() => token && toggleBlockUser(token, bUser.id)}
                    className="px-2.5 py-1 rounded-lg bg-foreground/10 hover:bg-red-500/20 text-red-400 text-xs font-medium"
                  >
                    Unblock
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Chats & Theme Section */}
      {activeSection === 'chats' && (
        <div className="space-y-4">
          <div className="bg-foreground/5 rounded-2xl p-3 border border-foreground/5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">App Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setTheme('dark'); token && updateSettings(token, { theme: 'dark' }); }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 ${
                    theme === 'dark' ? 'bg-liquid-accent/20 border-liquid-accent text-foreground' : 'bg-foreground/5 border-foreground/5 text-foreground/60'
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
                <button
                  onClick={() => { setTheme('light'); token && updateSettings(token, { theme: 'light' }); }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 ${
                    theme === 'light' ? 'bg-liquid-accent/20 border-liquid-accent text-foreground' : 'bg-foreground/5 border-foreground/5 text-foreground/60'
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => { setTheme('system'); token && updateSettings(token, { theme: 'system' }); }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 ${
                    theme === 'system' ? 'bg-liquid-accent/20 border-liquid-accent text-foreground' : 'bg-foreground/5 border-foreground/5 text-foreground/60'
                  }`}
                >
                  <Smartphone size={16} /> System
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-foreground/5">
              <div>
                <h4 className="text-xs font-semibold text-foreground">Enter is Send</h4>
                <p className="text-[10px] text-foreground/60">Pressing Enter will send your message</p>
              </div>
              <button
                onClick={() => token && updateSettings(token, { enterToSend: !enterToSend })}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${enterToSend ? 'bg-liquid-accent' : 'bg-gray-700'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${enterToSend ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="space-y-3">
          <div className="bg-foreground/5 rounded-2xl p-3 border border-foreground/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Volume2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Synthesized Sound Effects</h4>
                <p className="text-[10px] text-foreground/60">Liquid pop on send, received & ringtones</p>
              </div>
            </div>
            <button
              onClick={() => token && updateSettings(token, { notificationSound: !notificationSound })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${notificationSound ? 'bg-liquid-accent' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notificationSound ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="bg-foreground/5 rounded-2xl p-3 border border-foreground/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/20 text-green-400">
                <Bell size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-foreground">Android Push Notifications</h4>
                <p className="text-[10px] text-foreground/60">Receive alerts when app is closed</p>
              </div>
            </div>
            <button
              onClick={async () => {
                if (typeof window !== 'undefined' && 'Notification' in window) {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted' && token) {
                    const { subscribeToPushNotifications } = await import('@/utils/push');
                    subscribeToPushNotifications(token);
                    alert("Push Notifications Enabled!");
                  } else {
                    alert("Permission denied or blocked by browser settings.");
                  }
                }
              }}
              className="px-3 py-1.5 bg-liquid-accent text-black text-xs font-bold rounded-full hover:opacity-80 transition-opacity"
            >
              Enable
            </button>
          </div>
        </div>
      )}

      {/* 5. Full WhatsApp-Style Storage & Data Section */}
      {activeSection === 'storage' && (
        <div className="space-y-4">
          {/* Storage Notification Toast */}
          {storageToast && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{storageToast}</span>
            </div>
          )}

          {/* Storage Meter Card */}
          <div className="bg-foreground/5 rounded-2xl p-4 border border-foreground/5 space-y-3">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs text-foreground/60">Server Media Storage</span>
                <h3 className="text-2xl font-black text-foreground">
                  {storageData?.formattedTotal || '0 B'}
                </h3>
              </div>
              <button
                onClick={loadStorage}
                disabled={isLoadingStorage}
                className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                title="Refresh storage calculation"
              >
                <RefreshCw size={14} className={isLoadingStorage ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Visual Multi-Color Storage Bar (WhatsApp Style) */}
            <div className="h-3 w-full bg-background/50 rounded-full overflow-hidden flex border border-foreground/10">
              {storageData && storageData.totalBytes > 0 ? (
                <>
                  <div 
                    style={{ width: `${Math.max(2, (storageData.breakdown.media.bytes / storageData.totalBytes) * 100)}%` }} 
                    className="bg-pink-500 h-full" 
                    title={`Media: ${storageData.breakdown.media.formatted}`}
                  />
                  <div 
                    style={{ width: `${Math.max(2, (storageData.breakdown.audio.bytes / storageData.totalBytes) * 100)}%` }} 
                    className="bg-cyan-400 h-full" 
                    title={`Audio: ${storageData.breakdown.audio.formatted}`}
                  />
                  <div 
                    style={{ width: `${Math.max(2, (storageData.breakdown.docs.bytes / storageData.totalBytes) * 100)}%` }} 
                    className="bg-amber-400 h-full" 
                    title={`Docs: ${storageData.breakdown.docs.formatted}`}
                  />
                </>
              ) : (
                <div className="w-full h-full bg-foreground/10" />
              )}
            </div>

            {/* Breakdown Legend Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-background/30 rounded-xl p-2 border border-foreground/5">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500 mx-auto mb-1" />
                <span className="text-[10px] text-foreground/50 block">Photos/Videos</span>
                <span className="text-xs font-bold text-foreground">
                  {storageData?.breakdown?.media?.formatted || '0 B'}
                </span>
                <span className="text-[9px] text-foreground/40 block">
                  {storageData?.breakdown?.media?.count || 0} files
                </span>
              </div>

              <div className="bg-background/30 rounded-xl p-2 border border-foreground/5">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 mx-auto mb-1" />
                <span className="text-[10px] text-foreground/50 block">Voice/Audio</span>
                <span className="text-xs font-bold text-foreground">
                  {storageData?.breakdown?.audio?.formatted || '0 B'}
                </span>
                <span className="text-[9px] text-foreground/40 block">
                  {storageData?.breakdown?.audio?.count || 0} files
                </span>
              </div>

              <div className="bg-background/30 rounded-xl p-2 border border-foreground/5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 mx-auto mb-1" />
                <span className="text-[10px] text-foreground/50 block">Documents</span>
                <span className="text-xs font-bold text-foreground">
                  {storageData?.breakdown?.docs?.formatted || '0 B'}
                </span>
                <span className="text-[9px] text-foreground/40 block">
                  {storageData?.breakdown?.docs?.count || 0} files
                </span>
              </div>
            </div>
          </div>

          {/* Chats Storage Footprint (Ranked List) */}
          {storageData?.chats && storageData.chats.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Chats Storage Breakdown
                </span>
                {selectedChatFilter && (
                  <button 
                    onClick={() => setSelectedChatFilter(null)} 
                    className="text-[11px] text-pink-400 hover:underline flex items-center gap-1"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
                {storageData.chats.map((chat: any) => {
                  const isSelected = selectedChatFilter === chat.chatId;
                  return (
                    <div
                      key={chat.chatId}
                      onClick={() => setSelectedChatFilter(isSelected ? null : chat.chatId)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors border ${
                        isSelected 
                          ? 'bg-liquid-accent/15 border-liquid-accent/30' 
                          : 'bg-foreground/5 border-transparent hover:bg-foreground/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <img 
                          src={chat.chatAvatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${chat.chatName}`} 
                          alt={chat.chatName} 
                          className="w-7 h-7 rounded-full object-cover" 
                        />
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{chat.chatName}</h4>
                          <span className="text-[10px] text-foreground/50">{chat.count} media item(s)</span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-foreground/80">
                        {chat.formattedSize}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Media Files Explorer & Permanent Deletion */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                Files on Server ({filteredFiles.length})
              </span>
              {filteredFiles.length > 0 && (
                <button
                  onClick={selectAllFilteredFiles}
                  className="text-xs text-liquid-accent font-semibold hover:underline"
                >
                  {selectedFileIds.length === filteredFiles.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <button
                onClick={() => setStorageFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  storageFilter === 'all' 
                    ? 'bg-liquid-accent text-liquid-dark' 
                    : 'bg-foreground/5 text-foreground/60 hover:text-foreground'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStorageFilter('large')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  storageFilter === 'large' 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-foreground/5 text-foreground/60 hover:text-foreground'
                }`}
              >
                &gt; 5 MB
              </button>
              <button
                onClick={() => setStorageFilter('media')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  storageFilter === 'media' 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-foreground/5 text-foreground/60 hover:text-foreground'
                }`}
              >
                Photos & Videos
              </button>
              <button
                onClick={() => setStorageFilter('audio')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  storageFilter === 'audio' 
                    ? 'bg-cyan-500 text-white' 
                    : 'bg-foreground/5 text-foreground/60 hover:text-foreground'
                }`}
              >
                Audio
              </button>
              <button
                onClick={() => setStorageFilter('docs')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                  storageFilter === 'docs' 
                    ? 'bg-amber-500 text-black' 
                    : 'bg-foreground/5 text-foreground/60 hover:text-foreground'
                }`}
              >
                Documents
              </button>
            </div>

            {/* Files List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar">
              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 bg-foreground/5 rounded-2xl text-foreground/50 text-xs">
                  No files found matching the criteria
                </div>
              ) : (
                filteredFiles.map((file: any) => {
                  const isSelected = selectedFileIds.includes(file.id);
                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleFileSelection(file.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected 
                          ? 'bg-red-500/15 border-red-500/40' 
                          : 'bg-foreground/5 border-foreground/5 hover:bg-foreground/10'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* File Thumbnail or Icon */}
                        <div className="w-10 h-10 rounded-xl bg-background/50 border border-foreground/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {file.type === 'image' && file.fileUrl ? (
                            <img src={file.fileUrl} alt={file.fileName} className="w-full h-full object-cover" />
                          ) : file.type === 'video' ? (
                            <Video size={18} className="text-pink-400" />
                          ) : file.type === 'audio' ? (
                            <Music size={18} className="text-cyan-400" />
                          ) : (
                            <FileText size={18} className="text-amber-400" />
                          )}
                        </div>

                        {/* Metadata */}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate max-w-[170px]">
                            {file.fileName}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-foreground/50">
                            <span>{file.fileSize}</span>
                            <span>•</span>
                            <span className="truncate max-w-[90px]">{file.chatName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Checkbox indicator */}
                      <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                        isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-foreground/30'
                      }`}>
                        {isSelected && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sticky Action Footer when files are selected */}
          {selectedFileIds.length > 0 && (
            <div className="sticky bottom-0 bg-liquid-base/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-foreground block">
                  {selectedFileIds.length} file(s) selected
                </span>
                <span className="text-[10px] text-red-400 font-mono">
                  {formatSize(selectedTotalBytes)} to free
                </span>
              </div>
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] hover:brightness-110 transition-all flex items-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Delete Permanently</span>
              </button>
            </div>
          )}

          {/* Deep Wipe Server Cleanup */}
          <div className="pt-2">
            <button
              onClick={handleClearCache}
              disabled={isClearingCache}
              className="w-full py-2.5 rounded-xl bg-foreground/5 hover:bg-red-500/10 text-foreground/60 hover:text-red-400 border border-foreground/5 hover:border-red-500/20 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 size={13} />
              <span>{isClearingCache ? "Wiping..." : "Wipe All Personal Chats & Stories From Server"}</span>
            </button>
            {cacheClearedToast && (
              <p className="text-center text-[11px] text-green-400 font-medium mt-1.5">
                All personal chats and stories cleared successfully!
              </p>
            )}
          </div>
        </div>
      )}

      {/* 6. Help Section */}
      {activeSection === 'help' && (
        <div className="space-y-4 text-xs text-foreground/80">
          <div className="bg-foreground/5 rounded-2xl p-4 border border-foreground/5 space-y-2">
            <h4 className="font-bold text-foreground">🌸 Liquid Cyber-Glass Messenger</h4>
            <p className="text-[11px] text-[#ff7597] font-semibold">Version 3.0.0 Kawaii Edition • 暗号化 E2EE</p>
            <p className="text-[11px] leading-relaxed">
              Equipped with 100% End-to-End Encryption, Liquid AI Copilot, HD Mirrored WebRTC calling, interactive polls, dynamic status stories, inline media streaming, and Japanese Kawaii liquid glass design.
            </p>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Permanently Delete Selected Files from Server */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm bg-liquid-base border border-red-500/40 rounded-3xl p-6 text-center space-y-4 shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle size={28} />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Permanently Delete from Server?
              </h3>
              <p className="text-xs text-foreground/70 leading-relaxed">
                You are about to permanently delete <strong>{selectedFileIds.length} file(s)</strong> ({formatSize(selectedTotalBytes)}) from the server disk and database.
                <br /><br />
                <span className="text-red-400 font-semibold">This action cannot be undone.</span> The media attachments will be permanently removed for everyone in the chat.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isDeletingFiles}
                  className="flex-1 py-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs font-semibold text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelectedFiles}
                  disabled={isDeletingFiles}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg"
                >
                  {isDeletingFiles ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permanent Account Deletion Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-liquid-base/95 border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-1">
                <AlertTriangle size={32} />
              </div>

              <h3 className="text-lg font-bold text-foreground">Delete Account Permanently?</h3>
              <p className="text-xs text-foreground/80 leading-relaxed">
                This action is irreversible. All your messages, groups, status stories, media files, and call logs will be permanently wiped from the database.
              </p>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermanentDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-foreground text-xs font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <LinkedDevicesModal
        isOpen={isLinkedDevicesOpen}
        onClose={() => setIsLinkedDevicesOpen(false)}
      />

      <UserQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onStartChatWithUser={(targetUser) => {
          useChatStore.getState().setActiveContact(targetUser);
          useChatStore.getState().setActiveGroup(null);
          setIsQrModalOpen(false);
        }}
      />
    </div>
  );
}
