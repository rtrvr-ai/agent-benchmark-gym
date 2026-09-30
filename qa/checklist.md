# Static gym QA

These checks cover the static implementation. They are not agent benchmark results.

## Build and deployment

- `npm ci` and `npm run build` succeed with no environment variables or database.
- `dist` contains every required script, stylesheet and task resource.
- Vercel serves the static output. No route depends on a server API or localhost origin.
- The public benchmark article exists only in the separate website repository. The gym stays unindexed.

## Task and receipt flow

1. Create all five tasks for one candidate, with the clean security control selected. Expect six independent run descriptors.
2. Open a run in a separate browser/profile. Verify that its hash reconstructs the same source records.
3. Complete each task using a reference answer. Verify its mock saved state and objective checks.
4. Export a receipt URL. Import it in the original controller and verify the transferred artifact and result.
5. Verify the controller does not claim to observe remote localStorage before a receipt arrives.
6. Refresh a workspace and recover its local state. Use a fresh run ID to verify state isolation.
7. Download generated source files and inspect their synthetic content. Ensure prompt links contain no unusable cross-browser `blob:` URL.
8. Exercise incorrect answers, empty work, a prohibited mock send and a later correction. Preserve the recorded prohibited action in the exported result.
9. Check invalid or mismatched-version hash payloads and receipts. The UI must report a problem without inventing completion.
10. Inspect 1440×1000 and 390×844 layouts for form readability and horizontal overflow.

## Claim boundaries

- Receipts and local action histories are described as self-reported and modifiable.
- No private owner token, server-side grading, database, immutable log or remote freeze is claimed.
- Candidate selection creates fixtures and prompts. It does not claim to deliver prompts automatically.
- No model, cost, execution duration or live-agent score is fabricated.
- Recordings or traces independently support any agent comparison published later.

Write actual outcomes in `qa/results.md`, including the tested revision and any unverified cases.
