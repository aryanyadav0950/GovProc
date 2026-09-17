import React from "react";

export function GovernanceBanner() {
  return (
    <div className="rounded-2xl border border-blue-900/60 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-blue-300">
              Human-in-the-Loop Governance & Statutory Compliance
            </h3>
          </div>
          <p className="text-xs text-slate-300 max-w-4xl leading-relaxed">
            All AI match scores, readiness indices, and procurement recommendations are strictly <strong>advisory decision support tools</strong> under GFR 2017 Rule 194 innovation guidelines. Final technical approvals, financial sanctions, and commercial awards remain under the statutory jurisdiction of the Departmental Evaluation Committee and Competent Financial Authority.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="rounded-lg border border-blue-800 bg-blue-950/80 px-3 py-1.5 text-[11px] font-bold text-blue-200">
            GFR 2017 / Rule 194
          </span>
          <span className="rounded-lg border border-emerald-800 bg-emerald-950/80 px-3 py-1.5 text-[11px] font-bold text-emerald-200">
            CVC Compliant
          </span>
        </div>
      </div>
    </div>
  );
}
