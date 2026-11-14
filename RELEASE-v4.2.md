# Premivue v4.2 - Management-ready reports

Reporting-only update built on v4.1.

## Changes
- Page 1: top three practical next actions instead of repeating findings, with priorities. Names the specific critical questions and section 5 checks needing confirmation.
- Page 2: larger topic bars and a clear summary of three weakest areas (50% or below). No changes to the underlying score.
- Page 3 onward: groups Immediate, High and Medium actions; better typography; actions describe next steps instead of vague requests to “improve consistency”.
- Legal labels within PDFs read *Statutory-duty-linked (scope and commencement apply)*. An action priority is not a legal breach finding.
- Existing historical status logic, dates, scoring version, questionnaire and audit data are unchanged.
- Short report remains the default; the detailed PDF still includes the audit appendix.

## Termux install
Export an encrypted archive before updating, then download the ZIP and run:

```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v4.2-Reporting-Polish.zip -d .
node test-v42-reporting.js
node test-v41-reporting.js
node test-v40-integrity.js
git add .
git commit -m "Premivue v4.2 management and full PDF refinement"
git push origin main
```

After GitHub Pages deploys, refresh online, confirm **v4.2** in the footer, and regenerate both report variants. Historical PDFs saved in the past do not change; regenerated PDFs reflect the new report wording while keeping the original assessment responses.

## Notes
The PDF remains an independent preparedness self-assessment, not a legal certificate. Historical record integrity and offline functionality rely on the existing v4.1 code, which is unchanged. Review layout on your own Android and Windows devices before commercial release.
