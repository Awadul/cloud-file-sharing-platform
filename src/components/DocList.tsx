'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from './Badge';
import { SkeletonRow } from './Skeleton';
import { format } from 'date-fns';

type Role = 'owner' | 'editor' | 'viewer';

export interface DocListItem {
  id: string;
  title: string;
  updated_at: string;
  role: Role;
  owner_name?: string;
  description?: string;
}

interface DocListProps {
  items: DocListItem[];
  loading?: boolean;
  emptyText: string;
  showOwner?: boolean;
}

function formatDate(dateStr: string): { date: string; time: string } {
  try {
    const d = new Date(dateStr);
    return {
      date: format(d, 'MMM d, yyyy'),
      time: format(d, 'HH:mm'),
    };
  } catch {
    return { date: dateStr, time: '' };
  }
}

// Sensible subtitle fallbacks matching product screenshots
function getSubtitle(item: DocListItem, showOwner?: boolean): string {
  if (item.description) {
    return showOwner && item.owner_name
      ? `By ${item.owner_name} · ${item.description}`
      : item.description;
  }

  // If title has default name or sample name
  const sampleDescriptions: Record<string, string> = {
    'Product launch brief': 'Goals, audience, key messages and launch plan',
    'Untitled document': 'Your next idea starts here',
    'Engineering handoff': 'Technical overview, architecture and next steps',
    'Brand guidelines': 'Voice, tone, visual identity and examples',
    'Marketing campaign plan': 'Channel strategy, timeline and deliverables',
    'Customer research summary': 'Interview notes, themes and opportunities',
    'Q3 planning notes': 'Objectives, risks and open questions',
  };

  const defaultDesc = sampleDescriptions[item.title] ?? 'Created in your team workspace';

  if (showOwner && item.owner_name) {
    return `By ${item.owner_name} · ${defaultDesc}`;
  }
  return defaultDesc;
}

export function DocList({ items, loading, emptyText, showOwner }: DocListProps) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden divide-y divide-slate-100 shadow-xs">
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center shadow-xs">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600">{emptyText}</p>
        <p className="text-xs text-slate-400 mt-1">Create a new document or import files to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="px-6 py-3 border-b border-slate-100 flex items-center text-xs font-semibold text-slate-500 bg-slate-50/50">
        <div className="flex-1">Title</div>
        <div className="w-36 text-left flex items-center gap-1">
          <span>Updated</span>
          <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
          </svg>
        </div>
        <div className="w-24 text-right">Access</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100">
        {items.map((item) => {
          const { date, time } = formatDate(item.updated_at);
          const subtitle = getSubtitle(item, showOwner);

          return (
            <Link
              key={item.id}
              href={`/docs/${item.id}`}
              className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/70 transition-colors group cursor-pointer block"
            >
              {/* Document Icon + Titles */}
              <div className="flex-1 min-w-0 flex items-start gap-3.5">
                <div className="mt-0.5 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <span className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate block">
                    {item.title || 'Untitled document'}
                  </span>
                  <span className="text-xs text-slate-500 truncate block mt-0.5">
                    {subtitle}
                  </span>
                </div>
              </div>

              {/* Updated Column */}
              <div className="w-36 text-left shrink-0">
                <div className="text-xs font-medium text-slate-600">{date}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{time}</div>
              </div>

              {/* Access Badge Column */}
              <div className="w-24 text-right shrink-0">
                <Badge role={item.role} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
