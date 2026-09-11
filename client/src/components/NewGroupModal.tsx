"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Search, ShieldAlert } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}

export default function NewGroupModal({ isOpen, onClose, users }: NewGroupModalProps) {
  const { user: currentUser, token } = useAuthStore();
  const { groups, setGroups, setActiveGroup, activeConversations } = useChatStore();

  const [step, setStep] = useState<'members' | 'details'>('members');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Strictly filter to existing chat contacts (contacts you have conversation history with)
  const availableChatContacts = useMemo(() => {
    return users.filter(u => {
      if (!currentUser || u.id === currentUser.id) return false;
      // Must be in active conversations or saved contacts
      return activeConversations.includes(u.id);
    });
  }, [users, currentUser, activeConversations]);

  // Filter contacts by search query
  const filteredContacts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return availableChatContacts;
    return availableChatContacts.filter(u => 
      u.username.toLowerCase().includes(q) || 
      (u.liquidNumber && u.liquidNumber.includes(q))
    );
  }, [availableChatContacts, searchQuery]);

  const selectedUsersList = useMemo(() => {
    return availableChatContacts.filter(u => selectedUserIds.includes(u.id));
  }, [availableChatContacts, selectedUserIds]);

  if (!isOpen) return null;

  const toggleUser = (targetUser: any) => {
    if (targetUser.groupsPrivacy === 'nobody') {
      setErrorMsg(`@${targetUser.username} does not allow being added to groups due to their privacy settings.`);
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    setSelectedUserIds(prev => 
      prev.includes(targetUser.id) ? prev.filter(uId => uId !== targetUser.id) : [...prev, targetUser.id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !token) return;
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await axios.post('/api/groups', {
        name: groupName.trim(),
        description: groupDescription.trim() || 'Welcome to our group! 🌊',
        memberIds: selectedUserIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups([res.data, ...groups]);
      setActiveGroup(res.data);
      onClose();

      // Reset form state
      setStep('members');
      setSelectedUserIds([]);
      setGroupName('');
      setGroupDescription('');
      setSearchQuery('');
    } catch (e: any) {
      console.error('Error creating group:', e);
      setErrorMsg(e.response?.data?.error || 'Failed to create group');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-liquid-accent/20 text-liquid-accent">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">New Group</h3>
                <span className="text-xs text-foreground/60">
                  {step === 'members' 
                    ? `Add existing chat contacts (${selectedUserIds.length} selected)` 
                    : 'Group Details'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-foreground/60 hover:text-foreground p-1">
              <X size={20} />
            </button>
          </div>

          {/* Privacy Notice or Error */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-400 text-xs">
              <ShieldAlert size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Step 1: Member Selection */}
          {step === 'members' && (
            <>
              {/* Selected Contacts Pill Chips (WhatsApp Style) */}
              {selectedUsersList.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar border-b border-foreground/5">
                  {selectedUsersList.map(u => (
                    <div 
                      key={u.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-liquid-accent/15 border border-liquid-accent/30 text-xs font-semibold text-foreground shrink-0"
                    >
                      <img src={u.avatar} alt={u.username} className="w-5 h-5 rounded-full object-cover" />
                      <span className="max-w-[80px] truncate">{u.username}</span>
                      <button 
                        onClick={() => toggleUser(u)}
                        className="p-0.5 hover:text-rose-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search Bar */}
              <div className="h-10 bg-background/30 rounded-xl px-3 flex items-center gap-2 border border-foreground/5 focus-within:border-liquid-accent/50 transition-colors">
                <Search size={16} className="text-foreground/50 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search existing chat contacts..."
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-xs placeholder-gray-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-foreground/40 hover:text-foreground">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Contacts List */}
              <div className="max-h-64 overflow-y-auto space-y-1.5 no-scrollbar py-1">
                {availableChatContacts.length === 0 ? (
                  <div className="text-center py-8 px-4 space-y-2">
                    <p className="text-xs font-medium text-foreground/60">No existing chat contacts found</p>
                    <p className="text-[11px] text-foreground/40">
                      Start a chat with a user using their 10-digit Liquid ID before adding them to a group.
                    </p>
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <p className="text-xs text-foreground/50 text-center py-6">No matching contacts</p>
                ) : (
                  filteredContacts.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    const isRestricted = u.groupsPrivacy === 'nobody';

                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUser(u)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isRestricted 
                            ? 'opacity-40 hover:bg-transparent cursor-not-allowed'
                            : isSelected 
                              ? 'bg-liquid-accent/15 border border-liquid-accent/30' 
                              : 'hover:bg-foreground/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-foreground/10 shrink-0">
                            <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-foreground">{u.username}</h4>
                              {u.liquidNumber && (
                                <span className="text-[10px] font-mono text-liquid-accent/80">{u.liquidNumber}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-foreground/50 truncate max-w-[190px]">
                              {isRestricted ? '🔒 Restricts group invites' : (u.about || 'Available')}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors ${
                          isSelected ? 'bg-liquid-accent border-liquid-accent text-liquid-dark' : 'border-foreground/30'
                        }`}>
                          {isSelected && <Check size={12} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <button
                onClick={() => setStep('details')}
                disabled={selectedUserIds.length === 0}
                className="h-11 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all disabled:opacity-40"
              >
                <span>Next ({selectedUserIds.length} selected)</span>
              </button>
            </>
          )}

          {/* Step 2: Group Name & Description */}
          {step === 'details' && (
            <div className="space-y-4 py-2">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-lg flex items-center justify-center">
                  <img
                    src={`https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupName || 'LiquidGroup')}`}
                    alt="Group Avatar"
                    className="w-full h-full rounded-full object-cover bg-liquid-base"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Liquid Developers 🌊"
                  className="w-full h-11 bg-background/40 border border-foreground/10 rounded-xl px-3.5 text-foreground text-xs outline-none focus:border-liquid-accent/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground/80 block mb-1">Group Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={2}
                  className="w-full bg-background/40 border border-foreground/10 rounded-xl p-3 text-foreground text-xs outline-none focus:border-liquid-accent/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('members')}
                  className="flex-1 h-11 bg-foreground/10 hover:bg-foreground/20 rounded-xl text-foreground text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || isSubmitting}
                  className="flex-1 h-11 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-foreground font-bold text-xs shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:brightness-110 disabled:opacity-40"
                >
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
