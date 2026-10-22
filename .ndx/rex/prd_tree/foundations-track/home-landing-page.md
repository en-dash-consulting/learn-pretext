---
id: "36fe57b2-d535-42b7-9578-bfc5303229f7"
level: "feature"
title: "Home / Landing Page"
status: "completed"
priority: "critical"
tags:
  - "page"
  - "foundations"
startedAt: "2026-03-30T01:52:05.409Z"
completedAt: "2026-03-30T01:52:05.409Z"
resolutionType: "code-change"
resolutionDetail: "Landing page with hero text reflow animation, pretext vs DOM perf counter, \"Start Learning\" CTA, track quick-jump grid. src/pages/home.ts"
acceptanceCriteria:
  - "Hero text reflows live on viewport resize using pretext"
  - "Performance counter shows real timing comparison"
  - "Start Learning button navigates to Why Pretext"
  - "Track quick-links navigate correctly"
  - "Content waits for font load before displaying"
description: "Hero section with live pretext-powered text reflow animation. Tagline: \"Text layout at the speed of arithmetic\". One-paragraph description of what pretext is. Live performance counter: pretext layout() vs DOM measurement timing. \"Start Learning\" CTA → Why Pretext page. Quick-jump links to all 5 tracks for returning visitors. Font loading gate: content appears after Inter font ready."
---
