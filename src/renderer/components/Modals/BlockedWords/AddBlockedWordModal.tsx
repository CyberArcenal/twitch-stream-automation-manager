// components/BlockedWords/AddBlockedWordModal.tsx
import React, { useState } from "react";
import Modal from "../../UI/Modal";
import Button from "../../UI/Button";

interface AddBlockedWordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (term: string) => void;
}

export const AddBlockedWordModal: React.FC<AddBlockedWordModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [term, setTerm] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (term.trim()) {
      onAdd(term.trim().toLowerCase());
      setTerm("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Blocked Word / Phrase"
      size="sm"
      showCloseButton
      closeOnEsc
      closeOnClickOutside
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
            Word or phrase
          </label>
          <input
            type="text"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="e.g., spam, badword123"
            className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--primary-color)]"
            autoFocus
          />
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Messages containing this term will be auto‑deleted.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!term.trim()}>
            Add Word
          </Button>
        </div>
      </form>
    </Modal>
  );
};