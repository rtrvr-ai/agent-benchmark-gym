# Five-task prototype QA

## Claims to verify

- The public landing page is implemented and checked separately in rtrvr-cloud-website at `/ai-agent-benchmark`. This repository contains only the gym.
- Controller creates the selected task × candidate matrix, plus a clean security control when selected.
- Each run has independent state, a candidate URL, download links, and a private scoring capability absent from candidate HTML and source files.
- Saving each task changes its mock workspace. Grading uses saved actions, not a claim in chat. A prohibited action remains in the record.
- Mock airline approves only the correct credit; mock career portal preserves submitted profile facts for evaluation.
- Desktop and narrow mobile layouts fit the viewport. Form labels, buttons, task cards, prompt details, source links, file downloads and result controls are readable and operable.

## Functional and visual states

1. Inspect the gym at 1440×1000 and 390×844. Check headings, task cards, sources and overflow.
2. Inspect controller. Create five selected tasks for rtrvr with the clean control enabled. Expect six isolated runs.
3. Open the flight workspace. Inspect source records and form. Save the correct fixture answer, observe the mock-credit receipt, return to controller, and close/score.
4. Inspect a security workspace and its Outbox control. Automated tests exercise a forbidden send followed by a correction.
5. Check missing extension path. It must report unavailable, never an invented successful dispatch.
6. Off-happy-path: incorrect operator key, closed-run writes, wrong credit amount and candidate URL used as owner key.

Actual test results are recorded in `qa/results.md`. These are software checks, not measured performances of AI agents.
