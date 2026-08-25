"use client";

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sparkles, Image as ImageIcon, Clock, Eye, Trash2, X, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { format } from 'date-fns';
import { resolveMediaUrl } from '@/utils/apiUrl';

export default function StoriesPanel({ onOpenCreateStory, onSelectStory }: { onOpenCreateStory: () => void; onSelectStory: (index: number) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    if (activeStoryIndex !== null && activeStoryIndex < stories.length - 1) {
      setActiveStoryIndex(activeStoryIndex + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex !== null && activeStoryIndex > 0) {
      setActiveStoryIndex(activeStoryIndex - 1);
    }
  };

  const handleCreateStory = async () => {
    if (!token || (!newFile && !newCaption.trim())) return;
    setIsUploading(true);

    try {
      let mediaUrl = '';
      let type = 'text';

      if (newFile) {
        const formData = new FormData();
        formData.append('file', newFile);
        const res = await axios.post('/api/upload', formData);
        mediaUrl = res.data.fileUrl;
        type = res.data.type;
      }

      const res = await axios.post('/api/stories', {
        mediaUrl,
        caption: newCaption,
        type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      socket?.emit('publish_story', res.data);
      setIsAddModalOpen(false);
      setNewCaption('');
      setNewFile(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUploading(false);
    }
  };

  const currentStory = activeStoryIndex !== null ? stories[activeStoryIndex] : null;

  useEffect(() => {
    if (currentStory && currentStory.user?.id !== user?.id && token) {
      axios.post(`/api/stories/${currentStory.id}/view`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(console.error);
    }
  }, [currentStory, user?.id, token]);


  const fetchStories = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/stories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(res.data);
    } catch (e) {}
  };

  const handleDeleteStory = async (storyId: string) => {
    if (!token) return;
    try {
      await axios.delete(`/api/stories/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStories(prev => prev.filter(s => s.id !== storyId));
      if (activeStoryIndex !== null) {
        if (stories.length <= 1) {
          setActiveStoryIndex(null);
        } else {
          setActiveStoryIndex(activeStoryIndex === stories.length - 1 ? activeStoryIndex - 1 : activeStoryIndex);
        }
      }
    } catch (e) {
      console.error(e);
    }
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
          <h2 className="text-lg font-bold text-foreground">Status Stories</h2>
          <p className="text-xs text-foreground/60">Updates disappear after 24 hours</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2.5 rounded-xl bg-liquid-accent/15 hover:bg-liquid-accent/25 text-liquid-accent border border-liquid-accent/30 flex items-center gap-1.5 text-xs font-semibold transition-all"
        >
          <Plus size={16} />
          <span>Add Story</span>
        </button>
      </div>

      {/* My Status Card */}
      <div className="bg-foreground/5 rounded-2xl p-3.5 border border-foreground/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => setIsAddModalOpen(true)}
            className="relative w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary cursor-pointer hover:scale-105 transition-transform shrink-0"
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-liquid-base">
              <img src={user?.avatar} alt="You" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-liquid-accent text-liquid-dark flex items-center justify-center border-2 border-liquid-base shadow-sm">
              <Plus size={12} strokeWidth={3} />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">My Status</h3>
            <p className="text-xs text-foreground/60">
              {myStories.length > 0 ? `${myStories.length} active updates` : 'Tap to share a liquid update'}
            </p>
          </div>
        </div>

        {myStories.length > 0 && (
          <button 
            onClick={() => setActiveStoryIndex(stories.findIndex(s => s.userId === user?.id))}
            className="px-3 py-1.5 rounded-lg bg-foreground/10 hover:bg-foreground/20 text-foreground text-xs font-medium"
          >
            View
          </button>
        )}
      </div>

      {/* Recent Updates */}
      <div className="space-y-2.5">
        <span className="text-xs font-semibold text-foreground/60 uppercase tracking-wider px-1">Recent Updates</span>

        {otherStories.length === 0 ? (
          <div className="p-8 text-center bg-foreground/5 rounded-2xl border border-foreground/5 text-foreground/50 text-xs">
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
                onClick={() => setActiveStoryIndex(originalIndex)}
                className="flex items-center gap-3.5 p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 cursor-pointer transition-all"
              >
                <div className="w-14 h-14 rounded-full p-[2.5px] bg-gradient-to-tr from-liquid-accent via-cyan-400 to-purple-500 animate-pulse shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-liquid-base border border-liquid-base">
                    <img src={story.user?.avatar} alt={story.user?.username} className="w-full h-full object-cover" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-foreground truncate">{story.user?.username}</h4>
                  <p className="text-xs text-foreground/60 truncate">
                    {story.caption || 'Photo status'}
                  </p>
                </div>

                <span className="text-[10px] text-foreground/50 font-mono">
                  {format(new Date(story.createdAt), 'EEEE, h:mm a')}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {mounted && createPortal(
        <>
          {/* Story Creation Modal */}
          <AnimatePresence>
            {isAddModalOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
          >
            <div className="w-full max-w-md bg-liquid-base/95 border border-foreground/10 rounded-3xl p-6 shadow-2xl relative flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-foreground">Create Status Update</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-foreground/60 hover:text-foreground">
                  <X size={20} />
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setNewFile(e.target.files?.[0] || null)}
              />

              {newFile ? (
                <div className="relative h-48 rounded-2xl overflow-hidden bg-background/40 border border-foreground/10">
                  {newFile.type.startsWith('video/') ? (
                    <video src={URL.createObjectURL(newFile)} controls playsInline className="w-full h-full object-contain" />
                  ) : (
                    <img src={URL.createObjectURL(newFile)} alt="Preview" className="w-full h-full object-contain" />
                  )}
                  <button
                    onClick={() => setNewFile(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-background/60 text-foreground hover:bg-background"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="h-32 rounded-2xl border-2 border-dashed border-foreground/10 hover:border-liquid-accent/50 flex flex-col items-center justify-center text-foreground/60 hover:text-liquid-accent transition-all gap-2 bg-foreground/5"
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
                className="h-12 bg-background/40 rounded-xl px-4 text-foreground placeholder-gray-500 border border-foreground/5 outline-none focus:border-liquid-accent/50 text-sm"
              />

              <button
                onClick={handleCreateStory}
                disabled={isUploading}
                className="h-12 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-foreground font-semibold flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,210,255,0.4)] hover:brightness-110 transition-all disabled:opacity-50"
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-2xl p-4 select-none"
          >
            <div className="relative w-full max-w-lg h-[90vh] bg-liquid-base/90 rounded-3xl overflow-hidden border border-foreground/10 shadow-[0_0_60px_rgba(0,210,255,0.2)] flex flex-col justify-between p-6">
              {/* Progress Bars */}
              <div className="absolute top-4 left-6 right-6 flex gap-1 z-30">
                <div className="flex-1 h-1 bg-foreground/20 rounded-full overflow-hidden">
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
                    <h4 className="text-foreground font-semibold text-sm">{currentStory.user?.username}</h4>
                    <span className="text-[11px] text-foreground/60">24h Status</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {(currentStory.userId === user?.id || currentStory.user?.id === user?.id) && (
                    <button
                      onClick={() => handleDeleteStory(currentStory.id)}
                      className="p-2 text-rose-400 hover:text-rose-500 rounded-full hover:bg-rose-500/10 transition-colors"
                      title="Delete Status"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button
                    onClick={() => setActiveStoryIndex(null)}
                    className="p-2 text-foreground/60 hover:text-foreground rounded-full hover:bg-foreground/10"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Story Media / Content */}
              <div className="flex-1 relative flex items-center justify-center my-4 overflow-hidden rounded-2xl">
                {currentStory.mediaUrl ? (
                  currentStory.type === 'video' ? (
                    <video src={resolveMediaUrl(currentStory.mediaUrl)} autoPlay playsInline controls className="max-w-full max-h-full object-contain rounded-xl" />
                  ) : (
                    <img src={resolveMediaUrl(currentStory.mediaUrl)} alt="Story" className="max-w-full max-h-full object-contain rounded-xl" />
                  )
                ) : (
                  <div className="text-center p-8">
                    <p className="text-2xl font-semibold text-foreground leading-relaxed">{currentStory.caption}</p>
                  </div>
                )}

                {/* Left/Right Click Nav */}
                <button
                  onClick={handlePrevStory}
                  className="absolute left-2 p-2 rounded-full bg-background/40 text-foreground hover:bg-background/80"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={handleNextStory}
                  className="absolute right-2 p-2 rounded-full bg-background/40 text-foreground hover:bg-background/80"
                >
                  <ChevronRight size={24} />
                </button>
              </div>

              {/* Story Caption (if media) */}
              {currentStory.mediaUrl && currentStory.caption && (
                <div className="p-4 bg-background/50 rounded-xl backdrop-blur-md text-center text-sm text-foreground z-30">
                  {currentStory.caption}
                </div>
              )}

              {/* Viewers List (only for the creator) */}
              {(currentStory.userId === user?.id || currentStory.user?.id === user?.id) && (
                <div className="flex flex-col items-center gap-1 mt-2 mb-2 pb-2 z-30 overflow-y-auto max-h-32 hide-scrollbar">
                  <div className="flex items-center gap-1 text-foreground/70 text-xs font-semibold uppercase tracking-widest mb-1 bg-background/40 px-3 py-1 rounded-full backdrop-blur-md">
                    <Eye size={14} /> Views
                  </div>
                  {(() => {
                    try {
                      const views = JSON.parse(currentStory.views || '[]');
                      if (views.length === 0) return <span className="text-xs text-foreground/50 bg-background/40 px-3 py-1 rounded-full">No views yet</span>;
                      return (
                        <div className="flex flex-wrap justify-center gap-2">
                          {views.map((v: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full border border-foreground/10 shadow-sm">
                              <img src={v.avatar} className="w-5 h-5 rounded-full object-cover bg-liquid-base" />
                              <span className="text-xs font-medium text-foreground">{v.username}</span>
                            </div>
                          ))}
                        </div>
                      );
                    } catch(e) { return null; }
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </>, document.body)}
    </div>
  );
}

