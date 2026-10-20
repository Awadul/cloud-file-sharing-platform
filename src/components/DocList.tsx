'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from './Badge';
import { SkeletonRow } from './Skeleton';
import { formatDistanceToNow } from 'date-fns';

type Role = 'owner' | 'editor' | 'viewer';

export interface DocListItem {
  id: string;
  title: string;
  updated_at: string;
  role: Role;
  owner_name?: string; // shown for shared docs
}

interface DocListProps {
  items: DocListItem[];
  loading?: boolean;
  emptyText: string;
  showOwner?: boolean;
}

function timeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function DocList({ items, loading, emptyText, showOwner }: DocListProps) {
  if (loading) {
    return (
      <div>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-slate-500 py-4">{emptyText}</p>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-4 py-3">
          <div className="flex-1 min-w-0">
            <Link
              href={`/docs/${item.id}`}
              className="text-sm font-medium text-slate-900 hover:text-indigo-600 truncate block"
            >
              {item.title || 'Untitled document'}
            </Link>
            {showOwner && item.owner_name && (
              <span className="text-xs text-slate-500">by {item.owner_name}</span>
            )}
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
            {timeAgo(item.updated_at)}
          </span>
          <Badge role={item.role} />
        </div>
      ))}
    </div>
  );
}
