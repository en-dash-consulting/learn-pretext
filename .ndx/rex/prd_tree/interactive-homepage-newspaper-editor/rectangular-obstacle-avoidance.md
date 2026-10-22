---
id: "a1b2c3d4-1001-4000-a001-000000000002"
level: "feature"
title: "Rectangular Obstacle Avoidance"
status: "completed"
priority: "critical"
tags:
  - "layout"
  - "interaction"
startedAt: "2026-04-01T00:00:00.000Z"
completedAt: "2026-04-01T00:00:00.000Z"
resolutionType: "code-change"
resolutionDetail: "Implemented getLineWidthAndOffset() in src/pages/home.ts with rectangle-based obstacle avoidance."
acceptanceCriteria:
  - "Text reflows around placed rectangular images"
  - "Left/right/center obstacle positions handled correctly"
  - "Padding around obstacles for visual clearance"
  - "Reflow completes in under 1ms for 60fps"
description: "Real-time text reflow around rectangular image obstacles using per-line width computation with layoutNextLine(). Adapted from editorial demo's circular chord geometry to rectangle math."
---
