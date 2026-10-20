import React from 'react';

type BadgeVariant = 'owner' | 'editor' | 'viewer';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  owner:  'bg-indigo-50 text-indigo-700 border-indigo-200',
  editor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200',
};

const BADGE_LABELS: Record<BadgeVariant, string> = {
  owner:  'Owner',
  editor: 'Editor',
  viewer: 'Viewer',
};

interface BadgeProps {
  role: BadgeVariant;
  className?: string;
}

export function Badge({ role, className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-block px-2 py-0.5 rounded-md text-xs font-medium border',
        BADGE_CLASSES[role],
        className,
      ].join(' ')}
    >
      {BADGE_LABELS[role]}
    </span>
  );
}
