import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-100">
      <Skeleton className="flex-1 h-4" />
      <Skeleton className="w-24 h-4" />
      <Skeleton className="w-16 h-5" />
    </div>
  );
}
