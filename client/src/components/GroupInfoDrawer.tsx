"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Users, Shield, UserPlus, LogOut, Trash2, 
  Edit2, Check, MoreVertical, ShieldAlert, Sparkles 
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore, GroupItem } from '@/store/chatStore';
import axios from 'axios';

interface GroupInfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  users: any[];
}

export default function GroupInfoDrawer({ isOpen, onClose, users }: GroupInfoDrawerProps) {
  const { user, token } = useAuthStore();
  const { activeGroup, setActiveGroup, groups, setGroups } = useChatStore();

  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [selectedNewUsers, setSelectedNewUsers] = useState<string[]>([]);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [nameText, setNameText] = useState(activeGroup?.name || '');
  const [descText, setDescText] = useState(activeGroup?.description || '');

  if (!isOpen || !activeGroup) return null;

  const myMembership = activeGroup.members.find(m => m.user.id === user?.id);
  const isAdmin = myMembership?.role === 'admin' || activeGroup.creatorId === user?.id;

  // Non-members available to add
  const existingMemberIds = activeGroup.members.map(m => m.user.id);
  const availableUsersToAdd = users.filter(u => !existingMemberIds.includes(u.id));

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

  const handleRemoveMember = async (targetUserId: string) => {
    if (!token) return;
    try {
      await axios.delete(`/api/groups/${activeGroup.id}/members/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const updatedMembers = activeGroup.members.filter(m => m.user.id !== targetUserId);
      const updatedGroup = { ...activeGroup, members: updatedMembers };

      setActiveGroup(updatedGroup);
      setGroups(groups.map(g => g.id === activeGroup.id ? updatedGroup : g));
    } catch (e) {}
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

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-end"
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md h-full bg-liquid-base/95 border-l border-white/10 p-6 flex flex-col justify-between overflow-y-auto no-scrollbar shadow-2xl"
        >
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-bold text-white">Group Details</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Group Identity Card */}
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-liquid-accent to-liquid-secondary shadow-[0_0_25px_rgba(0,210,255,0.4)] mb-3">
                <img
                  src={activeGroup.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(activeGroup.name)}`}
                  alt={activeGroup.name}
                  className="w-full h-full rounded-full object-cover bg-liquid-base"
                />
              </div>

              {!isEditingInfo ? (
                <>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">{activeGroup.name}</h2>
                    {isAdmin && (
                      <button onClick={() => {
                        setNameText(activeGroup.name);
                        setDescText(activeGroup.description || '');
                        setIsEditingInfo(true);
                      }} className="text-liquid-accent hover:text-white">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">{activeGroup.description || 'No description'}</p>
                  <span className="text-[11px] text-liquid-accent font-mono mt-1">Group • {activeGroup.members.length} participants</span>
                </>
              ) : (
                <div className="w-full space-y-2 mt-2">
                  <input
                    type="text"
                    value={nameText}
                    onChange={(e) => setNameText(e.target.value)}
                    className="w-full bg-black/40 border border-liquid-accent/50 rounded-xl px-3 py-1.5 text-white text-sm"
                  />
                  <textarea
                    value={descText}
                    onChange={(e) => setDescText(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-2 text-white text-xs resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditingInfo(false)} className="flex-1 py-1 rounded-lg bg-white/10 text-white text-xs">Cancel</button>
                    <button onClick={handleSaveInfo} className="flex-1 py-1 rounded-lg bg-liquid-accent text-liquid-dark font-bold text-xs">Save</button>
                  </div>
                </div>
              )}
            </div>

            {/* Participants Section */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
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
                <div className="bg-black/40 border border-liquid-accent/30 rounded-2xl p-3 space-y-2">
                  <h4 className="text-xs font-semibold text-white">Select Contacts to Add</h4>
                  <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar">
                    {availableUsersToAdd.length === 0 ? (
                      <p className="text-[11px] text-gray-500 py-2 text-center">All contacts are already in this group</p>
                    ) : (
                      availableUsersToAdd.map(u => {
                        const isSel = selectedNewUsers.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            onClick={() => setSelectedNewUsers(prev => isSel ? prev.filter(id => id !== u.id) : [...prev, u.id])}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-xs ${isSel ? 'bg-liquid-accent/20 text-white' : 'hover:bg-white/5 text-gray-300'}`}
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
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10">
                          <img src={member.user.avatar} alt={member.user.username} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white">
                              {isMe ? 'You' : member.user.username}
                            </span>
                            {isThisUserAdmin && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-liquid-accent/20 text-liquid-accent border border-liquid-accent/30">
                                Group Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{member.user.about || 'Available'}</p>
                        </div>
                      </div>

                      {/* Admin Actions on Member */}
                      {isAdmin && !isMe && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleToggleAdminRole(member.user.id, member.role)}
                            className="p-1.5 text-gray-400 hover:text-liquid-accent rounded-lg hover:bg-white/10"
                            title={isThisUserAdmin ? "Dismiss as admin" : "Make group admin"}
                          >
                            <Shield size={14} className={isThisUserAdmin ? "text-liquid-accent fill-liquid-accent/20" : ""} />
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.user.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/10"
                            title="Remove from group"
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

          {/* Leave Group Action */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleLeaveGroup}
              className="w-full h-11 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              <span>Exit Group</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

