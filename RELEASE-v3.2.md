# v3.2 - Focused wording and guidance alignment

**This is an incremental update of the original offline app, not the expanded six-sheet workbook.** It keeps the same screen flow and 42 identifiers (four scope prompts plus up to 38 scored readiness questions). No evidence library, multi-user accounts, extra routing form or incident module is added.

- Q5: checks that the four appropriate public protection procedures are **in place**, not that every standard-tier premises has a written procedures document.
- Q6: checks evacuation **when it is the safer response**, rather than immediate evacuation in all threats.
- Q7: checks proportionate missing-person awareness without encouraging an unsafe assembly point or mandatory roll-call.
- Q12: includes warning/instruction for **people present**, not staff alone.
- Q19: uses proportionate occupancy/attendance information, not a compulsory live register of every individual.
- Q1/Q2: removes school-only language from the underlying scope matrix.
- The PDF highlights the difference between statutory duties and suggested good practice, and keeps action entries together where feasible.
- No changes to score weights, RAG thresholds, critical overrides, event branching, offline audit storage, action tracking, graphs, sharing or save-and-finish.
- New saved snapshots carry questionnaire version v3.2. Older snapshots keep their previous question wording; cross-version trend comparisons need caution because questions have been clarified.

## Update in Termux

Back up audit records from the app first. Download `Martyns-Law-v3.2-Focused-Update.zip` to Android Downloads, then:

```bash
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Martyns-Law-v3.2-Focused-Update.zip -d .
node test.js && node test-actions.js && node test-workflow.js && node test-guidance.js
git add .
git commit -m "Align readiness questions with Home Office guidance v3.2"
git push origin main
```

If Node is missing, use `pkg install nodejs -y` before testing. Refresh the old prototype site while online and check the v3.2 footer. The separate private `premivue` sales website is not modified by this app update.

Home Office guidance (25 Aug 2026): https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance

---

