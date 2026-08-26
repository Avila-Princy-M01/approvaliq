# Matching Service

Given an `ApplicantProfile`, determines which ingested `RegulatoryRequirement`
objects apply and produces citation-grounded `ChecklistItem` output via a
retrieval-constrained reasoning layer.

## Responsibilities

- Retrieve candidate requirements using a combination of embedding
  similarity and structured applicability-condition filtering.
- Confirm applicability and generate a short, source-grounded
  justification via a constrained call to the configured LLM provider.
- Guarantee that every returned `ChecklistItem` references a requirement
  ID that was present in the retrieved candidate set — the reasoning
  layer's output schema does not permit referencing anything else.
- Return an empty checklist (not a fabricated one) when no candidates are
  found to genuinely apply.

## Layout

```
src/approvaliq_matching/
├── main.py            # Internal service entry point (called by services/api)
├── retriever.py         # Embedding similarity + condition filtering
├── reasoner.py            # Retrieval-constrained LLM confirmation layer
├── llm_client.py            # Thin wrapper over the configured LLM provider
└── schema.py                 # ChecklistItem and related models
```

## Configuration

Reads `LLM_PROVIDER` and `LLM_API_KEY` from the environment (see
`.env.example` at the repository root). Supported providers: `gemini`,
`groq`, `anthropic`, `openai`.

## Testing

```bash
pytest -q
```

Test coverage should include: a borderline applicant profile (near a
threshold condition), a profile with missing fields, and a case where
retrieval genuinely returns no candidates — confirm the service reports
that explicitly rather than producing any output.
