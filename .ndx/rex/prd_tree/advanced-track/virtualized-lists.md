---
id: "6df49f0c-6ed1-4f15-aa14-3f343951733b"
level: "feature"
title: "Virtualized Lists"
status: "completed"
priority: "high"
tags:
  - "page"
  - "advanced"
  - "demo"
startedAt: "2026-03-30T01:52:36.383Z"
completedAt: "2026-03-30T01:52:36.383Z"
resolutionType: "code-change"
resolutionDetail: "10K text items, pretext height prediction, virtual scroll with element pooling, binary search visible range, FPS counter. src/pages/virtualized.ts"
acceptanceCriteria:
  - "10K+ items in virtual scroll"
  - "Only visible items rendered (verify via DOM inspection)"
  - "Scroll height accurate without rendering all items"
  - "60fps maintained during fast scroll"
  - "FPS counter visible"
description: "API focus: prepare() + layout() for 10K+ items. 10,000+ text items with variable lengths in virtual scroll container. Only visible items + buffer rendered. Total scroll height computed via pretext without rendering all items. Scroll position accurate within 1px. FPS counter during fast scroll. Annotated source."
---
