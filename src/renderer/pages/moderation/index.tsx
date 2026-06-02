import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { ChatFeed } from "./components/ChatFeed";
import { UserInfoPanel } from "./components/UserInfoPanel";
import { AutoModSettings } from "./components/AutoModSettings";
import { ModerationLogs } from "./components/ModerationLogs";
import { TeamManagement } from "./components/TeamManagement";
import LoadingSpinner from "../../components/Shared/LoadingSpinner";

const ModerationPage: React.FC = () => {
  const { user } = useAuth();
  const [broadcasterId, setBroadcasterId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  useEffect(() => {
    if (user?.id) setBroadcasterId(user.id);
  }, [user]);

  if (!broadcasterId) {
    return (
      <div className="flex items-center justify-center h-full">
    <LoadingSpinner/>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-[var(--background-color)] min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Moderation</h1>
        <p className="text-[var(--text-secondary)]">Manage chat, bans, and team</p>
      </div>

      {/* Main 2‑column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Chat feed + User info */}
        <div className="lg:col-span-2 space-y-6">
          <ChatFeed
            broadcasterId={broadcasterId}
            channelName={user?.login || ""}
            onSelectUser={(userId, userName) => {
              setSelectedUserId(userId);
              setSelectedUserName(userName);
            }}
          />
          {selectedUserId && (
            <UserInfoPanel
              broadcasterId={broadcasterId}
              userId={selectedUserId}
              userName={selectedUserName}
            />
          )}
        </div>

        {/* Right column: Settings, Logs, Team */}
        <div className="space-y-6">
          <AutoModSettings broadcasterId={broadcasterId} />
          <ModerationLogs broadcasterId={broadcasterId} />
          <TeamManagement broadcasterId={broadcasterId} />
        </div>
      </div>
    </div>
  );
};

export default ModerationPage;