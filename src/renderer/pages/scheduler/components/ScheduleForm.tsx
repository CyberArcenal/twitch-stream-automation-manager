import React from 'react';
import type { ScheduleFormData } from '../types';

interface ScheduleFormProps {
  formData: ScheduleFormData;
  onChange: (data: ScheduleFormData) => void;
}

const CRON_PRESETS = [
  { label: 'Every 30 minutes', value: 'every 30 minutes' },
  { label: 'Every 1 hour', value: 'every 1 hour' },
  { label: 'Every 2 hours', value: 'every 2 hours' },
  { label: 'Daily at 09:00', value: 'daily at 09:00' },
  { label: 'Daily at 15:30', value: 'daily at 15:30' },
  { label: 'Daily at 20:00', value: 'daily at 20:00' },
  { label: 'Custom', value: 'custom' },
];

export const ScheduleForm: React.FC<ScheduleFormProps> = ({ formData, onChange }) => {
  const [customCron, setCustomCron] = React.useState(formData.cronPattern);
  const [selectedPreset, setSelectedPreset] = React.useState(() => {
    if (CRON_PRESETS.some(p => p.value === formData.cronPattern)) return formData.cronPattern;
    return 'custom';
  });

  const updateField = (field: keyof ScheduleFormData, value: any) => {
    onChange({ ...formData, [field]: value });
  };

  const updateParams = (key: string, value: any) => {
    onChange({ ...formData, params: { ...formData.params, [key]: value } });
  };

  const handlePresetChange = (presetValue: string) => {
    setSelectedPreset(presetValue);
    if (presetValue !== 'custom') {
      updateField('cronPattern', presetValue);
    } else {
      updateField('cronPattern', customCron);
    }
  };

  const handleCustomCronChange = (val: string) => {
    setCustomCron(val);
    if (selectedPreset === 'custom') {
      updateField('cronPattern', val);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Type</label>
        <select
          value={formData.type}
          onChange={(e) => updateField('type', e.target.value as 'stream' | 'commercial')}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[#9147ff]"
        >
          <option value="stream">Stream Event</option>
          <option value="commercial">Commercial</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Schedule Pattern</label>
        <select
          value={selectedPreset}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)] mb-2"
        >
          {CRON_PRESETS.map(preset => (
            <option key={preset.value} value={preset.value}>{preset.label}</option>
          ))}
        </select>
        {selectedPreset === 'custom' && (
          <input
            type="text"
            value={customCron}
            onChange={(e) => handleCustomCronChange(e.target.value)}
            placeholder="e.g., every 10 minutes, daily at 14:00"
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
          />
        )}
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Examples: "every 30 minutes", "every 1 hour", "daily at 15:30"
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Action</label>
        <select
          value={formData.action}
          onChange={(e) => updateField('action', e.target.value as 'updateStreamInfo' | 'runCommercial')}
          className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
        >
          <option value="runCommercial">Run Commercial</option>
          <option value="updateStreamInfo">Update Stream Info</option>
        </select>
      </div>

      {formData.action === 'runCommercial' && (
        <div>
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Commercial Length (seconds)</label>
          <select
            value={formData.params?.length || 30}
            onChange={(e) => updateParams('length', parseInt(e.target.value))}
            className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
          >
            <option value={30}>30 seconds</option>
            <option value={60}>60 seconds</option>
            <option value={90}>90 seconds (partner only)</option>
            <option value={120}>120 seconds (partner only)</option>
          </select>
        </div>
      )}

      {formData.action === 'updateStreamInfo' && (
        <>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Stream Title</label>
            <input
              type="text"
              value={formData.params?.title || ''}
              onChange={(e) => updateParams('title', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              placeholder="New stream title..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Game ID (optional)</label>
            <input
              type="text"
              value={formData.params?.game_id || ''}
              onChange={(e) => updateParams('game_id', e.target.value)}
              className="w-full bg-[var(--input-bg)] border border-[var(--border-color)] rounded-lg px-3 py-2 text-[var(--text-primary)]"
              placeholder="e.g., 509658 (Just Chatting)"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Find game ID from Twitch or leave empty to keep current game</p>
          </div>
        </>
      )}
    </div>
  );
};