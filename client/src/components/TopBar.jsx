import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { clsx } from 'clsx';

const MODES = [
  { id: 'nutrition', label: 'Nutrition AI', emoji: '🥗', desc: 'Food logging & nutrition' },
  { id: 'health',    label: 'Health Corner', emoji: '💚', desc: 'Wellness & health advice' },
];

export default function TopBar({ isSidebarOpen, toggleSidebar, theme, toggleTheme, profile, onProfileOpen, aiMode, setAiMode, isNewUser }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeMode = MODES.find(m => m.id === aiMode) || MODES[0];

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className="h-14 flex items-center justify-between px-2 sm:px-4 lg:px-5 sticky top-0 z-10"
      style={{
        background: 'var(--topbar-bg)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <style>{`
        @keyframes profile-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .animate-profile-pulse {
          animation: profile-pulse 2s infinite;
        }
      `}</style>
      {/* ── Left: toggle + logo + mode dropdown ── */}
      <div className="flex items-center gap-2">
        <button
          id="sidebar-toggle"
          onClick={toggleSidebar}
          title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          style={{ color: 'var(--text-muted)' }}
          className="p-2 -ml-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 group"
        >
          <svg
            className={clsx(
              'w-5 h-5 transition-all duration-300 group-hover:text-[#22c55e]',
              isSidebarOpen ? '' : 'scale-x-[-1]'
            )}
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 ml-0.5">
          <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center p-1 border border-black/5 dark:border-white/5 shadow-sm">
            <img src="/logo.png" alt="Foodity.ai" className="w-full h-full object-contain filter drop-shadow-sm" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-transparent hidden sm:block">
            Foodity.ai
          </span>
        </div>

        {/* ── ChatGPT-style Mode Dropdown ── */}
        <div className="relative ml-1" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 border',
              dropdownOpen
                ? 'bg-[#22c55e]/10 border-[#22c55e]/25 text-[#22c55e]'
                : 'border-transparent hover:bg-black/5 dark:hover:bg-white/5'
            )}
            style={{ color: dropdownOpen ? '#22c55e' : 'var(--text-primary)' }}
          >
            <span>{activeMode.emoji}</span>
            <span className="hidden sm:inline">{activeMode.label}</span>
            <ChevronDown className={clsx('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
          </button>

          {dropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1.5 w-56 rounded-xl border shadow-xl z-50 overflow-hidden py-1"
              style={{
                background: 'var(--bg-card)',
                borderColor: 'var(--border)',
              }}
            >
              {MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { setAiMode(mode.id); setDropdownOpen(false); }}
                  className={clsx(
                    'w-full flex items-start gap-3 px-3.5 py-2.5 text-left transition-colors',
                    aiMode === mode.id
                      ? 'bg-[#22c55e]/10'
                      : 'hover:bg-black/5 dark:hover:bg-white/5'
                  )}
                  style={{ color: 'var(--text-primary)' }}
                >
                  <span className="text-lg mt-0.5">{mode.emoji}</span>
                  <div>
                    <div className={clsx('text-sm font-semibold', aiMode === mode.id && 'text-[#22c55e]')}>
                      {mode.label}
                    </div>
                    <div className="text-xs opacity-50 mt-0.5">{mode.desc}</div>
                  </div>
                  {aiMode === mode.id && (
                    <span className="ml-auto text-[#22c55e] text-sm mt-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: theme + avatar (opens profile) ── */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          style={{ color: 'var(--text-muted)' }}
          className="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark'
            ? <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            : <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          }
        </button>

        <div
          id="open-profile"
          onClick={onProfileOpen}
          className={clsx(
            "w-8 h-8 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white font-bold text-sm shadow-sm cursor-pointer hover:scale-105 transition-all outline outline-offset-2 outline-transparent",
            isNewUser && "animate-profile-pulse outline-[#22c55e]"
          )}
          title="Profile"
        >
          {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
