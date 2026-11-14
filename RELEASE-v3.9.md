# Premivue v3.9 — Reliability and red-team remediation

**Date:** 14 November 2026  
**Target:** Existing offline assessment prototype, not the commercial premivue.co.uk website.

## What changed

1. **N/A integrity:** question-level N/A is offered only for Q22, Q23 and Q37. Each requires a meaningful rationale of at least 15 characters. Other N/A entries imported from older drafts are treated as missing until corrected. Invalid N/A cannot yield a completed Green. When fewer than 80% of applicable checks have valid responses, the headline rating and percentage are withheld as **Unrated** (the raw partial percentage is never presented as a complete score). Automatic event/shared-premises routing still removes irrelevant questions.
2. **Not sure is not No:** both score zero conservatively, but Not sure now says the answer was not verified. Recommendations start by verifying the position before implementing a remedy.
3. **Q35 legal context:** Q35 checks a named preparedness lead but does not verify the specific section 10 senior-individual designation. It is advisory regardless of tier, not a critical RAG override; its unanswered/negative response still produces a prioritised recommendation. The statutory section 10 check remains separately flagged where applicable.
4. **Events at other locations:** Events-section Q39–Q42 do not contribute to a premises score for events solely at separate, mixed, or unknown locations. The app prompts for independent event/location review. Existing saved snapshots remain read-only.
5. **More reliable trend comparisons:** New records carry scoring-method and scored-question IDs. Score-change claims and trend connecting lines are suppressed when either differs. Cross-site aggregate trend disabled; choose a single site. Existing archived score values are never rewritten.
6. **Stable site identity:** New assessments receive a persistent `siteId` and `siteKeyId` so address/name edits do not split future histories. Reassessments from historical snapshots retain their existing legacy site key to keep old actions linked. This is not a shared cross-device identifier until you restore a matching backup.
7. **Sensitive backup protection:** Drafts and full archives now export as password-encrypted AES-256-GCM JSON using PBKDF2-SHA-256 (310,000 iterations, random salt and IV). Imports accept the new encrypted format and older unencrypted formats for migration. The password is never persisted or transmitted. **If lost, an encrypted archive cannot be recovered.** This feature needs HTTPS or localhost, which are secure contexts for browser cryptography.
8. **Simpler user guidance:** Explains public access (paid customers may still be members of the public), flags conflicting answers while working through the questionnaire, and highlights the top three prioritised actions on Results.
9. **SIA alignment without overclaiming:** Procedure checks map to evacuation, invacuation, lockdown and communication. Users are linked to the official SIA standard-tier planning tool and enhanced-tier template published 9 November 2026 and updated 10 November 2026. The app explicitly does **not** populate, submit or verify completion of the official SIA forms or the statutory notification; the optional draft-procedures document directs users to those tools.
10. **Audit output clarity:** The three-page management PDF retains independent scope/RAG results, adds scoring version and coverage, distinguishes provisional reports, and notes that official SIA planning tools remain separate.

## Important limitations

- Local browser storage (drafts, records and actions) remains **unencrypted by the app and not tamper-proof**. A downloaded encrypted backup does not change that. Avoid storing unnecessary details of sensitive security measures.
- **Secure shared accounts, organisation roles, cloud recovery, server-side audit signing and Stripe/Cloudflare licence enforcement are not implemented in this offline prototype.** These require a backend/identity project, and cannot be responsibly claimed as fixed by changing local JavaScript.
- The official SIA tools are mapped at the high-level procedure/duty level only. Premivue does not certify compliance or replace the official templates.
- The scope and legal classifications still require competent independent review, and the mobile Android installation/sharing flows require final real-device tests.
- Historical records preserve their original scoring versions. Differences between old and v3.9 scores must not be represented as improvement without reviewing applicable questions and methodology.

## Installation in Termux

1. Export existing records in the current app **before upgrading**. Older exports are unencrypted: store them securely and delete spare copies only after validating the new encrypted backup and its password.
2. Download `Premivue-v3.9-Reliability-Update.zip` into Android Downloads.
3. Run:

```sh
pkg install unzip nodejs-lts -y
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v3.9-Reliability-Update.zip -d .
node test-v39.js
node test-crypto.js
git add .
git commit -m "Premivue v3.9 reliability and scoring fixes"
git push origin main
```

4. Open the original GitHub Pages prototype online once, refresh, and confirm the footer says v3.9. Test a backup **export and import**, an N/A question, a Q35 No at standard tier, and a separate-location event. Preserve your backup passphrase separately.

**Source documents:** Home Office, Terrorism (Protection of Premises) Act 2025 statutory guidance updated 25 August 2026; SIA Martyn's Law planning tool (standard tier) and enhanced tier template updated 10 November 2026. Full source URLs appear in the app's About section.
