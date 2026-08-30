import {
  BusinessProfile,
  SimulationResult,
  Approval,
  DecisionTrace,
  SimulationSummary,
  RequiredDocument,
  RiskTier,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDoc(id: string, label: string, mandatory = true): RequiredDocument {
  return { id, label, mandatory };
}

// ---------------------------------------------------------------------------
// Rule implementations
// ---------------------------------------------------------------------------

function evalFactoriesActLicence(profile: BusinessProfile): Approval {
  const clauseId = "dgfasli/factories-act-1948/section-6";
  const traces: DecisionTrace[] = [];

  // Condition A: employees >= 10 with power
  try {
    const condA =
      profile.employees >= 10 && profile.usesPower;
    traces.push({
      ruleId: "factories-act-licence",
      condition:
        "10 or more workers employed AND the factory uses electrical or mechanical power",
      applicantValue: `employees=${profile.employees}, usesPower=${profile.usesPower}`,
      expectedCondition: "employees >= 10 && usesPower === true",
      matched: condA,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow — trace omitted if evaluation throws
  }

  // Condition B: employees >= 20 (regardless of power)
  try {
    const condB = profile.employees >= 20;
    traces.push({
      ruleId: "factories-act-licence",
      condition: "20 or more workers employed (with or without power)",
      applicantValue: `employees=${profile.employees}`,
      expectedCondition: "employees >= 20",
      matched: condB,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "factories-act-licence",
    name: "Factories Act Licence",
    department: "Maharashtra Factories Directorate / DGFASLI",
    applies,
    requiredDocuments: [
      makeDoc("fal-site-plan", "Approved site plan / factory layout", true),
      makeDoc("fal-form1", "Form-1 application for factory registration", true),
      makeDoc("fal-noc-local", "NOC from local authority / municipality", true),
      makeDoc("fal-ownership", "Proof of ownership or lease of premises", true),
      makeDoc("fal-process-flow", "Manufacturing process description", false),
    ],
    statutoryDays: 90,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 5000,
    feeConfidence: "indicative",
    riskTier: "high" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalBoilerCertificate(profile: BusinessProfile): Approval {
  const clauseId = "ibr/indian-boilers-act-1923/section-2";
  const traces: DecisionTrace[] = [];

  try {
    const cond = profile.hasBoiler === true;
    traces.push({
      ruleId: "boiler-certificate",
      condition: "Business has a boiler installed on premises",
      applicantValue: `hasBoiler=${profile.hasBoiler}`,
      expectedCondition: "hasBoiler === true",
      matched: cond,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "boiler-certificate",
    name: "Boiler Registration Certificate",
    department: "Indian Boiler Regulations (IBR) Authority",
    applies,
    requiredDocuments: [
      makeDoc("bc-mfr-cert", "Boiler manufacturer's certificate", true),
      makeDoc("bc-ibr-report", "IBR inspection report", true),
      makeDoc("bc-design-doc", "Boiler design/drawing documents", true),
      makeDoc("bc-safety-valve", "Safety valve test certificate", false),
    ],
    statutoryDays: 60,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 3000,
    feeConfidence: "indicative",
    riskTier: "medium" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalMpcbConsentWater(profile: BusinessProfile): Approval {
  const clauseId = "mpcb/water-act-1974/section-25";
  const traces: DecisionTrace[] = [];

  try {
    const condHazmat = profile.hazardousMaterials === true;
    traces.push({
      ruleId: "mpcb-consent-water",
      condition: "Business uses hazardous materials in its process",
      applicantValue: `hazardousMaterials=${profile.hazardousMaterials}`,
      expectedCondition: "hazardousMaterials === true",
      matched: condHazmat,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  try {
    const condHazWaste = profile.generatesHazardousWaste === true;
    traces.push({
      ruleId: "mpcb-consent-water",
      condition: "Business generates hazardous waste requiring water-pollution consent",
      applicantValue: `generatesHazardousWaste=${profile.generatesHazardousWaste}`,
      expectedCondition: "generatesHazardousWaste === true",
      matched: condHazWaste,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "mpcb-consent-water",
    name: "MPCB Consent to Establish (Water)",
    department: "Maharashtra Pollution Control Board",
    applies,
    requiredDocuments: [
      makeDoc("mpcb-w-eia", "Environmental Impact Assessment (EIA) report", true),
      makeDoc("mpcb-w-process", "Process flow diagram with water usage details", true),
      makeDoc("mpcb-w-consent-app", "MPCB consent application (Form I)", true),
      makeDoc("mpcb-w-effluent", "Effluent treatment plant design", true),
      makeDoc("mpcb-w-site-plan", "Site plan showing drainage layout", false),
    ],
    statutoryDays: 120,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 10000,
    feeConfidence: "indicative",
    riskTier: "high" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalMpcbConsentAir(profile: BusinessProfile): Approval {
  const clauseId = "mpcb/air-act-1981/section-21";
  const traces: DecisionTrace[] = [];

  try {
    const condHazmat = profile.hazardousMaterials === true;
    traces.push({
      ruleId: "mpcb-consent-air",
      condition: "Business uses hazardous materials that may result in air emissions",
      applicantValue: `hazardousMaterials=${profile.hazardousMaterials}`,
      expectedCondition: "hazardousMaterials === true",
      matched: condHazmat,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  try {
    const condHazWaste = profile.generatesHazardousWaste === true;
    traces.push({
      ruleId: "mpcb-consent-air",
      condition:
        "Business generates hazardous waste requiring air-pollution consent",
      applicantValue: `generatesHazardousWaste=${profile.generatesHazardousWaste}`,
      expectedCondition: "generatesHazardousWaste === true",
      matched: condHazWaste,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "mpcb-consent-air",
    name: "MPCB Consent to Establish (Air)",
    department: "Maharashtra Pollution Control Board",
    applies,
    requiredDocuments: [
      makeDoc("mpcb-a-eia", "Environmental Impact Assessment (EIA) report", true),
      makeDoc("mpcb-a-process", "Process flow diagram with emission details", true),
      makeDoc("mpcb-a-consent-app", "MPCB consent application (Form I – Air)", true),
      makeDoc("mpcb-a-stack", "Stack emission monitoring plan", true),
      makeDoc("mpcb-a-scrubber", "Air pollution control device specifications", false),
    ],
    statutoryDays: 120,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 10000,
    feeConfidence: "indicative",
    riskTier: "high" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalHazardousWasteAuth(profile: BusinessProfile): Approval {
  const clauseId = "mpcb/hazardous-waste-rules-2016/rule-5";
  const traces: DecisionTrace[] = [];

  try {
    const cond = profile.generatesHazardousWaste === true;
    traces.push({
      ruleId: "hazardous-waste-auth",
      condition:
        "Business generates hazardous waste requiring formal authorisation for storage and disposal",
      applicantValue: `generatesHazardousWaste=${profile.generatesHazardousWaste}`,
      expectedCondition: "generatesHazardousWaste === true",
      matched: cond,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "hazardous-waste-auth",
    name: "Hazardous Waste Authorisation",
    department: "Maharashtra Pollution Control Board / MoEFCC",
    applies,
    requiredDocuments: [
      makeDoc("hwa-manifest", "Hazardous waste manifest form", true),
      makeDoc("hwa-storage", "Hazardous waste storage plan and layout", true),
      makeDoc("hwa-disposal", "Disposal agreement with authorised facility", true),
      makeDoc("hwa-inventory", "Hazardous waste inventory and quantity estimate", true),
      makeDoc("hwa-training", "Worker safety training records", false),
    ],
    statutoryDays: 90,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 15000,
    feeConfidence: "indicative",
    riskTier: "high" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalMsmeRegistration(profile: BusinessProfile): Approval {
  const clauseId = "msme/msme-dev-act-2006/section-7";
  const traces: DecisionTrace[] = [];

  try {
    const cond = profile.investmentCrore <= 250;
    traces.push({
      ruleId: "msme-registration",
      condition:
        "Investment in plant and machinery or equipment is within MSME classification limit (≤ ₹250 Crore)",
      applicantValue: `investmentCrore=${profile.investmentCrore}`,
      expectedCondition: "investmentCrore <= 250",
      matched: cond,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "msme-registration",
    name: "MSME Registration (Udyam)",
    department: "MSME Ministry / Udyam Registration Portal",
    applies,
    requiredDocuments: [
      makeDoc("msme-udyam-form", "Udyam registration application form", true),
      makeDoc("msme-aadhaar", "Aadhaar card of proprietor / authorised signatory", true),
      makeDoc("msme-pan", "PAN card of entity", false),
    ],
    statutoryDays: 7,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 0,
    feeConfidence: "sourced",
    riskTier: "low" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalShopsEstabRegistration(profile: BusinessProfile): Approval {
  const clauseId = "mah-labour/shops-estab-act-2017/section-7";
  const traces: DecisionTrace[] = [];

  try {
    const cond = profile.employees >= 1;
    traces.push({
      ruleId: "shops-estab-registration",
      condition: "Establishment employs one or more persons",
      applicantValue: `employees=${profile.employees}`,
      expectedCondition: "employees >= 1",
      matched: cond,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "shops-estab-registration",
    name: "Shops & Establishments Registration",
    department: "Maharashtra Labour Department",
    applies,
    requiredDocuments: [
      makeDoc("se-reg-form", "Establishment registration application form", true),
      makeDoc("se-owner-id", "Owner / occupier identity proof (Aadhaar / PAN)", true),
      makeDoc("se-address", "Proof of establishment address", true),
      makeDoc("se-emp-list", "List of employees with designations", false),
    ],
    statutoryDays: 7,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 500,
    feeConfidence: "indicative",
    riskTier: "low" as RiskTier,
    dependsOn: [],
    traces,
  };
}

function evalFireNoc(profile: BusinessProfile): Approval {
  const clauseId = "fire/maharashtra-fire-rules-2009/rule-4";
  const traces: DecisionTrace[] = [];

  try {
    const cond = profile.areaSqFt >= 500;
    traces.push({
      ruleId: "fire-noc",
      condition:
        "Premises area is 500 sq ft or more, requiring a Fire NOC from the Fire Brigade",
      applicantValue: `areaSqFt=${profile.areaSqFt}`,
      expectedCondition: "areaSqFt >= 500",
      matched: cond,
      clauseId,
      citation: null,
    });
  } catch {
    // swallow
  }

  const applies = traces.some((t) => t.matched);

  return {
    id: "fire-noc",
    name: "Fire NOC",
    department: "Maharashtra Fire Services",
    applies,
    requiredDocuments: [
      makeDoc("fire-building-plan", "Approved building plan / layout", true),
      makeDoc("fire-safety-plan", "Fire safety plan with escape routes", true),
      makeDoc("fire-noc-app", "Fire NOC application form", true),
      makeDoc("fire-extinguisher", "Fire extinguisher placement plan", false),
      makeDoc("fire-sprinkler", "Sprinkler system design (if applicable)", false),
    ],
    statutoryDays: 30,
    statutoryDaysClauseId: clauseId,
    statutoryDaysSource: null,
    indicativeFee: 2000,
    feeConfidence: "indicative",
    riskTier: "medium" as RiskTier,
    dependsOn: [],
    traces,
  };
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

function computeSummary(approvals: Approval[]): SimulationSummary {
  const applicable = approvals.filter((a) => a.applies);

  const applicableApprovalCount = applicable.length;

  // Collect unique document IDs across all applicable approvals
  const docIdSet = new Set<string>();
  for (const a of applicable) {
    for (const d of a.requiredDocuments) {
      docIdSet.add(d.id);
    }
  }
  const uniqueDocumentCount = docIdSet.size;

  // Fee total
  const indicativeFeeTotal = applicable.reduce(
    (sum, a) => sum + (a.indicativeFee ?? 0),
    0
  );

  // Days calculations
  const allDays = applicable.map((a) => a.statutoryDays ?? 0);
  const sumOfAllDays = allDays.reduce((s, d) => s + d, 0);
  const criticalPathDays = allDays.length > 0 ? Math.max(...allDays) : 0;

  // Bottleneck: approval with highest statutoryDays
  let bottleneckApprovalId: string | null = null;
  let maxDays = -1;
  for (const a of applicable) {
    const days = a.statutoryDays ?? 0;
    if (days > maxDays) {
      maxDays = days;
      bottleneckApprovalId = a.id;
    }
  }

  // Highest risk tier
  let highestRiskTier: RiskTier = "low";
  for (const a of applicable) {
    const days = a.statutoryDays ?? 0;
    if (days >= 60 && highestRiskTier !== "high") {
      highestRiskTier = "high";
    } else if (days >= 30 && highestRiskTier === "low") {
      highestRiskTier = "medium";
    }
  }

  // Critical path: ordered by statutory days descending
  const criticalPath = [...applicable]
    .sort((a, b) => (b.statutoryDays ?? 0) - (a.statutoryDays ?? 0))
    .map((a) => a.id);

  // unverifiedFieldCount: count traces where citation is null across all applicable approvals
  let unverifiedFieldCount = 0;
  for (const a of applicable) {
    for (const t of a.traces) {
      if (t.citation === null) {
        unverifiedFieldCount += 1;
      }
    }
  }

  return {
    applicableApprovalCount,
    uniqueDocumentCount,
    criticalPathDays,
    sumOfAllDays,
    indicativeFeeTotal,
    highestRiskTier,
    criticalPath,
    bottleneckApprovalId,
    unverifiedFieldCount,
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function simulate(profile: BusinessProfile): SimulationResult {
  const approvals: Approval[] = [
    evalFactoriesActLicence(profile),
    evalBoilerCertificate(profile),
    evalMpcbConsentWater(profile),
    evalMpcbConsentAir(profile),
    evalHazardousWasteAuth(profile),
    evalMsmeRegistration(profile),
    evalShopsEstabRegistration(profile),
    evalFireNoc(profile),
  ];

  const summary = computeSummary(approvals);

  return {
    profile,
    approvals,
    summary,
    engineVersion: "1.0.0",
    ruleSetVersion: "mah-2024-v1",
    generatedAt: new Date().toISOString(),
  };
}
