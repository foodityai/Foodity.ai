import React, { useState } from 'react';
import { X, ArchiveRestore, Trash } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, profile, updateProfile, chats = [], onSelectChat, onUpdateChat, onDeleteChat, showPopup }) {
  const [temp, setTemp] = useState(profile);

  // Sync temp state whenever the modal opens with fresh profile data
  React.useEffect(() => {
    if (isOpen) {
      setTemp(profile);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTemp(p => ({ ...p, [name]: value }));
  };

  const handleSave = () => {
    updateProfile(temp);
    if (showPopup) showPopup('✅ Settings Saved Successfully', 'success');
    onClose();
  };

  // Toggle helper for booleans
  const toggleBool = (e, key) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !temp[key];
    setTemp(p => ({ ...p, [key]: newState }));
    
    // Immediate feedback for enabling/disabling
    if (showPopup) {
      const labels = {
        enableTimeBased: 'Time-Based AI',
        enableSuggestions: 'Suggestions',
        enableChefAnimation: 'Chef Animation'
      };
      const label = labels[key] || key;
      showPopup(`✅ ${label} ${newState ? 'Enabled' : 'Disabled'}`, 'success');
    }
  };

  const AI_TOGGLES = [
    {
      name: 'enableTimeBased',
      label: 'Enable Time-Based AI',
      desc: 'AI greets you and references meal context based on your device time.',
      icon: '🕐',
    },
    {
      name: 'enableSuggestions',
      label: 'Enable Suggestions',
      desc: 'AI includes a Suggestions 😊 section with friendly tips in responses.',
      icon: '💡',
    },
    {
      name: 'enableChefAnimation',
      label: 'Chef Animation',
      desc: 'Show the animated AI Chef mascot while your question is being cooked.',
      icon: '🍳',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-md rounded-2xl shadow-xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
            ⚙ Settings
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-20 scrollbar-hide space-y-6">
          {/* App Preferences */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b border-black/10 dark:border-white/10 pb-2 text-[#22c55e]">
              App Preferences
            </h3>

            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Region / Country</label>
              <input
                type="text" name="region" value={temp.region || ''} onChange={handleChange} placeholder="e.g., US, IN, EU"
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Timezone</label>
              <input
                type="text" name="timezone" value={temp.timezone || ''} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Units</label>
              <select
                name="units" value={temp.units || 'metric'} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              >
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lbs, in)</option>
              </select>
            </div>
          </div>

          {/* AI Behavior */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold border-b border-black/10 dark:border-white/10 pb-2 text-[#22c55e]">
              AI Behavior
            </h3>

            {AI_TOGGLES.map(({ name, label, desc, icon }) => (
              <div 
                key={name} 
                className="flex items-start gap-3 cursor-pointer select-none group/toggle"
                onClick={(e) => toggleBool(e, name)}
              >
                <div className="relative mt-0.5 shrink-0 pointer-events-none">
                  <div
                    className="w-10 h-6 rounded-full transition-colors duration-200"
                    style={{ background: temp[name] ? '#22c55e' : 'var(--border)' }}
                  >
                    <div
                      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: temp[name] ? 'translateX(20px)' : 'translateX(4px)' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium leading-tight group-hover/toggle:text-[#22c55e] transition-colors">{icon} {label}</div>
                  <div className="text-xs mt-0.5 opacity-60 leading-snug">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Archived Chats section removed as per request */}
          {/* <div className="space-y-4"> ... </div> */}
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-black/10 dark:border-white/10 flex justify-end gap-3 rounded-b-2xl"
          style={{ background: 'var(--bg-card)' }}>
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 text-sm font-medium bg-[#22c55e] text-white rounded-xl shadow-md hover:bg-[#16a34a] transition-colors">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
