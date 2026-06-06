import React, { useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  ExternalLink,
  Loader2,
  Search,
  Shield,
} from "lucide-react";
import { useCollaboration } from "../hooks/useCollaboration";
import { dialogs } from "../../../utils/dialogs";

interface collaborationProps {
  className?: string;
}

const CollaborationCard: React.FC<collaborationProps> = ({
  className
}) => {
  const {
    moderators,
    loading,
    error,
    addModeratorByUsername,
    removeModeratorById,
    refreshModerators,
    streamTogetherUrl,
  } = useCollaboration();

  const [newModUsername, setNewModUsername] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filter moderators based on search term
  const filteredModerators = useMemo(() => {
    if (!searchTerm.trim()) return moderators;
    const term = searchTerm.toLowerCase();
    return moderators.filter(
      (mod) =>
        mod.user_name.toLowerCase().includes(term) ||
        mod.user_login.toLowerCase().includes(term),
    );
  }, [moderators, searchTerm]);

  const handleAddModerator = async () => {
    if (!newModUsername.trim()) return;
    setAdding(true);
    try {
      await addModeratorByUsername(newModUsername);
      setNewModUsername("");
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

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshModerators();
    } finally {
      setRefreshing(false);
    }
  };

  const openStreamTogether = () => {
    if (streamTogetherUrl) {
      window.backendAPI.openExternal(streamTogetherUrl);
    }
  };

  return (
    <div
      className={`bg-[var(--card-bg)] rounded-xl shadow-lg border border-[var(--border-color)] flex flex-col overflow-hidden min-w-[350px] min-h-[200px] ${className ? className : ""}`}
    >
      <div className="p-3 border-b border-[var(--border-color)] flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#9147ff]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Collaboration
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1 rounded hover:bg-[var(--btn-secondary-bg)] disabled:opacity-50"
            title="Refresh moderators"
          >
            <Loader2
              className={`w-3 h-3 text-[var(--text-secondary)] ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
          {streamTogetherUrl && (
            <button
              onClick={openStreamTogether}
              className="flex items-center gap-1 bg-[var(--btn-secondary-bg)] px-2 py-1 rounded text-xs hover:bg-[var(--btn-secondary-hover)]"
            >
              <ExternalLink className="w-3 h-3" /> Stream Together
            </button>
          )}
        </div>
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
            className="p-1 bg-[var(--primary-color)] rounded hover:bg-[#772ce8] disabled:opacity-50"
          >
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search moderators..."
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded pl-7 pr-2 py-1 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)]"
          />
        </div>

        {/* Moderator list */}
        {loading && (
          <div className="text-center text-[var(--text-secondary)] text-sm">
            Loading moderators...
          </div>
        )}
        {error && (
          <div className="text-center text-red-400 text-sm">{error}</div>
        )}
        {!loading && filteredModerators.length === 0 && (
          <div className="text-center text-[var(--text-secondary)] text-sm">
            {searchTerm ? "No matching moderators" : "No moderators yet"}
          </div>
        )}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {filteredModerators.map((mod) => (
            <div
              key={mod.user_id}
              className="flex items-center justify-between bg-[var(--input-bg)] p-2 rounded"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#9147ff]" />
                <span className="text-sm text-[var(--text-primary)]">
                  {mod.user_name}
                </span>
                <span className="text-[10px] bg-[var(--btn-secondary-bg)] px-1 rounded text-[var(--text-secondary)]">
                  Moderator
                </span>
              </div>
              <button
                onClick={() => handleRemoveModerator(mod.user_id)}
                disabled={removingId === mod.user_id}
                className="text-red-400 hover:text-red-300 disabled:opacity-50"
              >
                {removingId === mod.user_id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollaborationCard;
