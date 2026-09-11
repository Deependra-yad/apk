"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, Shield, UserPlus, LogOut, Trash2, 
  Edit2, Check, ShieldAlert, Sparkles, AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import axios from 'axios';

interface GroupInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}

export default function GroupInfoDrawer({ isOpen, onClose, users }: GroupInfoDrawerProps) {
  const { user, token } = useAuthStore();
  const { activeGroup, setActiveGroup, groups, setGroups, activeConversations } = useChatStore();

  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedNewUsers, setSelectedNewUsers] = useState<string[]>([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [nameText, setNameText] = useState(activeGroup?.name || '');
  const [descText, setDescText] = useState(activeGroup?.description || '');
  const [memberToRemove, setMemberToRemove] = useState<any>(null);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !activeGroup) return null;

  const myMembership = activeGroup.members.find(m => m.user.id === user?.id);
  const isCreator = activeGroup.creatorId === user?.id;
  const isAdmin = myMembership?.role === 'admin' || isCreator;

  // Only allow adding contacts with existing chat history
  const existingMemberIds = activeGroup.members.map(m => m.user.id);
  const availableUsersToAdd = users.filter(u => 
    !existingMemberIds.includes(u.id) && 
    activeConversations.includes(u.id) &&
    u.id !== user?.id
  );

  const handleSaveInfo = async () => {
    if (!token || !isAdmin) return;
    try {
      const res = await axios.put(`/api/groups/${activeGroup.id}`, {
        name: nameText,
        description: descText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveGroup({ ...activeGroup, name: res.data.name, description: res.data.description });
      setGroups(groups.map(g => g.id === activeGroup.id ? { ...g, name: res.data.name, description: res.data.description } : g));
      setIsEditingInfo(false);
    } catch (e) {}
  };

  const handleAddMembers = async () => {
    if (!token || selectedNewUsers.length === 0) return;
    try {
      const res = await axios.post(`/api/groups/${activeGroup.id}/members`, {
        userIds: selectedNewUsers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveGroup(res.data);
      setGroups(groups.map(g => g.id === activeGroup.id ? res.data : g));
      setIsAddingMembers(false);
      setSelectedNewUsers([]);
    } catch (e) {}
  };

  const handleConfirmRemoveMember = async () => {
    if (!token || !memberToRemove) return;
    setIsProcessing(true);
    try {
      await axios.delete(`/api/groups/${activeGroup.id}/members/${memberToRemove.user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedMembers = activeGroup.members.filter(m => m.user.id !== memberToRemove.user.id);
      const updatedGroup = { ...activeGroup, members: updatedMembers };

      setActiveGroup(updatedGroup);
      setGroups(groups.map(g => g.id === activeGroup.id ? updatedGroup : g));
      setMemberToRemove(null);
    } catch (e) {
      console.error('Failed to remove member:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleAdminRole = async (targetUserId: string, currentRole: string) => {
    if (!token || !isAdmin) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    try {
      await axios.put(`/api/groups/${activeGroup.id}/members/${targetUserId}/role`, {
        role: newRole
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedMembers = activeGroup.members.map(m => 
        m.user.id === targetUserId ? { ...m, role: newRole } : m
      );
      const updatedGroup = { ...activeGroup, members: updatedMembers };

      setActiveGroup(updatedGroup);
      setGroups(groups.map(g => g.id === activeGroup.id ? updatedGroup : g));
    } catch (e) {}
  };

  const handleLeaveGroup = async () => {
    if (!token || !user) return;
    try {
      await axios.delete(`/api/groups/${activeGroup.id}/members/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(groups.filter(g => g.id !== activeGroup.id));
      setActiveGroup(null);
      onClose();
    } catch (e) {}
  };

  const handleDeleteGroup = async () => {
    if (!token || (!isCreator && !isAdmin)) return;
    setIsProcessing(true);
    try {
      await axios.delete(`/api/groups/${activeGroup.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGroups(groups.filter(g => g.id !== activeGroup.id));
      setActiveGroup(null);
      setIsDeletingGroup(false);
      onClose();
    } catch (e) {
      console.error('Failed to delete group:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 300 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 300 }}
        className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-liquid-base/95 backdrop-blur-2xl border-l border-foreground/10 shadow-2xl flex flex-col justify-between p-6"
      >
        <div className="space-y-6 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex justify-between items-center pb-3 border-b border-foreground/10">
            <h3 className="text-base font-bold text-foreground">Group Info</h3>
            <button onClick={onClose} className="p-1 text-foreground/60 hover:text-foreground">
              <X size={20} />
            </button>
          </div>

          {/* Avatar & Title Card */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="relative w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-xl">
              <img
                src={activeGroup.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(activeGroup.name)}`}
                alt={activeGroup.name}
                className="w-full h-full rounded-full object-cover bg-liquid-base"
              />
            </div>

            {isEditingInfo ? (
              <div className="w-full space-y-2">
                <input
                  type="text"
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  className="w-full bg-background/50 border border-liquid-accent rounded-xl px-3 py-1.5 text-center text-sm font-bold text-foreground outline-none"
                  placeholder="Group Name"
                />
                <textarea
                  value={descText}
                  onChange={(e) => setDescText(e.target.value)}
                  rows={2}
                  className="w-full bg-background/50 border border-foreground/10 rounded-xl p-2 text-xs text-foreground outline-none resize-none"
                  placeholder="Group Description"
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsEditingInfo(false)} className="flex-1 py-1 rounded-lg bg-foreground/10 text-xs">
                    Cancel
                  </button>
                  <button onClick={handleSaveInfo} className="flex-1 py-1 rounded-lg bg-liquid-accent text-liquid-dark font-bold text-xs">
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-lg font-bold text-foreground">{activeGroup.name}</h2>
                  {isAdmin && (
                    <button onClick={() => setIsEditingInfo(true)} className="text-foreground/40 hover:text-liquid-accent">
                      <Edit2 size={14} />
                    </button>
                  )}
                </div>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Group • {activeGroup.members.length} participants
                </p>
                {activeGroup.description && (
                  <p className="text-xs text-foreground/80 bg-foreground/5 rounded-xl p-2.5 mt-2.5 text-left border border-foreground/5">
                    {activeGroup.description}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Group Participants Section */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                {activeGroup.members.length} Participants
              </span>
              {isAdmin && (
                <button
                  onClick={() => setIsAddingMembers(!isAddingMembers)}
                  className="text-xs text-liquid-accent font-semibold flex items-center gap-1 hover:underline"
                >
                  <UserPlus size={13} />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add Member Dropdown Picker */}
            {isAddingMembers && (
              <div className="bg-background/40 border border-liquid-accent/30 rounded-2xl p-3 space-y-2">
                <h4 className="text-xs font-semibold text-foreground">Select Contacts to Add</h4>
                <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
                  {availableUsersToAdd.length === 0 ? (
                    <p className="text-[11px] text-foreground/50 py-2 text-center">
                      No other chat contacts available to add
                    </p>
                  ) : (
                    availableUsersToAdd.map(u => {
                      const isSel = selectedNewUsers.includes(u.id);
                      return (
                        <div
                          key={u.id}
                          onClick={() => setSelectedNewUsers(prev => isSel ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                          className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs ${isSel ? 'bg-liquid-accent/20 text-foreground' : 'hover:bg-foreground/5 text-foreground/80'}`}
                        >
                          <div className="flex items-center gap-2">
                            <img src={u.avatar} alt={u.username} className="w-6 h-6 rounded-full" />
                            <span>{u.username}</span>
                          </div>
                          {isSel && <Check size={14} className="text-liquid-accent" />}
                        </div>
                      );
                    })
                  )}
                </div>
                {availableUsersToAdd.length > 0 && (
                  <button
                    onClick={handleAddMembers}
                    disabled={selectedNewUsers.length === 0}
                    className="w-full py-1.5 bg-liquid-accent text-liquid-dark font-bold text-xs rounded-xl disabled:opacity-40"
                  >
                    Confirm Add ({selectedNewUsers.length})
                  </button>
                )}
              </div>
            )}

            {/* Member Roster List */}
            <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar">
              {activeGroup.members.map(member => {
                const isThisUserAdmin = member.role === 'admin' || member.user.id === activeGroup.creatorId;
                const isMe = member.user.id === user?.id;

                return (
                  <div
                    key={member.user.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-foreground/5 border border-foreground/5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-foreground/10 shrink-0">
                        <img src={member.user.avatar} alt={member.user.username} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground">
                            {isMe ? 'You' : member.user.username}
                          </span>
                          {isThisUserAdmin && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-liquid-accent/20 text-liquid-accent border border-liquid-accent/30">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-foreground/50 truncate max-w-[140px]">{member.user.about || 'Available'}</p>
                      </div>
                    </div>

                    {/* Admin Actions on Member */}
                    {isAdmin && !isMe && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleAdminRole(member.user.id, member.role)}
                          className="p-1.5 text-foreground/50 hover:text-liquid-accent rounded-lg hover:bg-foreground/10 transition-colors"
                          title={isThisUserAdmin ? "Dismiss as admin" : "Make group admin"}
                        >
                          <Shield size={14} className={isThisUserAdmin ? "text-liquid-accent fill-liquid-accent/20" : ""} />
                        </button>
                        <button
                          onClick={() => setMemberToRemove(member)}
                          className="p-1.5 text-foreground/50 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                          title="Remove user from group"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Actions: Exit Group & Delete Group */}
        <div className="pt-4 border-t border-foreground/10 space-y-2">
          {isAdmin && (
            <button
              onClick={() => setIsDeletingGroup(true)}
              className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-rose-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={15} />
              <span>Delete Group</span>
            </button>
          )}

          <button
            onClick={handleLeaveGroup}
            className="w-full h-10 bg-foreground/5 hover:bg-foreground/10 text-foreground/70 border border-foreground/10 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut size={15} />
            <span>Exit Group</span>
          </button>
        </div>

        {/* Confirmation Modal: Remove Member */}
        <AnimatePresence>
          {memberToRemove && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-xs bg-liquid-base border border-rose-500/30 rounded-2xl p-5 text-center space-y-3 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="text-sm font-bold text-foreground">Remove User?</h4>
                <p className="text-xs text-foreground/70">
                  Remove <strong>@{memberToRemove.user.username}</strong> from this group? They will no longer have access to group messages.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setMemberToRemove(null)}
                    disabled={isProcessing}
                    className="flex-1 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs font-medium text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmRemoveMember}
                    disabled={isProcessing}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
                  >
                    {isProcessing ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Confirmation Modal: Delete Group */}
        <AnimatePresence>
          {isDeletingGroup && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="w-full max-w-xs bg-liquid-base border border-rose-500/40 rounded-2xl p-5 text-center space-y-3 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                  <AlertTriangle size={24} />
                </div>
                <h4 className="text-sm font-bold text-foreground">Delete Group Permanently?</h4>
                <p className="text-xs text-foreground/70">
                  All messages, media attachments, and memberships will be deleted from the database.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setIsDeletingGroup(false)}
                    disabled={isProcessing}
                    className="flex-1 py-2 rounded-xl bg-foreground/10 hover:bg-foreground/15 text-xs font-medium text-foreground"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteGroup}
                    disabled={isProcessing}
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
                  >
                    {isProcessing ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
