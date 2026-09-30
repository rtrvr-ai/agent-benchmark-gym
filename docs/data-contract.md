# Gym data contract

This describes the implemented prototype. Automatic suite orchestration is specified separately in [automation-and-hosting.md](./automation-and-hosting.md).

## Access boundaries

`GYM_OPERATOR_KEY` permits suite creation. Each created run has a random `agentToken` and a different `ownerToken`. The agent token opens and writes one fictional workspace. The owner token reads run state and seals it for grading. Treat both as bearer credentials. Give a contestant only its workspace URL and source-file links. Never give it the suite-creation response, controller page, owner token or evaluator source.

The current interface is for trusted operators. It has no public user-account or organization ownership layer. HTTPS is required for a remote deployment. Keep tokens out of published footage and logs. The app sends `no-store`, `Referrer-Policy: same-origin` and `noindex` headers on gym responses. External navigation does not receive the capability URL as a referrer. Same-origin form submissions retain their Origin header.

## Create a suite

```http
POST /api/suites
Content-Type: application/json
x-operator-key: <private operator key>
```

```json
{
  "tasks": ["L5", "L3", "W3", "W6", "L10"],
  "agents": ["rtrvr", "Muse"],
  "paired": true
}
```

Only the five launch task IDs are accepted. Candidate labels are `rtrvr`, `Muse`, `Instinct`, `dots` and `Grok Bot`. These are labels for workspace creation, not working delivery adapters. `paired: true` creates attack and clean variants for the security task. Non-security task data is unaffected by its internal variant label.

The response contains the benchmark version and a `runs` array. Every run includes its IDs and tokens, task/candidate/variant, creation and expiry times, state and event log, exact prompt and workspace URL. The response is privileged operator data. Do not return it directly to a candidate.

When a browser supplies an `Origin` header on a write request, the app requires the configured `PUBLIC_ORIGIN`. A controller hosted on rtrvr.ai should call the gym through its authenticated backend. Do not expose the operator key in a public browser bundle to work around this boundary.

## Candidate routes

| Method and route | Result |
| --- | --- |
| `GET /s/<agentToken>` | Task, source records, permissions and save form |
| `GET /s/<agentToken>/source/<sourceId>` | One source rendered as HTML |
| `GET /s/<agentToken>/files` | Download links |
| `GET /s/<agentToken>/file/<sourceId>.json` | JSON source file |
| `GET /s/<agentToken>/file/<sourceId>.txt` | Text source file |
| `GET /s/<agentToken>/file/<sourceId>.csv` | CSV, when the source is an array |
| `POST /s/<agentToken>/save` | Save declared task fields and update mock state |
| `POST /s/<agentToken>/action` | Record a listed mock action, including prohibited actions |

Forms accept URL-encoded data. A successful write redirects back to the workspace. A closed run rejects further writes. Source records stay synthetic and unchanged. A mock send updates only the run's outbox; there is no real email, SMS or payment service.

The first release has bounded request/field sizes and an event limit. Invalid, expired or missing tokens cannot open a workspace. The limits are implementation safeguards, not a substitute for public-service authentication and rate limiting.

## Owner routes

| Method and route | Result |
| --- | --- |
| `GET /api/runs/<ownerToken>` | `{ run, score }`; score is `null` until sealed |
| `POST /api/runs/<ownerToken>/seal` | Freeze the run and return `{ run, score }` |

Sealing is repeatable and does not reopen a run. Use a newly created run for a retry. A correct final artifact does not erase earlier prohibited-action events.

The score includes objective checks and counts, outcome, permission violations, safety wording, human-review notes and scope. “No violation observed in gym” does not mean a full security audit. Disclosures in the assistant conversation are outside this endpoint's evidence.

`createdAt` is workspace creation time. It is not a verified prompt-delivery timestamp. The prototype does not measure candidate execution duration, human pause time or per-task cost. Capture these separately for filmed runs; the durable runner must record them at their actual lifecycle events.

## Persistence and expiry

PostgreSQL stores runs in `audition_runs`. A revision column supports optimistic updates. The JSON run body contains the artifact, events and mock state. The local development store serializes writes in one process and saves files under `.local/runs/` unless configured otherwise.

Run access expires 48 hours after creation. Expiry checks do not delete stored rows or local files. Add retention cleanup before operating a public service. Do not publish database snapshots or local run directories.
