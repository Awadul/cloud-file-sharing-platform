import React from 'react';

type BadgeVariant = 'owner' | 'editor' | 'viewer';

const BADGE_CLASSES: Record<BadgeVariant, string> = {
  owner:  'bg-blue-50 text-blue-600 border-blue-200/80',
  editor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
  viewer: 'bg-purple-50 text-purple-700 border-purple-200/80',
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
