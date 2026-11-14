# Martyn’s Law Readiness Check v3.3 — Legal and advisory distinctions

- All 38 readiness questions retained. No new questions, no new evidence uploads, and no changes to scoring, archive storage or RAG thresholds.
- Questions and results show contextual tags: **Linked to legal duty**, **Advisory preparedness**, **Optional good practice**. Tap **Legal basis and why this matters** for a concise explanation and reference.
- Tier-dependent application of sections 6, 7 and 10. Separate reference to section 8 co-ordination and section 9 regulator notification (not RAG-scored).
- PDF includes a legal/advisory explanation and a basis on each action and question.
- This is not a legal compliance determination and no action score should be used as proof of a legal breach.

## Termux update

1. Back up the existing archive from the app.
2. Download `Martyns-Law-v3.3-Legal-Advisory-Update.zip` to Android Downloads.
3. Run from `~/martyns-law-offline-app`:

```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Martyns-Law-v3.3-Legal-Advisory-Update.zip -d .
node test-basis.js
node test.js
git add .
git commit -m "Explain legal and advisory controls v3.3"
git push origin main
```

The commercial `premivue` private repository and `premivue.co.uk` are separate and are **not updated** by these commands.
