# Premivue v3.7 - Simplified report and editable scope

## What changed
- A prominent Correct scope answers button on the results scope panel. The question No/Yes selection for publicly accessible building is editable and results recalculate immediately when saved.
- Archived records are immutable. Create corrected copy (scope) starts a new dated draft with earlier answers carried forward.
- Short management PDF: legal scope, readiness rating and top concerns on page 1; score breakdown and answer checks on page 2; priority action plan on following page(s). Redundant repeats have been removed.
- Optional detailed PDF includes all readiness questions and individual answers. This is separate from the normal shareable management PDF.
- No changes to the 38-question bank, weighted score, critical rule, topic scores, action priority rules or offline storage.

## Update via Termux
```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v3.7-Report-and-Scope-Update.zip -d .
node test-v37.js
git add .
git commit -m "Premivue v3.7 simplify PDF and enable scope corrections"
git push origin main
```

Back up records before updating. Hard reload online if cached scripts do not update. This package updates the old assessment prototype, not the private Premivue commercial website.
