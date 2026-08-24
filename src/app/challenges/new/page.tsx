import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/AppShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ProcurementPipeline } from "@/components/ProcurementPipeline";

async function createChallenge(formData: FormData) {
  "use server";

  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  let departmentId = session.user.organizationId;
  if (!departmentId) {
    const govOrg = await prisma.organization.findFirst({
      where: { type: "GOVERNMENT" },
    });
    departmentId = govOrg?.id;
  }

  if (!departmentId) {
    redirect("/login");
  }

  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const problemStatement = String(
    formData.get("problemStatement") || ""
  ).trim();
  const sector = String(formData.get("sector") || "").trim();
  const requiredCapabilities = String(
    formData.get("requiredCapabilities") || ""
  ).trim();
  const budgetRange = String(
    formData.get("budgetRange") || ""
  ).trim();

  const pilotDurationRaw = String(
    formData.get("pilotDuration") || ""
  ).trim();

  if (!title || !description || !problemStatement) {
    return;
  }

  const pilotDuration = pilotDurationRaw
    ? Number(pilotDurationRaw)
    : 60;

  await prisma.challenge.create({
    data: {
      departmentId,
      title,
      description,
      problemStatement,
      sector: sector || null,
      requiredCapabilities: requiredCapabilities || null,
      budgetRange: budgetRange || null,
      pilotDuration,
      status: "OPEN",
    },
  });

  redirect("/challenges");
}

export default async function NewChallengePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "GOVERNMENT" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

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
      <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
        <Breadcrumbs
          items={[
            { label: "Challenges", href: "/challenges" },
            { label: "Create Challenge" },
          ]}
        />

        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-950 border border-blue-800 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-300">
              Stage 01 • Problem Formulation
            </span>
          </div>
          <h1 className="mt-2 text-2xl md:text-3xl font-black text-white tracking-tight">
            Create Innovation Challenge
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Define a high-priority government operational problem with target capabilities and pilot envelope.
          </p>
        </div>

        <ProcurementPipeline currentStage={1} />

        <form
          action={createChallenge}
          className="rounded-2xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-xl space-y-6"
        >
          {/* Title */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Challenge Title *
            </label>
            <input
              name="title"
              required
              placeholder="e.g. AI-Based Urban Infrastructure Road Distress Monitoring"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Executive Summary & Scope *
            </label>
            <textarea
              name="description"
              required
              rows={3}
              placeholder="Describe the operational scope, expected outcome, and departmental objectives..."
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Problem Statement */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
              Detailed Problem Statement & Pain Points *
            </label>
            <textarea
              name="problemStatement"
              required
              rows={4}
              placeholder="What current manual bottleneck, inspection failure, or resource constraint needs solving?"
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Sector */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Sector / Domain
              </label>
              <input
                name="sector"
                placeholder="Smart Cities, CleanTech, Mobility..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Required Capabilities */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Required Technologies & Capabilities
              </label>
              <input
                name="requiredCapabilities"
                placeholder="Computer Vision, Edge AI, IoT, GIS..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Budget */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Indicative Pilot Budget
              </label>
              <input
                name="budgetRange"
                placeholder="₹25 Lakh - ₹50 Lakh"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Pilot Duration */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-300">
                Field Trial Duration (Days)
              </label>
              <input
                name="pilotDuration"
                type="number"
                min="15"
                defaultValue={60}
                placeholder="60"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Statutory Notice */}
          <div className="rounded-xl border border-blue-900/60 bg-blue-950/30 p-4 text-xs text-slate-300">
            <span className="font-bold text-blue-300">Public Innovation Challenge Notice:</span> This challenge will be published under GFR Rule 194 innovation procurement provisions, opening it for automated DPIIT startup discovery and eligibility filtering.
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-6">
            <Link
              href="/challenges"
              className="rounded-xl border border-slate-700 px-5 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-500 transition shadow-md shadow-blue-600/30"
            >
              Publish Challenge →
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}