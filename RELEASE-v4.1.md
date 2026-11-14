# Premivue v4.1 — Focused reporting refinement

This release updates the **existing offline assessment prototype**, not the commercial site at `premivue.co.uk`. It builds on v4.0 without altering the 38-question flow, weights, RAG thresholds, action priorities or scoring methodology identifier.

## Changes

1. **Historical status provenance:** A report generated later for an earlier assessment uses only dated action events or action records available by that assessment date. Unknown historical status appears as **Not recorded** — never inferred from today's action status.
2. **Owner/deadline accuracy:** Historical owner and deadline appear only when confirmed in contemporaneous dated status events or an action record last updated by that date. Later edits are not pulled backwards into old reports.
3. **Cleaner actions:** A single short explanation at the start of the action plan replaces a repeated evidence sentence under every action. Each entry shows a concise status and date. If status was recorded when the action was raised, the date appears only once.
4. **More useful recommendations:** Q8 (lockdown), Q25 (site vulnerabilities), Q30 (escalation) and Q34 (procedure reviews) now offer clear, proportionate next steps. Previously saved answers and status logs are not rewritten. PDFs produced today say that advice uses current wording.
5. **Audit clarity:** New records identify app v4.1; the scoring methodology remains `premivue-2026-v40-complete-coverage` so comparable assessment scores stay comparable.
6. **Offline compatibility:** Service worker cache revised for v4.1 so phone browsers receive the updated PDF/report logic on refresh when online.

## Install using Termux

**First export an encrypted backup of your full audit archive and verify the password.** Download the release ZIP to your phone's Downloads folder. Then run:

```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v4.1-Reporting-Refinement.zip -d .
node test-v41-reporting.js
node test-v40-integrity.js
node test-v39.js
git add .
git commit -m "Premivue v4.1 reporting refinement"
git push origin main
```

Note: This full ZIP overwrites existing app files, but does not intentionally delete local browser data. Important assessments should still be backed up before deploying.

## Test expectations

- From an August Riverside archived record, the detailed report should show **60% Amber**, with Q5, Q8 and Q31 as the top three priorities, and action status **Open (raised 14 May 2026)** where dated action logs support it.
- If the action was first recorded after the assessment date and no earlier status exists, the historical PDF must say **Status: Not recorded**, not infer Open or Completed.
- New Q8/Q25/Q30/Q34 recommendations should explain the practical next step, not simply say "Improve clarity/consistency".
- Check management (3 pages) and full detailed report; no repeated status explanation or orphaned final action page.

## Limits

These statuses are reconstructed from **self-recorded local data**, not independent verification of the work. Legacy archives may lack the dates needed for reliable reconstruction. The product remains a private readiness self-check, not official legal certification. Android Chrome, Windows Edge, transfer/import/export and accessibility still require real-device testing before commercial launch.

The bundled `test-v40-integrity.js` and `test-v41-reporting.js` work directly in Termux using the included synthetic fixture, without requiring Linux PDF utilities or any `/mnt/data` paths.
