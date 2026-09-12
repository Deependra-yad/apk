"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Users, Pin, BellOff, Archive, 
  MoreVertical, Plus, Check, Trash2, UserX, X,
  Loader2, MessageSquare, AlertCircle, QrCode, Lock, ShieldCheck,
  Keyboard, Command
} from 'lucide-react';
import LiquidSidebar from '@/components/LiquidSidebar';
import ChatArea from '@/components/ChatArea';
import CallModal from '@/components/CallModal';
import StatusStoriesBar from '@/components/StatusStoriesBar';
import StoriesPanel from '@/components/StoriesPanel';
import CallsPanel from '@/components/CallsPanel';
import SettingsPanel from '@/components/SettingsPanel';
import ProfileDrawer from '@/components/ProfileDrawer';
import NewGroupModal from '@/components/NewGroupModal';
import StarredVaultPanel from '@/components/StarredVaultPanel';
import NotificationToast from '@/components/NotificationToast';
import LandingPage from '@/components/LandingPage';
import UserQrModal from '@/components/UserQrModal';
import LiquidLogo from '@/components/LiquidLogo';
import PinLockModal from '@/components/PinLockModal';
import { 
  isPinConfigured,
  isAppLockEnabled, 
  isAppUnlockedForSession,
  getLockedChatIds, 
  isChatLocked, 
  lockChat, 
  unlockChatPermanently, 
  isLockedChatsFolderUnlocked, 
  setLockedChatsFolderUnlocked 
} from '@/utils/securityLock';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, GroupItem } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { soundEffects } from '@/utils/audioSynth';

export default function Home({ forceChat = false }: { forceChat?: boolean }) {
  const { user, token, initAuth, logout } = useAuthStore();
  const {
    connectSocket, 
    onlineUsers, 
    setActiveContact, 
    activeContact, 
    setActiveGroup, 
    activeGroup, 
    groups, 
    setGroups, 
    chatMetaMap, 
    setChatMetaMap, 
    updateChatMeta,
    activeConversations,
    socket,
    unreadCounts,
    markAsRead
  } = useChatStore();

  const { fetchSettings, toggleBlockUser } = useSettingsStore();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');
  const [activeTab, setActiveTab] = useState('chat');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState<{ id: string; type: 'contact' | 'group'; name: string } | null>(null);
  const [showUpdateBanner, setShowUpdateBanner] = useState(false);
  const [showLanding, setShowLanding] = useState<boolean>(forceChat ? false : true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // WhatsApp-Grade App Lock & Chat Lock States
  const [lockedChatIds, setLockedChatIds] = useState<string[]>([]);
  const [isLockedFolderOpen, setIsLockedFolderOpen] = useState(false);
  const [isUnlockFolderModalOpen, setIsUnlockFolderModalOpen] = useState(false);
  const [isAppLockModalOpen, setIsAppLockModalOpen] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<'set' | 'unlock_app' | 'unlock_chats' | 'confirm_action'>('unlock_chats');
  const [pendingChatToLock, setPendingChatToLock] = useState<string | null>(null);

  // WebRTC Calling State
  const [callState, setCallState] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const [searchedContact, setSearchedContact] = useState<any | null>(null);
  const [isSearchingNumber, setIsSearchingNumber] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const initialFetchDone = useRef(false);

  // Determine if Landing page or Chat App should be shown
  useEffect(() => {
    if (forceChat) {
      setShowLanding(false);
      return;
    }
    const isNativeAndroidApp = typeof window !== 'undefined' && Boolean((window as any).Android);
    const isWebSubdomainOrPath = typeof window !== 'undefined' && (
      window.location.hostname.startsWith('web.') || 
      window.location.pathname.startsWith('/web')
    );

    // If native Android APK or web.* subdomain or /web path, show chat.
    // Visiting root domain liquidchat.online ALWAYS displays the landing page!
    if (isNativeAndroidApp || isWebSubdomainOrPath) {
      setShowLanding(false);
    } else {
      setShowLanding(true);
    }
  }, [forceChat]);

  useEffect(() => {
    initAuth();
    setIsClient(true);
    setAuthChecked(true);
    
    // Check app lock & locked chats status
    if (typeof window !== 'undefined') {
      const ids = getLockedChatIds();
      setLockedChatIds(ids);
      setIsLockedFolderOpen(isLockedChatsFolderUnlocked());
      if (isAppLockEnabled() && !isAppUnlockedForSession()) {
        setIsAppLockModalOpen(true);
      }
    }

    // Clean up any legacy unscoped saved contacts
    try {
      localStorage.removeItem('liquid_saved_contacts');
    } catch (e) {}

    // Check for Android App update
    const isAndroid = /Android/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem('liquid_update_v2');
    if (isAndroid && !dismissed) {
      setShowUpdateBanner(true);
    }
  }, [initAuth]);

  // Sync locks reactively
  useEffect(() => {
    const handleSyncLocks = () => {
      setLockedChatIds(getLockedChatIds());
      setIsLockedFolderOpen(isLockedChatsFolderUnlocked());
    };
    window.addEventListener('storage', handleSyncLocks);
    window.addEventListener('liquid_locks_updated', handleSyncLocks);
    return () => {
      window.removeEventListener('storage', handleSyncLocks);
      window.removeEventListener('liquid_locks_updated', handleSyncLocks);
    };
  }, []);

  // Close active chat if it gets locked and folder is not open
  useEffect(() => {
    if (!isLockedFolderOpen) {
      if (activeContact && lockedChatIds.includes(activeContact.id)) {
        setActiveContact(null);
      }
      if (activeGroup && lockedChatIds.includes(activeGroup.id)) {
        setActiveGroup(null);
      }
    }
  }, [isLockedFolderOpen, lockedChatIds, activeContact, activeGroup, setActiveContact, setActiveGroup]);

  // Universal Back Navigation (Used by Android Hardware Back Gesture & Escape Key)
  useEffect(() => {
    const handleUniversalBack = (): boolean => {
      if (isShortcutsModalOpen) {
        setIsShortcutsModalOpen(false);
        return true;
      }
      if (fullScreenImage) {
        setFullScreenImage(null);
        return true;
      }
      if (isQrModalOpen) {
        setIsQrModalOpen(false);
        return true;
      }
      if (isProfileOpen) {
        setIsProfileOpen(false);
        return true;
      }
      if (isNewGroupModalOpen) {
        setIsNewGroupModalOpen(false);
        return true;
      }
      if (isUnlockFolderModalOpen) {
        setIsUnlockFolderModalOpen(false);
        return true;
      }
      // If inside Settings sub-sections or Settings panel
      if (typeof window !== 'undefined' && typeof (window as any).__liquidSettingsBack === 'function') {
        const handledBySettings = (window as any).__liquidSettingsBack();
        if (handledBySettings) return true;
      }
      // If in Settings, Stories, Calls, or Starred tabs, return to Chats
      if (activeTab !== 'chat') {
        setActiveTab('chat');
        return true;
      }
      // If inside an active conversation, close it
      if (activeContact || activeGroup) {
        setActiveContact(null);
        setActiveGroup(null);
        return true;
      }
      // If contact search is active, clear it
      if (contactSearch) {
        setContactSearch('');
        setSearchedContact(null);
        setSearchFeedback(null);
        return true;
      }
      return false;
    };

    if (typeof window !== 'undefined') {
      (window as any).__liquidHandleBack = handleUniversalBack;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape key triggers universal back
      if (e.key === 'Escape') {
        handleUniversalBack();
        return;
      }

      // Ctrl + K or Cmd + K: Focus search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Ctrl + N or Cmd + N: New group
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewGroupModalOpen(true);
        return;
      }

      // Ctrl + , or Cmd + ,: Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setActiveTab('settings');
        return;
      }

      // Ctrl + Shift + L or Alt + L: Lock App
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') || (e.altKey && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        setIsAppLockModalOpen(true);
        return;
      }

      // ? for shortcuts cheat sheet
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as any)?.tagName)) {
        e.preventDefault();
        setIsShortcutsModalOpen(prev => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (typeof window !== 'undefined') {
        delete (window as any).__liquidHandleBack;
      }
    };
  }, [
    isShortcutsModalOpen, fullScreenImage, isQrModalOpen, isProfileOpen, 
    isNewGroupModalOpen, isUnlockFolderModalOpen, activeTab, 
    activeContact, activeGroup, contactSearch, setActiveContact, setActiveGroup
  ]);

  // Auth Guard & Initial Data Fetch (Runs ONCE per session to preserve contacts)
  useEffect(() => {
    if (!isClient) return;
    if (showLanding === true) return;
    if (!token && !user && showLanding === false) {
      router.push('/auth');
      return;
    }
    if (user && token && !initialFetchDone.current) {
      initialFetchDone.current = true;
      useAuthStore.getState().fetchMe(token);
      connectSocket(user.id);
      fetchSettings(token);
      useChatStore.getState().fetchUnreadCounts(token);

      // Check for target chat from URL (?chat=...) or localStorage (liquid_pending_chat)
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const chatQuery = urlParams?.get('chat');
      const pendingChatRaw = typeof window !== 'undefined' ? localStorage.getItem('liquid_pending_chat') : null;
      let pendingChatTarget = chatQuery;
      let pendingUserData: any = null;

      if (pendingChatRaw) {
        try {
          pendingUserData = JSON.parse(pendingChatRaw);
          if (!pendingChatTarget && pendingUserData) {
            pendingChatTarget = pendingUserData.liquidNumber || pendingUserData.username || pendingUserData.id;
          }
          localStorage.removeItem('liquid_pending_chat');
        } catch (e) {}
      }

      // Fetch active conversations list (full user objects with actual message history)
      axios.get('/api/users/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(async (res) => {
        const others = Array.isArray(res.data) ? res.data.filter((u: any) => u.id !== user.id) : [];
        let updatedList = [...others];

        if (pendingChatTarget) {
          // Check if target is already in conversations
          let matched = others.find((u: any) => 
            u.liquidNumber === pendingChatTarget || 
            u.username?.toLowerCase() === pendingChatTarget.toLowerCase() || 
            u.id === pendingChatTarget
          );

          if (!matched) {
            // Target not in conversation list yet, fetch public user profile
            try {
              const pubRes = await axios.get(`/api/users/public/${encodeURIComponent(pendingChatTarget)}`);
              if (pubRes.data && pubRes.data.id !== user.id) {
                matched = pubRes.data;
                updatedList = [matched, ...updatedList];
              }
            } catch (err) {
              if (pendingUserData && pendingUserData.id !== user.id) {
                matched = pendingUserData;
                updatedList = [matched, ...updatedList];
              }
            }
          }

          if (matched) {
            useChatStore.getState().setActiveContact(matched);
            useChatStore.getState().setActiveGroup(null);
            setShowLanding(false);
          }
        }

        setUsers(updatedList);
        useChatStore.getState().setActiveConversations(updatedList.map((u: any) => u.id));
      }).catch(console.error);

      // Fetch groups
      axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setGroups(res.data);
        const socket = useChatStore.getState().socket;
        if (socket) {
          res.data.forEach((group: any) => socket.emit('join_group', group.id));
        }
      });

      // Fetch chat metadata
      axios.get('/api/users/chat-meta', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setChatMetaMap(res.data);
      });
    }
  }, [isClient, user, token, router, connectSocket, fetchSettings, setGroups, setChatMetaMap]);

  // Listen for real-time contact or group deletion events
  useEffect(() => {
    if (!socket) return;

    const handleGroupDeleted = ({ groupId }: { groupId: string }) => {
      const current = useChatStore.getState().groups;
      setGroups(current.filter((g: any) => g.id !== groupId));
      if (useChatStore.getState().activeGroup?.id === groupId) {
        useChatStore.getState().setActiveGroup(null);
      }
    };

    const handleRemovedFromGroup = ({ groupId }: { groupId: string }) => {
      const current = useChatStore.getState().groups;
      setGroups(current.filter((g: any) => g.id !== groupId));
      if (useChatStore.getState().activeGroup?.id === groupId) {
        useChatStore.getState().setActiveGroup(null);
      }
    };

    socket.on('group_deleted', handleGroupDeleted);
    socket.on('removed_from_group', handleRemovedFromGroup);

    return () => {
      socket.off('group_deleted', handleGroupDeleted);
      socket.off('removed_from_group', handleRemovedFromGroup);
    };
  }, [socket, setGroups]);

  // Global Incoming Call Signaling
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: { from: any; offer: any; isVideo: boolean; callId?: string }) => {
      soundEffects.startIncomingRing();
      if (typeof window !== 'undefined' && (window as any).Android?.startIncomingCallRingtone) {
        try {
          (window as any).Android.startIncomingCallRingtone(data.from?.username || 'Liquid User', data.isVideo);
        } catch (e) {}
      }
      setIncomingCallData(data);
      setIsVideoCall(data.isVideo);
      setCallState('receiving');

      // Native Android notification auto-answer trigger
      if (typeof window !== 'undefined' && (window as any).__liquidAutoAnswer) {
        (window as any).__liquidAutoAnswer = false;
        setTimeout(() => {
          if (typeof (window as any).__liquidAnswerCall === 'function') {
            (window as any).__liquidAnswerCall();
          }
        }, 150);
      }
    };

    const handleCallEndedGlobal = () => {
      soundEffects.stopRinging();
      if (typeof window !== 'undefined' && (window as any).Android?.stopCallRingtone) {
        try { (window as any).Android.stopCallRingtone(); } catch (e) {}
      }
      setCallState('idle');
      setIncomingCallData(null);
    };

    const handleProfileUpdated = (updatedUser: any) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('call_ended', handleCallEndedGlobal);
    socket.on('call_rejected', handleCallEndedGlobal);
    socket.on('call_missed', handleCallEndedGlobal);
    socket.on('user_profile_updated', handleProfileUpdated);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('call_ended', handleCallEndedGlobal);
      socket.off('call_rejected', handleCallEndedGlobal);
      socket.off('call_missed', handleCallEndedGlobal);
      socket.off('user_profile_updated', handleProfileUpdated);
      if (typeof window !== 'undefined' && (window as any).Android?.stopCallRingtone) {
        try { (window as any).Android.stopCallRingtone(); } catch (e) {}
      }
    };
  }, [socket]);

  useEffect(() => {
    if (callState === 'idle' || callState === 'connected') {
      if (typeof window !== 'undefined' && (window as any).Android?.stopCallRingtone) {
        try { (window as any).Android.stopCallRingtone(); } catch (e) {}
      }
    }
  }, [callState]);

  // Check and pop up active ringing call from REST backend
  const checkActiveCall = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/calls/active', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data?.hasActiveCall && res.data.call) {
        const call = res.data.call;
        soundEffects.startIncomingRing();
        if (typeof window !== 'undefined' && (window as any).Android?.startIncomingCallRingtone) {
          try {
            (window as any).Android.startIncomingCallRingtone(call.from?.username || 'Liquid User', call.isVideo);
          } catch (e) {}
        }
        setIncomingCallData({
          callId: call.callId,
          from: call.from,
          offer: call.offer,
          isVideo: call.isVideo
        });
        setIsVideoCall(call.isVideo);
        setCallState('receiving');
        setShowLanding(false);
      }
    } catch (err) {}
  }, [token]);

  // Handle call intents from native Android notifications
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__liquidHandleIncomingCallIntent = (callerId: string, callId: string, isVideo: boolean) => {
        checkActiveCall();
      };

      if ((window as any).__liquidPendingCallIntent) {
        delete (window as any).__liquidPendingCallIntent;
        checkActiveCall();
      }
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__liquidHandleIncomingCallIntent;
      }
    };
  }, [checkActiveCall]);

  // React to real-time status and presence changes
  useEffect(() => {
    const handleStatusChange = (e: any) => {
      const { userId, isOnline, lastSeen } = e.detail || {};
      if (!userId) return;
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return {
            ...u,
            isOnline,
            lastSeen: lastSeen || u.lastSeen
          };
        }
        return u;
      }));
    };
    window.addEventListener('liquid_status_changed', handleStatusChange);
    return () => window.removeEventListener('liquid_status_changed', handleStatusChange);
  }, []);

  // Presence Heartbeat & Call Sync on App Focus / Resume
  useEffect(() => {
    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        useChatStore.getState().refreshOnlineUsers();
        checkActiveCall();
        if (socket && user?.id) {
          socket.emit('presence_ping');
        }
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
    };
  }, [checkActiveCall, socket, user?.id]);

  const handleStartCall = (isVideo: boolean) => {
    if (!activeContact) return;
    setIsVideoCall(isVideo);
    setCallState('calling');
  };

  const handleStartCallWithUser = (targetUser: any, isVideo: boolean) => {
    setActiveContact(targetUser);
    setIsVideoCall(isVideo);
    setCallState('calling');
  };

  // Toggle Chat Metadata (Pin / Mute / Archive)
  const handleToggleMeta = async (targetId: string, field: 'isPinned' | 'isArchived' | 'isMuted') => {
    if (!token) return;
    const current = chatMetaMap[targetId] || { isPinned: false, isArchived: false, isMuted: false };
    const newValue = !current[field];

    try {
      await axios.put('/api/users/chat-meta', {
        targetId,
        [field]: newValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      updateChatMeta(targetId, { [field]: newValue });
      setContextMenuTarget(null);
    } catch (e) {}
  };

  // Anti-tamper & inspection prevention for production builds
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    const blockDevtoolsShortcuts = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', blockDevtoolsShortcuts);
    return () => window.removeEventListener('keydown', blockDevtoolsShortcuts);
  }, []);

  // Search user by 10-digit Liquid Number
  useEffect(() => {
    const rawNumber = contactSearch.replace(/\D/g, '');
    if (token && rawNumber.length === 10) {
      setIsSearchingNumber(true);
      setSearchFeedback(null);
      axios.get(`/api/users/search?liquidNumber=${rawNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        if (res.data && res.data.length > 0) {
          const found = res.data[0];
          setSearchedContact(found);
          setUsers(prev => {
            const map = new Map();
            prev.forEach(u => map.set(u.id, u));
            map.set(found.id, found);
            return Array.from(map.values());
          });
          setSearchFeedback(null);
        } else {
          setSearchedContact(null);
          setSearchFeedback('No user found with this 10-digit ID');
        }
      }).catch(() => {
        setSearchedContact(null);
        setSearchFeedback('Search error');
      }).finally(() => {
        setIsSearchingNumber(false);
      });
    } else {
      setSearchedContact(null);
      setSearchFeedback(null);
      setIsSearchingNumber(false);
    }
  }, [contactSearch, token]);

  if (showLanding) {
    return <LandingPage />;
  }

  if (!isClient || !authChecked || !user) {
    return (
      <div className="min-h-screen bg-liquid-dark flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-tr from-liquid-accent to-liquid-secondary rounded-full flex items-center justify-center p-[2px] mb-6 shadow-[0_0_30px_rgba(0,210,255,0.3)]">
          <div className="w-full h-full bg-liquid-dark rounded-full flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-liquid-accent border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <p className="text-foreground/50 text-sm font-medium">Loading Liquid Chat...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/auth');
  };

  const handleSelectContact = (contact: any) => {
    if (lockedChatIds.includes(contact.id) && !isLockedChatsFolderUnlocked()) {
      setPendingChatToLock(contact.id);
      setPinModalMode('unlock_chats');
      setIsUnlockFolderModalOpen(true);
      return;
    }
    markAsRead(contact.id);
    setActiveContact(contact);
    useChatStore.getState().addActiveConversation(contact.id);

    // Persist to local storage scoped to this user
    try {
      if (user?.id) {
        const key = `liquid_saved_contacts_${user.id}`;
        const saved = localStorage.getItem(key);
        const list = saved ? JSON.parse(saved) : [];
        const updated = [contact, ...list.filter((c: any) => c.id !== contact.id)].slice(0, 50);
        localStorage.setItem(key, JSON.stringify(updated));
      }
    } catch (e) {}

    // Ensure they are in users list
    setUsers(prev => {
      const map = new Map();
      prev.forEach(u => map.set(u.id, u));
      map.set(contact.id, contact);
      return Array.from(map.values());
    });

    setContactSearch('');
    setSearchedContact(null);
    setSearchFeedback(null);
  };

  const handleSelectGroup = (group: any) => {
    if (lockedChatIds.includes(group.id) && !isLockedChatsFolderUnlocked()) {
      setPendingChatToLock(group.id);
      setPinModalMode('unlock_chats');
      setIsUnlockFolderModalOpen(true);
      return;
    }
    markAsRead(group.id);
    setActiveGroup(group);
  };

  const isTargetPinned = (targetId: string) => chatMetaMap[targetId]?.isPinned || false;
  const isTargetArchived = (targetId: string) => chatMetaMap[targetId]?.isArchived || false;
  const isTargetMuted = (targetId: string) => chatMetaMap[targetId]?.isMuted || false;

  // Filter Contacts
  const filteredUsers = users.filter(u => {
    if (user && u.id === user.id) return false;

    // If chat is locked and folder is not open, hide from normal list
    if (!isLockedFolderOpen && lockedChatIds.includes(u.id)) {
      return false;
    }

    const searchLow = contactSearch.toLowerCase().trim();
    const cleanSearchNum = contactSearch.replace(/\D/g, '');
    const matchesSearch = !searchLow || 
      u.username.toLowerCase().includes(searchLow) || 
      (u.liquidNumber && (u.liquidNumber === searchLow || u.liquidNumber === cleanSearchNum));
    
    const archived = isTargetArchived(u.id);
    const hasHistory = activeConversations.includes(u.id) || 
      (cleanSearchNum.length > 0 && u.liquidNumber && u.liquidNumber === cleanSearchNum) || 
      (searchedContact?.id === u.id) ||
      (activeContact?.id === u.id);

    // If currently active chat, always keep in list
    if (activeContact?.id === u.id) return true;

    // If searching, show any matched users
    if (contactSearch.trim()) return matchesSearch;

    // If no search query, ONLY show users with chat history
    if (!hasHistory) return false;

    if (chatFilter === 'archived') return archived;
    if (chatFilter === 'groups') return false;
    return !archived;
  });

  // Filter Groups
  const filteredGroups = groups.filter(g => {
    // If group is locked and folder is not open, hide from normal list
    if (!isLockedFolderOpen && lockedChatIds.includes(g.id)) {
      return false;
    }

    const searchLow = contactSearch.toLowerCase().trim();
    const matchesSearch = !searchLow || g.name.toLowerCase().startsWith(searchLow);
    const archived = isTargetArchived(g.id);
    if (chatFilter === 'archived') return archived && matchesSearch;
    if (chatFilter === 'unread') return false;
    return !archived && matchesSearch;
  });

  // Unified items sorted with pinned on top
  const unifiedChatList = [
    ...filteredGroups.map(g => ({ ...g, itemType: 'group' as const, sortKey: isTargetPinned(g.id) ? 1 : 0 })),
    ...filteredUsers.map(u => ({ ...u, itemType: 'contact' as const, sortKey: isTargetPinned(u.id) ? 1 : 0 }))
  ].sort((a, b) => b.sortKey - a.sortKey);

  const isChatOpen = !!(activeContact || activeGroup);

  return (
    <main className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] flex bg-liquid-dark overflow-hidden selection:bg-liquid-accent/30">
      <AnimatePresence>
        {showUpdateBanner && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-gradient-to-r from-blue-600/95 to-indigo-600/95 backdrop-blur-xl border border-blue-400/30 rounded-2xl p-4 shadow-[0_0_40px_rgba(37,99,235,0.3)] flex items-center justify-between gap-4"
          >
            <div className="text-white text-sm font-medium">
              <strong className="block text-base mb-0.5">🚀 LiquidChat v2.0.1 (Pro) Available!</strong>
              Live real-time presence, instant call answer, and background push notifications. Install now!
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <button 
                onClick={() => {
                  import('@/utils/apiUrl').then(({ downloadFile }) => {
                    downloadFile('/LiquidChat.apk', 'LiquidChat.apk');
                  });
                }}
                className="bg-white text-blue-600 font-bold px-4 py-1.5 rounded-xl text-xs text-center shadow-lg hover:bg-gray-100 transition-all active:scale-95"
              >
                Install
              </button>
              <button 
                onClick={() => {
                  localStorage.setItem('liquid_update_v2', 'true');
                  setShowUpdateBanner(false);
                }}
                className="text-white/70 text-[10px] hover:text-white transition-colors uppercase font-bold tracking-wider"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Animated Liquid Ambient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-gradient-to-tr from-liquid-accent/10 to-blue-600/10 rounded-full blur-[140px] pointer-events-none animate-pulse -z-10" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-indigo-600/10 to-liquid-secondary/15 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* Main Navigation Sidebar */}
      <LiquidSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenProfile={() => setIsProfileOpen(true)} 
        isChatActive={isChatOpen}
      />

      {/* Dynamic Tab Panel */}
      <div className={`w-full sm:w-96 h-full bg-liquid-base/40 border-r border-foreground/5 flex flex-col backdrop-blur-2xl z-20 pb-16 sm:pb-0 shrink-0 ${
        isChatOpen ? 'hidden sm:flex' : 'flex'
      }`}>
        {/* Tab 1: CHATS */}
        {activeTab === 'chat' && (
          <>
            {/* Header */}
            <div className="h-20 border-b border-foreground/5 flex items-center justify-between px-6 bg-liquid-base/30">
              <div className="flex items-center gap-3">
                <LiquidLogo size={36} glow={false} />
                <div className="flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-bold text-foreground tracking-wide">Liquid Chat</h1>
                    <span className="px-2 py-0.5 rounded-full bg-liquid-accent/15 border border-liquid-accent/30 text-[10px] font-mono text-liquid-accent font-semibold">
                      PRO
                    </span>
                  </div>
                {user?.liquidNumber ? (
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(user.liquidNumber!);
                      alert("Copied your unique Liquid Number: " + user.liquidNumber);
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-mono text-liquid-accent hover:underline text-left mt-0.5"
                    title="Click to copy your unique 10-digit Liquid Number"
                  >
                    <span>ID: <strong className="tracking-wider">{user.liquidNumber}</strong></span>
                    <span className="text-[9px] text-foreground/40">(Copy)</span>
                  </button>
                ) : (
                  <p className="text-[10px] text-foreground/40 font-mono">@{user?.username}</p>
                )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewGroupModalOpen(true)}
                  className="p-2 rounded-xl bg-foreground/10 hover:bg-liquid-accent/20 text-foreground/80 hover:text-liquid-accent transition-colors"
                  title="New Group"
                >
                  <Plus size={18} />
                </button>

                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-9 h-9 rounded-full overflow-hidden border border-foreground/10 hover:border-liquid-accent transition-colors shadow-sm"
                  title="View Profile"
                >
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            {/* Stories Feed Bar */}
            <StatusStoriesBar />

            {/* Search Bar */}
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              <div className="h-10 bg-background/30 rounded-xl px-3 flex-1 flex items-center gap-2.5 border border-foreground/5 focus-within:border-liquid-accent/50 transition-colors">
                <Search size={16} className="text-foreground/60 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search name or 10-digit Liquid ID (Ctrl+K)..."
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-xs placeholder-gray-500 min-w-0"
                />
                {contactSearch && (
                  <button 
                    onClick={() => {
                      setContactSearch('');
                      setSearchedContact(null);
                      setSearchFeedback(null);
                    }}
                    className="p-1 text-foreground/50 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors"
                    title="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsQrModalOpen(true)}
                className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-pink-500/20 border border-foreground/10 hover:border-pink-500/40 text-foreground/70 hover:text-pink-400 flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm"
                title="Scan or Show Liquid ID QR Code"
              >
                <QrCode size={18} />
              </button>
            </div>

            {/* Search Status Indicator */}
            {isSearchingNumber && (
              <div className="px-5 py-1.5 flex items-center gap-2 text-xs text-liquid-accent animate-pulse">
                <Loader2 size={13} className="animate-spin" />
                <span>Searching user by Liquid ID...</span>
              </div>
            )}

            {/* Search Error / Not Found Feedback */}
            {searchFeedback && (
              <div className="mx-4 my-1.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0 text-rose-400" />
                <span>{searchFeedback}</span>
              </div>
            )}

            {/* Found Contact Card */}
            {searchedContact && (
              <div 
                onClick={() => handleSelectContact(searchedContact)}
                className="mx-4 my-2 p-3 rounded-2xl bg-gradient-to-r from-liquid-accent/20 to-blue-500/15 border border-liquid-accent/40 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(0,210,255,0.15)] cursor-pointer hover:border-liquid-accent transition-all active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                  <div className="relative shrink-0">
                    <img 
                      src={searchedContact.avatar} 
                      alt={searchedContact.username} 
                      className="w-10 h-10 rounded-full object-cover bg-liquid-base border border-liquid-accent/50" 
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-liquid-base" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{searchedContact.username}</h4>
                    <span className="text-[11px] font-mono text-liquid-accent block">ID: {searchedContact.liquidNumber}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectContact(searchedContact);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-liquid-accent text-liquid-dark font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all shrink-0"
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </button>
              </div>
            )}

            {/* Chat Category Filter Tabs (All, Unread, Groups, Archived) */}
            <div className="px-4 py-2 flex items-center gap-1.5 border-b border-foreground/5 overflow-x-auto no-scrollbar">
              {(['all', 'unread', 'groups', 'archived'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setChatFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all shrink-0 ${
                    chatFilter === tab 
                      ? 'bg-liquid-accent text-liquid-dark font-bold shadow-sm' 
                      : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/60'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Unified Chats & Groups List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {/* WhatsApp-Style Locked Chats Folder Item */}
              {lockedChatIds.length > 0 && (
                <div 
                  onClick={() => {
                    if (isLockedFolderOpen) {
                      setLockedChatsFolderUnlocked(false);
                      setIsLockedFolderOpen(false);
                    } else {
                      setPinModalMode('unlock_chats');
                      setIsUnlockFolderModalOpen(true);
                    }
                  }}
                  className={`mx-1 mb-2 p-3 rounded-2xl flex items-center justify-between cursor-pointer transition-all border ${
                    isLockedFolderOpen
                      ? 'bg-gradient-to-r from-[#ff4b82]/15 via-[#a855f7]/15 to-transparent border-[#ff4b82]/40 shadow-[0_0_20px_rgba(255,75,130,0.15)]'
                      : 'bg-foreground/5 hover:bg-foreground/10 border-foreground/10'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff4b82] to-[#a855f7] flex items-center justify-center text-white shadow-md shadow-pink-500/25">
                      <Lock size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-foreground">Locked Chats</h4>
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ff4b82]/25 text-[#ff4b82] border border-[#ff4b82]/30">
                          {lockedChatIds.length}
                        </span>
                      </div>
                      <p className="text-[10px] text-foreground/50">
                        {isLockedFolderOpen ? 'Folder unlocked • Tap to re-lock' : 'Protected • Tap to unlock'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#ff4b82] px-2.5 py-1 rounded-lg bg-[#ff4b82]/10">
                    {isLockedFolderOpen ? 'Lock 🔒' : 'Unlock 🔓'}
                  </span>
                </div>
              )}

              {unifiedChatList.length === 0 ? (
                <div className="py-16 px-6 text-center flex flex-col items-center justify-center space-y-3 my-auto">
                  <div className="w-14 h-14 rounded-full bg-liquid-accent/10 border border-liquid-accent/20 flex items-center justify-center text-liquid-accent shadow-[0_0_20px_rgba(0,210,255,0.1)]">
                    <MessageSquare size={24} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">No conversations yet</h3>
                  <p className="text-xs text-foreground/50 max-w-[220px] leading-relaxed">
                    Search a username or 10-digit Liquid ID above to start chatting securely.
                  </p>
                </div>
              ) : (
                unifiedChatList.map((item) => {
                  const isGroupItem = item.itemType === 'group';
                  const isOnline = !isGroupItem ? onlineUsers.includes(item.id) : false;
                  const isActive = isGroupItem ? activeGroup?.id === item.id : activeContact?.id === item.id;
                  const isPinned = isTargetPinned(item.id);
                  const isMuted = isTargetMuted(item.id);

                  return (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        if (isGroupItem) {
                          handleSelectGroup(item);
                        } else {
                          handleSelectContact(item);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenuTarget({ id: item.id, type: isGroupItem ? 'group' : 'contact', name: isGroupItem ? item.name : (item as any).username });
                      }}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer relative overflow-hidden transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-liquid-accent/15 via-white/5 to-transparent border border-liquid-accent/30 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
                          : 'hover:bg-foreground/5 border border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-full p-[2px] ${
                          isGroupItem 
                            ? 'bg-gradient-to-tr from-purple-500 to-indigo-500' 
                            : 'bg-foreground/10'
                        }`}>
                          <img 
                            src={isGroupItem ? (item.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.name)}`) : (item as any).avatar} 
                            alt={isGroupItem ? item.name : (item as any).username} 
                            className="w-full h-full rounded-full object-cover bg-liquid-base cursor-pointer" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setFullScreenImage(isGroupItem ? (item.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.name)}`) : (item as any).avatar);
                            }}
                          />
                        </div>
                        {!isGroupItem && isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-liquid-base shadow-sm" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-foreground font-bold' : 'text-foreground/90'}`}>
                              {isGroupItem ? item.name : (item as any).username}
                            </h3>
                            {lockedChatIds.includes(item.id) && (
                              <Lock size={12} className="text-[#ff4b82] shrink-0" />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {unreadCounts[item.id] > 0 && (
                              <span className="bg-liquid-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-md">
                                {unreadCounts[item.id]}
                              </span>
                            )}
                            {isPinned && <Pin size={12} className="text-liquid-accent fill-liquid-accent" />}
                            {isMuted && <BellOff size={12} className="text-foreground/50" />}
                            {!isGroupItem && isOnline && (
                              <span className="text-[10px] text-green-400 font-medium font-mono">online</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-foreground/60 truncate">
                          {isGroupItem ? `${item.members.length} members` : ((item as any).about || 'Liquid user')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Tab 2: STORIES */}
        {activeTab === 'stories' && (
          <StoriesPanel 
            onOpenCreateStory={() => {}}
            onSelectStory={() => {}}
          />
        )}

        {/* Tab 3: CALLS */}
        {activeTab === 'calls' && (
          <CallsPanel
            onStartCallWithUser={handleStartCallWithUser}
            users={users}
          />
        )}

        {/* Tab 4: STARRED VAULT */}
        {activeTab === 'starred' && (
          <StarredVaultPanel />
        )}

        {/* Tab 5: SETTINGS */}
        {activeTab === 'settings' && (
          <SettingsPanel onBackToChats={() => setActiveTab('chat')} />
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 min-h-0 h-full flex flex-col ${isChatOpen ? 'flex' : 'hidden sm:flex'}`}>
        <ChatArea 
          onStartCall={handleStartCall}
          onOpenProfile={() => setIsProfileOpen(true)}
          onBack={() => {
            setActiveContact(null);
            setActiveGroup(null);
          }}
          users={users}
        />
      </div>

      {/* Native WebRTC Calling Modal */}
      <CallModal
        callState={callState}
        setCallState={setCallState}
        incomingCallData={incomingCallData}
        setIncomingCallData={setIncomingCallData}
        isVideoCall={isVideoCall}
        setIsVideoCall={setIsVideoCall}
      />

      {/* User Profile & Info Drawer */}
      <ProfileDrawer
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      {/* New Group Wizard Modal */}
      <NewGroupModal
        isOpen={isNewGroupModalOpen}
        onClose={() => setIsNewGroupModalOpen(false)}
        users={users}
      />

      {/* Chat Options Context Menu Modal */}
      <AnimatePresence>
        {contextMenuTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setContextMenuTarget(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/75 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-liquid-base/95 border border-foreground/10 rounded-2xl p-4 shadow-2xl space-y-1.5"
            >
              <h4 className="text-xs font-bold text-foreground/60 uppercase tracking-wider px-2 pb-1 border-b border-foreground/10">
                {contextMenuTarget.name}
              </h4>

              <button
                onClick={() => handleToggleMeta(contextMenuTarget.id, 'isPinned')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium"
              >
                <Pin size={16} className={isTargetPinned(contextMenuTarget.id) ? "text-liquid-accent fill-liquid-accent" : ""} />
                <span>{isTargetPinned(contextMenuTarget.id) ? 'Unpin Chat' : 'Pin to Top'}</span>
              </button>

              <button
                onClick={() => handleToggleMeta(contextMenuTarget.id, 'isMuted')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium"
              >
                <BellOff size={16} />
                <span>{isTargetMuted(contextMenuTarget.id) ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              </button>

              <button
                onClick={() => handleToggleMeta(contextMenuTarget.id, 'isArchived')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium"
              >
                <Archive size={16} />
                <span>{isTargetArchived(contextMenuTarget.id) ? 'Unarchive Chat' : 'Archive Chat'}</span>
              </button>

              <button
                onClick={() => {
                  const targetId = contextMenuTarget.id;
                  const isLocked = isChatLocked(targetId);
                  setPendingChatToLock(targetId);
                  if (isLocked) {
                    setPinModalMode('confirm_action');
                    setIsUnlockFolderModalOpen(true);
                  } else {
                    if (!isPinConfigured()) {
                      setPinModalMode('set');
                      setIsUnlockFolderModalOpen(true);
                    } else {
                      lockChat(targetId);
                      setLockedChatIds(getLockedChatIds());
                      setContextMenuTarget(null);
                      if (activeContact?.id === targetId) setActiveContact(null);
                      if (activeGroup?.id === targetId) setActiveGroup(null);
                    }
                  }
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium"
              >
                <Lock size={16} className={isChatLocked(contextMenuTarget.id) ? "text-[#ff4b82]" : ""} />
                <span>{isChatLocked(contextMenuTarget.id) ? 'Unlock Chat 🔓' : 'Lock Chat 🔒'}</span>
              </button>

              <button
                onClick={async () => {
                  if (confirm(`Permanently remove ${contextMenuTarget.name} from your conversation list?`)) {
                    if (contextMenuTarget.type === 'group') {
                      try {
                        await axios.delete(`/api/groups/${contextMenuTarget.id}/leave`, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                      } catch (e) {}
                    } else {
                      socket?.emit('clear_chat', { targetId: contextMenuTarget.id });
                    }
                    if (activeContact?.id === contextMenuTarget.id) setActiveContact(null);
                    if (activeGroup?.id === contextMenuTarget.id) setActiveGroup(null);
                    setContextMenuTarget(null);
                  }
                }}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/15 text-red-400 text-xs font-medium"
              >
                <Trash2 size={16} />
                <span>Delete Chat</span>
              </button>

              {contextMenuTarget.type === 'contact' && (
                <button
                  onClick={async () => {
                    if (token) {
                      await toggleBlockUser(token, contextMenuTarget.id);
                      setContextMenuTarget(null);
                    }
                  }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-red-500/20 text-red-400 text-xs font-medium"
                >
                  <UserX size={16} />
                  <span>Block User</span>
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen DP / Image Modal */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <button 
              className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
              onClick={() => setFullScreenImage(null)}
            >
              <X size={24} />
            </button>
            <img 
              src={fullScreenImage} 
              alt="Full Screen" 
              className="w-full h-full object-contain select-none"
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating In-App Real-Time Notification Toast */}
      <NotificationToast />

      {/* Liquid ID QR Modal */}
      <UserQrModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onStartChatWithUser={(targetUser) => {
          handleSelectContact(targetUser);
          setIsQrModalOpen(false);
        }}
      />

      {/* WhatsApp-Grade Fullscreen App Lock PIN Modal */}
      <PinLockModal
        isOpen={isAppLockModalOpen}
        mode="unlock_app"
        onSuccess={() => {
          setIsAppLockModalOpen(false);
        }}
      />

      {/* WhatsApp-Grade Folder / Action PIN Modal */}
      <PinLockModal
        isOpen={isUnlockFolderModalOpen}
        mode={pinModalMode}
        onSuccess={() => {
          if (pinModalMode === 'unlock_chats') {
            setLockedChatsFolderUnlocked(true);
            setIsLockedFolderOpen(true);
            if (pendingChatToLock) {
              const targetUser = users.find(u => u.id === pendingChatToLock);
              const targetGroup = groups.find(g => g.id === pendingChatToLock);
              if (targetGroup) {
                setActiveGroup(targetGroup as any);
              } else if (targetUser) {
                handleSelectContact(targetUser);
              }
              setPendingChatToLock(null);
            }
          } else if (pinModalMode === 'set') {
            if (pendingChatToLock) {
              lockChat(pendingChatToLock);
              setLockedChatIds(getLockedChatIds());
              if (activeContact?.id === pendingChatToLock) setActiveContact(null);
              if (activeGroup?.id === pendingChatToLock) setActiveGroup(null);
              setPendingChatToLock(null);
            }
          } else if (pinModalMode === 'confirm_action') {
            if (pendingChatToLock) {
              unlockChatPermanently(pendingChatToLock);
              setLockedChatIds(getLockedChatIds());
              setPendingChatToLock(null);
            }
          }
          setContextMenuTarget(null);
          setIsUnlockFolderModalOpen(false);
        }}
        onCancel={() => {
          setIsUnlockFolderModalOpen(false);
          setPendingChatToLock(null);
        }}
      />

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      <AnimatePresence>
        {isShortcutsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsShortcutsModalOpen(false)}
            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-liquid-base border border-foreground/15 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,117,151,0.2)] text-foreground relative"
            >
              <div className="flex items-center justify-between pb-3 border-b border-foreground/10 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-liquid-accent/20 text-liquid-accent">
                    <Keyboard size={18} />
                  </div>
                  <h3 className="text-base font-bold">Keyboard Shortcuts</h3>
                </div>
                <button
                  onClick={() => setIsShortcutsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                {[
                  { key: 'Esc', desc: 'Go back / Close modal / Exit chat' },
                  { key: 'Ctrl + K  /  ⌘ + K', desc: 'Focus contact search' },
                  { key: 'Ctrl + N  /  ⌘ + N', desc: 'Create new group' },
                  { key: 'Ctrl + ,  /  ⌘ + ,', desc: 'Open settings' },
                  { key: 'Ctrl + Shift + L', desc: 'Lock application with PIN' },
                  { key: '?', desc: 'Toggle shortcuts cheat sheet' }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-foreground/5 border border-foreground/5">
                    <span className="text-foreground/80">{item.desc}</span>
                    <kbd className="px-2 py-1 rounded-lg bg-black/40 border border-foreground/10 font-mono text-[11px] font-bold text-liquid-accent shadow-sm">
                      {item.key}
                    </kbd>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-foreground/10 text-center">
                <p className="text-[11px] text-foreground/40 font-mono">Liquid Chat Pro Accessibility Engine</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
