import React from 'react';
import { Calendar, Edit, Trash2, Power, PowerOff, Clock, Tag, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import type { ScheduledEvent } from '../types';

interface ScheduleCardProps {
  schedule: ScheduledEvent;
  onEdit: (schedule: ScheduledEvent) => void;
  onDelete: (id: string) => void;
  onToggle: (schedule: ScheduledEvent) => void;
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'runCommercial': return <Monitor className="w-4 h-4" />;
    case 'updateStreamInfo': return <Tag className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'runCommercial': return 'Run Commercial';
    case 'updateStreamInfo': return 'Update Stream Info';
    default: return action;
  }
};

export const ScheduleCard: React.FC<ScheduleCardProps> = ({ schedule, onEdit, onDelete, onToggle }) => {
  return (
    <div className="group bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] hover:border-[#9147ff] transition-all duration-200 p-4 shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#9147ff]/10 text-[#9147ff]">
            {getActionIcon(schedule.action)}
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)] capitalize">{schedule.type}</h3>
            <p className="text-xs text-[var(--text-secondary)]">{getActionLabel(schedule.action)}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(schedule)}
            className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] transition"
            title="Edit"
          >
            <Edit className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
          <button
            onClick={() => onDelete(schedule.id)}
            className="p-1.5 rounded-lg hover:bg-red-500/20 transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
          </button>
          <button
            onClick={() => onToggle(schedule)}
            className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] transition"
            title={schedule.enabled ? 'Disable' : 'Enable'}
          >
            {schedule.enabled ? (
              <Power className="w-4 h-4 text-green-400" />
            ) : (
              <PowerOff className="w-4 h-4 text-red-400" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-[var(--text-primary)] font-mono text-xs">{schedule.cronPattern}</span>
        </div>

        {schedule.params.title && (
          <div className="text-sm truncate">
            <span className="text-[var(--text-secondary)]">Title:</span>{' '}
            <span className="text-[var(--text-primary)]">{schedule.params.title}</span>
          </div>
        )}
        {schedule.params.game_id && (
          <div className="text-sm truncate">
            <span className="text-[var(--text-secondary)]">Game ID:</span>{' '}
            <span className="text-[var(--text-primary)]">{schedule.params.game_id}</span>
          </div>
        )}
        {schedule.params.length && (
          <div className="text-sm">
            <span className="text-[var(--text-secondary)]">Length:</span>{' '}
            <span className="text-[var(--text-primary)]">{schedule.params.length}s</span>
          </div>
        )}

        <div className="text-xs text-[var(--text-tertiary)] pt-1 border-t border-[var(--border-color)]">
          Created {format(new Date(schedule.createdAt), 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  );
};