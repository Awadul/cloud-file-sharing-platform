import React from "react";

type BadgeVariant = "owner" | "editor" | "viewer";

const BADGE_LABELS: Record<BadgeVariant, string> = {
  owner: "Owner",
  editor: "Editor",
  viewer: "Viewer",
};

interface BadgeProps {
  role: BadgeVariant;
  className?: string;
}

export function Badge({ role, className = "" }: BadgeProps) {
  return (
    <span className={[`pp-badge pp-badge-${role}`, className].join(" ")}>
      {BADGE_LABELS[role]}
    </span>
  );
}
