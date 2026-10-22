---
id: "e6361419-8a0d-450e-b984-26e6ec4ae986"
level: "feature"
title: "Accordion — Height Prediction"
status: "completed"
priority: "high"
tags:
  - "page"
  - "core-patterns"
  - "demo"
startedAt: "2026-03-30T01:52:14.270Z"
completedAt: "2026-03-30T01:52:14.270Z"
resolutionType: "code-change"
resolutionDetail: "6 accordion sections, CSS max-height transitions, pretext height prediction, \"Without Pretext\" toggle with DOM measurement, editable content. src/pages/accordion.ts"
acceptanceCriteria:
  - "≥5 accordion sections with smooth height animations"
  - "Heights calculated via prepare+layout before animation"
  - "Without-pretext toggle shows jank"
  - "Source viewer with annotated API calls"
  - "Editable content recalculates heights"
description: "API focus: prepare() + layout(). Demo with ≥5 expandable sections with varied text lengths. Smooth CSS height transition (heights predicted before animation starts). \"Without pretext\" toggle showing DOM measurement with visible jank on rapid toggling. Annotated source: prepare on mount, layout for height calc. User can edit accordion content and see heights recalculate."
---
