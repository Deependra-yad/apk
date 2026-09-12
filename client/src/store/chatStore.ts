import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { soundEffects } from '@/utils/audioSynth';
import { getApiUrl } from '@/utils/apiUrl';
import { sendBrowserNotification, requestNotificationPermission } from '@/utils/notifications';
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
  resetChatStore: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
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
  unreadCounts: {},

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

    const socketUrl = getApiUrl();
    const socket = io(socketUrl, {
      query: { userId, token, sessionId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      upgrade: true
    });

    socket.on('connect', () => {
      socket.emit('user_connected', { userId, sessionId });
    });

    socket.on('online_users', (users: string[]) => {
      set({ onlineUsers: users });
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
        // If public key is not in payload, fetch it directly from server
        if (!senderPubKeyStr && finalMessage.senderId) {
          try {
            const token = localStorage.getItem('liquid_token');
            if (token) {
              const res = await axios.get(`/api/users/${finalMessage.senderId}/public-key`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (res.data?.publicKey) {
                senderPubKeyStr = res.data.publicKey;
                const contact = get().activeContact;
                if (contact && contact.id === finalMessage.senderId) {
                  contact.publicKey = senderPubKeyStr;
                }
              }
            }
          } catch (e) {}
        }

        finalMessage.rawText = finalMessage.text;
        if (finalMessage.fileUrl) finalMessage.rawFileUrl = finalMessage.fileUrl;

        if (senderPubKeyStr) {
          try {
            const { ensureUserKeyPair, importPublicKey, deriveSharedKey, decryptMessage } = await import('@/utils/crypto');
            const myKey = await ensureUserKeyPair(userId);
            if (myKey) {
              const senderPubKey = await importPublicKey(senderPubKeyStr);
              const sharedKey = await deriveSharedKey(myKey.privateKey, senderPubKey);
              
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
                const { cacheDecryptedMessage } = await import('@/utils/crypto');
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
          // Avoid duplicate messages
          if (state.messages.some(m => m.id === finalMessage.id)) return state;
          const activeConversations = !state.activeConversations.includes(finalMessage.senderId) 
            ? [...state.activeConversations, finalMessage.senderId] 
            : state.activeConversations;
          return { messages: [...state.messages, finalMessage], activeConversations };
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

          return {
            activeConversations,
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

      if (activeGroup && message.groupId === activeGroup.id) {
        set((state) => {
          let updatedList = state.messages;
          if (message.tempId) {
            updatedList = updatedList.filter(m => m.id !== message.tempId && m.tempId !== message.tempId);
          }
          if (updatedList.some(m => m.id === message.id)) return state;
          return { messages: [...updatedList, message] };
        });
      } else {
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
            const { getKeyFromIDBOrLocalStorage, importPublicKey, deriveSharedKey, decryptMessage } = await import('@/utils/crypto');
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

      if (confirmedMessage.id && confirmedMessage.text && confirmedMessage.text !== '[Decryption Failed]') {
        import('@/utils/crypto').then(({ cacheDecryptedMessage }) => {
          cacheDecryptedMessage(userId, confirmedMessage.id, { text: confirmedMessage.text, fileUrl: confirmedMessage.fileUrl });
        }).catch(() => {});
      }

      set((state) => {
        const idx = state.messages.findIndex(
          (m) => (message.tempId && (m.id === message.tempId || m.tempId === message.tempId)) || m.id === message.id
        );
        if (idx !== -1) {
          const updated = [...state.messages];
          updated[idx] = confirmedMessage;
          return { messages: updated };
        }
        return { messages: [...state.messages, confirmedMessage] };
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
      set({ socket: null, onlineUsers: [], typingUsers: [] });
    }
  },

  setActiveContact: (contact) => {
    set((state) => ({ 
      activeContact: contact, 
      activeGroup: contact ? null : state.activeGroup, 
      replyingTo: null, 
      editingMessage: null, 
      selectedMessageIds: [] 
    }));
  },

  setActiveGroup: (group) => {
    const socket = get().socket;
    if (group && socket) {
      socket.emit('join_group', group.id);
    }
    set((state) => ({ 
      activeGroup: group, 
      activeContact: group ? null : state.activeContact, 
      replyingTo: null, 
      editingMessage: null, 
      selectedMessageIds: [] 
    }));
  },

  setGroups: (groups) => set({ groups: Array.isArray(groups) ? groups : [] }),
  setMessages: (messages) => set({ messages: Array.isArray(messages) ? messages : [] }),
  addMessage: (message) => set((state) => {
    // If it's a 1-on-1 message, add the other party to active conversations
    const otherId = message.senderId === localStorage.getItem('userId') ? message.receiverId : message.senderId;
    const activeConversations = otherId && !state.activeConversations.includes(otherId) && !message.groupId
      ? [...state.activeConversations, otherId]
      : state.activeConversations;
    
    return { 
      messages: [...state.messages, message],
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
