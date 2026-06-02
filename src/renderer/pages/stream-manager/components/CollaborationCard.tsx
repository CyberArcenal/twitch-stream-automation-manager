import React, { useState } from 'react';
import { Users, UserPlus, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { useCollaboration } from '../hooks/useCollaboration';
import { dialogs } from '../../../utils/dialogs';

const CollaborationCard: React.FC = () => {
  const {
    moderators,
    loading,
    error,
    addModeratorByUsername,
    removeModeratorById,
    refreshModerators,
    streamTogetherUrl,
  } = useCollaboration();

  const [newModUsername, setNewModUsername] = useState('');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleAddModerator = async () => {
    if (!newModUsername.trim()) return;
    setAdding(true);
    try {
      await addModeratorByUsername(newModUsername);
      setNewModUsername('');
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveModerator = async (userId: string) => {
    setRemovingId(userId);
    try {
      await removeModeratorById(userId);
    } catch (err: any) {
      dialogs.error(err.message);
    } finally {
      setRemovingId(null);
    }
  };

  const openStreamTogether = () => {
    if (streamTogetherUrl) {
      window.backendAPI.openExternal(streamTogetherUrl);
    }
  };

  return (
    <div className="bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden min-w-[300px]">
      <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Collaboration</h3>
        </div>
        {streamTogetherUrl && (
          <button
            onClick={openStreamTogether}
            className="flex items-center gap-1 bg-[var(--btn-secondary-bg)] px-2 py-1 rounded text-xs hover:bg-[var(--btn-secondary-hover)]"
          >
            <ExternalLink className="w-3 h-3" /> Stream Together
          </button>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Add moderator */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newModUsername}
            onChange={(e) => setNewModUsername(e.target.value)}
            placeholder="Twitch username"
            className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
            disabled={adding}
          />
          <button
            onClick={handleAddModerator}
            disabled={adding || !newModUsername.trim()}
            className="p-1 bg-[#9147ff] rounded hover:bg-[#772ce8] disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          </button>
        </div>

        {/* Moderator list */}
        {loading && <div className="text-center text-[var(--text-secondary)] text-sm">Loading moderators...</div>}
        {error && <div className="text-center text-red-400 text-sm">{error}</div>}
        {!loading && moderators.length === 0 && (
          <div className="text-center text-[var(--text-secondary)] text-sm">No moderators yet</div>
        )}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {moderators.map((mod) => (
            <div key={mod.user_id} className="flex items-center justify-between bg-[var(--input-bg)] p-2 rounded">
              <span className="text-sm text-[var(--text-primary)]">{mod.user_name}</span>
              <button
                onClick={() => handleRemoveModerator(mod.user_id)}
                disabled={removingId === mod.user_id}
                className="text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {removingId === mod.user_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollaborationCard;