---
id: "9638b4d5-db9b-4d8a-bd5e-5bbf8aca780f"
level: "feature"
title: "Editorial Layout — Variable-Width Flow"
status: "completed"
priority: "high"
tags:
  - "page"
  - "advanced"
  - "demo"
startedAt: "2026-03-30T01:52:33.713Z"
completedAt: "2026-03-30T01:52:33.713Z"
resolutionType: "code-change"
resolutionDetail: "Two-column canvas editorial layout, 2 draggable circular obstacles, layoutNextLine with variable widths, mouse+touch drag, 60fps reflow. src/pages/editorial.ts"
acceptanceCriteria:
  - "Magazine layout with ≥2 draggable obstacles"
  - "Text reflows around obstacles at 60fps during drag"
  - "Multi-column text flow works"
  - "layoutNextLine loop shown in annotated source"
  - "This is the 'impossible in CSS' showcase"
description: "API focus: layoutNextLine() in depth. Magazine spread with ≥2 draggable obstacle elements (images/shapes). Text flows around obstacles using per-line variable widths. 60fps maintained during obstacle drag. Multi-column flow with cross-column obstacles. Annotated source showing layoutNextLine() loop with per-line width calc."
---
