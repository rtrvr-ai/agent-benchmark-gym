# Agent Benchmark Gym

Five public, fictional browser tasks for comparing AI agents. Deploy the static site to Vercel and start using it. It needs no database, API key, account or environment variables.

The public benchmark article belongs at [rtrvr.ai/ai-agent-benchmark](https://rtrvr.ai/ai-agent-benchmark) in the separate rtrvr website repository. This repository contains the mock gym only. All people, addresses, jobs, bookings, invoices and money are synthetic.

## Deploy

Import this repository into Vercel and deploy. The checked-in configuration runs `npm run build` and serves `dist`. No environment setup is required. Use the resulting Vercel URL in the video and candidate prompts. A custom domain is optional.

Hosted gym: [agent-benchmark-gym.vercel.app](https://agent-benchmark-gym.vercel.app/).

## Five tasks

| Category | Task | What to check |
| --- | --- | --- |
| Personal | L5: Recover a flight credit | Correct mock credit without changing the booking |
| Personal | L3: Submit a job application | Eligible job and truthful applicant facts |
| Work | W3: Find creators | Matching profiles and calculated engagement |
| Work | W6: Reconcile invoices | Deduplicated total and flagged exceptions |
| Security | L10: Protect an address | Useful inbox triage without sending the private address |

Selecting the clean security control creates six runs per candidate across the five named tasks. Mock submissions affect only the browser's fictional workspace. The mock outbox sends no real messages.

## Website routes

| Route | Site and interactions |
| --- | --- |
| `/airline` | Booking, fares, policy and credit request form |
| `/jobs` | Resume, preferences, job cards and application form |
| `/jobs/J1` | Individual job and application action; J1 through J4 exist |
| `/creators` | Six profiles, sample posts and shortlist form |
| `/creators/C1` | Individual creator; C1 through C6 exist |
| `/invoices` | Five files and reconciliation form |
| `/invoices/a.txt` | Individual invoice, including a-copy.txt, b.txt, c.txt and d.txt |
| `/mail` | Inbox, account profile, saved notes and simulated outbox |
| `/mail/M1` | Individual message; M1 and M2 exist |

Opening a plain site URL creates a fresh browser workspace. Links within a site preserve the run descriptor and saved work. Navigation uses the History API; Vercel rewrites also support opening or refreshing a detail route directly. Forms save in place. Raw source downloads stay under `/files`.

## Run a comparison

1. Choose tests on [rtrvr.ai/ai-agent-benchmark](https://rtrvr.ai/ai-agent-benchmark) and copy a prompt, or set up an automatic run. The gym itself is only the fictional websites.
2. Give each candidate its exact prompt and its own workspace URL. The URL contains a synthetic run descriptor in its hash, so it can open in a different browser without a backend session.
3. The candidate reads the mock records, completes the forms and uses the result control to generate a receipt URL. It returns that URL in its chat response.
4. Open the returned receipt link and review the saved artifacts, checks and visible browser evidence. Repeat with fresh runs for the other candidates.

Workspace state stays in that browser's `localStorage`. It does not synchronize with the controller or another browser. Returning the encoded receipt transfers the result. Prompts include public links to the fictional source files; the workspace also offers downloads.

**The receipt is self-reported and modifiable.** This static gym does not produce tamper-proof scores or independently verified execution logs. Review a recording or browser trace before publishing a comparison. Client-side evaluation code and fixture answers are public; this is a transparent test kit, not a hidden test set.

## Current scope

The gym supports fictional websites, local state, file downloads, result receipts and objective checks. The [website PR](https://github.com/rtrvr-ai/rtrvr-cloud-website/pull/1205) adds an experimental extension runner. Task selection, assistant selection, automatic runs and public comparisons live on rtrvr.ai. No actual agent scores, costs or timings are included.

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

Fixture version `gym-0.3.0` gives assistants ordinary task requests without “mock,” “benchmark,” or hints about the planted inbox instruction. Permission limits remain explicit. Source links use neutral `files/<task>/a` and `files/<task>/b` paths. The website and footer still disclose the fictional environment, so this is not a blind evaluation. Old-version run descriptors cannot be mixed with these revised prompts.

## Task attachments

The build creates a resume PDF and text copy from the same facts as the job site, plus five invoice text files. They live under `/attachments/`; `manifest.json` records their task IDs, MIME types, byte sizes, SHA-256 hashes and task version. The website lists download links without fetching the bytes during rendering or build. Automatic runs load and check the files only after Run is clicked, then pass canonical file descriptors to rtrvr.

The resume is `avery-example-resume.pdf` (or `.txt`). Invoice filenames are `a.txt`, `a-copy.txt`, `b.txt`, `c.txt` and `d.txt`. The other three tasks read their records on the linked sites; there are no extra candidate attachments.
