# ApprovalIQ — Regulatory Source Appendix

**SIH Problem Statement 26130 — Maharashtra industrial approvals**
Prototype. Every regulatory number rendered in the product traces to a row below.

**Reading this table:** `Confidence` rates the **applicability threshold** — the load-bearing
number the rules engine actually branches on. `High` means the exact figure was read from the
cited source. `Medium` means the provision is confirmed but the operative number is contested,
superseded, or discretionary. `Low` means the number could not be confirmed and the product
must render `—` or an `indicative` label rather than a figure. `Status` is the product-facing
evidence state: `verified`, `needs-review`, `indicative`, or `not-sourced`. Per-field nuance
(timelines, fees) is in the Notes.

**Scope:** the catalogue models **seven** approvals; the demo profile triggers **five**. This
appendix covers the six below. Building-plan approval is modelled but not sourced here — see
Note 8.

---

## Approvals covered by the demo

| Approval | Governing Act | Key Section/Clause | Applicability Threshold | Statutory Timeline (days) | Fee (indicative) | Department | Source URL | Last Verified | Confidence | Status |
|---|---|---|---|---|---|---|---|---|---|---|
| **Factory Licence** | The Factories Act, 1948 (Act 63 of 1948), with the Maharashtra Factories Rules, 1963. The OSH Code transition is time-sensitive: draft Maharashtra OSH rules have been published, but the final operational threshold position needs verification before relying on old 10/20 worker thresholds. See Note 10 | **Sec. 2(m)** — definition of "factory" (applicability trigger); **Sec. 6** — approval, licensing and registration of factories | **10 or more workers** where a manufacturing process is carried on **with** the aid of power; **20 or more workers without** the aid of power (on any day of the preceding 12 months). Treat as prototype-verified against the Factories Act text, subject to OSH transition review | Verify — not confirmed from source | Varies by scale | Directorate of Industrial Safety and Health (DISH), Maharashtra | https://dgfasli.gov.in/public/Admin/Cms/AllPdf//65005a0c1ebde0.67745153.pdf (scanned image, no extractable text — see Note 7) | 29 August 2026 | **Medium** | **needs-review** |
| **Fire NOC** | Maharashtra Fire Prevention and Life Safety Measures Act, 2006 (Mah. Act III of 2007) | **Sec. 3(1)** — owner/occupier duty to provide and maintain measures for buildings classified in **Schedule I**; **Sec. 3(2)** — no completion/occupancy certificate may issue until compliance is satisfied. **See Note 2 — this Act contains no "No Objection Certificate" provision.** | Verify — not confirmed from source. Applicability follows the **Schedule I** building-classification list (aligned to National Building Code 2005), not a single numeric trigger. A 15 m height band is widely cited but **could not be confirmed**; the only height figure located in the parent Act is **above 30 m** (fire officer appointment) | Notified as an RTS e-service ("Issue/Renewal of Fire NOC"); **day count not confirmed** — the notified-service list carries no timeline column | Varies by scale (fee schedule is **Schedule II** under Sec. 11) | Directorate of Maharashtra Fire Services | https://mahafireservice.gov.in/directorate/fire-act/2006/English.pdf | 29 August 2026 | **Low** | **needs-review** |
| **MPCB Consent to Establish** | The Water (Prevention and Control of Pollution) Act, 1974 (Act 6 of 1974) | **Sec. 25** — restrictions on new outlets and new discharges: no person shall, **without the previous consent of the State Board**, establish or take any step to establish any industry, operation or process likely to discharge sewage or trade effluent | **No clean numeric threshold — this condition is category-based, not arithmetic.** Sectoral classification runs on the CPCB **Pollution Index (PI)** harmonised under Sec. 18(1)(b): **PI ≥ 60 = Red**, **PI 41–59 = Orange**, **PI 21–40 = Green**, **PI ≤ 20 = White**. White-category units need no Consent to Operate (intimation suffices). Final category for a given facility depends on actual process, inputs and effluent characteristics — see Note 3 | Notified as an RTS e-service ("Consent to Establish" under the Water Act 1974 / Air Act 1981); **day count not confirmed** | Varies by scale (consent fees keyed to capital investment / gross fixed assets: https://www.mpcb.gov.in/sites/default/files/consent-management/Revisionofconsentfees.pdf) | Maharashtra Pollution Control Board (MPCB) | Primary: https://www.mpcb.gov.in/en/consentmgt/revised-industry-categorization. Supporting Water Act text: https://cpcb.nic.in/water-pollution-act/ | 29 August 2026 | **N/A — discretionary** (PI bands themselves: High) | **needs-review** |
| **Boiler Registration** | The Boilers Act, 1923 (Act 5 of 1923) — **repealed and replaced by the Boilers Act, 2025 (Act 12 of 2025), in force since 1 May 2025. See Note 4** | **Sec. 3** as given in the brief is **"Limitation of application"** — an *exemptions* clause, **not** the registration trigger. The operative provisions are **Sec. 6** (prohibition of use of an unregistered or uncertificated boiler) and **Sec. 7** (registration) under the 1923 structure; section numbers must be rechecked against the 2025 Act before final display. **See Note 4** | Verify — not confirmed from source. Earlier notes cite a below-25-litre exemption, below 1 kg/cm2 pressure, and water below 100 C, but those figures were not rechecked against the final enacted 2025 Act in this pass. A **22.75 litre** figure (1923 Act) and a **100 litre** figure (current Act) both appear in secondary sources and **conflict**; neither was confirmed against the final bare Act | Verify — not confirmed from source | Varies by scale | Directorate of Steam Boilers, Maharashtra | https://indiacode.gov.in/handle/123456789/21395 | 29 August 2026 | **Low** | **needs-review** |
| **Hazardous Waste Authorisation** | Hazardous and Other Wastes (Management and Transboundary Movement) Rules, 2016 (S.O. 3049(E), dated 4 October 2016; as amended 2019) | **Rule 4 read with Schedule I** — authorisation required where any waste listed in Schedule I, II or III is generated, handled, stored, transported or disposed of. For food processing, organic waste (fruit peels, pulp, whey) is generally **not** listed; solvent-based cleaning agents, chemical effluents and contaminated packaging **may** be — officer determination required. See Note 9 | **Any quantity** of a listed waste triggers authorisation — there is no de minimis threshold. The trigger is the *presence* of the waste, not the amount | Verify — not confirmed from source | Varies by scale | Maharashtra Pollution Control Board (MPCB) | https://cpcb.nic.in/hazardous-waste/ | 29 August 2026 | **Medium** | **needs-review** |
| **FSSAI Licence** | Food Safety and Standards Act, 2006 (Act 34 of 2006), with the FSS (Licensing and Registration of Food Businesses) Regulations, 2011 | **Sec. 31** — licensing and registration of food business: no person shall commence or carry on any food business except under a licence, save for petty/tiny operators who instead require registration | Tiered on **annual turnover**. **Registration: up to Rs 12 lakh** — widely reported but not read from the Regulations in this pass. State Licence above Rs 12 lakh; Central Licence above a higher ceiling — the **Rs 20 crore** crossover commonly quoted **could not be confirmed** and has been subject to revision | **60 days** — Reg. 2.1.4(1): a licence shall be issued within **60 days** from issue of the Application ID. Reg. 2.1.6 permits deemed commencement if not issued in 60 days. Registration: **30 days** (Reg. 2.1.1) | **Needs-review:** Earlier compendium notes list Registration **Rs 100/yr**; State Licence **Rs 2,000 / Rs 3,000 / Rs 5,000/yr** by class; Central Licence **Rs 7,500/yr**. Because the consulted compendium is old and FSSAI has later amendment notifications, do not present these as current without refresh. See Note 6 | Food Safety and Standards Authority of India / FDA Maharashtra | Primary Act: https://www.fssai.gov.in/upload/uploadfiles/files/Food-Safety-and-Standards-Act-2006.pdf. Regulations archive for current refresh: https://fssai.gov.in/notifications.php?type=regulation. Earlier compendium: https://jaivikbharat.fssai.gov.in/pdf/Compendium_Licensing_Regulations.pdf | 29 August 2026 | **Medium** | **needs-review** |

---

## Notes

### 1. Verified vs estimated thresholds

**Verified — the exact figure was read from the cited source:**

- **CPCB Pollution Index bands** — Red ≥ 60, Orange 41–59, Green 21–40, White ≤ 20, harmonised under Sec. 18(1)(b). Read from the MPCB categorisation page cited above.
- **Maharashtra Fire Act 2006** — Sec. 3(1), Sec. 3(2), Sec. 6 and the Schedule I / Schedule II structure, read from the official gazette PDF cited above. The absence of any "No Objection Certificate" provision was confirmed by full-text search of that PDF (see Note 2).
- **FSS Act 2006, Sec. 31**; the **60-day** licensing timeline at **Reg. 2.1.4(1)** and the 30-day registration timeline at Reg. 2.1.1. Earlier compendium notes list Schedule 3 fee amounts, but those fees need a current-regulations refresh before being presented as verified.
- **Boilers Act 2025 commencement** — Act No. 12 of 2025, assented 4 April 2025, brought into force **1 May 2025** by central notification. The transition itself is confirmed from India Code / official materials. The **25 litre / 1 kg/cm2 / 100 C exemption figures** were read from Bill-stage or secondary materials and were not rechecked against the final enacted Act in this pass — see Note 4.

**Provision confirmed, but not read from a primary text in this pass:**

- **Water Act 1974, Sec. 25** — the requirement of prior consent of the State Board is confirmed in substance and its effect is not in doubt, but the operative text was not read from a bare-Act source.
- **Boilers Act 1923 section headings** — that Sec. 3 is "Limitation of application" and that Sec. 6 and Sec. 7 are the operative provisions. This correction is important (see Note 4) but came from a secondary rendering of the Act text, not from the cited departmental page.

**Not confirmed — the product must render `—` or an `indicative` label, never a figure:**

- Fire NOC applicability trigger, including the widely repeated **15 metre** height band.
- Boiler **registration-triggering** capacity figure in litres (secondary sources conflict: 22.75 L vs 100 L). Distinct from the Act's **25 L exemption floor**, which is separately confirmed above.
- FSSAI State/Central turnover crossover (the ₹20 crore figure).
- Statutory day counts for five of the six approvals (all except FSSAI, which is sourced at 60 days).

### 2. Correction — the Maharashtra Fire Act contains no "No Objection Certificate"

The brief asks for the section that triggers a **Fire NOC**. On reading the Act text, the
word *"objection"* **does not appear anywhere in the 2006 Act**. There is no NOC section.

- **Sec. 3(1)** imposes the owner/occupier duty to provide and maintain fire prevention and
  life safety measures for buildings classified in **Schedule I**.
- **Sec. 3(2)** bars any planning authority from issuing a completion or part-completion
  certificate until it is satisfied the owner has complied. This occupancy-certificate bar is
  the closest statutory analogue to the "Fire NOC".
- **Sec. 6** is a *post-inspection rectification notice* issued after inspection under Sec. 5 —
  it is **not** plan scrutiny, and citing it as the NOC provision would be wrong.

The "Fire NOC" is therefore an **administrative artefact of the Rules and local practice**,
not a named provision of the parent Act. We model it as an approval because it exists in
practice, and we say so rather than attaching it to a section that does not support it.

### 3. MPCB categorisation is discretionary, not arithmetic

Consent to Establish applicability is **category- and scale-driven, not a numeric cutoff**.
The Pollution Index bands are exact, but the category assigned to a specific facility depends
on the actual manufacturing process, raw materials and effluent characteristics, and retains an
element of officer determination. The product therefore **surfaces the criteria and flags the
condition for officer determination rather than computing a threshold**. Fabricating a numeric
cutoff to make the UI look complete would be the wrong engineering choice.

In addition to PI-based categorisation, MPCB consent fees are differentiated by **MSME scale
slabs** (Micro: investment ≤ ₹1 Cr; Small: ₹1–10 Cr; Medium: ₹10–50 Cr; Large: > ₹50 Cr),
which are approximate slabs used for fee determination. These come from earlier working notes
and were **not independently verified** against the current MPCB fee schedule in this pass —
they are carried forward as indicative context for the fee column, not as sourced numbers.

### 4. The Boilers Act 1923 has been replaced — and Sec. 3 is not the trigger

1. **Sec. 3 is "Limitation of application"** — exemptions, not the registration trigger.
   Under the 1923 structure, registration is Sec. 7 and Sec. 6 prohibits use of unregistered
   boilers. The exact 2025 Act section numbering should be rechecked before the product displays
   section-level boiler citations.
2. **The 1923 Act was repealed** by the **Boilers Act, 2025 (Act No. 12 of 2025)**, which
   received Presidential assent on **4 April 2025** and was brought into force on **1 May 2025**.
   The governing-Act citation in the table has been updated. **What remains unconfirmed is the
   litre figure, not which Act applies.** Earlier notes cite an exemption for boilers below
   **25 litres** capacity, but that figure was not rechecked against the final enacted 2025 Act
   in this pass. The separate registration-triggering capacity (22.75 L vs 100 L in secondary
   sources) has also not been verified against the enacted 2025 Act text.
   Source: https://indiacode.gov.in/bitstream/123456789/21395/1/A2025-12.pdf

### 5. Statutory timelines

Timelines are drawn from **Maharashtra Right to Public Services Act, 2015** notifications
**where available**. In practice, only one of the six is sourced:

- **FSSAI — 60 days** is a real, quotable figure, but it comes from the **central FSS
  Regulations 2011 (Reg. 2.1.4(1))**, not from an RTS notification, and the clock starts at
  issue of the Application ID rather than at filing.
- **Fire NOC** and **MPCB Consent to Establish** are confirmed to be **notified RTS
  e-services** — they appear in the Aaple Sarkar notified-service list ("Issue/Renewal of Fire
  NOC"; "Consent to Establish" under the Water Act 1974 / Air Act 1981; "Issuance/Modification/
  Renewal of Licence of Food Business Operators"). However, that list carries **only service
  names, with no timeline column**, so no day count can be quoted.
- **Factory Licence** and **Boiler Registration** day counts could not be located in any
  official notification.

`data/approvals.json` now holds `statutoryDays: 60` for FSSAI (wired from the sourced
Reg. 2.1.4(1) figure) and `null` for the other six approvals. The UI renders **60 days** for
FSSAI and `—` for the rest. **A missing timeline is reported as missing, never interpolated.**
The timeline figure shown in the product is labelled *critical path*, not *total time*, and is
computed as the longest path through the dependency graph rather than a sum of durations.

### 6. Fees are indicative and vary by project scale

The earlier FSSAI compendium lists specific per-annum amounts in Schedule 3, but that
compendium is old and later FSSAI amendment notifications exist. Treat those amounts as
`needs-review` until refreshed against the current consolidated regulations. Every other fee
in this table **varies by project scale**. Only two fee structures were identified: MPCB consent
fees are keyed to capital investment / gross fixed assets (per the consent-fee revision circular
linked above), and fire service fees sit in **Schedule II** under Sec. 11 of the 2006 Act. The
Factory Licence and Boiler Registration fee schedules were **not** examined, so no structure is
asserted for them beyond "varies by scale". These are rendered with an `Indicative` chip and
are **not** presented as quotations.

### 7. Prototype status, link integrity, and source caveats

This is a **48-hour prototype**. All values must be verified against the latest gazette
notifications before any operational use. Nothing here constitutes legal or compliance advice.

Link-integrity and source-type findings from the 29 August 2026 verification pass:

- **India Code migrated** from `indiacode.nic.in` (all handle URLs 404) to `indiacode.gov.in`
  (Boilers Act 2025 PDF confirmed HTTP 200).
- **`mpcb.maharashtra.gov.in`** has no DNS A record; MPCB's live site is `mpcb.gov.in`.
- **DGFASLI's Factories Act PDF** is on an official `.gov.in` domain (HTTP 200) but is a
  **scanned image with no extractable text** — a judge cannot Ctrl+F for "Section 2(m)".
  The hash filename was selected from DGFASLI's "other acts" listing.
- The **Maharashtra Fire Rules 2009** PDF is also a non-OCR'd scanned image. Rule-level
  cross-references could not be verified from the official source.

### 8. Approvals modelled but not sourced in this appendix

The catalogue in `data/approvals.json` holds **seven** approvals. One remains unsourced:

- **Building / factory plan approval** (Municipal Corporation / Town Planning) — **not researched
  for this prototype.** No threshold, timeline or fee is asserted anywhere in the product.

Say *"seven approvals modelled, five applicable to this project"* — the excluded approval is
correctly excluded, not missing.

### 9. Hazardous waste authorisation — sourced from earlier working notes

This row was added by folding in earlier working research from `approvaliq-app/docs/data-
sources.md` (Avila's document-intelligence share). Key points carried forward:

- The trigger is **presence** of any waste listed in Schedules I–III of the 2016 Rules,
  regardless of quantity. There is no de minimis threshold.
- For food processing specifically: purely organic waste (fruit peels, pulp, whey) is generally
  **not** listed. Solvent-based cleaning agents, pesticide residues in raw materials, and
  chemical effluents **may** be listed. The system flags `generatesHazardousWaste: true` as
  requiring authorisation — the conservative and correct default.
- Classification ultimately depends on the actual waste stream and is subject to officer
  determination.
- Earlier working notes marked `needs-review` because the exact current Schedule I entries
  require direct government portal access to confirm at page-level. **This row inherits that
  status** — rated Medium rather than Low because the legislative reference (Rule 4 + Schedule
  I) is sound, but the specific Schedule I entries were not independently verified in this pass.

### 10. Factories Act / OSH Code transition

Section 143 of the OSH Code 2020 repeals the Factories Act, 1948 as part of the labour-code
transition. The table still uses the old 10/20 worker thresholds for the prototype because those
were the figures verified from the available Factories Act source, but the transition position is
time-sensitive and must be treated as `needs-review` before any operational use.

- Maharashtra has published draft OSH rules / labour-code materials, so final state-level
  commencement and rule status should be rechecked before presentation.
- The OSH Code framework is expected to move factory-style thresholds to **20 workers with
  power / 40 workers without power** once fully applicable through the relevant state rules.
- Until that transition is confirmed, the product should label the Factory Licence threshold
  as prototype-sourced and `needs-review`, not as a current legal opinion.

The old numbers are useful for the 48-hour demo, but they should not be described as a final
"in force today" position without a fresh legal-source check.

---

**Where a number could not be confirmed, this appendix says so.** That is the point of the
document: a judge should be able to check any figure we display, and see an honest gap where
we could not check it ourselves.
