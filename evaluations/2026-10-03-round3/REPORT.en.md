# Round 3: Making deduplication concrete

[中文](REPORT.md) · **English**

This round found a specific improvement: both newly generated materials pages placed the deletion result, countdown, and undo action in one feedback area. They reduced repeated visible success messages while explicitly stating before deletion that the materials could not be restored after 30 seconds. Adding, saving, searching, deleting, undoing, and expiration paths passed in a real browser.

The original samples and review records are in Chinese. Quoted UI strings below are translated from those records.

The work also exposed and corrected two problems: cutting copy could omit a critical consequence, and the example “Undo unsuccessful” could turn a timeout with an unknown outcome into a claim of failure. All failed samples are retained. None of the conditions commonly produced long compliance copy, so this round did not establish a general reduction in compliance boilerplate.

## Test method

The [fixed tasks](tasks.md) did not ask for brevity or the removal of filler. They asked for a JSON tool, a podcast booking prototype, and a course materials page. One no-Skill group, two groups using the previous version, and two groups using the first candidate produced 15 complete prototypes. Subsequent targeted revisions produced four B/C prototypes and two C prototypes, for a total of 21.

Generators used independent contexts and did not read other outputs. Reviews hid the condition names and assessed the actual visible copy and state strings. Branding and expressive copy were recorded separately. Necessary information, specific error guidance, and feedback serving different purposes were not counted as filler. The Skill was explicitly loaded; automatic activation was not evaluated. The full process is in the [protocol](protocol.md).

## Findings and revisions

| Stage | Observed result | Response |
| :--- | :--- | :--- |
| Two previous-version groups | The same deletion produced both a success status paragraph and an undo card. | Deduplication needed to specify how to use the feedback area. |
| Two first-candidate groups | Deletion feedback no longer repeated, but one group omitted the explicit consequence of expiration. The booking prototype also weakened the explanation of what a demo submission did. | Labels and countdowns cannot replace critical consequences. |
| Two consequence-restored groups | Consequences were explicit before deletion and near submission, but both C prototypes again repeated the success message. | Explicitly reuse the existing result area instead of adding a toast or status paragraph with the same content. |
| Two feedback-mechanism C prototypes | One visible deletion result and undo action, with the pre-deletion consequence retained; a separate, invisible screen-reader announcement was present. | Copy review and the browser's main flows passed. |
| Boundary test | The body retained the unknown outcome, but the title said “Undo unsuccessful.” | Correct the misleading example in the Skill and require the title to agree with the body. |
| Two final sets of result copy | Unknown outcomes were described as a timeout and unconfirmed restoration; when it was confirmed that all five items remained unrestored, the copy accurately reported failure and offered retry. | Both sets passed review. |

The model could still ignore “say the same fact only once.” A more concrete rule is: **when an existing operation area already carries the result and next action, reuse that feedback area. Remove repeated visible copy while retaining feedback that serves a different purpose.** Screen-reader announcements can reuse that area or use an invisible announcement.

The [first independent review](blind-review-first.md), [repeat-sample review](blind-review-repeat.md), final [copy and boundary review](final-review.md), and [result-copy review](unknown-review.md) retain the original wording. The final review explicitly recorded the failed title; the revision followed that finding.

## Was necessary information preserved?

Five [boundary tests](boundary-tasks.md) covered the server destination before upload, 30-day retention, JPG/PNG and a 10 MB limit; unknown agreement text and a checkbox explicitly required to remain; a request for a detailed explanation; consequences before confirming permanent deletion; and the unknown outcome of an undo timeout.

The first four passed. The detailed explanation still addressed four states individually, with implementation approaches, incorrect examples, and verification methods. After correcting the misleading title in the fifth test, responses were regenerated for [two contrasting scenarios](unknown-cases.md):

| Condition | Wording in both independent responses | Review result |
| :--- | :--- | :--- |
| Timeout; restoration outcome unknown | “Undo request timed out” / “Restoration outcome is not yet confirmed” / “Refresh list” | Neither response turned the unknown outcome into a claim of failure or a restored-item count. |
| Confirmed that none of these five items were restored | “Undo failed” / “None of these five materials were restored” / “Retry undo” | Both retained the known outcome and the permitted next action. |

[Response one](unknown-one.md), [response two](unknown-two.md), and the [independent review](unknown-review.md) can be compared directly. The final revision only addressed unknown outcomes and agreement between titles and bodies. The complete HTML set was not regenerated afterward; the two materials-page validations used the preceding feedback-mechanism version.

## Scope of actual validation

The [browser log](browser-log.md) distinguishes actual interactions, observations during iteration, and rechecks of frozen files. The main agent used cua_repl. Different conditions used different localhost ports to isolate storage.

- First no-Skill, previous-version, and first-candidate groups: checked the main operation paths, including the JSON tool's actual clipboard contents and the materials page's state after waiting a real 30 seconds.
- Consequence-restored version: submitted both booking prototypes to generate previews. Materials-page interactions were used to observe repeated feedback, not to accept the final version.
- Feedback-mechanism version: checked adding, persistence after reload, searching, selecting and deleting, and undo within the time limit in both frozen C files. Undo was unavailable after a real 30 seconds. The first file was also reloaded to confirm that expired materials did not return.

Screen-reader-related checks confirmed the hidden announcement markup and CSS; they were not acceptance tests with an actual screen reader. Browser compatibility, storage-failure UI, concurrency across tabs, and all input combinations were not exhaustively tested. There were no calls to a booking service, real email, or payments.

Pure-logic checks had different scopes, so assertion counts are not scores for comparing conditions. Scripts used logic from the actual generated outputs; some checks used an in-memory DOM or storage substitute. Examples that can be rerun from the repository root:

```bash
node evaluations/2026-10-03-round3/baseline/verify.cjs
node evaluations/2026-10-03-round3/current-logic-check.cjs
node evaluations/2026-10-03-round3/candidate-run/verify.cjs
node evaluations/2026-10-03-round3/feedback-one/verify-task-c.cjs
```

When archiving `check-final-one.cjs` and `final-two-check.js`, only the local absolute paths were changed to repository-relative paths. Both scripts were rerun and passed.

## Outputs and versions

| Directory | Rules used | Contents |
| :--- | :--- | :--- |
| [baseline](baseline/replies.md) | No Skill | A/B/C |
| [current](current/replies.md), [current-repeat](current-repeat/replies.md) | [Previous version](published-skill.md) | A/B/C, one group each |
| [candidate-run](candidate-run/replies.md), [candidate-repeat](candidate-repeat/replies.md) | [First candidate](candidate-skill.md) | A/B/C, one group each |
| [final-one](final-one/replies.md), [final-two](final-two/replies.md) | [Consequence-restored version](consequence-skill.md) | B/C, one group each; original directory names retained |
| [feedback-one](feedback-one/replies.md), [feedback-two](feedback-two/replies.md) | [Feedback-mechanism version](feedback-skill.md) | C, one group each |
| [Final two response sets](unknown-review.md) | [Final rules](final-skill.md) | Two responses each for an unknown outcome and a known failure |

Original anonymous mapping: L4=baseline, Q2=current, R7=candidate-run, T9=candidate-repeat, V6=current-repeat; final mapping: E2=feedback-one, F8=feedback-two. The mapping was disclosed after the reviews were complete.

This was a small-sample, targeted evaluation with revisions prompted by failures. It supports a specific improvement in particular scenarios, not long-term stability, statistical significance, or a general percentage improvement. There is no comprehensive ranking of the JSON tools or decorative copy.

[Round 1 records](../2026-10-03/REPORT.md) · [Round 2 records](../2026-10-03-round2/REPORT.md)
