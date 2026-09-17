import React from "react";

export type StatusBadgeProps = {
  status?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function StatusBadge({
  status,
  size = "md",
  className = "",
}: StatusBadgeProps) {
  if (!status) return null;

  const normalized = status.toUpperCase();

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3.5 py-1.5 text-sm",
  }[size];

  // Map status to semantic color palette
  let colorClasses = "bg-slate-800 text-slate-300 border-slate-700";

  switch (normalized) {
    // Challenge Statuses
    case "OPEN":
      colorClasses = "bg-blue-950/80 text-blue-300 border-blue-800/80";
      break;
    case "DRAFT":
      colorClasses = "bg-slate-800/80 text-slate-400 border-slate-700";
      break;
    case "EVALUATION":
      colorClasses = "bg-purple-950/80 text-purple-300 border-purple-800/80";
      break;
    case "PILOT":
      colorClasses = "bg-indigo-950/80 text-indigo-300 border-indigo-800/80";
      break;
    case "COMPLETED":
      colorClasses = "bg-emerald-950/80 text-emerald-300 border-emerald-800/80";
      break;
    case "CLOSED":
      colorClasses = "bg-zinc-900 text-zinc-400 border-zinc-700";
      break;

    // Eligibility & Document Statuses
    case "ELIGIBLE":
    case "VERIFIED":
    case "SUPPORTED":
    case "PASSED":
      colorClasses = "bg-emerald-950/80 text-emerald-300 border-emerald-700";
      break;
    case "NEEDS_REVIEW":
    case "VERIFY":
    case "PENDING":
      colorClasses = "bg-amber-950/80 text-amber-300 border-amber-700";
      break;
    case "NOT_ELIGIBLE":
    case "REJECTED":
    case "UNSUPPORTED":
    case "FAILED":
      colorClasses = "bg-red-950/80 text-red-300 border-red-700";
      break;

    // Risk Levels
    case "LOW":
      colorClasses = "bg-emerald-950/80 text-emerald-300 border-emerald-700";
      break;
    case "MEDIUM":
      colorClasses = "bg-amber-950/80 text-amber-300 border-amber-700";
      break;
    case "HIGH":
    case "CRITICAL":
      colorClasses = "bg-red-950/80 text-red-300 border-red-700";
      break;

    // Recommendation Decisions
    case "SCALE":
      colorClasses = "bg-purple-950/90 text-purple-200 border-purple-600 shadow-sm shadow-purple-900/30 font-black";
      break;
    case "PROCURE":
      colorClasses = "bg-emerald-950/90 text-emerald-200 border-emerald-600 shadow-sm shadow-emerald-900/30 font-black";
      break;
    case "REPILOT":
      colorClasses = "bg-amber-950/90 text-amber-200 border-amber-600 font-bold";
      break;
    case "DO_NOT_PROCEED":
      colorClasses = "bg-red-950/90 text-red-200 border-red-600 font-bold";
      break;

    // Payment Statuses
    case "PAID":
      colorClasses = "bg-emerald-950/80 text-emerald-300 border-emerald-700";
      break;
    case "APPROVED":
      colorClasses = "bg-blue-950/80 text-blue-300 border-blue-700";
      break;
  }

  const label = normalized.replace(/_/g, " ");

  return (
    <span
      className={`inline-flex items-center font-bold tracking-wider uppercase rounded-md border ${sizeClasses} ${colorClasses} ${className}`}
    >
      {label}
    </span>
  );
}
