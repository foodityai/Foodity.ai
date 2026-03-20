import React, { useState, useEffect } from 'react';
import { SendHorizontal, Globe, X, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export default function MessageInput({ onSend, disabled, inputRef, onSparkTrigger, showSpark, showPopup }) {
  const [input, setInput] = useState('');
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);

  // Close tool menu when clicking outside (simple approach for now: any click on the form or outside)
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('.tool-menu-container')) {
        setIsToolMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  useEffect(() => {
    const el = inputRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  }, [input, inputRef]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || disabled) return;
    onSparkTrigger?.();
    onSend(input.trim(), searchEnabled);
    setInput('');
    setSearchEnabled(false);
    setIsToolMenuOpen(false);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
      className="relative rounded-2xl shadow-[var(--card-shadow)] focus-within:border-[#22c55e]/50 focus-within:ring-1 focus-within:ring-[#22c55e]/30 transition-all duration-200"
    >
      {/* Search badge */}
      {searchEnabled && (
        <div className="flex items-center gap-2 px-4 pt-3">
          <div className="flex items-center gap-1.5 bg-[#22c55e]/15 text-[#22c55e] text-xs px-2.5 py-1 rounded-full border border-[#22c55e]/25 font-medium">
            <Globe className="w-3 h-3" />
            <span>Browser Mode Active</span>
            <button
              type="button"
              onClick={() => setSearchEnabled(false)}
              className="ml-1 hover:text-[#16a34a] transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end p-2 gap-2">
        {/* Tool Menu Container */}
        <div className="relative tool-menu-container flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsToolMenuOpen(v => !v)}
            title="Tools"
            style={{ color: isToolMenuOpen ? '#22c55e' : 'var(--text-subtle)' }}
            className={clsx(
              'p-2 rounded-xl mb-0.5 transition-all duration-200',
              isToolMenuOpen
                ? 'bg-[#22c55e]/15 border border-[#22c55e]/25'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Plus className={clsx("w-5 h-5 transition-transform duration-200", isToolMenuOpen && "rotate-45")} />
          </button>

          {/* Floating Tool Menu */}
          {isToolMenuOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-[#0f1e37] border border-black/10 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden text-sm flex flex-col py-1 animate-[welcomeFadeIn_0.15s_ease-out]">
              <button
                type="button"
                onClick={() => {
                  setSearchEnabled(true);
                  if (showPopup) showPopup('✅ Browser Search Enabled', 'success');
                  setIsToolMenuOpen(false);
                }}
                className="flex items-start gap-3 px-3 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                style={{ color: 'var(--text-primary)' }}
              >
                <Globe className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">Browser Search</div>
                  <div className="text-xs opacity-70 leading-snug mt-0.5">Search the web for additional information</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about food, nutrition, or healthy habits..."
          disabled={disabled}
          rows={1}
          autoFocus
          style={{ color: 'var(--text-primary)' }}
          className="flex-1 max-h-[160px] bg-transparent outline-none border-none resize-none px-2 py-2.5 text-[15px] leading-relaxed placeholder:opacity-50 disabled:opacity-50"
        />

        <div className="relative flex-shrink-0 mb-0.5">
          {/* Spark overlay */}
          <AnimatePresence>
            {showSpark && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
                {[
                  { angle: -60, color: '#ef4444', delay: 0 },
                  { angle: -90, color: '#3b82f6', delay: 0.04 },
                  { angle: -120, color: '#ef4444', delay: 0.08 },
                  { angle: -75, color: '#f97316', delay: 0.02 },
                  { angle: -45, color: '#3b82f6', delay: 0.06 },
                  { angle: -105, color: '#ef4444', delay: 0.10 },
                ].map((s, i) => {
                  const rad = (s.angle * Math.PI) / 180;
                  return (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 5, height: 5,
                        background: s.color,
                        top: '50%', left: '50%',
                        marginTop: -2.5, marginLeft: -2.5,
                        boxShadow: `0 0 6px 2px ${s.color}88`,
                      }}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                      animate={{ x: Math.cos(rad) * 32, y: Math.sin(rad) * 32, opacity: 0, scale: 0.3 }}
                      exit={{}}
                      transition={{ duration: 0.45, delay: s.delay, ease: 'easeOut' }}
                    />
                  );
                })}
                <motion.div
                  className="absolute"
                  style={{ top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: [0, 1.6, 0], opacity: [1, 0.7, 0] }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                >
                  <span style={{ fontSize: 20 }}>🔥</span>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={clsx(
              'p-2.5 rounded-xl transition-all duration-200',
              input.trim() && !disabled
                ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white shadow-md shadow-[#22c55e]/20'
                : 'bg-black/5 dark:bg-white/5 opacity-50 cursor-not-allowed'
            )}
            style={{ color: input.trim() && !disabled ? 'white' : 'var(--text-subtle)' }}
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
}
