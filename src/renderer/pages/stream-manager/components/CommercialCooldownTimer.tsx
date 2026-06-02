import React, { useState, useEffect } from 'react';
import { Timer } from 'lucide-react';
import { streamManagerAPI } from '../../../api/core/streamManager';

export const CommercialCooldownTimer: React.FC = () => {
  const [remainingMs, setRemainingMs] = useState(0);

  const updateRemaining = async () => {
    try {
      const res = await streamManagerAPI.getCommercialCooldown();
      if (res.status) setRemainingMs(res.data);
    } catch (err) {
      console.error('Failed to get commercial cooldown', err);
    }
  };

  useEffect(() => {
    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Ready';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-between text-xs bg-[var(--input-bg)] p-2 rounded-lg mb-3">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-[#9147ff]" />
        <span className="text-[var(--text-secondary)]">Next ad in:</span>
      </div>
      <span className="font-mono text-[var(--text-primary)] font-semibold">
        {formatTime(remainingMs)}
      </span>
    </div>
  );
};