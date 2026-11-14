# Premivue prototype v3.5 — safeguard rating clarity

Fixes the potential misleading combination of overall GREEN with a partially effective critical safeguard or a heavily failed readiness topic. The numeric weighted score and question priorities remain unchanged. Adds explicit routing counts for Q5–Q42 and keeps earlier archived results unmodified.

**New rating rule:** If raw weighted score is Green (75%+), cap at Amber when any critical safeguard is Partly/No/Not sure, an applicable question is unanswered, or any scored topic with at least two scored questions is below 25%. Never upgrade Red or Amber. This is an app scoring methodology, not a statutory rule.

Q8 Partly remains High priority under the original matrix but is now prominently flagged as a critical safeguard and prevents overall Green. High-priority advisory items remain advisory; their priority does not assert legal obligation.

**Deployment:** Export the full audit archive. Unzip the full update in ~/martyns-law-offline-app; run `node test.js && node test-safeguards.js`; then commit and push to the existing prototype repository. v3.5 is not yet integrated with the private commercial Premivue website.
