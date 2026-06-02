import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { shortcutAPI } from '../../api/core/shortcut';

export const ShortcutsOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchShortcuts = async () => {
      const res = await shortcutAPI.getShortcuts();
      if (res.status) setShortcuts(res.data);
    };
    fetchShortcuts();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const shortcutActions: Record<string, string> = {
    playpause: 'Play / Pause',
    play: 'Play',
    pause: 'Pause',
    nextChannel: 'Next Channel',
    previousChannel: 'Previous Channel',
    mute: 'Mute',
    volumeUp: 'Volume Up',
    volumeDown: 'Volume Down',
    fullscreen: 'Fullscreen',
    closePlayer: 'Close Player',
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
      <div className="bg-[var(--card-bg)] rounded-xl p-6 max-w-md w-full border border-[var(--border-color)]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Keyboard Shortcuts</h2>
          <button onClick={() => setIsOpen(false)} className="text-[var(--text-secondary)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {Object.entries(shortcuts).map(([action, accelerator]) => (
            <div key={action} className="flex justify-between text-sm">
              <span className="text-[var(--text-primary)]">{shortcutActions[action] || action}</span>
              <kbd className="px-2 py-1 bg-[var(--btn-secondary-bg)] rounded text-xs font-mono">{accelerator}</kbd>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-[var(--text-secondary)] text-center">
          Press <kbd className="px-1 bg-[var(--btn-secondary-bg)] rounded">?</kbd> to show this overlay again.
        </div>
      </div>
    </div>
  );
};