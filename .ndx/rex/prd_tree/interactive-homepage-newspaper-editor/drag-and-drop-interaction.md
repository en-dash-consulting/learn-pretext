---
id: "a1b2c3d4-1001-4000-a001-000000000004"
level: "feature"
title: "Drag-and-Drop Interaction"
status: "completed"
priority: "high"
tags:
  - "interaction"
  - "touch"
startedAt: "2026-04-01T00:00:00.000Z"
completedAt: "2026-04-01T00:00:00.000Z"
resolutionType: "code-change"
resolutionDetail: "Drag state machine with onPointerDown/Move/Up handlers in src/pages/home.ts. Mobile tap-to-select via selectedTrayIndex."
acceptanceCriteria:
  - "Desktop: drag from tray to place, drag placed to reposition, double-click to return"
  - "Mobile: tap tray to select, tap canvas to place, long-press to drag, double-tap to return"
  - "Cursor changes to grab/grabbing during interaction"
  - "Text reflows in real-time during drag at 60fps"
description: "Desktop mouse and mobile touch interaction for dragging images from tray to canvas, repositioning placed images, and returning images to tray via double-click/double-tap. State machine: idle → dragging-from-tray / dragging-placed → idle."
---
