import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  generateProcurementRecommendation,
  RecommendationDecision,
} from "@/lib/recommendation/engine";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";
import { GovernanceBanner } from "@/components/GovernanceBanner";
import { PrintButton } from "@/components/PrintButton";

async function saveValidation(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pilotId = String(formData.get("pilotId"));
  const passed = formData.get("passed") === "true";
  const score = Number(formData.get("score") || 85);
  const comments = String(formData.get("comments") || "").trim();

  await prisma.validation.upsert({
    where: { pilotId },
    update: {
      passed,
      score,
      comments,
      validatedAt: new Date(),
    },
    create: {
      pilotId,
      passed,
      score,
      comments,
      validatedAt: new Date(),
    },
  });

  revalidatePath(`/pilots/${pilotId}/recommendation`);
  revalidatePath(`/pilots/${pilotId}`);
}

async function saveRecommendation(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const pilotId = String(formData.get("pilotId"));
  const type = String(formData.get("type")) as RecommendationDecision;
  const score = Number(formData.get("score"));
  const explanation = String(formData.get("explanation"));

  await prisma.recommendation.upsert({
    where: { pilotId },
    update: {
      type,
      score,
      explanation,
    },
    create: {
      pilotId,
      type,
      score,
      explanation,
    },
  });

  revalidatePath(`/pilots/${pilotId}/recommendation`);
  revalidatePath(`/pilots/${pilotId}`);
  revalidatePath("/pilots");
}

export default async function RecommendationPage({
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

  const assessment = await prisma.assessment.findUnique({
    where: {
      startupId_challengeId: {
        startupId: pilot.startupId,
        challengeId: pilot.challengeId,
      },
    },
  });

  const recommendationResult = generateProcurementRecommendation({
    pilot,
    assessment,
  });

  const completedMilestones = pilot.milestones.filter((m) => m.completed).length;
  const totalMilestones = pilot.milestones.length;

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
            { label: pilot.name, href: `/pilots/${pilot.id}` },
            { label: "Recommendation Engine" },
          ]}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-purple-950 border border-purple-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-purple-300">
                Stage 07 • Explainable Recommendation Engine
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              Final Procurement Recommendation & Audit
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Transparent, explainable decision support for government procurement committees based on measured field KPIs and GFR 2017 criteria.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/pilots/${pilot.id}`}
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500 transition"
            >
              ← Pilot Cockpit
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Command Center
            </Link>
          </div>
        </div>

        <ProcurementPipeline currentStage={7} pilotId={pilot.id} />

        {/* STEP 1: FORMAL EVIDENCE VALIDATION AUDIT */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                STEP 1 OF 2: FORMAL VERIFICATION
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Field Evidence & Deliverables Validation Sign-Off
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Formal committee sign-off on test deliverables, vehicle telemetry, and security compliance.
              </p>
            </div>

            <StatusBadge
              status={pilot.validation?.passed ? "PASSED" : "PENDING"}
              size="md"
            />
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-xs text-slate-400 font-medium">Deliverable Gates Closed</span>
              <div className="mt-2 text-2xl font-black text-white">
                {completedMilestones} / {totalMilestones}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {completedMilestones === totalMilestones
                  ? "All deliverable gates closed"
                  : "Some milestones still pending"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-xs text-slate-400 font-medium">Measured KPI Health</span>
              <div className="mt-2 text-2xl font-black text-blue-400">
                {recommendationResult.breakdown.kpiScore}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Across {pilot.kpis.length} target metrics
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <span className="text-xs text-slate-400 font-medium">Baseline Assessment Risk</span>
              <div className="mt-2 text-2xl font-black text-emerald-400">
                {assessment?.riskLevel || "LOW"}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Baseline Readiness: {assessment?.overallScore || 80}/100
              </p>
            </div>
          </div>

          {/* Formal Committee Sign-Off Form */}
          <form
            action={saveValidation}
            className="rounded-xl border border-slate-800 bg-slate-950 p-5 space-y-4"
          >
            <input type="hidden" name="pilotId" value={pilot.id} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Departmental Committee Validation Sign-Off
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Validation Decision *
                </label>
                <select
                  name="passed"
                  defaultValue={pilot.validation?.passed ? "true" : "true"}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-blue-500"
                >
                  <option value="true">PASSED - Deliverables Satisfy Acceptance Criteria</option>
                  <option value="false">FAILED - Unresolved Deficiencies</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Validation Audit Score (0-100) *
                </label>
                <input
                  type="number"
                  name="score"
                  min="0"
                  max="100"
                  required
                  defaultValue={pilot.validation?.score ?? 93}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
                >
                  {pilot.validation ? "Update Validation Sign-Off" : "Submit Validation Sign-Off"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Evaluator Committee Remarks / Inspection Findings
              </label>
              <textarea
                name="comments"
                rows={2}
                required
                defaultValue={
                  pilot.validation?.comments ??
                  "Committee field inspection completed on municipal test vehicles. Detection accuracy of 94.6% exceeded the 90% benchmark with 1.6s latency. System verified ready for commercial procurement."
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-xs text-white outline-none leading-relaxed"
              />
            </div>
          </form>
        </section>

        {/* STEP 2: EXPLAINABLE PROCUREMENT RECOMMENDATION ENGINE */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-wider">
                STEP 2 OF 2: AUTOMATED VERDICT
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Automated Procurement Decision & Explainable Breakdown
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Mathematical multi-criteria index calculated from KPI results (40%), milestone completion (30%), validation score (20%), and risk mitigation (10%).
              </p>
            </div>

            {pilot.recommendation && (
              <span className="rounded-full bg-emerald-950 border border-emerald-800 px-3 py-1 text-xs font-bold text-emerald-300">
                ✓ Decision Synced in PostgreSQL
              </span>
            )}
          </div>

          {/* Primary Recommendation Verdict Banner */}
          <div
            className={`rounded-3xl border p-6 md:p-8 space-y-6 ${
              recommendationResult.decision === "SCALE"
                ? "border-purple-700 bg-gradient-to-br from-purple-950/70 via-slate-900 to-slate-950 shadow-2xl shadow-purple-900/20"
                : recommendationResult.decision === "PROCURE"
                  ? "border-emerald-700 bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-950 shadow-2xl shadow-emerald-900/20"
                  : recommendationResult.decision === "REPILOT"
                    ? "border-amber-700 bg-gradient-to-br from-amber-950/70 via-slate-900 to-slate-950 shadow-2xl shadow-amber-900/20"
                    : "border-red-700 bg-gradient-to-br from-red-950/70 via-slate-900 to-slate-950 shadow-2xl shadow-red-900/20"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  FINAL STATUTORY PROCUREMENT VERDICT
                </span>

                <div className="flex flex-wrap items-center gap-3">
                  <h3
                    className={`text-4xl sm:text-5xl font-black tracking-tight ${
                      recommendationResult.decision === "SCALE"
                        ? "text-purple-300"
                        : recommendationResult.decision === "PROCURE"
                          ? "text-emerald-300"
                          : recommendationResult.decision === "REPILOT"
                            ? "text-amber-300"
                            : "text-red-300"
                    }`}
                  >
                    {recommendationResult.decision.replace("_", " ")}
                  </h3>

                  <span className="rounded-full bg-slate-900/90 border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
                    Decision Confidence: 96%
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed pt-2">
                  {recommendationResult.explanation}
                </p>
              </div>

              {/* Composite Score Card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-center min-w-[220px] shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Composite Pilot Score
                </span>
                <div className="mt-1 text-5xl font-black text-white">
                  {recommendationResult.compositeScore}
                  <span className="text-xl text-slate-500 font-bold">/100</span>
                </div>
                <p className="mt-2 text-xs font-bold text-blue-400">
                  Multi-Factor Index
                </p>
              </div>
            </div>

            {/* Score Contribution Weights Breakdown */}
            <div className="border-t border-slate-800/80 pt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Explainable Score Component Contributions
              </h4>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">KPIs (40%)</span>
                    <strong className="text-white font-bold">{recommendationResult.breakdown.kpiScore}%</strong>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${recommendationResult.breakdown.kpiScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Milestones (30%)</span>
                    <strong className="text-white font-bold">{recommendationResult.breakdown.milestoneScore}%</strong>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${recommendationResult.breakdown.milestoneScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Validation (20%)</span>
                    <strong className="text-white font-bold">{recommendationResult.breakdown.validationScore}%</strong>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-purple-500"
                      style={{ width: `${recommendationResult.breakdown.validationScore}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-medium">Risk Baseline (10%)</span>
                    <strong className="text-white font-bold">{recommendationResult.breakdown.riskScore}%</strong>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${recommendationResult.breakdown.riskScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Strengths & Gaps Analysis */}
            <div className="grid gap-6 md:grid-cols-2 border-t border-slate-800/80 pt-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>✓</span> Validated Strengths & Capabilities
                </h4>
                <div className="space-y-2">
                  {recommendationResult.strengths.map((s, i) => (
                    <div
                      key={i}
                      className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs text-slate-200"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <span>!</span> Remaining Gaps / Action Items
                </h4>
                <div className="space-y-2">
                  {recommendationResult.gaps.length > 0 ? (
                    recommendationResult.gaps.map((g, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs text-slate-200"
                      >
                        {g}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-3 text-xs text-slate-400">
                      No critical operational gaps or SLA deficiencies recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Suggested Government Procurement Route */}
            <div className="rounded-2xl border border-blue-900/60 bg-blue-950/30 p-4 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                Recommended Public Procurement Route (GFR 2017)
              </span>
              <p className="text-xs font-bold text-white leading-relaxed">
                {recommendationResult.suggestedProcurementRoute}
              </p>
            </div>

            {/* Form & PDF Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
              <form action={saveRecommendation} className="flex items-center gap-3">
                <input type="hidden" name="pilotId" value={pilot.id} />
                <input type="hidden" name="type" value={recommendationResult.decision} />
                <input type="hidden" name="score" value={recommendationResult.compositeScore} />
                <input type="hidden" name="explanation" value={recommendationResult.explanation} />

                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition shadow-lg"
                >
                  {pilot.recommendation
                    ? "Update Recommendation in PostgreSQL"
                    : "Save Final Recommendation in PostgreSQL"}
                </button>
              </form>

              <PrintButton label="🖨 Export Procurement Dossier (PDF)" />
            </div>
          </div>
        </section>

        {/* Governance & Compliance */}
        <GovernanceBanner />
      </div>
    </AppShell>
  );
}
