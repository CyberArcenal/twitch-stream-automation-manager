import React from 'react';

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '', lines = 4 }) => {
  return (
    <div className={`bg-[var(--card-bg)] rounded-xl p-4 animate-pulse ${className}`}>
      <div className="h-4 bg-[var(--input-border)] rounded w-1/3 mb-3"></div>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-[var(--input-border)] rounded w-full mb-2"></div>
      ))}
    </div>
  );
};