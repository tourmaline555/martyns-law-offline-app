# Martyn's Law Readiness Check — v3.1 workflow update

## Important: back up before upgrading

In the existing app, use **Audit trail & trends → Export records, actions & draft** and store that JSON in a secure location. Records remain in the **same browser on the same site address** after updating, but clearing browser storage can erase them. This update does **not** delete or migrate the IndexedDB records.

## What changed in v3.1

- Results now has one clear final action: **Save assessment & finish**. The archive is committed to IndexedDB before the active draft is cleared.
- A confirmation page displays the saved score and offers **Reassess this site** (same premises, all answers reset) or **Assess another site** (blank premises, all answers reset). Other options: view saved record, share saved PDF, or open the audit archive.
- Results shows **Share report** and a collapsed **More options** section for editing and backups. Duplicate toolbars were removed.
- Archived records have their own share, report, action and *optional* procedure template tools. The PDF report already contains the findings and recommended actions; a separate draft procedure template is not a required step in this workflow. It must be reviewed and adapted before operational use.
- Historical assessment snapshots remain read-only. Saving a record resets only the **current draft**, not the archive, action register or its change history.
- v3.1 service-worker cache name forces the updated page to replace the previous version after online refresh, while retaining offline operation.

## Termux update

```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Martyns-Law-v3.1-Workflow-Update.zip -d .
node test.js    # optional, if Node is installed in Termux
git add .
git commit -m 'Simplify save and archive workflow v3.1'
git push origin main
```

If the browser still displays the old controls, connect once, reload the GitHub Pages URL and verify the footer reads **v3.1**. Local Termux hosting (127.0.0.1) has a **different** record store from the public HTTPS domain.

---

# Martyn's Law Readiness Check (offline app)

A small, browser-based, offline-first UK premises/event readiness self-assessment. Designed to be easy to use on Android (including Termux), desktop and tablets. No account, backend, server-side database, cloud API, npm install or internet is needed to run it locally. Saved audit and action records use the browser’s local IndexedDB.

**Version:** 3.0, 13 November 2026.

## Version 3.0 — action tracker and follow-up (Termux update)

**What is new:** Each recommendation from a saved assessment becomes a trackable improvement action tied to **site + question ID**. Assign a responsible person, due date, status (**Open / In progress / On hold / Completed**) and a brief progress note. See outstanding, overdue and completed totals across all sites or filter one site. Every change creates a local timestamped log entry. Export a spreadsheet-ready **CSV action register**, or include the current action status, owner and due date in the PDF report.

A reassessment **carries outstanding work forward**, preserves the owner and due date and marks a gap as no longer present when the new questionnaire supports that. **It does not silently close actions.** If a completed gap is flagged again in a *newer* assessment, the task is reopened and the event is logged. Existing v2 saved snapshots are automatically used to seed the tracker when you open it. Historical snapshots remain unchanged. Progress entries are **not legally certified, tamper-evident or cloud-synced**.

**Before updating:** In the installed v2 app, open **Audit trail & trends → Export all records + draft**. Keep that archive somewhere secure. This v3 update keeps the same draft key and IndexedDB audit history (provided you open the same URL/browser). Do not clear Chrome data before backing up.

**Install onto your existing Termux project:** Download the **full** `Martyns-Law-v3-Full-Termux-Update.zip` (safest for v1 or v2 installs), or the smaller `Martyns-Law-v3-Action-Tracker-Update.zip` if already on v2, to Android Downloads. For the full ZIP, run:

```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Martyns-Law-v3-Full-Termux-Update.zip -d .
# Optional code checks, if nodejs is installed:
node test.js && node test-actions.js
git add index.html styles.css *.js manifest.webmanifest assets README.md question-data.json start-termux.sh
git commit -m "Add offline action tracker, due dates and change log"
git push origin main
```

Your GitHub Pages URL remains `https://tourmaline555.github.io/martyns-law-offline-app/`. Refresh it while online after deployment. Confirm that the footer says **v3.0**. The offline cache uses a new name and includes `actions.js`; after the new files have been cached the app runs offline again. No change to hosting or extra server is required.

**Use:** Save a dated assessment in Results, then tap **Action tracker**. Select your site, allocate actions and press **Save progress**. Look at **Activity history** for changes. Export the entire **v3 records + actions archive** regularly: it now contains assessments, actions, action events and draft answers in a single unencrypted JSON file. The Import function accepts both v2 (assessments-only) and v3 (full) archives; on a v2 import, it generates the action list from the saved assessment findings. Use **Export action register CSV** if someone needs to work with action data in a spreadsheet. Share the PDF using the existing **Share PDF** button in Results or historical records.

**Limitations:** Records and tracker data live on *one device + browser origin*. The public GitHub code repository does not contain assessment answers, notes or action records. This is not multi-user syncing or a legally defensible immutable audit register. The score is an indicative readiness model, not statutory certification. An assessor should review recommendations, status changes and the generated procedures for site-specific correctness. Never commit JSON backups, site-specific reports or sensitive plans to a public Git repository.

---

## What it does

- Site/scope screen (from questions Q1-Q4) asks for the highest *reasonably expected simultaneous* occupancy, main premises use, exclusions and relevant event entry criteria. This is **not a definitive legal scope determination**.
- One question at a time from the 38 readiness questions Q5-Q42 in your Excel matrix. Event and shared-site questions appear only when relevant.
- Yes (2), Partly (1), No (0), Not sure (0); weighted by the Excel matrix. Not applicable and unanswered are unscored. An unanswered item makes the result **provisional** and caps any Green result at Amber. Six specified critical questions answered No or Not sure also cap Green at Amber.
- Red (below 50%), Amber (50% to under 75%), Green (75%+), with critical/incomplete caps; no questions answered gives Unrated.
- Local autosave, notes/evidence references, section scores, priority actions (from the Excel matrix), downloadable standalone PDF report and export/import JSON backup.
- Installable as a PWA when served over localhost or HTTPS. On GitHub Pages, the service worker caches app files after the first successful load, allowing subsequent use without internet.

## Simple setup: Android Termux, no internet once installed

You need the free [Termux](https://termux.dev/en/) app and a web browser on the same Android device.

1. Download `Martyns-Law-Offline-App.zip` to Android's Downloads folder.
2. In Termux, run:

```sh
pkg update
pkg install python git unzip
termux-setup-storage
cd ~/storage/downloads
unzip Martyns-Law-Offline-App.zip
cd martyns-law-offline-app
sh start-termux.sh
```

3. Open `http://127.0.0.1:8765` in Chrome on the same phone. Choose **Add to Home screen** / **Install app** from the browser menu if available.
4. The local app works with **mobile data and Wi-Fi switched off**. While accessing via `127.0.0.1`, leave the Termux server running. A previously installed PWA can also work offline from its cache without the server, subject to browser storage policy.

Alternatively, copy `index.html`, `*.js`, `styles.css`, `manifest.webmanifest` and `assets/` together to the device and open `index.html` directly with the browser. Because browsers vary in their `file://` storage/security handling, the **localhost server is recommended**.

## Put it into your existing GitHub repository from Termux

For a repository you already own, substitute your actual GitHub user/repo names:

```sh
pkg install git
cd ~
git clone https://github.com/USERNAME/REPOSITORY.git
cp -r ~/storage/downloads/martyns-law-offline-app/. ~/REPOSITORY/
cd ~/REPOSITORY
git add .
git commit -m "Add offline Martyns Law readiness app"
git push origin main
```

If your branch is not `main`, use your existing branch name. GitHub may require a personal access token or SSH key for authentication. If the destination already contains a web app, merge carefully rather than overwriting its files.

To host on GitHub Pages: open repository **Settings → Pages → Deploy from a branch**, choose the containing branch and `/ (root)` (or move the files into `/docs`). Load the Pages URL once while online, then use the installed app offline. **Static application files are served from GitHub; the answers and reports remain local in the user's browser.** Do not commit exported assessment backups or site-specific PDFs to a public repo.

## Scoring / correctness considerations

**Scope screen:** A premises normally needs a building/part of building, a qualifying Schedule 1 principal use, expected simultaneous attendance of at least 200 (including staff), and no Schedule 2 exclusion. Standard = 200-799; enhanced = 800+. Places of worship, childcare, primary/secondary education, and further education normally remain standard even at 800+, unlike higher education. Some large events can qualify independently if the public has access, simultaneous attendance reaches 800, there are actual qualifying admission checks (tickets, payment or membership), the location isn't already enhanced-tier premises, and no event exclusion applies. Events held at worship, childcare, schools or further education premises are excluded from the event classification. The wizard cannot resolve every special case, mixed use or complex occupancy issue. It flags missing inputs for review.

**RAG:** The Act does not prescribe this rating or require an overall percentage. The scoring bands and weights are an assessment model in the user-provided spreadsheet. All recommendations must be checked for site-specific appropriateness and safety. The additional security questions also cover good practice beyond express standard-tier legal duties. The app makes **no assertion of regulatory approval or compliance certification**.

**Written documents:** Enhanced-tier premises and qualifying events have section 7 documentation obligations. Standard-tier premises are required to have appropriate public protection procedures in place but the Act does not expressly impose the same section 7 documentation duty. Q5 is therefore presented as a strong preparedness check, not an assertion that all standard-tier sites legally have to produce the enhanced-tier documentation.

**Act commencement:** The guidance available on 13 November 2026 indicated that the main legal requirements were not yet commenced and were expected from spring 2027. Confirm the up-to-date commencement position before assessing live statutory compliance.

## Sources

- User-provided `Question matrix with scoring.xlsx` (42 questions, weights, scoring, finding and action text). The spreadsheet is not included in the app because the working question data is built into `questions.js`.
- Home Office [Terrorism (Protection of Premises) Act 2025 statutory guidance](https://www.gov.uk/government/publications/the-terrorism-protection-of-premises-act-2025/terrorism-protection-of-premises-act-2025-statutory-guidance) (updated 25 August 2026).
- [Terrorism (Protection of Premises) Act 2025](https://www.legislation.gov.uk/ukpga/2025/10) and [SIA regulatory information](https://www.gov.uk/guidance/understanding-martyns-law-and-the-sias-role-as-regulator).
- The supplied NEBOSH workbook was background reading only. **Do not commit or redistribute it:** its licence restricts electronic distribution. Its text and pages are not included in this app.

## Data protection, resilience and limitations

The app has **no telemetry, account system, cookies, remote analytics, server-side storage or external JavaScript dependencies**. Its local state is written to browser `localStorage`. Sensitive site security details should be kept minimal in notes; anyone with access to the same device/browser profile may be able to see stored data. Browser data removal, private browsing or some storage policies can delete drafts. Export a JSON backup and store backups/reports securely. PDF text uses basic PDF fonts and may approximate unsupported non-Latin characters.

A fresh site should be assessed separately. The **Start a new assessment** command resets current stored work (with a confirmation). For multiple simultaneous sites, use separately saved backups and import when you need to revisit them.

## Developer notes

- `index.html`, `styles.css`, `app.js` — interface and flow
- `questions.js` — Excel-derived question content
- `logic.js` — pure scope and scoring logic
- `pdf.js` — no-dependency offline A4 PDF writer (generates a real downloadable PDF Blob)
- `sw.js` and `manifest.webmanifest` — offline caching and installability
- `test.js` — local Node.js tests with sample PDF output (dev only)

To run tests (optional), use `node test.js`. No `npm install` or build command is needed. Update the `CACHE` identifier in `sw.js` whenever you deploy changed files, so installed users receive the newest version on their next online visit.

**Before using this in a commercial or regulated context:** have a competent professional review the question set, applicability branching, priority wording and legal references against the current statutes, guidance and industry context. A self-assessment cannot establish legal compliance automatically.

---

## Version 2.0: audit trail, graphs, sharing and draft documents

This release adds an **offline-first audit records dashboard**. In **Results**, tap **Save dated audit record** to store a separate historical assessment. Previous records are read-only in the app. You can view a RAG rating at a glance, filter by site, inspect the stored actions, and chart weighted scores across reassessments. A **Reassess this site** button starts a fresh questionnaire with the site details copied (but no old answers). **Starting a new assessment does not delete saved audit records.**

The app stores saved snapshots in the device browser's **IndexedDB**; your in-progress assessment remains in the original `localStorage` key and is retained when upgrading from v1. Both forms of storage are specific to the browser/origin: assessments made in local Termux at `127.0.0.1` are separate from those made on GitHub Pages. Saved history does not sync automatically across phones, browsers or those two addresses. For moving records, choose **Export all records + draft**, then **Import saved archive** on the other browser. The archive includes business details, notes, answers, findings and priorities in readable JSON — it is **not encrypted**, and **local snapshots are not tamper-proof**. Export after each assessment and keep encrypted/protected copies in a suitable secure location. Clearing browser data, uninstalling the browser or replacing the phone can remove all locally stored copies.

PDF reports now have **action-priority and answer-profile bar charts** and no longer display the generic `Suggested evidence` lines. **Share PDF** uses the Android sharing sheet in supported browsers, and otherwise downloads the PDF so users can share it using Android Files. Sharing may disclose location, operational gaps or personnel information; review reports and choose a trusted destination. No automatic uploads are performed.

**Draft procedures** downloads a standalone HTML draft describing public protection procedures with site details, uncompleted site-specific fields, review/sign-off requirements and the recorded suggested actions. It is an **unapproved template** and must be completed, checked and signed by the responsible person. It is **not** a complete statutory section 7 document for enhanced duty premises or qualifying events. See the Home Office statutory guidance linked below. The HTML draft can be opened, edited and printed in software that supports HTML.

### Update the existing Termux + GitHub installation

This does **not** create a new repository. Download `Martyns-Law-v2-Update.zip` into Android Downloads (using Chrome for ChatGPT attachments if necessary). Then in Termux:

```sh
cd ~/martyns-law-offline-app || exit
# Export any saved v1 JSON backup first if you have important answers.
unzip -o ~/storage/downloads/Martyns-Law-v2-Update.zip -d ~/martyns-law-offline-app
node test.js   # optional; install Node with: pkg install nodejs
# Review changes, then publish
 git status
 git add app.js audit.js policy.js pdf.js styles.css index.html sw.js README.md test.js
 git commit -m "Add local audit records trends report sharing and draft procedures"
 git push origin main
```

You can also run it locally using `sh start-termux.sh`, or open your existing GitHub Pages URL after pushing. Reload once or twice while online to allow the service worker cache to upgrade. Confirm the footer says **v2.0**. The update preserves the previous draft because its browser storage key is unchanged.

**Important:** never put saved audit JSON files, completed reports, access controls, detailed site plans or personal data into a public GitHub repository. Keep only the generic app source in Git.

### Verification and limitations

Run `node test.js` to verify scope/rating rules, PDF generation, immutable-in-memory audit snapshot behaviour and escaping in the policy draft. The browser's IndexedDB and Android share-sheet integration need an in-browser test on the target device. The self-assessment provides indicative readiness rather than a regulatory compliance determination; review applicability and requirements against the current Home Office statutory guidance.
