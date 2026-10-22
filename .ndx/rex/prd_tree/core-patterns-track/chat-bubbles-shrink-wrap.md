---
id: "fbea8d75-c077-41cb-80a9-8b3c49e1fd7b"
level: "feature"
title: "Chat Bubbles — Shrink-Wrap"
status: "completed"
priority: "high"
tags:
  - "page"
  - "core-patterns"
  - "demo"
startedAt: "2026-03-30T01:52:17.898Z"
completedAt: "2026-03-30T01:52:17.898Z"
resolutionType: "code-change"
resolutionDetail: "20+ chat messages, walkLineRanges shrink-wrap, CSS fit-content comparison, pixel savings, message input. src/pages/bubbles.ts"
acceptanceCriteria:
  - "≥20 messages displayed in chat UI"
  - "User can type and send new messages"
  - "Bubbles shrink-wrapped via walkLineRanges"
  - "CSS fit-content vs pretext comparison visible"
  - "Pixel savings shown per bubble"
description: "API focus: walkLineRanges(). Chat UI with ≥20 pre-populated messages. User can type and send new messages. Each bubble width = tightest shrink-wrap via walkLineRanges(). Side-by-side comparison: CSS fit-content vs pretext optimal width. Pixel savings displayed per bubble. Annotated source."
---
