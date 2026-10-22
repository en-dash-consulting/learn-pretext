---
name: ndx-config
description: View or change n-dx configuration with guided assistance
argument-hint: "[key] [value]"
---

View or change n-dx configuration with guided assistance.

**Before anything else, mark where this run's token usage starts:** run `ndx hench usage mark --task=skill:ndx-config .`. The CLI snapshots the session transcript's cumulative usage and position under that id; the record step at the end computes this run's spend as the difference between that snapshot and the transcript then — arithmetic done by code, not a timestamp typed by hand. If the command reports no session or transcript, continue; the record will say it fell back.

**Then note what is already dirty:** run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root and keep its output. Every path it lists is the user's work in progress, and the commit step at the end stages only paths that are not on this list.

Available configuration areas:
- LLM settings: vendor (claude/codex), model, API keys, CLI paths
- Rex settings: budget thresholds, level-of-effort params, adapter
- Hench settings: provider, model, max turns, token budget, guard policies
- Web settings: dashboard port

If no arguments: show current configuration summary
If key only: show current value and explain what it controls
If key and value: validate and set the value

**Check for overlap first:** if the config file you are about to write (`.n-dx.json`, `.rex/config.json`, `.hench/config.json`, …) is on the list you kept at the start, name it and ask the user to commit or stash it before you write, so the commit holds the whole of this change. Once they have, run `git -c core.quotepath=false status --porcelain --untracked-files=all` again and keep that output as the list instead; if they decline, carry on, and those paths stay out of the commit.

Then run the appropriate `ndx config` command to apply changes.

## Final step — commit configuration changes

After applying any configuration change, commit the modified files:

1. Run `git -c core.quotepath=false status --porcelain --untracked-files=all` against the project root. This catches every dirty path — both direct file edits to `.n-dx.json`/`.rex/config.json`/`.hench/config.json` *and* MCP side-effect writes under `.rex/prd_tree/`. The paths to commit are the ones that are not on the list you kept at the start. If there are none, print "Working tree clean — nothing to commit." and stop.
2. Stage exactly those paths, naming each one: `git add -- <path> <path> …`. Never `git add -A` or `git add .`: the paths already on the list are the user's work in progress, and staging them would attribute it to this skill. A path still on the list stays out of this commit even if this skill changed it — the user declined to commit or stash it before the write — so name it in your summary as part of the change this commit leaves out.
3. Commit with a message that names the key changed and includes the n-dx authorship + model audit trailer block. Build the message with your file-writing tool, never with shell quoting: heredocs and `$(...)` are POSIX-only and fail in PowerShell/cmd.exe (Git Bash is not part of Windows), and repeated `-m` flags insert blank lines that split the trailer block so git stops parsing it. Write exactly this message to `.ndx-commit-msg.txt` at the project root — never under `.git/`, which is a file, not a directory, in a linked worktree:

   ```
   ndx-config: update <key> configuration

   N-DX: skill/ndx-config
   Co-Authored-By: En Dash's n-dx <n-dx@endash.us>
   ```

   Then run `git commit -F .ndx-commit-msg.txt -- <the same paths>` and delete `.ndx-commit-msg.txt`. Name the paths on the commit as well: without them `git commit` takes everything in the index, including anything the user had already staged.

   Keep the `N-DX:` and `Co-Authored-By:` trailer lines exactly as shown — they form the audit trail used by downstream tooling.

## Record the run and its token cost

After committing, record this run so both the work and the tokens it spent are auditable alongside `ndx work` runs:

```sh
ndx hench record --task=skill:ndx-config --status=completed   --title="ndx-config: set <key>"   --summary="<one-line summary>" .
```

Token usage is computed by the CLI as the difference between the `skill:ndx-config` mark taken at the start and the session transcript now — several skill runs in one session each get exactly their own slice. Use `--task=skill:ndx-config`. A config change belongs to no PRD item, so it is recorded against a synthetic id that `get_token_usage` reports in its `orphans` bucket.

Skip this only if you changed nothing at all. If no transcript is found the record is still written with zero usage; the command reports which happened.

## Done when

The requested setting is written, committed, and recorded. Do not change
settings that were not asked for, and do not run the commands the new setting
affects to "verify" it — a config skill that triggers an analysis or a work run
has done something the user did not ask for. Report the new value instead.
