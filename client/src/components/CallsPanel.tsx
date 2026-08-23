"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, Video, PhoneIncoming, PhoneOutgoing, 
  PhoneMissed, Plus, Clock, Search 
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';

interface CallsPanelProps {
  onStartCallWithUser: (user: any, isVideo: boolean) => void;
  users: any[];
}

export default function CallsPanel({ onStartCallWithUser, users }: CallsPanelProps) {
  const { user, token } = useAuthStore();
  const [callHistory, setCallHistory] = useState<any[]>([]);
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchCallHistory = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/calls/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCallHistory(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchCallHistory();
  }, [token]);

  const filteredHistory = callHistory.filter(call => {
    const otherUser = call.callerId === user?.id ? call.receiver : call.caller;
    return otherUser?.username?.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto p-4 space-y-4 no-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Call Logs</h2>
          <p className="text-xs text-foreground/60">Recent voice and video calls</p>
        </div>

        <button
          onClick={() => setIsNewCallModalOpen(true)}
          className="p-2.5 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-foreground font-semibold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:brightness-110 transition-all"
        >
          <Plus size={16} />
          <span>New Call</span>
        </button>
      </div>

      {/* Call History Search */}
      <div className="h-10 bg-background/30 rounded-xl px-3 flex items-center gap-2.5 border border-foreground/5 focus-within:border-liquid-accent/50 transition-colors">
        <Search size={16} className="text-foreground/60" />
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search calls..."
          className="flex-1 bg-transparent border-none outline-none text-foreground text-xs placeholder-gray-500"
        />
      </div>

      {/* Call History List */}
      <div className="space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="p-8 text-center bg-foreground/5 rounded-2xl border border-foreground/5 text-foreground/50 text-xs">
            No call records found. Click "New Call" to start a call!
          </div>
        ) : (
          filteredHistory.map((call) => {
            const isOutgoing = call.callerId === user?.id;
            const otherPerson = isOutgoing ? call.receiver : call.caller;
            const isVideo = call.type === 'video';
            const isMissed = call.status === 'missed' || call.status === 'rejected';

            return (
              <motion.div
                key={call.id}
                whileHover={{ scale: 1.01 }}
                className="flex items-center justify-between p-3 rounded-2xl bg-foreground/5 hover:bg-foreground/10 border border-foreground/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden p-[2px] bg-gradient-to-tr from-liquid-accent to-liquid-secondary shrink-0">
                    <img src={otherPerson?.avatar} alt={otherPerson?.username} className="w-full h-full rounded-full object-cover bg-liquid-base" />
                  </div>

                  <div>
                    <h4 className={`text-sm font-semibold ${isMissed && !isOutgoing ? 'text-red-400' : 'text-foreground'}`}>
                      {otherPerson?.username}
                    </h4>

                    <div className="flex items-center gap-1.5 text-[11px] text-foreground/60 mt-0.5">
                      {isOutgoing ? (
                        <PhoneOutgoing size={12} className="text-liquid-accent" />
                      ) : isMissed ? (
                        <PhoneMissed size={12} className="text-red-400" />
                      ) : (
                        <PhoneIncoming size={12} className="text-green-400" />
                      )}
                      <span>{format(new Date(call.createdAt), 'MMM dd, hh:mm a')}</span>
                      {call.duration > 0 && (
                        <span className="font-mono text-[10px] text-foreground/50">
                          ({Math.floor(call.duration / 60)}m {call.duration % 60}s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* One-Tap Call Back Action */}
                <button
                  onClick={() => onStartCallWithUser(otherPerson, isVideo)}
                  className="p-2.5 rounded-full bg-foreground/10 hover:bg-liquid-accent/20 text-foreground/80 hover:text-liquid-accent transition-all"
                  title={`Call back with ${isVideo ? 'Video' : 'Audio'}`}
                >
                  {isVideo ? <Video size={18} /> : <Phone size={18} />}
                </button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* New Call User Selector Modal */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4">
          <div className="w-full max-w-md bg-liquid-base/95 border border-foreground/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-foreground/5">
              <h3 className="text-lg font-bold text-foreground">Start a New Call</h3>
              <button onClick={() => setIsNewCallModalOpen(false)} className="text-foreground/60 hover:text-foreground">
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 no-scrollbar">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-foreground/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-liquid-accent/30">
                      <img src={u.avatar} alt={u.username} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{u.username}</h4>
                      <p className="text-xs text-foreground/60 truncate max-w-[160px]">{u.about || 'Liquid user'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsNewCallModalOpen(false);
                        onStartCallWithUser(u, false);
                      }}
                      className="p-2 rounded-full bg-foreground/10 hover:bg-green-500/20 text-foreground/80 hover:text-green-400"
                      title="Voice Call"
                    >
                      <Phone size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setIsNewCallModalOpen(false);
                        onStartCallWithUser(u, true);
                      }}
                      className="p-2 rounded-full bg-foreground/10 hover:bg-liquid-accent/20 text-foreground/80 hover:text-liquid-accent"
                      title="Video Call"
                    >
                      <Video size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

