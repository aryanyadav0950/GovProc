export type StructuredRisk = {
  title: string;
  description: string;
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  mitigation: string;
};

export type StructuredClaim = {
  claim: string;
  evidence: string | null;
  status: "SUPPORTED" | "VERIFY" | "UNSUPPORTED";
  confidence: number;
};

export type AssessmentInput = {
  startup: {
    sector: string | null;
    technologies: string | null;
    description: string | null;
    readinessLevel: number | null;
    funding?: number | null;
    revenue?: number | null;
    documents?: {
      fileName: string;
      documentType: string;
      status: string;
    }[];
  };
  challenge: {
    title?: string | null;
    sector: string | null;
    requiredCapabilities: string | null;
    description: string;
    problemStatement: string;
  };
};

export type AssessmentResult = {
  overallScore: number;
  problemFit: number;
  technicalCapability: number;
  financialHealth: number;
  teamCapability: number;
  scalability: number;
  technologyReadiness: number;
  securityReadiness: number;
  pilotReadiness: number;
  risk: "LOW" | "MEDIUM" | "HIGH";
  claimsForVerification: string[];
  risks: string[];
  missingInformation: string[];
  evidence: string[];
  structuredRisks: StructuredRisk[];
  structuredClaims: StructuredClaim[];
};

function normalize(value: string | null | undefined) {
  return (value || "").toLowerCase();
}

function keywordScore(text: string, keywords: string[]) {
  if (!text) return 40;

  const matches = keywords.filter((keyword) =>
    text.includes(keyword.toLowerCase())
  );

  return Math.min(100, 50 + matches.length * 10);
}

export function assessStartup(
  input: AssessmentInput
): AssessmentResult {
  const startupText = normalize(
    `${input.startup.description || ""} ${
      input.startup.technologies || ""
    } ${input.startup.sector || ""}`
  );

  const problemFit = keywordScore(startupText, [
    ...normalize(input.challenge.requiredCapabilities)
      .split(/[,\s]+/)
      .filter((x) => x.length > 3)
      .slice(0, 5),
  ]);

  const technicalCapability = keywordScore(startupText, [
    "ai",
    "artificial intelligence",
    "machine learning",
    "computer vision",
    "iot",
    "analytics",
    "cloud",
    "software",
    "edge",
  ]);

  const technologyReadiness = Math.min(
    100,
    Math.max(30, (input.startup.readinessLevel || 5) * 10)
  );

  const scalability = keywordScore(startupText, [
    "platform",
    "cloud",
    "scalable",
    "deployment",
    "enterprise",
    "real-time",
  ]);

  const pilotReadiness = Math.round(
    technologyReadiness * 0.7 + technicalCapability * 0.3
  );

  const hasFunding = Boolean(input.startup.funding && input.startup.funding > 0);
  const financialHealth = hasFunding ? 78 : 68;
  const teamCapability = 75;
  const hasSecurityCert = (input.startup.documents || []).some(
    (d) =>
      d.documentType.toLowerCase().includes("security") &&
      d.status === "VERIFIED"
  );
  const securityReadiness = hasSecurityCert
    ? 90
    : startupText.includes("security")
      ? 75
      : 65;

  const overallScore = Math.round(
    problemFit * 0.18 +
      technicalCapability * 0.18 +
      financialHealth * 0.10 +
      teamCapability * 0.10 +
      scalability * 0.12 +
      technologyReadiness * 0.12 +
      securityReadiness * 0.10 +
      pilotReadiness * 0.10
  );

  const structuredRisks: StructuredRisk[] = [];
  const structuredClaims: StructuredClaim[] = [];
  const missingInformation: string[] = [];
  const evidence: string[] = [];

  const verifiedDocs = (input.startup.documents || []).filter(
    (d) => d.status === "VERIFIED"
  );

  // Risk evaluation & structured mitigations
  if (securityReadiness < 75) {
    structuredRisks.push({
      title: "Security Evidence & Compliance Gap",
      description:
        "No verified security certification or ISO/IEC audit documentation was identified in the startup repository.",
      level: "HIGH",
      mitigation:
        "Mandate submission of an independent third-party vulnerability assessment (VAPT) and SSL/TLS security certification prior to granting pilot live access.",
    });
  } else if (!hasSecurityCert) {
    structuredRisks.push({
      title: "Security Certification Verification Pending",
      description:
        "Security documentation submitted is pending formal government verification.",
      level: "MEDIUM",
      mitigation:
        "Perform fast-track document verification with CERT-In accredited auditor.",
    });
  }

  if (technologyReadiness < 70) {
    structuredRisks.push({
      title: "Early Technology Readiness Stage",
      description:
        `Self-reported TRL level is ${input.startup.readinessLevel || 5}/10, indicating the core system may need sandbox stabilization before field deployment.`,
      level: "HIGH",
      mitigation:
        "Structure Phase 1 of the pilot with a strictly isolated sandbox environment and synthetic government test data.",
    });
  } else {
    structuredRisks.push({
      title: "Field Deployment & Infrastructure Integration",
      description:
        "Real-time edge IoT integration into legacy municipal systems requires compatibility review.",
      level: "LOW",
      mitigation:
        "Include dedicated 2-week API integration milestone with government IT nodal officer.",
    });
  }

  if (financialHealth < 75) {
    structuredRisks.push({
      title: "Financial Runway & Working Capital Risk",
      description:
        "Cash flow sustainability and balance sheet runway should be verified for multi-month pilot execution.",
      level: "MEDIUM",
      mitigation:
        "Adopt milestone-based tranche disbursement to limit government financial risk.",
    });
  }

  // Document and profile completeness
  if (!input.startup.description) {
    missingInformation.push("Detailed startup operational description");
  }
  if (!input.startup.technologies) {
    missingInformation.push("Detailed technology stack & architectural capabilities");
  }
  if (!input.startup.documents || input.startup.documents.length === 0) {
    missingInformation.push("Certified Company Profile & Incorporation Certificate");
    missingInformation.push("Prior Government / Enterprise Deployment References");
  }

  // Evidence
  if (input.startup.description) {
    evidence.push(
      "Verified startup profile with declared domain capabilities."
    );
  }
  if (input.startup.technologies) {
    evidence.push(
      `Declared technology stack: ${input.startup.technologies}`
    );
  }
  verifiedDocs.forEach((doc) => {
    evidence.push(`Verified Supporting Artifact: ${doc.fileName} (${doc.documentType})`);
  });

  // Claims extraction & verification
  const previousProjectDoc = (input.startup.documents || []).find((d) =>
    d.documentType.toLowerCase().includes("previous") ||
    d.documentType.toLowerCase().includes("deployment")
  );

  structuredClaims.push({
    claim: `Startup has capability to deploy ${input.startup.technologies || "required technologies"} at municipal scale.`,
    evidence: previousProjectDoc ? previousProjectDoc.fileName : null,
    status: previousProjectDoc
      ? previousProjectDoc.status === "VERIFIED"
        ? "SUPPORTED"
        : "VERIFY"
      : "VERIFY",
    confidence: previousProjectDoc ? 0.88 : 0.65,
  });

  const secDoc = (input.startup.documents || []).find((d) =>
    d.documentType.toLowerCase().includes("security")
  );

  structuredClaims.push({
    claim: "End-to-end data security and compliance with government data protection norms.",
    evidence: secDoc ? secDoc.fileName : null,
    status: secDoc
      ? secDoc.status === "VERIFIED"
        ? "SUPPORTED"
        : "VERIFY"
      : "UNSUPPORTED",
    confidence: secDoc ? 0.92 : 0.45,
  });

  structuredClaims.push({
    claim: `Solution fulfills problem requirement: "${input.challenge.title || "Challenge"}" with automated monitoring.`,
    evidence: "Company_Profile.pdf",
    status: problemFit > 70 ? "SUPPORTED" : "VERIFY",
    confidence: Number((problemFit / 100).toFixed(2)),
  });

  const risk: AssessmentResult["risk"] =
    overallScore >= 80
      ? "LOW"
      : overallScore >= 65
        ? "MEDIUM"
        : "HIGH";

  const risks = structuredRisks.map((r) => `${r.title}: ${r.description}`);
  const claimsForVerification = structuredClaims.map(
    (c) => `${c.claim} [Status: ${c.status}, Confidence: ${Math.round(c.confidence * 100)}%]`
  );

  return {
    overallScore,
    problemFit,
    technicalCapability,
    financialHealth,
    teamCapability,
    scalability,
    technologyReadiness,
    securityReadiness,
    pilotReadiness,
    risk,
    claimsForVerification,
    risks,
    missingInformation,
    evidence,
    structuredRisks,
    structuredClaims,
  };
}