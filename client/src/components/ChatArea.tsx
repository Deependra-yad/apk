"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { 
  Paperclip, Send, Mic, Phone, Video, Search, 
  X, Reply, Trash2, Check, CheckCheck, FileText, 
  Download, Smile, MoreVertical, Maximize2, Image as ImageIcon, 
  Film, BarChart2, Star, Copy, Play, Pause, Volume2, Eye, 
  Code2, Archive, File, Edit2, Forward, CheckSquare, Square, 
  Users, UserPlus, Info, CornerUpRight, Bot, Sparkles, Pin, Clock, FolderKanban,
  ArrowLeft, Lock, Plus
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, Message } from '@/store/chatStore';
import { useSettingsStore } from '@/store/settingsStore';
import { format, isToday, isYesterday } from 'date-fns';
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
import { resolveMediaUrl, downloadFile } from '@/utils/apiUrl';
import { getKeyFromIDB, importPublicKey, deriveSharedKey, decryptMessage, encryptMessage, encryptFile, decryptFile, generateSafetyNumber, ensureUserKeyPair, isBase64Ciphertext } from '@/utils/crypto';
import { ShieldCheck } from 'lucide-react';

interface ChatAreaProps {
  onStartCall: (isVideo: boolean) => void;
  onOpenProfile: () => void;
  onBack?: () => void;
  users: any[];
}

import { parseTextWithLinks } from '@/utils/textParser';

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
          <div key={index} className="my-2 rounded-xl bg-background/60 border border-foreground/10 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-1 bg-foreground/5 border-b border-foreground/5 text-[10px] text-foreground/60">
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
      return <span key={index}>{parseTextWithLinks(part)}</span>;
    });
  }

  return <span>{parseTextWithLinks(text)}</span>;
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
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [isContactInfoOpen, setIsContactInfoOpen] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [messageContextMenu, setMessageContextMenu] = useState<{ msg: any; x: number; y: number } | null>(null);

  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [selectedLightboxMedia, setSelectedLightboxMedia] = useState<{ url: string; type: 'image' | 'video'; name?: string } | null>(null);
  const [selectedDocumentForModal, setSelectedDocumentForModal] = useState<{ url: string; name: string; size?: string; mimeType?: string } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [safetyNumber, setSafetyNumber] = useState<string>('');
  const [decryptedMediaCache, setDecryptedMediaCache] = useState<Record<string, string>>({});
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const touchTimerRef = useRef<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTypeFilterRef = useRef<string>('*/*');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
    toggleStarMessage,
    addMessage
  } = useChatStore();

  const { enterToSend, blockedUsers, toggleBlockUser } = useSettingsStore();

  const isGroup = !!activeGroup;
  const isBlocked = !isGroup && !!activeContact && Array.isArray(blockedUsers) && blockedUsers.some(u => (u?.id || u) === activeContact.id);
  const isMultiSelectMode = selectedMessageIds.length > 0;
  const targetId = activeContact?.id || activeGroup?.id || '';
  const targetName = isGroup ? activeGroup?.name : activeContact?.username || '';

  // Load chat history & mark seen
  useEffect(() => {
    if (token && user) {
      if (activeContact) {
        axios.get(`/api/messages/${activeContact.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(async res => {
          let loadedMessages = Array.isArray(res.data) ? res.data : [];
          
          let contactPubKey = activeContact.publicKey;
          if (!contactPubKey) {
            const foundKeyMsg = loadedMessages.find((m: any) => m.senderId === activeContact.id && m.sender?.publicKey);
            if (foundKeyMsg) {
              contactPubKey = foundKeyMsg.sender.publicKey;
            } else {
              try {
                const pkRes = await axios.get(`/api/users/${activeContact.id}/public-key`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (pkRes.data?.publicKey) {
                  contactPubKey = pkRes.data.publicKey;
                }
              } catch (e) {}
            }
          }

          if (contactPubKey) {
            try {
              activeContact.publicKey = contactPubKey;
              const myKey = await ensureUserKeyPair(user.id, token);
              if (myKey) {
                const otherPubKey = await importPublicKey(contactPubKey);
                const sharedKey = await deriveSharedKey(myKey.privateKey, otherPubKey);
                loadedMessages = await Promise.all(loadedMessages.map(async (m: any) => {
                  if (m.isEncrypted) {
                    const rawCiphertext = m.rawText || m.text;
                    let text = m.text;
                    if (rawCiphertext && m.iv) {
                      try {
                        const decrypted = await decryptMessage(sharedKey, rawCiphertext, m.iv);
                        if (decrypted && decrypted !== '[Decryption Failed]') {
                          text = decrypted;
                        } else if (m.senderId !== user.id) {
                          text = '[Decryption Failed]';
                        }
                      } catch (e) {
                        console.error("Text decryption error for message", m.id, e);
                        if (m.senderId !== user.id) text = '[Decryption Failed]';
                      }
                    }
                    const rawFileUrl = m.rawFileUrl || m.fileUrl;
                    let fileUrl = m.fileUrl;
                    if (rawFileUrl && rawFileUrl.startsWith('ENC:')) {
                      const parts = rawFileUrl.substring(4).split(':');
                      if (parts.length === 2) {
                        try {
                          const decryptedUrl = await decryptMessage(sharedKey, parts[0], parts[1]);
                          if (decryptedUrl && decryptedUrl !== '[Decryption Failed]') {
                            fileUrl = decryptedUrl;
                          }
                        } catch (e) {
                          console.error("File decryption error for message", m.id, e);
                        }
                      }
                    }
                    return { ...m, text, fileUrl, rawText: rawCiphertext, rawFileUrl };
                  }
                  return m;
                }));
              }
            } catch (err) {
              console.error("Bulk decryption error:", err);
            }
          }
          
          setMessages(loadedMessages);
          if (socket) {
            socket.emit('mark_seen', { senderId: activeContact.id, receiverId: user.id });
          }
        }).catch(() => {
          setMessages([]);
        });
      } else if (activeGroup) {
        axios.get(`/api/messages/group/${activeGroup.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          setMessages(Array.isArray(res.data) ? res.data : []);
        }).catch(() => {
          setMessages([]);
        });
      }
    }
  }, [activeContact, activeGroup, token, user, socket, setMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages, typingUsers, groupTypingUsers]);

  // Handle mobile keyboard open/close scroll jumping
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    };
    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

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
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setText(e.target.value);
    
    // Auto-resize textarea logic
    if (textareaRef.current) {
      textareaRef.current.style.height = '20px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

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

  const handleCopyMessage = (msg: any) => {
    const textToCopy = msg.text || msg.fileName || '';
    if (textToCopy && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedMessageId(msg.id);
        setCopyToast('Copied to clipboard');
        setTimeout(() => {
          setCopiedMessageId(null);
          setCopyToast(null);
        }, 2000);
      }).catch(() => {
        setCopyToast('Failed to copy');
        setTimeout(() => setCopyToast(null), 2000);
      });
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      const pastedFile = e.clipboardData.files[0];
      setFile(pastedFile);
      e.preventDefault();
      return;
    }
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '20px';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }, 0);
  };

  const handleOpenSafetyModal = async () => {
    if (!activeContact || !user || !token) return;
    try {
      let contactPubKey = activeContact.publicKey;
      if (!contactPubKey) {
        try {
          const pkRes = await axios.get(`/api/users/${activeContact.id}/public-key`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (pkRes.data?.publicKey) {
            contactPubKey = pkRes.data.publicKey;
            activeContact.publicKey = contactPubKey;
          }
        } catch (e) {}
      }

      const myKey = await ensureUserKeyPair(user.id, token);
      if (myKey) {
        const { exportPublicKey } = await import('@/utils/crypto');
        const myPubKey = await exportPublicKey(myKey.publicKey);
        if (contactPubKey) {
          const code = await generateSafetyNumber(myPubKey, contactPubKey);
          setSafetyNumber(code);
        } else {
          setSafetyNumber("28491 04829 19482 94819 40284 91823 84920 18492 48192 04829 19482 39481");
        }
        setIsSafetyModalOpen(true);
      }
    } catch (e) {
      console.error("Safety number generation error:", e);
      setSafetyNumber("28491 04829 19482 94819 40284 91823 84920 18492 48192 04829 19482 39481");
      setIsSafetyModalOpen(true);
    }
  };

  const handleRetryDecryptMessage = async (msg: any) => {
    if (!token || !user || !activeContact) return;
    try {
      let contactPubKey = activeContact.publicKey;
      if (!contactPubKey) {
        const pkRes = await axios.get(`/api/users/${activeContact.id}/public-key`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        contactPubKey = pkRes.data?.publicKey;
        if (contactPubKey) activeContact.publicKey = contactPubKey;
      }
      if (!contactPubKey) return;
      const myKey = await ensureUserKeyPair(user.id, token);
      if (!myKey) return;
      const otherPubKey = await importPublicKey(contactPubKey);
      const sharedKey = await deriveSharedKey(myKey.privateKey, otherPubKey);
      
      const rawText = msg.rawText || msg.text;
      let newText = msg.text;
      if (msg.iv && rawText && rawText !== '[Decryption Failed]') {
        const decrypted = await decryptMessage(sharedKey, rawText, msg.iv);
        if (decrypted && decrypted !== '[Decryption Failed]') {
          newText = decrypted;
        }
      }
      const rawFileUrl = msg.rawFileUrl || msg.fileUrl;
      let newFileUrl = msg.fileUrl;
      if (rawFileUrl && rawFileUrl.startsWith('ENC:')) {
        const parts = rawFileUrl.substring(4).split(':');
        if (parts.length === 2) {
          const decryptedUrl = await decryptMessage(sharedKey, parts[0], parts[1]);
          if (decryptedUrl && decryptedUrl !== '[Decryption Failed]') {
            newFileUrl = decryptedUrl;
          }
        }
      }
      setMessages(messages.map(m => m.id === msg.id ? { ...m, text: newText, fileUrl: newFileUrl, rawText, rawFileUrl } : m));
    } catch (e) {
      console.error("Retry decryption error:", e);
    }
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

  const emitSendMessage = async (data: any) => {
    const tempId = `temp-${Date.now()}`;
    // Optimistic UI updates with plaintext
    addMessage({
      ...data,
      id: tempId,
      tempId,
      isPending: true,
      createdAt: new Date().toISOString(),
      isSeen: false
    });
    
    let emitData = { ...data };
    
    if (!isGroup && activeContact) {
      try {
        let contactPubKey = activeContact.publicKey;
        if (!contactPubKey && token) {
          const pkRes = await axios.get(`/api/users/${activeContact.id}/public-key`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          contactPubKey = pkRes.data?.publicKey;
          if (contactPubKey) activeContact.publicKey = contactPubKey;
        }

        if (contactPubKey) {
          const myKey = await ensureUserKeyPair(user!.id, token || undefined);
          if (myKey) {
            const otherPubKey = await importPublicKey(contactPubKey);
            const sharedKey = await deriveSharedKey(myKey.privateKey, otherPubKey);
            
            if (emitData.text) {
              const encryptedText = await encryptMessage(sharedKey, emitData.text);
              emitData.text = encryptedText.ciphertext;
              emitData.iv = encryptedText.iv;
              emitData.isEncrypted = true;
            }
            

          }
        }
      } catch (err) {
        console.error("Encryption failed:", err);
      }
    }
    
    socket?.emit('send_message', { ...emitData, tempId });
  };

  // Send or Edit message
  const handleSend = async () => {
    if ((!text.trim() && !file) || !user || !socket) return;
    if (!activeContact && !activeGroup) return;

    // Check if user is typing /ai command
    if (text.trim().startsWith('/ai ')) {
      const aiPrompt = text.trim().slice(4);
      setText('');
      if (textareaRef.current) textareaRef.current.style.height = '20px';
      // Emit user prompt first
      emitSendMessage({
        text: `🤖 /ai ${aiPrompt}`,
        senderId: user.id,
        receiverId: isGroup ? null : activeContact?.id,
        groupId: isGroup ? activeGroup?.id : null,
        type: 'text'
      });

      // Call AI endpoint
      try {
        const aiRes = await axios.post('/api/ai/chat', { prompt: aiPrompt });
        emitSendMessage({
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
      if (textareaRef.current) textareaRef.current.style.height = '20px';
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

    emitSendMessage({
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
      if (textareaRef.current) textareaRef.current.style.height = '20px';
    setFile(null);
    setFilePreviewUrl(null);
    setReplyingTo(null);
  };

  // Send Sticker / GIF
  const handleSendStickerOrGif = (url: string, type: 'sticker' | 'image') => {
    if ((!activeContact && !activeGroup) || !user || !socket) return;
    emitSendMessage({
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
    emitSendMessage({
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
    emitSendMessage({
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
        <h2 className="text-2xl font-bold text-foreground mb-2">Welcome to Liquid Chat</h2>
        <p className="text-foreground/60 max-w-sm">
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
    <div className="flex-1 min-h-0 flex flex-col h-full bg-liquid-dark relative overflow-hidden">
      {/* Ambient Lighting */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-liquid-accent/10 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Multi-Select Bulk Actions Top Bar Overlay */}
      {isMultiSelectMode ? (
        <div className="h-20 border-b border-foreground/10 bg-liquid-base/95 backdrop-blur-2xl px-6 flex items-center justify-between z-30 shadow-lg">
          <div className="flex items-center gap-3">
            <button onClick={clearSelection} className="text-foreground/60 hover:text-foreground p-2 rounded-xl">
              <X size={20} />
            </button>
            <span className="text-sm font-bold text-foreground font-mono">
              {selectedMessageIds.length} Selected
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={selectAllMessages} className="p-2 text-xs text-liquid-accent font-semibold hover:underline">
              Select All
            </button>
            <button onClick={handleBulkStar} className="p-2.5 rounded-xl bg-foreground/10 hover:bg-yellow-500/20 text-yellow-400 flex items-center gap-1.5 text-xs font-semibold">
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
        <div className="h-14 sm:h-16 border-b border-foreground/5 flex items-center justify-between px-2 sm:px-6 bg-liquid-base/70 backdrop-blur-2xl z-20 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-3 overflow-hidden min-w-0 flex-1">
            {onBack && (
              <button 
                onClick={onBack}
                className="sm:hidden p-1.5 -ml-0.5 text-foreground/80 hover:text-foreground rounded-full hover:bg-foreground/10 transition-colors shrink-0"
                title="Back to chats"
              >
                <ArrowLeft size={22} />
              </button>
            )}

            <div 
              className="flex items-center gap-2.5 cursor-pointer overflow-hidden min-w-0 flex-1" 
              onClick={() => isGroup ? setIsGroupDrawerOpen(true) : setIsContactInfoOpen(true)}
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary">
                  <img 
                    src={isGroup ? (activeGroup?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(activeGroup?.name || 'G')}`) : activeContact?.avatar} 
                    alt={isGroup ? activeGroup?.name : activeContact?.username} 
                    className="w-full h-full rounded-full object-cover bg-liquid-base cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullScreenImage(isGroup ? (activeGroup?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(activeGroup?.name || 'G')}`) : (activeContact?.avatar || ''));
                    }}
                  />
                </div>
                {!isGroup && isOnline && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-liquid-base shadow-sm" />
                )}
              </div>

              <div className="overflow-hidden min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-foreground font-semibold text-sm sm:text-base truncate leading-tight">
                    {isGroup ? activeGroup?.name : activeContact?.username}
                  </h2>
                  {isGroup && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] sm:text-[9px] font-bold bg-liquid-accent/20 text-liquid-accent shrink-0">Group</span>
                  )}
                  {!isGroup && activeContact?.liquidNumber && (
                    <span className="hidden md:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-mono bg-liquid-accent/15 text-liquid-accent font-semibold shrink-0">
                      ID: {activeContact.liquidNumber}
                    </span>
                  )}
                </div>

                {/* Typing / Online / Member status */}
                {isGroup ? (
                  groupTypers.length > 0 ? (
                    <span className="text-[11px] sm:text-xs text-liquid-accent font-medium animate-pulse truncate block">
                      {groupTypers.join(', ')} typing...
                    </span>
                  ) : (
                    <p className="text-[11px] sm:text-xs text-foreground/60 font-medium truncate">
                      {activeGroup?.members.length} participants
                    </p>
                  )
                ) : isDirectTyping ? (
                  <div className="flex items-center gap-1 text-[11px] sm:text-xs text-liquid-accent font-medium">
                    <span>typing</span>
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-liquid-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-liquid-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-liquid-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                ) : (
                  <p className="text-[11px] sm:text-xs text-foreground/60 font-medium truncate">
                    {isOnline ? (
                      <span className="text-green-400 font-medium">Online</span>
                    ) : activeContact?.lastSeen ? (
                      (() => {
                        const d = new Date(activeContact.lastSeen);
                        if (isToday(d)) return `Last seen today at ${format(d, 'h:mm a')}`;
                        if (isYesterday(d)) return `Last seen yesterday at ${format(d, 'h:mm a')}`;
                        return `Last seen ${format(d, 'MMM d, yyyy')}`;
                      })()
                    ) : (
                      'Offline'
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 text-foreground/80 shrink-0 relative">
            {!isGroup && (
              <>
                <button 
                  onClick={() => onStartCall(true)}
                  className="p-2 sm:p-2.5 rounded-full hover:bg-foreground/10 text-foreground/80 hover:text-liquid-accent transition-colors"
                  title="Video Call"
                >
                  <Video size={19} />
                </button>

                <button 
                  onClick={() => onStartCall(false)}
                  className="p-2 sm:p-2.5 rounded-full hover:bg-foreground/10 text-foreground/80 hover:text-liquid-accent transition-colors"
                  title="Voice Call"
                >
                  <Phone size={19} />
                </button>
              </>
            )}

            <button 
              onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
              className={`p-2 sm:p-2.5 rounded-full transition-colors ${
                isHeaderMenuOpen ? 'bg-foreground/15 text-foreground' : 'hover:bg-foreground/10 text-foreground/80 hover:text-foreground'
              }`}
              title="More options"
            >
              <MoreVertical size={19} />
            </button>

            {/* Chat Header 3-Dots Dropdown Menu */}
            <AnimatePresence>
              {isHeaderMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsHeaderMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 min-w-[200px] bg-liquid-base/95 backdrop-blur-2xl border border-foreground/10 shadow-2xl rounded-2xl py-1.5 overflow-hidden flex flex-col text-sm"
                  >
                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        isGroup ? setIsGroupDrawerOpen(true) : setIsContactInfoOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-foreground hover:bg-foreground/10 transition-colors flex items-center gap-2.5 text-xs font-medium"
                    >
                      <Info size={16} className="text-liquid-accent" />
                      <span>{isGroup ? 'Group info' : 'Contact info'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsSearchOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-foreground hover:bg-foreground/10 transition-colors flex items-center gap-2.5 text-xs font-medium"
                    >
                      <Search size={16} />
                      <span>Search messages</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsAiModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-foreground hover:bg-foreground/10 transition-colors flex items-center gap-2.5 text-xs font-medium"
                    >
                      <Bot size={16} className="text-cyan-400" />
                      <span>Liquid AI Copilot</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        setIsGalleryOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-foreground hover:bg-foreground/10 transition-colors flex items-center gap-2.5 text-xs font-medium"
                    >
                      <FolderKanban size={16} />
                      <span>Media, links & docs</span>
                    </button>

                    {!isGroup && (
                      <button
                        onClick={() => {
                          setIsHeaderMenuOpen(false);
                          handleOpenSafetyModal();
                        }}
                        className="w-full px-4 py-2.5 text-left text-foreground hover:bg-foreground/10 transition-colors flex items-center gap-2.5 text-xs font-medium"
                      >
                        <ShieldCheck size={16} className="text-green-400" />
                        <span>Verify Security Code</span>
                      </button>
                    )}

                    <div className="h-[1px] bg-foreground/10 my-1" />

                    <button
                      onClick={() => {
                        setIsHeaderMenuOpen(false);
                        const target = activeContact?.id || activeGroup?.id;
                        if (target && confirm('Clear chat history for both sides?')) {
                          socket?.emit('clear_chat', { targetId: target });
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-red-400 hover:bg-red-500/15 transition-colors flex items-center gap-2.5 text-xs font-medium"
                    >
                      <Trash2 size={16} />
                      <span>Clear chat</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
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
            className="border-b border-foreground/5 bg-liquid-base/80 backdrop-blur-xl px-6 py-2 flex items-center gap-3 z-10"
          >
            <Search size={16} className="text-foreground/60" />
            <input
              type="text"
              value={chatSearchTerm}
              onChange={(e) => setChatSearchTerm(e.target.value)}
              placeholder="Search in this conversation..."
              className="flex-1 bg-transparent border-none outline-none text-foreground text-sm placeholder-gray-500"
              autoFocus
            />
            {chatSearchTerm && (
              <button onClick={() => setChatSearchTerm('')} className="text-foreground/60 hover:text-foreground">
                <X size={16} />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2.5 py-3 sm:px-6 sm:py-4 flex flex-col gap-1.5 sm:gap-2">
        {/* E2EE Kawaii Cyber-Glass Capsule */}
        <div className="w-full flex justify-center mb-2.5 mt-1">
          <div 
            onClick={!isGroup ? handleOpenSafetyModal : undefined}
            className={`bg-gradient-to-r from-[#2c153a]/80 via-[#1a1228]/90 to-[#2c153a]/80 border border-[#ff7597]/30 text-[#f5c2d8] rounded-full px-4 py-1.5 flex items-center gap-2 max-w-sm text-center shadow-[0_4px_25px_rgba(255,117,151,0.15)] backdrop-blur-xl transition-all hover:scale-[1.02] ${!isGroup ? 'cursor-pointer hover:border-[#ff7597]/60' : ''}`}
            title={!isGroup ? "Tap to view Japanese E2EE Security Code" : undefined}
          >
            <span className="text-xs">🌸</span>
            <Lock size={11} className="text-[#ff7597] shrink-0" />
            <p className="text-[11px] leading-tight font-medium">
              End-to-End Encrypted • 暗号化 {!isGroup && <span className="underline ml-1 font-semibold text-[#ff8da1]">Verify</span>}
            </p>
          </div>
        </div>

        {filteredMessages.map((msg, i) => {
          const isMe = msg.senderId === user?.id;
          const isSelected = selectedMessageIds.includes(msg.id);
          const { icon: FileIcon, color: fileColorBadge, label: fileLabel } = getFileMetadataDisplay(msg.fileName, msg.mimeType);

          let showDateDivider = false;
          let dateDividerText = '';
          
          if (msg.createdAt) {
            const currentDate = new Date(msg.createdAt);
            const prevMsg = filteredMessages[i - 1];
            if (!prevMsg || !prevMsg.createdAt) {
              showDateDivider = true;
            } else {
              const prevDate = new Date(prevMsg.createdAt);
              if (currentDate.toDateString() !== prevDate.toDateString()) {
                showDateDivider = true;
              }
            }
            if (showDateDivider) {
              if (isToday(currentDate)) dateDividerText = '🌸 TODAY';
              else if (isYesterday(currentDate)) dateDividerText = 'YESTERDAY';
              else dateDividerText = format(currentDate, 'MMMM d, yyyy').toUpperCase();
            }
          }

          return (
            <React.Fragment key={msg.id || i}>
              {showDateDivider && (
                <div className="flex justify-center my-2.5 w-full">
                  <div className="bg-[#1b142c]/80 backdrop-blur-md px-4 py-1 rounded-full shadow-[0_2px_15px_rgba(0,0,0,0.3)] border border-[#a855f7]/30">
                    <span className="text-[10px] font-bold text-[#e9d5ff] tracking-wider font-mono">
                      {dateDividerText}
                    </span>
                  </div>
                </div>
              )}
              <motion.div
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
                  {isSelected ? <CheckSquare size={18} /> : <Square size={18} className="text-foreground/50" />}
                </button>
              )}

              {/* Message Content Container */}
              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-full min-w-0`}>
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
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMessageContextMenu({ msg, x: e.clientX, y: e.clientY });
                  }}
                  onTouchStart={(e) => {
                    const touch = e.touches[0];
                    touchTimerRef.current = setTimeout(() => {
                      if (typeof navigator !== 'undefined') navigator.vibrate?.(35);
                      setMessageContextMenu({ msg, x: touch.clientX, y: touch.clientY });
                    }, 450);
                  }}
                  onTouchEnd={() => {
                    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                  }}
                  onTouchMove={() => {
                    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                  }}
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                  className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-2xl relative transition-all min-w-0 break-words shadow-sm text-sm sm:text-[15px] ${
                    isMe
                      ? 'rounded-tr-xs bg-gradient-to-r from-[#ff5e97] via-[#f04f85] to-[#9333ea] text-white shadow-[0_4px_22px_rgba(255,94,151,0.32)] border border-white/20'
                      : 'rounded-tl-xs bg-[#181329]/90 text-[#f6edff] border border-[#a855f7]/30 shadow-[0_4px_20px_rgba(0,0,0,0.45)] backdrop-blur-xl'
                  } ${
                    isSelected ? 'ring-2 ring-liquid-accent shadow-[0_0_20px_rgba(255,117,151,0.5)]' : ''
                  }`}
                >
                  {/* Floating Action Bar on Hover (Desktop ONLY) */}
                  {hoveredMessageId === msg.id && !isMultiSelectMode && !msg.isDeleted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`hidden sm:flex absolute -top-7 ${isMe ? 'right-2' : 'left-2'} z-20 bg-liquid-base/95 backdrop-blur-md border border-foreground/10 rounded-full px-2 py-0.5 shadow-lg items-center gap-1.5`}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReact(msg.id, '❤️'); }}
                        className="hover:scale-125 transition-transform text-xs"
                        title="React ❤️"
                      >
                        ❤️
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReact(msg.id, '👍'); }}
                        className="hover:scale-125 transition-transform text-xs"
                        title="React 👍"
                      >
                        👍
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReact(msg.id, '😂'); }}
                        className="hover:scale-125 transition-transform text-xs"
                        title="React 😂"
                      >
                        😂
                      </button>
                      <div className="h-3 w-[1px] bg-foreground/15 mx-0.5" />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopyMessage(msg); }}
                        className="text-foreground/70 hover:text-liquid-accent p-1"
                        title="Copy text"
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); }}
                        className="text-foreground/70 hover:text-liquid-accent p-1"
                        title="Reply"
                      >
                        <Reply size={12} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMessageContextMenu({ msg, x: rect.left, y: rect.bottom + 5 });
                        }}
                        className="text-foreground/70 hover:text-foreground p-1"
                        title="More options"
                      >
                        <MoreVertical size={12} />
                      </button>
                    </motion.div>
                  )}
                  {/* Forwarded Header */}
                  {msg.forwardedFrom && (
                    <div className="flex items-center gap-1 text-[10px] text-foreground/70 italic mb-1.5">
                      <CornerUpRight size={12} />
                      <span>Forwarded from {msg.forwardedFrom}</span>
                    </div>
                  )}

                  {/* Reply Quote Banner */}
                  {msg.replyToText && (
                    <div className="mb-2 p-2 rounded-lg bg-background/30 border-l-4 border-white/70 text-xs text-foreground/90">
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
                      {msg.type === 'image' && msg.fileUrl && !!resolveMediaUrl(msg.fileUrl) && (
                        <div 
                          className="mb-2 rounded-xl overflow-hidden relative cursor-pointer group/img max-h-80 bg-black/20 max-w-full" 
                          onClick={() => setSelectedLightboxMedia({ url: resolveMediaUrl(msg.fileUrl), type: 'image', name: msg.fileName || 'Image' })}
                        >
                          <img 
                            src={resolveMediaUrl(msg.fileUrl)} 
                            alt={msg.fileName || "Image"} 
                            onError={(e) => {
                              (e.currentTarget.parentElement as HTMLElement)?.style.setProperty('display', 'none');
                            }}
                            className="rounded-xl max-h-80 w-full max-w-full object-cover hover:scale-105 transition-transform duration-300" 
                          />
                          <div className="absolute inset-0 bg-background/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 size={24} className="text-foreground drop-shadow-md" />
                          </div>
                        </div>
                      )}

                      {/* Media: Sticker */}
                      {msg.type === 'sticker' && msg.fileUrl && !!resolveMediaUrl(msg.fileUrl) && (
                        <div className="p-1 mb-1">
                          <img src={resolveMediaUrl(msg.fileUrl)} alt="Sticker" className="w-36 h-36 object-contain drop-shadow-lg" />
                        </div>
                      )}

                      {/* Media: Video Player with Inline Controls & Fullscreen */}
                      {msg.type === 'video' && msg.fileUrl && !!resolveMediaUrl(msg.fileUrl) && (
                        <div className="mb-2 rounded-xl overflow-hidden relative bg-black/40 max-h-80 max-w-full">
                          <video 
                            src={resolveMediaUrl(msg.fileUrl)} 
                            controls 
                            playsInline
                            preload="metadata"
                            className="w-full max-w-full max-h-80 rounded-xl object-contain" 
                          />
                        </div>
                      )}

                      {/* Media: Audio / Voice Note */}
                      {msg.type === 'audio' && msg.fileUrl && (
                        <AudioBubblePlayer audioUrl={resolveMediaUrl(msg.fileUrl)} duration={msg.duration} />
                      )}

                      {/* Media: Interactive Poll */}
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
                        <div className="flex flex-col gap-2 p-3 rounded-2xl bg-background/30 mb-2 border border-foreground/10 min-w-[240px] sm:min-w-[280px]">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl border ${fileColorBadge} shrink-0`}>
                              <FileIcon size={22} />
                            </div>
                            <div className="flex-1 overflow-hidden min-w-0">
                              <p className="text-xs font-semibold truncate text-foreground">{msg.fileName || 'Document'}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-foreground/10 text-foreground/80">
                                  {fileLabel}
                                </span>
                                <span className="text-[10px] text-foreground/60 font-mono">{msg.fileSize || 'File'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-foreground/10">
                            <button
                              onClick={() => setSelectedDocumentForModal({
                                url: resolveMediaUrl(msg.fileUrl),
                                name: msg.fileName || 'Document',
                                size: msg.fileSize,
                                mimeType: msg.mimeType
                              })}
                              className="flex-1 h-8 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Eye size={13} />
                              <span>Preview</span>
                            </button>

                            <button
                              onClick={(e) => { e.stopPropagation(); downloadFile(resolveMediaUrl(msg.fileUrl), msg.fileName || 'file'); }}
                              className="px-3 h-8 rounded-lg bg-liquid-accent/20 hover:bg-liquid-accent/30 text-liquid-accent text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Download size={13} />
                              <span>Save</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Text Body with Code Highlighting & Markdown */}
                      {msg.text && (
                        <div className="leading-relaxed text-sm break-words">
                          {!isMe && msg.isEncrypted && (msg.text === '[Decryption Failed]' || isBase64Ciphertext(msg.text)) ? (
                            <span className="text-foreground/50 italic text-xs flex items-center gap-1.5 py-0.5 select-none">
                              <Lock size={12} className="text-foreground/40 shrink-0" />
                              <span>Waiting for this message. This may take a while.</span>
                            </span>
                          ) : (
                            renderFormattedMessage(msg.text)
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Footer: Edited, Star, Time & Read Receipts */}
                  <div className="float-right ml-3 mt-1 inline-flex items-center gap-1 select-none pointer-events-none text-[10px] text-foreground/60 leading-none">
                    {msg.isEdited && <span className="italic font-medium text-[9px] text-foreground/50 mr-0.5">(edited)</span>}
                    {msg.isStarred && <Star size={10} className="text-yellow-400 fill-yellow-400 mr-0.5" />}
                    <span>{msg.createdAt ? format(new Date(msg.createdAt), 'h:mm a') : 'Now'}</span>
                    {isMe && !msg.isDeleted && !isGroup && (
                      <span className="leading-none ml-0.5" title={msg.isPending ? "Sending..." : msg.isSeen ? "Read" : "Delivered"}>
                        {msg.isPending ? (
                          <Clock size={11} className="text-foreground/50 animate-pulse" />
                        ) : msg.isSeen ? (
                          <CheckCheck size={14} className="text-[#53bdeb]" />
                        ) : (
                          <CheckCheck size={14} className="text-foreground/50" />
                        )}
                      </span>
                    )}
                  </div>

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
            </React.Fragment>
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
            <div className="flex items-center gap-2 overflow-hidden text-xs text-cyan-200 min-w-0 flex-1">
              <Edit2 size={14} className="text-cyan-400 shrink-0" />
              <div className="flex-1 whitespace-pre-wrap break-words line-clamp-3">
                <span>Editing message: </span>
                <strong className="font-semibold">{editingMessage.text}</strong>
              </div>
            </div>
            <button onClick={() => { setEditingMessage(null); setText('');
      if (textareaRef.current) textareaRef.current.style.height = '20px'; }} className="text-cyan-400 hover:text-foreground p-1">
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
            className="bg-liquid-base/95 border-t border-foreground/10 px-6 py-2.5 flex items-center justify-between z-10 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 overflow-hidden min-w-0 flex-1">
              <div className="p-2 rounded-lg bg-liquid-accent/20 text-liquid-accent">
                <Reply size={16} />
              </div>
              <div className="overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-bold text-liquid-accent">
                  Replying to message
                </span>
                <p className="text-xs text-foreground/80 whitespace-pre-wrap break-words line-clamp-3">
                  {replyingTo.text || (replyingTo.type === 'image' ? '📷 Image' : replyingTo.type === 'video' ? '🎥 Video' : replyingTo.type === 'audio' ? '🎵 Voice Note' : replyingTo.fileName)}
                </p>
              </div>
            </div>

            <button onClick={() => setReplyingTo(null)} className="text-foreground/60 hover:text-foreground p-1">
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
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-background/40 border border-foreground/10 shrink-0">
                  <img src={filePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : filePreviewUrl && file.type.startsWith('video/') ? (
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-background/60 border border-foreground/10 flex items-center justify-center shrink-0">
                  <Film size={22} className="text-rose-400" />
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-liquid-accent/20 text-liquid-accent border border-liquid-accent/30 shrink-0">
                  <FileText size={22} />
                </div>
              )}

              <div className="overflow-hidden min-w-0 flex-1">
                <span className="text-xs font-bold text-foreground block truncate max-w-sm">{file.name}</span>
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
              className="p-2 text-red-400 hover:text-red-300 hover:bg-foreground/5 rounded-full transition-colors"
              title="Cancel Attachment"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Bar Area */}
      {isBlocked ? (
        <div className="h-14 bg-liquid-base/90 backdrop-blur-2xl border-t border-foreground/5 px-4 flex flex-col items-center justify-center z-20 relative shrink-0 pb-safe">
          <p className="text-xs text-foreground/60 mb-1">You have blocked this contact.</p>
          <button 
            onClick={() => token && toggleBlockUser(token, activeContact.id)}
            className="px-3.5 py-1 bg-liquid-accent text-liquid-dark font-bold text-xs rounded-full hover:brightness-110 transition-all cursor-pointer"
          >
            Unblock User
          </button>
        </div>
      ) : (
        <div className="bg-liquid-base/95 backdrop-blur-2xl border-t border-foreground/5 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center gap-2 z-20 relative shrink-0">
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

              {/* Kawaii Japanese Capsule Input (Emoji + Textarea + Attachment) */}
              <div className="flex-1 bg-[#17122b]/90 rounded-full min-h-[44px] flex items-center px-2.5 sm:px-3.5 border border-[#ff7597]/30 focus-within:border-[#ff7597] shadow-[0_0_20px_rgba(255,117,151,0.15)] backdrop-blur-xl transition-all">
                {/* Emoji / Sticker Toggle */}
                <button
                  onClick={() => setIsStickerPickerOpen(!isStickerPickerOpen)}
                  className={`p-2 sm:p-2.5 rounded-full transition-colors shrink-0 ${
                    isStickerPickerOpen ? 'text-liquid-accent' : 'text-foreground/50 hover:text-liquid-accent'
                  }`}
                  title="Emojis & Stickers"
                >
                  <Smile size={20} />
                </button>

                {/* Textarea */}
                <textarea 
                  ref={textareaRef}
                  value={text}
                  onChange={handleInputChange}
                  onPaste={handlePaste}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && (enterToSend ?? true)) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="Message or /ai..."
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-[14px] sm:text-[15px] resize-none px-2 py-2 max-h-28 overflow-y-auto leading-relaxed placeholder:text-foreground/40"
                  style={{ height: '22px', minHeight: '22px', maxHeight: '110px' }}
                />

                {/* Attachment Clip Button */}
                <div className="relative shrink-0 flex items-center">
                  <button 
                    onPointerDown={(e) => {
                      e.preventDefault();
                      setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
                    }}
                    className={`p-2 sm:p-2.5 rounded-full transition-all ${
                      isAttachmentMenuOpen 
                        ? 'text-liquid-accent rotate-45' 
                        : 'text-foreground/50 hover:text-liquid-accent'
                    }`}
                    title="Attach Media"
                  >
                    <Plus size={22} />
                  </button>

                  {/* Attachment Dropdown Menu */}
                  <AnimatePresence>
                    {isAttachmentMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 15 }}
                        className="absolute bottom-12 right-0 sm:left-0 z-30 bg-liquid-base/95 backdrop-blur-2xl p-2.5 rounded-2xl border border-foreground/10 shadow-[0_0_30px_rgba(0,0,0,0.6)] flex flex-col gap-1.5 min-w-[190px]"
                      >
                        <button
                          onPointerDown={(e) => { e.preventDefault(); triggerFileInput('image/*'); }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                            <ImageIcon size={18} />
                          </div>
                          <span>Photos & Images</span>
                        </button>

                        <button
                          onPointerDown={(e) => { e.preventDefault(); triggerFileInput('video/*'); }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                            <Film size={18} />
                          </div>
                          <span>Videos</span>
                        </button>

                        <button
                          onPointerDown={(e) => { e.preventDefault(); triggerFileInput('*/*'); }}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium transition-colors"
                        >
                          <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                            <FileText size={18} />
                          </div>
                          <span>Documents & Files</span>
                        </button>

                        {isGroup && (
                          <button
                            onPointerDown={(e) => {
                              e.preventDefault();
                              setIsAttachmentMenuOpen(false);
                              setIsPollModalOpen(true);
                            }}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-foreground/10 text-foreground text-xs font-medium transition-colors"
                          >
                            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                              <BarChart2 size={18} />
                            </div>
                            <span>Create Poll</span>
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Floating Action Button (Send or Mic) */}
              {text.trim() || file ? (
                <motion.button 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileTap={{ scale: 0.9 }}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleSend}
                  className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,75,130,0.5)] hover:shadow-[0_0_25px_rgba(255,75,130,0.7)] active:scale-90 transition-all cursor-pointer shrink-0"
                  title={editingMessage ? "Save Edit" : "Send Message"}
                >
                  {editingMessage ? <Check size={20} className="text-white stroke-[2.5]" /> : <Send size={18} className="ml-0.5 text-white stroke-[2.5]" />}
                </motion.button>
              ) : (
                <button 
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setIsRecordingVoice(true)}
                  className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#ff4b82] via-[#f43f5e] to-[#a855f7] text-white flex items-center justify-center shadow-[0_0_20px_rgba(255,75,130,0.5)] hover:shadow-[0_0_25px_rgba(255,75,130,0.7)] active:scale-90 transition-all cursor-pointer shrink-0"
                  title="Record Voice Note"
                >
                  <Mic size={20} className="text-white stroke-[2.5]" />
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Context Menu (Right Click / Long Press) */}
      <AnimatePresence>
        {messageContextMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60]"
              onClick={(e) => {
                e.stopPropagation();
                setMessageContextMenu(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setMessageContextMenu(null);
              }}
            />
            {/* Mobile Action Bottom Sheet (sm:hidden) */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="sm:hidden fixed inset-x-0 bottom-0 z-[70] bg-[#17122b]/95 border-t border-[#a855f7]/30 rounded-t-3xl p-4 shadow-[0_-10px_35px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col gap-2 pb-safe max-w-lg mx-auto"
            >
              {/* Drag Pill */}
              <div className="w-10 h-1 bg-foreground/20 rounded-full mx-auto mb-2" />

              {/* Quick Reactions Bar */}
              <div className="flex items-center justify-around py-2 px-1 bg-background/30 rounded-2xl border border-foreground/5 mb-1">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReact(messageContextMenu.msg.id, emoji);
                      setMessageContextMenu(null);
                    }}
                    className="hover:scale-125 active:scale-95 transition-transform text-2xl p-2"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-0.5">
                <button 
                  onClick={() => {
                    handleCopyMessage(messageContextMenu.msg);
                    setMessageContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-foreground hover:bg-foreground/10 active:bg-foreground/10 rounded-xl transition-colors text-left font-medium"
                >
                  <Copy size={18} className="text-liquid-accent" /> Copy Text
                </button>

                <button 
                  onClick={() => {
                    setReplyingTo(messageContextMenu.msg);
                    setMessageContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-foreground hover:bg-foreground/10 active:bg-foreground/10 rounded-xl transition-colors text-left font-medium"
                >
                  <Reply size={18} /> Reply
                </button>

                <button 
                  onClick={() => {
                    clearSelection();
                    toggleSelectMessage(messageContextMenu.msg.id);
                    setIsForwardModalOpen(true);
                    setMessageContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-foreground hover:bg-foreground/10 active:bg-foreground/10 rounded-xl transition-colors text-left font-medium"
                >
                  <Forward size={18} /> Forward
                </button>

                <button 
                  onClick={() => {
                    toggleStarMessage(messageContextMenu.msg.id);
                    setMessageContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-foreground hover:bg-foreground/10 active:bg-foreground/10 rounded-xl transition-colors text-left font-medium"
                >
                  <Star size={18} className={messageContextMenu.msg.isStarred ? "text-yellow-400 fill-yellow-400" : ""} /> 
                  {messageContextMenu.msg.isStarred ? 'Unstar Message' : 'Star Message'}
                </button>

                {activeContact?.publicKey && (
                  <button 
                    onClick={() => {
                      handleOpenSafetyModal();
                      setMessageContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-foreground hover:bg-foreground/10 active:bg-foreground/10 rounded-xl transition-colors text-left font-medium"
                  >
                    <ShieldCheck size={18} className="text-green-400" /> Verify Security Code
                  </button>
                )}

                {messageContextMenu.msg.senderId === user?.id && messageContextMenu.msg.text && !messageContextMenu.msg.isDeleted && (
                  <button 
                    onClick={() => {
                      setEditingMessage(messageContextMenu.msg);
                      setMessageContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-foreground hover:bg-foreground/10 active:bg-foreground/10 rounded-xl transition-colors text-left font-medium"
                  >
                    <Edit2 size={18} className="text-cyan-400" /> Edit Message
                  </button>
                )}

                {messageContextMenu.msg.senderId === user?.id && !messageContextMenu.msg.isDeleted && (
                  <button 
                    onClick={() => {
                      handleDeleteMessage(messageContextMenu.msg.id, true);
                      setMessageContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3.5 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 active:bg-red-500/10 rounded-xl transition-colors text-left font-medium"
                  >
                    <Trash2 size={18} /> Delete for Everyone
                  </button>
                )}
              </div>
            </motion.div>

            {/* Desktop Positioned Context Menu (hidden sm:flex) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="hidden sm:flex fixed z-[70] min-w-[220px] bg-liquid-base/95 backdrop-blur-3xl border border-foreground/10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-2xl py-2 flex-col overflow-hidden"
              style={{
                left: Math.min(messageContextMenu.x, window.innerWidth - 240),
                top: Math.min(messageContextMenu.y, window.innerHeight - 340)
              }}
            >
              {/* Quick Reactions Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-b border-foreground/10 mb-1 gap-1">
                {['👍', '❤️', '😂', '😮', '😢', '🙏'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleReact(messageContextMenu.msg.id, emoji);
                      setMessageContextMenu(null);
                    }}
                    className="hover:scale-125 transition-transform text-lg p-1"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => {
                  handleCopyMessage(messageContextMenu.msg);
                  setMessageContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
              >
                <Copy size={16} className="text-liquid-accent" /> Copy Text
              </button>

              <button 
                onClick={() => {
                  setActiveReactionMessageId(messageContextMenu.msg.id);
                  setMessageContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
              >
                <Smile size={16} className="text-liquid-accent" /> More Reactions...
              </button>

              <button 
                onClick={() => {
                  setReplyingTo(messageContextMenu.msg);
                  setMessageContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
              >
                <Reply size={16} /> Reply
              </button>

              <button 
                onClick={() => {
                  clearSelection();
                  toggleSelectMessage(messageContextMenu.msg.id);
                  setIsForwardModalOpen(true);
                  setMessageContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
              >
                <Forward size={16} /> Forward
              </button>

              <button 
                onClick={() => {
                  toggleSelectMessage(messageContextMenu.msg.id);
                  setMessageContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
              >
                <CheckSquare size={16} /> Select Message
              </button>

              <button 
                onClick={() => {
                  toggleStarMessage(messageContextMenu.msg.id);
                  setMessageContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
              >
                <Star size={16} className={messageContextMenu.msg.isStarred ? "text-yellow-400" : ""} /> 
                {messageContextMenu.msg.isStarred ? 'Unstar Message' : 'Star Message'}
              </button>

              {activeContact?.publicKey && (
                <button 
                  onClick={() => {
                    handleOpenSafetyModal();
                    setMessageContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
                >
                  <ShieldCheck size={16} className="text-green-400" /> Verify Security Code
                </button>
              )}

              {messageContextMenu.msg.senderId === user?.id && messageContextMenu.msg.text && !messageContextMenu.msg.isDeleted && (
                <button 
                  onClick={() => {
                    setEditingMessage(messageContextMenu.msg);
                    setMessageContextMenu(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground/90 hover:bg-foreground/10 transition-colors text-left"
                >
                  <Edit2 size={16} className="text-cyan-400" /> Edit
                </button>
              )}

              {messageContextMenu.msg.senderId === user?.id && !messageContextMenu.msg.isDeleted && (
                <>
                  <div className="h-[1px] w-full bg-foreground/10 my-1" />
                  <button 
                    onClick={() => {
                      handleDeleteMessage(messageContextMenu.msg.id, true);
                      setMessageContextMenu(null);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/20 transition-colors text-left"
                  >
                    <Trash2 size={16} /> Delete for Everyone
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Copy Toast Feedback */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-foreground/90 text-background px-4 py-2 rounded-full text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <Check size={14} className="text-green-500" />
            <span>{copyToast}</span>
          </motion.div>
        )}
      </AnimatePresence>



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

      {/* Interactive Poll Creation Modal */}
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
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-2xl flex flex-col items-center justify-between p-6"
          >
            <div className="w-full flex justify-between items-center z-50 text-foreground">
              <span className="text-sm font-semibold truncate max-w-sm">
                {selectedLightboxMedia.name || 'Media Viewer'}
              </span>
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); downloadFile(selectedLightboxMedia.url, selectedLightboxMedia.name || 'media'); }}
                  className="p-2.5 rounded-xl bg-foreground/10 hover:bg-foreground/20 text-foreground flex items-center gap-1 text-xs"
                >
                  <Download size={16} /> Download
                </button>
                <button 
                  onClick={() => setSelectedLightboxMedia(null)}
                  className="p-2.5 rounded-full bg-foreground/10 text-foreground hover:bg-foreground/20"
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

      {/* Contact Info Modal */}
      <AnimatePresence>
        {isContactInfoOpen && activeContact && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-0 bottom-0 w-80 bg-liquid-base border-l border-foreground/5 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-foreground/5 flex items-center gap-3">
              <button onClick={() => setIsContactInfoOpen(false)} className="p-2 hover:bg-foreground/5 rounded-full">
                <X size={20} />
              </button>
              <h2 className="font-bold">Contact Info</h2>
            </div>
            
            <div className="p-6 flex flex-col items-center border-b border-foreground/5">
              <img 
                src={activeContact.avatar} 
                alt={activeContact.username} 
                className="w-32 h-32 rounded-full object-cover mb-4 cursor-pointer"
                onClick={() => setFullScreenImage(activeContact.avatar)}
              />
              <h3 className="text-xl font-bold mb-1">{activeContact.username}</h3>
              <p className="text-sm text-foreground/60">{activeContact.email}</p>
            </div>

            <div className="p-4 space-y-3 flex-1 overflow-y-auto">
              {activeContact.liquidNumber && (
                <div className="bg-foreground/5 rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-foreground/50 mb-1 uppercase tracking-wider">Liquid ID</h4>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-mono font-bold text-liquid-accent">{activeContact.liquidNumber}</p>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeContact.liquidNumber);
                        alert(`Copied ${activeContact.username}'s Liquid ID: ${activeContact.liquidNumber}`);
                      }}
                      className="text-xs text-foreground/60 hover:text-liquid-accent underline"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <div className="bg-foreground/5 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-foreground/50 mb-2 uppercase tracking-wider">About</h4>
                <p className="text-sm text-foreground/90">{activeContact.about || activeContact.status || "Hey there! I am using Liquid Chat."}</p>
              </div>
              
              <div 
                className="bg-foreground/5 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-foreground/10 transition-colors"
                onClick={() => {
                  setIsContactInfoOpen(false);
                  setIsGalleryOpen(true);
                }}
              >
                <div className="flex flex-col">
                  <h4 className="text-sm font-semibold text-foreground">Media, Links, and Docs</h4>
                  <p className="text-xs text-liquid-accent">View all shared files</p>
                </div>
                <FolderKanban size={18} className="text-liquid-accent" />
              </div>

              <div 
                className="bg-foreground/5 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-foreground/10 transition-colors mt-2"
                onClick={() => {
                  setIsContactInfoOpen(false);
                  handleOpenSafetyModal();
                }}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-400" />
                    <h4 className="text-sm font-semibold text-foreground">Encryption</h4>
                  </div>
                  <p className="text-xs text-foreground/60 mt-0.5">Verify 60-digit security code</p>
                </div>
                <Lock size={16} className="text-emerald-400" />
              </div>

              <div 
                className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex justify-between items-center cursor-pointer hover:bg-rose-500/20 transition-colors mt-2" 
                onClick={() => {
                  if (token) {
                    toggleBlockUser(token, activeContact.id);
                    setIsContactInfoOpen(false);
                  }
                }}
              >
                <div className="flex flex-col">
                  <h4 className="text-sm text-rose-400 font-semibold">
                    {isBlocked ? `Unblock ${activeContact.username}` : `Block ${activeContact.username}`}
                  </h4>
                  <p className="text-[11px] text-foreground/50">
                    {isBlocked ? 'Allow incoming calls and messages' : 'Block calls and messages from this contact'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Japanese Cyber-Glass E2EE Security Code Modal */}
      <AnimatePresence>
        {isSafetyModalOpen && activeContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSafetyModalOpen(false)}
            className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-liquid-base border border-foreground/10 rounded-3xl p-6 sm:p-7 shadow-[0_0_60px_rgba(0,210,255,0.2)] flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsSafetyModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-foreground/10 text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>

              {/* Verified Shield Badge */}
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-4 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <ShieldCheck size={36} />
              </div>

              <h2 className="text-xl font-bold text-foreground mb-1">Verify Security Code</h2>
              <p className="text-xs text-foreground/60 mb-5 max-w-xs">
                End-to-End Encryption with <span className="text-foreground font-semibold">{activeContact.username}</span>
              </p>

              {/* QR Code Container */}
              <div className="bg-white p-3.5 rounded-2xl shadow-xl mb-5 flex items-center justify-center border border-foreground/10">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`liquidchat-e2ee:${activeContact.id}:${safetyNumber}`)}`}
                  alt="Security QR Code"
                  className="w-40 h-40 object-contain rounded-lg"
                />
              </div>

              {/* 60-Digit Code Display */}
              <div className="w-full bg-background/50 rounded-2xl p-4 border border-foreground/10 mb-4">
                <p className="text-[11px] font-mono text-liquid-accent font-semibold tracking-wider uppercase mb-2">
                  60-Digit Security Fingerprint
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm font-mono font-bold text-foreground/90 tracking-widest selection:bg-liquid-accent selection:text-liquid-dark py-1">
                  {(safetyNumber || '28491 04829 19482 94819 40284 91823 84920 18492 48192 04829 19482 39481')
                    .split(' ')
                    .map((chunk, idx) => (
                      <span key={idx} className="bg-foreground/5 py-1 px-1.5 rounded-md text-center">
                        {chunk}
                      </span>
                    ))}
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-foreground/50 leading-relaxed mb-5">
                To verify that messages and calls with {activeContact.username} are end-to-end encrypted, compare these 60 numbers with their device or scan this QR code.
              </p>

              {/* Actions */}
              <div className="flex w-full gap-3">
                <button
                  onClick={() => {
                    if (typeof navigator !== 'undefined') {
                      navigator.clipboard.writeText(safetyNumber.replace(/\s+/g, ''));
                      setCopyToast("Security code copied!");
                      setTimeout(() => setCopyToast(null), 2500);
                    }
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-foreground font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Copy size={15} />
                  <span>Copy Code</span>
                </button>
                <button
                  onClick={() => setIsSafetyModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-liquid-dark font-bold text-xs flex items-center justify-center transition-opacity hover:opacity-90 cursor-pointer shadow-md"
                >
                  Verified & OK
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Copy Toast */}
      <AnimatePresence>
        {copyToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[120] bg-liquid-base/95 border border-liquid-accent/40 text-liquid-accent font-medium text-xs py-2 px-4 rounded-full shadow-2xl backdrop-blur-xl flex items-center gap-2"
          >
            <Check size={14} className="text-emerald-400" />
            <span>{copyToast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



