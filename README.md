# Premivue readiness prototype — v3.6

## Scope and tier-specific recommendations

This update **does not change the 38 readiness questions, weights, critical flags, RAG bands, or local action tracker**. It extends the unscored site setup to cover S1–S12 of the supplied *Premsure_Question_Matrix.xlsx*, whilst retaining extra statutory checks for buildings, exclusions, public event accessibility and qualifying ticket/pass/membership checks.

The 12 scope entries capture: responsible organisation; premises name/address; main Schedule 1 use; realistic simultaneous attendance; how attendance was estimated; events; event attendance; event location; event access control; site sharing; other responsible persons; assessment and review dates. Several existing fields double as S1–S12. Event and shared-site fields appear conditionally.

Premises results are **indicative**, never proof of legal compliance. The screen distinguishes premises with under 200 people, 200–799 (standard), 800+ (enhanced), and the special standard-tier treatment of worship, childcare, primary/secondary and further-education premises. It treats separate-location and multi-location events as needing an individual review. Qualifying events require public access, 800+ people at once, qualifying conditions of entry being checked, no statutory exclusion and not already enhanced-tier premises. See Home Office statutory guidance, Chapters 4–5.

Recommendations remain those in the assessment matrix, with duty-tier-aware explanations where relevant (Q5, Q24–Q25, Q31, Q35, Q38, Q39–Q42). These texts are saved in dated snapshots and carried to the existing action tracker, without changing action priorities or readiness scoring. Standard-tier premises are **not** automatically subject to section 6 measures, section 7 compliance document or section 10 senior individual duties. A section 10 appointment is relevant only where the enhanced-tier/qualifying-event responsible person is an organisation. Written procedures are recommended for standard tier but not a separate statutory documentation requirement. Section 5 procedures, section 8 coordination where applicable and section 9 notification are flagged separately.

**Important:** Partially known scope and complex mixed-use cases remain flagged for human review. A high RAG score never certifies compliance. The underlying Act had not commenced as of the guidance edition reviewed; verify commencement and current regulations for customer-facing use.

## Run and publish from Termux

The app is self-contained HTML/CSS/JavaScript, offline-capable and dependency-free:

```bash
cd ~/martyns-law-offline-app
sh start-termux.sh
```

Open `http://127.0.0.1:8765` in your phone browser. To publish a reviewed update to the existing prototype repository, copy the release files into this folder, run the Node tests if installed, then `git add .`, commit, and `git push origin main`. The private Premivue commercial site is a separate repository and is not changed by this upload.

**Back up saved assessments first** via the in-app audit archive export. Browser IndexedDB stores immutable-in-UI historical snapshots and the action tracker, but is not tamper-proof or an encrypted multi-device vault. V3.4 retains the same storage keys, so it does not automatically delete previous records.

## Test locally

```bash
pkg install nodejs -y
for f in test.js test-guidance.js test-basis.js test-actions.js test-workflow.js test-scope-tier.js; do node "$f" || break; done
```

## Source and interpretation

- Workbook basis: `Premsure_Question_Matrix.xlsx`, **Scope & Routing** (S1–S12) and **Assessment Matrix** (Q5–Q42); the original `Question matrix with scoring.xlsx` remains the readiness scoring foundation.
- Official legislation: [Terrorism (Protection of Premises) Act 2025](https://www.legislation.gov.uk/ukpga/2025/10/contents)
- [Home Office statutory guidance](https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance), last updated 25 August 2026.

This independent self-assessment is not an official SIA assessment or legal certificate.


## v3.5 safety-first score review

- Keeps all 38 readiness checks, original weights and action priorities.
- Displays routed question counts; does not treat S1-S12 as scored.
- A critical Partly answer prevents Green. A topic below 25% (with at least two scored items) also prevents Green. No change to the numeric weighted percentage.
- RAG reasons are explained on screen and in the PDF; legacy archived ratings are preserved and marked as legacy.
- Priority labels describe preparedness urgency, not legal requirement.

## v3.6 — Scope and report clarity

- High-occupancy listed uses combined with a negative public-building/access answer or claimed exclusion are marked **Review required**, never automatically "not qualifying". Do not treat this as proof of legal scope or exemption.
- The app checks Q5/Q8 and Q8/Q11 as well as Q16/Q26 and Q17/Q32 for answers to clarify. These prompts do not affect weights or scores.
- Practical recommendations improved for Q8, Q13, Q25, Q32 and Q34. Original action priority levels retained.
- PDF places scope first, distinguishes readiness score from statutory duties, highlights severe section gaps, and uses measured Helvetica widths to avoid clipping. Draft exports state that they are not yet archived.
- The questionnaire remains 38 checks, with scope handled separately and conditional routing preserved. Historical snapshots are not silently rescored or modified.

Tests: `node test-v36.js` and `node test.js`, plus the other `test-*.js` files.
