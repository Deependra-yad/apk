"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Forward, Check, Search, Users } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageIds: string[];
  users: any[];
}

export default function ForwardModal({ isOpen, onClose, messageIds, users }: ForwardModalProps) {
  const { token } = useAuthStore();
  const { groups, clearSelection } = useChatStore();

  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const toggleContact = (id: string) => {
    setSelectedContactIds(prev => prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]);
  };

  const toggleGroup = (id: string) => {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]);
  };

  const handleForward = async () => {
    if (!token || (selectedContactIds.length === 0 && selectedGroupIds.length === 0)) return;
    setIsSending(true);

    try {
      // Forward to direct contacts
      if (selectedContactIds.length > 0) {
        await axios.post('/api/messages/forward', {
          messageIds,
          targetIds: selectedContactIds,
          isGroupTarget: false
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      // Forward to groups
      if (selectedGroupIds.length > 0) {
        await axios.post('/api/messages/forward', {
          messageIds,
          targetIds: selectedGroupIds,
          isGroupTarget: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      clearSelection();
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(search.toLowerCase()));
  const totalSelected = selectedContactIds.length + selectedGroupIds.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-xl p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-liquid-base/95 border border-foreground/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-foreground/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-liquid-accent/20 text-liquid-accent">
                <Forward size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Forward Message</h3>
                <span className="text-xs text-foreground/60">
                  {messageIds.length} message{messageIds.length > 1 ? 's' : ''} selected
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-foreground/60 hover:text-foreground p-1">
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="h-10 bg-background/40 rounded-xl px-3 flex items-center gap-2 border border-foreground/10">
            <Search size={16} className="text-foreground/60" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts or groups..."
              className="flex-1 bg-transparent border-none outline-none text-foreground text-xs placeholder-gray-500"
            />
          </div>

          {/* List of Contacts & Groups */}
          <div className="max-h-72 overflow-y-auto space-y-3 no-scrollbar py-1">
            {/* Groups */}
            {filteredGroups.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider px-1">Groups</span>
                {filteredGroups.map(g => {
                  const isSelected = selectedGroupIds.includes(g.id);
                  return (
                    <div
                      key={g.id}
                      onClick={() => toggleGroup(g.id)}
                      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer ${
                        isSelected ? 'bg-liquid-accent/15 border border-liquid-accent/30' : 'hover:bg-foreground/5'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-liquid-accent/20 flex items-center justify-center">
                          <Users size={16} className="text-liquid-accent" />
                        </div>
                        <span className="text-xs font-semibold text-foreground">{g.name}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                        isSelected ? 'bg-liquid-accent border-liquid-accent text-liquid-dark' : 'border-gray-500'
                      }`}>
                        {isSelected && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Contacts */}
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-foreground/60 uppercase tracking-wider px-1">Contacts</span>
              {filteredUsers.map(u => {
                const isSelected = selectedContactIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleContact(u.id)}
                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer ${
                      isSelected ? 'bg-liquid-accent/15 border border-liquid-accent/30' : 'hover:bg-foreground/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-xs font-semibold text-foreground">{u.username}</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                      isSelected ? 'bg-liquid-accent border-liquid-accent text-liquid-dark' : 'border-gray-500'
                    }`}>
                      {isSelected && <Check size={10} strokeWidth={3} />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleForward}
            disabled={totalSelected === 0 || isSending}
            className="h-11 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:brightness-110 disabled:opacity-40"
          >
            <Forward size={16} />
            <span>{isSending ? 'Forwarding...' : `Forward to (${totalSelected})`}</span>
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

