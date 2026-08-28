import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { soundEffects } from '@/utils/audioSynth';
import { getApiUrl } from '@/utils/apiUrl';
import { sendBrowserNotification, requestNotificationPermission } from '@/utils/notifications';
import axios from 'axios';

export interface Message {
  id: string;
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
  };
  createdAt: string;
  updatedAt?: string;
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

    const socketUrl = getApiUrl();
    const socket = io(socketUrl, {
      query: { userId },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['polling', 'websocket'],
      upgrade: true
    });

    socket.on('connect', () => {
      socket.emit('user_connected', userId);
    });

    socket.on('online_users', (users: string[]) => {
      set({ onlineUsers: users });
    });

    socket.on('force_logout', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    });

    socket.on('user_joined', (newUser: any) => {
      window.dispatchEvent(new CustomEvent('new_user_joined', { detail: newUser }));
    });

    // 1-on-1 incoming message
    socket.on('receive_message', (message: Message) => {
      const { activeContact } = get();
      soundEffects.playMessageReceived();

      if (activeContact && (message.senderId === activeContact.id || message.receiverId === activeContact.id)) {
        set((state) => {
          // Avoid duplicate messages
          if (state.messages.some(m => m.id === message.id)) return state;
          const activeConversations = !state.activeConversations.includes(message.senderId) 
            ? [...state.activeConversations, message.senderId] 
            : state.activeConversations;
          return { messages: [...state.messages, message], activeConversations };
        });
        if (message.senderId === activeContact.id) {
          socket.emit('mark_seen', { senderId: message.senderId, receiverId: userId });
        }
      } else {
        set((state) => {
          const activeConversations = !state.activeConversations.includes(message.senderId)
            ? [...state.activeConversations, message.senderId]
            : state.activeConversations;
          
          const preview = message.text || (message.type === 'image' ? '📷 Photo' : message.type === 'video' ? '🎥 Video' : message.type === 'audio' ? '🎵 Voice Note' : message.fileName || 'Attachment');
          sendBrowserNotification(message.sender?.username || 'New Message', preview, message.sender?.avatar);

          return {
            activeConversations,
            incomingToast: { ...message, text: preview },
            unreadCounts: { ...state.unreadCounts, [message.senderId]: (state.unreadCounts[message.senderId] || 0) + 1 }
          };
        });

        setTimeout(() => {
          set((state) => (state.incomingToast?.id === message.id ? { incomingToast: null } : state));
        }, 5000);
      }
    });

    // Group incoming message
    socket.on('receive_group_message', (message: Message) => {
      const { activeGroup, groups } = get();
      soundEffects.playMessageReceived();

      if (activeGroup && message.groupId === activeGroup.id) {
        set((state) => {
          if (state.messages.some(m => m.id === message.id)) return state;
          return { messages: [...state.messages, message] };
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

    socket.on('message_sent', (message: Message) => {
      soundEffects.playMessageSent();
      set((state) => {
        if (state.messages.some(m => m.id === message.id)) return state;
        return { messages: [...state.messages, message] };
      });
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
    set({ activeContact: contact, activeGroup: null, replyingTo: null, editingMessage: null, selectedMessageIds: [] });
  },

  setActiveGroup: (group) => {
    const socket = get().socket;
    if (group && socket) {
      socket.emit('join_group', group.id);
    }
    set({ activeGroup: group, activeContact: null, replyingTo: null, editingMessage: null, selectedMessageIds: [] });
  },

  setGroups: (groups) => set({ groups }),
  setMessages: (messages) => set({ messages }),
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
  }
}));
