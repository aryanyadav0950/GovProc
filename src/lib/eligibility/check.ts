export type EligibilityInput = {
  sector: string | null;
  technologies: string | null;
  readinessLevel: number | null;
  documents: {
    status: string;
  }[];
};

export type EligibilityResult = {
  status: "ELIGIBLE" | "NOT_ELIGIBLE" | "NEEDS_REVIEW";
  checks: {
    name: string;
    passed: boolean;
    message: string;
  }[];
};

export function checkEligibility(
  startup: EligibilityInput
): EligibilityResult {
  const checks = [
    {
      name: "Startup profile",
      passed: Boolean(startup.sector && startup.technologies),
      message:
        startup.sector && startup.technologies
          ? "Sector and technology information available."
          : "Sector or technology information is missing.",
    },
    {
      name: "Technology readiness",
      passed: (startup.readinessLevel ?? 0) >= 6,
      message:
        (startup.readinessLevel ?? 0) >= 6
          ? "Technology readiness is sufficient for initial screening."
          : "Technology readiness is below the minimum screening threshold.",
    },
    {
      name: "Supporting documents",
      passed: startup.documents.some(
        (document) => document.status === "VERIFIED"
      ),
      message: startup.documents.some(
        (document) => document.status === "VERIFIED"
      )
        ? "At least one supporting document has been verified."
        : "No verified supporting document is available.",
    },
  ];

  const failed = checks.filter((check) => !check.passed).length;

  let status: EligibilityResult["status"];

  if (failed === 0) {
    status = "ELIGIBLE";
  } else if (failed === 1) {
    status = "NEEDS_REVIEW";
  } else {
    status = "NOT_ELIGIBLE";
  }

  return {
    status,
    checks,
  };
}