---
id: "a1b2c3d4-1001-4000-a001-000000000005"
level: "feature"
title: "Entrance Animation and Performance Showcase"
status: "completed"
priority: "medium"
tags:
  - "animation"
  - "performance"
startedAt: "2026-04-01T00:00:00.000Z"
completedAt: "2026-04-01T00:00:00.000Z"
resolutionType: "code-change"
resolutionDetail: "animateEntrance() with cubic ease-out in home.ts. drawPerfOverlay() for PRESS ROOM box. Reduced motion check via matchMedia."
acceptanceCriteria:
  - "Text reveals line-by-line with ease-out animation"
  - "PRESS ROOM overlay shows live reflow timing"
  - "prefers-reduced-motion skips animation"
  - "Dateline shows live performance metrics"
description: "Staggered text reveal animation on page load (printing press feel), tray appearance, and first-visit tooltip. In-canvas 'PRESS ROOM' performance overlay showing live reflow time and line count. Respects prefers-reduced-motion."
---
