// src/renderer/pages/stream-manager/components/ViewerListCard.tsx
import React from 'react';
import { Users } from 'lucide-react';
import { useViewerList } from '../hooks/useViewerList';

interface ViewerListCardProps {
  broadcasterId: string;
  moderatorId: string;
  isLive: boolean;
}

export const ViewerListCard: React.FC<ViewerListCardProps> = ({ broadcasterId, moderatorId, isLive }) => {
  const { viewers, refresh } = useViewerList(broadcasterId, moderatorId, isLive);

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] p-3 max-h-[110px] h-full">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Viewers ({viewers.length})</h3>
        </div>
        <button onClick={refresh} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          Refresh
        </button>
      </div>
      {!isLive ? (
        <p className="text-xs text-[var(--text-secondary)] text-center">Stream offline</p>
      ) : viewers.length === 0 ? (
        <p className="text-xs text-[var(--text-secondary)] text-center">No viewers or insufficient scope</p>
      ) : (
        <div className="max-h-40 overflow-y-auto text-xs space-y-1">
          {viewers.map((name) => (
            <div key={name} className="text-[var(--text-primary)]">{name}</div>
          ))}
        </div>
      )}
    </div>
  );
};