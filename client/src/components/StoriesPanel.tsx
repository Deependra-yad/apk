"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Image as ImageIcon, Clock, Eye, Trash2 } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { format } from 'date-fns';

export default function StoriesPanel({ onOpenCreateStory, onSelectStory }: { onOpenCreateStory: () => void; onSelectStory: (index: number) => void }) {
  const { user, token } = useAuthStore();
  const { socket } = useChatStore();
  const [stories, setStories] = useState<any[]>([]);

  const fetchStories = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchStories();
  }, [token]);

  useEffect(() => {
    if (!socket) return;
    const handleNewStory = (story: any) => {
      setStories(prev => [story, ...prev.filter(s => s.id !== story.id)]);
    };
    socket.on('new_story_published', handleNewStory);
    return () => {
      socket.off('new_story_published', handleNewStory);
    };
  }, [socket]);

  const myStories = stories.filter(s => s.userId === user?.id);
  const otherStories = stories.filter(s => s.userId !== user?.id);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-6 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Status Stories</h2>
          <p className="text-xs text-gray-400">Updates disappear after 24 hours</p>
        </div>
        <button
          onClick={onOpenCreateStory}
          className="p-2.5 rounded-xl bg-liquid-accent/15 hover:bg-liquid-accent/25 text-liquid-accent border border-liquid-accent/30 flex items-center gap-1.5 text-xs font-semibold transition-all"
        >
          <Plus size={16} />
          <span>Add Story</span>
        </button>
      </div>

      {/* My Status Card */}
      <div className="bg-white/5 rounded-2xl p-3.5 border border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={onOpenCreateStory}
            className="relative w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary cursor-pointer hover:scale-105 transition-transform shrink-0"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-liquid-base">
              <img src={user?.avatar} alt="You" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-liquid-accent text-liquid-dark flex items-center justify-center border-2 border-liquid-base shadow-sm">
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white">My Status</h3>
            <p className="text-xs text-gray-400">
              {myStories.length > 0 ? `${myStories.length} active updates` : 'Tap to share a liquid update'}
            </p>
          </div>
        </div>

        {myStories.length > 0 && (
          <button 
            onClick={() => onSelectStory(stories.findIndex(s => s.userId === user?.id))}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium"
          >
            View
          </button>
        )}
      </div>

      {/* Recent Updates */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Recent Updates</span>

        {otherStories.length === 0 ? (
          <div className="p-8 text-center bg-white/5 rounded-2xl border border-white/5 text-gray-500 text-xs">
            No recent status updates from contacts
          </div>
        ) : (
          otherStories.map((story) => {
            const originalIndex = stories.findIndex(s => s.id === story.id);

            return (
              <motion.div
                key={story.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onSelectStory(originalIndex)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all"
              >
                <div className="w-13 h-13 rounded-full p-[2.5px] bg-gradient-to-tr from-liquid-accent via-cyan-400 to-purple-500 animate-pulse shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-liquid-base border border-liquid-base">
                    <img src={story.user?.avatar} alt={story.user?.username} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{story.user?.username}</h4>
                  <p className="text-xs text-gray-400 truncate">
                    {story.caption || 'Photo status'}
                  </p>
                </div>

                <span className="text-[10px] text-gray-500 font-mono">
                  {format(new Date(story.createdAt), 'hh:mm a')}
                </span>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

