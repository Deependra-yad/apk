"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Users, Pin, BellOff, Archive, 
  MoreVertical, Plus, Check, Trash2, UserX 
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
import { useAuthStore } from '@/store/authStore';
import { useChatStore, GroupItem } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { soundEffects } from '@/utils/audioSynth';

export default function Home() {
  const { user, token, initAuth, logout } = useAuthStore();
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
    activeConversations,
    socket 
  } = useChatStore();

  const { fetchSettings, toggleBlockUser } = useSettingsStore();
  const router = useRouter();

  const [isClient, setIsClient] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');
  const [chatFilter, setChatFilter] = useState<'all' | 'unread' | 'groups' | 'archived'>('all');
  const [activeTab, setActiveTab] = useState('chat');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNewGroupModalOpen, setIsNewGroupModalOpen] = useState(false);
  const [contextMenuTarget, setContextMenuTarget] = useState<{ id: string; type: 'contact' | 'group'; name: string } | null>(null);

  // WebRTC Calling State
  const [callState, setCallState] = useState<'idle' | 'calling' | 'receiving' | 'connected'>('idle');
  const [incomingCallData, setIncomingCallData] = useState<any>(null);
  const [isVideoCall, setIsVideoCall] = useState(true);

  useEffect(() => {
    initAuth();
    setIsClient(true);
  }, [initAuth]);

  // Auth Guard & Initial Data Fetch
  useEffect(() => {
    if (isClient && !user) {
      router.push('/auth');
    } else if (user && token) {
      connectSocket(user.id);
      fetchSettings(token);

      // Fetch users
      axios.get('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        const others = res.data.filter((u: any) => u.id !== user.id);
        setUsers(others);
        if (others.length > 0 && !activeContact && !activeGroup && typeof window !== 'undefined' && window.innerWidth >= 640) {
          setActiveContact(others[0]);
        }
      });

      // Fetch groups
      axios.get('/api/groups', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setGroups(res.data);
      });

      // Fetch chat metadata
      axios.get('/api/users/chat-meta', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setChatMetaMap(res.data);
      });

  }, [isClient, user, token, router, connectSocket, fetchSettings, setGroups, setChatMetaMap]);

  useEffect(() => {
    const handleNewUser = (e: any) => {
      const newUser = e.detail;
      if (user && newUser.id !== user.id) {
        setUsers(prev => {
          if (prev.some(u => u.id === newUser.id)) return prev;
          return [...prev, newUser];
        });
      }
    };
    window.addEventListener('new_user_joined', handleNewUser);
    return () => window.removeEventListener('new_user_joined', handleNewUser);
  }, [user]);

  // Global Incoming Call Signaling
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: { from: any; offer: any; isVideo: boolean }) => {
      soundEffects.startIncomingRing();
      setIncomingCallData(data);
      setIsVideoCall(data.isVideo);
      setCallState('receiving');
    };

    const handleProfileUpdated = (updatedUser: any) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
    };

    socket.on('incoming_call', handleIncomingCall);
    socket.on('user_profile_updated', handleProfileUpdated);

    return () => {
      socket.off('incoming_call', handleIncomingCall);
      socket.off('user_profile_updated', handleProfileUpdated);
    };
  }, [socket]);

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

  if (!isClient || !user) return null;

  // Global Context Menu lock for privacy (Mobile & Desktop)
  useEffect(() => {
    const lockContextMenu = (e: MouseEvent) => {
      // e.preventDefault(); // Un-commenting this will completely disable native context menu globally
    };


    // If no search query, ONLY show users with chat history
    if (!contactSearch.trim() && !hasHistory) return false;

  // Filter Groups
  const filteredGroups = groups.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(contactSearch.toLowerCase());
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
    <main className="w-full h-[100dvh] flex bg-liquid-dark overflow-hidden selection:bg-liquid-accent/30 relative">
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
      <div className={`w-full sm:w-96 h-full bg-liquid-base/40 border-r border-white/5 flex flex-col backdrop-blur-2xl z-20 pb-16 sm:pb-0 shrink-0 ${
        isChatOpen ? 'hidden sm:flex' : 'flex'
      }`}>
        {/* Tab 1: CHATS */}
        {activeTab === 'chat' && (
          <>
            {/* Header */}
            <div className="h-20 border-b border-white/5 flex items-center justify-between px-6 bg-liquid-base/30">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-white tracking-wide">Liquid Chat</h1>
                <span className="px-2 py-0.5 rounded-full bg-liquid-accent/15 border border-liquid-accent/30 text-[10px] font-mono text-liquid-accent font-semibold">
                  PRO
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsNewGroupModalOpen(true)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-liquid-accent/20 text-gray-300 hover:text-liquid-accent transition-colors"
                  title="New Group"
                >
                  <Plus size={18} />
                </button>

                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-9 h-9 rounded-full overflow-hidden border border-white/10 hover:border-liquid-accent transition-colors shadow-sm"
                >
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </button>
              </div>
            </div>

            {/* Stories Feed Bar */}
            <StatusStoriesBar />

            {/* Search Bar */}
            <div className="px-4 pt-3 pb-2">
              <div className="h-10 bg-black/30 rounded-xl px-3 flex items-center gap-2.5 border border-white/5 focus-within:border-liquid-accent/50 transition-colors">
                <Search size={16} className="text-gray-400" />
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search chats, groups..."
                  className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder-gray-500"
                />
              </div>
            </div>

            {/* Chat Category Filter Tabs (All, Unread, Groups, Archived) */}
            <div className="px-4 py-2 flex items-center gap-1.5 border-b border-white/5 overflow-x-auto no-scrollbar">
              {(['all', 'unread', 'groups', 'archived'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setChatFilter(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all shrink-0 ${
                    chatFilter === tab 
                      ? 'bg-liquid-accent text-liquid-dark font-bold shadow-sm' 
                      : 'bg-white/5 hover:bg-white/10 text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Unified Chats & Groups List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 no-scrollbar">
              {unifiedChatList.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-xs">
                  No conversations found in this filter
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
                          setActiveGroup(item as any);
                        } else {
                          setActiveContact(item);
                        }
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenuTarget({ id: item.id, type: isGroupItem ? 'group' : 'contact', name: isGroupItem ? item.name : (item as any).username });
                      }}
                      className={`flex items-center gap-3.5 p-3 rounded-2xl cursor-pointer relative overflow-hidden transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-liquid-accent/15 via-white/5 to-transparent border border-liquid-accent/30 shadow-[0_0_15px_rgba(0,210,255,0.15)]'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div className={`w-12 h-12 rounded-full p-[2px] ${
                          isGroupItem 
                            ? 'bg-gradient-to-tr from-purple-500 to-indigo-500' 
                            : 'bg-white/10'
                        }`}>
                          <img 
                            src={isGroupItem ? (item.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(item.name)}`) : (item as any).avatar} 
                            alt={isGroupItem ? item.name : (item as any).username} 
                            className="w-full h-full rounded-full object-cover bg-liquid-base" 
                          />
                        </div>
                        {!isGroupItem && isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-liquid-base shadow-sm" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className={`text-sm font-semibold truncate ${isActive ? 'text-white font-bold' : 'text-gray-200'}`}>
                            {isGroupItem ? item.name : (item as any).username}
                          </h3>

                          <div className="flex items-center gap-1.5">
                            {isPinned && <Pin size={12} className="text-liquid-accent fill-liquid-accent" />}
                            {isMuted && <BellOff size={12} className="text-gray-500" />}
                            {!isGroupItem && isOnline && (
                              <span className="text-[10px] text-green-400 font-medium font-mono">online</span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-gray-400 truncate">
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
          <SettingsPanel />
        )}
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 h-full flex flex-col ${isChatOpen ? 'flex' : 'hidden sm:flex'}`}>
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-liquid-base/95 border border-white/10 rounded-2xl p-4 shadow-2xl space-y-1.5"
            >
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 pb-1 border-b border-white/10">
                {contextMenuTarget.name}
              </h4>

              <button
                onClick={() => handleToggleMeta(contextMenuTarget.id, 'isPinned')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium"
              >
                <Pin size={16} className={isTargetPinned(contextMenuTarget.id) ? "text-liquid-accent fill-liquid-accent" : ""} />
                <span>{isTargetPinned(contextMenuTarget.id) ? 'Unpin Chat' : 'Pin to Top'}</span>
              </button>

              <button
                onClick={() => handleToggleMeta(contextMenuTarget.id, 'isMuted')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium"
              >
                <BellOff size={16} />
                <span>{isTargetMuted(contextMenuTarget.id) ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              </button>

              <button
                onClick={() => handleToggleMeta(contextMenuTarget.id, 'isArchived')}
                className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium"
              >
                <Archive size={16} />
                <span>{isTargetArchived(contextMenuTarget.id) ? 'Unarchive Chat' : 'Archive Chat'}</span>
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

      {/* Floating In-App Real-Time Notification Toast */}
      <NotificationToast />
    </main>
  );
}
