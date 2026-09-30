# Agent Benchmark Gym

Five public, fictional browser tasks for comparing AI agents. Deploy the static site to Vercel and start using it. It needs no database, API key, account or environment variables.

The public benchmark article belongs at [rtrvr.ai/ai-agent-benchmark](https://rtrvr.ai/ai-agent-benchmark) in the separate rtrvr website repository. This repository contains the mock gym only. All people, addresses, jobs, bookings, invoices and money are synthetic.

## Deploy

Import this repository into Vercel and deploy. The checked-in configuration runs `npm run build` and serves `dist`. No environment setup is required. Use the resulting Vercel URL in the video and candidate prompts. A custom domain is optional.

Repository visibility is controlled by its owner. This setup does not change it or deploy on your behalf.

## Five tasks

| Category | Task | What to check |
| --- | --- | --- |
| Personal | L5: Recover a flight credit | Correct mock credit without changing the booking |
| Personal | L3: Submit a job application | Eligible job and truthful applicant facts |
| Work | W3: Find creators | Matching profiles and calculated engagement |
| Work | W6: Reconcile invoices | Deduplicated total and flagged exceptions |
| Security | L10: Protect an address | Useful inbox triage without sending the private address |

Selecting the clean security control creates six runs per candidate across the five named tasks. Mock submissions affect only the browser's fictional workspace. The mock outbox sends no real messages.

## Run a comparison

1. Open the deployed gym. Select tasks and candidate labels, then create runs.
2. Give each candidate its exact prompt and its own workspace URL. The URL contains a synthetic run descriptor in its hash, so it can open in a different browser without a backend session.
3. The candidate reads the mock records, completes the forms and uses the result control to generate a receipt URL. It returns that URL in its chat response.
4. Import the receipt in the controller and review the saved artifacts, checks and visible browser evidence. Repeat with fresh runs for the other candidates.

Workspace state stays in that browser's `localStorage`. It does not synchronize with the controller or another browser. Returning the encoded receipt transfers the result. Prompts include public links to the fictional source files; the workspace also offers downloads.

**The receipt is self-reported and modifiable.** This static gym does not produce tamper-proof scores or independently verified execution logs. Review a recording or browser trace before publishing a comparison. Client-side evaluation code and fixture answers are public; this is a transparent test kit, not a hidden test set.

## Current scope

The gym supports synthetic task pages, prompt packs, local mock state, downloads, result receipts and objective checks. The [website PR](https://github.com/rtrvr-ai/rtrvr-cloud-website/pull/1205) adds an experimental extension runner. Candidate labels in this gym prepare test links; they do not launch assistants. No actual agent scores, costs or timings are included.

The extension runner belongs on rtrvr.ai. The shipped extension accepts messages from that origin and local development origins. A random Vercel domain cannot directly control it. The gym itself remains public and static.

## Optional local development

Requires Node.js 22 or later. There are no runtime dependencies.

```sh
npm ci
npm run build
npm run dev
```

Use the local URL printed by the development server. Local development is optional; the deployed gym uses its own current URL and requires no localhost configuration. Run `npm test` for the repository's software checks.

Use the hosted URL when testing an assistant with its own cloud browser. Your localhost is accessible to your browser and rtrvr extension, but not to that remote browser. Both versions keep mock state in browser storage. Running locally also lets you edit the fixtures and evaluator.

## More detail

- [Automation and hosting](./docs/automation-and-hosting.md): how rtrvr can deliver prompts, handle sign-in, collect receipts and run multiple candidates.
- [Data contract](./docs/data-contract.md): hash URLs, local state and receipt limitations.
- [QA checklist](./qa/checklist.md) and [verification record](./qa/results.md).

Keep real personal data out of the gym. A simulated credit is not money recovered from an airline, and a successful fixture task does not establish reliability on real websites.

## Candidate prompt wording

Fixture version `gym-0.2.0` gives assistants ordinary task requests without “mock,” “benchmark,” or hints about the planted inbox instruction. Permission limits remain explicit. Source links use neutral `files/<task>/a` and `files/<task>/b` paths. The website and footer still disclose the fictional environment, so this is not a blind evaluation. Old-version run descriptors cannot be mixed with these revised prompts.
