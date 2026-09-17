import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding GovProc Demo Database...");

  const password = await bcrypt.hash("Demo@12345", 10);

  // 1. Clean existing records in correct relation order to ensure 100% idempotency
  await prisma.recommendation.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.validation.deleteMany();
  await prisma.kPIResult.deleteMany();
  await prisma.kPI.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.pilot.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.evaluation.deleteMany();
  await prisma.startupMatch.deleteMany();
  await prisma.eligibilityCheck.deleteMany();
  await prisma.document.deleteMany();
  await prisma.startup.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  console.log("Cleaned previous records.");

  // 2. Create Government Organizations
  const urbanDept = await prisma.organization.create({
    data: {
      name: "Department of Urban Development",
      type: "GOVERNMENT",
    },
  });

  const meityDept = await prisma.organization.create({
    data: {
      name: "Ministry of Electronics & Information Technology",
      type: "GOVERNMENT",
    },
  });

  // 3. Create Users
  // Government Admin & Officers
  await prisma.user.create({
    data: {
      name: "Rajesh Kumar (Nodal Officer)",
      email: "department@gov-demo.in",
      passwordHash: password,
      role: "GOVERNMENT",
      organizationId: urbanDept.id,
    },
  });

  await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@demo.in",
      passwordHash: password,
      role: "ADMIN",
    },
  });

  // Expert Evaluators
  const evaluator1 = await prisma.user.create({
    data: {
      name: "Dr. Ananya Sharma (Technical Chair)",
      email: "evaluator@demo.in",
      passwordHash: password,
      role: "EVALUATOR",
    },
  });

  const evaluator2 = await prisma.user.create({
    data: {
      name: "Vikram Mehta (Financial & Procurement Advisor)",
      email: "evaluator2@demo.in",
      passwordHash: password,
      role: "EVALUATOR",
    },
  });

  // 4. Startups Data
  const startupDefs = [
    {
      name: "CivicVision Technologies",
      email: "startup@demo.in",
      description: "Edge AI computer vision platform for automated municipal road anomaly, drainage defect, and streetlight inspection.",
      sector: "Smart Cities",
      foundedYear: 2021,
      teamSize: 32,
      technologies: "Computer Vision, PyTorch, Edge AI, IoT, Geospatial GIS",
      funding: 4500000,
      revenue: 2800000,
      readinessLevel: 8,
    },
    {
      name: "GreenGrid Analytics",
      email: "greengrid@demo.in",
      description: "Predictive energy analytics and IoT platform helping government administrative buildings reduce power consumption by 22%.",
      sector: "CleanTech",
      foundedYear: 2020,
      teamSize: 24,
      technologies: "Data Analytics, Time-Series AI, Cloud, SCADA Integration",
      funding: 3200000,
      revenue: 2100000,
      readinessLevel: 7,
    },
    {
      name: "UrbanPulse Systems",
      email: "urbanpulse@demo.in",
      description: "Real-time municipal traffic flow optimization and adaptive signal control using radar sensors and distributed AI.",
      sector: "Smart Cities",
      foundedYear: 2019,
      teamSize: 45,
      technologies: "IoT Radar, Edge Computing, Adaptive Signal AI, Cloud",
      funding: 7800000,
      revenue: 5200000,
      readinessLevel: 9,
    },
    {
      name: "NexGen Mobility",
      email: "nexgen@demo.in",
      description: "Intelligent fleet dispatch and route optimization engine for municipal waste management vehicles.",
      sector: "Mobility",
      foundedYear: 2022,
      teamSize: 18,
      technologies: "Genetic Algorithms, Cloud, Vehicle Telematics",
      funding: 1800000,
      revenue: 900000,
      readinessLevel: 6,
    },
  ];

  const startups = [];
  for (const s of startupDefs) {
    const org = await prisma.organization.create({
      data: {
        name: s.name,
        type: "STARTUP",
      },
    });

    await prisma.user.create({
      data: {
        name: `${s.name} Representative`,
        email: s.email,
        passwordHash: password,
        role: "STARTUP",
        organizationId: org.id,
      },
    });

    const startup = await prisma.startup.create({
      data: {
        organizationId: org.id,
        description: s.description,
        sector: s.sector,
        foundedYear: s.foundedYear,
        teamSize: s.teamSize,
        technologies: s.technologies,
        funding: s.funding,
        revenue: s.revenue,
        readinessLevel: s.readinessLevel,
      },
    });

    startups.push(startup);
  }

  // 5. Challenges
  const challenge1 = await prisma.challenge.create({
    data: {
      departmentId: urbanDept.id,
      title: "AI-Based Urban Infrastructure Monitoring",
      description: "Automated real-time detection, geospatial mapping, and automated work-order generation for road potholes, damaged streetlights, and drainage issues across municipal corporation limits.",
      problemStatement: "The department currently relies on slow, manual inspection reports resulting in 30+ day turnaround times for public road maintenance and citizen grievances.",
      sector: "Smart Cities",
      requiredCapabilities: "Computer Vision, AI, IoT, Geospatial Analytics, Mobile Applications",
      budgetRange: "₹25 Lakh - ₹50 Lakh",
      pilotDuration: 60,
      status: "OPEN",
    },
  });

  const challenge2 = await prisma.challenge.create({
    data: {
      departmentId: urbanDept.id,
      title: "Smart Energy Monitoring for Government Buildings",
      description: "Centralized IoT energy management platform to track peak loads, eliminate standby power wastage, and automate HVAC scheduling across administrative complexes.",
      problemStatement: "Government secretariat complexes consume excessive baseline electricity due to unoptimized cooling systems and absent sub-metering telemetry.",
      sector: "CleanTech",
      requiredCapabilities: "IoT, Energy Analytics, Cloud, Predictive Analytics, SCADA",
      budgetRange: "₹15 Lakh - ₹30 Lakh",
      pilotDuration: 45,
      status: "OPEN",
    },
  });

  // 6. Matches
  const matchesData = [
    { s: startups[0], c: challenge1, score: 94, cap: 95, sec: 92, read: 88, exp: "Exceptional alignment with computer vision and edge IoT road inspection requirements." },
    { s: startups[2], c: challenge1, score: 88, cap: 90, sec: 88, read: 94, exp: "Strong municipal IoT infrastructure footprint with proven edge hardware stability." },
    { s: startups[1], c: challenge1, score: 68, cap: 65, sec: 70, read: 70, exp: "Moderate alignment; clean energy focus requires adaptation for road assets." },
    { s: startups[3], c: challenge1, score: 62, cap: 60, sec: 65, read: 60, exp: "Mobility route software meets fleet tracking but lacks computer vision defect detection." },
    { s: startups[1], c: challenge2, score: 93, cap: 95, sec: 94, read: 86, exp: "Direct match for sub-metering telemetry and HVAC energy optimization." },
    { s: startups[0], c: challenge2, score: 71, cap: 68, sec: 70, read: 78, exp: "Edge hardware capabilities can be adapted for facility monitoring." },
  ];

  for (const m of matchesData) {
    await prisma.startupMatch.create({
      data: {
        startupId: m.s.id,
        challengeId: m.c.id,
        matchScore: m.score,
        capabilityScore: m.cap,
        sectorScore: m.sec,
        readinessScore: m.read,
        explanation: m.exp,
      },
    });
  }

  // 7. Eligibility Checks
  for (const s of startups) {
    await prisma.eligibilityCheck.create({
      data: {
        startupId: s.id,
        challengeId: challenge1.id,
        status: s === startups[3] ? "NEEDS_REVIEW" : "ELIGIBLE",
        reason: s === startups[3]
          ? "Additional proof of computer vision model accuracy required."
          : "Verified DPIIT startup registration, tax compliance, and declared capability thresholds satisfied.",
        checkedAt: new Date(),
      },
    });
  }

  // 8. Documents
  await prisma.document.createMany({
    data: [
      {
        startupId: startups[0].id,
        fileName: "CivicVision_Company_Incorporation_Profile.pdf",
        documentType: "Company Profile",
        status: "VERIFIED",
      },
      {
        startupId: startups[0].id,
        fileName: "Municipal_Field_Trial_Evidence_12Zones.pdf",
        documentType: "Previous Project Evidence",
        status: "VERIFIED",
      },
      {
        startupId: startups[0].id,
        fileName: "ISO_27001_CERTIn_Security_Review.pdf",
        documentType: "Security Certification",
        status: "VERIFIED",
      },
      {
        startupId: startups[1].id,
        fileName: "GreenGrid_Energy_Audit_Report.pdf",
        documentType: "Deployment Evidence",
        status: "VERIFIED",
      },
      {
        startupId: startups[2].id,
        fileName: "UrbanPulse_Radar_Specs.pdf",
        documentType: "Company Profile",
        status: "VERIFIED",
      },
    ],
  });

  // 9. AI Assessments with Risks & Claims
  const assessment1 = await prisma.assessment.create({
    data: {
      startupId: startups[0].id,
      challengeId: challenge1.id,
      overallScore: 86,
      problemFit: 94,
      technicalCapability: 90,
      financialHealth: 78,
      teamCapability: 85,
      scalability: 89,
      technologyReadiness: 85,
      securityReadiness: 90,
      pilotReadiness: 88,
      riskLevel: "LOW",
      summary: "High problem-solution fit with verified edge computer vision deployment references and valid security credentials.",
    },
  });

  await prisma.risk.createMany({
    data: [
      {
        assessmentId: assessment1.id,
        title: "Legacy GIS Interoperability",
        description: "Municipal mapping systems use varied projection formats requiring API normalization.",
        level: "LOW",
        mitigation: "Include dedicated 2-week API integration milestone with government IT nodal officer.",
      },
      {
        assessmentId: assessment1.id,
        title: "Night-Time Detection Quality",
        description: "Optical road defect detection in low ambient illumination needs infra-red sensor assist.",
        level: "MEDIUM",
        mitigation: "Equip pilot inspection vehicles with auxiliary lumen floodlights during evening trial runs.",
      },
    ],
  });

  await prisma.claim.createMany({
    data: [
      {
        assessmentId: assessment1.id,
        claim: "Solution achieves 93.8% detection accuracy on asphalt and concrete road distresses.",
        evidence: "Municipal_Field_Trial_Evidence_12Zones.pdf",
        status: "SUPPORTED",
        confidence: 0.94,
      },
      {
        assessmentId: assessment1.id,
        claim: "End-to-end data encryption and compliance with government data protection norms.",
        evidence: "ISO_27001_CERTIn_Security_Review.pdf",
        status: "SUPPORTED",
        confidence: 0.96,
      },
      {
        assessmentId: assessment1.id,
        claim: "Real-time edge processing with sub-2 second alert generation latency.",
        evidence: "CivicVision_Company_Incorporation_Profile.pdf",
        status: "VERIFY",
        confidence: 0.78,
      },
    ],
  });

  // 10. Expert Evaluations
  await prisma.evaluation.create({
    data: {
      evaluatorId: evaluator1.id,
      startupId: startups[0].id,
      challengeId: challenge1.id,
      problemFit: 92,
      technical: 90,
      financial: 80,
      scalability: 88,
      overallScore: 88,
      comments: "Exceptional candidate for controlled municipal pilot. Strong technical architecture and clean security compliance audit.",
    },
  });

  // 11. Pre-seeded Live Demo Pilot (Stage 6-8 Showcase)
  const startDate = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
  const endDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const demoPilot = await prisma.pilot.create({
    data: {
      startupId: startups[0].id,
      challengeId: challenge1.id,
      name: "CivicVision - AI Urban Infrastructure Pilot Trial",
      description: "Live 60-day field trial testing vehicle-mounted computer vision cameras for automated pothole, damaged signage, and streetlight failure detection across Ward 12 municipal limits.",
      startDate,
      endDate,
      milestones: {
        create: [
          {
            title: "Phase 1: Sandbox Integration & Security Audit",
            description: "Deploy in isolated government test environment, complete CERT-In review, and configure municipal GIS APIs.",
            dueDate: new Date(startDate.getTime() + 15 * 24 * 60 * 60 * 1000),
            completed: true,
            completedAt: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
          },
          {
            title: "Phase 2: Live Field Trial & Telemetry Logging",
            description: "Deploy camera kits on 4 municipal patrol vehicles and capture 30 consecutive days of operational road inspection feeds.",
            dueDate: new Date(startDate.getTime() + 45 * 24 * 60 * 60 * 1000),
            completed: true,
            completedAt: new Date(),
          },
          {
            title: "Phase 3: Accuracy Validation & Acceptance Sign-off",
            description: "Formal KPI verification with technical committee, field inspection, and procurement readiness sign-off.",
            dueDate: endDate,
            completed: true,
            completedAt: new Date(),
          },
        ],
      },
      kpis: {
        create: [
          {
            name: "Road Defect Detection Precision",
            target: 90.0,
            unit: "%",
            description: "Accuracy in identifying road cracks, potholes, and utility excavations.",
            results: {
              create: [
                {
                  value: 87.2,
                  evidenceUrl: "Field_Trial_Telemetry_Week2.pdf",
                  recordedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                },
                {
                  value: 94.6,
                  evidenceUrl: "Field_Trial_Telemetry_Week6_Final.pdf",
                  recordedAt: new Date(),
                },
              ],
            },
          },
          {
            name: "System Live Stream & Edge Uptime",
            target: 99.0,
            unit: "%",
            description: "Operational availability under continuous daily patrol duty.",
            results: {
              create: [
                {
                  value: 99.7,
                  evidenceUrl: "AWS_CloudWatch_Uptime_Report.pdf",
                  recordedAt: new Date(),
                },
              ],
            },
          },
          {
            name: "Alert Transmission Latency",
            target: 2.5,
            unit: "sec",
            description: "Time taken from camera capture to municipal dashboard work-order dispatch.",
            results: {
              create: [
                {
                  value: 1.6,
                  evidenceUrl: "Edge_Latency_Benchmark.pdf",
                  recordedAt: new Date(),
                },
              ],
            },
          },
        ],
      },
      validation: {
        create: {
          passed: true,
          score: 93.0,
          comments: "Committee field inspection completed on municipal test vehicles. Detection accuracy of 94.6% exceeded the 90% benchmark with 1.6s latency. System verified ready for statewide commercial procurement.",
          validatedAt: new Date(),
        },
      },
      recommendation: {
        create: {
          type: "SCALE",
          score: 95.0,
          explanation: "Outstanding pilot execution with a composite score of 95/100 and 100% milestone completion. The startup exceeded benchmark KPI targets under real-world municipal conditions. Highly recommended for multi-department and statewide scaled rollout.",
        },
      },
      payment: {
        create: {
          milestone: "Tranche 1: Sandbox & Field Deployment Acceptance",
          amount: 500000,
          status: "PAID",
          paidAt: new Date(),
        },
      },
    },
  });

  console.log("--------------------------------------------------");
  console.log("GovProc Prototype Seed Data Loaded Successfully!");
  console.log("--------------------------------------------------");
  console.log("Demo Credentials for Testing:");
  console.log("  Role: Government Officer -> Email: department@gov-demo.in | Password: Demo@12345");
  console.log("  Role: Expert Evaluator   -> Email: evaluator@demo.in      | Password: Demo@12345");
  console.log("  Role: Startup Lead       -> Email: startup@demo.in        | Password: Demo@12345");
  console.log("  Role: System Admin       -> Email: admin@demo.in          | Password: Demo@12345");
  console.log("--------------------------------------------------");
  console.log(`Demo Pilot ID: ${demoPilot.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });