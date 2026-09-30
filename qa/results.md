# Static gym verification record

Tested September 29, 2026 against the static conversion in the same commit as this record. The previous server/database implementation has been removed.

## Verified

- `npm ci`, `npm test` and `npm run build` passed. No database, API keys or environment configuration supplied. The project has no runtime dependencies.
- All 26 automated checks passed. They cover five reference answers, incomplete work, incorrect calculations, fabricated applicant facts, prohibited sends, clean and injected inbox variants, isolated local state, receipt replay, malformed imports and payload limits.
- Chromium opened six independent workspaces in a separate browser context: the five tasks plus the clean inbox control. Reference answers submitted through the visible forms passed all objective checks: L5 6/6, L3 6/6, W3 4/4, W6 5/5, and both L10 variants 3/3.
- A receipt returned from the separate context imported into the original controller. Its result remained available after navigating back and refreshing.
- Receipt JSON downloaded and decoded successfully. The direct `fixtures/W6/standard/a-copy.txt` link returned the expected fictional invoice.
- Inspected desktop at 1440×1000 and mobile at 390×844. The mobile invoice workspace had no horizontal overflow.
- `git diff --check` passed.

## Not yet verified

- Vercel deployment, which the repository owner will connect.
- Live assistant execution, including extension delivery, login recovery and remote receipt return.
- Real task duration, model identity or user-facing costs. The results CSV contains headers only.

Reference solutions verify gym behavior. They are not AI-agent benchmark scores. Receipts remain self-reported and modifiable even when all software checks pass.
