import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";
import { GovernanceBanner } from "@/components/GovernanceBanner";

async function toggleMilestone(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const milestoneId = String(formData.get("milestoneId"));
  const pilotId = String(formData.get("pilotId"));
  const completed = formData.get("completed") === "true";

  await prisma.milestone.update({
    where: { id: milestoneId },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  });

  revalidatePath(`/pilots/${pilotId}`);
}

async function addMilestone(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pilotId = String(formData.get("pilotId"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const dueDateStr = String(formData.get("dueDate") || "");

  if (!pilotId || !title) return;

  await prisma.milestone.create({
    data: {
      pilotId,
      title,
      description: description || null,
      dueDate: dueDateStr ? new Date(dueDateStr) : null,
      completed: false,
    },
  });

  revalidatePath(`/pilots/${pilotId}`);
}

async function logKPIResult(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pilotId = String(formData.get("pilotId"));
  const kpiId = String(formData.get("kpiId"));
  const value = Number(formData.get("value"));
  const evidenceUrl = String(formData.get("evidenceUrl") || "").trim();

  if (!kpiId || isNaN(value)) return;

  await prisma.kPIResult.create({
    data: {
      kpiId,
      value,
      evidenceUrl: evidenceUrl || null,
      recordedAt: new Date(),
    },
  });

  revalidatePath(`/pilots/${pilotId}`);
}

async function updatePaymentStatus(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pilotId = String(formData.get("pilotId"));
  const status = String(formData.get("status"));

  await prisma.payment.upsert({
    where: { pilotId },
    update: {
      status,
      paidAt: status === "PAID" ? new Date() : null,
    },
    create: {
      pilotId,
      status,
      amount: 500000,
      milestone: "Tranche 1",
      paidAt: status === "PAID" ? new Date() : null,
    },
  });

  revalidatePath(`/pilots/${pilotId}`);
}

export default async function PilotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const [pilot, userOrg] = await Promise.all([
    prisma.pilot.findUnique({
      where: { id },
      include: {
        startup: {
          include: {
            organization: true,
            documents: true,
          },
        },
        challenge: true,
        milestones: {
          orderBy: { dueDate: "asc" },
        },
        kpis: {
          include: {
            results: {
              orderBy: { recordedAt: "desc" },
            },
          },
        },
        validation: true,
        recommendation: true,
        payment: true,
      },
    }),
    session.user.organizationId
      ? prisma.organization.findUnique({
          where: { id: session.user.organizationId },
        })
      : null,
  ]);

  if (!pilot) {
    notFound();
  }

  const completedMilestones = pilot.milestones.filter((m) => m.completed).length;
  const totalMilestones = pilot.milestones.length;
  const milestonePercent =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  // Calculate KPI progress average
  const kpiProgressList = pilot.kpis.map((kpi) => {
    const latest = kpi.results[0]?.value ?? 0;
    const pct =
      kpi.target > 0 ? Math.min(150, Math.round((latest / kpi.target) * 100)) : 0;
    return { kpi, latest, pct };
  });

  const avgKpiAchievement =
    kpiProgressList.length > 0
      ? Math.round(
          kpiProgressList.reduce((acc, curr) => acc + curr.pct, 0) /
            kpiProgressList.length
        )
      : 0;

  const overallProgress = Math.round(
    milestonePercent * 0.5 + avgKpiAchievement * 0.5
  );

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
        <Breadcrumbs
          items={[
            { label: "Pilots", href: "/pilots" },
            { label: pilot.name },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Stage 05 & 06 • Live Pilot Cockpit
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              {pilot.name}
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Real-time pilot field execution cockpit. Track milestone gates, log KPI telemetries, and authorize tranche disbursements.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pilots"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500 transition"
            >
              ← All Pilots
            </Link>
            <Link
              href={`/pilots/${pilot.id}/recommendation`}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-lg flex items-center gap-2"
            >
              <span>Validation & Verdict Engine</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <ProcurementPipeline currentStage={5} pilotId={pilot.id} />

        {/* Pilot Overview Banner */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="PILOT" size="sm" />
                {pilot.recommendation && (
                  <StatusBadge status={pilot.recommendation.type} size="sm" />
                )}
                {pilot.validation?.passed && !pilot.recommendation && (
                  <span className="rounded-md bg-blue-950 border border-blue-800 px-2 py-0.5 text-[10px] font-bold text-blue-300 uppercase">
                    Audit Passed ✓
                  </span>
                )}
              </div>

              <h2 className="text-xl font-bold text-white">
                Innovator: <strong className="text-blue-300">{pilot.startup.organization.name}</strong>
              </h2>

              <p className="text-xs text-slate-400">
                Department Challenge: <strong className="text-slate-200">{pilot.challenge.title}</strong>
              </p>

              {pilot.description && (
                <p className="text-xs text-slate-300 leading-relaxed pt-1">
                  {pilot.description}
                </p>
              )}
            </div>

            {/* Health Meter */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center shrink-0 min-w-[220px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Composite Pilot Health
              </span>
              <div className="text-5xl font-black text-blue-400 mt-1">
                {overallProgress}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-medium">
                {completedMilestones}/{totalMilestones} Milestones • {avgKpiAchievement}% KPI Target
              </p>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                  style={{ width: `${Math.min(100, overallProgress)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Timeline Bar */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 border-t border-slate-800 pt-5 text-xs text-slate-400">
            <div>
              <span className="font-medium text-slate-400">Start Date:</span>
              <p className="mt-0.5 font-bold text-white">
                {new Date(pilot.startDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <span className="font-medium text-slate-400">Target Completion:</span>
              <p className="mt-0.5 font-bold text-white">
                {pilot.endDate ? new Date(pilot.endDate).toLocaleDateString() : "Ongoing"}
              </p>
            </div>
            <div>
              <span className="font-medium text-slate-400">Validation Status:</span>
              <p className="mt-0.5 font-bold text-emerald-400">
                {pilot.validation?.passed
                  ? `Passed (${pilot.validation.score}/100)`
                  : "Pending Sign-off"}
              </p>
            </div>
            <div>
              <span className="font-medium text-slate-400">Tranche Funding:</span>
              <p className="mt-0.5 font-bold text-emerald-400">
                ₹{pilot.payment?.amount?.toLocaleString() || "500,000"} ({pilot.payment?.status || "PENDING"})
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Grid: Milestones & KPIs */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* SECTION 1: MILESTONES CHECKLIST */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Pilot Deliverable Milestone Gates
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Verify deliverable milestones as proof-of-concept stages complete.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-white">
                {completedMilestones}/{totalMilestones} Done
              </span>
            </div>

            <div className="space-y-3">
              {pilot.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl border p-4 transition ${
                    m.completed
                      ? "border-emerald-900/60 bg-emerald-950/20"
                      : "border-slate-800 bg-slate-950"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <form action={toggleMilestone} className="mt-0.5">
                        <input type="hidden" name="milestoneId" value={m.id} />
                        <input type="hidden" name="pilotId" value={pilot.id} />
                        <input
                          type="hidden"
                          name="completed"
                          value={m.completed ? "false" : "true"}
                        />
                        <button
                          type="submit"
                          className={`flex h-5 w-5 items-center justify-center rounded border transition text-xs font-bold ${
                            m.completed
                              ? "border-emerald-500 bg-emerald-600 text-white"
                              : "border-slate-700 bg-slate-900 text-transparent hover:border-slate-500"
                          }`}
                        >
                          ✓
                        </button>
                      </form>

                      <div>
                        <h3
                          className={`text-xs font-bold ${
                            m.completed ? "text-emerald-300 line-through" : "text-white"
                          }`}
                        >
                          {m.title}
                        </h3>
                        {m.description && (
                          <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                            {m.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-slate-500">
                          {m.dueDate && (
                            <span>Due: {new Date(m.dueDate).toLocaleDateString()}</span>
                          )}
                          {m.completedAt && (
                            <span className="text-emerald-400 font-semibold">
                              Verified: {new Date(m.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <StatusBadge
                      status={m.completed ? "VERIFIED" : "PENDING"}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Add Milestone Form */}
            <form action={addMilestone} className="border-t border-slate-800 pt-4 space-y-2.5">
              <input type="hidden" name="pilotId" value={pilot.id} />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                + Add Additional Deliverable Gate
              </p>
              <input
                name="title"
                required
                placeholder="Milestone title (e.g. 50-Vehicle Municipal Trial Review)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white outline-none focus:border-blue-500 font-medium"
              />
              <div className="flex gap-2">
                <input
                  name="description"
                  placeholder="Scope deliverables..."
                  className="w-2/3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none"
                />
                <input
                  type="date"
                  name="dueDate"
                  className="w-1/3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                Save Deliverable Gate
              </button>
            </form>
          </section>

          {/* SECTION 2: MEASURABLE KPIS & EVIDENCE LOGGING */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                  Measurable KPIs & Telemetry Data
                </h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Log field telemetry to benchmark against contractual requirements.
                </p>
              </div>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-blue-300">
                Avg: {avgKpiAchievement}% Target
              </span>
            </div>

            <div className="space-y-4">
              {kpiProgressList.map(({ kpi, latest, pct }) => (
                <div
                  key={kpi.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white">{kpi.name}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Target: <strong className="text-slate-200">{kpi.target} {kpi.unit}</strong> • Measured: <strong className="text-blue-400">{latest} {kpi.unit}</strong>
                      </p>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-xs font-black ${
                        pct >= 90
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : pct >= 60
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-red-950 text-red-300 border border-red-800"
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        pct >= 90
                          ? "bg-emerald-500"
                          : pct >= 60
                            ? "bg-amber-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>

                  {/* Log KPI form */}
                  <form
                    action={logKPIResult}
                    className="flex flex-wrap items-center gap-2 border-t border-slate-800/80 pt-3"
                  >
                    <input type="hidden" name="pilotId" value={pilot.id} />
                    <input type="hidden" name="kpiId" value={kpi.id} />
                    <input
                      type="number"
                      step="0.01"
                      name="value"
                      required
                      placeholder={`Value (${kpi.unit})...`}
                      className="w-28 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-white outline-none focus:border-blue-500 font-bold"
                    />
                    <input
                      name="evidenceUrl"
                      placeholder="Telemetry log or PDF report..."
                      className="flex-1 min-w-[140px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 outline-none"
                    />
                    <button
                      type="submit"
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
                    >
                      Log Telemetry
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Financial Tranches & Disbursement Control */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Milestone-Linked Tranche Disbursements
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Government fiscal control: authorize grant disbursements upon verified milestone gate closures.
              </p>
            </div>

            <StatusBadge status={pilot.payment?.status || "PENDING"} size="sm" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-xs text-slate-400 font-medium">Active Tranche Milestone</span>
              <p className="mt-1 text-base font-bold text-white">
                {pilot.payment?.milestone || "Phase 1 Setup & Deployment"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-xs text-slate-400 font-medium">Tranche Amount</span>
              <p className="mt-1 text-base font-bold text-emerald-400">
                ₹{pilot.payment?.amount?.toLocaleString() || "500,000"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Disbursement Status</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {pilot.payment?.paidAt
                    ? `Disbursed on ${new Date(pilot.payment.paidAt).toLocaleDateString()}`
                    : "Awaiting Committee Authorization"}
                </p>
              </div>

              <div className="flex gap-2">
                <form action={updatePaymentStatus}>
                  <input type="hidden" name="pilotId" value={pilot.id} />
                  <input type="hidden" name="status" value="APPROVED" />
                  <button
                    type="submit"
                    disabled={pilot.payment?.status === "APPROVED" || pilot.payment?.status === "PAID"}
                    className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-slate-300 hover:border-blue-500 disabled:opacity-40"
                  >
                    Approve
                  </button>
                </form>

                <form action={updatePaymentStatus}>
                  <input type="hidden" name="pilotId" value={pilot.id} />
                  <input type="hidden" name="status" value="PAID" />
                  <button
                    type="submit"
                    disabled={pilot.payment?.status === "PAID"}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40 shadow"
                  >
                    Disburse
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Transition Link to Final Stage */}
        <div className="rounded-2xl border border-purple-900/60 bg-gradient-to-r from-purple-950/40 via-slate-900 to-blue-950/40 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-xl">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
              STAGE 07: FINAL PROCUREMENT VERDICT
            </span>
            <h2 className="text-xl font-black text-white mt-1">
              Evidence Validation & Procurement Verdict Engine
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Complete the formal committee validation inspection and generate the transparent, mathematical procurement verdict (SCALE, PROCURE, REPILOT, or DO NOT PROCEED).
            </p>
          </div>

          <Link
            href={`/pilots/${pilot.id}/recommendation`}
            className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-xs text-white hover:bg-purple-500 transition shadow-lg shadow-purple-600/30 shrink-0 text-center"
          >
            Launch Recommendation Engine →
          </Link>
        </div>

        <GovernanceBanner />
      </div>
    </AppShell>
  );
}
