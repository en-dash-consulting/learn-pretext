---
name: ndx-work
description: Pick up a task from the PRD and begin working on it
argument-hint: "[task-id]"
---

Pick up a task from the PRD and begin working on it.

**Find the PRD layout first:** call `get_prd_status` (rex MCP). A v2 tree answers with `"layout": "v2"` and keeps the PRD in `.rex/product/` (areas, capabilities and constraints: the standing requirements) and `.rex/changes/` (changes with their tasks and subtasks: the work, which closes), each folder's tool state in a `state.yaml` beside its Markdown. A v1 tree answers with no `layout` field and keeps the PRD in `.rex/prd_tree/` (epics, features, tasks and subtasks). A step that differs by layout gives each its own line, labelled in bold; every other step applies to both.

1. Read `.rex/workflow.md` for the project's execution workflow. Follow its instructions — they define the expected discipline for task execution (TDD, validation, commit conventions, etc.)
2. If task-id provided, call `get_item` (rex MCP). Otherwise call `get_next_task` (rex MCP):
   - **v1 tree:** it returns the next task under its epic and feature
   - **v2 tree:** it returns a placed change or one of its tasks, with `item.type`; work that item. An Inbox change is not selected until it is placed (`/ndx-reshape` or `place_change`)
3. Call `claim_task` (rex MCP) with the task id. This holds it for this worktree so another worktree's agent skips it while you plan. If it reports the task is claimed elsewhere, pick a different task. Outside a git repository it is a no-op
4. Read task details: title, description, acceptance criteria, parent chain
5. For files mentioned in the task, use `get_file_info` and `get_imports` (sourcevision MCP) to understand current state
6. Use `get_zone` (sourcevision MCP) for the relevant architectural zone
7. Present a work plan: what needs to change, which files, what tests
8. After user approves the plan, run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root and keep its output: every path it lists is the user's work in progress, and step 13 leaves it out of the commit. Then check for overlap: if any path on that list is a file the approved plan will change, or is under `.rex/prd_tree/`, `.rex/changes/` or `.rex/product/` (the status and log writes below rewrite the task's `index.md` and its ancestors' on a v1 tree, and the `state.yaml` files beside the change and its tasks on a v2 tree, where completing a change can also update `.rex/product/`), name those paths and ask the user to commit or stash them before you write anything. Otherwise the task's commit would hold only part of its change while the task reads completed. Once they have, run `git -c core.quotepath=false status --porcelain --untracked-files=all` again and keep that output as the list instead; if they decline, carry on, and those paths stay out of the commit. Then call `update_task_status` (rex MCP) to mark as `in_progress`, then mark where this task's token usage starts: run `ndx hench usage mark --task=<id> .`. The CLI snapshots the session transcript's cumulative usage and position under the task id; step 13's record computes the task's spend as the difference between that snapshot and the transcript then — arithmetic done by code, not a timestamp typed by hand. If the command reports no session or transcript, continue; the record will say it fell back
9. Implement the changes following the workflow discipline
10. Run validation and tests as specified in the workflow
11. Call `append_log` (rex MCP) with what was done, decisions made, and issues encountered. If the rex MCP server is not connected, run `ndx log <event> --detail="..."` instead (rex CLI, no MCP required)
12. When done, use `update_task_status` (rex MCP) to mark as `completed`
13. **Commit.** Run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root — this catches the MCP side-effect writes that `update_task_status` and `append_log` make (under `.rex/prd_tree/` on a v1 tree; under `.rex/changes/` and `.rex/product/`, `state.yaml` files included, on a v2 tree), as well as the files you edited. The paths to commit are the ones that are not on the list you kept in step 8. Drop any of them you did not mean to change, such as output a build or test run left behind. If none remain, print "Working tree clean — nothing to commit." and stop. Otherwise stage exactly those paths, naming each one: `git add -- <path> <path> …`, and commit the task's work together with its PRD status write, so the two land atomically. Never `git add -A` or `git add .`: an assisted run is long and happens in the user's working tree, so the paths already on the list are their work in progress, and staging them would attribute it to this task. A path still on the list stays out of this commit even if the task changed it — the user declined to commit or stash it before the write — so name it in your summary as part of the change this commit leaves out. Build the message with your file-writing tool, never with shell quoting: heredocs and `$(...)` are POSIX-only and fail in PowerShell/cmd.exe (Git Bash is not part of Windows), and repeated `-m` flags insert blank lines that split the trailer block so git stops parsing it. Write exactly this message to `.ndx-commit-msg.txt` at the project root — never under `.git/`, which is a file, not a directory, in a linked worktree:

    ```
    <subject>

    N-DX: skill/ndx-work
    N-DX-Item: <id>
    Co-Authored-By: En Dash's n-dx <n-dx@endash.us>
    ```

    Then run `git commit -F .ndx-commit-msg.txt -- <the same paths>` and delete `.ndx-commit-msg.txt`. Name the paths on the commit as well: without them `git commit` takes everything in the index, including anything the user had already staged.

    Write `<subject>` in whatever commit convention the project's workflow asks for — unlike every other skill, this commit is the task's own work, so it is not prefixed `ndx-work:`. Substitute `<id>` with the task id from step 2, bare and never a dashboard URL: `N-DX-Item` is the only thing that ties this commit to the task it implements, and readers (`rex`'s realized-by edge) parse the trailer, never the subject. Keep all three trailer lines exactly as shown.
14. Record the work in hench run history so it is auditable alongside `ndx work` runs, together with what it cost: run `ndx hench record --task=<id> --status=completed --title="<task title>" --summary="<one-line summary>" .`. Token usage is computed by the CLI as the difference between the mark from step 8 and the session transcript now, per token class, and attributed to the task — several tasks in one session each get exactly their own slice. The run's start time is taken from the mark, so there is no timestamp to pass. Use `--status=cancelled` (or `failed`) instead if the task was not completed, and `--no-tokens` to record without usage.

> **Assisted run, not a hench run.** This skill drives the task directly through Claude Code, so — unlike `ndx work` — it does not spawn the hench agent: nothing else commits the work, which is why step 13 is this skill's own commit rather than a double-commit of hench's. The record written in step 14 is marked `assisted` to keep it distinguishable from an agent run, and its token usage is read from the session transcript that Claude Code writes (located via `CLAUDE_CODE_SESSION_ID`), so `ndx usage` and the dashboard's per-item rollup include this work. If no transcript can be found the record is still written with zero usage — an unrecorded run is worse than one missing its tokens — and the command says which happened.

## Done when

`ndx hench record` has written the run record for **one** task. Stop there. Do
not pick up the next task, and do not start follow-up work the task revealed —
capture it as a PRD item instead and let it be selected on its own merits.

If the task could not be completed, the run still ends here: record it with
`--status=cancelled` or `failed` rather than leaving no record.
