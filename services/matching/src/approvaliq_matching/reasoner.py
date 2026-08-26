"""Retrieval-constrained reasoning layer.

Confirms applicability of retrieved candidates and generates a short,
source-grounded justification. The model is never permitted to introduce
a requirement outside the retrieved candidate set — this is enforced by
validating every returned requirement_id against the candidate set after
the call, not merely by prompt instruction.
"""

from __future__ import annotations

from .llm_client import LLMError, generate_structured
from .schema import ApplicantProfile, Citation, ChecklistItem

_PROMPT_TEMPLATE = """You are confirming which regulatory requirements apply to a specific \
applicant, using ONLY the candidate requirements provided below. Do not introduce any \
requirement not listed here, and do not use any outside knowledge of regulations.

Applicant profile:
{profile}

Candidate requirements (id, department, text):
{candidates}

Return ONLY a JSON array, no prose, no markdown fences. Each element:
{{"requirement_id": "<must be one of the candidate ids above>", \
"applies": true/false, "justification": "<one sentence, grounded strictly in the clause text>"}}

Include an element for every candidate id. Do not fabricate a requirement_id \
that is not in the candidate list above.
"""


def confirm_applicability(
    profile: ApplicantProfile, candidates: list[dict]
) -> list[ChecklistItem]:
    """Confirm which retrieved candidates genuinely apply and build ChecklistItems.

    Returns an empty list if there are no candidates, or if the model call
    fails — a failure here should surface as "no confirmed items" to the
    caller, never as a fabricated fallback checklist.
    """
    if not candidates:
        return []

    candidate_ids = {c["id"] for c in candidates}
    prompt = _PROMPT_TEMPLATE.format(
        profile=profile.model_dump_json(indent=2),
        candidates="\n".join(
            f"- {c['id']} | {c['department']} | {c['clause_text']}" for c in candidates
        ),
    )

    try:
        confirmations = generate_structured(prompt)
    except LLMError:
        # Fail closed: no confirmed items rather than a guessed fallback.
        return []

    if not isinstance(confirmations, list):
        return []

    by_id = {c["id"]: c for c in candidates}
    checklist: list[ChecklistItem] = []

    for entry in confirmations:
        req_id = entry.get("requirement_id")
        if req_id not in candidate_ids:
            # Contract violation: model referenced something outside the
            # retrieved set. Drop it rather than trusting it.
            continue
        if not entry.get("applies"):
            continue

        requirement = by_id[req_id]
        checklist.append(
            ChecklistItem(
                requirement_id=req_id,
                title=requirement["source_citation"],
                department=requirement["department"],
                justification=entry.get("justification", ""),
                citation=Citation(
                    source_document=requirement["source_document"],
                    clause_reference=requirement["source_citation"],
                ),
            )
        )

    return checklist
