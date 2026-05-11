---
name: Page Layout Rules
description: Design system rules — new pages must clone the homepage layout structure exactly, only changing content/purpose
type: feedback
---

When building any new page in this project, preserve the EXACT homepage layout:

- sidebar position and width (fixed left, 224px)
- top navbar layout (search | coins | create | bell | profile)
- hero banner in col-span-8 (left), profile/summary card in col-span-4 (right) — same row
- card grid structure (2×2 for main content)
- right panel position (col-span-4: summary → leaderboard/related → community/details)
- mission/action section (4-column horizontal below cards)
- shop/CTA banner at bottom of left column
- overall spacing: p-5, gap-5, rounded-2xl, same glass/glass-gold classes

Only change: page content, purpose, and specific component data.

**Why:** User designed the homepage layout precisely and wants all pages to feel like "another page from the exact same app." No redesigning, no rearranging.

**How to apply:** Before writing a new page, mentally map its content onto the homepage grid — hero→page header, predictions→page's main cards, missions→page's actions, right sidebar→page's stats/related.
