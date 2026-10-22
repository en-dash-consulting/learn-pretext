---
id: "ad332b2b-3c64-4d32-85d7-72d81c567cfd"
level: "feature"
title: "Why Pretext — The Problem"
status: "completed"
priority: "critical"
tags:
  - "page"
  - "foundations"
startedAt: "2026-03-30T01:52:08.497Z"
completedAt: "2026-03-30T01:52:08.497Z"
resolutionType: "code-change"
resolutionDetail: "200-text layout thrashing comparison (DOM interleaved vs pretext), toggle, perf meter, \"What CSS Can't Do\" section. src/pages/why-pretext.ts"
acceptanceCriteria:
  - "Animated timeline visualizes layout thrash"
  - "100+ text blocks toggle between DOM and pretext measurement"
  - "Frame timing difference is visible and measurable"
  - "What CSS can't do section lists at least 4 impossible layouts"
description: "Explains layout thrashing with animated visual timeline. Interactive comparison: 100+ text blocks measured via DOM (interleaved reads/writes) vs pretext. Toggle between approaches — feel the frame drops vs smooth 60fps. Side-by-side ms/frame display. \"What CSS can't do\" section listing impossible layouts: obstacle avoidance, true shrink-wrap, virtualization, balanced text."
---
