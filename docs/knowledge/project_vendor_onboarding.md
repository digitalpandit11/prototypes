---
name: project-vendor-onboarding
description: "Vendor Onboarding Portal prototype built in vendor-onboarding/ folder — pages, features, tech stack, and what was added"
metadata: 
  node_type: memory
  type: project
---

Built a complete frontend-only Vendor Onboarding Portal prototype at `E:\Projects\prototypes\vendor-onboarding\`.

**Why:** User wanted a no-backend prototype for a vendor onboarding workflow, as a separate folder within the prototypes repo.

**How to apply:** When continuing work on this project, all state is in localStorage (keys: `vop_vendors`, `vop_current_vendor`, `vop_sync_log`). No build tools — plain HTML/CSS/JS.

## File Structure
```
vendor-onboarding/
├── index.html       # Landing page
├── register.html    # 5-step onboarding form
├── dashboard.html   # Vendor status dashboard (tabbed)
├── admin.html       # Admin panel (tabbed)
├── css/style.css    # Shared glassmorphic design system
└── js/app.js        # Shared localStorage helpers + seed data
```

## Features Built
- **index.html**: Hero, 6 feature cards, 5-step how-it-works, CTA
- **register.html**: 5-step form (Company → Business → Documents → Bank → Review & Submit); saves to localStorage; redirects to dashboard on submit
- **dashboard.html**: 4 tabs — Overview, Bills & Payments, My Documents, Support
  - Bills & Payments only unlocked for approved vendors; shows invoice table, payment history timeline, stats cards, payment terms
  - My Documents tab includes compliance checklist for approved vendors
  - Support tab has ticket form + quick links
- **admin.html**: 2 tabs — Vendor Applications, ERP Sync
  - Vendor Applications: table with approve/reject/review actions, search, filter by status, vendor detail modal
  - ERP Sync: ERP system selector (SAP/Oracle/Tally/MS Dynamics/Custom), API config fields, sync queue, animated 5-stage sync progress modal, sync history log

## Mock Data
`js/app.js` seeds 5 mock vendors (Apex Manufacturing, SwiftLogix, GreenLeaf Organics, TechEdge Solutions, BuildRight Construction) with mixed statuses.

## Commit
`daf8b8a` — pushed to `github.com:digitalpandit11/prototypes.git` on branch `main`.
