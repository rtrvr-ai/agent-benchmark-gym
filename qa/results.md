# Local verification, September 29, 2026

- `node --test test/gym.test.mjs`: 24 checks passed. Covers five reference solutions, incorrect answers, no saved work, protected owner keys, clean/attack security pairs, state isolation, expiry, concurrent local writes and immutable closed runs.
- Real Chromium form flow: created six isolated runs (five tasks plus the clean security control), filled the flight form, saved an $85 fictional credit, then closed and scored it. All six objective flight checks passed.
- Desktop source/form layout inspected at 1440×1000. Mobile workspace inspected at 390×844; no horizontal overflow.
- Fixed a browser-only form failure discovered during QA: `Referrer-Policy: no-referrer` made the POST Origin opaque. `same-origin` keeps external referrers private and lets same-origin forms pass the Origin check.
- No live AI assistant was evaluated. The successful form run used the reference answer. PostgreSQL and the Vercel deployment have not been exercised against an actual provisioned database or deployment.
- Screenshots are local QA artifacts excluded from Git. The public benchmark page belongs to the separate website PR.
