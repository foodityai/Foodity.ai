import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ChatArea from '../components/ChatArea';
import MessageInput from '../components/MessageInput';
import ProfileModal from '../components/ProfileModal';
import SettingsModal from '../components/SettingsModal';
import WelcomeScreen from '../components/WelcomeScreen';
import ChefAnimation, { classifyQuery } from '../components/ChefAnimation';
import QuickPopup from '../components/QuickPopup';
import ConfirmModal from '../components/ConfirmModal';
import { useTheme } from '../hooks/useTheme';
import { useProfile } from '../hooks/useProfile';
import { auth } from '../firebase';


export default function ChatDashboard() {
  const { theme, toggleTheme } = useTheme();
  const { profile, updateProfile } = useProfile();

  // Sidebar: open by default on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [limitReached, setLimitReached] = useState(false);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chats, setChats] = useState([]);
  // AI mode: 'nutrition' | 'health'
  const [aiMode, setAiMode] = useState('nutrition');



  // Chef mascot animation state
  const [chefState, setChefState]           = useState('idle'); // idle|catching|cooking_simple|cooking_complex|serving
  const [showSpark, setShowSpark]           = useState(false);
  const [flyingText, setFlyingText]         = useState('');
  const [pendingAiMessage, setPendingAiMessage] = useState(null);

  // Welcome screen vs chat area transition
  const [viewState, setViewState] = useState('welcome');

  // Context Menu state
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, chat: null });

  // Popup & Modal state
  const [confirmDeleteChat, setConfirmDeleteChat] = useState(null);
  const [quickPopup, setQuickPopup] = useState({ isOpen: false, message: '', type: 'success' });

  const showPopup = (message, type = 'success') => {
    setQuickPopup({ isOpen: true, message, type });
  };

  const inputRef = useRef(null);
  const userId = auth.currentUser?.uid || 'anonymous';

  useEffect(() => { fetchChats(); }, []);

  useEffect(() => {
    if (activeChatId) {
      const activeChat = chats.find(c => c.id === activeChatId);
      document.title = activeChat?.title
        ? `Foodity – ${activeChat.title}`
        : 'Foodity.ai';
      // Close menu on chat switch
      setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    } else {
      document.title = 'Foodity.ai';
    }
  }, [activeChatId, chats]);

  // Global click handler to close context menu
  useEffect(() => {
    const hide = () => setContextMenu({ visible: false, x: 0, y: 0, chat: null });
    window.addEventListener('click', hide);
    return () => window.removeEventListener('click', hide);
  }, []);

  const fetchChats = async () => {
    try {
      const res = await fetch('/api/chats', { headers: { 'x-user-id': userId } });
      const data = await res.json();
      // Ensure local state uses specific spec properties
      const mapped = (data.chats || []).map(chat => ({
        ...chat,
        pinned: !!chat.is_pinned,
        archived: !!chat.is_archived
      }));
      setChats(mapped);
    } catch (err) { console.error('Failed to load chats:', err); }
  };

  const loadChat = async (chatId) => {
    setViewState('chat');
    setActiveChatId(chatId);
    setMessages([]);
    try {
      const res = await fetch(`/api/messages?chat_id=${chatId}`);
      const data = await res.json();
      const loaded = (data.messages || []).map(m => ({
        id: m.id, role: m.role === 'assistant' ? 'ai' : m.role, content: m.content,
      }));
      setMessages(loaded);
    } catch { setMessages([]); }
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setLimitReached(false);
    setViewState('welcome');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
        headers: { 'x-user-id': userId }
      });
      if (!res.ok) throw new Error('Delete failed');

      setChats(prev => prev.filter(c => c.id !== chatId));
      showPopup('Chat deleted successfully ❌', 'error'); // Red theme for delete
      if (activeChatId === chatId) {
        startNewChat();
      }
    } catch (err) {
      showPopup('Failed to delete chat: ' + err.message, 'error');
    }
  };

  const handleUpdateChat = async (chatId, updates) => {
    // Optimistic UI update
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, ...updates } : c));
    setContextMenu({ visible: false, x: 0, y: 0, chat: null });

    // Map frontend keys (pinned/archived) back to backend keys (is_pinned/is_archived)
    const backendUpdates = { ...updates };
    if (updates.pinned !== undefined) backendUpdates.is_pinned = updates.pinned;
    if (updates.archived !== undefined) backendUpdates.is_archived = updates.archived;

    try {
      const res = await fetch(`/api/chats/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId
        },
        body: JSON.stringify(backendUpdates)
      });
      if (!res.ok) throw new Error('Update failed');
    } catch (err) {
      console.error('Failed to update chat:', err.message);
      fetchChats(); // revert on fail
    }
  };

  const onShowContextMenu = (e, chat) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 208; // approx width of w-52
    const menuHeight = 220;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let x = e.clientX;
    let y = e.clientY;

    // Check space on the right
    if (x + menuWidth > windowWidth) {
      x = x - menuWidth; // flip to left
    }

    // Check space at the bottom
    if (y + menuHeight > windowHeight) {
      y = windowHeight - menuHeight - 10;
    }

    setContextMenu({ visible: true, x, y, chat });
  };

  // ── Spark trigger ─────────────────────────────────────────────────────────
  const handleSparkTrigger = useCallback(() => {
    if (!profile.enableChefAnimation) return;
    setShowSpark(true);
    setTimeout(() => setShowSpark(false), 700);
  }, [profile.enableChefAnimation]);

  // ── Chef serve complete ───────────────────────────────────────────────────
  const handleServeComplete = useCallback(() => {
    if (pendingAiMessage) {
      setMessages(prev => [...prev, pendingAiMessage]);
      setPendingAiMessage(null);
    }
    // Brief serving pause then idle
    setTimeout(() => setChefState('idle'), 400);
  }, [pendingAiMessage]);

  const handleSendMessage = async (text, withSearch = false) => {
    if (limitReached) return;

    if (viewState === 'welcome') {
      setViewState('transitioning');
      setTimeout(() => setViewState('chat'), 350);
    }

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: text }]);

    if (profile.enableChefAnimation) {
      setFlyingText(text);
      setChefState('catching');
      const complexity = classifyQuery(text);
      setTimeout(() => setChefState(complexity === 'complex' ? 'cooking_complex' : 'cooking_simple'), 700);
    }

    setIsTyping(true);

    try {
      const now = new Date();
      const hour = now.getHours();
      let mealType = 'snacks';
      if (hour >= 5 && hour < 11) mealType = 'breakfast';
      else if (hour >= 11 && hour < 16) mealType = 'lunch';
      else if (hour >= 16 && hour < 22) mealType = 'dinner';

      const payloadProfile = {
        ...profile,
        ai_mode: aiMode,
        local_time: now.toISOString(),
        meal_type: mealType
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({
          message: text,
          chat_id: activeChatId,
          tool: withSearch ? 'browser_search' : undefined,
          profile: payloadProfile,
        }),
      });
      const rawText = await res.text();
      console.log("RAW RESPONSE:", rawText);

      const data = JSON.parse(rawText);

      if (!res.ok) {
        if (res.status === 429) setLimitReached(true);
        throw new Error(data.error || 'Failed to get response');
      }

      if (data.chat_id && !activeChatId) {
        setActiveChatId(data.chat_id);
        fetchChats();
      }

      if (profile.enableChefAnimation) {
        // ── Phase 4: Serving ───────────────────────────────────────────────
        // Store response, let chef animation serve it
        setPendingAiMessage({
          id: Date.now() + 1,
          role: 'ai',
          content: data.reply,
          sources: data.sources || [],
        });
        setChefState('serving');
      } else {
        // Animation off — push response directly
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: 'ai',
          content: data.reply,
          sources: data.sources || [],
        }]);
      }

    } catch (err) {
      // On error skip chef animation, push error message directly
      setChefState('idle');
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'ai', content: err.message, isError: true }]);
    } finally {
      setIsTyping(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };



  const isWelcome = viewState === 'welcome';
  const isTransitioning = viewState === 'transitioning';

  return (
    <div
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      className="flex h-screen overflow-hidden transition-colors duration-300"
    >
      {/* ── Modals ── */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profile}
        updateProfile={updateProfile}
        showPopup={showPopup}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        updateProfile={updateProfile}
        chats={chats}
        onSelectChat={loadChat}
        onUpdateChat={handleUpdateChat}
        onDeleteChat={handleDeleteChat}
        showPopup={showPopup}
      />

      <ConfirmModal 
        isOpen={!!confirmDeleteChat}
        onClose={() => setConfirmDeleteChat(null)}
        onConfirm={() => handleDeleteChat(confirmDeleteChat)}
        title="Delete Chat?"
        message="This will permanently remove this conversation and all its messages. This action cannot be undone."
      />

      <QuickPopup 
        isOpen={quickPopup.isOpen}
        message={quickPopup.message}
        type={quickPopup.type}
        onClose={() => setQuickPopup(prev => ({ ...prev, isOpen: false }))}
      />

      {/* ── Sidebar ── */}
      <div
        style={{
          width: isSidebarOpen ? '288px' : '0px',
          transition: 'width 280ms cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',
          flexShrink: 0,
        }}
        className="h-full relative z-30"
      >
        <Sidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          chats={chats}
          activeChatId={activeChatId}
          onSelectChat={loadChat}
          onNewChat={startNewChat}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onDeleteChat={handleDeleteChat}
          onUpdateChat={handleUpdateChat}
          onContextMenu={onShowContextMenu}
        />
      </div>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden min-w-0">
        <TopBar
          isSidebarOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(v => !v)}
          theme={theme}
          toggleTheme={toggleTheme}
          profile={profile}
          onProfileOpen={() => setIsProfileOpen(true)}
          aiMode={aiMode}
          setAiMode={setAiMode}
        />

        <main className="flex-1 flex flex-col relative overflow-hidden">
          {(isWelcome || isTransitioning) && (
            <div
              className="absolute inset-0 flex flex-col z-10"
              style={{
                transition: 'opacity 350ms ease, transform 350ms ease',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(-16px)' : 'translateY(0)',
                pointerEvents: isTransitioning ? 'none' : 'auto',
              }}
            >
              <WelcomeScreen
                profile={profile}
                onSend={handleSendMessage}
                disabled={isTyping}
                inputRef={inputRef}
              />

            </div>
          )}

          {!isWelcome && (
            <div
              className="flex flex-col flex-1 overflow-hidden"
              style={{
                transition: 'opacity 300ms ease 200ms, transform 300ms ease 200ms',
                opacity: isTransitioning ? 0 : 1,
                transform: isTransitioning ? 'translateY(12px)' : 'translateY(0)',
              }}
            >
              {/* Chat area */}
              <div className="flex-1 flex flex-col relative min-h-0">
                <ChatArea
                  messages={messages}
                  isTyping={isTyping && (!profile.enableChefAnimation || chefState === 'idle')}
                />

                {/* ── Chef Animation Layer (only when enabled) ── */}
                {profile.enableChefAnimation && (
                  <ChefAnimation
                    chefState={chefState}
                    flyingText={flyingText}
                    onServeComplete={handleServeComplete}
                  />
                )}
              </div>

              <div className="p-4" style={{ borderTop: '1px solid var(--border)', position: 'relative' }}>
                <div className="max-w-3xl mx-auto">
                  {limitReached ? (
                    <div className="text-center p-4 rounded-xl border text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                      🚫 Daily AI limit reached. Please try again tomorrow.
                    </div>
                  ) : (
                    <MessageInput
                      onSend={handleSendMessage}
                      disabled={isTyping}
                      inputRef={inputRef}
                      onSparkTrigger={handleSparkTrigger}
                      showSpark={showSpark}
                      showPopup={showPopup}
                    />
                  )}
                  <p className="text-xs text-center mt-3" style={{ color: 'var(--text-subtle)' }}>
                    Foodity AI can make mistakes. Verify important nutritional info with a professional.
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Context Menu */}
      {contextMenu.visible && contextMenu.chat && (
        <div
          className="fixed z-[99999] w-52 py-2 rounded-2xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-200"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            background: 'var(--bg-card)',
            borderColor: 'var(--border)',
            backdropFilter: 'blur(32px)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider opacity-40">Chat Actions</div>

          <button onClick={() => {
            navigator.clipboard.writeText(`${window.location.origin}/chat/${contextMenu.chat.id}`);
            alert('Shareable link copied!');
            setContextMenu({ visible: false, x: 0, y: 0, chat: null });
          }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
            <span>Share</span>
          </button>

          <button onClick={() => {
            window.dispatchEvent(new CustomEvent('rename-chat', { detail: contextMenu.chat.id }));
            setContextMenu({ visible: false, x: 0, y: 0, chat: null });
          }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <span>Rename</span>
          </button>

          {/* <button onClick={() => handleUpdateChat(contextMenu.chat.id, { pinned: !contextMenu.chat.pinned })} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
            <span>{contextMenu.chat.pinned ? 'Unpin Chat' : 'Pin Chat'}</span>
          </button>

          <button onClick={() => handleUpdateChat(contextMenu.chat.id, { archived: !contextMenu.chat.archived })} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left" style={{ color: 'var(--text-primary)' }}>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            <span>{contextMenu.chat.archived ? 'Unarchive' : 'Archive'}</span>
          </button> */}

          <div className="h-px bg-black/10 dark:bg-white/10 my-1 mx-3" />

          <button
            onClick={() => {
              setConfirmDeleteChat(contextMenu.chat.id);
              setContextMenu({ visible: false, x: 0, y: 0, chat: null });
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-red-500 hover:bg-red-500/10 transition-colors text-left font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
