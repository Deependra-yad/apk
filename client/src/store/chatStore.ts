import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { soundEffects } from '@/utils/audioSynth';
import { getApiUrl } from '@/utils/apiUrl';

export interface Message {
  id: string;
  text?: string;
  type: string; // 'text' | 'image' | 'video' | 'audio' | 'file' | 'poll' | 'system'
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  mimeType?: string;
  duration?: number;
  isSeen: boolean;
  isDeleted?: boolean;
  isEdited?: boolean;
  isStarred?: boolean;
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
  updateMessageReaction: (messageId: string, reactions: string) => void;
  updateMessagePoll: (updatedMessage: Message) => void;
  updateEditedMessage: (updatedMessage: Message) => void;
  deleteMessageInStore: (messageId: string, isForEveryone?: boolean) => void;
  toggleStarMessage: (messageId: string) => void;
  markMessagesAsSeenLocally: (seenByUserId: string) => void;
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

  connectSocket: (userId) => {
    if (get().socket) return;

    const socket = io(getApiUrl(), {
      query: { userId }
    });

    socket.on('online_users', (users: string[]) => {
      set({ onlineUsers: users });
    });

    // 1-on-1 incoming message
    socket.on('receive_message', (message: Message) => {
      const { activeContact } = get();
      soundEffects.playMessageReceived();

      if (activeContact && (message.senderId === activeContact.id || message.receiverId === activeContact.id)) {
        set((state) => ({ messages: [...state.messages, message] }));
        if (message.senderId === activeContact.id) {
          socket.emit('mark_seen', { senderId: message.senderId, receiverId: userId });
        }
      }
    });

    // Group incoming message
    socket.on('receive_group_message', (message: Message) => {
      const { activeGroup } = get();
      soundEffects.playMessageReceived();

      if (activeGroup && message.groupId === activeGroup.id) {
        set((state) => ({ messages: [...state.messages, message] }));
      }
    });

    socket.on('message_sent', (message: Message) => {
      soundEffects.playMessageSent();
      set((state) => ({ messages: [...state.messages, message] }));
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
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  setReplyingTo: (replyingTo) => set({ replyingTo }),
  setEditingMessage: (editingMessage) => set({ editingMessage }),

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
