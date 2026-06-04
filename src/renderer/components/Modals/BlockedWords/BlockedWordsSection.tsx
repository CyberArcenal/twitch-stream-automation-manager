// components/BlockedWords/BlockedWordsSection.tsx
import React from "react";
import { Ban, Plus, Eye } from "lucide-react";
import { AddBlockedWordModal } from "./AddBlockedWordModal";
import { ViewBlockedWordsModal } from "./ViewBlockedWordsModal";
import { useModal } from "../../../hooks/useModal";
import Button from "../../UI/Button";

interface BlockedWordsSectionProps {
  blockedTerms: string[];
  onAddTerm: (term: string) => void;
  onRemoveTerm: (term: string) => void;
}

export const BlockedWordsSection: React.FC<BlockedWordsSectionProps> = ({
  blockedTerms,
  onAddTerm,
  onRemoveTerm,
}) => {
  const addModal = useModal();
  const viewModal = useModal();

  // Show first 3 terms as preview
  const previewTerms = blockedTerms.slice(0, 3);
  const hasMore = blockedTerms.length > 3;

  return (
    <div className="border border-[var(--border-color)] rounded-lg p-3 bg-[var(--card-bg)]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-[var(--text-secondary)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Blocked Words
          </span>
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--input-bg)] px-1.5 py-0.5 rounded-full">
            {blockedTerms.length}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="xs"
            icon={Plus}
            iconOnly
            onClick={addModal.open}
            title="Add blocked word"
            children={undefined}
          />
          <Button
            variant="ghost"
            size="xs"
            icon={Eye}
            iconOnly
            onClick={viewModal.open}
            title="View all blocked words"
            disabled={blockedTerms.length === 0}
            children={undefined}
          />
        </div>
      </div>

      {/* Truncated list preview */}
      {blockedTerms.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {previewTerms.map((term) => (
            <span
              key={term}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--btn-secondary-bg)] rounded-full text-xs"
            >
              {term}
            </span>
          ))}
          {hasMore && (
            <span
              className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-[var(--primary-color)]"
              onClick={viewModal.open}
            >
              +{blockedTerms.length - 3} more
            </span>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          No blocked words. Click <Plus size={12} className="inline" /> to add.
        </p>
      )}

      {/* Modals */}
      <AddBlockedWordModal
        isOpen={addModal.isOpen}
        onClose={addModal.close}
        onAdd={onAddTerm}
      />
      <ViewBlockedWordsModal
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        blockedTerms={blockedTerms}
        onRemove={onRemoveTerm}
      />
    </div>
  );
};
