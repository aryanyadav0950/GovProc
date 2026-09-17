export type RecommendationDecision = "REPILOT" | "PROCURE" | "SCALE" | "DO_NOT_PROCEED";

export type RecommendationInput = {
  pilot: {
    id: string;
    name: string;
    milestones: {
      title: string;
      completed: boolean;
    }[];
    kpis: {
      name: string;
      target: number;
      unit: string | null;
      results: {
        value: number;
        evidenceUrl?: string | null;
      }[];
    }[];
    validation?: {
      passed: boolean;
      score: number | null;
      comments: string | null;
    } | null;
  };
  assessment?: {
    overallScore: number | null;
    riskLevel: string | null;
  } | null;
};

export type RecommendationResult = {
  decision: RecommendationDecision;
  compositeScore: number;
  explanation: string;
  breakdown: {
    kpiScore: number;
    milestoneScore: number;
    validationScore: number;
    riskScore: number;
  };
  strengths: string[];
  gaps: string[];
  suggestedProcurementRoute: string;
};

export function generateProcurementRecommendation(
  input: RecommendationInput
): RecommendationResult {
  const { pilot, assessment } = input;

  // 1. Milestone Completion Score (0-100)
  const totalMilestones = pilot.milestones.length;
  const completedMilestones = pilot.milestones.filter((m) => m.completed).length;
  const milestoneScore = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 50;

  // 2. KPI Achievement Score (0-100)
  let totalKpiPct = 0;
  const kpiCount = pilot.kpis.length;

  if (kpiCount > 0) {
    for (const kpi of pilot.kpis) {
      const latestVal = kpi.results[0]?.value ?? 0;
      const pct = kpi.target > 0 ? (latestVal / kpi.target) * 100 : 70;
      totalKpiPct += Math.min(120, Math.max(0, pct));
    }
  }

  const kpiScore = kpiCount > 0 ? Math.round(totalKpiPct / kpiCount) : 60;

  // 3. Validation Score (0-100)
  const validationScore = pilot.validation?.score ?? (pilot.validation?.passed ? 85 : 50);
  const validationPassed = pilot.validation?.passed ?? (milestoneScore >= 70 && kpiScore >= 70);

  // 4. Risk / Baseline Readiness Score (0-100)
  const riskScore = assessment?.riskLevel === "LOW"
    ? 90
    : assessment?.riskLevel === "MEDIUM"
      ? 75
      : 55;

  // Composite Weighted Score: KPI (40%), Milestone (30%), Validation (20%), Risk (10%)
  const compositeScore = Math.round(
    kpiScore * 0.4 +
    milestoneScore * 0.3 +
    validationScore * 0.2 +
    riskScore * 0.1
  );

  // Determine Recommendation Decision
  let decision: RecommendationDecision;
  let explanation = "";
  const strengths: string[] = [];
  const gaps: string[] = [];
  let suggestedProcurementRoute = "";

  if (
    compositeScore >= 90 &&
    validationPassed &&
    milestoneScore === 100 &&
    validationScore >= 88 &&
    kpiScore >= 90
  ) {
    decision = "SCALE";
    explanation = `Outstanding pilot execution with a composite score of ${compositeScore}/100 and 100% milestone completion. The startup exceeded benchmark KPI targets under real-world municipal conditions. Highly recommended for multi-department and statewide scaled rollout.`;
    strengths.push("All deliverable milestones completed on schedule without technical debt.");
    strengths.push(`High KPI performance average of ${kpiScore}% against contractual targets.`);
    strengths.push("Formal committee validation passed with exemplary evaluation.");
    suggestedProcurementRoute = "Direct Rate Contract / Framework Agreement for Statewide Scaling under Rule 149/194 GFR.";
  } else if (compositeScore >= 72 && validationPassed && milestoneScore >= 60) {
    decision = "PROCURE";
    explanation = `Successful pilot verification with a composite score of ${compositeScore}/100. Core functional KPIs and milestones met departmental acceptance criteria. Recommended for standard government commercial procurement.`;
    strengths.push(`Demonstrated core capability meeting ${kpiScore}% of key performance indicators.`);
    strengths.push(`Completed ${completedMilestones}/${totalMilestones} pilot milestones.`);
    strengths.push("Formal government validation inspection approved.");
    if (kpiScore < 85) {
      gaps.push("Secondary latency/edge optimization can be mandated as part of annual maintenance SLA.");
    }
    suggestedProcurementRoute = "Standard Commercial Procurement via GeM Custom Bid / Single Source Innovation Window.";
  } else if (compositeScore >= 50) {
    decision = "REPILOT";
    explanation = `Moderate pilot outcome with a composite score of ${compositeScore}/100. System demonstrates viable potential, but fell short on certain edge-case KPIs or unfinished milestones. Recommended for a short 30-day extended sandbox trial.`;
    strengths.push("Core problem-solution fit validated in live environment.");
    if (milestoneScore < 100) {
      gaps.push(`Unfinished milestones (${totalMilestones - completedMilestones} pending completion).`);
    }
    if (kpiScore < 75) {
      gaps.push(`Key performance indicators averaged ${kpiScore}%, below standard commercial threshold.`);
    }
    suggestedProcurementRoute = "Extended 30-day Sandbox Phase 2 with strict milestone-gated micro-payments.";
  } else {
    decision = "DO_NOT_PROCEED";
    explanation = `Pilot did not satisfy essential procurement criteria with a composite score of ${compositeScore}/100. Significant KPI shortfalls and operational risks preclude commercial procurement at this stage.`;
    gaps.push("Substantial variance between claimed capabilities and measured field results.");
    gaps.push("Formal validation failed or multiple critical milestones remained incomplete.");
    suggestedProcurementRoute = "Archive pilot dossier; startup encouraged to reapply in future challenge rounds after product maturation.";
  }

  return {
    decision,
    compositeScore,
    explanation,
    breakdown: {
      kpiScore,
      milestoneScore,
      validationScore,
      riskScore,
    },
    strengths,
    gaps,
    suggestedProcurementRoute,
  };
}
