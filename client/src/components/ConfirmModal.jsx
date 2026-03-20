import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", type = "danger" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={onClose} 
      />

      {/* Modal Card */}
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-[#0a0a0a] rounded-3xl border border-black/10 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 fade-in duration-200"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <Trash2 className="w-8 h-8 text-red-500" />
          </div>
          
          <h3 className="text-xl font-bold mb-2 text-red-500">{title}</h3>
          <p className="text-sm opacity-60 leading-relaxed mb-8">
            {message}
          </p>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-sm font-semibold rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-black/5 dark:border-white/5"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-95"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
