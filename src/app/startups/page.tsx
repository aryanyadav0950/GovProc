import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateMatchScore } from "@/lib/matching/score";
import { checkEligibility } from "@/lib/eligibility/check";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";

export default async function StartupsPage({
  searchParams,
}: {
  searchParams: Promise<{ challenge?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedChallengeId = params.challenge;

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

  const selectedChallenge =
    challenges.find((challenge) => challenge.id === selectedChallengeId) ||
    challenges[0];

  const rankedStartups = selectedChallenge
    ? startups
        .map((startup) => {
          const result = calculateMatchScore({
            startup,
            challenge: selectedChallenge,
          });

          const eligibility = checkEligibility({
            sector: startup.sector,
            technologies: startup.technologies,
            readinessLevel: startup.readinessLevel,
            documents: startup.documents,
          });

          return {
            startup,
            result,
            eligibility,
          };
        })
        .sort((a, b) => b.result.matchScore - a.result.matchScore)
    : [];

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
        <Breadcrumbs items={[{ label: "Startup Discovery" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Stage 02 • Discovery & Matching
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              Startup Discovery & Matching
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Automated multi-factor matching and DPIIT eligibility screening against published innovation challenges.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/challenges"
              className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 hover:border-blue-500 transition"
            >
              ← Challenges
            </Link>
            <Link
              href={selectedChallenge ? `/assessments?challenge=${selectedChallenge.id}` : "/assessments"}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Risk Assessment →
            </Link>
          </div>
        </div>

        <ProcurementPipeline currentStage={2} />

        {/* Challenge selector */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-xl">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">
            Select Active Challenge for Matching:
          </p>

          <div className="flex flex-wrap gap-2.5">
            {challenges.map((challenge) => (
              <Link
                key={challenge.id}
                href={`/startups?challenge=${challenge.id}`}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition flex items-center gap-2 ${
                  selectedChallenge?.id === challenge.id
                    ? "border-blue-500 bg-blue-600 text-white shadow-md shadow-blue-600/30"
                    : "border-slate-800 bg-slate-950 text-slate-300 hover:border-slate-600 hover:bg-slate-900"
                }`}
              >
                <span>{challenge.title}</span>
                <span className="opacity-75 text-[10px]">({challenge.sector || "General"})</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Selected challenge info card */}
        {selectedChallenge && (
          <div className="rounded-2xl border border-blue-900/60 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                Target Innovation Problem Statement
              </span>
              <StatusBadge status={selectedChallenge.status} size="sm" />
            </div>

            <h2 className="text-xl font-black text-white">
              {selectedChallenge.title}
            </h2>

            <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
              {selectedChallenge.description}
            </p>

            {selectedChallenge.requiredCapabilities && (
              <div className="pt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="font-bold text-slate-300">Required Tech Capabilities:</span>
                <span className="rounded bg-slate-950 border border-slate-800 px-2.5 py-1 text-blue-300 font-mono text-[11px]">
                  {selectedChallenge.requiredCapabilities}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Ranked Startups List */}
        <div className="space-y-5">
          {rankedStartups.map(({ startup, result, eligibility }, index) => (
            <div
              key={startup.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 shadow-xl space-y-5 hover:border-slate-700 transition"
            >
              {/* Header */}
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black shadow ${
                      index === 0
                        ? "bg-amber-500 text-slate-950 font-black"
                        : "bg-blue-600 text-white"
                    }`}
                  >
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">
                        {startup.organization.name}
                      </h3>
                      {index === 0 && (
                        <span className="rounded bg-amber-950 border border-amber-800 px-2 py-0.5 text-[10px] font-black text-amber-300 uppercase">
                          Highest AI Match
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      Sector: <strong className="text-slate-200">{startup.sector || "General"}</strong> • Founded: <span className="text-slate-300">{startup.foundedYear || "2021"}</span> • Team Size: <span className="text-slate-300">{startup.teamSize || 20}</span>
                    </p>

                    <p className="mt-2 text-xs text-slate-300 leading-relaxed max-w-3xl">
                      {startup.description || "No startup description available."}
                    </p>
                  </div>
                </div>

                {/* Match Score & Eligibility Badge */}
                <div className="flex sm:flex-col items-center justify-between sm:justify-center shrink-0 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                  <div className="text-center">
                    <p className="text-4xl font-black text-blue-400">
                      {result.matchScore}%
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Match Score
                    </p>
                  </div>

                  <div className="mt-2">
                    <StatusBadge status={eligibility.status} size="sm" />
                  </div>
                </div>
              </div>

              {/* 4 Multi-criteria Sub-scores */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ScoreBar label="Capability Alignment" value={result.capabilityScore} />
                <ScoreBar label="Sector Domain Fit" value={result.sectorScore} />
                <ScoreBar label="Technology Stack" value={result.technologyScore} />
                <ScoreBar label="Readiness (TRL)" value={result.readinessScore} />
              </div>

              {/* Eligibility Checks Breakdown */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Preliminary DPIIT Screening Checks
                  </span>
                  <StatusBadge status={eligibility.status} size="sm" />
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {eligibility.checks.map((check) => (
                    <div
                      key={check.name}
                      className="rounded-lg border border-slate-800/80 bg-slate-900 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">{check.name}</span>
                        <span className={`text-[10px] font-bold ${check.passed ? "text-emerald-400" : "text-amber-400"}`}>
                          {check.passed ? "✓ Passed" : "! Review"}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed">
                        {check.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why this match explainability card */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-400">
                  Explainable AI Match Reasoning:
                </p>
                <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                  {result.explanation}
                </p>
              </div>

              {/* Workflow Actions */}
              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
                <Link
                  href={`/assessments?challenge=${selectedChallenge.id}&startup=${startup.id}`}
                  className="rounded-xl border border-blue-800 bg-blue-950/50 px-4 py-2 text-xs font-bold text-blue-300 hover:bg-blue-900/60 transition"
                >
                  Conduct Risk Assessment →
                </Link>
                <Link
                  href={`/evaluations?challenge=${selectedChallenge.id}&startup=${startup.id}`}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
                >
                  Committee Scorecard →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {rankedStartups.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-12 text-center">
            <p className="text-base font-bold text-slate-300">No startups registered yet.</p>
            <p className="text-xs text-slate-400 mt-1">Please ensure seed data is loaded.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400 font-medium">{label}</span>
        <span className="font-bold text-white">{value}%</span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}