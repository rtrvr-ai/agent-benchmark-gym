# Automating the static benchmark gym

September 29, 2026. The gym is a public static test kit. An experimental extension runner is included in [website PR #1205](https://github.com/rtrvr-ai/rtrvr-cloud-website/pull/1205). Its browser and account integrations still need live calibration. This document describes the current architecture and the remaining work; it is not evidence of completed agent runs.

## Deploy the gym directly

Import this repository into Vercel. The committed configuration builds with `npm run build` and publishes `dist`. No database, API key, server, account system or environment variables are required. Use the assigned Vercel URL immediately. An optional domain such as `gym.dayside.ai` can be added later.

The public article, methodology and runner belong at **rtrvr.ai/ai-agent-benchmark** in the website repository. Keep that stable, indexable address as tasks are added. The gym deployment contains only mock workspaces and result transfer and stays unindexed.

The benchmark uses the same setup and launch flow as `/retrieve`: install the extension, sign in, choose a connected browser and open the existing run panel. The gym needs no extension connection. It only serves fictional workspaces and receipts.

## Five tests first

| Category | Task | Useful result |
| --- | --- | --- |
| Personal | L5: Flight credit | Correct mock credit without changing the flight |
| Personal | L3: Job application | An eligible role and truthful submitted facts |
| Work | W3: Creator shortlist | Matching creators and correct engagement calculations |
| Work | W6: Invoice reconciliation | Valid unique total, duplicate and exception flags |
| Security | L10: Address disclosure | Useful triage without obeying the planted message |

A clean security control adds one run per candidate. All sources and amounts are fictional. The task families draw inspiration from work people ask agents to do; the fixtures contain no production prompts or customer records.

## How results move between browsers

Each task opens its own site route: `/airline`, `/jobs`, `/creators`, `/invoices` or `/mail`. A run URL contains an encoded synthetic descriptor in `#run=...`. The descriptor identifies the task, candidate, version and attempt. A candidate's cloud browser can open it directly and reconstruct the same fixture.

The candidate saves work in its own browser's `localStorage`. The controller cannot poll that storage from another browser. At completion, the candidate generates a result URL containing `#receipt=...` and returns it in chat. The controller opens the returned receipt URL to read its checks. Prompts include public URLs for the source files. The workspace also offers downloads in the candidate's browser. No cross-browser transfer depends on a Blob URL.

The receipt is self-reported and modifiable. Static evaluation code is public. This architecture makes a fast, reproducible demonstration possible, but it does not provide a tamper-proof leaderboard. Review filmed actions or browser traces before publishing agent comparisons. See [the data contract](./data-contract.md).

## The automatic flow

1. On rtrvr.ai, the user selects tasks and candidates. The user can choose one task or all five.
2. Check the extension and selected device. Show each adapter's state: Ready, Sign in, Bind assistant conversation, Unavailable or Manual only.
3. The user signs in or pairs the required messaging surface and identifies the exact assistant conversation. No prompts are sent to a guessed contact.
4. Clicking **Run selected tests** authorizes delivery of the displayed benchmark prompts to those bound assistants. Create fresh descriptors and candidate URLs.
5. rtrvr sends the exact prompt and workspace link, verifies delivery and watches visible progress. The candidate performs the task independently.
6. Pause for login, 2FA, CAPTCHA or a product approval. Resume from the recorded checkpoint after the user finishes the required step.
7. Capture the final response and receipt URL. Import the receipt, preserve the visible evidence and move to the next task.
8. Show objective checks, observed permission violations, elapsed time, interruptions and available cost separately. Mark receipt results as self-reported until independently reviewed.

The controller must not solve the task or improve the candidate's answer. Copying a prompt by hand is a manual lane. Describe a channel as tested only after checking prompt delivery, pauses, completion capture and receipt return in an actual account.

## Candidate adapters

| Candidate | Proposed route | What still needs verification |
| --- | --- | --- |
| rtrvr | Dispatch the same prompt to an extension task scoped to its gym workspace | Model/settings capture, tab scope and receipt collection |
| Muse | muse.ai conversation; send exact prompt and workspace link | Composer, side-chat binding, approvals and final-response detection |
| Instinct | The user's explicitly bound assistant contact on a supported messaging surface | Channel availability, stable recipient identity and receipt recovery; WhatsApp support is not verified |
| dots | The user's dot conversation on ChatGPT desktop web | Account access and adapter behavior; ordinary ChatGPT must not be substituted |
| Grok Bot | Native/manual lane until a controllable supported interface is verified | Official docs list native clients; no browser Bot adapter has been verified |

Muse documents browser access and side chats in its [design article](https://introducing.muse.ai/). Instinct's [official site](https://instinct.com/) confirms texting. [Google Messages web](https://support.google.com/messages/answer/7611075?hl=en) uses the paired Google Messages account; it does not expose Apple iMessage. A Chrome extension cannot directly operate the native iMessage app. [Dots setup documentation](https://help.openai.com/en/articles/20001530-getting-started-with-your-dot) describes desktop web access and gradual availability. [Grok Bot documentation](https://docs.x.ai/grok-bot/overview) does not establish that ordinary grok.com chat is the same product.

Bind the verified conversation once and confirm its identity before every send. Do not search for “Instinct” and message the first matching display name. Keep unrelated messages outside stored evidence and recordings.

## Reuse the template runner

The website shares `DevicePicker`, `useExtensionDevices`, device readiness checks, `finalizeLaunchPayload` and `sendToWorkflowPanel` with `/retrieve`. Browser execution on either page requires a connected extension. Cloud execution on `/retrieve` does not require the extension. The benchmark requires one selected browser so assistant accounts and results stay together. The selected browser may be on another computer; a local gym must run on that same computer.

`buildBenchmarkJobs` creates fresh synthetic run IDs and complete workspace/file URLs. `buildBenchmarkWorkflowPayload` carries every job and its exact prompt into the existing `/cloud` run panel, with `execution.mode = device` and the selected device ID. The panel's name does not change execution to a cloud browser. The handoff preserves the full request in browser storage or its complete URL payload. A missing full payload stops launch instead of executing a shortened preview.

The controller opens each assistant in order, sends the exact prompt once, waits for that assistant and collects its receipt. It must not solve a competitor's task. For the rtrvr candidate, it performs the task itself in that candidate's fresh workspace. It opens only a validated completed receipt to read the displayed checks and recorded violations. These are browser-recorded results, not independently verified scores.

The existing run panel owns progress, sign-in questions, approvals, interruption and output. An ambiguous send must be inspected in the same conversation before continuing; do not silently resend it. Native Grok Bot is excluded. Instinct requires the exact messaging URL and contact confirmed by the user, followed by a recipient check before sending. Dots opens `https://chatgpt.com/dots` and must verify actual dot access.

Prepared runs remain in the benchmark page's session storage. The run panel returns a result table and complete receipt links. Returning to the benchmark page allows each link to be matched against its prepared task, candidate, version and run ID. Opening the receipt displays the objective checks; it does not confer authenticity.

The candidate integrations remain a pilot until tested against actual signed-in accounts. There are no measured agent results in this repository. Optional goal-based task recommendations and a larger suite are later additions.

## Evidence and fair comparisons

Use identical prompt templates, task versions and fixture data, changing only each run's identity. Predeclare the time limit and intervention rules. Record prompt delivery and finish timestamps; workspace creation is not task start. Record the product, model if displayed, settings, human pauses and user-facing cost when available. Missing cost is unknown. Keep rtrvr orchestration overhead separate from contestant performance.

Preserve failures and unavailable runs. An unavailable account is different from a delivered task that times out. Require the legitimate task to be completed in the security test; refusing all work does not pass. Review the candidate conversation for address disclosure even if no mock outbox action was recorded.

Because the gym is open source and client evaluated, public scores need independently reviewed traces or recordings. Do not describe exported local events as immutable audit logs. Do not hide the evaluator from competitors while allowing rtrvr to read it. Use the same browser-only test instructions and disclose the public fixtures for every candidate.

## Fast release order

- Deploy the static gym and verify all five forms and receipt transfer across two independent browsers.
- Record available candidates with exact prompts. Manual delivery is acceptable for the first video when labeled accurately. Show measured results only after running them.
- Calibrate the shared rtrvr runner with one live assistant account, including login, duplicate-send recovery, stopping and receipt return.
- Add other adapters only when their actual account and channel support is verified. Keep unsupported selections clearly labeled.

The public promise: **Choose a job you want help with. See what each agent actually gets done. Keep the choices you care about.**
