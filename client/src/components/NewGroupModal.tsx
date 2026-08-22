"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}

export default function NewGroupModal({ isOpen, onClose, users }: NewGroupModalProps) {
  const { token } = useAuthStore();
  const { groups, setGroups, setActiveGroup } = useChatStore();

  const [step, setStep] = useState<'members' | 'details'>('members');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(uId => uId !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !token) return;
    setIsSubmitting(true);

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
      // Reset state
      setStep('members');
      setSelectedUserIds([]);
      setGroupName('');
      setGroupDescription('');
    } catch (e) {
      console.error('Error creating group:', e);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md bg-liquid-base/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-liquid-accent/20 text-liquid-accent">
                <Users size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Create New Group</h3>
                <span className="text-xs text-gray-400">
                  {step === 'members' ? `Select participants (${selectedUserIds.length} selected)` : 'Provide group details'}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white p-1">
              <X size={20} />
            </button>
          </div>

          {/* Step 1: Member Selection */}
          {step === 'members' && (
            <>
              <div className="max-h-72 overflow-y-auto space-y-1.5 no-scrollbar py-2">
                {users.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-6">No contacts available to add</p>
                ) : (
                  users.map((u) => {
                    const isSelected = selectedUserIds.includes(u.id);
                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUser(u.id)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-liquid-accent/15 border border-liquid-accent/30' : 'hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                            <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold text-white">{u.username}</h4>
                            <p className="text-[11px] text-gray-400 truncate max-w-[180px]">{u.about || 'Available'}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                          isSelected ? 'bg-liquid-accent border-liquid-accent text-liquid-dark' : 'border-gray-500'
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
                className="h-11 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all disabled:opacity-40"
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
                <label className="text-xs font-semibold text-gray-300 block mb-1">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="e.g. Project Developers 🚀"
                  className="w-full h-11 bg-black/40 border border-white/10 rounded-xl px-3.5 text-white text-xs outline-none focus:border-liquid-accent/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Group Description</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What is this group about?"
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-liquid-accent/50 resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('members')}
                  className="flex-1 h-11 bg-white/10 hover:bg-white/20 rounded-xl text-white text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || isSubmitting}
                  className="flex-1 h-11 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-white font-bold text-xs shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:brightness-110 disabled:opacity-40"
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

