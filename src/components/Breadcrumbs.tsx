import React from "react";
import Link from "next/link";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-400">
      <Link
        href="/dashboard"
        className="hover:text-blue-400 transition flex items-center gap-1 font-medium"
      >
        <span>🏛️ Command Center</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <span className="mx-2 text-slate-600">/</span>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-blue-400 transition font-medium"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-slate-200 font-semibold">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
