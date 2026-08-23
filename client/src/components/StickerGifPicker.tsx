"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Smile, Image as ImageIcon, Flame, Heart, Laugh } from 'lucide-react';
import axios from 'axios';

interface StickerGifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (stickerUrl: string) => void;
  onSelectGif: (gifUrl: string) => void;
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥹', '😊', '😇', '🙂', '😉', '😍', '🥰', '😘', '😋', '😎', '🥳', '🤩'] },
  { name: 'Gestures', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '✋', '🤚', '👋', '👏', '🤝', '🙏', '💪'] },
  { name: 'Liquid & Nature', emojis: ['🌊', '💧', '💦', '🫧', '✨', '⚡', '🔥', '🌈', '☀️', '🌙', '⭐', '🌟', '❄️', '🏝️', '🚀', '🛸', '🎯', '🎉', '💡', '💎'] },
  { name: 'Reactions', emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '💯', '💥', '👀', '🧠', '👾', '🤖', '👑', '🏆', '🔥'] }
];

export default function StickerGifPicker({
  isOpen,
  onClose,
  onSelectSticker,
  onSelectGif,
  onSelectEmoji
}: StickerGifPickerProps) {
  const [activeTab, setActiveTab] = useState<'stickers' | 'gifs' | 'emojis'>('stickers');
  const [stickerPacks, setStickerPacks] = useState<any[]>([]);
  const [gifs, setGifs] = useState<any[]>([]);
  const [gifSearch, setGifSearch] = useState('');
  const [isLoadingGifs, setIsLoadingGifs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios.get('/api/stickers').then(res => {
        setStickerPacks(res.data.packs || []);
        setGifs(res.data.gifs || []);
      }).catch(() => {});
    }
  }, [isOpen]);

  const handleSearchGifs = async (q: string) => {
    setGifSearch(q);
    setIsLoadingGifs(true);
    try {
      const res = await axios.get(`/api/stickers/search-gifs?q=${encodeURIComponent(q)}`);
      setGifs(res.data);
    } catch (e) {} finally {
      setIsLoadingGifs(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 15, scale: 0.95 }}
      className="absolute bottom-20 left-6 sm:left-12 z-40 w-80 sm:w-96 bg-liquid-base/95 border border-white/15 rounded-3xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.7)] backdrop-blur-2xl flex flex-col gap-3"
    >
      {/* Tab Header */}
      <div className="flex items-center justify-between pb-2 border-b border-foreground/10">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('stickers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'stickers' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-sm' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Sparkles size={13} />
            <span>Stickers</span>
          </button>

          <button
            onClick={() => setActiveTab('gifs')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'gifs' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-sm' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <ImageIcon size={13} />
            <span>GIFs</span>
          </button>

          <button
            onClick={() => setActiveTab('emojis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'emojis' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-sm' : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            <Smile size={13} />
            <span>Emojis</span>
          </button>
        </div>

        <button onClick={onClose} className="text-foreground/60 hover:text-foreground text-xs p-1">
          ✕
        </button>
      </div>

      {/* Tab 1: STICKERS */}
      {activeTab === 'stickers' && (
        <div className="max-h-64 overflow-y-auto no-scrollbar space-y-3">
          {stickerPacks.map((pack, pIdx) => (
            <div key={pIdx} className="space-y-1.5">
              <span className="text-[11px] font-semibold text-foreground/60 block px-1">{pack.name}</span>
              <div className="grid grid-cols-3 gap-2">
                {pack.stickers.map((st: any) => (
                  <motion.div
                    key={st.id}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelectSticker(st.url);
                      onClose();
                    }}
                    className="aspect-square rounded-2xl bg-background/40 border border-foreground/10 p-2 flex flex-col items-center justify-center cursor-pointer hover:border-liquid-accent/50 group"
                  >
                    <img src={st.url} alt={st.name} className="w-14 h-14 object-cover rounded-xl" />
                    <span className="text-[10px] text-foreground/60 truncate mt-1">{st.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: GIFS */}
      {activeTab === 'gifs' && (
        <div className="space-y-2.5">
          <div className="h-9 bg-background/40 rounded-xl px-3 flex items-center gap-2 border border-foreground/10">
            <Search size={14} className="text-foreground/60" />
            <input
              type="text"
              value={gifSearch}
              onChange={(e) => handleSearchGifs(e.target.value)}
              placeholder="Search trending GIFs..."
              className="flex-1 bg-transparent border-none outline-none text-foreground text-xs placeholder-gray-500"
            />
          </div>

          <div className="max-h-60 overflow-y-auto no-scrollbar grid grid-cols-2 gap-2">
            {gifs.map((g) => (
              <motion.div
                key={g.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  onSelectGif(g.url);
                  onClose();
                }}
                className="rounded-xl overflow-hidden bg-background/40 border border-foreground/10 aspect-video cursor-pointer"
              >
                <img src={g.url} alt={g.title} className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: EMOJIS */}
      {activeTab === 'emojis' && (
        <div className="max-h-64 overflow-y-auto no-scrollbar space-y-2">
          {EMOJI_CATEGORIES.map((cat, cIdx) => (
            <div key={cIdx}>
              <span className="text-[10px] text-foreground/60 font-semibold uppercase tracking-wider block mb-1">{cat.name}</span>
              <div className="grid grid-cols-6 sm:grid-cols-7 gap-1">
                {cat.emojis.map((em, eIdx) => (
                  <button
                    key={eIdx}
                    onClick={() => {
                      onSelectEmoji(em);
                      onClose();
                    }}
                    className="p-1.5 text-xl hover:bg-foreground/10 rounded-xl transition-transform hover:scale-125 flex items-center justify-center"
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

