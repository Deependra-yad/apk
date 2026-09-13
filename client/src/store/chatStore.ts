import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { soundEffects } from '@/utils/audioSynth';
import { getApiUrl, getSocketUrl } from '@/utils/apiUrl';
import { sendBrowserNotification, requestNotificationPermission } from '@/utils/notifications';
import { 
  ensureUserKeyPair, 
  getOrDeriveSharedKey, 
  decryptMessage, 
  cacheDecryptedMessage, 
  cacheUserPublicKey, 
  getCachedUserPublicKey, 
  getKeyFromIDBOrLocalStorage, 
  importPublicKey, 
  deriveSharedKey 
} from '@/utils/crypto';
import axios from 'axios';

export interface Message {
  id: string;
  tempId?: string;
  isPending?: boolean;
  text?: string;
  type: string; // 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'sticker' | 'system'
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  duration?: number;
  isSeen: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  isStarred?: boolean;
  isPinned?: boolean;
  iv?: string;
  isEncrypted?: boolean;
  forwardedFrom?: string;
  reactions?: string;
  pollData?: string;
  replyToId?: string;
  replyToText?: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  sender?: {
    id: string;
    username: string;
    avatar?: string;
    publicKey?: string;
  };
  createdAt: string;
  updatedAt?: string;
  rawText?: string;
  rawFileUrl?: string;
}

export interface GroupItem {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  creatorId: string;
  createdAt: string;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; username: string; avatar: string; about?: string };
  }>;
  messages?: Message[];
}

interface ChatState {
  socket: Socket | null;
  messages: Message[];
  messagesByChat: Record<string, Message[]>;
  groups: GroupItem[];
  onlineUsers: string[];
  typingUsers: string[];
  groupTypingUsers: Record<string, string[]>; // groupId -> senderNames[]
  activeContact: any | null;
  activeGroup: GroupItem | null;
  replyingTo: Message | null;
  editingMessage: Message | null;
  selectedMessageIds: string[];
  searchQuery: string;
  chatMetaMap: Record<string, { isPinned: boolean; isArchived: boolean; isMuted: boolean }>;
  activeConversations: string[];
  incomingToast: any | null;
  unreadCounts: Record<string, number>;
  ping: number | null;
  pingStatus: 'connected' | 'connecting' | 'disconnected';

  measurePing: () => Promise<number | null>;
  fetchUnreadCounts: (token: string) => Promise<void>;
  markAsRead: (id: string) => void;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  setActiveContact: (contact: any) => void;
  setActiveGroup: (group: GroupItem | null) => void;
  setGroups: (groups: GroupItem[]) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setReplyingTo: (msg: Message | null) => void;
  setEditingMessage: (msg: Message | null) => void;
  toggleSelectMessage: (msgId: string) => void;
  selectAllMessages: () => void;
  clearSelection: () => void;
  setSearchQuery: (q: string) => void;
  setChatMetaMap: (metaList: any[]) => void;
  updateChatMeta: (targetId: string, updates: Partial<{ isPinned: boolean; isArchived: boolean; isMuted: boolean }>) => void;
  setActiveConversations: (ids: string[]) => void;
  addActiveConversation: (id: string) => void;
  updateMessageReaction: (messageId: string, reactions: string) => void;
  updateMessagePoll: (updatedMessage: Message) => void;
  updateEditedMessage: (updatedMessage: Message) => void;
  deleteMessageInStore: (messageId: string, isForEveryone?: boolean) => void;
  toggleStarMessage: (messageId: string) => void;
  markMessagesAsSeenLocally: (seenByUserId: string) => void;
  setIncomingToast: (toast: any | null) => void;
  refreshOnlineUsers: () => void;
  resetChatStore: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  socket: null,
  messages: [],
  messagesByChat: {},
  groups: (() => {
    if (typeof window === 'undefined') return [];
    try {
      const storedUser = localStorage.getItem('liquid_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        const cached = localStorage.getItem(`liquid_cached_groups_${u.id}`);
        if (cached) return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  })(),
  onlineUsers: [],
  typingUsers: [],
  groupTypingUsers: {},
  activeContact: null,
  activeGroup: null,
  replyingTo: null,
  editingMessage: null,
  selectedMessageIds: [],
  searchQuery: '',
  chatMetaMap: {},
  activeConversations: (() => {
    if (typeof window === 'undefined') return [];
    try {
      const storedUser = localStorage.getItem('liquid_user');
      if (storedUser) {
        const u = JSON.parse(storedUser);
        const cached = localStorage.getItem(`liquid_cached_conversations_${u.id}`) || localStorage.getItem(`liquid_saved_contacts_${u.id}`);
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list)) return list.map((item: any) => item.id);
        }
      }
    } catch (e) {}
    return [];
  })(),
  incomingToast: null,
  unreadCounts: {},
  ping: null,
  pingStatus: 'connecting',

  measurePing: async () => {
    const s = get().socket;
    if (s && s.connected) {
      return new Promise<number | null>((resolve) => {
        const start = Date.now();
        s.emit('client_ping', start, (sentTime: number) => {
          const latency = Math.max(1, Date.now() - (sentTime || start));
          set({ ping: latency, pingStatus: 'connected' });
          resolve(latency);
        });
        setTimeout(() => resolve(get().ping), 2500);
      });
    } else {
      try {
        const start = Date.now();
        await axios.get('/api/ping');
        const latency = Math.max(1, Date.now() - start);
        set({ ping: latency, pingStatus: 'connected' });
        return latency;
      } catch (e) {
        set({ pingStatus: 'disconnected', ping: null });
        return null;
      }
    }
  },

  fetchUnreadCounts: async (token) => {
    try {
      const res = await axios.get('/api/messages/unread-counts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      set({ unreadCounts: res.data });
    } catch (e) {
      console.error('Failed to fetch unread counts', e);
    }
  },

  markAsRead: (id) => {
    set((state) => ({
      unreadCounts: { ...state.unreadCounts, [id]: 0 }
    }));
  },

  connectSocket: (userId) => {
    if (get().socket) return;

    requestNotificationPermission();

    const token = typeof window !== 'undefined' ? localStorage.getItem('liquid_token') : null;
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('liquid_session_id') : null;

    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      query: { userId, token, sessionId },
      auth: { token, sessionId, userId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2500,
      timeout: 15000,
      transports: ['websocket', 'polling'],
      upgrade: true
    });

    let pingTimer: any = null;
    const sendPing = () => {
      if (socket.connected) {
        const start = Date.now();
        socket.emit('client_ping', start, (sentTime: number) => {
          const latency = Math.max(1, Date.now() - (sentTime || start));
          set({ ping: latency, pingStatus: 'connected' });
        });
      } else {
        set({ pingStatus: socket.active ? 'connecting' : 'disconnected' });
      }
    };

    socket.on('server_pong', (sentTime: number) => {
      const latency = Math.max(1, Date.now() - sentTime);
      set({ ping: latency, pingStatus: 'connected' });
    });

    socket.on('connect', () => {
      set({ pingStatus: 'connected' });
      socket.emit('user_connected', { userId, sessionId });
      sendPing();
      if (pingTimer) clearInterval(pingTimer);
      pingTimer = setInterval(sendPing, 8000);
    });

    socket.on('disconnect', () => {
      set({ pingStatus: 'disconnected' });
      if (pingTimer) clearInterval(pingTimer);
    });

    socket.on('connect_error', (err: any) => {
      const freshToken = typeof window !== 'undefined' ? localStorage.getItem('liquid_token') : null;
      if (freshToken && freshToken !== token) {
        socket.auth = { token: freshToken, sessionId, userId };
        socket.io.opts.query = { userId, token: freshToken, sessionId };
      }
      set({ pingStatus: 'connecting' });
    });

    socket.on('online_users', (users: string[]) => {
      set({ onlineUsers: users });
    });

    socket.on('user_status_changed', (data: { userId: string; isOnline: boolean; lastSeen?: string }) => {
      const { onlineUsers, activeContact } = get();
      if (data.isOnline) {
        if (!onlineUsers.includes(data.userId)) {
          set({ onlineUsers: [...onlineUsers, data.userId] });
        }
      } else {
        set({ onlineUsers: onlineUsers.filter(id => id !== data.userId) });
      }

      if (activeContact && activeContact.id === data.userId) {
        set({
          activeContact: {
            ...activeContact,
            lastSeen: data.lastSeen || new Date().toISOString()
          }
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('liquid_status_changed', { detail: data }));
      }
    });

    socket.on('force_logout', (data?: any) => {
      try {
        import('./authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
          if (data?.reason) {
            alert(data.reason);
          }
          window.location.href = '/auth';
        });
      } catch (e) {
        window.location.href = '/auth';
      }
    });

    socket.on('force_logout_session', (data: { sessionId: string }) => {
      const mySessionId = typeof window !== 'undefined' ? localStorage.getItem('liquid_session_id') : null;
      if (mySessionId && data?.sessionId && mySessionId === data.sessionId) {
        import('./authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
          alert('This linked desktop session has been disconnected from your mobile device.');
          window.location.href = '/auth';
        });
      }
    });

    socket.on('force_logout_all_sessions', () => {
      const mySessionId = typeof window !== 'undefined' ? localStorage.getItem('liquid_session_id') : null;
      if (mySessionId) {
        import('./authStore').then(({ useAuthStore }) => {
          useAuthStore.getState().logout();
          alert('All linked desktop sessions have been logged out.');
          window.location.href = '/auth';
        });
      }
    });

    socket.on('user_joined', (newUser: any) => {
      window.dispatchEvent(new CustomEvent('new_user_joined', { detail: newUser }));
    });

    // 1-on-1 incoming message
    socket.on('receive_message', async (message: Message) => {
      let finalMessage = { ...message };
      let senderPubKeyStr = (finalMessage.sender?.publicKey || get().activeContact?.publicKey) as string | undefined;
      
      if (finalMessage.isEncrypted && finalMessage.iv) {
        if (!senderPubKeyStr && finalMessage.senderId) {
          senderPubKeyStr = getCachedUserPublicKey(finalMessage.senderId) || undefined;
        }

        // If public key is still not available, fetch it from server
        if (!senderPubKeyStr && finalMessage.senderId) {
          try {
            const token = localStorage.getItem('liquid_token');
            if (token) {
              const res = await axios.get(`/api/users/${finalMessage.senderId}/public-key`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.data?.publicKey) {
                const fetchedKey: string = res.data.publicKey;
                senderPubKeyStr = fetchedKey;
                cacheUserPublicKey(finalMessage.senderId, fetchedKey);
                const contact = get().activeContact;
                if (contact && contact.id === finalMessage.senderId) {
                  contact.publicKey = fetchedKey;
                }
              }
            }
          } catch (e) {}
        } else if (senderPubKeyStr && finalMessage.senderId) {
          cacheUserPublicKey(finalMessage.senderId, senderPubKeyStr);
        }

        finalMessage.rawText = finalMessage.text;
        if (finalMessage.fileUrl) finalMessage.rawFileUrl = finalMessage.fileUrl;

        if (senderPubKeyStr) {
          try {
            const myKey = await ensureUserKeyPair(userId);
            if (myKey) {
              const sharedKey = await getOrDeriveSharedKey(myKey.privateKey, senderPubKeyStr);
              
              if (finalMessage.text) {
                const dec = await decryptMessage(sharedKey, finalMessage.text, finalMessage.iv);
                if (dec && dec !== '[Decryption Failed]') {
                  finalMessage.text = dec;
                } else {
                  finalMessage.text = '[Decryption Failed]';
                }
              }
              
              if (finalMessage.fileUrl && finalMessage.fileUrl.startsWith('ENC:')) {
                const parts = finalMessage.fileUrl.substring(4).split(':');
                if (parts.length === 2) {
                  const decUrl = await decryptMessage(sharedKey, parts[0], parts[1]);
                  if (decUrl && decUrl !== '[Decryption Failed]') {
                    finalMessage.fileUrl = decUrl;
                  }
                }
              }

              if (finalMessage.text && finalMessage.text !== '[Decryption Failed]') {
                cacheDecryptedMessage(userId, finalMessage.id, { text: finalMessage.text, fileUrl: finalMessage.fileUrl });
              }
            }
          } catch (err) {
            console.error('Failed to decrypt incoming message', err);
            finalMessage.text = '[Decryption Failed]';
          }
        }
      }

      const { activeContact } = get();
      soundEffects.playMessageReceived();

      if (activeContact && (finalMessage.senderId === activeContact.id || finalMessage.receiverId === activeContact.id)) {
        set((state) => {
          if (state.messages.some(m => m.id === finalMessage.id)) return state;
          const activeConversations = !state.activeConversations.includes(finalMessage.senderId) 
            ? [...state.activeConversations, finalMessage.senderId] 
            : state.activeConversations;
          const updated = [...state.messages, finalMessage];
          return { 
            messages: updated,
            messagesByChat: {
              ...state.messagesByChat,
              [activeContact.id]: updated
            },
            activeConversations 
          };
        });
        if (finalMessage.senderId === activeContact.id) {
          socket.emit('mark_seen', { senderId: finalMessage.senderId, receiverId: userId });
        }
      } else {
        set((state) => {
          const activeConversations = !state.activeConversations.includes(finalMessage.senderId)
            ? [...state.activeConversations, finalMessage.senderId]
            : state.activeConversations;
          
          const preview = finalMessage.text || (finalMessage.type === 'image' ? '📷 Photo' : finalMessage.type === 'video' ? '🎥 Video' : finalMessage.type === 'audio' ? '🎵 Voice Note' : finalMessage.fileName || 'Attachment');
          sendBrowserNotification(finalMessage.sender?.username || 'New Message', preview, finalMessage.sender?.avatar);

          const existingHistory = state.messagesByChat[finalMessage.senderId] || [];
          const updatedHistory = existingHistory.some(m => m.id === finalMessage.id)
            ? existingHistory
            : [...existingHistory, finalMessage];

          return {
            activeConversations,
            messagesByChat: {
              ...state.messagesByChat,
              [finalMessage.senderId]: updatedHistory
            },
            incomingToast: { ...finalMessage, text: preview },
            unreadCounts: { ...state.unreadCounts, [finalMessage.senderId]: (state.unreadCounts[finalMessage.senderId] || 0) + 1 }
          };
        });

        setTimeout(() => {
          set((state) => (state.incomingToast?.id === finalMessage.id ? { incomingToast: null } : state));
        }, 5000);
      }
    });

    // Group incoming message
    socket.on('receive_group_message', (message: Message) => {
      const { activeGroup, groups } = get();
      soundEffects.playMessageReceived();

      set((state) => {
        const groupHistory = state.messagesByChat[message.groupId!] || [];
        const cleanedHistory = message.tempId 
          ? groupHistory.filter(m => m.id !== message.tempId && m.tempId !== message.tempId) 
          : groupHistory;
        const updatedHistory = cleanedHistory.some(m => m.id === message.id)
          ? cleanedHistory
          : [...cleanedHistory, message];

        let updatedMessages = state.messages;
        if (activeGroup && message.groupId === activeGroup.id) {
          if (message.tempId) {
            updatedMessages = state.messages.filter(m => m.id !== message.tempId && m.tempId !== message.tempId);
          }
          if (!updatedMessages.some(m => m.id === message.id)) {
            updatedMessages = [...updatedMessages, message];
          }
        }

        return {
          messages: updatedMessages,
          messagesByChat: {
            ...state.messagesByChat,
            [message.groupId!]: updatedHistory
          }
        };
      });

      if (!activeGroup || message.groupId !== activeGroup.id) {
        const grp = groups.find(g => g.id === message.groupId);
        const preview = message.text || (message.type === 'image' ? '📷 Photo' : message.type === 'video' ? '🎥 Video' : message.type === 'audio' ? '🎵 Voice Note' : message.fileName || 'Attachment');
        
        sendBrowserNotification(grp ? `${grp.name} (${message.sender?.username})` : 'New Group Message', preview, grp?.avatar);

        set((state) => ({ 
          incomingToast: { ...message, groupName: grp?.name || 'Group', text: preview },
          unreadCounts: { ...state.unreadCounts, [message.groupId!]: (state.unreadCounts[message.groupId!] || 0) + 1 }
        }));

        setTimeout(() => {
          set((state) => (state.incomingToast?.id === message.id ? { incomingToast: null } : state));
        }, 5000);
      }
    });

    socket.on('message_sent', async (message: Message) => {
      soundEffects.playMessageSent();
      let confirmedMessage = { ...message };
      const currentMessages = get().messages;
      const optimisticIndex = currentMessages.findIndex(
        (m) => (message.tempId && (m.id === message.tempId || m.tempId === message.tempId)) || m.id === message.id
      );

      if (optimisticIndex !== -1) {
        // PRESERVE sender's clean plaintext and fileUrl from optimistic state!
        const optimistic = currentMessages[optimisticIndex];
        confirmedMessage.text = optimistic.text || confirmedMessage.text;
        confirmedMessage.fileUrl = optimistic.fileUrl || confirmedMessage.fileUrl;
        confirmedMessage.isPending = false;
      } else if (confirmedMessage.isEncrypted && confirmedMessage.iv) {
        // Fallback: If sent from another window/device, decrypt using contact public key
        try {
          const contact = get().activeContact;
          if (contact?.publicKey) {
            const myKey = await getKeyFromIDBOrLocalStorage(userId);
            if (myKey) {
              const otherPubKey = await importPublicKey(contact.publicKey);
              const sharedKey = await deriveSharedKey(myKey.privateKey, otherPubKey);
              confirmedMessage.rawText = confirmedMessage.text;
              if (confirmedMessage.fileUrl) confirmedMessage.rawFileUrl = confirmedMessage.fileUrl;

              if (confirmedMessage.text) {
                const dec = await decryptMessage(sharedKey, confirmedMessage.text, confirmedMessage.iv);
                if (dec && dec !== '[Decryption Failed]') {
                  confirmedMessage.text = dec;
                }
              }
              if (confirmedMessage.fileUrl && confirmedMessage.fileUrl.startsWith('ENC:')) {
                const parts = confirmedMessage.fileUrl.substring(4).split(':');
                if (parts.length === 2) {
                  const decUrl = await decryptMessage(sharedKey, parts[0], parts[1]);
                  if (decUrl && decUrl !== '[Decryption Failed]') {
                    confirmedMessage.fileUrl = decUrl;
                  }
                }
              }
            }
          }
        } catch (err) {
          console.error('Failed to decrypt message_sent fallback:', err);
        }
      }

      if (confirmedMessage.id && (confirmedMessage.text || confirmedMessage.fileUrl) && confirmedMessage.text !== '[Decryption Failed]') {
        cacheDecryptedMessage(userId, confirmedMessage.id, { text: confirmedMessage.text || '', fileUrl: confirmedMessage.fileUrl });
      }

      set((state) => {
        const idx = state.messages.findIndex(
          (m) => (message.tempId && (m.id === message.tempId || m.tempId === message.tempId)) || m.id === message.id
        );
        let updated: Message[];
        if (idx !== -1) {
          updated = [...state.messages];
          updated[idx] = confirmedMessage;
        } else {
          updated = [...state.messages, confirmedMessage];
        }

        const currentChatId = state.activeContact?.id || state.activeGroup?.id;
        return { 
          messages: updated,
          messagesByChat: currentChatId ? {
            ...state.messagesByChat,
            [currentChatId]: updated
          } : state.messagesByChat
        };
      });
    });

    socket.on('message_error', ({ error, tempId }: { error: string, tempId?: string }) => {
      alert(error);
      if (tempId) {
        set(state => ({
          messages: state.messages.filter(m => m.id !== tempId)
        }));
      }
    });

    socket.on('message_edited', (updatedMessage: Message) => {
      set((state) => ({
        messages: state.messages.map(m => m.id === updatedMessage.id ? { ...m, text: updatedMessage.text, isEdited: true } : m)
      }));
    });

    socket.on('poll_updated', (updatedMessage: Message) => {
      set((state) => ({
        messages: state.messages.map(m => m.id === updatedMessage.id ? { ...m, pollData: updatedMessage.pollData } : m)
      }));
    });

    socket.on('user_typing', ({ senderId }: { senderId: string }) => {
      set((state) => ({
        typingUsers: Array.from(new Set([...state.typingUsers, senderId]))
      }));
    });

    socket.on('user_stop_typing', ({ senderId }: { senderId: string }) => {
      set((state) => ({
        typingUsers: state.typingUsers.filter(id => id !== senderId)
      }));
    });

    socket.on('group_user_typing', ({ groupId, senderName }: { groupId: string; senderName: string }) => {
      set((state) => {
        const current = state.groupTypingUsers[groupId] || [];
        return {
          groupTypingUsers: {
            ...state.groupTypingUsers,
            [groupId]: Array.from(new Set([...current, senderName]))
          }
        };
      });
    });

    socket.on('group_user_stop_typing', ({ groupId }: { groupId: string }) => {
      set((state) => {
        const copy = { ...state.groupTypingUsers };
        delete copy[groupId];
        return { groupTypingUsers: copy };
      });
    });

    socket.on('messages_marked_seen', ({ seenBy }: { seenBy: string }) => {
      set((state) => ({
        messages: state.messages.map(m => m.receiverId === seenBy ? { ...m, isSeen: true } : m)
      }));
    });

    socket.on('reaction_updated', ({ messageId, reactions }: { messageId: string; reactions: string }) => {
      set((state) => ({
        messages: state.messages.map(m => m.id === messageId ? { ...m, reactions } : m)
      }));
    });

    socket.on('user_profile_updated', (updatedUser: any) => {
      const { activeContact } = get();
      if (activeContact && activeContact.id === updatedUser.id) {
        set({ activeContact: { ...activeContact, ...updatedUser } });
      }
    });

    socket.on('chat_cleared', ({ targetId }: { targetId: string }) => {
      const { activeContact } = get();
      if (activeContact && activeContact.id === targetId) {
        set({ messages: [] });
      }
    });

    socket.on('message_deleted', ({ messageId, isForEveryone }: { messageId: string; isForEveryone?: boolean }) => {
      set((state) => ({
        messages: state.messages.map(m => {
          if (m.id === messageId) {
            return isForEveryone ? { ...m, isDeleted: true, text: 'This message was deleted', fileUrl: undefined } : null;
          }
          return m;
        }).filter(Boolean) as Message[]
      }));
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: [], typingUsers: [], pingStatus: 'disconnected', ping: null });
    }
  },

  refreshOnlineUsers: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      socket.emit('get_online_users');
      socket.emit('presence_ping');
    }
  },

  setActiveContact: (contact) => {
    set((state) => {
      const currentChatId = state.activeContact?.id || state.activeGroup?.id;
      const newChatId = contact?.id;
      const updatedMessagesByChat = currentChatId 
        ? { ...state.messagesByChat, [currentChatId]: state.messages }
        : state.messagesByChat;
      
      let cached = newChatId ? (updatedMessagesByChat[newChatId] || []) : [];
      if ((!cached || cached.length === 0) && newChatId) {
        try {
          const storedUser = localStorage.getItem('liquid_user');
          const uid = storedUser ? JSON.parse(storedUser)?.id : null;
          if (uid) {
            const rawStored = localStorage.getItem(`liquid_chat_history_${uid}_${newChatId}`);
            if (rawStored) {
              const parsed = JSON.parse(rawStored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                cached = parsed;
                updatedMessagesByChat[newChatId] = cached;
              }
            }
          }
        } catch (e) {}
      }

      return { 
        activeContact: contact, 
        activeGroup: null, 
        messagesByChat: updatedMessagesByChat,
        messages: cached,
        replyingTo: null, 
        editingMessage: null, 
        selectedMessageIds: [] 
      };
    });
  },

  setActiveGroup: (group) => {
    const socket = get().socket;
    if (group && socket) {
      socket.emit('join_group', group.id);
    }
    set((state) => {
      const currentChatId = state.activeContact?.id || state.activeGroup?.id;
      const newChatId = group?.id;
      const updatedMessagesByChat = currentChatId 
        ? { ...state.messagesByChat, [currentChatId]: state.messages }
        : state.messagesByChat;
      
      let cached = newChatId ? (updatedMessagesByChat[newChatId] || []) : [];
      if ((!cached || cached.length === 0) && newChatId) {
        try {
          const storedUser = localStorage.getItem('liquid_user');
          const uid = storedUser ? JSON.parse(storedUser)?.id : null;
          if (uid) {
            const rawStored = localStorage.getItem(`liquid_group_history_${uid}_${newChatId}`);
            if (rawStored) {
              const parsed = JSON.parse(rawStored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                cached = parsed;
                updatedMessagesByChat[newChatId] = cached;
              }
            }
          }
        } catch (e) {}
      }

      return { 
        activeGroup: group, 
        activeContact: null, 
        messagesByChat: updatedMessagesByChat,
        messages: cached,
        replyingTo: null, 
        editingMessage: null, 
        selectedMessageIds: [] 
      };
    });
  },

  setGroups: (groups) => set({ groups: Array.isArray(groups) ? groups : [] }),
  setMessages: (messages) => set((state) => {
    const safeMessages = Array.isArray(messages) ? messages : [];
    const currentChatId = state.activeContact?.id || state.activeGroup?.id;
    if (currentChatId) {
      try {
        const storedUser = localStorage.getItem('liquid_user');
        const uid = storedUser ? JSON.parse(storedUser)?.id : null;
        if (uid) {
          const key = state.activeGroup 
            ? `liquid_group_history_${uid}_${currentChatId}` 
            : `liquid_chat_history_${uid}_${currentChatId}`;
          localStorage.setItem(key, JSON.stringify(safeMessages.slice(-100)));
        }
      } catch (e) {}
    }
    return {
      messages: safeMessages,
      messagesByChat: currentChatId ? {
        ...state.messagesByChat,
        [currentChatId]: safeMessages
      } : state.messagesByChat
    };
  }),

  addMessage: (message) => set((state) => {
    const currentChatId = state.activeContact?.id || state.activeGroup?.id;
    const targetChatId = message.groupId || (message.senderId === state.activeContact?.id ? message.senderId : (message.receiverId || currentChatId));
    
    // If it's a 1-on-1 message, add the other party to active conversations
    let currentUserId: string | null = null;
    try {
      const u = localStorage.getItem('liquid_user');
      if (u) currentUserId = JSON.parse(u)?.id;
      if (!currentUserId) currentUserId = localStorage.getItem('userId');
    } catch (e) {}

    const otherId = message.senderId === currentUserId ? message.receiverId : message.senderId;
    const activeConversations = otherId && !state.activeConversations.includes(otherId) && !message.groupId
      ? [...state.activeConversations, otherId]
      : state.activeConversations;
    
    const updatedMessages = [...state.messages.filter(m => m.id !== message.id && m.id !== message.tempId), message];
    const updatedMessagesByChat = targetChatId ? {
      ...state.messagesByChat,
      [targetChatId]: [...(state.messagesByChat[targetChatId] || []).filter(m => m.id !== message.id && m.id !== message.tempId), message]
    } : state.messagesByChat;

    if (targetChatId && currentUserId) {
      try {
        const key = message.groupId 
          ? `liquid_group_history_${currentUserId}_${targetChatId}` 
          : `liquid_chat_history_${currentUserId}_${targetChatId}`;
        const chatList = updatedMessagesByChat[targetChatId] || updatedMessages;
        localStorage.setItem(key, JSON.stringify(chatList.slice(-100)));
      } catch (e) {}
    }

    return { 
      messages: updatedMessages,
      messagesByChat: updatedMessagesByChat,
      activeConversations
    };
  }),
  setReplyingTo: (replyingTo) => set({ replyingTo }),
  setEditingMessage: (editingMessage) => set({ editingMessage }),
  setIncomingToast: (incomingToast) => set({ incomingToast }),

  toggleSelectMessage: (msgId) => {
    set((state) => ({
      selectedMessageIds: state.selectedMessageIds.includes(msgId)
        ? state.selectedMessageIds.filter(id => id !== msgId)
        : [...state.selectedMessageIds, msgId]
    }));
  },

  selectAllMessages: () => {
    set((state) => ({ selectedMessageIds: state.messages.map(m => m.id) }));
  },

  clearSelection: () => set({ selectedMessageIds: [] }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  setChatMetaMap: (metaList) => {
    const map: Record<string, { isPinned: boolean; isArchived: boolean; isMuted: boolean }> = {};
    metaList.forEach(m => {
      map[m.targetId] = { isPinned: m.isPinned, isArchived: m.isArchived, isMuted: m.isMuted };
    });
    set({ chatMetaMap: map });
  },

  setActiveConversations: (ids) => set({ activeConversations: ids }),

  addActiveConversation: (id) => set((state) => ({ 
    activeConversations: state.activeConversations.includes(id) 
      ? state.activeConversations 
      : [...state.activeConversations, id] 
  })),

  updateChatMeta: (targetId, updates) => {
    set((state) => ({
      chatMetaMap: {
        ...state.chatMetaMap,
        [targetId]: {
          ...(state.chatMetaMap[targetId] || { isPinned: false, isArchived: false, isMuted: false }),
          ...updates
        }
      }
    }));
  },

  updateMessageReaction: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, reactions } : m)
    }));
  },

  updateMessagePoll: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    }));
  },

  updateEditedMessage: (updatedMessage) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === updatedMessage.id ? updatedMessage : m)
    }));
  },

  deleteMessageInStore: (messageId, isForEveryone) => {
    set((state) => ({
      messages: state.messages.map(m => {
        if (m.id === messageId) {
          return isForEveryone ? { ...m, isDeleted: true, text: 'This message was deleted', fileUrl: undefined } : null;
        }
        return m;
      }).filter(Boolean) as Message[]
    }));
  },

  toggleStarMessage: (messageId) => {
    set((state) => ({
      messages: state.messages.map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m)
    }));
  },

  markMessagesAsSeenLocally: (seenByUserId) => {
    set((state) => ({
      messages: state.messages.map(m => m.receiverId === seenByUserId ? { ...m, isSeen: true } : m)
    }));
  },

  resetChatStore: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
    }
    set({
      socket: null,
      messages: [],
      groups: [],
      onlineUsers: [],
      typingUsers: [],
      groupTypingUsers: {},
      activeContact: null,
      activeGroup: null,
      replyingTo: null,
      editingMessage: null,
      selectedMessageIds: [],
      searchQuery: '',
      chatMetaMap: {},
      activeConversations: [],
      incomingToast: null,
      unreadCounts: {}
    });
  }
}));
