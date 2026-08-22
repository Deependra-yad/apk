"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, Send, Mic, Phone, Video, Search, 
  X, Reply, Trash2, Check, CheckCheck, FileText, 
  Download, Smile, MoreVertical, Maximize2, Image as ImageIcon, 
  Film, BarChart2, Star, Copy, Play, Pause, Volume2, Eye, 
  Code2, Archive, File, Edit2, Forward, CheckSquare, Square, 
  Users, UserPlus, Info, CornerUpRight, Bot, Sparkles, Pin, Clock, FolderKanban,
  ArrowLeft
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, Message } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { format } from 'date-fns';
import axios from 'axios';
import VoiceRecorder, { AudioBubblePlayer } from './VoiceRecorder';
import MessageReactions, { ReactionBadges } from './MessageReactions';
import PollModal, { PollBubble } from './PollModal';
import DocumentViewerModal from './DocumentViewerModal';
import ForwardModal from './ForwardModal';
import GroupInfoDrawer from './GroupInfoDrawer';
import LiquidAiModal from './LiquidAiModal';
import MediaGalleryDrawer from './MediaGalleryDrawer';
import StickerGifPicker from './StickerGifPicker';
import { resolveMediaUrl } from '@/utils/apiUrl';

interface ChatAreaProps {
  onStartCall: (isVideo: boolean) => void;
  onOpenProfile: () => void;
  onBack?: () => void;
  users: any[];
}

// Markdown & Code block renderer
function renderFormattedMessage(text: string) {
  if (text.includes('```')) {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        const firstLine = lines[0].trim();
        const hasLang = /^[a-zA-Z0-9_-]+$/.test(firstLine);
        const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');
        return (
          <div key={index} className="my-2 rounded-xl bg-black/60 border border-white/10 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/5 text-[10px] text-gray-400">
              <span className="font-bold uppercase text-liquid-accent">{hasLang ? firstLine : 'CODE'}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(code);
                }}
                className="hover:text-liquid-accent text-[10px] flex items-center gap-1 font-sans"
              >
                <Copy size={11} /> Copy Code
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-cyan-200">
              <code>{code}</code>
            </pre>
          </div>
        );
      }
      return <span key={index} className="whitespace-pre-wrap">{part}</span>;
    });
  }

  return <span className="whitespace-pre-wrap">{text}</span>;
}

export default function ChatArea({ onStartCall, onOpenProfile, onBack, users }: ChatAreaProps) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [isGroupDrawerOpen, setIsGroupDrawerOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);

  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; name?: string } | null>(null);
  const [selectedDocumentForModal, setSelectedDocumentForModal] = useState<{ url: string; name: string; size?: string; mimeType?: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTypeFilterRef = useRef<string>('*/*');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  const { user, token } = useAuthStore();
  const { 
    activeContact, 
    activeGroup,
    messages, 
    setMessages, 
    socket, 
    onlineUsers, 
    typingUsers, 
    groupTypingUsers,
    replyingTo, 
    setReplyingTo,
    editingMessage, 
    setEditingMessage,
    selectedMessageIds,
    toggleSelectMessage,
    selectAllMessages,
    clearSelection,
    updateMessageReaction,
    deleteMessageInStore,
    toggleStarMessage
  } = useChatStore();

  const { enterToSend } = useSettingsStore();

  const isGroup = !!activeGroup;
  const isMultiSelectMode = selectedMessageIds.length > 0;
  const targetId = activeContact?.id || activeGroup?.id || '';
  const targetName = isGroup ? activeGroup?.name : activeContact?.username || '';

  // Load chat history & mark seen
  useEffect(() => {
    if (token && user) {
      if (activeContact) {
        axios.get(`/api/messages/${activeContact.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setMessages(res.data);
          if (socket) {
            socket.emit('mark_seen', { senderId: activeContact.id, receiverId: user.id });
          }
        });
      } else if (activeGroup) {
        axios.get(`/api/messages/group/${activeGroup.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setMessages(res.data);
        });
      }
    }
  }, [activeContact, activeGroup, token, user, socket, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers, groupTypingUsers]);

  // Handle local file preview url creation
  useEffect(() => {
    if (file) {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        setFilePreviewUrl(url);
        return () => URL.revokeObjectURL(url);
      } else {
        setFilePreviewUrl(null);
      }
    } else {
      setFilePreviewUrl(null);
    }
  }, [file]);

  // When edit mode triggers, populate input text
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text || '');
    }
  }, [editingMessage]);

  // Typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    if (!socket || !user) return;

    if (isGroup && activeGroup) {
      socket.emit('typing_start', { senderId: user.id, groupId: activeGroup.id, senderName: user.username });
    } else if (activeContact) {
      socket.emit('typing_start', { senderId: user.id, receiverId: activeContact.id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isGroup && activeGroup) {
        socket.emit('typing_stop', { senderId: user.id, groupId: activeGroup.id });
      } else if (activeContact) {
        socket.emit('typing_stop', { senderId: user.id, receiverId: activeContact.id });
      }
    }, 2000);
  };

  // Open specific file attachment type
  const triggerFileInput = (accept: string) => {
    fileTypeFilterRef.current = accept;
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
    setIsAttachmentMenuOpen(false);
  };

  // Send or Edit message
  const handleSend = async () => {
    if ((!text.trim() && !file) || !user || !socket) return;
    if (!activeContact && !activeGroup) return;

    // Check if user is typing /ai command
    if (text.trim().startsWith('/ai ')) {
      const aiPrompt = text.trim().slice(4);
      setText('');
      // Emit user prompt first
      socket.emit('send_message', {
        text: `🤖 /ai ${aiPrompt}`,
        senderId: user.id,
        receiverId: isGroup ? null : activeContact?.id,
        groupId: isGroup ? activeGroup?.id : null,
        type: 'text'
      });

      // Call AI endpoint
      try {
        const aiRes = await axios.post('/api/ai/chat', { prompt: aiPrompt });
        socket.emit('send_message', {
          text: `✨ **Liquid AI Assistant:**\n${aiRes.data.response}`,
          senderId: user.id,
          receiverId: isGroup ? null : activeContact?.id,
          groupId: isGroup ? activeGroup?.id : null,
          type: 'text'
        });
      } catch (e) {}
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (isGroup) {
      socket.emit('typing_stop', { senderId: user.id, groupId: activeGroup!.id });
    } else {
      socket.emit('typing_stop', { senderId: user.id, receiverId: activeContact!.id });
    }

    // If Editing Existing Message
    if (editingMessage) {
      try {
        await axios.put(`/api/messages/${editingMessage.id}/edit`, {
          text: text.trim()
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        socket.emit('edit_message', {
          messageId: editingMessage.id,
          text: text.trim(),
          receiverId: isGroup ? null : activeContact?.id,
          groupId: isGroup ? activeGroup?.id : null
        });

        setEditingMessage(null);
        setText('');
      } catch (e) {}
      return;
    }

    // Normal Send New Message
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let mimeType = null;
    let type = 'text';

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post('/api/upload', formData);
      fileUrl = res.data.fileUrl;
      fileName = res.data.fileName;
      fileSize = res.data.fileSize;
      mimeType = res.data.mimeType;
      type = res.data.type;
    }

    socket.emit('send_message', {
      text,
      senderId: user.id,
      receiverId: isGroup ? null : activeContact?.id,
      groupId: isGroup ? activeGroup?.id : null,
      type,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      replyToId: replyingTo?.id || null,
      replyToText: replyingTo?.text || (replyingTo?.type === 'image' ? '📷 Image' : replyingTo?.type === 'video' ? '🎥 Video' : replyingTo?.type === 'audio' ? '🎵 Voice Note' : replyingTo?.fileName) || null
    });

    setText('');
    setFile(null);
    setFilePreviewUrl(null);
    setReplyingTo(null);
  };

  // Send Sticker / GIF
  const handleSendStickerOrGif = (url: string, type: 'sticker' | 'image') => {
    if ((!activeContact && !activeGroup) || !user || !socket) return;
    socket.emit('send_message', {
      text: '',
      senderId: user.id,
      receiverId: isGroup ? null : activeContact?.id,
      groupId: isGroup ? activeGroup?.id : null,
      type,
      fileUrl: url,
      replyToId: replyingTo?.id || null,
      replyToText: replyingTo?.text || null
    });
    setReplyingTo(null);
  };

  // Send Voice Note
  const handleSendVoiceNote = (audioUrl: string, duration: number) => {
    if ((!activeContact && !activeGroup) || !user || !socket) return;
    socket.emit('send_message', {
      text: '',
      senderId: user.id,
      receiverId: isGroup ? null : activeContact?.id,
      groupId: isGroup ? activeGroup?.id : null,
      type: 'audio',
      fileUrl: audioUrl,
      duration,
      replyToId: replyingTo?.id || null,
      replyToText: replyingTo?.text || null
    });
    setIsRecordingVoice(false);
    setReplyingTo(null);
  };

  // Create Poll
  const handleCreatePoll = (pollData: any) => {
    if ((!activeContact && !activeGroup) || !user || !socket) return;
    socket.emit('send_message', {
      text: '',
      senderId: user.id,
      receiverId: isGroup ? null : activeContact?.id,
      groupId: isGroup ? activeGroup?.id : null,
      type: 'poll',
      pollData,
      replyToId: replyingTo?.id || null,
      replyToText: replyingTo?.text || null
    });
    setIsPollModalOpen(false);
  };

  // Vote on Poll
  const handleVotePoll = (messageId: string, optionId: number) => {
    if (!socket || !user) return;
    socket.emit('vote_poll', {
      messageId,
      optionId,
      voterId: user.id,
      receiverId: isGroup ? null : activeContact?.id,
      groupId: isGroup ? activeGroup?.id : null
    });
  };

  // React to message
  const handleReact = async (messageId: string, emoji: string) => {
    if (!token || !user || !socket) return;
    try {
      const res = await axios.put(`/api/messages/${messageId}/react`, {
        emoji
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      updateMessageReaction(messageId, res.data.reactions);
      socket.emit('message_reaction', {
        messageId,
        receiverId: isGroup ? null : activeContact?.id,
        groupId: isGroup ? activeGroup?.id : null,
        reactions: res.data.reactions
      });
    } catch (e) {}
  };

  // Delete message
  const handleDeleteMessage = async (messageId: string, forEveryone: boolean) => {
    if (!token || !user || !socket) return;
    try {
      await axios.delete(`/api/messages/${messageId}`, {
        data: { deleteForEveryone: forEveryone },
        headers: { Authorization: `Bearer ${token}` }
      });
      deleteMessageInStore(messageId, forEveryone);
      if (forEveryone) {
        socket.emit('message_deleted', {
          messageId,
          receiverId: isGroup ? null : activeContact?.id,
          groupId: isGroup ? activeGroup?.id : null,
          isForEveryone: true
        });
      }
    } catch (e) {}
  };

  // Bulk Multi-Message Actions
  const handleBulkDelete = async () => {
    if (!token) return;
    for (const msgId of selectedMessageIds) {
      await handleDeleteMessage(msgId, false);
    }
    clearSelection();
  };

  const handleBulkStar = async () => {
    if (!token) return;
    for (const msgId of selectedMessageIds) {
      await axios.put(`/api/messages/${msgId}/star`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toggleStarMessage(msgId);
    }
    clearSelection();
  };

  // File type icon & badge helper
  const getFileMetadataDisplay = (fileName?: string, mimeType?: string) => {
    const name = fileName?.toLowerCase() || '';
    if (name.endsWith('.pdf') || mimeType?.includes('pdf')) {
      return { icon: FileText, color: 'text-red-400 bg-red-500/20 border-red-500/30', label: 'PDF' };
    }
    if (name.match(/\.(zip|rar|tar|gz|7z)$/)) {
      return { icon: Archive, color: 'text-amber-400 bg-amber-500/20 border-amber-500/30', label: 'ZIP' };
    }
    if (name.match(/\.(js|ts|jsx|tsx|py|html|css|json|cpp|c|java|go|rs|sql|sh)$/)) {
      return { icon: Code2, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30', label: 'CODE' };
    }
    if (name.match(/\.(doc|docx|txt|rtf|odt)$/)) {
      return { icon: FileText, color: 'text-blue-400 bg-blue-500/20 border-blue-500/30', label: 'DOC' };
    }
    return { icon: File, color: 'text-liquid-accent bg-liquid-accent/20 border-liquid-accent/30', label: 'FILE' };
  };

  if (!activeContact && !activeGroup) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-liquid-dark relative overflow-hidden p-6 text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="w-28 h-28 mb-8 rounded-full bg-gradient-to-tr from-liquid-accent via-cyan-400 to-liquid-secondary shadow-[0_0_50px_rgba(0,210,255,0.4)] flex items-center justify-center p-1"
        >
          <div className="w-full h-full bg-liquid-base rounded-full flex items-center justify-center">
            <span className="text-4xl">🌊</span>
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Liquid Chat</h2>
        <p className="text-gray-400 max-w-sm">
          Select a contact, open a group, or start a new conversation.
        </p>
      </div>
    );
  }

  const isOnline = activeContact ? onlineUsers.includes(activeContact.id) : false;
  const isDirectTyping = activeContact ? typingUsers.includes(activeContact.id) : false;
  const groupTypers = activeGroup ? (groupTypingUsers[activeGroup.id] || []) : [];

  // In-chat search filter
  const filteredMessages = chatSearchTerm.trim()
    ? messages.filter(m => m.text?.toLowerCase().includes(chatSearchTerm.toLowerCase()) || m.fileName?.toLowerCase().includes(chatSearchTerm.toLowerCase()))
    : messages;

  return (
    <div className="flex-1 flex flex-col h-full bg-liquid-dark relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-liquid-accent/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Multi-Select Bulk Actions Top Bar Overlay */}
      {isMultiSelectMode ? (
        <div className="h-20 border-b border-white/10 bg-liquid-base/95 backdrop-blur-2xl px-6 flex items-center justify-between z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={clearSelection} className="text-gray-400 hover:text-white p-2 rounded-xl">
              <X size={20} />
            </button>
            <span className="text-sm font-bold text-white font-mono">
              {selectedMessageIds.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={selectAllMessages} className="p-2 text-xs text-liquid-accent font-semibold hover:underline">
              Select All
            </button>
            <button onClick={handleBulkStar} className="p-2.5 rounded-xl bg-white/10 hover:bg-yellow-500/20 text-yellow-400 flex items-center gap-1.5 text-xs font-semibold">
              <Star size={16} /> Star
            </button>
            <button onClick={() => setIsForwardModalOpen(true)} className="p-2.5 rounded-xl bg-liquid-accent/20 hover:bg-liquid-accent/30 text-liquid-accent flex items-center gap-1.5 text-xs font-semibold">
              <Forward size={16} /> Forward
            </button>
            <button onClick={handleBulkDelete} className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 flex items-center gap-1.5 text-xs font-semibold">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </div>
      ) : (
        /* Standard Chat Header */
        <div className="h-16 sm:h-20 border-b border-white/5 flex items-center justify-between px-3 sm:px-6 bg-liquid-base/60 backdrop-blur-2xl z-20 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            {onBack && (
              <button 
                onClick={onBack}
                className="sm:hidden p-2 -ml-1 text-gray-300 hover:text-white rounded-xl hover:bg-white/10 transition-colors shrink-0"
                title="Back to chats"
              >
                <ArrowLeft size={22} />
              </button>
            )}

            <div 
              className="flex items-center gap-3 cursor-pointer overflow-hidden" 
              onClick={() => isGroup ? setIsGroupDrawerOpen(true) : onOpenProfile()}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary">
                  <img 
                    src={isGroup ? (activeGroup?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(activeGroup?.name || 'G')}`) : activeContact?.avatar} 
                    alt={isGroup ? activeGroup?.name : activeContact?.username} 
                    className="w-full h-full rounded-full object-cover bg-liquid-base" 
                  />
                </div>
                {!isGroup && isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-liquid-base shadow-sm" />
                )}
              </div>

              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-white font-semibold text-sm sm:text-base truncate">
                    {isGroup ? activeGroup?.name : activeContact?.username}
                  </h2>
                  {isGroup && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-liquid-accent/20 text-liquid-accent shrink-0">Group</span>
                  )}
                </div>

              {/* Typing / Online / Member status */}
              {isGroup ? (
                groupTypers.length > 0 ? (
                  <span className="text-xs text-liquid-accent font-medium animate-pulse">
                    {groupTypers.join(', ')} typing...
                  </span>
                ) : (
                  <p className="text-xs text-gray-400 font-medium">
                    {activeGroup?.members.length} participants
                  </p>
                )
              ) : isDirectTyping ? (
                <div className="flex items-center gap-1 text-xs text-liquid-accent font-medium">
                  <span>typing</span>
                  <span className="flex gap-0.5">
                    <span className="w-1 h-1 bg-liquid-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1 h-1 bg-liquid-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1 h-1 bg-liquid-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-medium">
                  {isOnline ? (
                    <span className="text-green-400">Online</span>
                  ) : activeContact?.lastSeen ? (
                    `Last seen ${format(new Date(activeContact.lastSeen), 'hh:mm a')}`
                  ) : (
                    'Offline'
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-gray-300">
            {/* AI Assistant Button */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="p-2.5 rounded-full hover:bg-white/10 text-liquid-accent transition-all"
              title="Liquid AI Assistant"
            >
              <Bot size={20} />
            </button>

            {/* Media Gallery / Starred Vault Drawer Button */}
            <button
              onClick={() => setIsGalleryOpen(true)}
              className="p-2.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-white transition-all"
              title="Shared Media & Files"
            >
              <FolderKanban size={20} />
            </button>

            {!isGroup && (
              <>
                <button 
                  onClick={() => onStartCall(false)}
                  className="p-2.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-liquid-accent transition-all"
                  title="Voice Call"
                >
                  <Phone size={20} />
                </button>

                <button 
                  onClick={() => onStartCall(true)}
                  className="p-2.5 rounded-full hover:bg-white/10 text-gray-300 hover:text-liquid-accent transition-all"
                  title="Video Call"
                >
                  <Video size={20} />
                </button>
              </>
            )}

            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`p-2.5 rounded-full transition-all ${isSearchOpen ? 'bg-liquid-accent text-liquid-dark' : 'hover:bg-white/10 hover:text-white'}`}
              title="Search Messages"
            >
              <Search size={20} />
            </button>

            <button 
              onClick={() => isGroup ? setIsGroupDrawerOpen(true) : onOpenProfile()}
              className="p-2.5 rounded-full hover:bg-white/10 hover:text-white transition-all"
              title={isGroup ? "Group Info" : "Contact Info"}
            >
              {isGroup ? <Info size={20} /> : <MoreVertical size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* In-Chat Search Bar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/5 bg-liquid-base/80 backdrop-blur-xl px-6 py-2 flex items-center gap-3 z-10"
          >
            <Search size={16} className="text-gray-400" />
            <input
              type="text"
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              placeholder="Search in this conversation..."
              className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-gray-500"
              autoFocus
            />
            {chatSearchTerm && (
              <button onClick={() => setChatSearchTerm('')} className="text-gray-400 hover:text-white">
                <X size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {filteredMessages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const isSelected = selectedMessageIds.includes(msg.id);
          const { icon: FileIcon, color: fileColorBadge, label: fileLabel } = getFileMetadataDisplay(msg.fileName, msg.mimeType);

          return (
            <motion.div
              key={msg.id || i}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.02, type: "spring", stiffness: 260, damping: 24 }}
              className={`max-w-[85%] sm:max-w-[70%] flex items-start gap-2 relative group ${
                isMe ? 'self-end flex-row-reverse' : 'self-start flex-row'
              }`}
            >
              {/* Multi-Select Checkbox */}
              {isMultiSelectMode && (
                <button 
                  onClick={() => toggleSelectMessage(msg.id)}
                  className="mt-3 text-liquid-accent shrink-0"
                >
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-gray-500" />}
                </button>
              )}

              {/* Message Content Container */}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full`}>
                {/* Group Sender Avatar & Name */}
                {isGroup && !isMe && msg.sender && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <img src={msg.sender.avatar} alt={msg.sender.username} className="w-4 h-4 rounded-full" />
                    <span className="text-[11px] font-bold text-liquid-accent">{msg.sender.username}</span>
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  onClick={() => isMultiSelectMode && toggleSelectMessage(msg.id)}
                  className={`p-3.5 rounded-2xl relative transition-all ${
                    isSelected ? 'ring-2 ring-liquid-accent shadow-[0_0_20px_rgba(0,210,255,0.4)]' : ''
                  } ${
                    isMe
                      ? 'bg-gradient-to-br from-liquid-accent to-liquid-secondary text-white rounded-br-sm shadow-[0_0_20px_rgba(0,210,255,0.25)]'
                      : 'bg-white/10 text-white rounded-bl-sm border border-white/5 backdrop-blur-md'
                  }`}
                >
                  {/* Forwarded Header */}
                  {msg.forwardedFrom && (
                    <div className="flex items-center gap-1 text-[10px] text-white/70 italic mb-1.5">
                      <CornerUpRight size={12} />
                      <span>Forwarded from {msg.forwardedFrom}</span>
                    </div>
                  )}

                  {/* Reply Quote Banner */}
                  {msg.replyToText && (
                    <div className="mb-2 p-2 rounded-lg bg-black/30 border-l-4 border-white/70 text-xs text-white/90">
                      <span className="font-semibold block text-[10px] text-liquid-accent">Replying to:</span>
                      <span className="truncate block opacity-90">{msg.replyToText}</span>
                    </div>
                  )}

                  {/* Deleted State */}
                  {msg.isDeleted ? (
                    <p className="italic opacity-60 text-xs flex items-center gap-1.5 py-1">
                      <Trash2 size={13} />
                      <span>This message was deleted</span>
                    </p>
                  ) : (
                    <>
                      {/* Media: Image with Click-to-Lightbox */}
                      {msg.type === 'image' && msg.fileUrl && (
                        <div 
                          className="mb-2 rounded-xl overflow-hidden relative cursor-pointer group/img max-h-80 bg-black/40" 
                          onClick={() => setSelectedLightboxMedia({ url: resolveMediaUrl(msg.fileUrl), type: 'image', name: msg.fileName || 'Image' })}
                        >
                          <img 
                            src={resolveMediaUrl(msg.fileUrl)} 
                            alt="attachment" 
                            className="rounded-xl max-h-80 w-full object-cover hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 size={24} className="text-white drop-shadow-md" />
                          </div>
                        </div>
                      )}

                      {/* Media: Sticker */}
                      {msg.type === 'sticker' && msg.fileUrl && (
                        <div className="p-1 mb-1">
                          <img src={resolveMediaUrl(msg.fileUrl)} alt="Sticker" className="w-36 h-36 object-contain drop-shadow-lg" />
                        </div>
                      )}

                      {/* Media: Video Player with Inline Controls & Fullscreen */}
                      {msg.type === 'video' && msg.fileUrl && (
                        <div className="mb-2 rounded-xl overflow-hidden relative bg-black/80 max-h-80">
                          <video 
                            src={resolveMediaUrl(msg.fileUrl)} 
                            controls 
                            playsInline
                            preload="metadata"
                            className="w-full max-h-80 rounded-xl object-contain" 
                          />
                        </div>
                      )}

                      {/* Media: Audio / Voice Note */}
                      {msg.type === 'audio' && msg.fileUrl && (
                        <AudioBubblePlayer audioUrl={resolveMediaUrl(msg.fileUrl)} duration={msg.duration} />
                      )}

                      {/* Media: WhatsApp Interactive Poll */}
                      {msg.type === 'poll' && msg.pollData && (
                        <PollBubble 
                          messageId={msg.id} 
                          pollData={msg.pollData} 
                          onVote={handleVotePoll}
                          currentUserId={user?.id}
                          isMe={isMe}
                        />
                      )}

                      {/* Media: Rich Document / PDF / Code / Archive Card */}
                      {msg.type === 'file' && msg.fileUrl && (
                        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-black/30 mb-2 border border-white/10 min-w-[240px] sm:min-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${fileColorBadge} shrink-0`}>
                              <FileIcon size={22} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-xs font-semibold truncate text-white">{msg.fileName || 'Document'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-white/10 text-white/80">
                                  {fileLabel}
                                </span>
                                <span className="text-[10px] text-gray-400 font-mono">{msg.fileSize || 'File'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                            <button
                              onClick={() => setSelectedDocumentForModal({
                                url: resolveMediaUrl(msg.fileUrl),
                                name: msg.fileName || 'Document',
                                size: msg.fileSize,
                                mimeType: msg.mimeType
                              })}
                              className="flex-1 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>

                            <a
                              href={resolveMediaUrl(msg.fileUrl)}
                              download={msg.fileName || 'file'}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 h-8 rounded-lg bg-liquid-accent/20 hover:bg-liquid-accent/30 text-liquid-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Download size={13} />
                              <span>Save</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* Text Body with Code Highlighting & Markdown */}
                      {msg.text && (
                        <div className="leading-relaxed text-sm break-words">
                          {renderFormattedMessage(msg.text)}
                        </div>
                      )}
                    </>
                  )}

                  {/* Footer: Edited, Star, Time & Read Receipts */}
                  <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-75">
                    {msg.isEdited && <span className="italic font-medium text-[9px] text-white/80">(edited)</span>}
                    {msg.isStarred && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
                    <span>{msg.createdAt ? format(new Date(msg.createdAt), 'hh:mm a') : 'Now'}</span>
                    {isMe && !msg.isDeleted && !isGroup && (
                      <span>
                        {msg.isSeen ? (
                          <CheckCheck size={14} className="text-cyan-300 drop-shadow-[0_0_6px_rgba(0,210,255,0.8)]" />
                        ) : (
                          <Check size={14} className="text-white/70" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Hover Action Bar */}
                  {!isMultiSelectMode && (
                    <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/60 rounded-full px-1.5 py-0.5 backdrop-blur-md z-10">
                      <button 
                        onClick={() => setActiveReactionMessageId(activeReactionMessageId === msg.id ? null : msg.id)}
                        className="p-1 text-white/80 hover:text-liquid-accent transition-colors"
                        title="React"
                      >
                        <Smile size={13} />
                      </button>

                      <button 
                        onClick={() => setReplyingTo(msg)}
                        className="p-1 text-white/80 hover:text-white transition-colors"
                        title="Reply"
                      >
                        <Reply size={13} />
                      </button>

                      <button 
                        onClick={() => {
                          clearSelection();
                          toggleSelectMessage(msg.id);
                          setIsForwardModalOpen(true);
                        }}
                        className="p-1 text-white/80 hover:text-liquid-accent transition-colors"
                        title="Forward"
                      >
                        <Forward size={13} />
                      </button>

                      {isMe && msg.text && !msg.isDeleted && (
                        <button 
                          onClick={() => setEditingMessage(msg)}
                          className="p-1 text-white/80 hover:text-cyan-400 transition-colors"
                          title="Edit Message"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      <button 
                        onClick={() => toggleStarMessage(msg.id)}
                        className="p-1 text-white/80 hover:text-yellow-400 transition-colors"
                        title="Star Message"
                      >
                        <Star size={13} className={msg.isStarred ? "text-yellow-400 fill-yellow-400" : ""} />
                      </button>

                      <button 
                        onClick={() => toggleSelectMessage(msg.id)}
                        className="p-1 text-white/80 hover:text-white transition-colors"
                        title="Select"
                      >
                        <CheckSquare size={13} />
                      </button>

                      {isMe && !msg.isDeleted && (
                        <button 
                          onClick={() => handleDeleteMessage(msg.id, true)}
                          className="p-1 text-white/80 hover:text-red-400 transition-colors"
                          title="Delete for Everyone"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reactions Popover */}
                  {activeReactionMessageId === msg.id && (
                    <MessageReactions 
                      onSelectEmoji={(emoji) => handleReact(msg.id, emoji)}
                      onClose={() => setActiveReactionMessageId(null)}
                    />
                  )}
                </div>

                {/* Reaction Badges */}
                <ReactionBadges 
                  reactions={msg.reactions} 
                  onReact={(emoji) => handleReact(msg.id, emoji)}
                  currentUserId={user?.id}
                />
              </div>
            </motion.div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Editing Message Banner */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-950/90 border-t border-cyan-500/30 px-6 py-2 flex items-center justify-between z-20 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2 overflow-hidden text-xs text-cyan-200">
              <Edit2 size={14} className="text-cyan-400 shrink-0" />
              <span>Editing message: <strong className="truncate max-w-sm">{editingMessage.text}</strong></span>
            </div>
            <button onClick={() => { setEditingMessage(null); setText(''); }} className="text-cyan-400 hover:text-white p-1">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reply Context Banner */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-liquid-base/95 border-t border-white/10 px-6 py-2.5 flex items-center justify-between z-10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-lg bg-liquid-accent/20 text-liquid-accent">
                <Reply size={16} />
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-liquid-accent">
                  Replying to message
                </span>
                <p className="text-xs text-gray-300 truncate">
                  {replyingTo.text || (replyingTo.type === 'image' ? '📷 Image' : replyingTo.type === 'video' ? '🎥 Video' : replyingTo.type === 'audio' ? '🎵 Voice Note' : replyingTo.fileName)}
                </p>
              </div>
            </div>

            <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-white p-1">
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rich Attachment Staging Card */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="bg-liquid-base/95 border-t border-liquid-accent/30 px-6 py-3 flex items-center justify-between z-20 backdrop-blur-xl shadow-lg"
          >
            <div className="flex items-center gap-3.5 overflow-hidden">
              {filePreviewUrl && file.type.startsWith('image/') ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0">
                  <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : filePreviewUrl && file.type.startsWith('video/') ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/60 border border-white/10 flex items-center justify-center shrink-0">
                  <Film size={22} className="text-rose-400" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-liquid-accent/20 text-liquid-accent border border-liquid-accent/30 shrink-0">
                  <FileText size={22} />
                </div>
              )}

              <div className="overflow-hidden">
                <span className="text-xs font-bold text-white block truncate max-w-sm">{file.name}</span>
                <span className="text-[11px] text-liquid-accent font-mono">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB • {file.type || 'Document'}
                </span>
              </div>
            </div>

            <button 
              onClick={() => {
                setFile(null);
                setFilePreviewUrl(null);
              }} 
              className="p-2 text-red-400 hover:text-red-300 hover:bg-white/5 rounded-full transition-colors"
              title="Cancel Attachment"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar Area */}
      <div className="min-h-16 sm:min-h-24 bg-liquid-base/90 backdrop-blur-2xl border-t border-white/5 px-2 sm:px-6 py-2 sm:py-4 flex items-center gap-1.5 sm:gap-3 z-20 relative shrink-0">
        {/* Sticker & GIF Picker Modal */}
        <StickerGifPicker
          isOpen={isStickerPickerOpen}
          onClose={() => setIsStickerPickerOpen(false)}
          onSelectSticker={(url) => handleSendStickerOrGif(url, 'sticker')}
          onSelectGif={(url) => handleSendStickerOrGif(url, 'image')}
          onSelectEmoji={(emoji) => setText(prev => prev + emoji)}
        />

        {isRecordingVoice ? (
          <VoiceRecorder 
            onSendVoiceNote={handleSendVoiceNote} 
            onCancel={() => setIsRecordingVoice(false)} 
          />
        ) : (
          <>
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
            />

            {/* Sticker / GIF Picker Toggle */}
            <button
              onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
              className={`p-2 sm:p-2.5 rounded-full transition-colors shrink-0 ${
                isStickerPickerOpen ? 'bg-liquid-accent text-liquid-dark' : 'text-gray-400 hover:text-liquid-accent hover:bg-white/5'
              }`}
              title="Stickers, GIFs & Emojis"
            >
              <Smile size={20} className="sm:w-5 sm:h-5" />
            </button>

            {/* Attachment Menu */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
                className={`p-2 sm:p-3 rounded-full transition-all ${
                  isAttachmentMenuOpen 
                    ? 'bg-liquid-accent text-liquid-dark rotate-45' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title="Attach"
              >
                <Paperclip size={20} className="sm:w-5 sm:h-5" />
              </button>

              <AnimatePresence>
                {isAttachmentMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 20 }}
                    className="absolute bottom-16 left-0 z-30 bg-liquid-base/95 backdrop-blur-2xl p-3 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.6)] flex flex-col gap-2 min-w-[200px]"
                  >
                    <button
                      onClick={() => triggerFileInput('image/*')}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                        <ImageIcon size={18} />
                      </div>
                      <span>Photos & Images</span>
                    </button>

                    <button
                      onClick={() => triggerFileInput('video/*')}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                        <Film size={18} />
                      </div>
                      <span>Videos</span>
                    </button>

                    <button
                      onClick={() => triggerFileInput('*/*')}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <FileText size={18} />
                      </div>
                      <span>Documents & PDFs</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAttachmentMenuOpen(false);
                        setIsPollModalOpen(true);
                      }}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/10 text-white text-xs font-medium transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <BarChart2 size={18} />
                      </div>
                      <span>Create Poll</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Text Input */}
            <div className="flex-1 bg-black/40 rounded-full h-10 sm:h-12 flex items-center px-3 sm:px-5 border border-white/10 focus-within:border-liquid-accent/50 transition-colors">
              <input 
                type="text" 
                value={text}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && enterToSend) {
                    handleSend();
                  }
                }}
                placeholder={editingMessage ? "Update text..." : "Message or /ai..."}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 text-base sm:text-sm"
              />
            </div>

            {/* Send / Edit / Mic Button */}
            {(text.trim() || file) ? (
              <motion.button 
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSend}
                className="bg-gradient-to-tr from-liquid-accent to-liquid-secondary text-white p-3 rounded-full shadow-[0_0_20px_rgba(0,210,255,0.5)] transition-all cursor-pointer"
                title={editingMessage ? "Save Edit" : "Send Message"}
              >
                {editingMessage ? <Check size={18} /> : <Send size={18} className="ml-0.5" />}
              </motion.button>
            ) : (
              <button 
                onClick={() => setIsRecordingVoice(true)}
                className="text-gray-400 hover:text-liquid-accent p-3 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                title="Record Voice Note"
              >
                <Mic size={22} />
              </button>
            )}
          </>
        )}
      </div>

      {/* Liquid AI Copilot Modal */}
      <LiquidAiModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onInsertToChat={(aiText) => setText(aiText)}
      />

      {/* Shared Media, Links & Docs Drawer */}
      <MediaGalleryDrawer
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        targetId={targetId}
        targetName={targetName}
      />

      {/* WhatsApp Poll Creation Modal */}
      <PollModal
        isOpen={isPollModalOpen}
        onClose={() => setIsPollModalOpen(false)}
        onCreatePoll={handleCreatePoll}
      />

      {/* Forward Modal */}
      <ForwardModal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        messageIds={selectedMessageIds}
        users={users}
      />

      {/* Group Info & Management Drawer */}
      <GroupInfoDrawer
        isOpen={isGroupDrawerOpen}
        onClose={() => setIsGroupDrawerOpen(false)}
        users={users}
      />

      {/* Fullscreen Rich Media Lightbox */}
      <AnimatePresence>
        {selectedLightboxMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedLightboxMedia(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6"
          >
            <div className="w-full flex justify-between items-center z-50 text-white">
              <span className="text-sm font-semibold truncate max-w-sm">
                {selectedLightboxMedia.name || 'Media Viewer'}
              </span>
              <div className="flex items-center gap-4">
                <a
                  href={selectedLightboxMedia.url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 text-xs"
                >
                  <Download size={16} /> Download
                </a>
                <button 
                  onClick={() => setSelectedLightboxMedia(null)}
                  className="p-2.5 rounded-full bg-white/10 text-white hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full flex items-center justify-center overflow-hidden my-4" onClick={(e) => e.stopPropagation()}>
              {selectedLightboxMedia.type === 'video' ? (
                <video 
                  src={selectedLightboxMedia.url} 
                  controls 
                  autoPlay 
                  playsInline 
                  className="max-w-[90vw] max-h-[80vh] rounded-2xl shadow-2xl" 
                />
              ) : (
                <motion.img 
                  initial={{ scale: 0.85 }}
                  animate={{ scale: 1 }}
                  src={selectedLightboxMedia.url} 
                  alt="Lightbox" 
                  className="max-w-[90vw] max-h-[80vh] object-contain rounded-2xl shadow-2xl" 
                />
              )}
            </div>

            <div />
          </motion.div>
        )}
      </AnimatePresence>

      {/* In-App Document & PDF Viewer Modal */}
      {selectedDocumentForModal && (
        <DocumentViewerModal
          isOpen={true}
          onClose={() => setSelectedDocumentForModal(null)}
          fileUrl={selectedDocumentForModal.url}
          fileName={selectedDocumentForModal.name}
          fileSize={selectedDocumentForModal.size}
          mimeType={selectedDocumentForModal.mimeType}
        />
      )}
    </div>
  );
}
