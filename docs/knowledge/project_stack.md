---
name: project-stack
description: Tech stack and design conventions used across all prototypes in this repo
metadata: 
  node_type: memory
  type: project
---

All prototypes in `E:\Projects\prototypes` use **vanilla HTML/CSS/JavaScript** — no frameworks, no build tools.

**Why:** Consistent pattern across all existing prototypes (cadmech-virtual-lab, radicals, vbtek, vendor-onboarding). Single-file or small multi-file structure, openable directly in a browser.

**How to apply:** Always default to this stack for new prototypes unless the user explicitly requests React/Vue/etc.

## Design System
- **Background**: Deep gradient — `#0f0c29 → #302b63 → #24243e`
- **Cards**: Glassmorphism — `rgba(255,255,255,0.07)` background, `backdrop-filter: blur(12-14px)`, `rgba(255,255,255,0.12)` border
- **Accent colors**: `#6C63FF` purple, `#00D4AA` teal/green, `#FF6B6B` red, `#FFD93D` yellow
- **Font**: Google Fonts — Poppins (weights 300–800)
- **Buttons**: Gradient fill, `border-radius: 50px`, hover lift via `transform: translateY(-2px)`
- **Animations**: CSS transitions, `slideIn` keyframe for panels, `spin` for loaders
- **Layout**: CSS Grid + Flexbox; responsive with media queries at 600px and 900px

## Repo
`github.com:digitalpandit11/prototypes.git` — branch `main`, git user `amol`
