"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

export type AppShellProps = {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
    organizationName?: string | null;
  } | null;
  children: React.ReactNode;
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: "Command Center",
      href: "/dashboard",
      icon: "🏛️",
      stage: "Overview",
    },
    {
      label: "Challenges",
      href: "/challenges",
      icon: "📋",
      stage: "Stage 01",
    },
    {
      label: "Startup Discovery",
      href: "/startups",
      icon: "🔍",
      stage: "Stage 02",
    },
    {
      label: "Risk Assessments",
      href: "/assessments",
      icon: "📊",
      stage: "Stage 03",
    },
    {
      label: "Evaluations Matrix",
      href: "/evaluations",
      icon: "⚖️",
      stage: "Stage 04",
    },
    {
      label: "Pilot Cockpit",
      href: "/pilots",
      icon: "🚀",
      stage: "Stage 05-07",
    },
  ];

  const roleLabel = {
    GOVERNMENT: "Nodal Officer",
    EVALUATOR: "Expert Evaluator",
    STARTUP: "Startup Lead",
    ADMIN: "Administrator",
  }[user?.role || "GOVERNMENT"] || user?.role || "Officer";

  const roleColor = {
    GOVERNMENT: "bg-blue-950 text-blue-300 border-blue-800",
    EVALUATOR: "bg-purple-950 text-purple-300 border-purple-800",
    STARTUP: "bg-emerald-950 text-emerald-300 border-emerald-800",
    ADMIN: "bg-amber-950 text-amber-300 border-amber-800",
  }[user?.role || "GOVERNMENT"] || "bg-slate-800 text-slate-300 border-slate-700";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Portal Identity */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white md:hidden"
              aria-label="Toggle navigation"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 font-black text-white shadow-md shadow-blue-500/20">
                SIH
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-widest text-blue-400">
                    SIH26136
                  </span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-bold text-slate-400 uppercase">
                    National Portal
                  </span>
                </div>
                <h1 className="text-sm font-extrabold text-white leading-tight group-hover:text-blue-300 transition">
                  GovTech Innovation Procurement
                </h1>
              </div>
            </Link>
          </div>

          {/* User Profile & Quick Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Department Badge */}
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[220px]">
                {user?.organizationName || "Department of Urban Development"}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Govt. of India
              </span>
            </div>

            {/* Role Badge */}
            <span
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold tracking-wide uppercase ${roleColor}`}
            >
              {roleLabel}
            </span>

            {/* User Dropdown / Sign Out Button */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden lg:block text-right text-xs">
                <p className="font-bold text-slate-200 leading-tight">
                  {user?.name || "Nodal Officer"}
                </p>
                <p className="text-[10px] text-slate-400 truncate max-w-[140px]">
                  {user?.email || "officer@gov.in"}
                </p>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-red-800 hover:bg-red-950/40 hover:text-red-300 transition"
                title="Sign out of system"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Collapsible Left Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r border-slate-800 bg-slate-950/70 p-4 shrink-0 justify-between">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2">
                Workflow Modules
              </p>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition group ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 font-bold"
                          : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span
                        className={`text-[9px] font-mono tracking-wider uppercase px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-blue-700/60 text-blue-100"
                            : "bg-slate-900 text-slate-500 group-hover:text-slate-400"
                        }`}
                      >
                        {item.stage}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span>Statutory Compliance</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Platform operates under <strong>GFR Rule 194</strong> innovation procurement rules with explainable committee audits.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-3 text-[10px] text-slate-500 flex flex-col gap-1">
            <span className="font-semibold text-slate-400">SIH 2024 / SIH26136</span>
            <span>Government Startup Procurement</span>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="relative flex w-4/5 max-w-xs flex-1 flex-col bg-slate-950 p-6 border-r border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 font-bold text-white text-xs">
                    SIH
                  </div>
                  <span className="font-bold text-sm text-white">Innovation Portal</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const isActive =
                    item.href === "/dashboard"
                      ? pathname === "/dashboard"
                      : pathname?.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-xl px-3.5 py-3 text-xs font-semibold ${
                        isActive
                          ? "bg-blue-600 text-white font-bold"
                          : "text-slate-400 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-base">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{item.stage}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-x-hidden min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
