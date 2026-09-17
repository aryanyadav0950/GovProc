"use client";

import React from "react";

export function PrintButton({
  label = "🖨 Export Procurement Dossier",
  className = "",
}: {
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`rounded-xl border border-slate-700 bg-slate-950 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-900 transition flex items-center gap-2 ${className}`}
    >
      {label}
    </button>
  );
}
