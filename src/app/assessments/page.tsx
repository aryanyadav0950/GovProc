import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assessStartup } from "@/lib/assessment/engine";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";
import { GovernanceBanner } from "@/components/GovernanceBanner";

async function saveAssessment(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "GOVERNMENT" && session.user.role !== "EVALUATOR" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const startupId = String(formData.get("startupId"));
  const challengeId = String(formData.get("challengeId"));

  const startup = await prisma.startup.findUnique({
    where: { id: startupId },
    include: { documents: true },
  });

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
  });

  if (!startup || !challenge) {
    return;
  }

  const result = assessStartup({
    startup,
    challenge,
  });

  await prisma.$transaction(async (tx) => {
    const assessment = await tx.assessment.upsert({
      where: {
        startupId_challengeId: {
          startupId,
          challengeId,
        },
      },
      update: {
        overallScore: result.overallScore,
        problemFit: result.problemFit,
        technicalCapability: result.technicalCapability,
        financialHealth: result.financialHealth,
        teamCapability: result.teamCapability,
        scalability: result.scalability,
        technologyReadiness: result.technologyReadiness,
        securityReadiness: result.securityReadiness,
        pilotReadiness: result.pilotReadiness,
        riskLevel: result.risk,
        summary: `Startup readiness assessment completed with an overall score of ${result.overallScore}/100. Risk level: ${result.risk}.`,
      },
      create: {
        startupId,
        challengeId,
        overallScore: result.overallScore,
        problemFit: result.problemFit,
        technicalCapability: result.technicalCapability,
        financialHealth: result.financialHealth,
        teamCapability: result.teamCapability,
        scalability: result.scalability,
        technologyReadiness: result.technologyReadiness,
        securityReadiness: result.securityReadiness,
        pilotReadiness: result.pilotReadiness,
        riskLevel: result.risk,
        summary: `Startup readiness assessment completed with an overall score of ${result.overallScore}/100. Risk level: ${result.risk}.`,
      },
    });

    // Refresh risks
    await tx.risk.deleteMany({
      where: { assessmentId: assessment.id },
    });

    if (result.structuredRisks.length > 0) {
      await tx.risk.createMany({
        data: result.structuredRisks.map((r) => ({
          assessmentId: assessment.id,
          title: r.title,
          description: r.description,
          level: r.level,
          mitigation: r.mitigation,
        })),
      });
    }

    // Refresh claims
    await tx.claim.deleteMany({
      where: { assessmentId: assessment.id },
    });

    if (result.structuredClaims.length > 0) {
      await tx.claim.createMany({
        data: result.structuredClaims.map((c) => ({
          assessmentId: assessment.id,
          claim: c.claim,
          evidence: c.evidence,
          status: c.status,
          confidence: c.confidence,
        })),
      });
    }
  });

  revalidatePath("/assessments");
}

async function updateClaimStatus(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "GOVERNMENT" && session.user.role !== "EVALUATOR" && session.user.role !== "ADMIN")) {
    redirect("/login");
  }

  const claimId = String(formData.get("claimId"));
  const status = String(formData.get("status"));

  await prisma.claim.update({
    where: { id: claimId },
    data: { status },
  });

  revalidatePath("/assessments");
}

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    startup?: string;
    challenge?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const [startups, challenges, userOrg] = await Promise.all([
    prisma.startup.findMany({
      include: {
        organization: true,
        documents: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.challenge.findMany({
      where: {
        status: "OPEN",
      },
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

  const selectedStartup =
    startups.find((startup) => startup.id === params.startup) ||
    startups[0];

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === params.challenge) ||
    challenges[0];

  const assessment =
    selectedStartup && selectedChallenge
      ? assessStartup({
          startup: selectedStartup,
          challenge: selectedChallenge,
        })
      : null;

  const savedAssessment =
    selectedStartup && selectedChallenge
      ? await prisma.assessment.findUnique({
          where: {
            startupId_challengeId: {
              startupId: selectedStartup.id,
              challengeId: selectedChallenge.id,
            },
          },
          include: {
            risks: true,
            claims: true,
          },
        })
      : null;

  const displayRisks = savedAssessment?.risks && savedAssessment.risks.length > 0
    ? savedAssessment.risks
    : (assessment?.structuredRisks || []).map((r, i) => ({
        id: `gen-${i}`,
        assessmentId: "",
        title: r.title,
        description: r.description,
        level: r.level,
        mitigation: r.mitigation,
      }));

  const displayClaims = savedAssessment?.claims && savedAssessment.claims.length > 0
    ? savedAssessment.claims
    : (assessment?.structuredClaims || []).map((c, i) => ({
        id: `gen-${i}`,
        assessmentId: "",
        claim: c.claim,
        evidence: c.evidence,
        status: c.status,
        confidence: c.confidence,
      }));

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
        <Breadcrumbs items={[{ label: "Risk & Readiness Assessment" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Stage 03 • AI Assessment & Evidence Audit
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              Startup Risk & Readiness Intelligence
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Multi-dimensional technology readiness, automated risk mitigation modeling, and claim verification.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/startups"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500 transition"
            >
              ← Discovery
            </Link>
            <Link
              href={selectedChallenge ? `/evaluations?challenge=${selectedChallenge.id}` : "/evaluations"}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Committee Scorecard →
            </Link>
          </div>
        </div>

        <ProcurementPipeline currentStage={3} />

        {/* Startup & Challenge Selectors */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Startup Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Select Startup Innovator:
            </p>
            <div className="flex flex-wrap gap-2">
              {startups.map((startup) => (
                <Link
                  key={startup.id}
                  href={`/assessments?startup=${startup.id}${
                    selectedChallenge ? `&challenge=${selectedChallenge.id}` : ""
                  }`}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    selectedStartup?.id === startup.id
                      ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                  }`}
                >
                  {startup.organization.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Challenge Selector */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Select Target Challenge:
            </p>
            <div className="flex flex-wrap gap-2">
              {challenges.map((challenge) => (
                <Link
                  key={challenge.id}
                  href={`/assessments?${
                    selectedStartup ? `startup=${selectedStartup.id}&` : ""
                  }challenge=${challenge.id}`}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    selectedChallenge?.id === challenge.id
                      ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                  }`}
                >
                  {challenge.title}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {assessment && selectedStartup && selectedChallenge && (
          <>
            {/* Assessment Banner */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                    Comprehensive Readiness Dossier
                  </span>

                  <h2 className="mt-1 text-2xl md:text-3xl font-black text-white">
                    {selectedStartup.organization.name}
                  </h2>

                  <p className="mt-1 text-xs text-slate-300">
                    Challenge: <span className="font-semibold text-blue-300">{selectedChallenge.title}</span>
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1">
                      Sector: <strong className="text-slate-200">{selectedStartup.sector || "General"}</strong>
                    </span>
                    <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1">
                      TRL: <strong className="text-slate-200">Level {selectedStartup.readinessLevel || 5}/10</strong>
                    </span>
                    <span className="rounded-lg bg-slate-950 border border-slate-800 px-2.5 py-1">
                      Uploaded Docs: <strong className="text-slate-200">{selectedStartup.documents.length} Files</strong>
                    </span>
                  </div>
                </div>

                <div className="text-center shrink-0 border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-8">
                  <div className="text-5xl font-black text-blue-400">
                    {assessment.overallScore}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">
                    Readiness Score / 100
                  </p>

                  <div className="mt-3">
                    <StatusBadge status={assessment.risk} size="md" />
                  </div>
                </div>
              </div>

              {/* Save / Sync Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
                <form action={saveAssessment} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="startupId" value={selectedStartup.id} />
                  <input type="hidden" name="challengeId" value={selectedChallenge.id} />

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
                  >
                    {savedAssessment ? "Re-sync Assessment to PostgreSQL" : "Save Assessment & Risks to DB"}
                  </button>

                  {savedAssessment && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      ✓ Persisted in DB ({savedAssessment.risks?.length || 0} risks, {savedAssessment.claims?.length || 0} claims)
                    </span>
                  )}
                </form>

                <Link
                  href={`/evaluations?challenge=${selectedChallenge.id}&startup=${selectedStartup.id}`}
                  className="rounded-xl border border-blue-700 bg-blue-950/40 px-5 py-2.5 text-xs font-bold text-blue-300 hover:bg-blue-900/50 transition"
                >
                  Proceed to Committee Scorecard →
                </Link>
              </div>
            </div>

            {/* 8-Pillar Score Breakdown */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white">
                Multi-Dimensional Readiness Breakdown (8 Pillars)
              </h2>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ScoreCard label="Problem-Solution Fit" value={assessment.problemFit} />
                <ScoreCard label="Technical Capability" value={assessment.technicalCapability} />
                <ScoreCard label="Financial Health" value={assessment.financialHealth} />
                <ScoreCard label="Team Capability" value={assessment.teamCapability} />
                <ScoreCard label="Scalability" value={assessment.scalability} />
                <ScoreCard label="Technology Readiness (TRL)" value={assessment.technologyReadiness} />
                <ScoreCard label="Security Readiness" value={assessment.securityReadiness} />
                <ScoreCard label="Pilot Sandbox Readiness" value={assessment.pilotReadiness} />
              </div>
            </section>

            {/* Risk Intelligence & Mitigations */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                    Operational & Security Risk Intelligence
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Identified operational bottlenecks and actionable mitigation steps required before live deployment.
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                  {displayRisks.length} Risks Flagged
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {displayRisks.map((risk, index) => (
                  <div
                    key={risk.id || index}
                    className={`rounded-xl border p-4 space-y-3 ${
                      risk.level === "HIGH" || risk.level === "CRITICAL"
                        ? "border-red-900/60 bg-red-950/20"
                        : risk.level === "MEDIUM"
                          ? "border-amber-900/60 bg-amber-950/20"
                          : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">{risk.title}</h3>
                      <StatusBadge status={risk.level} size="sm" />
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {risk.description}
                    </p>

                    {risk.mitigation && (
                      <div className="rounded-lg border border-slate-800 bg-slate-900/90 p-3">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                          Recommended Mitigation:
                        </span>
                        <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                          {risk.mitigation}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Claims Verification & Human Audit */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-blue-400" />
                    Claims Requiring Human Verification
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Technical and performance claims extracted from startup artifacts requiring evaluator verification.
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                  {displayClaims.length} Claims Audit
                </span>
              </div>

              <div className="space-y-4">
                {displayClaims.map((claim, index) => (
                  <div
                    key={claim.id || index}
                    className="rounded-xl border border-slate-800 bg-slate-950 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                  >
                    <div className="space-y-1.5 max-w-3xl">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={claim.status} size="sm" />
                        {claim.confidence !== null && claim.confidence !== undefined && (
                          <span className="text-xs text-slate-400">
                            Confidence: <strong className="text-white">{Math.round(claim.confidence * 100)}%</strong>
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-bold text-slate-200">
                        {claim.claim}
                      </p>

                      {claim.evidence && (
                        <p className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Supporting Artifact:</span>
                          <span className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 font-mono text-blue-300">
                            {claim.evidence}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Verification Action Buttons */}
                    {savedAssessment && claim.id && !claim.id.startsWith("gen-") ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <form action={updateClaimStatus}>
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="status" value="SUPPORTED" />
                          <button
                            type="submit"
                            disabled={claim.status === "SUPPORTED"}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              claim.status === "SUPPORTED"
                                ? "bg-emerald-600 text-white cursor-default"
                                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500 hover:text-emerald-300"
                            }`}
                          >
                            ✓ Supported
                          </button>
                        </form>

                        <form action={updateClaimStatus}>
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="status" value="VERIFY" />
                          <button
                            type="submit"
                            disabled={claim.status === "VERIFY"}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              claim.status === "VERIFY"
                                ? "bg-amber-600 text-white cursor-default"
                                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-amber-500 hover:text-amber-300"
                            }`}
                          >
                            ? Needs Proof
                          </button>
                        </form>

                        <form action={updateClaimStatus}>
                          <input type="hidden" name="claimId" value={claim.id} />
                          <input type="hidden" name="status" value="UNSUPPORTED" />
                          <button
                            type="submit"
                            disabled={claim.status === "UNSUPPORTED"}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                              claim.status === "UNSUPPORTED"
                                ? "bg-red-600 text-white cursor-default"
                                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-red-500 hover:text-red-300"
                            }`}
                          >
                            ✕ Unsupported
                          </button>
                        </form>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        Sync to PostgreSQL to toggle status
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Evidence & Missing Documentation Grid */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                  <span>✓</span> Verified Evidence Artifacts
                </h3>
                <div className="space-y-2">
                  {assessment.evidence.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-emerald-300">
                      {item}
                    </div>
                  ))}
                  {assessment.evidence.length === 0 && (
                    <p className="text-xs text-slate-500">No documents verified yet.</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <span>!</span> Missing Documentation & Gaps
                </h3>
                <div className="space-y-2">
                  {assessment.missingInformation.map((item, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-amber-300">
                      {item}
                    </div>
                  ))}
                  {assessment.missingInformation.length === 0 && (
                    <p className="text-xs text-slate-500">Complete documentation available.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Statutory Compliance Banner */}
            <GovernanceBanner />
          </>
        )}
      </div>
    </AppShell>
  );
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 line-clamp-1">{label}</span>
        <span className="text-base font-black text-white">{value}%</span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}