import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

export default function QuickPopup({ message, type = 'success', isOpen, onClose, duration = 3000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  if (!isOpen && !visible) return null;

  return (
    <div 
      className={clsx(
        "fixed top-6 left-1/2 -translate-x-1/2 z-[100000] flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300",
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none",
        type === 'success' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-red-500/10 border-red-500/20 text-red-500"
      )}
    >
      {type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="text-sm font-semibold tracking-tight">{message}</span>
      <button onClick={handleClose} className="ml-2 hover:opacity-70 transition-opacity">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
