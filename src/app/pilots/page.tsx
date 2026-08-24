import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";
import { MetricCard } from "@/components/MetricCard";
import { GovernanceBanner } from "@/components/GovernanceBanner";

export default async function PilotsPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const [pilots, challenges, userOrg] = await Promise.all([
    prisma.pilot.findMany({
      where: params.challenge ? { challengeId: params.challenge } : undefined,
      include: {
        startup: {
          include: {
            organization: true,
          },
        },
        challenge: true,
        milestones: true,
        kpis: {
          include: {
            results: {
              orderBy: { recordedAt: "desc" },
              take: 1,
            },
          },
        },
        validation: true,
        recommendation: true,
        payment: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.challenge.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
    session.user.organizationId
      ? prisma.organization.findUnique({
          where: { id: session.user.organizationId },
        })
      : null,
  ]);

  const totalPilots = pilots.length;
  const validatedPilots = pilots.filter((p) => p.validation?.passed).length;
  const completedRecommendations = pilots.filter((p) => p.recommendation).length;

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        organizationName: userOrg?.name || "Department of Urban Development",
      }}
    >
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: "Pilot Cockpit" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Stage 05 • Sandbox & Field Deployments
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              Government Innovation Pilots
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Live operational sandbox deployments. Track deliverable milestones, telemetry KPIs, funding tranches, and procurement validation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/evaluations"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500 transition"
            >
              ← Evaluations Matrix
            </Link>
            <Link
              href="/pilots/new"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              + Create New Pilot
            </Link>
          </div>
        </div>

        <ProcurementPipeline currentStage={5} />

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Active Pilots"
            value={totalPilots}
            subtitle="Live sandbox & field trials"
            trend="Live"
            trendType="up"
          />

          <MetricCard
            title="Validated Pilots"
            value={validatedPilots}
            subtitle="Committee audit signed off"
            trend="Audit Ready"
            trendType="up"
          />

          <MetricCard
            title="Procurement Verdicts"
            value={completedRecommendations}
            subtitle="SCALE / PROCURE decisions"
            trend="Ready for Award"
            trendType="up"
          />

          <MetricCard
            title="Active Challenges"
            value={challenges.length}
            subtitle="Innovation problem statements"
            trend="Open"
            trendType="neutral"
          />
        </div>

        {/* Challenge Filter */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Filter by Challenge:
            </p>
            {params.challenge && (
              <Link href="/pilots" className="text-xs font-bold text-blue-400 hover:underline">
                Clear filter ✕
              </Link>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/pilots"
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                !params.challenge
                  ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"
              }`}
            >
              All Challenges ({pilots.length})
            </Link>
            {challenges.map((c) => (
              <Link
                key={c.id}
                href={`/pilots?challenge=${c.id}`}
                className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                  params.challenge === c.id
                    ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600"
                }`}
              >
                {c.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Pilots List */}
        <div className="space-y-4">
          {pilots.map((pilot) => {
            const completedMilestones = pilot.milestones.filter((m) => m.completed).length;
            const totalMilestones = pilot.milestones.length;
            const milestoneProgress =
              totalMilestones > 0
                ? Math.round((completedMilestones / totalMilestones) * 100)
                : 0;

            return (
              <div
                key={pilot.id}
                className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5 hover:border-slate-700 transition"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-white">{pilot.name}</h2>
                      {pilot.recommendation ? (
                        <StatusBadge status={pilot.recommendation.type} size="sm" />
                      ) : pilot.validation?.passed ? (
                        <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-bold text-blue-300 uppercase">
                          Validated ✓
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-950 border border-amber-800 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 uppercase">
                          In Execution
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-400">
                      Startup Innovator: <strong className="text-slate-200">{pilot.startup.organization.name}</strong> • Challenge: <span className="text-blue-300">{pilot.challenge.title}</span>
                    </p>

                    {pilot.description && (
                      <p className="text-xs text-slate-300 leading-relaxed max-w-3xl line-clamp-2">
                        {pilot.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                    <Link
                      href={`/pilots/${pilot.id}`}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
                    >
                      Pilot Cockpit →
                    </Link>
                    <Link
                      href={`/pilots/${pilot.id}/recommendation`}
                      className="rounded-xl border border-purple-600 bg-purple-950/40 px-4 py-2 text-xs font-bold text-purple-300 hover:bg-purple-900/50 transition"
                    >
                      Validation & Verdict →
                    </Link>
                  </div>
                </div>

                {/* Progress Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-800 pt-4 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400">
                      <span>Milestone Progress</span>
                      <strong className="text-white">
                        {completedMilestones}/{totalMilestones} ({milestoneProgress}%)
                      </strong>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${milestoneProgress}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Deployment Timeline:</span>
                    <p className="mt-1 font-bold text-white">
                      {new Date(pilot.startDate).toLocaleDateString()}
                      {pilot.endDate ? ` → ${new Date(pilot.endDate).toLocaleDateString()}` : " (Ongoing)"}
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">KPI Targets Tracked:</span>
                    <p className="mt-1 font-bold text-blue-400">
                      {pilot.kpis.length} Measurable Metrics
                    </p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-medium">Payment Tranche:</span>
                    <p className="mt-1 font-bold text-emerald-400">
                      {pilot.payment ? `${pilot.payment.status} (₹${pilot.payment.amount?.toLocaleString() || "500,000"})` : "Milestone-Linked"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {pilots.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
              <p className="text-base font-bold text-slate-200">No Pilots Launched Yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Shortlist a startup from committee evaluations to initiate a pilot trial.
              </p>
              <Link
                href="/evaluations"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-500"
              >
                Go to Evaluations Matrix
              </Link>
            </div>
          )}
        </div>

        <GovernanceBanner />
      </div>
    </AppShell>
  );
}
