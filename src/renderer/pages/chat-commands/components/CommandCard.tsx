import React from 'react';
import { Terminal, Power, PowerOff, Edit, Trash2, Clock, MessageSquare } from 'lucide-react';
import type { ChatCommand } from '../types';

interface CommandCardProps {
  name: string;
  command: ChatCommand;
  isBuiltIn: boolean;
  onEdit: (name: string, command: ChatCommand) => void;
  onDelete: (name: string) => void;
  onToggle: (name: string, enabled: boolean) => void;
}

const getActionLabel = (action: string) => {
  switch (action) {
    case 'shoutout': return 'Shoutout user';
    case 'clip': return 'Create clip';
    case 'lurk': return 'Lurk message';
    case 'uptime': return 'Stream uptime';
    case 'reply': return 'Custom reply';
    default: return action;
  }
};

export const CommandCard: React.FC<CommandCardProps> = ({
  name,
  command,
  isBuiltIn,
  onEdit,
  onDelete,
  onToggle,
}) => {
  return (
    <div className="group bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] hover:border-[#9147ff] transition-all duration-200 p-4 shadow-sm hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#9147ff]/10 text-[#9147ff]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono font-bold text-[var(--text-primary)]">{name}</span>
            {command.response && (
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate max-w-[180px]">
                "{command.response}"
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!isBuiltIn && (
            <button
              onClick={() => onEdit(name, command)}
              className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] transition"
              title="Edit"
            >
              <Edit className="w-4 h-4 text-[var(--text-secondary)]" />
            </button>
          )}
          {!isBuiltIn && (
            <button
              onClick={() => onDelete(name)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          )}
          <button
            onClick={() => onToggle(name, command.enabled)}
            className="p-1.5 rounded-lg hover:bg-[var(--input-bg)] transition"
            title={command.enabled ? 'Disable' : 'Enable'}
          >
            {command.enabled ? (
              <Power className="w-4 h-4 text-green-400" />
            ) : (
              <PowerOff className="w-4 h-4 text-red-400" />
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3 h-3 text-[var(--text-secondary)]" />
          <span className="text-[var(--text-secondary)]">Action:</span>
          <span className="text-[var(--text-primary)]">{getActionLabel(command.action)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
          <span className="text-[var(--text-secondary)]">Cooldown:</span>
          <span className="text-[var(--text-primary)]">{command.cooldown}s</span>
        </div>
      </div>
    </div>
  );
};