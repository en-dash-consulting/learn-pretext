---
name: ndx-adversarial-review
description: Attack a change or a completion claim, triage what breaks, and capture only what the user approves
argument-hint: "[task-id | name | topic]"
---

Attack a change — or the claim that a task is done — and find what actually breaks. Then triage each finding for validity and necessity, propose solutions, and hand the result to the user.

**By itself, this skill changes nothing.** It reads, attacks, and triages. It never edits source code, never fixes a defect, and never writes a PRD item on its own initiative. The only writes it can make are PRD items the user has explicitly approved — a new item, or an addition to an item that already tracks the finding — and fixing any of them is a separate run.

Two passes, in this order:

- **Pass 1 (Step 3)** — find failures and rank them by severity.
- **Pass 2 (Step 4)** — decide whether each surviving finding is *necessary* to act on.

The necessity pass is not optional and is not a formality. A review that lists ten real-but-irrelevant defects costs more than it returns: it buries the one that matters and fills the PRD with work nobody should do.

## Step 1 — Mark the usage start, then resolve the target

**Before reading anything, mark where this review's token usage starts:** run `ndx hench usage mark --task=skill:ndx-adversarial-review .`. The CLI snapshots the session transcript's cumulative usage and position; Step 7's record computes the review's spend as the difference between that snapshot and the transcript then — arithmetic done by code, not a timestamp typed by hand. If the command reports no session or transcript, continue; the record will say it fell back.

**Then note what is already dirty:** run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root and keep its output. Every path it lists is the user's work in progress, and the commit step at the end stages only paths that are not on this list.

**Find the PRD layout first:** call `get_prd_status` (rex MCP). A v2 tree answers with `"layout": "v2"` and keeps the PRD in `.rex/product/` (areas, capabilities and constraints: the standing requirements) and `.rex/changes/` (changes with their tasks and subtasks: the work, which closes), each folder's tool state in a `state.yaml` beside its Markdown. A v1 tree answers with no `layout` field and keeps the PRD in `.rex/prd_tree/` (epics, features, tasks and subtasks). A step that differs by layout gives each its own line, labelled in bold; every other step applies to both.

Then read the argument, if any:

- **No argument → diff mode.** Review the working diff: `git -c core.quotepath=false status --porcelain`, then `git diff` plus `git diff --cached` and the contents of any untracked files. If the working tree is clean, fall back to the branch diff — but **resolve the default branch, never assume it**. Run `git symbolic-ref --short refs/remotes/origin/HEAD`, which returns an already-remote-qualified ref like `origin/main`, and diff against that: `git diff <that ref>...HEAD`. It is a local lookup with no network call. In a fresh or `--single-branch` clone `origin/HEAD` is often unset and the command fails; when it does, ask the user which branch to compare against rather than guessing. (`git remote show origin` also reports the default branch, but it contacts the remote, so it is a poor silent fallback.) Say which diff you ended up reviewing.
- **Argument is an item ID or slug → claim mode.** Call `get_item` (rex MCP).
- **Argument is a name or topic → clarify first, then resolve.** Rex has no search tool, so enumerate rather than guess — the same technique Step 6 uses. List the directories under `.rex/prd_tree/` (v1 tree) or `.rex/changes/` (v2 tree): each name *is* an item slug, and the nesting mirrors the hierarchy, so the tree is the index. Read the `index.md` of any whose slug looks related. Use `get_prd_status` (rex MCP) when you need the epic-level shape first to decide which subtree to walk. `get_item` fetches an item once you know its ID — it does no fuzzy matching, so it is not a way to find one, and on a large epic it can return more than the response limit allows. Present the matches with their ID, title, status, and parent, and ask which one is meant. If nothing matches, say so and offer diff mode scoped to the files the topic touches. Only after the user picks an item do you continue in claim mode.

In claim mode, also gather what the claim rests on: the item's acceptance criteria, the parent chain from `get_item`, the commits that touched the relevant files (`git log --oneline -- <paths>`), and the claimed test mapping from `verify_criteria` (rex MCP) — called with **`runTests: false`**.

Pass that flag explicitly. `verify_criteria` defaults `runTests` to `true`, which spawns whatever the project set as its test command in `.rex/config.json` — a command this step has not discovered, has not vetted, and cannot narrow, at a point where the skill has promised to change nothing. The mapping of criteria to test files is the part you need here; running them is Step 2's job.

State the resolved target in one line before continuing — mode, what is in scope, and what is not.

## Step 2 — Build the ground truth

Read the actual code, not the story told about it. Commit messages, changeset text, code comments, checked-off acceptance criteria, and a prior run's summary are **claims under review**, not evidence.

- Read every changed file in full, not just the hunks — a diff hides the code that gives it meaning.
- Use `get_file_info` and `get_imports` (sourcevision MCP) on the changed files to see who calls them. A defect nobody can reach is a different finding from one on a hot path.
- Use `get_zone` (sourcevision MCP) for the zones involved, and `get_findings` for known issues already recorded there.
- Read the tests that cover the change, and note which behaviors have no test at all.

Then let the project's own checks do the work that reasoning does badly — but **find the commands before running any.** Do not assume a stack or guess an invocation.

**The commands you discover in this step are the only ones permitted to execute tests.** Nothing earlier may spawn a project command — not a tool call that runs tests as a side effect, and not a command lifted from a README without checking it. If you reach this step having already run something, say so in the report; a review that quietly executed an undiscovered command has broken the promise in its own header.

- **Discover.** Check, in order: `.rex/workflow.md` (it names the project's validation command), the manifest's script block (`package.json` scripts, `Makefile` targets, `pyproject.toml`, `Cargo.toml`, `go.mod`, `build.gradle`, `composer.json`), the CI workflow files, and `CONTRIBUTING.md` / `README.md`. The CI config is the most reliable source: whatever gates a merge is what the project actually considers validation. Note the package manager the repo uses rather than defaulting to one.
- **Run the static and test checks you found**, narrowed to the change where the tooling allows it — a single package or test file when that covers it, the full suite when it does not. Type or static analysis (`pnpm typecheck`, `tsc --noEmit`, `mypy`, `cargo check`, `go vet` — whichever this repo has), the test runner, and the linter are all fair game.
- **Inside an `ndx work` run whose brief says the test gate follows, run scoped checks only** — the static checks and the tests for the files in the diff — and state in the report that the gate covers the rest. The full suite is not exercised; name that as what the review did not touch. Outside hench (an interactive `/ndx-adversarial-review`), the rule above stands.
- **Run only read-only checks.** Tests, typecheck, and lint are fine; build and coverage artifacts are tooling output, not project state. Do not run anything that rewrites the repo as a side effect: formatters in write mode, codegen, migrations, snapshot updates (`-u`), or n-dx commands that regenerate analysis and PRD state (`ndx ci`, `ndx plan`, `ndx analyze`, `ndx refresh`). This skill has no license to touch those, and they collide with anything already running.
- **If you find no checks**, say so and move on. An unverified review is still a review — a fabricated command is not.
- **A red result is a finding.** Paste the failing output as its evidence — the failure is already reproduced, so it does not need a constructed trigger in Step 3. Assign severity by what it breaks, not by how noisy it is.
- **A green result is not evidence of correctness.** It bounds the review; it does not end it. Write down what the passing run actually exercised and what it never touched — Step 4 asks whether each finding is already covered, and this is the only honest answer to that question. A review that reports "checks are green, no findings" has not been performed.

## Step 3 — Pass 1: attack

Work the dimensions below. They are a floor, not a ceiling — add any that the change invites.

1. **Inputs that were not imagined.** Empty, missing, duplicate, zero, negative, very large, unicode, whitespace-only, already-present. Off-by-one at every boundary. Wrong or surprising default.
2. **Failure paths.** What happens when the file is absent, unreadable, half-written, or locked; when a spawn fails, exits non-zero, or never exits; when JSON is malformed; when the network call times out. Look hard for the case where an error is swallowed and the caller reads the result as success — an unreadable file reported as "unchanged" is the shape to hunt.
3. **Concurrency and ordering.** Two writers to the same file. A cache read while its source is being rewritten. A watcher that fires before the write completes. Anything that violates the concurrency contract in the project's assistant instructions. Ask what a second process doing the obvious thing at the same moment would do.
4. **Platform.** Windows versus POSIX: path separators, drive letters, CRLF, shell quoting, `/dev/null`, process trees and how they are killed, case-insensitive filesystems, path length.
5. **Contract drift.** Does the change cross a tier boundary without going through a gateway, import where it should spawn, add a cross-package import outside a gateway module, or bypass a documented boundary rule? Does an injection seam silently default to a no-op for a new caller?
6. **Test quality.** For each new or changed test, ask the only question that matters: *would this test fail if the behavior it names were reverted?* Flag tests that assert on a mock rather than the subject, that pass vacuously when the code under test never runs, that assert a shape but not a value, or that would still pass with the fix removed.
7. **The claim itself (claim mode).** Take each acceptance criterion one at a time and try to prove it is *not* satisfied. Record how each one is actually verified: by a test that would catch a regression, by reading the code, or by assertion only. "Asserted only" is a finding.

For every candidate finding, do two things before writing it down:

- **Construct the trigger.** Name concrete inputs or state and the wrong output, crash, or corruption that results. If you cannot construct one, the finding does not exist — drop it rather than softening it into a "consider" or a "might want to."
- **Try to refute it yourself.** Go looking for the guard, the caller-side check, or the type that makes your scenario impossible. If you find it, drop the finding. If you looked and found nothing, say what you looked for — that is what makes the finding credible.

Assign a severity to each survivor:

| Severity | Meaning |
|----------|---------|
| **critical** | Data loss or corruption of project state, a silent wrong answer users act on, or a security hole |
| **high** | Crash, hang, or wrong behavior on a path real users hit |
| **medium** | Wrong behavior on an edge path, or a test that does not actually protect the behavior it names |
| **low** | Contract or convention drift with no current failure, but it makes the next change riskier |

## Step 4 — Pass 2: necessity

Now turn on the other half of the review. For each surviving finding, answer all four:

1. **Reachable?** Name the real entry point that gets there — a command, a route, a call site. If only a synthetic caller can produce it, say so.
2. **Already covered?** Is it caught upstream by validation, a type, a caller-side guard, or an existing test? Answer from what the Step 2 checks actually exercised, not from the fact that they were green.
3. **Worth fixing?** State what a fix would cost and what it would risk. A branch and a test to prevent silent data loss is cheap. Restructuring a module to prevent a failure nobody can reach is not.
4. **In scope?** Was it introduced by this change, or is it pre-existing and merely visible now? Pre-existing issues get reported in their own group — never fold them into the current change.

Then give each finding one verdict:

- **must-fix** — real, reachable, and the cost of leaving it exceeds the cost of the fix.
- **should-fix** — real and worth doing, but it can wait for a follow-up.
- **not-worth-fixing** — real, but unreachable, already covered, or the fix costs more than the defect. Say which.
- **out-of-scope** — real and pre-existing. Belongs in the PRD under its own area, not attached to this change.

A finding that survived Pass 1 and lands on **not-worth-fixing** is a success of the review, not a failure. Report it with its reasoning; do not quietly delete it, and do not inflate it to justify the attack.

## Step 5 — Report, propose solutions, and ask

Present a compact table — finding, `file:line`, severity, necessity verdict, one-line rationale — with the concrete failure scenario written out underneath each one. Group the out-of-scope findings separately. If Pass 1 found nothing, say that plainly and state what you attacked, so the user can judge whether the attack was aimed correctly.

For every finding you are not calling **not-worth-fixing**, include the proposed solutions alongside it: at least one, and more than one where the choice is genuinely open. For each — what it changes, what it costs, what it risks. Say which you recommend and why. Where the right fix turns on a decision that is the user's to make, name the decision instead of picking silently.

Then **stop and ask.** The verdicts and the proposed solutions are a recommendation, not a decision. Ask which findings the user wants captured into the PRD as work.

- Nothing has been written at this point — no source file, no PRD item.
- "Looks good" or "yep" is not authorization. Wait for an explicit selection — all must-fixes, a named subset, or a specific finding.
- If the user disagrees with a verdict, take it as calibration and say what you weighed, rather than re-arguing the finding.
- If the user wants nothing captured, stop here. A review that ends with no items and a clear reason is a complete run.

## Step 6 — Check what the PRD already tracks

**Check for overlap first:** if any path on the list you kept at the start is under `.rex/prd_tree/`, `.rex/changes/` or `.rex/product/` (a `state.yaml` included), name those paths and ask the user to commit or stash them before this step or the next writes anything — `add_item` or `edit_item` rewrites the parent's and ancestors' `index.md` (their Children tables) on a v1 tree, and the parent's folder and its `state.yaml` on a v2 tree, so a dirty one would keep part of this change out of the commit. Once they have, run `git -c core.quotepath=false status --porcelain --untracked-files=all` again and keep that output as the list instead; if they decline, carry on, and those paths stay out of the commit.

A review run twice finds the same defects twice. Capturing them again buries the original item under near-duplicates and splits its history, so **check before you create anything.**

Rex has no search tool, so enumerate rather than guess: list the directories under `.rex/prd_tree/` on a v1 tree, or `.rex/changes/` on a v2 tree (each directory name is an item slug, and nesting mirrors the hierarchy), and read the `index.md` of any whose slug is plausibly related. Match on the *defect*, not on wording — two items describing the same wrong behavior are duplicates even when their titles share no words.

For each approved finding, one of three outcomes:

- **Already tracked, nothing new to say.** Do not create. Report the existing item's ID and title, and move on.
- **Already tracked, but this review adds something** — a sharper failure scenario, new `file:line` evidence, a solution option the item lacks, a severity that should change, or acceptance criteria that were never written. Do not create a second item. **Offer to update the existing one:** show exactly what you would add and to which field, and ask. On approval, apply it with `edit_item` (rex MCP), extending the existing content rather than overwriting it. If the user declines, leave the item untouched.
- **Not tracked.** It is genuinely new — create it in Step 7.

If you find that the PRD already holds two or more items for the same defect, say so and mention `merge_items` (rex MCP) as the remedy — but do not merge anything on your own initiative.

## Step 7 — Create only what is new and approved

For each finding that survived Step 6 as genuinely new, create one PRD item with `add_item` (rex MCP) — one item per finding, never bundled. Fill its parameters as follows; the mapping is deliberate, because content written into the wrong field is content the rest of the toolchain cannot see:

| Parameter | What goes in it |
|-----------|-----------------|
| `title` | The defect, not the activity — "`record` attributes tokens twice when two runs share a session", not "improve record". |
| `level` | **v1 tree:** `task`. Use `feature` only when the finding genuinely needs several tasks under it, and then create those tasks too. This parameter is required — do not leave it to chance, or repeated reviews will file the same class of finding at different levels. |
| `type` | **v2 tree:** `task` under the open change that owns the changed code, or `change` when no open change owns it or the finding needs several tasks (then create those tasks under it too). Pass `type`, never `level`: `add_item` refuses `level` on v2. |
| `parentId` | **v1 tree:** the feature or epic that owns the changed code, for must-fix and should-fix. Out-of-scope findings go under the area they actually belong to, never under the change that revealed them. Confirm the parent with `get_item`, and ask when the right one is ambiguous. |
| `parentId` | **v2 tree:** the change, for a `task`; confirm it with `get_item`. A `change` takes none: it lands in the Inbox with `needsPlacement` unless you pass `touches` (capability or constraint ids from `get_product`). For an Inbox change, show the user the shortlist from `place_change` (no `target`) and record the placement they pick. Out-of-scope findings are their own change, never a task under the change that revealed them. |
| `description` | The failure scenario from Pass 1 (inputs or state → wrong result), the `file:line` evidence, the reachability answer from Pass 2, and the solution options from Step 5 with their costs, risks, and your recommendation — so whoever picks the item up inherits the analysis instead of redoing it. |
| `priority` | The severity, directly. The enum is `critical`, `high`, `medium`, `low` — the same four words as the severity scale in Step 3, so map it one-to-one. Do not write the severity into prose and leave `priority` unset. |
| `acceptanceCriteria` | The array, one criterion per entry, each written so it fails today and passes once fixed. Include the test that does not exist yet. Put them here and not in `description`: `verify_criteria` (rex MCP) and the dashboard's requirements view read this field, so criteria buried in prose cannot be checked by the next review — which is exactly how a claim becomes unverifiable. |
| `tags` | `ndx-adversarial-review`, plus `severity:<level>` so findings stay filterable by how bad they are. |
| `source` | `ndx-adversarial-review`, so the provenance of the item survives longer than this conversation. |

Carry the verdict from Step 4 into the description alongside the severity. `priority` records how bad the defect is; only the description can record that you judged it worth fixing, and why.

In claim mode, if the review disproved a completion claim, also call `update_task_status` (rex MCP) to move the item off `completed`, and `append_log` with what was disproved and why.

Then close out the run:

1. **Commit.** `add_item`, `edit_item`, `place_change` and `update_task_status` write to `.rex/prd_tree/<slug>/index.md` on a v1 tree, and to the `index.md` and `state.yaml` files under `.rex/changes/` and `.rex/product/` on a v2 tree, even though you edited no file directly, so there are changes to commit. Run `git -c core.quotepath=false status --porcelain --untracked-files=all -- .rex/prd_tree/ .rex/changes/ .rex/product/`. The paths to commit are the ones that are not on the list you kept in Step 1. If there are none, print "Working tree clean — nothing to commit." and stop. Otherwise stage only what the review wrote, naming each path: `git add -- <path> <path> …`. Never `git add -A` or `git add .`: in diff mode the dirty working tree is the very thing under review, and staging everything would sweep the user's in-progress work into a commit attributed to the review. A path still on the list stays out of this commit even if the review changed it — the user declined to commit or stash it before the write — so name it in your summary as part of the change this commit leaves out. Commit with the n-dx authorship + model audit trailer block. Build the message with your file-writing tool, never with shell quoting: heredocs and `$(...)` are POSIX-only and fail in PowerShell/cmd.exe (Git Bash is not part of Windows), and repeated `-m` flags insert blank lines that split the trailer block so git stops parsing it. Write exactly this message to `.ndx-commit-msg.txt` at the project root — never under `.git/`, which is a file, not a directory, in a linked worktree:

   ```
   ndx-adversarial-review: capture <n> findings from <target>

   N-DX: skill/ndx-adversarial-review
   Co-Authored-By: En Dash's n-dx <n-dx@endash.us>
   ```

   Then run `git commit -F .ndx-commit-msg.txt -- <the same paths>` and delete `.ndx-commit-msg.txt`. Name the paths on the commit as well: without them `git commit` takes everything in the index, including anything the user had already staged.

   Substitute `<n>` with the number of items created and `<target>` with what was reviewed. Keep the `N-DX:` and `Co-Authored-By:` trailer lines exactly as shown — they form the audit trail used by downstream tooling.
2. **Record.** Run `ndx hench record --task=skill:ndx-adversarial-review --status=completed --title="Adversarial review: <target>" --summary="<n findings, m captured>" .`. The `skill:` form puts the cost in the orphans bucket of `get_token_usage`, which is right for a review that produced several items rather than advancing one. The record measures from the mark taken in Step 1; without that mark it falls back to the session's previous record and says so.
3. **Summarize.** Account for every finding: created as a new item, added to an item that already tracked it, skipped because the PRD already said everything, declined by the user, or dropped as not-worth-fixing. A finding that vanishes without one of those labels is a review that hid its own result.

> **Fixing is a separate run.** This skill stops at a captured item. Hand the item to `/ndx-work` or `ndx work` so the fix goes through the project's execution discipline and earns its own tests, commit, and record.

## Done when

Every finding is accounted for and, where the user approved capture, the items
exist, are committed, and the run is recorded. A review that captures nothing
because the user declined — or because Pass 1 found nothing — is equally
complete.

This skill does not fix anything. It edits no source file, and writes no PRD
item the user did not explicitly select. Hand a captured item to `/ndx-work` or
`ndx work`; fixing is a separate run.
