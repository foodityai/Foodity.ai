import React, { useState, useEffect } from 'react';
import MessageInput from './MessageInput';

// ─── Meal classification ────────────────────────────────────────────────────
function getMealInfo(hour, minute) {
  const totalMinutes = hour * 60 + minute;

  // 05:00–10:30 → Breakfast
  if (totalMinutes >= 300 && totalMinutes < 630) {
    return {
      greeting: 'Good morning',
      emoji: '☀️',
      question: 'What did you have for breakfast today?',
    };
  }
  // 10:30–12:00 → Morning Snack
  if (totalMinutes >= 630 && totalMinutes < 720) {
    return {
      greeting: 'Hey',
      emoji: '🍎',
      question: 'Had any morning snacks?',
    };
  }
  // 12:00–15:30 → Lunch
  if (totalMinutes >= 720 && totalMinutes < 930) {
    return {
      greeting: 'Hey',
      emoji: '👋',
      question: 'What did you have for lunch?',
    };
  }
  // 15:30–18:30 → Evening Snack
  if (totalMinutes >= 930 && totalMinutes < 1110) {
    return {
      greeting: 'Hey',
      emoji: '☕',
      question: "What's your evening snack today?",
    };
  }
  // 18:30–22:30 → Dinner
  if (totalMinutes >= 1110 && totalMinutes < 1350) {
    return {
      greeting: 'Good evening',
      emoji: '🌙',
      question: 'What did you eat for dinner?',
    };
  }
  // 22:30–05:00 → Late Night
  return {
    greeting: 'Still awake',
    emoji: '🌙',
    question: 'Did you have any late night snacks?',
  };
}

// ─── Live clock ─────────────────────────────────────────────────────────────
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

// ─── WelcomeScreen ───────────────────────────────────────────────────────────
export default function WelcomeScreen({ profile, onSend, disabled, inputRef }) {
  const now = useLiveClock();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const { greeting, emoji, question } = getMealInfo(hour, minute);
  const username = profile?.username?.trim() || '';

  const greetLine = username
    ? `${greeting} ${username} ${emoji}`
    : `Hi there ${emoji}`;

  const questionLine = username
    ? question
    : 'What did you eat today?';

  return (
    <div className="welcome-screen flex-1 flex flex-col items-center justify-center px-4 pb-8 overflow-hidden">
      {/* Big Header Logo */}
      <div className="flex flex-col items-center gap-6 mb-12">
        <div className="relative group">
          {/* Subtle glow effect behind logo */}
          <div className="absolute inset-0 bg-[#22c55e]/30 blur-3xl rounded-full scale-75 group-hover:scale-100 transition-transform duration-700" />
          <div className="relative w-32 h-32 rounded-[2rem] bg-white/10 flex items-center justify-center p-6 border border-white/20 backdrop-blur-md shadow-2xl transition-all duration-500 hover:rotate-2 hover:scale-105">
            <img src="/logo.png" alt="Foodity" className="w-full h-full object-contain filter drop-shadow-lg" />
          </div>
        </div>
      </div>

      {/* Greeting card */}
      <div className="welcome-greeting glass-card rounded-2xl px-8 py-6 mb-8 text-center max-w-md w-full shadow-[var(--card-shadow)]"
        style={{ border: 'var(--ai-bubble-border)' }}>
        <p className="text-xl font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {greetLine}
        </p>
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>
          {questionLine}
        </p>
      </div>

      {/* Input */}
      <div className="w-full max-w-2xl">
        <MessageInput onSend={onSend} disabled={disabled} inputRef={inputRef} />
        <p className="text-xs text-center mt-3" style={{ color: 'var(--text-subtle)' }}>
          Foodity AI can make mistakes. Verify important nutritional info with a professional.
        </p>
      </div>
    </div>
  );
}
