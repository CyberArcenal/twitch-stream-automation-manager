import React from "react";
import { Shield, Ban, Link } from "lucide-react";

interface ChatAutomationRulesProps {
  autoSlowMode: boolean;
  onToggleAutoSlowMode: () => void;
  slowModeSpamThreshold: number;
  onSlowModeSpamThresholdChange: (value: number) => void;
  slowModeWaitTime: number;
  onSlowModeWaitTimeChange: (value: number) => void;
  autoDeleteMessage: boolean;
  onToggleAutoDeleteMessage: () => void;
  autoTimeoutUser: boolean;
  onToggleAutoTimeout: () => void;
  autoFollowerMode: boolean;
  onToggleAutoFollowerMode: () => void;
  followerModeDuration: number;
  onFollowerModeDurationChange: (value: number) => void;
  autoBlockLinks: boolean;
  onToggleAutoBlockLinks: () => void;
  blockedTerms: string[];
  onAddBlockedTerm: (term: string) => void;
  onRemoveBlockedTerm: (term: string) => void;
  newTerm: string;
  onNewTermChange: (value: string) => void;
  autoModerationEnabled: boolean;
  onToggleAutoModeration: () => void;
}

export const ChatAutomationRules: React.FC<ChatAutomationRulesProps> = ({
  autoSlowMode,
  onToggleAutoSlowMode,
  slowModeSpamThreshold,
  onSlowModeSpamThresholdChange,
  slowModeWaitTime,
  onSlowModeWaitTimeChange,
  autoDeleteMessage,
  onToggleAutoDeleteMessage,
  autoTimeoutUser,
  onToggleAutoTimeout,
  autoFollowerMode,
  onToggleAutoFollowerMode,
  followerModeDuration,
  onFollowerModeDurationChange,
  autoBlockLinks,
  onToggleAutoBlockLinks,
  blockedTerms,
  onAddBlockedTerm,
  onRemoveBlockedTerm,
  newTerm,
  onNewTermChange,
  autoModerationEnabled,
  onToggleAutoModeration,
}) => {
  const handleAddTerm = () => {
    if (!newTerm.trim()) return;
    onAddBlockedTerm(newTerm.trim().toLowerCase());
    onNewTermChange("");
  };

  return (
    <div>
      <h4 className="text-xs font-medium text-[var(--text-secondary)] uppercase mb-2 flex items-center gap-1">
        <Shield className="w-3 h-3" /> Chat Automation
      </h4>
      <div className="space-y-3">
        {/* Auto slow mode */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">Auto‑enable Slow Mode on spam</span>
          <button
            onClick={onToggleAutoSlowMode}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoSlowMode ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoSlowMode ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {autoSlowMode && (
          <div className="ml-6 space-y-2">
            <div className="flex justify-between text-xs">
              <span>Spam threshold (messages per minute)</span>
              <input
                type="number"
                value={slowModeSpamThreshold}
                onChange={(e) => onSlowModeSpamThresholdChange(Number(e.target.value))}
                className="w-16 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1 text-center"
              />
            </div>
            <div className="flex justify-between text-xs">
              <span>Slow mode wait time (seconds)</span>
              <select
                value={slowModeWaitTime}
                onChange={(e) => onSlowModeWaitTimeChange(Number(e.target.value))}
                className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
              >
                <option value={5}>5 sec</option>
                <option value={10}>10 sec</option>
                <option value={30}>30 sec</option>
              </select>
            </div>
          </div>
        )}

        {/* Auto-delete */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
            <Ban className="w-3 h-3" /> Auto‑delete messages containing blocked terms
          </span>
          <button
            onClick={onToggleAutoDeleteMessage}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoDeleteMessage ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoDeleteMessage ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Timeout user */}
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-[var(--text-primary)]">Timeout user</span>
          <button
            onClick={onToggleAutoTimeout}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoTimeoutUser ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoTimeoutUser ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Auto follower mode on raid */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)]">Auto‑enable Follower Mode during raid</span>
          <button
            onClick={onToggleAutoFollowerMode}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoFollowerMode ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoFollowerMode ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {autoFollowerMode && (
          <div className="ml-6">
            <div className="flex justify-between text-xs">
              <span>Follower mode duration (minutes)</span>
              <input
                type="number"
                value={followerModeDuration}
                onChange={(e) => onFollowerModeDurationChange(Number(e.target.value))}
                className="w-20 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-1"
              />
            </div>
          </div>
        )}

        {/* Auto-block links */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-primary)] flex items-center gap-1">
            <Link className="w-3 h-3" /> Auto‑block messages containing links
          </span>
          <button
            onClick={onToggleAutoBlockLinks}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoBlockLinks ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoBlockLinks ? "translate-x-5" : ""}`} />
          </button>
        </div>

        {/* Blocked terms list */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Ban className="w-3 h-3 text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Blocked terms</span>
          </div>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => onNewTermChange(e.target.value)}
              placeholder="Add a word or phrase"
              className="flex-1 bg-[var(--input-bg)] border border-[var(--input-border)] rounded px-2 py-1 text-sm"
            />
            <button onClick={handleAddTerm} className="px-2 py-1 bg-[var(--primary-color)] rounded text-xs">
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1 max-h-10 overflow-y-auto">
            {blockedTerms.map((term) => (
              <span
                key={term}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--btn-secondary-bg)] rounded-full text-xs"
              >
                {term}
                <button onClick={() => onRemoveBlockedTerm(term)} className="hover:text-red-400">
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Master toggle for Chat Auto-Moderation */}
        <div className="flex items-center justify-between border-t border-[var(--border-color)] pt-3 mt-3">
          <span className="text-sm font-medium text-[var(--text-primary)] flex items-center gap-1">
            <Shield className="w-4 h-4" /> Chat Auto‑Moderation (Master)
          </span>
          <button
            onClick={onToggleAutoModeration}
            className={`relative w-10 h-5 rounded-full transition-colors bg-[var(--input-border)] ${autoModerationEnabled ? "bg-[var(--primary-color)]" : "bg-[var(--input-border)]"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${autoModerationEnabled ? "translate-x-5" : ""}`} />
          </button>
        </div>
        {/* {autoModerationEnabled && (
          <div className="ml-4 space-y-2 text-xs text-[var(--text-secondary) overflow-y-scroll">
            <p>✓ Auto‑delete messages with blocked terms</p>
            <p>✓ Timeout users who violate rules</p>
            <p>✓ Block links (if enabled above)</p>
          </div>
        )} */}
      </div>
    </div>
  );
};