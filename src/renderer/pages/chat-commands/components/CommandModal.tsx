import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { CommandFormData, ChatCommand } from '../types';

interface CommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CommandFormData) => void;
  initialData?: { name: string; command: ChatCommand } | null;
}

const emptyForm: CommandFormData = { name: '', response: '', cooldown: 0 };

export const CommandModal: React.FC<CommandModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = React.useState<CommandFormData>(emptyForm);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        response: initialData.command.response || '',
        cooldown: initialData.command.cooldown,
      });
    } else {
      setFormData(emptyForm);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.response.trim()) return;
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md shadow-2xl border border-[var(--border-color)]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-[var(--border-color)]">
          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
            {initialData ? 'Edit Command' : 'New Custom Command'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[var(--input-bg)]">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Command name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., !discord"
              disabled={!!initialData}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] font-mono focus:outline-none focus:ring-1 focus:ring-[#9147ff] disabled:opacity-50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Reply message <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.response}
              onChange={(e) => setFormData({ ...formData, response: e.target.value })}
              placeholder="e.g., Join our Discord: discord.gg/example"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
              Cooldown (seconds)
            </label>
            <input
              type="number"
              value={formData.cooldown}
              onChange={(e) => setFormData({ ...formData, cooldown: Number(e.target.value) })}
              min="0"
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">0 = no cooldown</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-[var(--input-bg)] hover:bg-[var(--border-color)] transition">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-[#9147ff] hover:bg-[#772ce8] transition text-white font-medium">
              {initialData ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};