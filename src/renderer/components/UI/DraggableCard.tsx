// src/renderer/components/UI/DraggableCard.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface DraggableCardProps {
  id: string;
  isEditMode: boolean;
  children: React.ReactNode;
}

export const DraggableCard: React.FC<DraggableCardProps> = ({ id, isEditMode, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isEditMode ? 'grab' : 'default',
  };

  return (
    <div ref={setNodeRef} style={style} {...(isEditMode ? { ...attributes, ...listeners } : {})} className="relative">
      {isEditMode && (
        <div className="absolute -top-2 -left-2 z-10 p-1 bg-[var(--primary-color)] rounded-full cursor-grab">
          <GripVertical className="w-3 h-3 text-white" />
        </div>
      )}
      {children}
    </div>
  );
};