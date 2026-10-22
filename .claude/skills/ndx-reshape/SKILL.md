---
name: ndx-reshape
description: Restructure the PRD — regroup, reparent, merge overlaps and place changes
---

Restructure the PRD hierarchy to keep it organized as a coherent product spec.

Use this when the PRD has grown organically and needs cleanup: too many top-level epics, features that should be tasks, overlapping areas that should be merged, or items that belong under different parents — or, on a v2 tree, changes left in the Inbox, placed on the wrong capability, or duplicated.

**Before anything else, mark where this run's token usage starts:** run `ndx hench usage mark --task=skill:ndx-reshape .`. The CLI snapshots the session transcript's cumulative usage and position under that id; the record step at the end computes this run's spend as the difference between that snapshot and the transcript then — arithmetic done by code, not a timestamp typed by hand. If the command reports no session or transcript, continue; the record will say it fell back.

**Then note what is already dirty:** run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root and keep its output. Every path it lists is the user's work in progress, and the commit step at the end stages only paths that are not on this list.

**Find the PRD layout first:** call `get_prd_status` (rex MCP). A v2 tree answers with `"layout": "v2"` and keeps the PRD in `.rex/product/` (areas, capabilities and constraints: the standing requirements) and `.rex/changes/` (changes with their tasks and subtasks: the work, which closes), each folder's tool state in a `state.yaml` beside its Markdown. A v1 tree answers with no `layout` field and keeps the PRD in `.rex/prd_tree/` (epics, features, tasks and subtasks). A step that differs by layout gives each its own line, labelled in bold; every other step applies to both.

## Process

1. Read the full structure and item counts from the `get_prd_status` answer:
   - **v1 tree:** the epic/feature structure
   - **v2 tree:** the changes, the Inbox count and product status per area; call `get_product` (rex MCP) for the capabilities and constraints changes are placed on
2. Analyze the current structure for problems:
   - **v1 tree:** **too many epics** (related epics that should be features under a broader epic); **wrong levels** (epics with no children that are really tasks, features that are really subtasks); **overlapping areas** (multiple epics/features covering the same domain); **orphaned items** (tasks at root level that belong under an existing epic); **naming inconsistency** (similar items with different naming conventions)
   - **v2 tree:** **unplaced changes** (changes in the Inbox, or changes placed on the wrong capability); **duplicate changes** (sibling changes doing the same work); **scattered work** (changes that belong under one larger change, or tasks under the wrong change); **naming inconsistency**. A node's type is fixed, so there are no level problems to fix
3. Propose a target structure to the user:
   - **v1 tree:** group related epics into ~7-12 top-level epics max (one per product area); each epic should have 3-15 features and each feature 2-10 tasks; suggest new parent epics to group scattered items, level changes (epic->feature, feature->task, etc.) and merges for overlapping items
   - **v2 tree:** a placement for each unplaced or misplaced change (take the shortlist from `place_change` with no `target`), merges for duplicate changes, and moves that group related changes or tasks. Propose no epics or features; a node whose type looks wrong is reported to the user, not converted
4. After user approval, check for overlap first: if any path on the list you kept at the start is under `.rex/prd_tree/`, `.rex/changes/` or `.rex/product/` (a `state.yaml` included), name those paths and ask the user to commit or stash them before you write — every `move_item`, `merge_items`, `edit_item`, `add_item` and `place_change` call rewrites the parent's and ancestors' `index.md` (their Children tables) on a v1 tree, and the folders and `state.yaml` files it touches on a v2 tree, so a dirty one would keep part of this change out of the commit. Once they have, run `git -c core.quotepath=false status --porcelain --untracked-files=all` again and keep that output as the list instead; if they decline, carry on, and those paths stay out of the commit. Then execute the restructuring:
   - **v1 tree:** create new parent epics/features with `add_item` (rex MCP). Set `level` explicitly (`epic` or `feature` — it is required and has no default) and `parentId` for anything that is not a new top-level epic, so a new container never lands at root by accident. A container usually needs no acceptance criteria; when one does have a testable outcome of its own, put them in the `acceptanceCriteria` array rather than in `description`, since that is the field `verify_criteria` and the dashboard's requirements view read
   - **v1 tree:** reparent items with `move_item` (rex MCP), change levels with `edit_item` (rex MCP) using the `level` field, and merge overlapping items with `merge_items` (rex MCP)
   - **v2 tree:** place changes with `place_change` (rex MCP, `id`, `target`, `relation`; an `amends` placement also needs `proposed` text or a `criteria` delta). Reparent with `move_item`: a change goes at the root or under a change, a task under a change. Merge duplicate sibling changes with `merge_items`. A new grouping change is created with `add_item` passing `type` `change`, never `level`, with any `acceptanceCriteria` in that array. The type is fixed: never ask `edit_item` for a level change, which it refuses on v2
   - Rename items for consistency with `edit_item` (rex MCP)
5. Run `reorganize` (rex MCP) with mode `fast` to verify no structural issues remain
6. Show the updated structure via `get_prd_status`
7. **Commit**: run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root — this catches every MCP-driven write under `.rex/prd_tree/` on a v1 tree, or `.rex/changes/` on a v2 tree (`move_item`, `merge_items`, `edit_item`, `add_item`, `place_change` and `reorganize` all mutate the folder tree). The paths to commit are the ones that are not on the list you kept at the start. If there are none, print "Working tree clean — nothing to commit." and stop. Otherwise stage exactly those paths, naming each one: `git add -- <path> <path> …`. Never `git add -A` or `git add .`: the paths already on the list are the user's work in progress, and staging them would attribute it to this skill. A path still on the list stays out of this commit even if this skill changed it — the user declined to commit or stash it before the write — so name it in your summary as part of the change this commit leaves out. Then commit with the n-dx authorship + model audit trailer block. Build the message with your file-writing tool, never with shell quoting: heredocs and `$(...)` are POSIX-only and fail in PowerShell/cmd.exe (Git Bash is not part of Windows), and repeated `-m` flags insert blank lines that split the trailer block so git stops parsing it. Write exactly this message to `.ndx-commit-msg.txt` at the project root — never under `.git/`, which is a file, not a directory, in a linked worktree:

   ```
   ndx-reshape: restructure PRD hierarchy

   N-DX: skill/ndx-reshape
   Co-Authored-By: En Dash's n-dx <n-dx@endash.us>
   ```

   Then run `git commit -F .ndx-commit-msg.txt -- <the same paths>` and delete `.ndx-commit-msg.txt`. Name the paths on the commit as well: without them `git commit` takes everything in the index, including anything the user had already staged.

   Keep the `N-DX:` and `Co-Authored-By:` trailer lines exactly as shown — they form the audit trail used by downstream tooling.

## Guidelines

- **Batch by area**: restructure one domain at a time, confirm with the user, then move on
- **Preserve meaning**: when changing levels or merging, keep the original intent clear in descriptions
- **Natural groupings**: organize by product area (e.g., SourceVision, Rex, Hench, Web, CLI, Infrastructure) rather than by work type (bugfixes, features, refactors)
- **Living spec**: the PRD should read as a product spec, not a task backlog. Epic titles should describe product capabilities, not work items
- **Level cascade** (v1 tree): when demoting an epic to a feature, its children may need to move down too (features->tasks, tasks->subtasks)
- **Changes close** (v2 tree): reshape the open work; a closed change is history and stays where it is

## MCP Tools Used

- `get_prd_status` — read current structure
- `get_product` — read the product layer (v2 tree)
- `add_item` — create new parent containers (v1 tree) or grouping changes (v2 tree)
- `move_item` — reparent items under new parents
- `place_change` — suggest and record where a change sits on the product layer (v2 tree)
- `edit_item` — rename, update descriptions; change level on a v1 tree only
- `merge_items` — consolidate overlapping items
- `reorganize` — verify structural health after changes

## Record the run and its token cost

After committing, record this run so both the work and the tokens it spent are auditable alongside `ndx work` runs:

```sh
ndx hench record --task=skill:ndx-reshape --status=completed   --title="ndx-reshape: <what was restructured>"   --summary="<one-line summary>" .
```

Token usage is computed by the CLI as the difference between the `skill:ndx-reshape` mark taken at the start and the session transcript now — several skill runs in one session each get exactly their own slice. Use `--task=skill:ndx-reshape`. Restructuring spans many items, so it is recorded against a synthetic id that `get_token_usage` reports in its `orphans` bucket rather than charging a single item.

Skip this only if you changed nothing at all. If no transcript is found the record is still written with zero usage; the command reports which happened.

## Done when

The approved restructuring is applied, committed, and recorded. Reshaping moves
and regroups items; it does not implement them, does not change their status,
and does not capture new work discovered while reading the tree. Stop after the
structure the user approved — not the further tidying it makes visible.
