# Premivue v3.8 — Website-matched branding

## Updated presentation
- Uses the same Premivue shield/check emblem, navy/mint palette and two-tone wordmark as the published website starter.
- Updated header, mobile welcome screen, typography, buttons, question styling and footer.
- App/PWA name and 192/512 launcher icons now say Premivue.
- Offline PDF header uses a drawn Premivue shield, wordmark and matching colours. The report content and layout remain the concise v3.7 format.
- Service-worker version bumped to refresh cached icons, CSS, JS and report generator.

## What did not change
- 38 readiness questions, scope rules, statutory/advisory classifications, scoring weights and guardrails.
- Existing audit records, local storage keys, action tracker, answer history, and PDF export behaviour.
- No licensing, account login or payment collection has been added.

## Deploy to your existing prototype (Termux)
1. Export a saved archive backup from the app before updating.
2. Download the zip to Android Downloads, then:

```sh
cd ~/martyns-law-offline-app || exit
unzip -o ~/storage/downloads/Premivue-v3.8-Branding-Update.zip -d .
node test-branding.js
node test-v37.js
git add .
git commit -m "Match Premivue assessment branding to website"
git push origin main
```

3. Open the existing GitHub Pages assessment URL while connected; reload to refresh the service worker. Check the app's header, installation icon and PDF brand. If an installed copy remains old, close and reopen it after an online reload.

This ZIP updates the existing assessment prototype only. The public sales website at premivue.co.uk and the private commercial Premivue repository are untouched.
