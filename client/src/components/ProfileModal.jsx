import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, profile, updateProfile, showPopup }) {
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
    if (showPopup) showPopup('✅ Profile Updated Successfully', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-sm rounded-2xl shadow-xl border border-black/10 dark:border-white/10 overflow-hidden flex flex-col max-h-[85vh]"
        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black/10 dark:border-white/10">
          <h2 className="text-lg font-bold bg-gradient-to-r from-[#4ade80] to-[#22c55e] bg-clip-text text-transparent">
            👤 User Profile
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 pb-20 scrollbar-hide space-y-4">
          {/* Avatar preview */}
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {temp.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 opacity-80">Username</label>
            <input
              type="text" name="username" value={temp.username} onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Age</label>
              <input
                type="number" name="age" value={temp.age} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Gender</label>
              <select
                name="gender" value={temp.gender} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Height (cm)</label>
              <input
                type="number" name="height" value={temp.height} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5 opacity-80">Weight (kg)</label>
              <input
                type="number" name="weight" value={temp.weight} onChange={handleChange}
                className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1.5 opacity-80">Fitness Goal</label>
            <select
              name="goal" value={temp.goal} onChange={handleChange}
              className="w-full px-3 py-2 text-sm bg-black/5 dark:bg-white/5 border border-transparent focus:border-[#22c55e] rounded-xl outline-none transition-colors"
            >
              <option value="Lose weight">Lose weight</option>
              <option value="Maintain">Maintain</option>
              <option value="Gain muscle">Gain muscle</option>
            </select>
          </div>
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
