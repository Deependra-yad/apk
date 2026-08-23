"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

export default function NotificationToast() {
  const { incomingToast, setIncomingToast, setActiveContact, setActiveGroup, groups, users } = useChatStore() as any;

  if (!incomingToast) return null;

  const handleClick = () => {
    if (incomingToast.groupId) {
      const g = groups.find((grp: any) => grp.id === incomingToast.groupId);
      if (g) setActiveGroup(g);
    } else if (incomingToast.sender) {
      setActiveContact(incomingToast.sender);
    }
    setIncomingToast(null);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.9 }}
        onClick={handleClick}
        className="fixed top-4 right-4 z-50 max-w-sm w-full bg-liquid-base/95 border border-liquid-accent/40 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,210,255,0.35)] backdrop-blur-2xl cursor-pointer flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary">
              <img
                src={incomingToast.sender?.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=U`}
                alt="Sender"
                className="w-full h-full rounded-full object-cover bg-liquid-base"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1 bg-liquid-accent text-liquid-dark rounded-full shadow-sm">
              <MessageSquare size={10} />
            </div>
          </div>

          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-foreground truncate">
              {incomingToast.groupName ? `${incomingToast.groupName} • ${incomingToast.sender?.username}` : incomingToast.sender?.username}
            </h4>
            <p className="text-xs text-foreground/80 truncate mt-0.5">
              {incomingToast.text || (incomingToast.type === 'image' ? '📷 Photo' : incomingToast.type === 'video' ? '🎥 Video' : incomingToast.type === 'audio' ? '🎵 Voice Note' : incomingToast.fileName || 'Attachment')}
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIncomingToast(null);
          }}
          className="p-1.5 text-foreground/60 hover:text-foreground rounded-lg hover:bg-foreground/10 shrink-0"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

