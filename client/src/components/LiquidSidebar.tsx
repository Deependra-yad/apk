"use client";

import { motion } from 'framer-motion';
import { 
  MessageSquare, CircleDashed, Phone, 
  Settings, User, Sparkles, Star, Bot 
} from 'lucide-react';

interface LiquidSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenProfile: () => void;
  isChatActive?: boolean;
}

export default function LiquidSidebar({ activeTab, setActiveTab, onOpenProfile, isChatActive }: LiquidSidebarProps) {
  const tabs = [
    { id: 'chat', label: 'Chats', icon: MessageSquare },
    { id: 'stories', label: 'Stories', icon: CircleDashed },
    { id: 'calls', label: 'Calls', icon: Phone },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden sm:flex w-20 h-full bg-liquid-base/60 border-r border-white/5 flex-col items-center justify-between py-6 backdrop-blur-2xl z-30 shrink-0">
        {/* Brand Liquid Icon */}
        <motion.div 
          whileHover={{ scale: 1.15, rotate: 10 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab('chat')}
          className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-liquid-accent to-liquid-secondary flex items-center justify-center shadow-[0_0_25px_rgba(0,210,255,0.5)] cursor-pointer"
          title="Liquid Chat"
        >
          <Sparkles className="text-white" size={24} />
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex flex-col gap-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setActiveTab(tab.id)}
                className={`relative p-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'text-white bg-liquid-accent/20 border border-liquid-accent/40 shadow-[0_0_20px_rgba(0,210,255,0.3)]'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
                title={tab.label}
              >
                <Icon size={22} className={tab.id === 'starred' && isActive ? "text-yellow-400 fill-yellow-400" : ""} />
                {isActive && (
                  <motion.div
                    layoutId="activeLiquidIndicator"
                    className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-liquid-accent rounded-r-full shadow-[0_0_10px_rgba(0,210,255,0.8)]"
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Profile Avatar Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onOpenProfile}
          className="p-3 rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          title="Your Profile"
        >
          <User size={22} />
        </motion.button>
      </div>

      {/* Mobile Bottom Navigation Bar (Hidden when actively inside a chat conversation) */}
      {!isChatActive && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 h-16 bg-liquid-base/95 border-t border-white/10 flex items-center justify-around px-2 z-40 backdrop-blur-2xl pb-safe">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                  isActive ? 'text-liquid-accent' : 'text-gray-400'
                }`}
              >
                <Icon size={18} className={tab.id === 'starred' && isActive ? "text-yellow-400 fill-yellow-400" : ""} />
                <span className="text-[9px] font-medium mt-0.5">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
