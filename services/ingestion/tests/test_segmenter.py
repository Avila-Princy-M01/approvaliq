from approvaliq_ingestion.extractor import ExtractedBlock
from approvaliq_ingestion.segmenter import segment


def test_segments_numbered_clauses_only():
    blocks = [
        ExtractedBlock(text="Chapter 4 — Conditions", page_number=1, depth=0),
        ExtractedBlock(text="4.1 The applicant shall submit Form A.", page_number=1, depth=2),
        ExtractedBlock(
            text="4.2 Applies where built-up area exceeding 500 sq. m.",
            page_number=1,
            depth=2,
        ),
    ]

    requirements = segment(
        blocks, source_document="Test Doc", department="Test Dept", id_prefix="TEST"
    )

    assert len(requirements) == 2
    assert requirements[0].source_citation == "Clause 4.1"
    assert requirements[1].applicability_conditions[0].field == "scale.built_up_area_sq_m"


def test_unique_stable_ids():
    blocks = [
        ExtractedBlock(text=f"{i}.1 Some obligation text.", page_number=1, depth=1)
        for i in range(1, 6)
    ]
    requirements = segment(blocks, source_document="Doc", department="Dept", id_prefix="X")
    ids = [r.id for r in requirements]
    assert len(ids) == len(set(ids))
