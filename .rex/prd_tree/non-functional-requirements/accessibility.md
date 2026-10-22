---
id: "ce00ef46-dc0c-4329-9ef3-e52cfd6d624c"
level: "feature"
title: "Accessibility"
status: "completed"
priority: "high"
tags:
  - "nfr"
  - "a11y"
startedAt: "2026-03-30T01:53:06.133Z"
completedAt: "2026-03-30T01:53:06.133Z"
resolutionType: "code-change"
resolutionDetail: "Skip-to-content link, ARIA labels on toggles/sliders/nav, keyboard handlers on all custom controls, role=switch/button, aria-expanded on source viewer, no user-select:none on content."
acceptanceCriteria:
  - "All controls operable via keyboard"
  - "ARIA labels on all custom components"
  - "WCAG AA contrast ratio met"
  - "Skip-to-content link present"
  - "No user-select:none on content text"
description: "All interactive elements keyboard-accessible. ARIA labels on custom controls (sliders, toggles, nav drawer). WCAG AA color contrast throughout. Screen reader navigable (landmarks, headings hierarchy). No user-select:none or pointer-events:none on readable content. Skip-to-content link on every page."
---
