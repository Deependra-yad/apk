"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Image as ImageIcon, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';

export default function StatusStoriesBar() {
  const { user, token } = useAuthStore();
  const { socket } = useChatStore();

  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newFile, setNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storyProgress, setStoryProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const storyTimerRef = useRef<any>(null);

  // Fetch stories
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

  // Listen for new story broadcasts
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

  // Story Viewer Timer Progress
  useEffect(() => {
    if (activeStoryIndex !== null) {
      setStoryProgress(0);
      const interval = setInterval(() => {
        setStoryProgress(p => {
          if (p >= 100) {
            handleNextStory();
            return 0;
          }
          return p + 2;
        });
      }, 100);
      storyTimerRef.current = interval;
      return () => clearInterval(interval);
    }
  }, [activeStoryIndex]);

  const handleNextStory = () => {
    if (activeStoryIndex !== null) {
      if (activeStoryIndex < stories.length - 1) {
        setActiveStoryIndex(activeStoryIndex + 1);
      } else {
        setActiveStoryIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const handleCreateStory = async () => {
    if ((!newFile && !newCaption.trim()) || !token) return;
    setIsUploading(true);
    try {
      let mediaUrl = null;
      if (newFile) {
        const formData = new FormData();
        formData.append('file', newFile);
        const uploadRes = await axios.post('/api/upload', formData);
        mediaUrl = uploadRes.data.fileUrl;
      }

      const res = await axios.post('/api/stories', {
        mediaUrl,
        caption: newCaption,
        type: newFile ? 'image' : 'text'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socket?.emit('publish_story', res.data);
      setStories(prev => [res.data, ...prev]);
      setIsAddModalOpen(false);
      setNewFile(null);
      setNewCaption('');
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  return (
    <>
      {/* Horizontal Liquid Stories Feed */}
      <div className="h-24 px-4 py-2 border-b border-white/5 bg-liquid-base/20 flex items-center gap-3 overflow-x-auto no-scrollbar">
        {/* My Status / Add Button */}
        <div 
          onClick={() => setIsAddModalOpen(true)}
          className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
        >
          <div className="relative w-13 h-13 rounded-full p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary">
            <div className="w-full h-full rounded-full overflow-hidden bg-liquid-base">
              <img src={user?.avatar} alt="You" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-liquid-accent text-liquid-dark flex items-center justify-center border-2 border-liquid-base shadow-sm">
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>
          <span className="text-[11px] text-gray-300 font-medium truncate max-w-[56px]">Your Story</span>
        </div>

        {/* Stories from Contacts */}
        {stories.map((story, idx) => (
          <div
            key={story.id}
            onClick={() => setActiveStoryIndex(idx)}
            className="flex flex-col items-center gap-1 cursor-pointer shrink-0 group"
          >
            <div className="relative w-13 h-13 rounded-full p-[2.5px] bg-gradient-to-tr from-liquid-accent via-cyan-400 to-liquid-secondary animate-pulse">
              <div className="w-full h-full rounded-full overflow-hidden bg-liquid-base border border-liquid-base">
                <img src={story.user?.avatar} alt={story.user?.username} className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[11px] text-gray-300 font-medium truncate max-w-[56px]">
              {story.user?.username}
            </span>
          </div>
        ))}
      </div>

      {/* Story Creation Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
          >
            <div className="w-full max-w-md bg-liquid-base/95 border border-white/10 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Create Status Update</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
              />

              {newFile ? (
                <div className="relative h-48 rounded-2xl overflow-hidden bg-black/40 border border-white/10">
                  <img src={URL.createObjectURL(newFile)} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    onClick={() => setNewFile(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-2xl border-2 border-dashed border-white/10 hover:border-liquid-accent/50 flex flex-col items-center justify-center text-gray-400 hover:text-liquid-accent transition-all gap-2 bg-white/5"
                >
                  <ImageIcon size={28} />
                  <span className="text-xs font-medium">Add Photo / Video</span>
                </button>
              )}

              <input
                type="text"
                value={newCaption}
                onChange={(e) => setNewCaption(e.target.value)}
                placeholder="Add a liquid caption..."
                className="h-12 bg-black/40 rounded-xl px-4 text-white placeholder-gray-500 border border-white/5 outline-none focus:border-liquid-accent/50 text-sm"
              />

              <button
                onClick={handleCreateStory}
                disabled={isUploading}
                className="h-12 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all disabled:opacity-50"
              >
                <Send size={18} />
                <span>{isUploading ? 'Posting...' : 'Share Status'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Story Viewer */}
      <AnimatePresence>
        {currentStory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 select-none"
          >
            <div className="relative w-full max-w-lg h-[90vh] bg-liquid-base/90 rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_60px_rgba(0,210,255,0.2)] flex flex-col justify-between p-6">
              {/* Progress Bars */}
              <div className="absolute top-4 left-6 right-6 flex gap-1 z-30">
                <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-liquid-accent rounded-full transition-all duration-100 ease-linear"
                    style={{ width: `${storyProgress}%` }}
                  />
                </div>
              </div>

              {/* Story Header */}
              <div className="flex items-center justify-between z-30 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-liquid-accent">
                    <img src={currentStory.user?.avatar} alt={currentStory.user?.username} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold text-sm">{currentStory.user?.username}</h4>
                    <span className="text-[11px] text-gray-400">24h Status</span>
                  </div>
                </div>
                <button
                  onClick={() => setActiveStoryIndex(null)}
                  className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Story Media / Content */}
              <div className="flex-1 relative flex items-center justify-center my-4 overflow-hidden rounded-2xl">
                {currentStory.mediaUrl ? (
                  <img src={currentStory.mediaUrl} alt="Story" className="max-w-full max-h-full object-contain rounded-xl" />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-2xl font-semibold text-white leading-relaxed">{currentStory.caption}</p>
                  </div>
                )}

                {/* Left/Right Click Nav */}
                <button
                  onClick={handlePrevStory}
                  className="absolute left-2 p-2 rounded-full bg-black/40 text-white hover:bg-black/80"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNextStory}
                  className="absolute right-2 p-2 rounded-full bg-black/40 text-white hover:bg-black/80"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Story Caption (if media) */}
              {currentStory.mediaUrl && currentStory.caption && (
                <div className="p-4 bg-black/50 rounded-xl backdrop-blur-md text-center text-sm text-white z-30">
                  {currentStory.caption}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

