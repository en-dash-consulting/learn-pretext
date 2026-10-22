---
id: "ee448aec-553a-439f-989a-3084df394b63"
level: "feature"
title: "Rich API Overview"
status: "completed"
priority: "high"
tags:
  - "page"
  - "advanced"
  - "educational"
startedAt: "2026-03-30T01:52:30.588Z"
completedAt: "2026-03-30T01:52:30.588Z"
resolutionType: "code-change"
resolutionDetail: "3 API paths side-by-side (fast, lines, iterator), width slider, decision guide, source viewers. src/pages/rich-api.ts"
acceptanceCriteria:
  - "Decision guide explains when to use each API"
  - "Same text processed through all APIs with visible output comparison"
  - "prepareWithSegments output displayed with segments/widths/kinds"
  - "layoutWithLines vs layout difference demonstrated"
description: "Decision guide: when to use rich API vs fast path. What prepareWithSegments() returns (segments, widths, kinds, bidi levels). layoutWithLines() vs layout() — when you need line objects. layoutNextLine() — the iterator pattern for variable-width. Interactive: same text through all three APIs, showing outputs side by side."
---
