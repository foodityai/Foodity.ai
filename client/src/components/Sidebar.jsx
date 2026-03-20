import React, { useState } from 'react';
import { Plus, MessageSquare, Settings, LogOut, X, ChevronRight, PanelLeftClose, MoreHorizontal, Pin, Archive, Trash, Pencil, Share, Users, FolderOutput } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Sidebar({ isOpen, setIsOpen, chats = [], activeChatId, onSelectChat, onNewChat, onOpenSettings, onDeleteChat, onUpdateChat, onContextMenu }) {
  const navigate = useNavigate();
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Handle global rename command from Dashboard Context Menu
  React.useEffect(() => {
    const handleRenameRequest = (e) => {
      const chatId = e.detail;
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setEditingChatId(chatId);
        setEditTitle(chat.title || '');
      }
    };
    window.addEventListener('rename-chat', handleRenameRequest);
    return () => window.removeEventListener('rename-chat', handleRenameRequest);
  }, [chats]);

  const handleLogout = async () => {
    try { await signOut(auth); navigate('/login'); }
    catch (err) { console.error(err); }
  };

  const handleShare = (chat) => {
    // Placeholder share functionality
    navigator.clipboard.writeText(`${window.location.origin}/chat/${chat.id}`);
    alert('Shareable link copied to clipboard!');
  };

  const handleRenameSubmit = () => {
    if (editTitle.trim()) {
      onUpdateChat(editingChatId, { title: editTitle.trim() });
    }
    setEditingChatId(null);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const diff = (Date.now() - d) / 1000;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <aside
      style={{
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        color: 'var(--text-primary)',
      }}
      className="w-full h-full flex flex-col overflow-visible"
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between gap-3" style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center p-1 border border-white/5 backdrop-blur-sm overflow-hidden shadow-sm">
            <img src="/logo.png" alt="Foodity" className="w-full h-full object-contain" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
            Foodity
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 hidden lg:block ml-auto"
        >
          <PanelLeftClose className="w-5 h-5 text-[#22c55e]" />
        </button>
        <button onClick={() => setIsOpen(false)}
          className="lg:hidden p-1.5 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 opacity-70">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={() => { onNewChat('Conversation'); }}
          className="w-full flex items-center justify-between bg-[#22c55e]/10 hover:bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/25 rounded-xl p-3 transition-all duration-200 group font-semibold text-sm"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 transition-transform duration-200" />
            New Chat
          </div>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-4 pb-20">
        <div className="space-y-0.5">
          {chats.length > 0 ? (
            chats.map(chat => <ChatItem key={chat.id} chat={chat} />)
          ) : (
            <div className="text-center py-6 text-sm" style={{ color: 'var(--text-subtle)' }}>
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-25" />
              <p>No chats yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 space-y-1" style={{ borderTop: '1px solid var(--sidebar-border)' }}>
        <button 
          onClick={() => onOpenSettings()}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors text-left hover:bg-black/5 dark:hover:bg-white/5"
          style={{ color: 'var(--text-muted)' }}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 rounded-xl transition-colors text-left hover:bg-red-50 dark:hover:bg-red-900/20">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  );

  function ChatItem({ chat }) {
    const isActive = chat.id === activeChatId;

    return (
      <div
        className={clsx(
          'w-full group flex items-center gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all duration-150 relative cursor-pointer',
          !isActive && 'hover:bg-black/5 dark:hover:bg-white/5'
        )}
        style={isActive ? {
          background: 'rgba(34,197,94,0.12)',
          border: '1px solid rgba(34,197,94,0.2)',
          color: '#22c55e',
        } : { color: 'var(--text-muted)', border: '1px solid transparent' }}
        onClick={() => onSelectChat(chat.id)}
      >
        <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
        <div className="flex-1 min-w-0">
          {editingChatId === chat.id ? (
            <input
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameSubmit();
                if (e.key === 'Escape') setEditingChatId(null);
              }}
              className="w-full bg-transparent border-b border-[#22c55e] outline-none text-current"
            />
          ) : (
            <p className="truncate font-medium">{chat.title || 'Untitled Chat'}</p>
          )}
          <p className="text-[10px] mt-0.5 opacity-60 leading-none">{formatDate(chat.created_at)}</p>
        </div>

        {/* 3 dots menu button */}
        <button
          onClick={(e) => onContextMenu(e, chat)}
          className={clsx(
            "p-1.5 rounded-md hover:bg-black/10 dark:hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
          )}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    );
  }
}
