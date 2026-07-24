---
name: Offline POS interaction rule
description: Durable expectations for local-first POS and PWA interactions.
---

Local-first POS features should give immediate visible feedback, persist their result after reload, and provide a manual fallback when browser device APIs are unavailable. Barcode scanning should support both camera detection and typed barcode lookup; receipts should be discoverable both immediately after checkout and from the sales history.

**Why:** Browser camera and barcode APIs are not consistently available in preview, desktop browsers, or installed PWAs, so a camera-only path makes a core checkout feature appear broken.

**How to apply:** For future offline retail workflows, pair every device-dependent control with an explicit fallback, test that state changes update the visible UI, and keep receipt access attached to both the completion flow and transaction history.