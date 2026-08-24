import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";
import { GovernanceBanner } from "@/components/GovernanceBanner";

async function saveEvaluation(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const startupId = String(formData.get("startupId") || "");
  const challengeId = String(formData.get("challengeId") || "");
  const problemFit = Number(formData.get("problemFit") || 0);
  const technical = Number(formData.get("technical") || 0);
  const financial = Number(formData.get("financial") || 0);
  const scalability = Number(formData.get("scalability") || 0);
  const comments = String(formData.get("comments") || "").trim();

  // Weighted overall evaluation score (4 Pillars)
  const overallScore = Math.round(
    problemFit * 0.25 + technical * 0.3 + financial * 0.2 + scalability * 0.25
  );

  await prisma.evaluation.upsert({
    where: {
      evaluatorId_startupId_challengeId: {
        evaluatorId: session.user.id,
        startupId,
        challengeId,
      },
    },
    update: {
      problemFit,
      technical,
      financial,
      scalability,
      overallScore,
      comments,
    },
    create: {
      evaluatorId: session.user.id,
      startupId,
      challengeId,
      problemFit,
      technical,
      financial,
      scalability,
      overallScore,
      comments,
    },
  });

  revalidatePath("/evaluations");
}

export default async function EvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    challenge?: string;
    startup?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const [challenges, userOrg] = await Promise.all([
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

  const selectedChallenge =
    challenges.find((c) => c.id === params.challenge) || challenges[0];

  const startups = await prisma.startup.findMany({
    include: {
      organization: true,
      documents: true,
      matches: {
        where: selectedChallenge ? { challengeId: selectedChallenge.id } : undefined,
      },
      assessments: {
        where: selectedChallenge ? { challengeId: selectedChallenge.id } : undefined,
        include: {
          risks: true,
          claims: true,
        },
      },
      evaluations: {
        where: selectedChallenge ? { challengeId: selectedChallenge.id } : undefined,
        include: {
          evaluator: true,
        },
      },
      pilots: {
        where: selectedChallenge ? { challengeId: selectedChallenge.id } : undefined,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const selectedStartup =
    startups.find((s) => s.id === params.startup) || startups[0];

  const currentEvaluation = selectedStartup?.evaluations?.find(
    (e) => e.evaluatorId === session.user.id
  );

  // Calculate ranked matrix
  const startupMatrix = startups
    .map((s) => {
      const match = s.matches[0];
      const assessment = s.assessments[0];
      const evalItem = s.evaluations[0];
      const pilot = s.pilots[0];

      const matchScore = match?.matchScore ?? 75;
      const assessmentScore = assessment?.overallScore ?? 70;
      const evalScore = evalItem?.overallScore ?? null;
      const compositeScore =
        evalScore !== null
          ? Math.round(evalScore * 0.6 + assessmentScore * 0.4)
          : Math.round(matchScore * 0.5 + assessmentScore * 0.5);

      return {
        startup: s,
        matchScore,
        assessmentScore,
        riskLevel: assessment?.riskLevel || "MEDIUM",
        evalScore,
        compositeScore,
        evaluation: evalItem,
        pilot,
      };
    })
    .sort((a, b) => b.compositeScore - a.compositeScore);

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
        <Breadcrumbs items={[{ label: "Committee Evaluations & Shortlisting" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Stage 04 • Committee Evaluation Matrix
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              Expert Committee Evaluation Workspace
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Score shortlisted innovators across the 4 statutory pillars, compare side-by-side rankings, and initiate sandbox pilots.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/assessments"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500 transition"
            >
              ← Assessments
            </Link>
            <Link
              href="/pilots"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Pilot Cockpit →
            </Link>
          </div>
        </div>

        <ProcurementPipeline currentStage={4} />

        {/* Challenge selector */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Active Challenge:
          </p>

          <div className="flex flex-wrap gap-2.5">
            {challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/evaluations?challenge=${challenge.id}`}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  selectedChallenge?.id === challenge.id
                    ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                }`}
              >
                <div>{challenge.title}</div>
                <div className="text-[10px] opacity-75 mt-0.5">
                  {challenge.sector || "General"} • {challenge.budgetRange || "Budget TBD"}
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Side-by-Side Startup Comparison Matrix Table */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-xl overflow-hidden">
          <div className="border-b border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                Side-by-Side Startup Comparison & Ranking Matrix
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Comparative ranking combining AI capability match, readiness assessment, and expert committee scores.
              </p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
              {startupMatrix.length} Startups Evaluated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Rank & Startup</th>
                  <th className="px-4 py-4 text-center">AI Match</th>
                  <th className="px-4 py-4 text-center">Readiness / TRL</th>
                  <th className="px-4 py-4 text-center">Risk Profile</th>
                  <th className="px-4 py-4 text-center">Expert Score</th>
                  <th className="px-4 py-4 text-center">Composite Score</th>
                  <th className="px-4 py-4 text-center">Pilot Stage</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {startupMatrix.map((item, idx) => {
                  const isTopRanked = idx === 0;
                  const isSelected = selectedStartup?.id === item.startup.id;

                  return (
                    <tr
                      key={item.startup.id}
                      className={`transition hover:bg-slate-800/40 ${
                        isSelected ? "bg-slate-800/60" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                              isTopRanked
                                ? "bg-amber-500 text-slate-950 font-black shadow"
                                : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{item.startup.organization.name}</span>
                              {isTopRanked && (
                                <span className="rounded bg-amber-950 border border-amber-800 px-1.5 py-0.2 text-[9px] font-black text-amber-300 uppercase">
                                  Top Match
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                              {item.startup.technologies || "Technologies declared"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-center font-bold text-blue-400">
                        {item.matchScore}%
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="font-bold text-white">{item.assessmentScore}</span>
                        <span className="text-[10px] text-slate-500 ml-1">
                          (TRL {item.startup.readinessLevel || 5})
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <StatusBadge status={item.riskLevel} size="sm" />
                      </td>

                      <td className="px-4 py-4 text-center font-bold">
                        {item.evalScore !== null ? (
                          <span className="text-emerald-400 font-black">{item.evalScore}/100</span>
                        ) : (
                          <span className="text-slate-500 italic">Pending</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-center">
                        <span className="text-sm font-black text-blue-300">
                          {item.compositeScore}
                        </span>
                        <span className="text-[10px] text-slate-500">/100</span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        {item.pilot ? (
                          <span className="rounded bg-purple-950 border border-purple-800 px-2 py-0.5 text-[10px] font-bold text-purple-300 uppercase">
                            Pilot Active
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not Initiated</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/evaluations?challenge=${selectedChallenge.id}&startup=${item.startup.id}`}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              isSelected
                                ? "bg-blue-600 text-white shadow"
                                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500"
                            }`}
                          >
                            {isSelected ? "Scoring Sheet ↓" : "Score"}
                          </Link>

                          {item.pilot ? (
                            <Link
                              href={`/pilots/${item.pilot.id}`}
                              className="rounded-lg border border-purple-600 bg-purple-950/40 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-900/50 transition"
                            >
                              Cockpit →
                            </Link>
                          ) : (
                            <Link
                              href={`/pilots/new?challengeId=${selectedChallenge.id}&startupId=${item.startup.id}`}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow transition"
                            >
                              Shortlist for Pilot →
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4-Pillar Evaluation Scoring Form */}
        {selectedStartup && selectedChallenge && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  STATUTORY COMMITTEE SCORING SHEET
                </span>
                <h2 className="mt-1 text-2xl font-black text-white">
                  Score {selectedStartup.organization.name}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Challenge: <span className="font-semibold text-slate-200">{selectedChallenge.title}</span> • Evaluator: <strong className="text-blue-300">{session.user.name}</strong>
                </p>
              </div>

              {currentEvaluation && (
                <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 p-4 text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Current Scorecard</span>
                  <div className="text-3xl font-black text-emerald-300 mt-0.5">
                    {currentEvaluation.overallScore} / 100
                  </div>
                </div>
              )}
            </div>

            <form action={saveEvaluation} className="space-y-6">
              <input type="hidden" name="startupId" value={selectedStartup.id} />
              <input type="hidden" name="challengeId" value={selectedChallenge.id} />

              <div className="grid gap-4 md:grid-cols-2">
                {/* 1. Problem Fit */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      1. Problem-Solution Fit (25%)
                    </label>
                    <span className="text-[11px] text-slate-400">Scale: 0-100</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    How precisely does this solution address the department's operational problem?
                  </p>
                  <input
                    type="number"
                    name="problemFit"
                    min="0"
                    max="100"
                    required
                    defaultValue={currentEvaluation?.problemFit ?? 88}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-white font-bold text-base outline-none focus:border-blue-500"
                  />
                </div>

                {/* 2. Technical Feasibility */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      2. Technical Feasibility (30%)
                    </label>
                    <span className="text-[11px] text-slate-400">Scale: 0-100</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Maturity of technology stack, AI/IoT architecture, edge compute, and security readiness.
                  </p>
                  <input
                    type="number"
                    name="technical"
                    min="0"
                    max="100"
                    required
                    defaultValue={currentEvaluation?.technical ?? 85}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-white font-bold text-base outline-none focus:border-blue-500"
                  />
                </div>

                {/* 3. Financial Viability */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      3. Financial Viability & VFM (20%)
                    </label>
                    <span className="text-[11px] text-slate-400">Scale: 0-100</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Cost-efficiency within indicative budget ({selectedChallenge.budgetRange || "Standard"}) and financial runway.
                  </p>
                  <input
                    type="number"
                    name="financial"
                    min="0"
                    max="100"
                    required
                    defaultValue={currentEvaluation?.financial ?? 78}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-white font-bold text-base outline-none focus:border-blue-500"
                  />
                </div>

                {/* 4. Scalability */}
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-200">
                      4. Scalability & Deployment (25%)
                    </label>
                    <span className="text-[11px] text-slate-400">Scale: 0-100</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ease of deployment, team capability, integration with legacy government IT infra, and statewide scaling.
                  </p>
                  <input
                    type="number"
                    name="scalability"
                    min="0"
                    max="100"
                    required
                    defaultValue={currentEvaluation?.scalability ?? 84}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-white font-bold text-base outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Qualitative Remarks */}
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Committee Remarks & Procurement Justification
                </label>
                <textarea
                  name="comments"
                  rows={3}
                  required
                  defaultValue={currentEvaluation?.comments ?? "Strong candidate for controlled pilot deployment. Technology readiness and problem fit meet departmental guidelines. Security verification should be conducted during milestone 1."}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 p-3.5 text-xs text-white outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
                  >
                    {currentEvaluation ? "Update Evaluation Scorecard" : "Submit Evaluation Scorecard"}
                  </button>

                  {currentEvaluation && (
                    <span className="text-xs text-emerald-400 font-bold">
                      ✓ Recorded in PostgreSQL
                    </span>
                  )}
                </div>

                <Link
                  href={`/pilots/new?challengeId=${selectedChallenge.id}&startupId=${selectedStartup.id}`}
                  className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg flex items-center gap-2"
                >
                  <span>Shortlist for Pilot Sandbox</span>
                  <span>→</span>
                </Link>
              </div>
            </form>
          </section>
        )}

        <GovernanceBanner />
      </div>
    </AppShell>
  );
}
