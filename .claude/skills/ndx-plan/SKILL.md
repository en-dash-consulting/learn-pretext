---
name: ndx-plan
description: Analyze the codebase and propose PRD updates
---

Analyze the codebase and propose PRD updates.

**Before anything else, mark where this run's token usage starts:** run `ndx hench usage mark --task=skill:ndx-plan .`. The CLI snapshots the session transcript's cumulative usage and position under that id; the record step at the end computes this run's spend as the difference between that snapshot and the transcript then — arithmetic done by code, not a timestamp typed by hand. If the command reports no session or transcript, continue; the record will say it fell back.

**Then note what is already dirty:** run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root and keep its output. Every path it lists is the user's work in progress, and the commit step at the end stages only paths that are not on this list.

**Find the PRD layout first:** call `get_prd_status` (rex MCP). A v2 tree answers with `"layout": "v2"` and keeps the PRD in `.rex/product/` (areas, capabilities and constraints: the standing requirements) and `.rex/changes/` (changes with their tasks and subtasks: the work, which closes), each folder's tool state in a `state.yaml` beside its Markdown. A v1 tree answers with no `layout` field and keeps the PRD in `.rex/prd_tree/` (epics, features, tasks and subtasks). A step that differs by layout gives each its own line, labelled in bold; every other step applies to both.

1. Call `get_overview` (sourcevision MCP) to understand current project state
2. Call `get_findings` (sourcevision MCP) to identify anti-patterns and suggestions
3. Read the existing PRD items from the `get_prd_status` answer, to avoid duplicates. **v2 tree:** also call `get_product` (rex MCP) for the areas, capabilities and constraints a change can touch or amend
4. Call `get_next_steps` (sourcevision MCP) for prioritized recommendations
5. Based on findings, existing gaps, and any user-described goals, propose new items:
   - **v1 tree:** epics, features and tasks
   - **v2 tree:** changes, each with the tasks it needs, and the capability or constraint each change touches or amends. Never an epic or a feature: a v2 tree has none, and a standing requirement belongs on the product layer, not in a change
6. Present proposals to the user for review
7. **Check for overlap first:** if any path on the list you kept at the start is under `.rex/prd_tree/`, `.rex/changes/` or `.rex/product/` (a `state.yaml` included), name those paths and ask the user to commit or stash them before you write — `add_item` rewrites the parent's and ancestors' `index.md` (their Children tables) on a v1 tree, and the parent's folder and its `state.yaml` on a v2 tree, so a dirty one would keep part of this change out of the commit. Once they have, run `git -c core.quotepath=false status --porcelain --untracked-files=all` again and keep that output as the list instead; if they decline, carry on, and those paths stay out of the commit. Then, for each approved proposal, use `add_item` (rex MCP) to create it. Fill the parameters explicitly — content written into the wrong field is content the rest of the toolchain cannot see:
   - `title` — what the work is, specific enough to be recognized later
   - **v1 tree:** `level` — `epic`, `feature`, or `task`, matching where the proposal sits in the tree you are building. Required, with no default: leave it unstated and repeated planning runs file the same kind of proposal at different levels
   - **v2 tree:** `type` — `change`, or `task` under a change; never pass `level`, which `add_item` refuses on v2. Create each change before its tasks, so they have its id
   - **v1 tree:** `parentId` — the epic or feature this belongs under. Never leave a proposal at root level
   - **v2 tree:** `parentId` — the change, for a task. A change takes none; pass `touches` (capability or constraint ids from `get_product`) so it is placed on creation. A change with neither `touches` nor `amends` lands in the Inbox with `needsPlacement`: show the user its shortlist from `place_change` (no `target`) and record the placement they pick
   - `description` — the rationale, including the finding or gap that motivated it
   - `acceptanceCriteria` — the array, one criterion per entry. Put them here rather than in `description`: `verify_criteria` (rex MCP) and the dashboard's requirements view read this field, so criteria written as prose can never be mapped to tests or checked later
   - `priority` — `critical`, `high`, `medium`, or `low`, inferred from the finding's severity and what it blocks
   - `source` — `ndx-plan`, so it stays clear which analysis produced the item
8. Show the updated PRD tree via `get_prd_status`
9. **Commit**: run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root — this picks up every MCP write under `.rex/prd_tree/` on a v1 tree, or `.rex/changes/` on a v2 tree (each `add_item` call produces a new `<slug>/index.md`, and on v2 a `state.yaml` row). The paths to commit are the ones that are not on the list you kept at the start. If there are none, print "Working tree clean — nothing to commit." and stop. Otherwise stage exactly those paths, naming each one: `git add -- <path> <path> …`. Never `git add -A` or `git add .`: the paths already on the list are the user's work in progress, and staging them would attribute it to this skill. A path still on the list stays out of this commit even if this skill changed it — the user declined to commit or stash it before the write — so name it in your summary as part of the change this commit leaves out. Then commit with the n-dx authorship + model audit trailer block. Build the message with your file-writing tool, never with shell quoting: heredocs and `$(...)` are POSIX-only and fail in PowerShell/cmd.exe (Git Bash is not part of Windows), and repeated `-m` flags insert blank lines that split the trailer block so git stops parsing it. Write exactly this message to `.ndx-commit-msg.txt` at the project root — never under `.git/`, which is a file, not a directory, in a linked worktree:

   ```
   ndx-plan: add <N> proposed PRD items

   N-DX: skill/ndx-plan
   Co-Authored-By: En Dash's n-dx <n-dx@endash.us>
   ```

   Then run `git commit -F .ndx-commit-msg.txt -- <the same paths>` and delete `.ndx-commit-msg.txt`. Name the paths on the commit as well: without them `git commit` takes everything in the index, including anything the user had already staged.

   Replace `<N>` with the count of items created. Keep the `N-DX:` and `Co-Authored-By:` trailer lines exactly as shown — they form the audit trail used by downstream tooling.

## Record the run and its token cost

After committing, record this run so both the work and the tokens it spent are auditable alongside `ndx work` runs:

```sh
ndx hench record --task=skill:ndx-plan --status=completed   --title="ndx-plan: accepted <N> proposals"   --summary="<one-line summary>" .
```

Token usage is computed by the CLI as the difference between the `skill:ndx-plan` mark taken at the start and the session transcript now — several skill runs in one session each get exactly their own slice. Use `--task=skill:ndx-plan`. Planning produces many items, so charging one of them for work that created all of them would misattribute it; `get_token_usage` surfaces ids that match no item in its `orphans` bucket, which is the honest place for planning overhead.

Skip this only if you changed nothing at all. If no transcript is found the record is still written with zero usage; the command reports which happened.

## Done when

The accepted proposals are in the PRD, committed, and the run is recorded.
Planning ends at proposals accepted — do not begin implementing any of them, and
do not keep re-analysing to find more. If the analysis surfaced nothing worth
accepting, say so and stop; a plan run that accepts nothing is a complete run,
not a failed one.
