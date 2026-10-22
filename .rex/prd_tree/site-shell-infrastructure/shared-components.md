---
id: "7fd31069-6377-4976-82c2-658d29c11510"
level: "feature"
title: "Shared Components"
status: "completed"
priority: "critical"
tags:
  - "components"
startedAt: "2026-03-30T01:51:53.276Z"
completedAt: "2026-03-30T01:51:53.276Z"
resolutionType: "code-change"
resolutionDetail: "Source viewer (Shiki highlighting, line numbers, copy, collapse), performance meter (live timing), demo container styles, slider (range + live label), toggle (switch + ARIA). All in src/components/."
acceptanceCriteria:
  - "Source viewer renders highlighted TypeScript with line numbers and copy button"
  - "Performance meter shows live sub-millisecond timings"
  - "Demo container provides consistent layout for all demo pages"
  - "Slider and toggle components functional with ARIA labels"
description: "Reusable components used across demo pages: Source Viewer (Shiki-highlighted TypeScript, line numbers, copy button, annotation highlights, collapsible on mobile), Performance Meter (real-time performance.now() display for prepare/layout/DOM timings), Demo Container (wrapper: demo area + explanation + source viewer), Slider (range input with live value label), Toggle (on/off switch with label)."
---
