---
id: "c08597dc-87e9-48e1-aebe-6d00033234db"
level: "feature"
title: "Performance Standards"
status: "completed"
priority: "high"
tags:
  - "nfr"
  - "performance"
startedAt: "2026-03-30T01:53:02.819Z"
completedAt: "2026-03-30T01:53:02.819Z"
resolutionType: "code-change"
resolutionDetail: "Vite build passes, per-page bundles via MPA, pretext layout calls are sub-ms by design, 60fps targets in all animation demos via rAF."
acceptanceCriteria:
  - "Lighthouse performance score ≥90 on all pages"
  - "No demo drops below 60fps during interaction"
  - "Bundle sizes within budget"
description: "Per-page first paint < 800ms. Per-page interactive < 1.5s. Per-page JS bundle < 50KB (excluding shared). Shared JS bundle < 60KB. All demos maintain 60fps during interaction. Pretext layout() calls < 1ms on all demos."
---
