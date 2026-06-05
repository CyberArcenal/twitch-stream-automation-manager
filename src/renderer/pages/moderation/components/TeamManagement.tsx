import React, { useState, useEffect } from "react";
import { Users, UserPlus, UserMinus, Search } from "lucide-react";
import { streamManagerAPI } from "../../../api/core/streamManager";
import { userAPI } from "../../../api/core/user";
import { dialogs } from "../../../utils/dialogs";

interface TeamManagementProps {
  broadcasterId: string;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ broadcasterId }) => {
  const [moderators, setModerators] = useState<any[]>([]);
  const [newModUsername, setNewModUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchModerators = async () => {
    try {
      const res = await streamManagerAPI.getModerators();
      if (res.status) setModerators(res.data || []);
    } catch (err) {
      console.error("Failed to fetch moderators", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, [broadcasterId]);

  const addModerator = async () => {
    if (!newModUsername.trim()) return;
    setError("");
    try {
      // First get user ID by username
      const userRes = await userAPI.getUserByName(newModUsername);
      if (!userRes.status || !userRes.data) {
        setError("User not found");
        return;
      }
      await streamManagerAPI.addModerator(userRes.data.id);
      setNewModUsername("");
      fetchModerators();
    } catch (err) {
      setError("Failed to add moderator");
      console.error(err);
    }
  };

  const removeModerator = async (userId: string, userName: string) => {
    if (!await dialogs.confirm({ title: `Remove ${userName} as moderator?` })) return;
    try {
      await streamManagerAPI.removeModerator(userId);
      fetchModerators();
    } catch (err) {
      console.error("Failed to remove moderator", err);
    }
  };

  if (loading) return <div className="bg-[var(--card-bg)] rounded-xl p-5 animate-pulse h-64"></div>;

  return (
   <div className="bg-[var(--card-bg)] rounded-xl shadow-md border border-[var(--border-color)] p-5 flex flex-col h-full min-h-[300px] max-h-[600px]">
    <div className="flex items-center gap-2 mb-4 flex-shrink-0">
      <Users className="w-5 h-5 text-[#9147ff]" />
      <h3 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">
        Team Management
      </h3>
      </div>

      {/* Add moderator */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newModUsername}
            onChange={(e) => setNewModUsername(e.target.value)}
            placeholder="Username to add as mod"
            className="flex-1 bg-[var(--background-color)] border border-[var(--card-bg)] rounded px-2 py-1 text-sm text-[var(--text-primary)]"
          />
          <button
            onClick={addModerator}
            className="px-3 py-1 bg-[var(--primary-color)] rounded-md text-sm flex items-center gap-1 text-white"
          >
            <UserPlus className="w-4 h-4" /> Add
          </button>
        </div>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>

      {/* Moderators list */}
       <div className="flex-1 overflow-y-auto min-h-0 space-y-2">
        {moderators.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] text-sm">No moderators yet</p>
        ) : (
          moderators.map((mod) => (
            <div
              key={mod.user_id}
              className="flex items-center justify-between p-2 rounded-lg bg-[#2a2a2e]/30"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--primary-color)]/20 flex items-center justify-center text-xs">
                  {mod.user_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-[var(--text-primary)]">{mod.user_name}</span>
              </div>
              <button
                onClick={() => removeModerator(mod.user_id, mod.user_name)}
                className="p-1 rounded hover:bg-red-500/20"
                title="Remove moderator"
              >
                <UserMinus className="w-4 h-4 text-red-400" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};