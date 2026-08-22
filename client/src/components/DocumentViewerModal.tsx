"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

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
  if (!isOpen) return null;

  const isPdf = fileName?.toLowerCase().endsWith('.pdf') || mimeType?.includes('pdf');
  const isTextOrCode = fileName?.match(/\.(txt|json|js|ts|jsx|tsx|py|html|css|md|c|cpp|java|go|rs|sql|sh)$/i);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-4xl h-[85vh] bg-liquid-base/95 border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between"
        >
          {/* Header */}
          <div className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/40">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2 rounded-xl bg-liquid-accent/20 text-liquid-accent shrink-0">
                <FileText size={20} />
              </div>
              <div className="overflow-hidden">
                <h3 className="text-sm font-bold text-white truncate max-w-md">{fileName}</h3>
                <span className="text-[11px] text-gray-400 font-mono">{fileSize || 'Document'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={fileUrl}
                download={fileName}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-white text-xs font-semibold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,210,255,0.3)] hover:brightness-110 transition-all"
              >
                <Download size={15} />
                <span>Download</span>
              </a>

              <button
                onClick={onClose}
                className="p-2.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Document Content View */}
          <div className="flex-1 w-full h-full overflow-hidden bg-black/60 relative flex items-center justify-center">
            {isPdf ? (
              <iframe
                src={`${fileUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full border-none rounded-b-2xl"
                title="PDF Preview"
              />
            ) : isTextOrCode ? (
              <iframe
                src={fileUrl}
                className="w-full h-full border-none p-6 text-white font-mono text-xs bg-black/80 overflow-auto"
                title="Code Preview"
              />
            ) : (
              <div className="flex flex-col items-center text-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-liquid-accent/20 text-liquid-accent flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,210,255,0.2)]">
                  <FileText size={40} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{fileName}</h4>
                <p className="text-xs text-gray-400 mb-6 max-w-sm">
                  This file format can be downloaded and opened directly in your native application.
                </p>
                <a
                  href={fileUrl}
                  download={fileName}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-liquid-accent to-liquid-secondary text-white font-bold text-sm shadow-[0_0_20px_rgba(0,210,255,0.4)] flex items-center gap-2"
                >
                  <Download size={18} />
                  <span>Download File ({fileSize})</span>
                </a>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

