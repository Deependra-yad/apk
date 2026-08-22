"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, X, Sparkles, Languages, FileText, Send, 
  Copy, Check, RefreshCw, MessageSquare 
} from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

interface LiquidAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  onInsertToChat?: (text: string) => void;
}

export default function LiquidAiModal({ isOpen, onClose, initialPrompt = '', onInsertToChat }: LiquidAiModalProps) {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'chat' | 'translate' | 'summarize' | 'suggest'>('chat');
  const [prompt, setPrompt] = useState(initialPrompt);
  const [targetLang, setTargetLang] = useState('Spanish');
  const [response, setResponse] = useState('');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunAI = async (mode: 'chat' | 'translate' | 'summarize' | 'suggest_replies') => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setResponse('');
    setSuggestedReplies([]);

    try {
      const res = await axios.post('/api/ai/chat', {
        prompt: prompt.trim(),
        mode,
        targetLanguage: targetLang
      });

      if (mode === 'suggest_replies') {
        try {
          const parsed = JSON.parse(res.data.response);
          setSuggestedReplies(parsed);
        } catch {
          setResponse(res.data.response);
        }
      } else {
        setResponse(res.data.response);
      }
    } catch (e) {
      setResponse("⚠️ AI assistance service unavailable. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 select-none"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-xl bg-liquid-base/95 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative overflow-hidden"
        >
          {/* Ambient Top Glow */}
          <div className="absolute top-0 right-1/3 w-64 h-32 bg-liquid-accent/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-liquid-accent to-purple-500 flex items-center justify-center text-liquid-dark shadow-md">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                  <span>Liquid AI Copilot</span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-liquid-accent/20 text-liquid-accent font-bold">
                    AI 2.0
                  </span>
                </h3>
                <p className="text-xs text-gray-400">Smart translations, writing & summaries</p>
              </div>
            </div>

            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/5">
              <X size={20} />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1.5 bg-black/40 p-1 rounded-2xl border border-white/5">
            <button
              onClick={() => { setActiveTab('chat'); setResponse(''); }}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'chat' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles size={14} />
              <span>Ask AI</span>
            </button>

            <button
              onClick={() => { setActiveTab('translate'); setResponse(''); }}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'translate' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Languages size={14} />
              <span>Translate</span>
            </button>

            <button
              onClick={() => { setActiveTab('summarize'); setResponse(''); }}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'summarize' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <FileText size={14} />
              <span>Summarize</span>
            </button>

            <button
              onClick={() => { setActiveTab('suggest'); setResponse(''); }}
              className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'suggest' ? 'bg-liquid-accent text-liquid-dark font-bold shadow-md' : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Replies</span>
            </button>
          </div>

          {/* Translation Target Language Selector */}
          {activeTab === 'translate' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-medium">Target Language:</span>
              <select
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="bg-black/40 border border-white/10 text-white text-xs rounded-xl px-3 py-1.5 outline-none focus:border-liquid-accent/50"
              >
                <option value="Spanish">🇪🇸 Spanish</option>
                <option value="French">🇫🇷 French</option>
                <option value="German">🇩🇪 German</option>
                <option value="Hindi">🇮🇳 Hindi</option>
                <option value="Japanese">🇯🇵 Japanese</option>
                <option value="Italian">🇮🇹 Italian</option>
              </select>
            </div>
          )}

          {/* Input Area */}
          <div className="space-y-2">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeTab === 'chat' ? 'Ask anything (e.g. Write a friendly reply, explain quantum computing...)' :
                activeTab === 'translate' ? 'Enter text to translate...' :
                activeTab === 'summarize' ? 'Paste message history or text to summarize...' :
                'Enter recent message to generate smart reply suggestions...'
              }
              rows={3}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-3.5 text-white text-xs outline-none focus:border-liquid-accent/50 resize-none placeholder-gray-500"
            />

            <button
              onClick={() => handleRunAI(activeTab === 'suggest' ? 'suggest_replies' : activeTab)}
              disabled={!prompt.trim() || isLoading}
              className="w-full h-10 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:brightness-110 disabled:opacity-40 transition-all"
            >
              {isLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Generate with Liquid AI</span>
                </>
              )}
            </button>
          </div>

          {/* Output Display */}
          {(response || suggestedReplies.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-2xl p-4 max-h-48 overflow-y-auto no-scrollbar space-y-3"
            >
              {suggestedReplies.length > 0 ? (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-liquid-accent block">Suggested Quick Replies:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggestedReplies.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (onInsertToChat) onInsertToChat(reply);
                          onClose();
                        }}
                        className="p-2.5 rounded-xl bg-black/40 hover:bg-liquid-accent/20 hover:text-liquid-accent text-white text-xs text-left border border-white/5 transition-all"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-xs text-white leading-relaxed whitespace-pre-wrap">
                    {response}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={() => handleCopy(response)}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium flex items-center gap-1.5"
                    >
                      {isCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {onInsertToChat && (
                      <button
                        onClick={() => {
                          onInsertToChat(response);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-liquid-accent text-liquid-dark text-xs font-bold flex items-center gap-1.5"
                      >
                        <Send size={13} />
                        <span>Insert in Chat</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

