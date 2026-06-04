// components/BlockedBadges/ViewBlockedBadgesModal.tsx
import React from "react";
import { Trash2 } from "lucide-react";
import Modal from "../../UI/Modal";
import Button from "../../UI/Button";

interface ViewBlockedBadgesModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedBadges: string[];
  onRemove: (badge: string) => void;
}

export const ViewBlockedBadgesModal: React.FC<ViewBlockedBadgesModalProps> = ({
  isOpen,
  onClose,
  blockedBadges,
  onRemove,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Blocked Badges (${blockedBadges.length})`}
      size="md"
      showCloseButton
      closeOnEsc
      closeOnClickOutside
      minHeight="min-h-[300px]"
    >
      {blockedBadges.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          No blocked badges yet. Click "Add" to create one.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {blockedBadges.map((badge) => (
            <div
              key={badge}
              className="flex items-center justify-between bg-[var(--card-secondary-bg)] rounded-md px-3 py-2"
            >
              <span className="text-sm text-[var(--text-primary)] break-all">
                {badge}
              </span>
              <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      iconOnly
                      onClick={() => onRemove(badge)}
                      className="text-red-400 hover:text-red-500 hover:bg-red-500/10"
                      title="Remove" children={undefined}              />
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
};