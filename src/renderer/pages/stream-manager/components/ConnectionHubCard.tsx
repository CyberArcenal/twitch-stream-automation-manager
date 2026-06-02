import React from 'react';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { useStreamKey } from '../hooks/useStreamKey';

interface ConnectionHubCardProps {
  isLive: boolean;
  onRefresh: () => void;
}

const ConnectionHubCard: React.FC<ConnectionHubCardProps> = ({ isLive, onRefresh }) => {
  const { streamKey, setStreamKey, showKey, setShowKey, saveKey, copyKey, openDashboard } = useStreamKey();

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-lg border border-[var(--border-color)] min-w-[350px]">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Connection Hub</h3>
      <div className="mb-3">
        <label className="text-xs text-[var(--text-secondary)] block mb-1">Stream Key</label>
        <div className="flex gap-2">
          <input
            type={showKey ? 'text' : 'password'}
            value={streamKey}
            onChange={(e) => setStreamKey(e.target.value)}
            onBlur={saveKey}
            placeholder="Your stream key"
            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg px-2 py-1 text-sm text-[var(--text-primary)]"
          />
          <button onClick={() => setShowKey(!showKey)} className="px-2 py-1 bg-[var(--btn-secondary-bg)] rounded text-xs hover:bg-[var(--btn-secondary-hover)]">
            {showKey ? 'Hide' : 'Show'}
          </button>
          <button onClick={copyKey} className="px-2 py-1 bg-[#9147ff] rounded">
            <Copy className="w-4 h-4" />
          </button>
          <button onClick={openDashboard} className="px-2 py-1 bg-[var(--btn-secondary-bg)] rounded hover:bg-[var(--btn-secondary-hover)]">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
      <button onClick={onRefresh} className="w-full flex items-center justify-center gap-1 bg-[#9147ff] py-1.5 rounded-lg text-sm text-white">
        <RefreshCw className="w-3 h-3" /> I'm Live
      </button>
    </div>
  );
};

export default ConnectionHubCard;