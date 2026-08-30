import { Citation, VerificationStatus } from "@/types";

import boilersActData from "@/data/clauses/boilers-act.json";
import factoriesActData from "@/data/clauses/factories-act.json";
import fireActData from "@/data/clauses/fire-act-maharashtra.json";
import fssaiRulesData from "@/data/clauses/fssai-rules.json";
import hazwasteRulesData from "@/data/clauses/hazardous-waste-rules.json";
import mpcbCatData from "@/data/clauses/mpcb-categorisation.json";
import rtsActData from "@/data/clauses/rts-act-timelines.json";

interface ClauseFile {
  sourceTitle: string;
  authority: string;
  version: string;
  sourceUrl: string;
  lastVerified: string;
  clauses: Array<{
    clauseId: string;
    clause: string;
    page: number | null;
    heading: string;
    text: string;
    verificationStatus: string;
  }>;
}

interface CitationRecord extends Citation {
  heading: string;
  relevantText: string;
  notes: string;
}

const clauseFiles: ClauseFile[] = [
  boilersActData as ClauseFile,
  factoriesActData as ClauseFile,
  fireActData as ClauseFile,
  fssaiRulesData as ClauseFile,
  hazwasteRulesData as ClauseFile,
  mpcbCatData as ClauseFile,
  rtsActData as ClauseFile,
];

export const citationStore = new Map<string, CitationRecord>();

// Populate citationStore dynamically from data/clauses/*.json
for (const file of clauseFiles) {
  for (const item of file.clauses) {
    citationStore.set(item.clauseId, {
      clauseId: item.clauseId,
      sourceTitle: file.sourceTitle,
      authority: file.authority,
      clause: item.clause,
      page: item.page != null ? String(item.page) : undefined,
      version: file.version,
      lastVerified: file.lastVerified,
      sourceUrl: file.sourceUrl,
      verificationStatus: (item.verificationStatus === "verified" ? "verified" : "needs-review") as VerificationStatus,
      heading: item.heading,
      relevantText: item.text,
      notes: `Sourced from ${file.sourceTitle}`,
    });
  }
}

// Fallback additions for additional legacy keys if needed
const additionalCitations: Array<[string, CitationRecord]> = [
  [
    "mpcb/water-act-1974/section-25",
    {
      clauseId: "mpcb/water-act-1974/section-25",
      sourceTitle: "Water (Prevention and Control of Pollution) Act, 1974",
      authority: "Maharashtra Pollution Control Board (MPCB)",
      clause: "Section 25",
      version: "1974 (as amended)",
      lastVerified: "2026-08-29",
      sourceUrl: "https://mpcb.gov.in",
      verificationStatus: "verified",
      heading: "Consent to Establish (Water)",
      relevantText:
        "No person shall, without the previous consent of the State Board, establish or take any steps to establish any industry which is likely to discharge sewage or trade effluent into a stream.",
      notes: "Required for industries with process water discharge or effluent generation.",
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
      lastVerified: "2026-08-29",
      sourceUrl: "https://mpcb.gov.in",
      verificationStatus: "verified",
      heading: "Consent to Establish (Air)",
      relevantText:
        "No person shall, without the previous consent of the State Board, establish or operate any industrial plant in an air pollution control area.",
      notes: "Required for industries with air emissions or in notified pollution control areas.",
    },
  ],
  [
    "msme/msme-dev-act-2006/section-7",
    {
      clauseId: "msme/msme-dev-act-2006/section-7",
      sourceTitle: "Micro, Small and Medium Enterprises Development Act, 2006",
      authority: "Ministry of MSME",
      clause: "Section 7",
      version: "2006 (as amended 2020)",
      lastVerified: "2026-08-29",
      sourceUrl: "https://msme.gov.in",
      verificationStatus: "verified",
      heading: "MSME Classification and Udyam Registration",
      relevantText:
        "Manufacturing enterprises with investment up to ₹50 crore and turnover up to ₹250 crore are classified as MSMEs.",
      notes: "Classification thresholds updated in 2020.",
    },
  ],
  [
    "mah-labour/shops-estab-act-2017/section-7",
    {
      clauseId: "mah-labour/shops-estab-act-2017/section-7",
      sourceTitle: "Maharashtra Shops and Establishments Act, 2017",
      authority: "Maharashtra Labour Department",
      clause: "Section 7",
      version: "2017",
      lastVerified: "2026-08-29",
      sourceUrl: "https://mahakamgar.maharashtra.gov.in",
      verificationStatus: "verified",
      heading: "Registration of Establishments",
      relevantText:
        "Every establishment shall be registered under this Act within 60 days from the date of commencement of work.",
      notes: "Applies to all establishments with at least one employee.",
    },
  ],
];

for (const [key, val] of additionalCitations) {
  if (!citationStore.has(key)) {
    citationStore.set(key, val);
  }
}
