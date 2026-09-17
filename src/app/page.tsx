import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const stages = [
    {
      num: "01",
      title: "Challenge Formulation",
      desc: "Government departments post high-priority operational bottlenecks with defined pilot envelopes under GFR Rule 194.",
      badge: "Problem Definition",
    },
    {
      num: "02",
      title: "Startup Discovery & Matching",
      desc: "Multi-factor vector matching across sector, capability, and technology readiness levels (TRL).",
      badge: "AI Discovery",
    },
    {
      num: "03",
      title: "Risk & Claim Assessment",
      desc: "Automated risk intelligence with actionable mitigation plans and human-in-the-loop evidence verification.",
      badge: "Due Diligence",
    },
    {
      num: "04",
      title: "Committee Evaluation Matrix",
      desc: "Standardized 4-pillar scorecard (Problem Fit 25%, Technical 30%, Financial 20%, Scalability 25%).",
      badge: "Multi-Factor Scoring",
    },
    {
      num: "05",
      title: "Sandbox Pilot Deployment",
      desc: "Field deployment with milestone gates, real-world telemetry, and automated tranche disbursals.",
      badge: "Field Testing",
    },
    {
      num: "06",
      title: "Evidence & KPI Validation",
      desc: "Formal evaluation committee validation audit comparing field outcomes against contractual benchmarks.",
      badge: "Audit Verification",
    },
    {
      num: "07",
      title: "Explainable Recommendation",
      desc: "Mathematical scoring formula generating clear GFR verdicts: SCALE, PROCURE, REPILOT, or DO NOT PROCEED.",
      badge: "Final Decision",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-black text-white shadow-lg shadow-blue-500/20 text-base tracking-wide">
              GP
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">
                GOVPROC • INNOVATION PROCUREMENT
              </span>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                Government Startup Innovation Procurement Platform
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Sign In to Command Center →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-16 space-y-16">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-800 bg-blue-950/60 px-4 py-1.5 text-xs font-bold text-blue-300">
            <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span>GovProc • Government Innovation Procurement Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
            Transparent, Explainable & Evidence-Backed{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400">
              Innovation Procurement
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed font-normal">
            Bridging Indian government departments with high-potential DPIIT startups through an automated, audit-ready 7-stage sandbox procurement lifecycle under GFR 2017 Rule 194.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-blue-600/30 hover:bg-blue-500 transition"
            >
              Access Command Center
            </Link>
            <a
              href="#stages"
              className="rounded-xl border border-slate-700 bg-slate-900 px-7 py-3.5 text-sm font-bold text-slate-200 hover:border-slate-500 transition"
            >
              Explore 7-Stage Workflow ↓
            </a>
          </div>

          {/* Quick Demo Credentials Reminder */}
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Pre-seeded Test Roles:</span>
            <span className="rounded bg-blue-950 border border-blue-900 px-2 py-0.5 text-blue-300 font-mono">Government Nodal Officer</span>
            <span className="rounded bg-purple-950 border border-purple-900 px-2 py-0.5 text-purple-300 font-mono">Expert Evaluator</span>
            <span className="rounded bg-emerald-950 border border-emerald-900 px-2 py-0.5 text-emerald-300 font-mono">Startup Innovator</span>
            <span className="text-slate-500">(Password: Demo@12345)</span>
          </div>
        </div>

        {/* 7-Stage Innovation Procurement Journey */}
        <section id="stages" className="space-y-8 scroll-mt-24">
          <div className="text-center space-y-2">
            <p className="text-xs font-black uppercase tracking-wider text-blue-400">
              Statutory Procurement Lifecycle
            </p>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              The 7-Stage Government Procurement Framework
            </h2>
            <p className="text-sm text-slate-400 max-w-2xl mx-auto">
              Every innovation challenge progresses through structured, traceable evaluation gates ensuring public accountability and value for money.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {stages.map((st) => (
              <div
                key={st.num}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl space-y-3 relative overflow-hidden group hover:border-blue-500 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-950 border border-blue-800 text-xs font-black text-blue-300">
                    {st.num}
                  </span>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-300">
                    {st.badge}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition">
                  {st.title}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            ))}

            {/* Final CTA Card */}
            <div className="rounded-2xl border border-purple-900/80 bg-gradient-to-br from-purple-950/60 to-slate-900 p-6 shadow-xl flex flex-col justify-between space-y-4">
              <div>
                <span className="rounded bg-purple-900/80 px-2 py-0.5 text-[10px] font-black uppercase text-purple-200 tracking-wide">
                  PLATFORM DEMO
                </span>
                <h3 className="mt-3 text-lg font-bold text-white">
                  Explore GovProc
                </h3>
                <p className="mt-1 text-xs text-purple-200/80 leading-relaxed">
                  Explore the complete government innovation procurement workflow, from challenge formulation and startup discovery to risk assessment, pilot validation, and final recommendation.
                </p>
              </div>

              <Link
                href="/login"
                className="rounded-xl bg-purple-600 py-2.5 text-center text-xs font-bold text-white shadow-lg hover:bg-purple-500 transition"
              >
                Explore Platform →
              </Link>
            </div>
          </div>
        </section>

        {/* Compliance Footer Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-slate-200">GovProc — Government Innovation Procurement Platform</span>
            <p className="mt-0.5 text-slate-500">
              Developed in accordance with General Financial Rules (GFR 2017) Rule 194 & CVC transparency guidelines.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 font-mono text-[11px]">Next.js 16</span>
            <span className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 font-mono text-[11px]">Prisma 7</span>
            <span className="rounded bg-slate-800 px-2.5 py-1 text-slate-300 font-mono text-[11px]">PostgreSQL</span>
          </div>
        </div>
      </main>
    </div>
  );
}
