# Premivue v4.3 — Assessment-led Public Protection Policy Generator

This update replaces the old generic Draft Procedures HTML download with a structured policy builder. It is still offline-first and independent; Premivue is not endorsed by the Home Office or SIA.

## What changes

- **Generate tailored policy** from Results → More options, or **Generate policy** directly from a saved assessment.
- The generator uses the site/scope answers and the answers to Q5, Q6, Q8, Q10, Q11, Q12, Q13, Q14, Q17 and Q32. It highlights weaknesses without pretending they are already resolved.
- A guided editor collects real decisions, routes, safer internal areas, authorised lockdown and communications procedures, staff support and review responsibilities. It shows outstanding details and makes unconfirmed entries explicit.
- Enhanced-tier and qualifying-event assessments receive additional prompts for monitoring, people movement, physical and information security, vulnerabilities and effectiveness. **This is not the SIA section 7 document or a submission**.
- Download a genuine editable `.docx`, download a branded offline `.pdf`, or open a print-ready HTML preview. All files are labelled DRAFT / NOT APPROVED.
- Policy inputs persist locally under a key tied to the site/assessment date. They do **not** change the assessment or archived history. They are not currently included in encrypted audit-archive exports.
- Original 38 readiness questions, thresholds, scores, reports, action trackers and historical records remain untouched.

## Customer flow

1. Finish an assessment (or open a saved assessment).
2. Choose **Generate tailored policy** / **Generate policy**.
3. Open the Governance, Evacuation, Invacuation, Lockdown, Communications and Review sections. Confirm specific operational arrangements; do not enter invented routes or unsecured details.
4. Select **Save inputs & update preview**, then **Download editable Word (.docx)** or **Download draft PDF**.
5. Have the appropriate responsible person review the draft against actual premises, fire safety, accessibility, operational staff needs and applicable law. Edit and approve the document separately before circulating it as an operating procedure.
6. Keep the Word file securely. Inputs stored in the browser are **not encrypted by Premivue** and are not automatically copied to another device.

## Install using Termux

First export a password-encrypted copy of your audit archive. Download `Premivue-v4.3-Policy-Generator-Update.zip`, then:

```bash
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v4.3-Policy-Generator-Update.zip -d .
node test-v43-policy.js
node test-v43-ui.js
node test-v42-reporting.js
node test-v40-integrity.js
git add .
git commit -m "Premivue v4.3 assessment-led policy generator"
git push origin main
```

Refresh the GitHub Pages assessment while online and check footer `v4.3`.

## Safety and legal boundaries

- The policy uses answers **as reported**, not independently verified.
- It cannot determine the legal tier conclusively, verify real safety arrangements, guarantee effectiveness, or create statutory compliance.
- It does not approve a policy, submit to the SIA, fill the official SIA templates, or automatically close any action.
- Before using a policy operationally, a competent responsible person should verify safe evacuation, invacuation and lockdown choices (including fire safety), accessible communication, responsibilities and review arrangements.
- Separate standard-tier guidance on procedures from enhanced-tier duties on measures and documentation.
- Current SIA materials expect commencement **no earlier than spring 2027**; check actual commencement and later amendments at the time of use.

## Official source mapping (November 2026)

- [SIA: Understanding Martyn’s Law — Preparing for Martyn’s Law](https://www.gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator#preparing-for-martyns-law): preliminary scope, responsible person, four procedures, enhanced measures, notification, regulatory boundaries.
- [Home Office statutory guidance](https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025): section 5 preparedness and proportionate implementation; scope and tier checks.
- [SIA standard-tier planning tool](https://www.gov.uk/government/publications/martyns-law-standard-tier-planning-tool) and [SIA enhanced-tier template](https://www.gov.uk/government/publications/martyns-law-enhanced-tier-template): official planning artefacts updated 10 November 2026. Premivue references their subject areas; it does not reproduce or replace the official documents.
- Earlier **NEBOSH course workbook**: used solely for conceptual cross-checks around threats, decision-making, procedures, staff competence, communication, review and documentation. No copyrighted NEBOSH material is included or reproduced.

## Verification

The self-contained Node regression suites test source and exported output, including standard/enhanced variations, missing information, HTML escaping, DOCX ZIP integrity and PDF generation. The Word and PDF example files were rendered and visually reviewed. A real Android browser/Windows end-to-end test is still required; automated Chromium UI access is restricted in the current environment.
