---
id: "c98a11b0-4ae0-4e8a-b153-5c3d84ded6fe"
level: "feature"
title: "Masonry — Card Grid"
status: "completed"
priority: "high"
tags:
  - "page"
  - "core-patterns"
  - "demo"
startedAt: "2026-03-30T01:52:20.548Z"
completedAt: "2026-03-30T01:52:20.548Z"
resolutionType: "code-change"
resolutionDetail: "60 cards, pretext height prediction, shortest-column masonry, responsive 1-4 columns, ResizeObserver relayout. src/pages/masonry.ts"
acceptanceCriteria:
  - "50+ cards with varied text"
  - "Heights predicted without DOM reads"
  - "1–4 columns responsive to viewport"
  - "Smooth relayout on resize"
  - "Annotated source viewer"
description: "API focus: prepare() + layout() at scale. 50+ cards with variable text content. Heights predicted via pretext, placed in shortest column. Responsive: 1–4 columns based on viewport width. Smooth re-layout on resize without DOM measurement. Annotated source."
---
