# StudyNest — Self-Study Centre Management System (UI prototype)

Stage 1 **frontend-only** prototype for client requirement validation. All data is fictional mock
data held in the browser. There is no backend, no real login, no payment gateway, and no SMS, WhatsApp
or email.

## Run it

Open `index.html` in Chrome, Edge or Firefox. It works straight from the file system, offline, with nothing to install.
(Optional: `python3 -m http.server` in this folder, then open http://localhost:8000.)

### Demo profiles (simulated login)

| Profile | Person | Opens |
|---|---|---|
| **Admin** | Rohan Deshpande (owner) | Full admin panel, all branches |
| **Staff** | Amit Patil (front desk, Kothrud) | Staff panel, locked to Kothrud branch |
| **Student** | Aarav Sharma (STU1001) | Mobile-first student portal |

- **Switch role ▾** in the orange strip at the top changes persona at any time.
- Direct links skip the login screen: `index.html#/admin?as=admin`, `#/staff?as=staff`, `#/student?as=student`.
- **Reset demo data** (in the same menu, on the login screen, or in Admin → Settings) restores the original dataset.
- Changes persist in `localStorage` across refreshes until you reset.

## Demo script: the 7 required workflows

| # | Workflow | Where |
|---|---|---|
| 1 | New admission: Register, Branch, Plan, Seat, Payment, Confirmation | Admin → Students → **New admission**, or Staff → **New admission** |
| 2 | Membership renewal: Search, Current plan, New plan, Amount + discount, Payment, Updated membership | Admin → Memberships → **Renew**, or Staff → Student Search → Renew |
| 3 | Check-in: Search, Validate membership, Seat, Check-in, Present list updates | Staff → **Check-in / Check-out** (try an expired student to see the block) |
| 4 | Check-out: Present student, Check-out, Hours calculated | Same screen, "Currently present" list |
| 5 | Seat allocation: Branch, Hall, Layout, Seat, Student, Status updates | Admin → **Study Halls & Seats** (click any seat) |
| 6 | Student seat booking: Branch, Seats, Select, Submit, Confirmation | Student → **Book a Seat**; then approve it as Admin in Study Halls & Seats |
| 7 | Service request: Student raises it, Admin updates status, Student sees the update | Student → **Help**, then Admin → **Service Requests**, then switch back to Student |

Suggested order for a client walkthrough: Admin dashboard → Workflow 1 → 5 → 2 → switch to Staff → 3 and 4 →
Payments and receipt print → switch to Student on a phone-sized window → 6 and 7 → Reports.

## Sample data (generated relative to today)

2 branches (Kothrud, Shivaji Nagar) · 3 halls each (AC, Non-AC, Premium Cabins) · 96 seats ·
36 students · 7 plans (6 active) · ~45 memberships in every state (active, expiring soon, expired,
upcoming, suspended, cancelled) · 14 days of attendance · ~50 payments incl. pending dues and a refund ·
8 service requests · 3 seat bookings · 6 staff.

## Sample business rules (to be confirmed by the client)

These rules are only assumptions made for the demo. Each one is a decision point for the scope freeze.

- **Membership status**: *Upcoming* when it starts in the future; *Expiring Soon* within 7 days of expiry (configurable in Settings); *Expired* after the end date. *Suspended* and *Cancelled* are set by hand.
- **Plan end date**: `start + duration − 1` day. Hourly plans end on the same day.
- **Renewal start**: the day after the current expiry, or today if already expired. Settings can switch this to "immediate".
- **Discount**: flat ₹ or %, capped at a maximum percentage (default 20%).
- **Part payment**: paying less than the total creates a *Pending* due for the balance.
- **Check-in**: allowed only with an Active or Expiring Soon membership and an active student. A student cannot be checked in twice.
- **Seats**: a Fixed plan holds one seat. An upcoming membership holds it as *Reserved*. Cancelling or deactivating frees the seat. Blocking a seat releases its student.
- **Student booking**: creates a *Pending* request and marks the seat *Reserved*. Admin or staff approve or reject it. Conflict rules are not modelled yet.

## Open questions for the requirement freeze

These come from §11 of the requirement document, plus the points the prototype raised.

| Area | Decision required |
|---|---|
| Branches | Single centre or multi-branch? (prototype: multi-branch) |
| Seating | Fixed, flexible or both? (prototype: both, set per plan) |
| Membership | Which plan types: hourly, daily, weekly, monthly, quarterly? |
| Booking | Is advance seat booking needed? Who approves it? How are conflicts handled? |
| Membership | Can students pause or freeze? (prototype: admin "Suspend" only) |
| Renewal | Does renewal start immediately or after expiry? (prototype: configurable) |
| Attendance | Manual, QR, RFID or biometric? (prototype: manual desk entry) |
| Access | Is electronic door access required? |
| Payments | Cash, UPI, online or all? Are part payments and dues allowed? |
| Refunds | What are the cancellation and refund rules? |
| Student App | Web portal, PWA or native app? |
| Notifications | WhatsApp, SMS, email or push? Which events trigger them? |
| Staff | Which roles and permissions? (prototype: Admin, Manager and Staff as a concept only) |
| Reports | Which of the 8 demo reports are essential? Any others? |
| Pricing | GST on receipts? Security deposit? Locker add-ons? |
| Seats | Do expired members keep their seat for a grace period? |

## Code map

Vue 3 + Vue Router + Tailwind + Lucide + Chart.js, as the requirement document asks. The libraries are
vendored in `lib/` and loaded as plain scripts, so there is **no build step**. This matches the repo
convention that every prototype opens as a plain file. Stage 3 can move the same components into
Vite single-file components.

```
selfstudy/
├── index.html                 entry point, script order
├── css/app.css                design tokens + reusable classes (card, btn, badge, table, seat…)
├── lib/                       vendored Vue 3.4, Vue Router 4.4, Chart.js 4.4, Lucide, Tailwind Play CDN
└── js/
    ├── data/seed.js           mock data generator (deterministic, dates relative to today)
    ├── services/rules.js      business rules + formatting (pure functions)
    ├── services/store.js      reactive state, selectors, actions, localStorage persistence
    ├── components/ui.js       Icon, Badge, Modal, DataTable, Tabs, Stepper, Toasts, Confirm…
    ├── components/widgets.js  ChartCard, SeatGrid, HallPicker, StudentPicker, MembershipSummary, ReceiptView
    ├── layouts/shells.js      demo bar, admin/staff sidebar shell, student mobile shell, nav config
    ├── pages/                 login, admin/*, staff/*, student/*
    ├── router.js              hash routes per role
    └── main.js                bootstrap + template helpers ($inr, $date, $link…)
```

The only expected console message is Tailwind's "should not be used in production" warning from the Play CDN.
