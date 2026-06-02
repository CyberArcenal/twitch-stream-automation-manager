import React from 'react';
import { Monitor } from 'lucide-react';
import { useOBSConnection } from '../hooks/useOBSConnection';

interface ConnectedSoftwareCardProps {
  isLive: boolean;
}

const ConnectedSoftwareCard: React.FC<ConnectedSoftwareCardProps> = () => {
  const { isConnected, softwareName } = useOBSConnection();

  return (
    <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-lg border border-[var(--card-bg)] min-w-[350px]">
      <div className="flex items-center gap-2">
        <Monitor className="w-4 h-4 text-green-400" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Connected Software</h3>
        <span className={`ml-auto text-xs ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
          {isConnected ? '● Connected' : '● Not connected'}
        </span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mt-2">
        {isConnected ? `${softwareName} • Streaming to Twitch` : 'No streaming software detected'}
      </p>
    </div>
  );
};

export default ConnectedSoftwareCard;