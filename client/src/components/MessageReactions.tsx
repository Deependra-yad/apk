"use client";

import { motion } from 'framer-motion';

const EMOJIS = ['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥'];

interface MessageReactionsProps {
  onSelectEmoji: (emoji: string) => void;
  onClose: () => void;
}

export default function MessageReactions({ onSelectEmoji, onClose }: MessageReactionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="absolute -top-12 left-2 z-30 flex items-center gap-1.5 bg-liquid-base/95 backdrop-blur-xl px-3 py-1.5 rounded-full border border-white/15 shadow-[0_0_25px_rgba(0,0,0,0.6)]"
      onClick={(e) => e.stopPropagation()}
    >
      {EMOJIS.map((emoji, idx) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.35, y: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          onClick={() => {
            onSelectEmoji(emoji);
            onClose();
          }}
          className="text-lg hover:brightness-125 transition-all p-1 cursor-pointer"
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
}

export function ReactionBadges({ 
  reactions, 
  onReact, 
  currentUserId 
}: { 
  reactions?: string; 
  onReact: (emoji: string) => void; 
  currentUserId?: string; 
}) {
  if (!reactions) return null;
  let parsed: Array<{ userId: string; emoji: string }> = [];
  try {
    parsed = JSON.parse(reactions);
  } catch (e) {
    return null;
  }

  if (!parsed || parsed.length === 0) return null;

  // Group by emoji
  const counts = parsed.reduce((acc: Record<string, number>, curr) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {});

  const hasMyReaction = parsed.some(r => r.userId === currentUserId);

  return (
    <div className="flex items-center gap-1 mt-1 -mb-1 flex-wrap">
      {Object.entries(counts).map(([emoji, count]) => (
        <button
          key={emoji}
          onClick={() => onReact(emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-md border transition-all ${
            hasMyReaction
              ? 'bg-liquid-accent/20 border-liquid-accent/40 text-liquid-accent shadow-[0_0_10px_rgba(0,210,255,0.2)]'
              : 'bg-foreground/10 border-foreground/10 text-foreground/90 hover:bg-foreground/20'
          }`}
        >
          <span>{emoji}</span>
          {count > 1 && <span className="text-[10px] font-bold">{count}</span>}
        </button>
      ))}
    </div>
  );
}

