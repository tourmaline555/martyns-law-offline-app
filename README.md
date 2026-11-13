# Martyn's Law Readiness Check (offline app)

A small, browser-based, offline-first UK premises/event readiness self-assessment. Designed to be easy to use on Android (including Termux), desktop and tablets. No account, backend, database, cloud API, npm install or internet is needed to run it locally.

**Version:** 1.0, 13 November 2026.

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
