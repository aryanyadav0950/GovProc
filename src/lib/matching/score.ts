export type MatchingInput = {
  startup: {
    sector: string | null;
    technologies: string | null;
    readinessLevel: number | null;
    description: string | null;
  };
  challenge: {
    sector: string | null;
    requiredCapabilities: string | null;
    description: string;
    problemStatement: string;
  };
};

export type MatchingResult = {
  matchScore: number;
  capabilityScore: number;
  sectorScore: number;
  technologyScore: number;
  readinessScore: number;
  explanation: string;
};

function normalize(text: string | null | undefined) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string) {
  return new Set(
    text
      .split(/[\s,]+/)
      .map((word) => word.trim())
      .filter((word) => word.length > 2)
  );
}

function overlapScore(required: string, available: string) {
  const requiredWords = words(normalize(required));
  const availableWords = words(normalize(available));

  if (requiredWords.size === 0) return 50;

  let matches = 0;

  for (const word of requiredWords) {
    if (availableWords.has(word)) {
      matches++;
    }
  }

  return Math.round((matches / requiredWords.size) * 100);
}

export function calculateMatchScore(
  input: MatchingInput
): MatchingResult {
  const { startup, challenge } = input;

  // Sector alignment
  const startupSector = normalize(startup.sector);
  const challengeSector = normalize(challenge.sector);

  let sectorScore = 50;

  if (startupSector && challengeSector) {
    sectorScore =
      startupSector === challengeSector
        ? 100
        : startupSector.includes(challengeSector) ||
            challengeSector.includes(startupSector)
          ? 80
          : 30;
  }

  // Technology/capability alignment
  const capabilityScore = overlapScore(
    challenge.requiredCapabilities || "",
    startup.technologies || ""
  );

  // Technology context alignment
  const technologyContext = normalize(
    `${startup.technologies || ""} ${startup.description || ""}`
  );

  const challengeContext = normalize(
    `${challenge.description} ${challenge.problemStatement} ${
      challenge.requiredCapabilities || ""
    }`
  );

  const technologyScore = overlapScore(
    challengeContext,
    technologyContext
  );

  // Readiness
  const readinessScore = startup.readinessLevel
    ? Math.min(100, Math.max(0, startup.readinessLevel * 10))
    : 50;

  // Weighted final score
  const matchScore = Math.round(
    capabilityScore * 0.3 +
      sectorScore * 0.2 +
      technologyScore * 0.2 +
      readinessScore * 0.15 +
      50 * 0.15
  );

  const strengths: string[] = [];

  if (capabilityScore >= 70) {
    strengths.push("strong capability alignment");
  }

  if (sectorScore >= 80) {
    strengths.push("relevant sector experience");
  }

  if (technologyScore >= 70) {
    strengths.push("good technology alignment");
  }

  if (readinessScore >= 80) {
    strengths.push("high technology readiness");
  }

  const explanation =
    strengths.length > 0
      ? `This startup shows ${strengths.join(
          ", "
        )} for the selected government challenge.`
      : "The startup has partial alignment and may require further evaluation.";

  return {
    matchScore,
    capabilityScore,
    sectorScore,
    technologyScore,
    readinessScore,
    explanation,
  };
}