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
      className="relative max-w-3xl mx-auto px-2 sm:px-0"
    >
      <div 
        style={{ background: 'var(--bg-input)', border: '1px solid var(--border)' }}
        className="relative flex items-center min-h-[52px] gap-1 px-2 py-1.5 rounded-[26px] shadow-[var(--card-shadow)] focus-within:border-[#22c55e]/50 focus-within:ring-1 focus-within:ring-[#22c55e]/30 transition-all duration-200"
      >
        {/* Tool Menu Container */}
        <div className="relative tool-menu-container flex-shrink-0">
          <button
            type="button"
            onClick={() => setIsToolMenuOpen(v => !v)}
            title="Tools"
            style={{ color: isToolMenuOpen ? '#22c55e' : 'var(--text-subtle)' }}
            className={clsx(
              'p-2 rounded-full transition-all duration-200',
              isToolMenuOpen
                ? 'bg-[#22c55e]/15 border border-[#22c55e]/25'
                : 'hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Plus className={clsx("w-5 h-5 transition-transform duration-200", isToolMenuOpen && "rotate-45")} />
          </button>

          {/* Floating Tool Menu */}
          {isToolMenuOpen && (
            <div className="absolute bottom-full left-0 mb-3 w-56 bg-white dark:bg-[#0f1e37] border border-black/10 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={() => {
                  setSearchEnabled(true);
                  if (showPopup) showPopup('✅ Browser Search Enabled', 'success');
                  setIsToolMenuOpen(false);
                }}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                style={{ color: 'var(--text-primary)' }}
              >
                <Globe className="w-4 h-4 text-[#22c55e] mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-sm">Browser Search</div>
                  <div className="text-[11px] opacity-70 leading-snug mt-0.5">Search the web for additional information</div>
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
          placeholder="Message Foodity..."
          disabled={disabled}
          rows={1}
          autoFocus
          style={{ color: 'var(--text-primary)' }}
          className="flex-1 max-h-[160px] bg-transparent outline-none border-none resize-none px-2 py-2 text-[15px] leading-relaxed placeholder:opacity-50 disabled:opacity-50"
        />

        <div className="relative flex-shrink-0 flex items-center">
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
                      transition={{ duration: 0.45, delay: s.delay, ease: 'easeOut' }}
                    />
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={!input.trim() || disabled}
            className={clsx(
              'p-2 rounded-full transition-all duration-200',
              input.trim() && !disabled
                ? 'bg-[#22c55e] text-white shadow-sm hover:scale-105 active:scale-95'
                : 'bg-black/10 dark:bg-white/10 text-black/20 dark:text-white/20'
            )}
          >
            <SendHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {searchEnabled && (
        <div className="absolute -top-10 left-2 right-2 flex justify-center pointer-events-none">
          <div className="bg-[#22c55e] text-white text-[10px] uppercase tracking-wider font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-in slide-in-from-bottom-2">
            <Globe className="w-3 h-3" />
            <span>Web Search Active</span>
            <button
              type="button"
              onClick={() => setSearchEnabled(false)}
              className="ml-1 hover:opacity-70 pointer-events-auto"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
