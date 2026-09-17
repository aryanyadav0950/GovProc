import React from "react";

export type MetricCardProps = {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
};

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendType = "neutral",
  icon,
  className = "",
}: MetricCardProps) {
  const trendColor = {
    up: "text-emerald-400 bg-emerald-950/60 border-emerald-800/60",
    down: "text-red-400 bg-red-950/60 border-red-800/60",
    neutral: "text-slate-400 bg-slate-800/60 border-slate-700/60",
  }[trendType];

  return (
    <div
      className={`rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg relative overflow-hidden transition hover:border-slate-700 ${className}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider line-clamp-1">
          {title}
        </p>
        {icon && <div className="text-slate-400 text-sm">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-3xl font-black tracking-tight text-white">
          {value}
        </div>
        {trend && (
          <span
            className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ${trendColor}`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-400 line-clamp-1 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
