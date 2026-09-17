import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";

async function createPilot(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const startupId = String(formData.get("startupId") || "");
  const challengeId = String(formData.get("challengeId") || "");
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const startDateStr = String(formData.get("startDate") || "");
  const durationDays = Number(formData.get("durationDays") || 60);
  const paymentAmount = Number(formData.get("paymentAmount") || 500000);

  if (!startupId || !challengeId || !name) {
    return;
  }

  const startDate = startDateStr ? new Date(startDateStr) : new Date();
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  // Milestones
  const m1Title = String(formData.get("m1Title") || "Phase 1: Sandbox Integration & Security Audit");
  const m1Desc = String(formData.get("m1Desc") || "Deploy platform in isolated government test environment and verify API compatibility.");
  const m2Title = String(formData.get("m2Title") || "Phase 2: Live Field Trial Deployment");
  const m2Desc = String(formData.get("m2Desc") || "Deploy sensors / software at target municipal sites and gather 30 days of real-world operational data.");
  const m3Title = String(formData.get("m3Title") || "Phase 3: Accuracy Validation & Acceptance Sign-off");
  const m3Desc = String(formData.get("m3Desc") || "Conduct formal verification of KPI achievements and final departmental review.");

  // KPIs
  const kpi1Name = String(formData.get("kpi1Name") || "Core Detection Precision & Accuracy");
  const kpi1Target = Number(formData.get("kpi1Target") || 90);
  const kpi1Unit = String(formData.get("kpi1Unit") || "%");

  const kpi2Name = String(formData.get("kpi2Name") || "System Live Uptime & Availability");
  const kpi2Target = Number(formData.get("kpi2Target") || 99);
  const kpi2Unit = String(formData.get("kpi2Unit") || "%");

  const kpi3Name = String(formData.get("kpi3Name") || "Edge Alert Transmission Latency");
  const kpi3Target = Number(formData.get("kpi3Target") || 2.5);
  const kpi3Unit = String(formData.get("kpi3Unit") || "sec");

  const pilot = await prisma.pilot.create({
    data: {
      startupId,
      challengeId,
      name,
      description,
      startDate,
      endDate,
      milestones: {
        create: [
          {
            title: m1Title,
            description: m1Desc,
            dueDate: new Date(startDate.getTime() + Math.round(durationDays * 0.3) * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            title: m2Title,
            description: m2Desc,
            dueDate: new Date(startDate.getTime() + Math.round(durationDays * 0.7) * 24 * 60 * 60 * 1000),
            completed: false,
          },
          {
            title: m3Title,
            description: m3Desc,
            dueDate: endDate,
            completed: false,
          },
        ],
      },
      kpis: {
        create: [
          {
            name: kpi1Name,
            target: kpi1Target,
            unit: kpi1Unit,
            description: `Achieve target threshold of ${kpi1Target} ${kpi1Unit} during operational field trial.`,
          },
          {
            name: kpi2Name,
            target: kpi2Target,
            unit: kpi2Unit,
            description: `Maintain high system availability of ${kpi2Target} ${kpi2Unit} under peak operational load.`,
          },
          {
            name: kpi3Name,
            target: kpi3Target,
            unit: kpi3Unit,
            description: `Processing / latency bound under ${kpi3Target} ${kpi3Unit}.`,
          },
        ],
      },
      payment: {
        create: {
          milestone: "Tranche 1: Advance / Initial Sandbox Setup",
          amount: paymentAmount,
          status: "PENDING",
        },
      },
    },
  });

  redirect(`/pilots/${pilot.id}`);
}

export default async function NewPilotPage({
  searchParams,
}: {
  searchParams: Promise<{
    challengeId?: string;
    startupId?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;

  const [startups, challenges, userOrg] = await Promise.all([
    prisma.startup.findMany({
      include: { organization: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.challenge.findMany({
      orderBy: { createdAt: "desc" },
    }),
    session.user.organizationId
      ? prisma.organization.findUnique({
          where: { id: session.user.organizationId },
        })
      : null,
  ]);

  const selectedStartup =
    startups.find((s) => s.id === params.startupId) || startups[0];

  const selectedChallenge =
    challenges.find((c) => c.id === params.challengeId) || challenges[0];

  const defaultPilotName =
    selectedStartup && selectedChallenge
      ? `${selectedStartup.organization.name} - ${selectedChallenge.title} Pilot Trial`
      : "Innovation Procurement Pilot Deployment";

  const defaultStartDate = new Date().toISOString().split("T")[0];

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        organizationName: userOrg?.name || "Department of Urban Development",
      }}
    >
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Pilots", href: "/pilots" },
            { label: "Launch Pilot Trial" },
          ]}
        />

        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
              Stage 05 • Pilot Sandbox Creation
            </span>
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
            Launch Innovation Pilot Sandbox
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Configure the pilot envelope, milestone gates, measurable KPIs, and tranche funding for the shortlisted startup.
          </p>
        </div>

        <ProcurementPipeline currentStage={5} />

        <form action={createPilot} className="space-y-6">
          {/* Section 1: Scope */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              1. Startup & Challenge Selection
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Shortlisted Startup *
                </label>
                <select
                  name="startupId"
                  required
                  defaultValue={selectedStartup?.id}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-medium"
                >
                  {startups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.organization.name} ({s.sector || "General"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Target Government Challenge *
                </label>
                <select
                  name="challengeId"
                  required
                  defaultValue={selectedChallenge?.id}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-medium"
                >
                  {challenges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Pilot Deployment Title *
              </label>
              <input
                name="name"
                required
                defaultValue={defaultPilotName}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Pilot Scope & Field Trial Objectives *
              </label>
              <textarea
                name="description"
                rows={3}
                required
                defaultValue="Field trial deployment to validate automated anomaly detection accuracy, system response times, and legacy municipal IT interoperability under real-world operating conditions."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 text-xs text-white outline-none focus:border-blue-500 leading-relaxed"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="startDate"
                  required
                  defaultValue={defaultStartDate}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Pilot Duration (Days) *
                </label>
                <input
                  type="number"
                  name="durationDays"
                  required
                  min="15"
                  max="365"
                  defaultValue={60}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Initial Tranche Allocation (₹) *
                </label>
                <input
                  type="number"
                  name="paymentAmount"
                  required
                  min="0"
                  defaultValue={500000}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-xs text-white outline-none focus:border-blue-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Milestone Gates */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">
                2. Phase Deliverable Milestones
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Phase-wise milestone gate reviews before final procurement recommendation.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Milestone Gate 1</span>
                <input
                  name="m1Title"
                  required
                  defaultValue="Phase 1: Isolated Sandbox Integration & Security Audit"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold outline-none focus:border-blue-500"
                />
                <input
                  name="m1Desc"
                  defaultValue="Deploy in isolated government test bed, complete CERT-In review, and configure API bridges."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400 outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Milestone Gate 2</span>
                <input
                  name="m2Title"
                  required
                  defaultValue="Phase 2: Live Field Trial & Telemetry Logging"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold outline-none focus:border-blue-500"
                />
                <input
                  name="m2Desc"
                  defaultValue="Deploy live camera / sensor kits and log 30 consecutive days of operational road inspection feeds."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400 outline-none"
                />
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Milestone Gate 3</span>
                <input
                  name="m3Title"
                  required
                  defaultValue="Phase 3: Accuracy Validation & Acceptance Sign-off"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold outline-none focus:border-blue-500"
                />
                <input
                  name="m3Desc"
                  defaultValue="Formal KPI verification with technical committee, field inspection, and procurement readiness sign-off."
                  className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-[11px] text-slate-400 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: KPIs */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-white">
                3. Measurable Key Performance Indicators (KPIs)
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                Automated validation metrics evaluated by the recommendation engine.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPI 1: Core Accuracy</label>
                <input
                  name="kpi1Name"
                  required
                  defaultValue="Detection Accuracy"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="kpi1Target"
                    required
                    defaultValue={90}
                    className="w-2/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold"
                  />
                  <input
                    name="kpi1Unit"
                    defaultValue="%"
                    className="w-1/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 text-center"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPI 2: Availability</label>
                <input
                  name="kpi2Name"
                  required
                  defaultValue="System Uptime"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="kpi2Target"
                    required
                    defaultValue={99.0}
                    className="w-2/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold"
                  />
                  <input
                    name="kpi2Unit"
                    defaultValue="%"
                    className="w-1/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 text-center"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KPI 3: Response Speed</label>
                <input
                  name="kpi3Name"
                  required
                  defaultValue="Processing Latency"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.1"
                    name="kpi3Target"
                    required
                    defaultValue={2.5}
                    className="w-2/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold"
                  />
                  <input
                    name="kpi3Unit"
                    defaultValue="sec"
                    className="w-1/3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-6">
            <Link
              href="/evaluations"
              className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-emerald-600 px-8 py-3 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg shadow-emerald-600/30"
            >
              Launch Pilot & Open Cockpit →
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
