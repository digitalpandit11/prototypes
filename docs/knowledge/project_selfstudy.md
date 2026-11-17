---
name: project-selfstudy
description: StudyNest Self-Study Centre Management System prototype in selfstudy/ — Vue 3 via vendored scripts (no build), roles, file structure, state
metadata:
  type: project
---

Frontend-only UI prototype (Stage 1) of a self-study centre management system, built to freeze
requirements with the client before backend work. Folder: `selfstudy/`. Full demo guide is in `selfstudy/README.md`.

**Stack exception:** the requirement document asked for Vue 3, Vue Router, Tailwind and Lucide. To keep the repo's
"opens as a plain file" rule, those libraries are **vendored in `selfstudy/lib/`** and loaded as global
scripts. Components are options-API objects with string templates. There is no Vite and no build step.
The look is a clean, light SaaS style, as the client document asks, not the glassmorphic theme. It keeps the
Poppins font and the `#6C63FF` accent.

**Where state lives:** one reactive store in `js/services/store.js`. It persists to localStorage keys
`ssc_demo_v1` (data) and `ssc_session_v1` (demo login). Seed data is regenerated deterministically
by `js/data/seed.js`, with dates relative to today. All mutations go through `SSC.store.actions`, and
business rules live in `js/services/rules.js`.

**Roles:** Admin, Staff and Student. Admin and staff share `AppShell` and most screens, which read
`$route.meta.role` and build links with `$link()`. The student portal uses a mobile-first `StudentShell`.
`#/admin?as=admin` style links skip the login screen.

**Testing:** headless Chrome (`google-chrome --headless=new --screenshot … file://…index.html#/route`)
works for screenshots and console errors.
