// src/renderer/pages/stream-manager/components/CommercialButton.tsx
import React, { useState, useEffect } from 'react';
import { Play, Settings } from 'lucide-react';
import { streamManagerAPI } from '../../../api/core/streamManager';
import { settingsAPI } from '../../../api/core/settings';

export const CommercialButton: React.FC<{ broadcasterId?: string }> = ({ broadcasterId }) => {
  const [length, setLength] = useState(30);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved commercial length from settings
    const load = async () => {
      const res = await settingsAPI.get('commercialLength');
      if (res.status && res.data) setLength(res.data);
    };
    load();
  }, []);

  const saveLength = async (newLength: number) => {
    setLength(newLength);
    await settingsAPI.set('commercialLength', newLength);
    setShowDropdown(false);
  };

  const runCommercial = async () => {
    if (!broadcasterId) return;
    setLoading(true);
    try {
      await streamManagerAPI.runCommercial(length);
      // Optional: show toast notification
    } catch (err) {
      console.error('Commercial failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={runCommercial}
        disabled={loading}
        className="flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? '...' : <Play className="w-4 h-4" />}
        Commercial
      </button>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="ml-1 p-1.5 hover:bg-[var(--input-bg)] rounded"
      >
        <Settings className="w-3 h-3" />
      </button>
      {showDropdown && (
        <div className="absolute right-0 mt-1 w-36 bg-[var(--card-bg)] border border-[var(--border-color)] rounded shadow-lg z-10">
          {[30, 60, 90, 120].map(sec => (
            <button
              key={sec}
              onClick={() => saveLength(sec)}
              className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-[var(--input-bg)] ${length === sec ? 'text-[#9147ff]' : 'text-[var(--text-primary)]'}`}
            >
              {sec} seconds
            </button>
          ))}
        </div>
      )}
    </div>
  );
};