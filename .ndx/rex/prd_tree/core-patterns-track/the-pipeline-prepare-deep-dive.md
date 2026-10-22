---
id: "cc1e9124-ab85-4553-b313-b10fedc29148"
level: "feature"
title: "The Pipeline — prepare() Deep Dive"
status: "completed"
priority: "high"
tags:
  - "page"
  - "core-patterns"
  - "educational"
startedAt: "2026-03-30T01:52:25.544Z"
completedAt: "2026-03-30T01:52:25.544Z"
resolutionType: "code-change"
resolutionDetail: "4-step pipeline visualization: raw text, normalized, segments by kind (color-coded), per-segment widths. Custom text input, timing display. src/pages/pipeline.ts"
acceptanceCriteria:
  - "Pipeline stages visualized step by step"
  - "Custom text input with live segmentation"
  - "8 break kinds color-coded"
  - "Cache hits/misses visualized"
  - "Per-stage timing displayed"
description: "Interactive visualization of the full prepare() pipeline: raw text → normalize → segment → merge/glue rules → measure → cache. User types custom text and sees segments highlighted by break kind (8 colors for text, space, preserved-space, tab, glue, zero-width-break, soft-hyphen, hard-break). Width cache visualization showing hits/misses. Timing breakdown per pipeline stage."
---
