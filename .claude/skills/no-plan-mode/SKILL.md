---
name: no-plan-mode
description: Prevent plan-mode stalls in autonomous hench agent runs
---

## Rule: No Plan Mode in Execution Tasks

When working on an execution task (especially within a hench agent run), you MUST NOT:

1. **Enter plan mode** — Do not call `EnterPlanMode` or produce plan-only responses. Hench runs expect direct implementation.
2. **Call ExitPlanMode as a stall tactic** — Do not use `ExitPlanMode` as a way to pause execution waiting for user input.
3. **Produce plan-only outputs** — Do not respond with plans, design documents, or implementation outlines instead of actual code changes.

## Rationale

Hench agent runs are designed to be autonomous and continuous. When an agent enters plan mode or stalls on `ExitPlanMode`, the entire run blocks waiting for user approval, breaking the autonomous execution loop. This defeats the purpose of automated task execution.

## What to Do Instead

**If you need to make a decision:**
- Make the decision based on existing code patterns, architecture guidelines (CLAUDE.md), and project conventions.
- Document your choice in the commit message or task log via `append_log`.

**If you're uncertain about the approach:**
- Read the relevant architecture documentation in CLAUDE.md or PACKAGE_GUIDELINES.md.
- Search the codebase for similar patterns using `Grep` or `Glob`.
- Use `get_zone` or `get_file_info` (sourcevision MCP) to understand context.
- Proceed with the most consistent approach — don't stall.

**If the task is genuinely ambiguous:**
- Complete what you can with the information available.
- Use `append_log` to document the ambiguity and what you chose.
- Mark the task as `in_progress` or `completed` (depending on progress) and move to the next task.
- The next session can refine the work based on the log.

## Applicability

This rule applies to:
- All hench agent runs (`ndx work --auto`, `ndx work --loop`, `ndx self-heal`, etc.)
- All execution-oriented tasks where implementation is expected
- Any scenario where the agent is driving changes without pausing for approval

This rule does NOT apply to:
- Interactive user-initiated CLI commands where the user is present
- Design-phase tasks explicitly marked as planning-only
- Codex or other assistants working in non-autonomous modes

## Done when

There is no run to finish: this skill is a standing rule, not a procedure. It is
satisfied by the agent not entering plan mode in the contexts listed above. It
produces no output, writes no file, and requires no record — if you invoked it
expecting an action, none is needed.
