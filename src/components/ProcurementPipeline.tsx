import React from "react";
import Link from "next/link";

export type ProcurementPipelineProps = {
  currentStage: number; // 1 to 7
  pilotId?: string;
};

const STAGES = [
  {
    num: "01",
    name: "Challenge",
    sub: "Problem Definition",
    href: "/challenges",
  },
  {
    num: "02",
    name: "Discovery",
    sub: "Startup Matching",
    href: "/startups",
  },
  {
    num: "03",
    name: "Assess",
    sub: "Risk & Readiness",
    href: "/assessments",
  },
  {
    num: "04",
    name: "Evaluate",
    sub: "Committee Scoring",
    href: "/evaluations",
  },
  {
    num: "05",
    name: "Pilot",
    sub: "Sandbox Execution",
    href: "/pilots",
  },
  {
    num: "06",
    name: "Validate",
    sub: "Evidence & Audit",
    href: "/pilots",
  },
  {
    num: "07",
    name: "Recommend",
    sub: "GFR Verdict",
    href: "/pilots",
  },
];

export function ProcurementPipeline({
  currentStage = 1,
  pilotId,
}: ProcurementPipelineProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-4 md:p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
            End-to-End GovTech Innovation Procurement Lifecycle
          </h3>
        </div>
        <span className="text-[11px] font-bold text-blue-400">
          Stage {currentStage} of 7 Active
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STAGES.map((stage, idx) => {
          const stageNumber = idx + 1;
          const isCompleted = stageNumber < currentStage;
          const isCurrent = stageNumber === currentStage;

          let targetHref = stage.href;
          if (pilotId && stageNumber >= 5) {
            if (stageNumber === 7) {
              targetHref = `/pilots/${pilotId}/recommendation`;
            } else {
              targetHref = `/pilots/${pilotId}`;
            }
          }

          return (
            <Link
              key={stage.num}
              href={targetHref}
              className={`rounded-xl p-3 border transition flex flex-col justify-between group ${
                isCurrent
                  ? "border-blue-500 bg-blue-950/60 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/50"
                  : isCompleted
                    ? "border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700"
                    : "border-slate-800 bg-slate-950/60 hover:border-slate-700 opacity-70 hover:opacity-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black tracking-wider uppercase ${
                    isCurrent
                      ? "text-blue-300"
                      : isCompleted
                        ? "text-emerald-400"
                        : "text-slate-500"
                  }`}
                >
                  Stage {stage.num}
                </span>

                {isCompleted && (
                  <span className="text-xs text-emerald-400 font-black">✓</span>
                )}
                {isCurrent && (
                  <span className="flex h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                )}
              </div>

              <div className="mt-2">
                <p
                  className={`text-xs font-bold truncate ${
                    isCurrent
                      ? "text-white"
                      : isCompleted
                        ? "text-slate-200"
                        : "text-slate-400"
                  }`}
                >
                  {stage.name}
                </p>
                <p className="text-[10px] text-slate-500 truncate font-medium">
                  {stage.sub}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
