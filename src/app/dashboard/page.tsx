import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { MetricCard } from "@/components/MetricCard";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";
import { GovernanceBanner } from "@/components/GovernanceBanner";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const [
    challengesCount,
    openChallengesCount,
    startupsCount,
    evaluationsCount,
    pilotsCount,
    validationsCount,
    recommendationsCount,
    recentChallenges,
    activePilots,
  ] = await Promise.all([
    prisma.challenge.count(),
    prisma.challenge.count({ where: { status: "OPEN" } }),
    prisma.startup.count(),
    prisma.evaluation.count(),
    prisma.pilot.count(),
    prisma.validation.count({ where: { passed: true } }),
    prisma.recommendation.count(),
    prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      include: {
        matches: true,
        pilots: true,
      },
    }),
    prisma.pilot.findMany({
      take: 2,
      include: {
        startup: { include: { organization: true } },
        challenge: true,
        validation: true,
        recommendation: true,
        milestones: true,
        kpis: { include: { results: { orderBy: { recordedAt: "desc" }, take: 1 } } },
      },
    }),
  ]);

  const userOrg = session.user.organizationId
    ? await prisma.organization.findUnique({
        where: { id: session.user.organizationId },
      })
    : null;

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        organizationName: userOrg?.name || "Department of Urban Development",
      }}
    >
      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Executive Hero Banner */}
        <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                  Government Innovation Command Center
                </span>
                <span className="text-xs text-slate-400">
                  GovProc Production Platform
                </span>
              </div>

              <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                Good day, {session.user.name || "Government Nodal Officer"}
              </h1>

              <p className="mt-2 text-sm text-slate-300 max-w-2xl leading-relaxed">
                Monitor departmental innovation challenges, evaluate shortlisted startups with transparent multi-factor scoring, track live pilot telemetries, and execute evidence-backed procurement decisions under GFR 2017 rules.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/challenges/new"
                className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition duration-200 flex items-center gap-2"
              >
                <span>+ Create Innovation Challenge</span>
              </Link>
              <Link
                href="/pilots"
                className="rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 text-xs font-bold text-slate-200 hover:border-slate-500 hover:bg-slate-900 transition"
              >
                View Active Pilots →
              </Link>
            </div>
          </div>
        </div>

        {/* 6 Executive Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Active Challenges"
            value={challengesCount}
            subtitle={`${openChallengesCount} Open for Matching`}
            trend="+2 this month"
            trendType="up"
          />

          <MetricCard
            title="Startups Evaluated"
            value={startupsCount}
            subtitle="Verified DPIIT innovators"
            trend="↑ 14%"
            trendType="up"
          />

          <MetricCard
            title="Committee Evaluations"
            value={evaluationsCount}
            subtitle="4-pillar scorecards"
            trend="100% complete"
            trendType="neutral"
          />

          <MetricCard
            title="Active Pilots"
            value={pilotsCount}
            subtitle="Field sandbox trials"
            trend="Live Telemetry"
            trendType="up"
          />

          <MetricCard
            title="Validations Passed"
            value={validationsCount}
            subtitle="Audit sign-offs"
            trend="Audit Ready"
            trendType="up"
          />

          <MetricCard
            title="Procurement Decisions"
            value={recommendationsCount}
            subtitle="GFR Scale & Procure verdicts"
            trend="Ready for Award"
            trendType="up"
          />
        </div>

        {/* Action Required: What Needs Your Attention */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Action Required • What Needs Your Attention
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">3 Priority Items</span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Attention Item 1 */}
            <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg border border-red-800 bg-red-950/80 px-3 py-1 text-xs font-bold text-red-200">
                    High Risk Flag
                  </span>
                  <span className="text-[11px] text-slate-400">Assessment</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-100">
                  CivicVision Technologies
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Security certification pending formal CERT-In accredited audit verification before pilot expansion.
                </p>
              </div>
              <Link
                href="/assessments"
                className="mt-4 inline-flex items-center text-xs font-bold text-red-300 hover:text-red-200 transition"
              >
                Review Risk Assessment →
              </Link>
            </div>

            {/* Attention Item 2 */}
            <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg border border-amber-800 bg-amber-950/80 px-3 py-1 text-xs font-bold text-amber-200">
                    Pending Validation
                  </span>
                  <span className="text-[11px] text-slate-400">Pilot Stage</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-100">
                  Urban Infrastructure Pilot Trial
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  All 3 deliverable milestones completed. Committee validation audit awaiting official sign-off.
                </p>
              </div>
              <Link
                href={activePilots[0] ? `/pilots/${activePilots[0].id}/recommendation` : "/pilots"}
                className="mt-4 inline-flex items-center text-xs font-bold text-amber-300 hover:text-amber-200 transition"
              >
                Open Validation & Recommendation Engine →
              </Link>
            </div>

            {/* Attention Item 3 */}
            <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg border border-blue-800 bg-blue-950/80 px-3 py-1 text-xs font-bold text-blue-200">
                    Telemetry Active
                  </span>
                  <span className="text-[11px] text-slate-400">KPI Telemetry</span>
                </div>
                <h3 className="mt-2 text-sm font-bold text-slate-100">
                  Road Defect Detection (94.6%)
                </h3>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  Field telemetry logged exceeding 90% benchmark. Tranche 1 payment disbursed.
                </p>
              </div>
              <Link
                href={activePilots[0] ? `/pilots/${activePilots[0].id}` : "/pilots"}
                className="mt-4 inline-flex items-center text-xs font-bold text-blue-300 hover:text-blue-200 transition"
              >
                View Live Pilot Cockpit →
              </Link>
            </div>
          </div>
        </div>

        {/* Global Procurement Pipeline (Stage 1 Active) */}
        <ProcurementPipeline currentStage={1} />

        {/* Main Content Grid: Recent Challenges & Quick Action Hub */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Challenges Table */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 p-6">
              <div>
                <h2 className="text-lg font-bold text-white">
                  Active Department Challenges
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Problems posted for startup discovery and pilot sandbox testing.
                </p>
              </div>

              <Link
                href="/challenges"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                View All ({challengesCount}) →
              </Link>
            </div>

            <div className="divide-y divide-slate-800">
              {recentChallenges.map((c) => (
                <div
                  key={c.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{c.title}</h3>
                      <StatusBadge status={c.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {c.description}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span>Sector: <strong className="text-slate-300">{c.sector || "General"}</strong></span>
                      <span>Budget: <strong className="text-slate-300">{c.budgetRange || "₹25L - ₹50L"}</strong></span>
                      <span>Matched: <strong className="text-blue-400">{c.matches.length} Startups</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/startups?challenge=${c.id}`}
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-blue-500 transition"
                    >
                      Discover Startups
                    </Link>
                    <Link
                      href={`/evaluations?challenge=${c.id}`}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 transition"
                    >
                      Evaluate →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Action Navigation Hub */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white">
                Procurement Action Hub
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Navigate directly to any stage of the procurement workflow.
              </p>

              <div className="mt-5 space-y-2.5">
                <Link
                  href="/challenges/new"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 hover:border-blue-500 hover:bg-slate-900 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                      +
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">1. Define Challenge</p>
                      <p className="text-[11px] text-slate-400">Publish problem statement</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-blue-400">→</span>
                </Link>

                <Link
                  href="/startups"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 hover:border-blue-500 hover:bg-slate-900 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-950 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition">
                      🔍
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">2. Startup Discovery</p>
                      <p className="text-[11px] text-slate-400">AI matching & eligibility</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-purple-400">→</span>
                </Link>

                <Link
                  href="/assessments"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 hover:border-blue-500 hover:bg-slate-900 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-950 text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition">
                      📊
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">3. Risk & Readiness</p>
                      <p className="text-[11px] text-slate-400">AI analysis & claim check</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-amber-400">→</span>
                </Link>

                <Link
                  href="/evaluations"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 hover:border-blue-500 hover:bg-slate-900 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition">
                      ⚖️
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">4. Committee Scoring</p>
                      <p className="text-[11px] text-slate-400">Side-by-side matrix</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-emerald-400">→</span>
                </Link>

                <Link
                  href="/pilots"
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 p-3.5 hover:border-blue-500 hover:bg-slate-900 transition group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition">
                      🚀
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">5. Pilot Cockpit</p>
                      <p className="text-[11px] text-slate-400">Milestones & KPI logging</p>
                    </div>
                  </div>
                  <span className="text-slate-500 group-hover:text-indigo-400">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-blue-900/50 bg-blue-950/20 p-3.5 text-xs text-slate-300">
              <span className="font-bold text-blue-400">GovProc Architecture:</span> Deterministic, explainable, and human-in-the-loop decision platform.
            </div>
          </section>
        </div>

        {/* GFR Compliance Banner */}
        <GovernanceBanner />
      </div>
    </AppShell>
  );
}