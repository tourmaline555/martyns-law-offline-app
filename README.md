# Premivue — Martyn's Law Readiness & Assurance

Offline-first, browser-based premises readiness assessment. **Independent self-check; not an SIA endorsement or legal compliance certificate.**

## Included

- 38 weighted readiness questions, a conditional premises/event scope screen, and Red/Amber/Green scoring with critical safeguards.
- Legal-duty-linked vs advisory labelling, recommendations and a concise summary PDF with an optional full appendix.
- Dated on-device assessment snapshots, action ownership and deadlines, local action history, and an assessment-date-ordered comparison graph.
- Encrypted manual backups for Android/Windows transfer. v4 validates incoming assessments, detects action-edit conflicts and imports all records in a single IndexedDB transaction.

See `RELEASE-v4.1.md` and `PHONE-CHECKLIST-v4.1.md` for the reporting update and testing instructions. `RELEASE-v4.0.md` documents the underlying data-integrity release. For local development in Termux, run `sh start-termux.sh` and open the displayed localhost address. The app works offline after its assets have been cached; official external links require a connection.

All recorded values are self-reported. Do not include unnecessary security-sensitive information in progress notes or PDF shares. Local browser data is not encrypted by Premivue. Keep secure backups.

## v4.1 reporting refinement

- Histories show recorded action status at the assessment date only with dated evidence; otherwise **Not recorded**. Later owner/deadline edits are never projected backwards.
- Each action uses a compact status/date line, with owner and due date only where historically supported. The source/explanation appears once.
- Practical, fuller recommendations for Q8, Q25, Q30 and Q34; original answers, action history, RAG thresholds, weights and the v4.0 scoring method remain unchanged.
- Normal management report remains three pages in the Riverside example; detailed August report is seven pages.

## v4.2 management and full PDF polishing

Both PDFs now lead with practical management actions, name the specific critical safeguards, highlight weak areas and use clearer statutory-duty-linked wording. The short report is still three pages for the Riverside demo; the full version has larger action text and priority groups. See `RELEASE-v4.2.md` for Termux commands. No changes to readiness scoring or audit records.
