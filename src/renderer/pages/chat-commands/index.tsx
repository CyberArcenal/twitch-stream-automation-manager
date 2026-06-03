import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useChatCommands } from './hooks/useChatCommands';
import { CommandCard } from './components/CommandCard';
import { CommandModal } from './components/CommandModal';
import { CommandEmptyState } from './components/CommandEmptyState';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';
import type { ChatCommand, CommandFormData } from './types';

const BUILT_IN_COMMANDS = ['!so', '!clip', '!lurk', '!uptime'];

const ChatCommandsPage: React.FC = () => {
  const { commands, loading, addCommand, updateCommand, deleteCommand, toggleEnabled } = useChatCommands();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCommand, setEditingCommand] = useState<{ name: string; command: ChatCommand } | null>(null);

  const handleEdit = (name: string, command: ChatCommand) => {
    setEditingCommand({ name, command });
    setModalOpen(true);
  };

  const handleSave = async (data: CommandFormData) => {
    if (editingCommand) {
      await updateCommand(editingCommand.name, { response: data.response, cooldown: data.cooldown });
    } else {
      await addCommand(data.name, data.response, data.cooldown);
    }
    setEditingCommand(null);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingCommand(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Chat Commands</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Customize built‑in commands and add your own text replies
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#9147ff] rounded-lg hover:bg-[#772ce8] transition shadow-md"
        >
          <Plus className="w-4 h-4" /> Add Command
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {Object.entries(commands).length === 0 ? (
          <CommandEmptyState />
        ) : (
          Object.entries(commands).map(([name, cmd]) => (
            <CommandCard
              key={name}
              name={name}
              command={cmd}
              isBuiltIn={BUILT_IN_COMMANDS.includes(name)}
              onEdit={handleEdit}
              onDelete={deleteCommand}
              onToggle={toggleEnabled}
            />
          ))
        )}
      </div>

      <CommandModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        initialData={editingCommand}
      />
    </div>
  );
};

export default ChatCommandsPage;