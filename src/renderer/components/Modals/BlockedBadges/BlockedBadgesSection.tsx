// components/BlockedBadges/BlockedBadgesSection.tsx
import React from "react";
import { Shield, Plus, Eye } from "lucide-react";
import { AddBlockedBadgeModal } from "./AddBlockedBadgeModal";
import { ViewBlockedBadgesModal } from "./ViewBlockedBadgesModal";
import { useModal } from "../../../hooks/useModal";
import Button from "../../UI/Button";

interface BlockedBadgesSectionProps {
  blockedBadges: string[];
  onAddBadge: (badge: string) => void;
  onRemoveBadge: (badge: string) => void;
}

export const BlockedBadgesSection: React.FC<BlockedBadgesSectionProps> = ({
  blockedBadges,
  onAddBadge,
  onRemoveBadge,
}) => {
  const addModal = useModal();
  const viewModal = useModal();

  const previewBadges = blockedBadges.slice(0, 3);
  const hasMore = blockedBadges.length > 3;

  return (
    <div className="border border-[var(--border-color)] rounded-lg p-3 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Blocked Badges
          </span>
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] px-1.5 py-0.5 rounded-full">
            {blockedBadges.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="xs"
            icon={Plus}
            iconOnly
            onClick={addModal.open}
            title="Add blocked badge"
            children={undefined}
          />
          <Button
            variant="ghost"
            size="xs"
            icon={Eye}
            iconOnly
            onClick={viewModal.open}
            title="View all blocked badges"
            disabled={blockedBadges.length === 0}
            children={undefined}
          />
        </div>
      </div>

      {blockedBadges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {previewBadges.map((badge) => (
            <span
              key={badge}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--btn-secondary-bg)] rounded-full text-xs"
            >
              {badge}
            </span>
          ))}
          {hasMore && (
            <span
              className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--primary-color)]"
              onClick={viewModal.open}
            >
              +{blockedBadges.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          No blocked badges. Click <Plus size={12} className="inline" /> to add.
        </p>
      )}

      <AddBlockedBadgeModal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        onAdd={onAddBadge}
      />
      <ViewBlockedBadgesModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        blockedBadges={blockedBadges}
        onRemove={onRemoveBadge}
      />
    </div>
  );
};
