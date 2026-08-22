"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Image as ImageIcon, FileText, Music, Link2, 
  Star, Download, ExternalLink, Eye, Play, Pause, FileSpreadsheet 
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { resolveMediaUrl } from '@/utils/apiUrl';

interface MediaGalleryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
}

export default function MediaGalleryDrawer({ isOpen, onClose, targetId, targetName }: MediaGalleryDrawerProps) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'media' | 'docs' | 'audio' | 'links' | 'starred'>('media');
  const [data, setData] = useState<{
    media: any[];
    docs: any[];
    audio: any[];
    links: any[];
    starred: any[];
    totalCount: number;
  }>({
    media: [],
    docs: [],
    audio: [],
    links: [],
    starred: [],
    totalCount: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token && targetId) {
      setIsLoading(true);
      axios.get(`/api/media/gallery/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setData(res.data);
      }).catch(() => {}).finally(() => {
        setIsLoading(false);
      });
    }
  }, [isOpen, token, targetId]);

  if (!isOpen) return null;

  const handleExportChat = () => {
    if (!token || !targetId) return;
    window.open(`/api/media/export/${targetId}`, '_blank');
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
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold text-white">Media, Links & Docs</h3>
                <p className="text-xs text-gray-400">{targetName} • {data.totalCount} items</p>
              </div>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
                <X size={20} />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="grid grid-cols-5 gap-1 bg-black/40 p-1 rounded-2xl border border-white/5">
              <button
                onClick={() => setActiveTab('media')}
                className={`py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'media' ? 'bg-liquid-accent text-liquid-dark font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon size={14} />
                <span>Media ({data.media.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'docs' ? 'bg-liquid-accent text-liquid-dark font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <FileText size={14} />
                <span>Docs ({data.docs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('audio')}
                className={`py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'audio' ? 'bg-liquid-accent text-liquid-dark font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Music size={14} />
                <span>Audio ({data.audio.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('links')}
                className={`py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'links' ? 'bg-liquid-accent text-liquid-dark font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Link2 size={14} />
                <span>Links ({data.links.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('starred')}
                className={`py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                  activeTab === 'starred' ? 'bg-liquid-accent text-liquid-dark font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Star size={14} />
                <span>Starred ({data.starred.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
              {/* 1. MEDIA TAB (Grid) */}
              {activeTab === 'media' && (
                data.media.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No shared photos or videos</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {data.media.map((item) => (
                      <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 group">
                        {item.type === 'video' ? (
                          <video src={resolveMediaUrl(item.fileUrl)} className="w-full h-full object-cover" />
                        ) : (
                          <img src={resolveMediaUrl(item.fileUrl)} alt="media" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        )}
                        <a
                          href={resolveMediaUrl(item.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* 2. DOCS TAB */}
              {activeTab === 'docs' && (
                data.docs.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No shared documents</p>
                ) : (
                  <div className="space-y-2">
                    {data.docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                            <FileText size={18} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold text-white truncate">{doc.fileName || 'Document'}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{doc.fileSize || 'File'} • {format(new Date(doc.createdAt), 'MMM dd')}</p>
                          </div>
                        </div>

                        <a
                          href={resolveMediaUrl(doc.fileUrl)}
                          download={doc.fileName}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-lg bg-white/10 hover:bg-liquid-accent/20 text-gray-300 hover:text-liquid-accent"
                        >
                          <Download size={14} />
                        </a>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* 3. AUDIO TAB */}
              {activeTab === 'audio' && (
                data.audio.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No voice notes recorded</p>
                ) : (
                  <div className="space-y-2">
                    {data.audio.map((aud) => (
                      <div key={aud.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400">
                            <Music size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-white">Voice Message ({aud.duration || 0}s)</p>
                            <p className="text-[10px] text-gray-400 font-mono">{format(new Date(aud.createdAt), 'MMM dd, hh:mm a')}</p>
                          </div>
                        </div>

                        <audio src={resolveMediaUrl(aud.fileUrl)} controls className="h-8 max-w-[130px]" />
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* 4. LINKS TAB */}
              {activeTab === 'links' && (
                data.links.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No web links shared</p>
                ) : (
                  <div className="space-y-2">
                    {data.links.map((lnk) => (
                      <div key={lnk.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                        <div className="flex items-center gap-2 text-liquid-accent text-xs font-semibold">
                          <Link2 size={14} />
                          <span className="truncate">{lnk.text}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono">{format(new Date(lnk.createdAt), 'MMM dd, yyyy')}</p>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* 5. STARRED TAB */}
              {activeTab === 'starred' && (
                data.starred.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-10">No starred messages in this chat</p>
                ) : (
                  <div className="space-y-2">
                    {data.starred.map((starMsg) => (
                      <div key={starMsg.id} className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] text-yellow-300 font-semibold">
                          <span>{starMsg.sender.username}</span>
                          <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        </div>
                        <p className="text-xs text-white leading-relaxed">{starMsg.text || `[Attachment: ${starMsg.fileName || starMsg.type}]`}</p>
                        <p className="text-[9px] text-gray-400 font-mono">{format(new Date(starMsg.createdAt), 'MMM dd, hh:mm a')}</p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Export Chat History Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleExportChat}
              className="w-full h-11 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-white/5"
            >
              <Download size={16} />
              <span>Export Conversation (.TXT)</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

