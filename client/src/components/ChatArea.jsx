import React, { useEffect, useRef, useState, useCallback } from 'react';
import { User, ExternalLink, ArrowUp } from 'lucide-react';
import { clsx } from 'clsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

function MessageContent({ content }) {
  useEffect(() => {
    const boxes = document.querySelectorAll('.nutrition-box');
    boxes.forEach(box => {
      const header = box.querySelector('.nutrition-header');
      if (!header) return;
      
      // Use direct onclick to ensure we don't stack listeners on re-renders
      header.onclick = () => {
        box.classList.toggle('active');
        const icon = header.textContent.startsWith('▶') ? '▼' : '▶';
        const label = box.classList.contains('active') ? 'Collapse Nutrition' : 'Show More Nutrition';
        header.textContent = `${icon} ${label}`;
      };
    });
  }, [content]);

  return (
    <div className="prose prose-sm prose-invert max-w-none text-[15px] leading-relaxed">
      <style>{`
        .nutrition-box {
          border: 1px solid rgba(34, 197, 94, 0.2);
          border-radius: 12px;
          margin-top: 10px;
          padding: 6px;
          background: rgba(0, 0, 0, 0.05);
        }
        .nutrition-header {
          cursor: pointer;
          color: #22c55e;
          font-weight: 600;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
          user-select: none;
        }
        .nutrition-header:hover {
          background: rgba(34, 197, 94, 0.1);
        }
        .nutrition-content {
          display: none;
          padding: 8px;
          border-top: 1px solid rgba(34, 197, 94, 0.1);
          margin-top: 4px;
        }
        .nutrition-box.active .nutrition-content {
          display: block;
        }
      `}</style>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0" style={{ color: 'inherit' }}>{children}</p>,
          ul: ({ children }) => <ul className="my-2 space-y-1">{children}</ul>,
          li: ({ children }) => (
            <li className="flex gap-2 text-inherit">
              <span className="text-[#22c55e] mt-1 shrink-0 font-bold">•</span>
              <span>{children}</span>
            </li>
          ),
          strong: ({ children }) => <strong className="text-[#22c55e] font-semibold">{children}</strong>,
          h1: ({ children }) => <h1 className="text-base font-bold mb-2 text-inherit">{children}</h1>,
          h2: ({ children }) => <h2 className="text-sm font-bold text-[#22c55e] mb-1.5">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 opacity-90">{children}</h3>,
          hr: () => <hr className="border-t border-black/10 dark:border-white/10 my-3" />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#22c55e] pl-3 italic my-2 opacity-80">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-black/10 dark:border-white/10">
              <table className="w-full text-left text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-black/5 dark:bg-white/5 border-b border-black/10 dark:border-white/10">{children}</thead>
          ),
          th: ({ children }) => <th className="p-2 font-semibold text-[#22c55e]">{children}</th>,
          td: ({ children }) => <td className="p-2 border-b border-black/5 dark:border-white/5 last:border-0">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}



function SourcesList({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 flex flex-wrap gap-1.5">
      {sources.map((url, i) => {
        let hostname = url;
        try { hostname = new URL(url).hostname.replace(/^www\./, ''); } catch {}
        return (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors hover:border-[#22c55e] hover:text-[#22c55e]"
            style={{
              color: 'var(--text-subtle)',
              borderColor: 'var(--border)',
              background: 'var(--bg-surface)',
            }}
          >
            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
            {hostname}
          </a>
        );
      })}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={clsx('flex gap-3 px-2', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1',
        isUser
          ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] shadow-md'
          : 'bg-white dark:bg-[#0f1e37] border border-black/5 dark:border-white/10'
      )}>
        {isUser
          ? <User className="w-4 h-4 text-white" />
          : <img src="/logo.png" alt="AI" className="w-5 h-5 object-contain" />
        }
      </div>

      <div className={clsx(
        'max-w-[90%] lg:max-w-[85%] rounded-2xl px-5 py-3.5',
        isUser
          ? 'bg-gradient-to-br from-[#22c55e] to-[#16a34a] text-white rounded-tr-sm shadow-sm'
          : msg.isError
            ? 'glass-card text-red-500 rounded-tl-sm border-red-500/20'
            : 'glass-card rounded-tl-sm shadow-[var(--card-shadow)] text-[var(--text-primary)]'
      )}>
        {isUser ? (
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        ) : (
          <>
            <MessageContent content={msg.content} />
            <SourcesList sources={msg.sources} />
          </>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 px-2">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white dark:bg-[#0f1e37] border border-black/5 dark:border-white/10 mt-1">
        <img src="/logo.png" alt="AI" className="w-5 h-5 object-contain" />
      </div>
      <div className="glass-card rounded-2xl rounded-tl-sm px-5 py-4 flex gap-1.5 items-center shadow-[var(--card-shadow)]">
        <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
        <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-[pulse_1s_ease-in-out_infinite_0.2s]" />
        <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-[pulse_1s_ease-in-out_infinite_0.4s]" />
      </div>
    </div>
  );
}

export default function ChatArea({ messages, isTyping }) {
  const bottomRef = useRef(null);
  const scrollRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Auto-scroll: use direct scrollTop on the container (not scrollIntoView which
  // gets blocked by the overflow-hidden parents in ChatDashboard).
  // requestAnimationFrame ensures this runs AFTER the browser paints new messages.
  useEffect(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [messages, isTyping]);

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    setShowScrollTop(scrollRef.current.scrollTop > 400);
  }, []);

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      className="h-full overflow-y-auto p-4 lg:p-6 relative custom-scrollbar"
      ref={scrollRef}
      onScroll={handleScroll}
    >
      <div className="max-w-3xl mx-auto space-y-5 pb-4">
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        {/* Dummy bottom anchor — scrollIntoView targets this */}
        <div ref={bottomRef} />
      </div>

      {/* Floating Scroll-to-Top FAB */}
      <div
        className={clsx(
          'fixed bottom-24 right-6 lg:right-10 z-50 transition-all duration-300 pointer-events-none',
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
      >
        <button
          onClick={scrollToTop}
          className="p-3 rounded-full bg-[#22c55e] text-white shadow-lg hover:scale-110 active:scale-95 transition-all pointer-events-auto"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
