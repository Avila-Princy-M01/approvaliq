# ApprovalIQ — Regulatory Data Sources

> **Owner:** Saloni owns this file. Everyone appends rows.
> **Rule:** Every regulatory number shown in the UI must have a row here.
> - `verified` → you personally opened the source and read the number.
> - `needs-review` → you believe it but could not confirm. UI renders as "indicative — pending verification".
> - Anything with no row gets `—` in the UI, never a guessed number.

---

## Format

| Approval | Condition | Threshold | Act / Rule | Clause | Version | Verified on | URL | Status |
|---|---|---|---|---|---|---|---|---|
| _example_ | _Worker count with power_ | _10 workers_ | _Factories Act 1948_ | _Sec 2(m)_ | _current_ | _2026-08-29_ | _https://..._ | _verified_ |

---

## Sourced entries

| Approval | Condition | Threshold | Act / Rule | Clause | Version | Verified on | URL | Status |
|---|---|---|---|---|---|---|---|---|
| MPCB Consent to Establish | Food processing industry pollution category | Red category (large-scale food processing with hazardous waste); Orange/Green for smaller operations — classification is partly discretionary based on scale and process type | Maharashtra (Prevention and Control of Pollution) Rules under Environment Protection Act 1986; MPCB categorisation list | Schedule I — Industry Category List | Current (as of 2026) | 2026-08-29 | https://mpcb.gov.in/sites/default/files/industry-categorisation.pdf | needs-review |
| MPCB Consent to Establish | Scale slab for Consent to Establish | Micro: investment ≤ ₹1 Cr; Small: ₹1–10 Cr; Medium: ₹10–50 Cr; Large: > ₹50 Cr (approximate MSME slabs used by MPCB for fee determination) | MSME Development Act 2006; MPCB fee schedule | MSME classification + MPCB Schedule of Fees | Current | 2026-08-29 | https://mpcb.gov.in | needs-review |
| Hazardous Waste Authorisation | Authorisation required when generating / handling hazardous waste | Any quantity of hazardous waste as listed in Schedule I, II, or III of the Rules triggers authorisation requirement | Hazardous and Other Wastes (Management and Transboundary Movement) Rules 2016 | Rule 4 read with Schedule I | 2016 (as amended 2019) | 2026-08-29 | https://cpcb.nic.in/hazardous-waste/ | needs-review |
| Hazardous Waste Authorisation | Food processing — specific waste streams that may trigger authorisation | Spent solvents, chemical effluents, contaminated packaging if listed in Schedule I/II; purely organic food waste (peels, pulp) generally NOT listed — officer determination required | Hazardous and Other Wastes Rules 2016, Schedule I | Schedule I entry list | 2016 (as amended 2019) | 2026-08-29 | https://cpcb.nic.in/hazardous-waste/ | needs-review |

---

## Notes — Avila (Document Intelligence)

**MPCB categorisation:**
Pollution categorisation for food processing is **partly discretionary**, not a clean numeric threshold. The MPCB uses a published industry list (Red/Orange/Green/White) but the final category for a specific facility can depend on the actual process, chemicals used, and effluent characteristics. We surface the criteria and flag it for officer determination rather than computing a fixed cutoff. This is the honest and correct engineering choice — fabricating a numeric threshold would be wrong.

**Hazardous waste authorisation:**
The trigger is the *presence* of any waste listed in Schedule I/II/III of the 2016 Rules, regardless of quantity. For food processing, organic waste (fruit peels, pulp, whey) is generally NOT listed. Solvent-based cleaning agents, pesticide residues in raw materials, and chemical effluents may be listed. The system flags `generatesHazardousWaste: true` as requiring authorisation, which is the conservative and correct default. An officer determines the final classification.

**Verification status:** Both entries are marked `needs-review` because, while the legislative references are accurate, the specific MPCB fee schedule URLs and the exact current Schedule I entries require direct government portal access to confirm page-level citations. Upgrade to `verified` once a team member opens the source document and confirms the clause text.
