"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Search, Trash2, Forward, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { useChatStore } from '@/store/chatStore';

export default function StarredVaultPanel({ onSelectContact }: { onSelectContact?: (contact: any) => void }) {
  const { messages, toggleStarMessage } = useChatStore();
  const [searchTerm, setSearchTerm] = useState('');

  const starredMessages = messages.filter(m => m.isStarred);
  const filtered = starredMessages.filter(m => 
    m.text?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 no-scrollbar">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Star size={20} className="text-yellow-400 fill-yellow-400" />
          <span>Starred Messages</span>
        </h2>
        <p className="text-xs text-foreground/60">All your saved and bookmarked messages</p>
      </div>

      {/* Search */}
      <div className="h-10 bg-background/30 rounded-xl px-3 flex items-center gap-2.5 border border-foreground/5 focus-within:border-liquid-accent/50 transition-colors">
        <Search size={16} className="text-foreground/60" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search starred messages..."
          className="flex-1 bg-transparent border-none outline-none text-foreground text-xs placeholder-gray-500"
        />
      </div>

      {/* List */}
      <div className="space-y-2.5 flex-1 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <div className="p-10 text-center bg-foreground/5 rounded-2xl border border-foreground/5 text-foreground/50 text-xs">
            No starred messages found. Click the star icon on any message to save it here!
          </div>
        ) : (
          filtered.map((msg) => (
            <motion.div
              key={msg.id}
              whileHover={{ scale: 1.01 }}
              className="p-3.5 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-liquid-accent">
                  {msg.sender ? msg.sender.username : 'Saved Message'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground/50 font-mono">
                    {msg.createdAt ? format(new Date(msg.createdAt), 'MMM dd, hh:mm a') : 'Recent'}
                  </span>
                  <button
                    onClick={() => toggleStarMessage(msg.id)}
                    className="text-yellow-400 hover:text-foreground/60 p-1"
                    title="Unstar"
                  >
                    <Star size={14} className="fill-yellow-400" />
                  </button>
                </div>
              </div>

              {msg.type === 'image' && msg.fileUrl && (
                <img src={msg.fileUrl} alt="Starred attachment" className="rounded-xl max-h-40 object-cover" />
              )}

              {msg.text && (
                <p className="text-xs text-foreground leading-relaxed">{msg.text}</p>
              )}

              {msg.fileName && (
                <div className="flex items-center gap-2 text-xs text-cyan-300">
                  <span>📎 {msg.fileName}</span>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

