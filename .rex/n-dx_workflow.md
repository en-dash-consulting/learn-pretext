This codebase will outlive you. Every shortcut you take becomes someone else's burden.
Fight entropy. Leave the codebase better than you found it.

0. Run the project's validation command to ensure a clean state.
   Fix and commit if anything fails.
1. Call get_next_task. If no actionable task exists, report COMPLETE and exit.
2. Read the task's full context: parent chain, description, acceptance criteria.
3. If you enter Plan mode, execute your recommended steps without waiting for input.
   If the plan requires splitting the task, use add_item to create subtasks and
   proceed with the first one.
4. Implement using TDD where possible: failing test -> green -> refactor.
5. Run validation and tests.
6. Call update_task_status to mark the task complete.
7. Call append_log with what was done, decisions made, and issues encountered.
8. Commit changes.
9. If ending in plan mode, use add_item to break down remaining work with enough
   detail that the next session won't need to re-plan. Then exit.
10. Exit after one task. One task per execution, no exceptions.

PROHIBITED CHANGES (mark the task as failing instead):
- Adding lint-disable comments, eslint-ignore, @ts-ignore, or similar suppressions.
  These hide problems instead of fixing them.
- Adding empty catch blocks or swallowing errors to silence warnings.
- Wrapping code in try/catch solely to prevent a linter or type error from surfacing.
- Any change whose only effect is to suppress a diagnostic without addressing
  the underlying issue.

If you cannot make a real fix, mark the task as failing with a clear explanation
of what blocked you. Do not commit superficial changes.
