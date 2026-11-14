# Premivue v4.0 — Phone/Windows acceptance checks

Make an encrypted backup before upgrading. Use fictional data for these tests.

1. **Draft remains unrated:** Complete 10 of 38 questions, all Yes. Results must say **Unrated / Not rated**, rather than “100% Amber”. A provisional audit snapshot may be saved, clearly marked incomplete.
2. **Existing records:** Confirm saved sites and action ownership are still present after the v4 upgrade. This is the migration check for the former action database.
3. **Improvement graph:** Import the bundled `tests/fixtures/riverside-three.json` from Saved assessments. Choose Riverside Music Venue. Assessments must appear May (40%), August (60%), November (90%) in chronological order, with connected lines. Reports from each date must remain archived/read-only.
4. **Historical action PDF:** Open Riverside May, download summary. Q5/Q8 actions must **not say Completed in May**; confirm the report's generation date differs from its May assessment date. November's remaining actions should read “In progress”, as at that assessment.
5. **Incomplete/forged import:** Export a test archive and change a stored `result.score` without changing its answers. The modified file must be rejected as inconsistent, with no partially imported records.
6. **Conflicting edits:** Copy a test archive to Windows. Edit an action on the phone and edit the same action differently on Windows. Import again and confirm Premivue asks whether to keep the local version or import the incoming one. Check the retained alternative in **Resolved cross-device action conflicts**.
7. **Browser storage failure:** If browser storage is unavailable or blocked, a prominent warning must appear rather than silently implying progress is saved.
8. **Unicode name:** Generate a test PDF for `Müller & García Café`. Check accents in Windows Edge, Android Chrome and PDF viewers. For non-Latin scripts, check the fallback on your actual devices.
9. **Encrypted archive:** Export on Android, transfer to Windows, import with the same password, and check the actions and graph. After subsequent edits, repeat the transfer—this is **manual transfer**, not cloud sync.
10. **Backup recovery:** Download and protect another archive after your checks; do not rely on the device browser as the only copy.
