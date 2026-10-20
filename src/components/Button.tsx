"use client";
import React from "react";
import { LoaderCircle } from "lucide-react";
interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`btn pp-button ${variant === "primary" ? "btn-primary" : variant === "danger" ? "btn-error" : variant === "ghost" ? "btn-ghost" : ""} ${size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : ""} ${className}`}
    >
      {loading && (
        <LoaderCircle size={15} className="animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
