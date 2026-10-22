---
id: "ae92b1d7-9b74-4671-a3cb-8c568e4699a3"
level: "feature"
title: "i18n Deep Dive"
status: "completed"
priority: "high"
tags:
  - "page"
  - "advanced"
  - "demo"
  - "i18n"
startedAt: "2026-03-30T01:52:42.086Z"
completedAt: "2026-03-30T01:52:42.086Z"
resolutionType: "code-change"
resolutionDetail: "7 languages (EN, ZH, JA, AR, TH, HI, emoji), setLocale per language, segment display, layout per line, custom text input, width slider. src/pages/i18n.ts"
acceptanceCriteria:
  - "Language selector with ≥8 options"
  - "CJK kinsoku rules visually highlighted"
  - "RTL/bidi text renders correctly"
  - "Emoji ZWJ sequences handled"
  - "User can paste custom text in any language"
description: "API focus: setLocale(), segmentation across scripts. Language selector: English, Chinese, Japanese, Arabic, Thai, Hindi, Myanmar, emoji. CJK kinsoku rules visualized (prohibited line-start/end characters highlighted). Bidi text: mixed LTR/RTL rendered correctly. Emoji: ZWJ sequences, width correction. User can paste any text and see how pretext segments and measures it. Annotated source."
---
