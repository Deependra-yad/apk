"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, ExternalLink, Copy, Check, Eye, Code, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { downloadFile } from '@/utils/apiUrl';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  mimeType?: string;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileSize,
  mimeType
}: DocumentViewerModalProps) {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDownloading, setIsDownloading] = useState(false);
  const isAndroid = typeof window !== 'undefined' && !!(window as any).Android;

  const cleanName = fileName?.toLowerCase() || '';
  const isPdf = cleanName.endsWith('.pdf') || mimeType?.includes('pdf');
  const isImage = cleanName.match(/\.(png|jpe?g|gif|webp|svg|bmp|ico)$/i) || mimeType?.startsWith('image/');
  const isVideo = cleanName.match(/\.(mp4|webm|mov|mkv)$/i) || mimeType?.startsWith('video/');
  const isAudio = cleanName.match(/\.(mp3|wav|ogg|m4a|aac)$/i) || mimeType?.startsWith('audio/');
  const isOfficeDoc = cleanName.match(/\.(docx?|xlsx?|pptx?|odt|ods|odp)$/i);
  const isTextOrCode = cleanName.match(/\.(txt|json|js|ts|jsx|tsx|py|html|css|md|c|cpp|java|go|rs|sql|sh|log|xml|yaml|yml|ini|env)$/i) || mimeType?.startsWith('text/');

  // Auto-fetch text or code files
  useEffect(() => {
    if (!isOpen || !fileUrl) return;

    if (isTextOrCode) {
      setIsTextLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('liquid_token') : null;
      const headers: Record<string, string> = {};
      if (token && !fileUrl.startsWith('data:') && !fileUrl.startsWith('blob:')) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(fileUrl, { headers })
        .then(res => res.text())
        .then(txt => {
          setTextContent(txt);
          setIsTextLoading(false);
        })
        .catch(err => {
          console.warn("Failed to load text content:", err);
          setIsTextLoading(false);
          setTextContent(null);
        });
    } else {
      setTextContent(null);
    }
  }, [isOpen, fileUrl, isTextOrCode]);

  const handleNativeAndroidPreview = () => {
    if (typeof window !== 'undefined' && (window as any).Android?.previewFile) {
      (window as any).Android.previewFile(fileUrl, fileName, mimeType || '');
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    downloadFile(fileUrl, fileName);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  const handleCopyCode = () => {
    if (!textContent) return;
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const gdocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.94, y: 15 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.94, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl h-[88vh] bg-[#0c0d14] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-white/[0.03] backdrop-blur-md">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 rounded-xl bg-liquid-accent/15 text-liquid-accent shrink-0">
                {isTextOrCode ? <Code size={18} /> : <FileText size={18} />}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-semibold text-white truncate max-w-xs sm:max-w-md">{fileName}</h3>
                <span className="text-[11px] text-white/50 font-mono">{fileSize || 'Attachment'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {isAndroid && (
                <button
                  onClick={handleNativeAndroidPreview}
                  className="px-3 py-2 rounded-xl bg-liquid-accent/20 hover:bg-liquid-accent/30 text-liquid-accent text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Open in Native App"
                >
                  <ExternalLink size={14} />
                  <span className="hidden sm:inline">Open in App</span>
                </button>
              )}

              {textContent && (
                <button
                  onClick={handleCopyCode}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}

              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-black text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:brightness-110 transition-all cursor-pointer disabled:opacity-70"
              >
                <Download size={14} className={isDownloading ? 'animate-bounce' : ''} />
                <span className="hidden sm:inline">{isDownloading ? 'Saving...' : 'Download'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-white/60 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="flex-1 w-full h-full overflow-hidden bg-black/40 relative flex items-center justify-center">
            {isImage ? (
              <div className="relative w-full h-full flex items-center justify-center p-4 overflow-auto">
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md rounded-xl p-1 border border-white/10">
                  <button 
                    onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                    className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <button 
                    onClick={() => setZoom(1)}
                    className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                    title="Reset Zoom"
                  >
                    <RotateCcw size={14} />
                  </button>
                  <button 
                    onClick={() => setZoom(z => Math.min(3, z + 0.25))}
                    className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
                <img
                  src={fileUrl}
                  alt={fileName}
                  style={{ transform: `scale(${zoom})`, transition: 'transform 0.15s ease-out' }}
                  className="max-w-full max-h-full object-contain select-none rounded-lg"
                />
              </div>
            ) : isVideo ? (
              <div className="w-full h-full flex items-center justify-center p-4">
                <video
                  src={fileUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-full rounded-2xl shadow-2xl"
                />
              </div>
            ) : isAudio ? (
              <div className="w-full h-full flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-3xl bg-liquid-accent/15 text-liquid-accent flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(0,210,255,0.25)]">
                  <FileText size={44} />
                </div>
                <h4 className="text-base font-bold text-white mb-4">{fileName}</h4>
                <audio src={fileUrl} controls className="w-full max-w-md" />
              </div>
            ) : isTextOrCode ? (
              <div className="w-full h-full p-4 sm:p-6 overflow-auto font-mono text-xs text-white/90 bg-[#0a0a0f] select-text">
                {isTextLoading ? (
                  <div className="w-full h-full flex items-center justify-center text-white/40">
                    Loading content...
                  </div>
                ) : textContent !== null ? (
                  <pre className="whitespace-pre-wrap break-words leading-relaxed">
                    {textContent}
                  </pre>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <p className="text-white/60 mb-4">Could not load preview in browser.</p>
                    <button
                      onClick={() => downloadFile(fileUrl, fileName)}
                      className="px-4 py-2 rounded-xl bg-liquid-accent text-black font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Download size={14} />
                      <span>Download File</span>
                    </button>
                  </div>
                )}
              </div>
            ) : isPdf ? (
              <div className="w-full h-full flex flex-col relative">
                {isAndroid ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                      <FileText size={40} />
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{fileName}</h4>
                    <p className="text-xs text-white/60 mb-6 max-w-md">
                      To view PDF documents with full quality on Android, tap below to open in your device&apos;s native PDF viewer.
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleNativeAndroidPreview}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-black font-bold text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] flex items-center gap-2 cursor-pointer hover:brightness-110"
                      >
                        <ExternalLink size={18} />
                        <span>Open in PDF Viewer</span>
                      </button>
                      <button
                        onClick={() => downloadFile(fileUrl, fileName)}
                        className="px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center gap-2 cursor-pointer"
                      >
                        <Download size={18} />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`${fileUrl}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-none"
                    title="PDF Preview"
                  />
                )}
              </div>
            ) : isOfficeDoc ? (
              <div className="w-full h-full flex flex-col relative">
                {isAndroid ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-20 h-20 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                      <FileText size={40} />
                    </div>
                    <h4 className="text-base font-bold text-white mb-2">{fileName}</h4>
                    <p className="text-xs text-white/60 mb-6 max-w-md">
                      Open this office document in your favorite native app (Word, Excel, Docs, Sheets).
                    </p>
                    <button
                      onClick={handleNativeAndroidPreview}
                      className="px-6 py-3 rounded-xl bg-liquid-accent text-black font-bold text-sm flex items-center gap-2 cursor-pointer"
                    >
                      <ExternalLink size={18} />
                      <span>Open with Device App</span>
                    </button>
                  </div>
                ) : (
                  <iframe
                    src={gdocsViewerUrl}
                    className="w-full h-full border-none"
                    title="Document Preview"
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-liquid-accent/20 text-liquid-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,210,255,0.2)]">
                  <FileText size={40} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{fileName}</h4>
                <p className="text-xs text-white/60 mb-6 max-w-sm">
                  This file format can be downloaded and opened directly in your native application.
                </p>
                <button
                  onClick={() => downloadFile(fileUrl, fileName)}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-black font-bold text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] flex items-center gap-2 cursor-pointer hover:brightness-110"
                >
                  <Download size={18} />
                  <span>Download File ({fileSize || 'File'})</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
