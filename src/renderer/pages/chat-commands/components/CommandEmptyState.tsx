import React from 'react';
import { Terminal } from 'lucide-react';

export const CommandEmptyState: React.FC = () => (
  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
    <Terminal className="w-16 h-16 text-[var(--text-secondary)] opacity-40 mb-4" />
    <p className="text-[var(--text-secondary)] text-lg">No custom commands yet</p>
    <p className="text-sm text-[var(--text-tertiary)]">Click "Add Command" to create one</p>
  </div>
);