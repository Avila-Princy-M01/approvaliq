import { Citation, VerificationStatus } from "@/types";

// Internal interface — not exported to avoid touching types/index.ts
interface CitationRecord extends Citation {
  heading: string;       // Short display heading
  relevantText: string;  // Relevant clause text (paraphrased/summary, NOT verbatim)
  notes: string;         // Internal notes on verification status
}

export const citationStore = new Map<string, CitationRecord>([
  [
    "dgfasli/factories-act-1948/section-2m",
    {
      clauseId: "dgfasli/factories-act-1948/section-2m",
      sourceTitle: "The Factories Act, 1948",
      authority: "DGFASLI / Maharashtra Labour Department",
      clause: "Section 2(m)",
      version: "1948 (as amended)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://labour.gov.in/sites/default/files/TheFactoriesAct1948.pdf",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Definition of Factory",
      relevantText:
        "A 'factory' means any premises where manufacturing process is carried on and where 10 or more workers are working with the aid of power, or 20 or more workers are working without the aid of power.",
      notes:
        "Threshold triggers Factories Act Licence requirement. Needs verification against current amended text.",
    },
  ],
  [
    "dgfasli/factories-act-1948/section-6",
    {
      clauseId: "dgfasli/factories-act-1948/section-6",
      sourceTitle: "The Factories Act, 1948",
      authority: "DGFASLI / Maharashtra Labour Department",
      clause: "Section 6",
      version: "1948 (as amended)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://labour.gov.in/sites/default/files/TheFactoriesAct1948.pdf",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Approval, Licensing and Registration of Factories",
      relevantText:
        "Every factory must be registered and licensed. The occupier must apply to the Chief Inspector of Factories before commencing operations.",
      notes: "Core licence requirement for qualifying factories. Needs verification.",
    },
  ],
  [
    "dgfasli/factories-act-1948/section-85",
    {
      clauseId: "dgfasli/factories-act-1948/section-85",
      sourceTitle: "The Factories Act, 1948",
      authority: "DGFASLI / Maharashtra Labour Department",
      clause: "Section 85",
      version: "1948 (as amended)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://labour.gov.in/sites/default/files/TheFactoriesAct1948.pdf",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Power to Apply Act to Certain Establishments",
      relevantText:
        "The State Government may declare certain establishments to be factories for the purpose of this Act.",
      notes: "Extension provision. Needs verification.",
    },
  ],
  [
    "ibr/indian-boilers-act-1923/section-2",
    {
      clauseId: "ibr/indian-boilers-act-1923/section-2",
      sourceTitle: "The Indian Boilers Act, 1923",
      authority: "Central Boilers Board / Boiler Inspectorate Maharashtra",
      clause: "Section 2 read with Regulation 2",
      version: "1923 (as amended 2007)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://labour.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Boiler Registration Requirement",
      relevantText:
        "Every boiler must be registered and cannot be used unless it holds a valid certificate of registration. The owner must apply to the Inspector before using any boiler.",
      notes:
        "Applies to all boilers regardless of capacity. Certificate must be renewed periodically.",
    },
  ],
  [
    "mpcb/water-act-1974/section-25",
    {
      clauseId: "mpcb/water-act-1974/section-25",
      sourceTitle: "Water (Prevention and Control of Pollution) Act, 1974",
      authority: "Maharashtra Pollution Control Board (MPCB)",
      clause: "Section 25",
      version: "1974 (as amended)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://mpcb.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Consent to Establish (Water)",
      relevantText:
        "No person shall, without the previous consent of the State Board, establish or take any steps to establish any industry which is likely to discharge sewage or trade effluent into a stream.",
      notes:
        "Required for industries with process water discharge or effluent generation.",
    },
  ],
  [
    "mpcb/air-act-1981/section-21",
    {
      clauseId: "mpcb/air-act-1981/section-21",
      sourceTitle: "Air (Prevention and Control of Pollution) Act, 1981",
      authority: "Maharashtra Pollution Control Board (MPCB)",
      clause: "Section 21",
      version: "1981 (as amended)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://mpcb.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Consent to Establish (Air)",
      relevantText:
        "No person shall, without the previous consent of the State Board, establish or operate any industrial plant in an air pollution control area.",
      notes:
        "Required for industries with air emissions or in notified pollution control areas.",
    },
  ],
  [
    "mpcb/hazardous-waste-rules-2016/rule-5",
    {
      clauseId: "mpcb/hazardous-waste-rules-2016/rule-5",
      sourceTitle:
        "Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016",
      authority: "MPCB / Ministry of Environment, Forest and Climate Change",
      clause: "Rule 5",
      version: "2016 (as amended 2019)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://cpcb.nic.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Authorisation for Hazardous Waste",
      relevantText:
        "Every occupier generating hazardous waste listed in Schedule I, II, or III shall obtain authorisation from the State Pollution Control Board.",
      notes:
        "Applies to any quantity of listed hazardous waste. Schedule determines applicability.",
    },
  ],
  [
    "mpcb/env-protection-act-1986/schedule-1",
    {
      clauseId: "mpcb/env-protection-act-1986/schedule-1",
      sourceTitle: "Environment (Protection) Act, 1986",
      authority: "MPCB / MoEFCC",
      clause: "Schedule I (Industry Category List)",
      version: "1986 (as amended)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://mpcb.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Industry Pollution Category Classification",
      relevantText:
        "Industries are classified as Red, Orange, Green, or White based on their pollution potential. Category determines the type of environmental consent required.",
      notes:
        "Classification is partly discretionary. Final category determined by MPCB officer.",
    },
  ],
  [
    "msme/msme-dev-act-2006/section-7",
    {
      clauseId: "msme/msme-dev-act-2006/section-7",
      sourceTitle:
        "Micro, Small and Medium Enterprises Development Act, 2006",
      authority: "Ministry of MSME",
      clause: "Section 7 (as amended by notification dated 26 June 2020)",
      version: "2006 (as amended 2020)",
      lastVerified: "2024-01-01",
      sourceUrl: "https://msme.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "MSME Classification and Udyam Registration",
      relevantText:
        "Manufacturing enterprises with investment up to ₹50 crore and turnover up to ₹250 crore are classified as MSMEs and eligible for Udyam registration.",
      notes:
        "Udyam registration is voluntary but provides significant benefits. Classification thresholds updated in 2020.",
    },
  ],
  [
    "mah-labour/shops-estab-act-2017/section-7",
    {
      clauseId: "mah-labour/shops-estab-act-2017/section-7",
      sourceTitle:
        "Maharashtra Shops and Establishments (Regulation of Employment and Conditions of Service) Act, 2017",
      authority: "Maharashtra Labour Department",
      clause: "Section 7",
      version: "2017",
      lastVerified: "2024-01-01",
      sourceUrl: "https://mahakamgar.maharashtra.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Registration of Establishments",
      relevantText:
        "Every establishment shall be registered under this Act within 60 days from the date of commencement of work. The employer must apply to the registering authority.",
      notes:
        "Applies to all establishments with at least one employee. Online registration via Mahakamgar portal.",
    },
  ],
  [
    "fire/maharashtra-fire-rules-2009/rule-4",
    {
      clauseId: "fire/maharashtra-fire-rules-2009/rule-4",
      sourceTitle: "Maharashtra Fire Prevention and Life Safety Measures Act, 2006",
      authority: "Maharashtra Fire Services",
      clause: "Rule 4 (Maharashtra Fire Prevention Rules 2009)",
      version: "2006/2009",
      lastVerified: "2024-01-01",
      sourceUrl: "https://maharashtra.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Fire NOC Requirement",
      relevantText:
        "Buildings and premises above the specified threshold (typically 500 sq ft or more for industrial premises) require a No Objection Certificate from the Fire Department before commencement.",
      notes:
        "Exact thresholds may vary by district authority. Needs verification with local fire authority.",
    },
  ],
  [
    "mahares/msme-policy-2023/para-3",
    {
      clauseId: "mahares/msme-policy-2023/para-3",
      sourceTitle: "Maharashtra Industrial Policy / MSME Policy 2023",
      authority: "Maharashtra Industries Department",
      clause: "Para 3 — Classification and Incentives",
      version: "2023",
      lastVerified: "2024-01-01",
      sourceUrl: "https://industries.maharashtra.gov.in",
      verificationStatus: "needs-review" as VerificationStatus,
      heading: "Maharashtra MSME Policy Classification",
      relevantText:
        "The Maharashtra government provides incentives and simplified approvals for MSMEs as classified under the MSMED Act. Single window clearance available for eligible projects.",
      notes:
        "Policy subject to change. Benefits depend on investment category and district classification.",
    },
  ],
]);
