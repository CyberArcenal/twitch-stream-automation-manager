import React, { useState, useEffect } from "react";
import { Terminal, Plus, Trash2, Power, PowerOff, Clock } from "lucide-react";
import { chatCommandsAPI, type ChatCommand } from "../../api/core/chatCommands";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";
import { dialogs } from "../../utils/dialogs";

const ChatCommandsPage: React.FC = () => {
  const [commands, setCommands] = useState<Record<string, ChatCommand>>({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCommand, setNewCommand] = useState({ name: "", action: "", cooldown: 0 });

  const fetchCommands = async () => {
    try {
      const res = await chatCommandsAPI.getCommands();
      if (res.status) setCommands(res.data);
    } catch (err) {
      console.error("Failed to fetch commands", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommands();
  }, []);

  const handleToggle = async (cmdName: string, currentEnabled: boolean) => {
    await chatCommandsAPI.setCommandEnabled(cmdName, !currentEnabled);
    fetchCommands();
  };

  const handleDelete = async (cmdName: string) => {
    if (await dialogs.confirm({title: `Delete command "${cmdName}"?`})) {
      await chatCommandsAPI.removeCommand(cmdName);
      fetchCommands();
    }
  };

  const handleAdd = async () => {
    if (!newCommand.name.trim() || !newCommand.action.trim()) return;
    await chatCommandsAPI.addCommand(newCommand.name, newCommand.action, newCommand.cooldown);
    setShowAddModal(false);
    setNewCommand({ name: "", action: "", cooldown: 0 });
    fetchCommands();
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "shoutout": return "Shoutout (!so)";
      case "clip": return "Create Clip";
      case "lurk": return "Lurk message";
      case "uptime": return "Stream uptime";
      default: return action;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
     <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Chat Bot Commands</h1>
          <p className="text-[var(--text-secondary)]">Manage custom chat commands and built‑in behaviors</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#9147ff] rounded-lg hover:bg-[#772ce8] transition"
        >
          <Plus className="w-4 h-4" /> Add Command
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(commands).map(([cmdName, cmd]) => (
          <div key={cmdName} className="bg-[var(--card-bg)] rounded-xl border border-[var(--card-bg)] p-4 hover:border-[#9147ff] transition">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#9147ff]" />
                <span className="font-mono font-bold text-[var(--text-primary)]">{cmdName}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleToggle(cmdName, cmd.enabled)} className="p-1 rounded hover:bg-[#2a2a2e]">
                  {cmd.enabled ? <Power className="w-4 h-4 text-green-400" /> : <PowerOff className="w-4 h-4 text-red-400" />}
                </button>
                {!["!so", "!clip", "!lurk", "!uptime"].includes(cmdName) && (
                  <button onClick={() => handleDelete(cmdName)} className="p-1 rounded hover:bg-red-500/20">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <div className="text-[var(--text-primary)]">
                <span className="text-[var(--text-secondary)]">Action:</span> {getActionLabel(cmd.action)}
              </div>
              <div className="text-[var(--text-primary)] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                <span className="text-[var(--text-secondary)]">Cooldown:</span> {cmd.cooldown}s
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Command Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] rounded-xl w-full max-w-md p-6 border border-[var(--card-bg)]">
            <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Add Custom Command</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Command Name (e.g., !hello)</label>
                <input
                  type="text"
                  value={newCommand.name}
                  onChange={(e) => setNewCommand({ ...newCommand, name: e.target.value })}
                  placeholder="!hello"
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)] font-mono"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Action (message to send)</label>
                <input
                  type="text"
                  value={newCommand.action}
                  onChange={(e) => setNewCommand({ ...newCommand, action: e.target.value })}
                  placeholder="Hello world!"
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">Cooldown (seconds)</label>
                <input
                  type="number"
                  value={newCommand.cooldown}
                  onChange={(e) => setNewCommand({ ...newCommand, cooldown: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="w-full bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-3 py-2 text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-[#2a2a2e] rounded-md">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-[#9147ff] rounded-md">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatCommandsPage;