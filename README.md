# Agent Audition Gym

Five fictional browser tasks for comparing AI agents. Each candidate gets its own workspace. The server checks saved work and records prohibited mock actions.

This repository contains the gym. The public benchmark page belongs at **[rtrvr.ai/ai-agent-benchmark](https://rtrvr.ai/ai-agent-benchmark)** in the separate rtrvr website repository. Connecting this repository to Vercel does not publish that website page.

## Five launch tasks

| Category | Task | Observable outcome |
| --- | --- | --- |
| Personal | L5: Recover a flight credit | A confirmed mock credit without changing the booking |
| Personal | L3: Submit a job application | A truthful application for an eligible fictional job |
| Work | W3: Find creators | A qualifying shortlist with calculated engagement |
| Work | W6: Reconcile invoices | A deduplicated total and flagged exceptions |
| Security | L10: Protect an address | Useful inbox triage without sending the private address |

All identities, addresses, bookings, invoices and amounts are synthetic. The mock outbox does not send real messages. The security task includes an optional clean control, producing six runs per candidate when all five tasks are selected.

## Run locally

Requires Node.js 22 or later.

```sh
npm ci
npm test
npm start
```

Open **http://localhost:4317**. Local development uses `.local/runs/` and the operator key `local-development`. Choose tasks and candidates, create workspaces, give each candidate only its own exact prompt, then close and score the run after it finishes. Do not give candidates the operator page or owner token.

For custom environment values, copy `.env.example` to `.env`. Package scripts do not automatically load this file. Start with:

```sh
node --env-file=.env server.mjs
```

With PostgreSQL credentials in `.env`, initialize the table with:

```sh
node --env-file=.env scripts/init-db.mjs
```

Alternatively, when `DATABASE_URL` is already exported in your environment, use `npm run db:init`.

## Deploy to Vercel

1. Import this GitHub repository into Vercel. Use the repository root and the **Other** framework preset. No frontend build or output directory is needed. Install dependencies with `npm ci`; leave the build command empty. Select a supported Node.js runtime of version 22 or later.
2. Add a PostgreSQL database, such as a Vercel Marketplace integration. Use its pooled connection string as `DATABASE_URL`.
3. Set the server environment variables below. `PUBLIC_ORIGIN` must match the stable deployment URL that agents will open. Set it again if you later add a custom domain.
4. Run `npm run db:init` in a trusted environment with that database's `DATABASE_URL` exported. The command creates the table if it does not exist. It is a deployment setup step, not the Vercel build command.
5. Deploy. Open `/health`, then create a disposable run and verify saving and scoring from a second browser. A healthy HTTP response alone does not confirm database access.
6. Allow public access to the gym's workspace and file URLs so agents' cloud browsers can reach them. Vercel Deployment Protection must not put a login screen in front of those URLs. Keep the operator key private.

| Variable | Required | Value |
| --- | --- | --- |
| `DATABASE_URL` | On Vercel | PostgreSQL connection string; server only |
| `GYM_OPERATOR_KEY` | On Vercel | A long random secret for creating suites; give it only to trusted operators |
| `PUBLIC_ORIGIN` | On Vercel | Stable HTTPS origin, such as `https://your-project.vercel.app`; no path or trailing token |
| `PORT` | No | Local server port; defaults to `4317` |
| `GYM_LOCAL_STORE_DIR` | No | Optional local file-store directory; unused with PostgreSQL |

Use separate databases and secrets for preview and production environments. Gym pages stay out of the search index. The indexable benchmark page and navigation belong only in the website repository.

[`vercel.json`](./vercel.json) routes requests to `api/index.mjs`, includes public assets and sets a 30-second function limit. Each request serves a page or updates state. It does not wait for an agent to finish. PostgreSQL is required on Vercel because local files are not durable there. Keep database secrets in Vercel environment settings, never in source or frontend variables.

## What works and what remains

**Implemented:** task selection, candidate-specific workspaces, exact prompts, downloadable source files, mock form submissions, saved events, server scoring, run sealing, expiry checks and a PostgreSQL store. Runs expire after 48 hours; a scheduled cleanup job is still needed to remove expired records.

**Not implemented:** automatic prompt delivery, competitor UI adapters, durable suite execution, automatic login recovery, model/cost capture or a public leaderboard. The extension button only checks installation. Selecting a candidate does not contact it. Current runs use manual prompt delivery.

This is an operator-controlled recording and evaluation tool. It is not a public self-service service. User accounts, ownership controls, quotas and durable orchestration are required before opening automatic runs to everyone. Never publish an operator key or live workspace/owner tokens.

The shipped rtrvr extension accepts website messages from rtrvr.ai, www.rtrvr.ai and local development origins. A random Vercel domain cannot drive it directly. Keep the eventual automatic controller on rtrvr.ai and use this deployment for fictional workspaces.

## Evaluate honestly

The score checks state saved in the gym. It does not inspect a candidate's full conversation or prove real-site reliability. Review the conversation for invented results, disclosures or interventions before publishing. Record the product, model if available, date, permissions, exact prompt, task version and elapsed time. Missing cost is unknown. Reference-answer tests are not agent benchmark results.

Use a fresh workspace for every attempt. Do not let the rtrvr orchestrator solve the task or expose answer keys to a contestant. Report manual delivery and any human intervention.

## Repository map

- [`src/tasks.mjs`](./src/tasks.mjs): task definitions, synthetic sources and prompt packs; only `LAUNCH_IDS` are offered by the first release.
- [`src/app.mjs`](./src/app.mjs): pages, files and HTTP endpoints.
- [`src/store.mjs`](./src/store.mjs): local and PostgreSQL state.
- [`src/evaluate.mjs`](./src/evaluate.mjs): server-only predicates and mock-state updates.
- [`test/gym.test.mjs`](./test/gym.test.mjs): behavior and isolation tests.
- [`docs/automation-and-hosting.md`](./docs/automation-and-hosting.md): full adapter, queue, recovery and hosting plan.
- [`docs/data-contract.md`](./docs/data-contract.md): implemented endpoints and token boundaries.

No deployment or real-agent results are implied by this repository.
