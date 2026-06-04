// components/BlockedBadges/AddBlockedBadgeModal.tsx
import React, { useState } from "react";
import Modal from "../../UI/Modal";
import Button from "../../UI/Button";

interface AddBlockedBadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (badge: string) => void;
}

export const AddBlockedBadgeModal: React.FC<AddBlockedBadgeModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [badge, setBadge] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (badge.trim()) {
      onAdd(badge.trim().toLowerCase());
      setBadge("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Blocked Badge"
      size="sm"
      showCloseButton
      closeOnEsc
      closeOnClickOutside
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Badge name
          </label>
          <input
            type="text"
            value={badge}
            onChange={(e) => setBadge(e.target.value)}
            placeholder="e.g., troll, known_spammer, bot"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
            autoFocus
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Users with this badge will be automatically timed out.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!badge.trim()}
          >
            Add Badge
          </Button>
        </div>
      </form>
    </Modal>
  );
};
