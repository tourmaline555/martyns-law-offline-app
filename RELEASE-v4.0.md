# Premivue v4.0 — Assessment, transfer and audit-integrity release

**Target:** Existing offline prototype at `tourmaline555/martyns-law-offline-app`. This is not yet the `premivue.co.uk` commercial app.

## Core changes

1. **Completed scores only.** All applicable questions must have a valid Yes/Partly/No/Not sure answer or a permitted justified N/A. A draft with any missing or invalid response is **Unrated**. Its provisional raw percentage is not displayed as a completed rating. Such a draft may still be archived as an incomplete snapshot.
2. **Validated imported results.** Current and v3.9 scored records are recalculated from their answers, weights, priority and critical rules before import. Incorrect scores, RAG ratings, action priorities, or critical data reject the entire archive before any database change. Older versions and historical incomplete records that used an earlier display method are preserved with **Legacy/unverified** labels; they are not connected in the verified trend graph.
3. **Transactional imports.** Dated assessments, action items and action events now share a single IndexedDB (`martyns-law-audit-v2`, schema version 2) and import in **one readwrite transaction**. On error, the import is rolled back. Existing action records from the previous separate database are copied across once; the source database is retained as a safety measure.
4. **Cross-device action conflicts.** Imported updates are never silently skipped. If an existing action differs, the app displays both revisions, dates, owner and status and requires an explicit **IMPORT** or **KEEP** decision. The alternative complete action version is preserved in local conflict history; imported history for a rejected action is not merged into the authoritative timeline.
5. **Correct assessment chronology.** Graph points and record cards are in assessment-date order, not save time. Saved and imported dates remain visible. Backdated records are flagged. Connecting lines and improvement claims are shown only for verified records with compatible methodology and identical scored-question sets. New v4 scoring rules have their own methodology version.
6. **Draft-save warnings.** Storage failure is shown prominently on-screen. The user can still export an encrypted backup (on HTTPS/localhost). The previous silent catch has been removed.
7. **Historical PDF facts.** Reports display assessment and report-generation dates, scoring version and retrospective-guidance context. Action statuses in archived reports are reconstructed as at the assessment date from dated logs/completion timestamps when possible. If not possible, the report says the historic status is unverified; it does not silently substitute the current tracker status. Newly completed actions require a meaningful progress/closure note.
8. **Report layout and priorities.** The management report shows up to 8 highest-priority actions (full list in the detailed report). Top three are selected by effective readiness priority, not outdated critical flags. The report shows change from an earlier comparable assessment, where available, and uses plain-English scope labels in the detailed appendix.
9. **International names.** The offline PDF generator now uses WinAnsi encoding for Western European accented letters and symbols rather than stripping accents. Other scripts use a device-font canvas rendering fallback when available; confirm those fonts on the customer device before promising support.

## Backwards compatibility

- v3.9 records, action status and event histories remain on the phone. On first use of the v4 action tracker, the old action database is *copied*, not erased.
- Old snapshots retain their original answers and stored results; a legacy/unverified badge indicates if those results cannot be revalidated against the current matrix.
- Older v2/v3 unencrypted archives are accepted for migration. **Treat those files as sensitive**. New exports remain password-encrypted.
- Saved assessment IDs, site keys, question IDs and weights remain unchanged. **The scoring methodology ID changes** because incomplete ratings are withheld; mixed-version point-to-point trends will be visually disconnected by design.
- The original 38 scored readiness questions, scope questionnaire, action tracker, offline operation and branded PDFs remain in place.

## Termux installation

1. Export an encrypted audit archive from v3.9 first and keep a safe copy. Verify the password separately.
2. Download `Premivue-v4.0-Integrity-and-Reporting-Update.zip` to Android Downloads.
3. In Termux:

```sh
pkg install unzip nodejs-lts -y
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v4.0-Integrity-and-Reporting-Update.zip -d .
node test-v40-integrity.js
node test-v39.js
git add .
git commit -m "Premivue v4.0 audit integrity and reporting"
git push origin main
```

4. Refresh the app once online to activate the v4 cache. Verify **v4.0** in the footer. Check an imported synthetic archive, a historical report and your existing action tracker.

## Important limitations

- Imported archives can be recalculated against the questionnaire but **are not cryptographically authentic or independently audited**. A self-attested record cannot become tamper-proof just by being imported.
- Local browser records remain unencrypted by the app and can be deleted by clearing browser storage. Encrypted export does not provide automatic phone/Windows synchronisation.
- Browser-level test automation was prevented by this test environment. Complete the supplied phone checklist before using the release with real records.
- Neither the preparedness RAG nor preliminary scope screening certifies legal compliance. Independent legal/security review is still needed before charging customers.
