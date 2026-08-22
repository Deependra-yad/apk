"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, Shield, Palette, Volume2, 
  HelpCircle, LogOut, Moon, Sparkles, Check, Edit2, 
  Trash2, AlertTriangle, UserX, Database, HardDrive, 
  ChevronRight, Lock, Eye, MessageSquare, Sun, Smartphone
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import axios from 'axios';

export default function SettingsPanel() {
  const { user, token, setAuth, logout } = useAuthStore();
  const { 
    theme, setTheme, 
    lastSeenPrivacy, readReceipts, enterToSend, notificationSound, 
    blockedUsers, fetchSettings, fetchBlockedUsers, updateSettings, toggleBlockUser 
  } = useSettingsStore();

  const [activeSection, setActiveSection] = useState<'main' | 'account' | 'privacy' | 'chats' | 'notifications' | 'storage' | 'help'>('main');
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState(user?.about || 'Hey there! I am using Liquid Chat 🌊');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cacheClearedToast, setCacheClearedToast] = useState(false);

  useEffect(() => {
    if (token) {
      fetchSettings(token);
      fetchBlockedUsers(token);
    }
  }, [token, fetchSettings, fetchBlockedUsers]);

  const handleSaveAbout = async () => {
    if (!token || !user) return;
    try {
      const res = await axios.put('/api/auth/profile', {
        about: aboutText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAuth(res.data.user, token);
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
    } catch (e) {}
  };

  const handlePermanentDeleteAccount = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await axios.delete('/api/auth/account', {
        headers: { Authorization: `Bearer ${token}` }
      });
      logout();
      window.location.href = '/auth';
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
    setCacheClearedToast(true);
    setTimeout(() => setCacheClearedToast(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Settings</h2>
          <p className="text-xs text-gray-400">Preferences, privacy & accounts</p>
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
            className="bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-white/5 flex items-center justify-between cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary shrink-0">
                <img src={user?.avatar} alt={user?.username} className="w-full h-full rounded-full object-cover bg-liquid-base" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{user?.username}</h3>
                <p className="text-xs text-gray-400 truncate max-w-[170px]">{user?.about || 'Available'}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-500" />
          </div>

          {/* Menu Sections List */}
          <div className="space-y-1.5">
            <button
              onClick={() => setActiveSection('privacy')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Lock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Privacy</h4>
                  <p className="text-[10px] text-gray-400">Last seen, read receipts, blocked</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>

            <button
              onClick={() => setActiveSection('chats')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Chats & Theme</h4>
                  <p className="text-[10px] text-gray-400">Theme, enter-to-send, wallpaper</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>

            <button
              onClick={() => setActiveSection('notifications')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                  <Bell size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Notifications</h4>
                  <p className="text-[10px] text-gray-400">Sound effects, ringing, alerts</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>

            <button
              onClick={() => setActiveSection('storage')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <HardDrive size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Storage & Data</h4>
                  <p className="text-[10px] text-gray-400">Network, media cache, cleanup</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>

            <button
              onClick={() => setActiveSection('help')}
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <HelpCircle size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Help & About</h4>
                  <p className="text-[10px] text-gray-400">FAQ, license, version 2.4 PRO</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          </div>

          {/* Logout & Account Actions */}
          <div className="pt-2">
            <button
              onClick={() => {
                logout();
                window.location.href = '/auth';
              }}
              className="w-full h-11 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-white/5"
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
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center text-center">
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

            <h3 className="text-base font-bold text-white">{user?.username}</h3>
            <p className="text-xs text-liquid-accent font-medium mb-3">Online Citizen</p>

            <div className="w-full bg-black/30 rounded-xl p-3 border border-white/5 text-left">
              <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
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
                  className="w-full bg-transparent border-b border-liquid-accent outline-none text-white text-xs py-1"
                />
              ) : (
                <p className="text-xs text-gray-300 italic">"{user?.about || 'Hey there! I am using Liquid Chat 🌊'}"</p>
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

      {/* 2. Privacy Section */}
      {activeSection === 'privacy' && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-white block mb-1">Last Seen & Online Status</label>
              <select
                value={lastSeenPrivacy}
                onChange={(e) => token && updateSettings(token, { lastSeenPrivacy: e.target.value as any })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-xs outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="contacts">My Contacts</option>
                <option value="nobody">Nobody</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <h4 className="text-xs font-semibold text-white">Read Receipts</h4>
                <p className="text-[10px] text-gray-400">Show blue/cyan checkmarks</p>
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
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Blocked Contacts ({blockedUsers.length})</span>
            {blockedUsers.length === 0 ? (
              <div className="p-4 text-center bg-white/5 rounded-xl text-gray-500 text-xs">
                No blocked contacts
              </div>
            ) : (
              blockedUsers.map(bUser => (
                <div key={bUser.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <img src={bUser.avatar} alt={bUser.username} className="w-8 h-8 rounded-full" />
                    <span className="text-xs font-semibold text-white">{bUser.username}</span>
                  </div>
                  <button
                    onClick={() => token && toggleBlockUser(token, bUser.id)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-red-500/20 text-red-400 text-xs font-medium"
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
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-white block mb-1">App Theme</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => { setTheme('dark'); token && updateSettings(token, { theme: 'dark' }); }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 ${
                    theme === 'dark' ? 'bg-liquid-accent/20 border-liquid-accent text-white' : 'bg-white/5 border-white/5 text-gray-400'
                  }`}
                >
                  <Moon size={16} /> Dark
                </button>
                <button
                  onClick={() => { setTheme('light'); token && updateSettings(token, { theme: 'light' }); }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 ${
                    theme === 'light' ? 'bg-liquid-accent/20 border-liquid-accent text-white' : 'bg-white/5 border-white/5 text-gray-400'
                  }`}
                >
                  <Sun size={16} /> Light
                </button>
                <button
                  onClick={() => { setTheme('system'); token && updateSettings(token, { theme: 'system' }); }}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 ${
                    theme === 'system' ? 'bg-liquid-accent/20 border-liquid-accent text-white' : 'bg-white/5 border-white/5 text-gray-400'
                  }`}
                >
                  <Smartphone size={16} /> System
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div>
                <h4 className="text-xs font-semibold text-white">Enter is Send</h4>
                <p className="text-[10px] text-gray-400">Pressing Enter will send your message</p>
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
          <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Volume2 size={18} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white">Synthesized Sound Effects</h4>
                <p className="text-[10px] text-gray-400">Liquid pop on send, received & ringtones</p>
              </div>
            </div>
            <button
              onClick={() => token && updateSettings(token, { notificationSound: !notificationSound })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${notificationSound ? 'bg-liquid-accent' : 'bg-gray-700'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notificationSound ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      )}

      {/* 5. Storage Section */}
      {activeSection === 'storage' && (
        <div className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">Local Cache Data</span>
              <span className="text-white font-mono font-bold">12.4 MB</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-liquid-accent to-purple-500 w-1/4 rounded-full" />
            </div>
            <button
              onClick={handleClearCache}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
            >
              Clear Cached Media & Storage
            </button>
            {cacheClearedToast && (
              <p className="text-center text-[11px] text-green-400 font-medium">Cache cleared successfully!</p>
            )}
          </div>
        </div>
      )}

      {/* 6. Help Section */}
      {activeSection === 'help' && (
        <div className="space-y-4 text-xs text-gray-300">
          <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-2">
            <h4 className="font-bold text-white">Liquid WhatsApp Suite</h4>
            <p className="text-[11px] text-gray-400">Version 2.4.0 PRO (Next.js 16 + WebSockets + WebRTC)</p>
            <p className="text-[11px] leading-relaxed">
              Equipped with end-to-end WebRTC calling, WhatsApp polls, status stories, inline media streaming, group management, and liquid reactive animations.
            </p>
          </div>
        </div>
      )}

      {/* Permanent Account Deletion Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
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

              <h3 className="text-lg font-bold text-white">Delete Account Permanently?</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                This action is irreversible. All your messages, groups, status stories, media files, and call logs will be permanently wiped from the database.
              </p>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="flex-1 h-11 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePermanentDeleteAccount}
                  disabled={isDeleting}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-red-600 to-rose-500 text-white text-xs font-bold shadow-[0_0_20px_rgba(239,68,68,0.4)] disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
