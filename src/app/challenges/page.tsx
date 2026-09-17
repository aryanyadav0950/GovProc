import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";
import { StatusBadge } from "@/components/StatusBadge";

export default async function ChallengesListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const challenges = await prisma.challenge.findMany({
    include: {
      department: true,
      matches: true,
      assessments: true,
      pilots: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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
      <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        <Breadcrumbs items={[{ label: "Challenges" }]} />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
                Stage 01 • Problem Formulation
              </span>
            </div>
            <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
              Department Innovation Challenges
            </h1>
            <p className="mt-1 text-xs text-slate-400">
              Government operational challenges published for open startup matching, eligibility screening, and sandbox pilot testing.
            </p>
          </div>

          <Link
            href="/challenges/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition duration-200 flex items-center gap-2 w-fit shrink-0"
          >
            <span>+ Create Innovation Challenge</span>
          </Link>
        </div>

        <ProcurementPipeline currentStage={1} />

        <div className="space-y-4">
          {challenges.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 transition hover:border-slate-700 shadow-xl"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{c.title}</h2>
                    <StatusBadge status={c.status} size="sm" />
                  </div>

                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    {c.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                    <span>Sector: <strong className="text-slate-200">{c.sector || "General"}</strong></span>
                    <span>Budget: <strong className="text-slate-200">{c.budgetRange || "₹25L - ₹50L"}</strong></span>
                    <span>Pilot Duration: <strong className="text-slate-200">{c.pilotDuration || 60} Days</strong></span>
                    <span>Matched Startups: <strong className="text-blue-400">{c.matches.length}</strong></span>
                    <span>Pilots Launched: <strong className="text-emerald-400">{c.pilots.length}</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0 border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
                  <Link
                    href={`/startups?challenge=${c.id}`}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500 hover:bg-slate-900 transition"
                  >
                    🔍 Discover Startups
                  </Link>
                  <Link
                    href={`/assessments?challenge=${c.id}`}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500 hover:bg-slate-900 transition"
                  >
                    📊 Readiness Assessment
                  </Link>
                  <Link
                    href={`/evaluations?challenge=${c.id}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow"
                  >
                    Expert Evaluation →
                  </Link>
                </div>
              </div>
            </div>
          ))}

          {challenges.length === 0 && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-12 text-center">
              <p className="text-base font-bold text-slate-200">No innovation challenges created yet.</p>
              <p className="text-xs text-slate-400 mt-1">Publish a problem statement to initiate startup matching.</p>
              <Link
                href="/challenges/new"
                className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500"
              >
                Create Challenge Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
