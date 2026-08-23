"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';

interface PollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePoll: (pollData: { question: string; options: Array<{ id: number; text: string; voters: string[] }> }) => void;
}

export default function PollModal({ isOpen, onClose, onCreatePoll }: PollModalProps) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== index));
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const next = [...options];
    next[index] = val;
    setOptions(next);
  };

  const handleSubmit = () => {
    if (!question.trim()) return;
    const validOptions = options.filter(o => o.trim().length > 0);
    if (validOptions.length < 2) return;

    onCreatePoll({
      question: question.trim(),
      options: validOptions.map((text, idx) => ({ id: idx + 1, text: text.trim(), voters: [] }))
    });

    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xl p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-md bg-liquid-base/95 border border-foreground/10 rounded-3xl p-6 shadow-2xl flex flex-col gap-4 relative"
          >
            <div className="flex justify-between items-center pb-2 border-b border-foreground/5">
              <div className="flex items-center gap-2">
                <BarChart2 size={20} className="text-liquid-accent" />
                <h3 className="text-lg font-bold text-foreground">Create a Poll</h3>
              </div>
              <button onClick={onClose} className="text-foreground/60 hover:text-foreground p-1">
                <X size={20} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="w-full h-11 bg-background/40 rounded-xl px-4 text-foreground text-sm border border-foreground/5 outline-none focus:border-liquid-accent/50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-foreground/80">Options</label>
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    className="flex-1 h-10 bg-background/40 rounded-xl px-3.5 text-foreground text-xs border border-foreground/5 outline-none focus:border-liquid-accent/50"
                  />
                  {options.length > 2 && (
                    <button onClick={() => handleRemoveOption(idx)} className="p-2 text-foreground/50 hover:text-red-400">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 8 && (
                <button
                  onClick={handleAddOption}
                  className="text-xs text-liquid-accent hover:underline flex items-center gap-1 mt-1 font-medium"
                >
                  <Plus size={14} /> Add Option
                </button>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!question.trim() || options.filter(o => o.trim()).length < 2}
              className="mt-2 w-full h-11 bg-gradient-to-r from-liquid-accent to-liquid-secondary rounded-xl text-foreground font-semibold text-sm shadow-[0_0_20px_rgba(0,210,255,0.3)] hover:brightness-110 transition-all disabled:opacity-50"
            >
              Create Poll
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// In-Chat Interactive Poll Viewer Component
export function PollBubble({
  messageId,
  pollData,
  onVote,
  currentUserId,
  isMe
}: {
  messageId: string;
  pollData: string;
  onVote: (messageId: string, optionId: number) => void;
  currentUserId?: string;
  isMe: boolean;
}) {
  let poll: { question: string; options: Array<{ id: number; text: string; voters: string[] }> } | null = null;
  try {
    poll = JSON.parse(pollData);
  } catch (e) {
    return null;
  }

  if (!poll) return null;

  const totalVotes = poll.options.reduce((acc, curr) => acc + (curr.voters?.length || 0), 0);

  return (
    <div className="flex flex-col gap-2.5 py-1 min-w-[260px] sm:min-w-[300px]">
      <div className="flex items-center gap-2 pb-1 border-b border-foreground/10">
        <BarChart2 size={16} className="text-liquid-accent" />
        <h4 className="font-bold text-sm text-foreground">{poll.question}</h4>
      </div>

      <div className="space-y-2">
        {poll.options.map((opt) => {
          const voteCount = opt.voters?.length || 0;
          const votePercent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
          const hasVoted = opt.voters?.includes(currentUserId || '');

          return (
            <div
              key={opt.id}
              onClick={() => onVote(messageId, opt.id)}
              className={`p-2.5 rounded-xl cursor-pointer relative overflow-hidden transition-all border ${
                hasVoted
                  ? 'border-liquid-accent bg-liquid-accent/15'
                  : 'border-foreground/10 bg-background/20 hover:bg-background/30'
              }`}
            >
              {/* Progress bar background fill */}
              <div
                className="absolute inset-0 bg-liquid-accent/20 rounded-xl transition-all duration-300 -z-10"
                style={{ width: `${votePercent}%` }}
              />

              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-foreground/90 truncate mr-2">{opt.text}</span>
                <span className="font-mono text-[11px] font-bold text-liquid-accent shrink-0">
                  {votePercent}% ({voteCount})
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-[10px] text-foreground/60 font-mono text-right">
        {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
      </div>
    </div>
  );
}

