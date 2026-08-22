"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, Edit2, Check, Sparkles, LogOut, 
  Upload, User, Smile, ShieldCheck, AlertCircle 
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_STATUSES = [
  "🌊 Living the Liquid life",
  "⚡ Available & Ready",
  "🚀 Busy building apps",
  "🎧 Listening to music",
  "💤 Sleeping / Do Not Disturb",
  "💼 In a meeting",
  "🔋 Battery low"
];

const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aria",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Maya",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Cyber",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Matrix",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Happy"
];

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user, token, setAuth, logout } = useAuthStore();
  const { socket } = useChatStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [usernameText, setUsernameText] = useState(user?.username || '');
  const [nameError, setNameError] = useState('');

  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [aboutText, setAboutText] = useState(user?.about || 'Hey there! I am using Liquid Chat 🌊');

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setUsernameText(user.username);
      setAboutText(user.about || 'Hey there! I am using Liquid Chat 🌊');
    }
  }, [user]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // 1. Save Username
  const handleSaveUsername = async () => {
    if (!token || !user || !usernameText.trim()) return;
    setNameError('');
    try {
      const res = await axios.put('/api/auth/profile', {
        username: usernameText.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAuth(res.data.user, token);
      socket?.emit('profile_updated', res.data.user);
      setIsEditingName(false);
      showSuccess('Username updated successfully!');
    } catch (e: any) {
      setNameError(e.response?.data?.error || 'Failed to update username');
    }
  };

  // 2. Save About / Bio
  const handleSaveAbout = async (customText?: string) => {
    if (!token || !user) return;
    const textToSave = customText !== undefined ? customText : aboutText;
    try {
      const res = await axios.put('/api/auth/profile', {
        about: textToSave
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAuth(res.data.user, token);
      socket?.emit('profile_updated', res.data.user);
      setIsEditingAbout(false);
      if (customText) setAboutText(customText);
      showSuccess('Status updated!');
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Randomize / Generate Avatar
  const handleGenerateNewAvatar = async () => {
    if (!token || !user) return;
    const randomSeed = `${user.username}-${Math.floor(Math.random() * 10000)}`;
    const newAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${randomSeed}`;

    try {
      const res = await axios.put('/api/auth/profile', {
        avatar: newAvatar
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAuth(res.data.user, token);
      socket?.emit('profile_updated', res.data.user);
      showSuccess('New avatar generated!');
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Select Avatar Preset
  const handleSelectPresetAvatar = async (avatarUrl: string) => {
    if (!token || !user) return;
    try {
      const res = await axios.put('/api/auth/profile', {
        avatar: avatarUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAuth(res.data.user, token);
      socket?.emit('profile_updated', res.data.user);
      showSuccess('Avatar updated!');
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Upload Custom Avatar Image
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await axios.post('/api/upload', formData);
      const customAvatarUrl = uploadRes.data.fileUrl;

      const profileRes = await axios.put('/api/auth/profile', {
        avatar: customAvatarUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAuth(profileRes.data.user, token);
      socket?.emit('profile_updated', profileRes.data.user);
      showSuccess('Profile photo uploaded!');
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 bottom-0 w-80 sm:w-96 bg-liquid-base/95 border-r border-white/10 z-50 p-6 flex flex-col justify-between shadow-2xl backdrop-blur-2xl overflow-y-auto no-scrollbar"
          >
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide">Edit Profile</h2>
                  <p className="text-xs text-gray-400">Change your picture, name & status</p>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-white/5">
                  <X size={20} />
                </button>
              </div>

              {/* Notification Banner */}
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2"
                >
                  <ShieldCheck size={16} className="text-emerald-400" />
                  <span>{successMessage}</span>
                </motion.div>
              )}

              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-[0_0_35px_rgba(0,210,255,0.4)]">
                    <img
                      src={user?.avatar}
                      alt={user?.username}
                      className="w-full h-full rounded-full object-cover bg-liquid-base"
                    />
                  </div>

                  {/* Upload Avatar Overlay Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer"
                    title="Upload Custom Photo"
                  >
                    <Camera size={24} className="text-liquid-accent" />
                    <span className="text-[10px] font-semibold mt-1">
                      {isUploadingAvatar ? 'Uploading...' : 'Change Photo'}
                    </span>
                  </button>

                  {/* Sparkle Generator Button */}
                  <button
                    onClick={handleGenerateNewAvatar}
                    className="absolute bottom-0 right-0 p-2.5 rounded-full bg-liquid-accent text-liquid-dark shadow-lg hover:scale-110 transition-transform"
                    title="Randomize AI Avatar"
                  >
                    <Sparkles size={16} />
                  </button>
                </div>

                {/* Hidden File Input for Custom Avatar */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileUpload}
                  className="hidden"
                />

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Upload size={14} className="text-liquid-accent" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    onClick={handleGenerateNewAvatar}
                    className="px-3 py-1.5 rounded-xl bg-liquid-accent/20 hover:bg-liquid-accent/30 text-liquid-accent text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles size={14} />
                    <span>Randomize</span>
                  </button>
                </div>

                {/* Preset Avatars Carousel */}
                <div className="w-full mt-4">
                  <span className="text-[11px] font-semibold text-gray-400 block mb-2 px-1">Avatar Gallery</span>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {PRESET_AVATARS.map((av, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectPresetAvatar(av)}
                        className={`w-10 h-10 rounded-full p-0.5 shrink-0 cursor-pointer transition-transform hover:scale-110 ${
                          user?.avatar === av ? 'ring-2 ring-liquid-accent bg-liquid-accent/30' : 'border border-white/10'
                        }`}
                      >
                        <img src={av} alt="Preset" className="w-full h-full rounded-full object-cover bg-liquid-base" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Username Section */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <User size={14} className="text-liquid-accent" />
                    <span>Your Username</span>
                  </span>
                  {!isEditingName ? (
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-liquid-accent hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveUsername}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Check size={12} /> Save
                    </button>
                  )}
                </div>

                {isEditingName ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      value={usernameText}
                      onChange={(e) => setUsernameText(e.target.value)}
                      className="w-full bg-black/40 rounded-xl px-3 py-2 text-white text-sm outline-none border border-liquid-accent/50 focus:border-liquid-accent"
                      placeholder="Username"
                      autoFocus
                    />
                    {nameError && (
                      <div className="text-[11px] text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>{nameError}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-white">@{user?.username}</p>
                )}
              </div>

              {/* Bio / About Status Section */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Smile size={14} className="text-liquid-accent" />
                    <span>About / Bio Status</span>
                  </span>
                  {!isEditingAbout ? (
                    <button
                      onClick={() => setIsEditingAbout(true)}
                      className="text-liquid-accent hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSaveAbout()}
                      className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Check size={12} /> Save
                    </button>
                  )}
                </div>

                {isEditingAbout ? (
                  <textarea
                    value={aboutText}
                    onChange={(e) => setAboutText(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 rounded-xl p-2.5 text-white text-sm outline-none border border-liquid-accent/50 focus:border-liquid-accent resize-none"
                    placeholder="Tell something about yourself..."
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-gray-200 leading-relaxed italic">
                    "{user?.about || 'Hey there! I am using Liquid Chat 🌊'}"
                  </p>
                )}

                {/* Quick Status Presets */}
                <div>
                  <span className="text-[10px] text-gray-400 block mb-1.5 uppercase tracking-wider font-semibold">
                    Quick Presets
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_STATUSES.map((preset, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSaveAbout(preset)}
                        className="px-2.5 py-1 rounded-lg bg-black/30 hover:bg-liquid-accent/20 hover:text-liquid-accent text-[11px] text-gray-300 border border-white/5 transition-colors text-left"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <div className="pt-6 border-t border-white/10 mt-6">
              <button
                onClick={() => {
                  logout();
                  window.location.href = '/auth';
                }}
                className="w-full h-12 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <LogOut size={16} />
                <span>Log Out of Liquid</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
