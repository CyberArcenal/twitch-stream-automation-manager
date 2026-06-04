// components/BlockedWords/ViewBlockedWordsModal.tsx
import React from "react";
import { Trash2 } from "lucide-react";
import Modal from "../../UI/Modal";
import Button from "../../UI/Button";

interface ViewBlockedWordsModalProps {
  isOpen: boolean;
  onClose: () => void;
  blockedTerms: string[];
  onRemove: (term: string) => void;
}

export const ViewBlockedWordsModal: React.FC<ViewBlockedWordsModalProps> = ({
  isOpen,
  onClose,
  blockedTerms,
  onRemove,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Blocked Words (${blockedTerms.length})`}
      size="md"
      showCloseButton
      closeOnEsc
      closeOnClickOutside
      minHeight="min-h-[300px]"
    >
      {blockedTerms.length === 0 ? (
        <div className="text-center py-8 text-[var(--text-secondary)]">
          No blocked words yet. Click "Add" to create one.
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {blockedTerms.map((term) => (
            <div
              key={term}
              className="flex items-center justify-between bg-[var(--card-secondary-bg)] rounded-md px-3 py-2"
            >
              <span className="text-sm text-[var(--text-primary)] break-all">
                {term}
              </span>
              <Button
                      variant="ghost"
                      size="xs"
                      icon={Trash2}
                      iconOnly
                      onClick={() => onRemove(term)}
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