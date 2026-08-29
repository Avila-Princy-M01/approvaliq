import type { Contradiction, ExtractedField, Severity } from "@/types";

// ---------------------------------------------------------------------------
// Field comparison rules
// ---------------------------------------------------------------------------

type CompareMode = "numeric" | "text" | "boolean" | "identifier";

interface FieldRule {
  compare: CompareMode;
  tolerancePercent?: number; // only for numeric
  severityIfDiffer: Severity;
  normalise?: (v: unknown) => string;
}

const FIELD_RULES: Record<string, FieldRule> = {
  factoryAreaSqFt: {
    compare: "numeric",
    tolerancePercent: 2,
    severityIfDiffer: "blocking",
  },
  investmentCrore: {
    compare: "numeric",
    tolerancePercent: 5,
    severityIfDiffer: "warning",
  },
  employeeCount: {
    compare: "numeric",
    tolerancePercent: 10,
    severityIfDiffer: "warning",
  },
  companyName: {
    compare: "text",
    severityIfDiffer: "informational",
    normalise: normaliseCompanyName,
  },
  factoryAddress: {
    compare: "text",
    severityIfDiffer: "warning",
    normalise: normaliseAddress,
  },
  registrationNumber: {
    compare: "identifier",
    severityIfDiffer: "blocking",
  },
  hasBoiler: {
    compare: "boolean",
    severityIfDiffer: "blocking",
  },
};

// ---------------------------------------------------------------------------
// Normalisation helpers
// ---------------------------------------------------------------------------

function normaliseCompanyName(v: unknown): string {
  return String(v)
    .toLowerCase()
    .replace(/private limited|pvt\.? ltd\.?|pvt limited/g, "pvtltd")
    .replace(/limited|ltd\.?/g, "ltd")
    .replace(/[^a-z0-9]/g, "");
}

function normaliseAddress(v: unknown): string {
  return String(v)
    .toLowerCase()
    .replace(/\b(plot|survey|s\.?no\.?|gat)\b/g, "")
    .replace(/\b(road|rd|street|st|estate)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

// ---------------------------------------------------------------------------
// Comparison logic
// ---------------------------------------------------------------------------

function valuesConflict(
  rule: FieldRule,
  a: unknown,
  b: unknown
): boolean {
  switch (rule.compare) {
    case "numeric": {
      const na = Number(a);
      const nb = Number(b);
      if (isNaN(na) || isNaN(nb)) return false;
      const tolerance = rule.tolerancePercent ?? 0;
      const diff = Math.abs(na - nb);
      const base = Math.max(Math.abs(na), Math.abs(nb));
      if (base === 0) return false;
      return (diff / base) * 100 > tolerance;
    }
    case "text": {
      const norm = rule.normalise ?? ((x: unknown) => String(x).toLowerCase().trim());
      return norm(a) !== norm(b);
    }
    case "identifier": {
      return (
        String(a).replace(/\s/g, "").toLowerCase() !==
        String(b).replace(/\s/g, "").toLowerCase()
      );
    }
    case "boolean": {
      return Boolean(a) !== Boolean(b);
    }
  }
}

function buildRecommendedAction(field: string, label: string): string {
  switch (field) {
    case "factoryAreaSqFt":
      return "Verify the declared factory area and resubmit the corrected plan.";
    case "factoryAddress":
      return "Confirm the correct factory address across all submitted documents.";
    case "registrationNumber":
      return "Ensure the company registration number is identical on all documents.";
    case "hasBoiler":
      return "Clarify boiler installation status — declaration and plan must agree.";
    default:
      return `Verify the ${label.toLowerCase()} across all submitted documents.`;
  }
}

function buildPredictedQuery(
  field: string,
  label: string,
  documents: string[],
  values: (string | number | boolean)[]
): string {
  const docA = documents[0]?.replace(/-/g, " ") ?? "document A";
  const docB = documents[1]?.replace(/-/g, " ") ?? "document B";
  const valA = values[0];
  const valB = values[1];

  switch (field) {
    case "factoryAreaSqFt":
      return `Please clarify the difference in declared factory area between the ${docA} (${valA} sq ft) and the submitted ${docB} (${valB} sq ft).`;
    case "factoryAddress":
      return `Please clarify the discrepancy in factory address between the ${docA} ("${valA}") and the ${docB} ("${valB}").`;
    case "registrationNumber":
      return `Please confirm the company registration number — a mismatch was found between the ${docA} and the ${docB}.`;
    default:
      return `Please clarify the difference in ${label.toLowerCase()} between the ${docA} (${valA}) and the ${docB} (${valB}).`;
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Detects contradictions across extracted fields from multiple documents.
 * Groups fields by name, applies field-appropriate comparison rules, and
 * returns a sorted list (blocking → warning → informational).
 *
 * Also emits a warning for any field with confidence < 0.80 (separate from
 * mismatch detection).
 */
export function detectContradictions(
  fields: ExtractedField[]
): Contradiction[] {
  const contradictions: Contradiction[] = [];
  const seen = new Set<string>();

  // Group by field name
  const grouped = new Map<string, ExtractedField[]>();
  for (const f of fields) {
    if (!grouped.has(f.field)) grouped.set(f.field, []);
    grouped.get(f.field)!.push(f);
  }

  // Mismatch detection
  for (const [fieldName, entries] of grouped.entries()) {
    const rule = FIELD_RULES[fieldName];
    if (!rule) continue; // unknown field — skip

    // Compare every pair; flag on first mismatch found
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i];
        const b = entries[j];
        if (!valuesConflict(rule, a.value, b.value)) continue;

        const id = `contradiction-${fieldName}`;
        if (seen.has(id)) continue; // only one contradiction per field
        seen.add(id);

        const docs = [a.sourceDocument, b.sourceDocument];
        const vals = [a.value, b.value] as (string | number | boolean)[];

        contradictions.push({
          id,
          field: fieldName,
          label: a.label,
          documents: docs,
          values: vals,
          severity: rule.severityIfDiffer,
          recommendedAction: buildRecommendedAction(fieldName, a.label),
          predictedQuery: buildPredictedQuery(fieldName, a.label, docs, vals),
        });
      }
    }
  }

  // Low-confidence warnings (separate from mismatch)
  const LOW_CONFIDENCE_THRESHOLD = 0.8;
  for (const entry of fields) {
    if (entry.confidence < LOW_CONFIDENCE_THRESHOLD) {
      const id = `low-confidence-${entry.field}-${entry.sourceDocument}`;
      if (seen.has(id)) continue;
      seen.add(id);

      contradictions.push({
        id,
        field: entry.field,
        label: entry.label,
        documents: [entry.sourceDocument],
        values: [entry.value],
        severity: "warning",
        recommendedAction: `Verify the ${entry.label.toLowerCase()} in the ${entry.sourceDocument.replace(/-/g, " ")} — extraction confidence was low (${Math.round(entry.confidence * 100)}%).`,
        predictedQuery: `Please confirm the ${entry.label.toLowerCase()} recorded in the ${entry.sourceDocument.replace(/-/g, " ")}; the submitted copy was difficult to read.`,
      });
    }
  }

  // Sort: blocking → warning → informational
  const ORDER: Record<Severity, number> = {
    blocking: 0,
    warning: 1,
    informational: 2,
  };

  return contradictions.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}
