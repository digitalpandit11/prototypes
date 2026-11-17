/* ==========================================================================
   Store — single reactive state object + selectors + actions.
   Persists to localStorage so the demo survives a refresh; "Reset demo data"
   regenerates the seed. Every simulated operation goes through an action
   here, so screens never mutate data directly.
   ========================================================================== */
(function () {
  const { reactive, watch } = Vue;
  const R = SSC.rules;
  const KEY = 'ssc_demo_v1';
  const SESSION_KEY = 'ssc_session_v1';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2) return parsed;
      }
    } catch (e) { /* storage unavailable — fall back to fresh seed */ }
    return SSC.seed.generate();
  }
  function loadSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || null; } catch (e) { return null; }
  }

  const db = reactive(load());
  const ui = reactive({ toasts: [], confirm: null, branch: 'ALL', sidebarOpen: false });
  const session = reactive({ user: loadSession() });

  let saveTimer = null;
  watch(db, () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* ignore */ } }, 250);
  }, { deep: true });
  watch(() => session.user, (u) => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(u)); } catch (e) { /* ignore */ } });

  // ---------- id helpers ----------
  const next = (key, prefix, width = 4) => `${prefix}${String(db.counters[key]++).padStart(width, '0')}`;
  const byId = (list, id) => list.find((x) => x.id === id) || null;

  // ======================= UI services =======================
  function toast(message, type = 'success', ms = 3200) {
    const id = Math.random().toString(36).slice(2);
    ui.toasts.push({ id, message, type });
    setTimeout(() => { const i = ui.toasts.findIndex((t) => t.id === id); if (i >= 0) ui.toasts.splice(i, 1); }, ms);
  }
  /** confirm({ title, message, confirmText, tone: 'danger'|'primary' }) → Promise<boolean> */
  function confirm(opts) {
    return new Promise((resolve) => { ui.confirm = { confirmText: 'Confirm', tone: 'primary', ...opts, resolve }; });
  }

  // ======================= Selectors =======================
  const get = {
    student: (id) => byId(db.students, id),
    branch: (id) => byId(db.branches, id),
    hall: (id) => byId(db.halls, id),
    seat: (id) => byId(db.seats, id),
    plan: (id) => byId(db.plans, id),
    staff: (id) => byId(db.staff, id),
    membership: (id) => byId(db.memberships, id),
    payment: (id) => byId(db.payments, id),
    request: (id) => byId(db.requests, id),
    booking: (id) => byId(db.bookings, id),
  };

  const sel = {
    branchName: (id) => (id === 'ALL' ? 'All branches' : (get.branch(id) || {}).name || '—'),
    planName: (id) => (get.plan(id) || {}).name || '—',
    studentName: (id) => (get.student(id) || {}).name || '—',
    seatLabel(id) {
      const s = get.seat(id);
      if (!s) return '—';
      return `${(get.hall(s.hallId) || {}).code || ''} · ${s.number}`.replace(/^ · /, '');
    },
    mStatus: (m) => R.membershipStatus(m, db.settings),
    membershipsOf: (studentId) => db.memberships.filter((m) => m.studentId === studentId).sort((a, b) => b.startDate.localeCompare(a.startDate)),
    /** Live membership if any, else upcoming, else most recent. */
    currentMembership(studentId) {
      const list = sel.membershipsOf(studentId).filter((m) => m.override !== 'Cancelled');
      return list.find((m) => R.isLive(sel.mStatus(m)))
        || list.find((m) => sel.mStatus(m) === 'Suspended')
        || list.find((m) => sel.mStatus(m) === 'Upcoming')
        || list[0] || null;
    },
    /** Student-level status shown in listings: Active / Expired / Inactive / … */
    studentStatus(stu) {
      if (stu.status === 'Inactive') return 'Inactive';
      const m = sel.currentMembership(stu.id);
      if (!m) return 'None';
      return sel.mStatus(m);
    },
    studentSeat: (studentId) => db.seats.find((s) => s.studentId === studentId) || null,
    paymentsOf: (studentId) => db.payments.filter((p) => p.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date)),
    duesOf: (studentId) => db.payments.filter((p) => p.studentId === studentId && p.status === 'Pending').reduce((s, p) => s + p.amount, 0),
    attendanceOf: (studentId) => db.attendance.filter((a) => a.studentId === studentId).sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    openAttendance: (studentId) => db.attendance.find((a) => a.studentId === studentId && a.date === R.today() && !a.checkOut) || null,
    presentNow: (branchId = 'ALL') => db.attendance.filter((a) => a.date === R.today() && !a.checkOut && (branchId === 'ALL' || a.branchId === branchId)),
    requestsOf: (studentId) => db.requests.filter((r) => r.studentId === studentId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    seatsOfHall: (hallId) => db.seats.filter((s) => s.hallId === hallId),
    hallsOf: (branchId) => db.halls.filter((h) => h.branchId === branchId),
    notificationsFor: (studentId) => db.notifications.filter((n) => n.studentId === studentId || n.studentId === 'ALL').sort((a, b) => b.at.localeCompare(a.at)),
    inBranch: (item, branchId) => branchId === 'ALL' || item.branchId === branchId,
    /** Plans a student can pick for a branch. */
    plansFor: (branchId) => db.plans.filter((p) => p.status === 'Active' && (p.branchId === 'ALL' || p.branchId === branchId)),
    search(q, branchId = 'ALL') {
      const s = (q || '').trim().toLowerCase();
      if (!s) return [];
      const digits = s.replace(/\s/g, '');
      return db.students.filter((x) => sel.inBranch(x, branchId) && (
        x.name.toLowerCase().includes(s) || x.id.toLowerCase().includes(s) || x.mobile.replace(/\s/g, '').includes(digits)
      )).slice(0, 8);
    },

    /** Dashboard KPIs for a branch filter ('ALL' or id) and optional date range (for collections). */
    kpis(branchId = 'ALL', from = R.today(), to = R.today()) {
      const inB = (x) => sel.inBranch(x, branchId);
      const students = db.students.filter(inB);
      const ms = db.memberships.filter(inB);
      const statuses = ms.map((m) => sel.mStatus(m));
      const seats = db.seats.filter(inB);
      const pays = db.payments.filter(inB);
      return {
        totalStudents: students.length,
        activeMemberships: statuses.filter(R.isLive).length,
        expiringSoon: statuses.filter((s) => s === 'Expiring Soon').length,
        todaysCheckins: db.attendance.filter((a) => inB(a) && a.date === R.today()).length,
        presentNow: sel.presentNow(branchId).length,
        occupiedSeats: seats.filter((s) => s.status === 'Occupied').length,
        availableSeats: seats.filter((s) => s.status === 'Available').length,
        reservedSeats: seats.filter((s) => s.status === 'Reserved').length,
        blockedSeats: seats.filter((s) => s.status === 'Blocked').length,
        totalSeats: seats.length,
        collections: pays.filter((p) => p.status === 'Paid' && p.date >= from && p.date <= to).reduce((s, p) => s + p.amount, 0),
        pendingAmount: pays.filter((p) => p.status === 'Pending').reduce((s, p) => s + p.amount, 0),
        pendingCount: pays.filter((p) => p.status === 'Pending').length,
        openRequests: db.requests.filter((r) => inB(r) && r.status !== 'Resolved').length,
        pendingBookings: db.bookings.filter((b) => inB(b) && b.status === 'Pending').length,
      };
    },

    /** 12-month series: 11 synthetic months + current month computed from live payments. */
    monthlySeries(branchId = 'ALL') {
      const pick = (obj) => (branchId === 'ALL' ? Object.values(obj).reduce((a, b) => a + b, 0) : obj[branchId] || 0);
      const avg = (obj) => (branchId === 'ALL' ? Object.values(obj).reduce((a, b) => a + b, 0) / Object.values(obj).length : obj[branchId] || 0);
      const rows = db.history.months.map((m) => ({
        label: m.label, revenue: pick(m.revenue), newMembers: pick(m.newMembers), activeMembers: pick(m.activeMembers), occupancy: Math.round(avg(m.occupancy)),
      }));
      const now = new Date();
      const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const k = sel.kpis(branchId);
      rows.push({
        label: now.toLocaleString('en-IN', { month: 'short' }),
        revenue: db.payments.filter((p) => sel.inBranch(p, branchId) && p.date.startsWith(key) && p.status !== 'Pending').reduce((s, p) => s + p.amount, 0),
        newMembers: db.students.filter((s) => sel.inBranch(s, branchId) && s.createdAt.startsWith(key)).length,
        activeMembers: k.activeMemberships,
        occupancy: k.totalSeats ? Math.round(((k.occupiedSeats + k.reservedSeats) / (k.totalSeats - k.blockedSeats)) * 100) : 0,
      });
      return rows;
    },
  };

  // ======================= Actions =======================
  function log(icon, text) {
    db.activity.unshift({ at: R.nowLocal(), icon, text });
    if (db.activity.length > 40) db.activity.length = 40;
  }
  function notify(studentId, type, title, body) {
    db.notifications.unshift({ id: `N${db.counters.notification++}`, studentId, type, title, body, at: R.nowLocal(), read: false });
  }
  const actorName = () => (session.user ? session.user.name : 'System');

  const actions = {
    // ---------- session ----------
    login(roleKey) { session.user = { ...db.demoUsers[roleKey] }; ui.branch = 'ALL'; },
    logout() { session.user = null; },
    resetDemo() {
      const fresh = SSC.seed.generate();
      Object.keys(db).forEach((k) => delete db[k]);
      Object.assign(db, fresh);
      toast('Demo data has been reset');
    },

    // ---------- students ----------
    addStudent(data) {
      const stu = {
        id: `STU${db.counters.student++}`, photo: null, status: 'Active', createdAt: R.today(), notes: '',
        gender: '', address: '', idType: '', idNumber: '', emergencyName: '', emergencyPhone: '', dob: '', email: '',
        ...data,
      };
      db.students.unshift(stu);
      log('UserPlus', `New student registered — ${stu.name}`);
      return stu;
    },
    updateStudent(id, patch) { Object.assign(get.student(id), patch); },
    setStudentStatus(id, status) {
      const stu = get.student(id);
      stu.status = status;
      if (status === 'Inactive') {
        const seat = sel.studentSeat(id);
        if (seat) actions.releaseSeat(seat.id, true);
      }
      log(status === 'Inactive' ? 'UserX' : 'UserCheck', `${stu.name} marked ${status.toLowerCase()}`);
    },

    // ---------- memberships ----------
    /** Creates a membership (admission or renewal). Allocates the seat if given. */
    createMembership({ studentId, planId, branchId, startDate, seatId = null, discount = 0, notes = '' }) {
      const plan = get.plan(planId);
      const m = {
        id: next('membership', 'MEM', 4), studentId, planId, branchId, seatId: null,
        startDate, endDate: R.endDateFor(plan, startDate), amount: plan.price, discount,
        override: null, createdAt: R.today(), notes,
      };
      db.memberships.unshift(m);
      if (seatId) actions.assignSeatToMembership(m, seatId);
      const stu = get.student(studentId);
      if (stu.status === 'Inactive') stu.status = 'Active';
      return m;
    },
    renewMembership({ studentId, planId, startDate, discount = 0, keepSeat = true }) {
      const current = sel.currentMembership(studentId);
      const branchId = current ? current.branchId : get.student(studentId).branchId;
      const plan = get.plan(planId);
      const oldSeat = current && current.seatId ? current.seatId : null;
      const m = actions.createMembership({ studentId, planId, branchId, startDate, discount });
      if (keepSeat && oldSeat && plan.seatType === 'Fixed') {
        m.seatId = oldSeat;                       // seat carries over to the renewed term
        const s = get.seat(oldSeat);
        if (s) { s.studentId = studentId; if (s.status !== 'Occupied') s.status = startDate <= R.today() ? 'Occupied' : 'Reserved'; }
      }
      log('RefreshCw', `Membership renewed — ${sel.studentName(studentId)} (${plan.name})`);
      notify(studentId, 'payment', 'Membership renewed', `${plan.name} from ${R.fmtDate(startDate)} to ${R.fmtDate(m.endDate)}.`);
      return m;
    },
    extendMembership(id, days, reason = '') {
      const m = get.membership(id);
      m.endDate = R.addDays(m.endDate, days);
      m.notes = [m.notes, `Extended by ${days} day(s)${reason ? ': ' + reason : ''}`].filter(Boolean).join(' · ');
      log('CalendarPlus', `Membership ${id} extended by ${days} day(s)`);
    },
    changePlan(id, planId) {
      const m = get.membership(id);
      const plan = get.plan(planId);
      const oldPlan = get.plan(m.planId);
      const extraDays = oldPlan ? R.daysBetween(R.endDateFor(oldPlan, m.startDate), m.endDate) : 0; // keep earlier extensions
      m.planId = planId;
      m.endDate = R.addDays(R.endDateFor(plan, m.startDate), Math.max(0, extraDays));
      m.amount = plan.price;
      log('Repeat', `Plan changed for ${m.id} → ${plan.name}`);
    },
    setMembershipOverride(id, override) {
      const m = get.membership(id);
      m.override = override;
      if (override === 'Cancelled' && m.seatId) actions.releaseSeat(m.seatId, true);
      log(override ? 'PauseCircle' : 'PlayCircle', `Membership ${id} ${override ? override.toLowerCase() : 'reactivated'}`);
    },
    assignSeatToMembership(m, seatId) {
      // free any seat the student holds now
      db.seats.filter((s) => s.studentId === m.studentId && s.id !== seatId).forEach((s) => { s.studentId = null; s.status = 'Available'; });
      db.memberships.filter((x) => x.studentId === m.studentId && x.seatId && x.seatId !== seatId && R.isLive(sel.mStatus(x))).forEach((x) => { x.seatId = seatId; });
      const seat = get.seat(seatId);
      seat.studentId = m.studentId;
      seat.status = m.startDate > R.today() ? 'Reserved' : 'Occupied';
      m.seatId = seatId;
    },

    // ---------- seats ----------
    /** Allocates a seat to a student's current membership. Returns { ok, message }. */
    allocateSeat(seatId, studentId) {
      const seat = get.seat(seatId);
      const m = sel.currentMembership(studentId);
      if (!m || !['Active', 'Expiring Soon', 'Upcoming'].includes(sel.mStatus(m))) return { ok: false, message: 'Student has no active or upcoming membership.' };
      if (seat.status === 'Blocked') return { ok: false, message: 'Seat is blocked for maintenance.' };
      if (seat.studentId && seat.studentId !== studentId) return { ok: false, message: 'Seat is already allocated to another student.' };
      actions.assignSeatToMembership(m, seatId);
      log('Armchair', `Seat ${sel.seatLabel(seatId)} allocated to ${sel.studentName(studentId)}`);
      notify(studentId, 'booking', 'Seat allocated', `You have been allocated seat ${sel.seatLabel(seatId)}.`);
      return { ok: true, message: `Seat ${seat.number} allocated to ${sel.studentName(studentId)}` };
    },
    releaseSeat(seatId, silent = false) {
      const seat = get.seat(seatId);
      db.memberships.filter((m) => m.seatId === seatId).forEach((m) => { if (sel.mStatus(m) !== 'Expired') m.seatId = null; });
      const who = seat.studentId;
      db.bookings.filter((b) => b.seatId === seatId && b.status === 'Pending').forEach((b) => { b.status = 'Rejected'; b.note = 'Seat released by the centre'; });
      seat.studentId = null;
      if (seat.status !== 'Blocked') seat.status = 'Available';
      if (!silent) log('Armchair', `Seat ${sel.seatLabel(seatId)} released${who ? ' from ' + sel.studentName(who) : ''}`);
    },
    blockSeat(seatId, note) {
      const seat = get.seat(seatId);
      if (seat.studentId) actions.releaseSeat(seatId, true);
      seat.status = 'Blocked';
      seat.note = note || 'Maintenance';
      log('Ban', `Seat ${sel.seatLabel(seatId)} blocked — ${seat.note}`);
    },
    unblockSeat(seatId) {
      const seat = get.seat(seatId);
      seat.status = 'Available';
      seat.note = '';
      log('CheckCircle2', `Seat ${sel.seatLabel(seatId)} unblocked`);
    },
    updateSeat(seatId, patch) { Object.assign(get.seat(seatId), patch); },
    addSeats(hallId, count, { category, type }) {
      const hall = get.hall(hallId);
      const existing = sel.seatsOfHall(hallId);
      const letter = hall.code.split('-').pop();
      let n = existing.reduce((mx, s) => Math.max(mx, parseInt(s.number.replace(/\D/g, ''), 10) || 0), 0);
      const added = [];
      for (let i = 0; i < count; i++) {
        n++;
        const num = String(n).padStart(2, '0');
        const seat = { id: `${hall.code}-${num}`, hallId, branchId: hall.branchId, number: `${letter}${num}`, category: category || hall.category, type: type || 'Fixed', status: 'Available', studentId: null, note: '' };
        db.seats.push(seat);
        added.push(seat);
      }
      hall.capacity = sel.seatsOfHall(hallId).length;
      hall.rows = Math.ceil(hall.capacity / hall.cols);
      log('Plus', `${count} seat(s) added to ${hall.name} (${hall.code})`);
      return added;
    },

    // ---------- branches & halls ----------
    saveBranch(data) {
      if (data.id && get.branch(data.id)) { Object.assign(get.branch(data.id), data); return get.branch(data.id); }
      const b = { ...data, id: `BR${db.branches.length + 1}`, status: data.status || 'Active' };
      db.branches.push(b);
      log('Building2', `Branch added — ${b.name}`);
      return b;
    },
    saveHall(data) {
      if (data.id && get.hall(data.id)) { Object.assign(get.hall(data.id), data); return get.hall(data.id); }
      const branch = get.branch(data.branchId);
      const letter = String.fromCharCode(65 + sel.hallsOf(data.branchId).length);
      const h = { cols: 4, rows: 0, capacity: 0, status: 'Active', category: 'Standard', ...data, id: `${data.branchId}-${letter}`, code: data.code || `${branch.code}-${letter}` };
      db.halls.push(h);
      const seatCount = Number(data.capacity) || 0;
      if (seatCount) actions.addSeats(h.id, seatCount, { category: h.category, type: 'Fixed' });
      log('LayoutGrid', `Study hall added — ${h.name} (${branch.name})`);
      return h;
    },

    // ---------- plans ----------
    savePlan(data) {
      if (data.id && get.plan(data.id)) { Object.assign(get.plan(data.id), data); log('Tags', `Plan updated — ${data.name}`); return get.plan(data.id); }
      const p = { ...data, id: `PL${db.plans.length + 1}` };
      db.plans.push(p);
      log('Tags', `New plan created — ${p.name}`);
      return p;
    },

    // ---------- payments ----------
    recordPayment({ studentId, membershipId = null, amount, method, date = R.today(), note = '', status = 'Paid' }) {
      const stu = get.student(studentId);
      const p = {
        id: `${db.settings.receiptPrefix}-${String(db.counters.receipt++).padStart(4, '0')}`,
        studentId, membershipId, branchId: stu.branchId, date, amount: Number(amount), method: status === 'Pending' ? '—' : method,
        status, type: 'Payment', note,
      };
      db.payments.unshift(p);
      if (status === 'Paid') {
        log('IndianRupee', `Payment ${R.inr(p.amount)} received from ${stu.name} (${method})`);
        notify(studentId, 'payment', 'Payment received', `${R.inr(p.amount)} received via ${method}. Receipt ${p.id}.`);
      }
      return p;
    },
    /** Collect a pending due → marks it Paid. */
    settlePayment(paymentId, method) {
      const p = get.payment(paymentId);
      p.status = 'Paid'; p.method = method; p.date = R.today(); p.note = (p.note ? p.note + ' · ' : '') + 'Collected';
      log('IndianRupee', `Due ${R.inr(p.amount)} collected from ${sel.studentName(p.studentId)} (${method})`);
      notify(p.studentId, 'payment', 'Payment received', `${R.inr(p.amount)} received via ${method}. Receipt ${p.id}.`);
      return p;
    },
    refundPayment(paymentId, amount, method, reason) {
      const orig = get.payment(paymentId);
      const p = {
        id: `${db.settings.receiptPrefix}-${String(db.counters.receipt++).padStart(4, '0')}`,
        studentId: orig.studentId, membershipId: orig.membershipId, branchId: orig.branchId, date: R.today(),
        amount: -Math.abs(Number(amount)), method, status: 'Refunded', type: 'Refund', note: `Refund against ${orig.id}${reason ? ' — ' + reason : ''}`,
      };
      db.payments.unshift(p);
      log('Undo2', `Refund ${R.inr(Math.abs(p.amount))} issued to ${sel.studentName(p.studentId)}`);
      return p;
    },

    // ---------- attendance ----------
    /** Validates membership and checks the student in. Returns { ok, message, record }. */
    checkIn(studentId, { time = R.nowLocal(), mode = 'Desk' } = {}) {
      const stu = get.student(studentId);
      if (stu.status === 'Inactive') return { ok: false, message: `${stu.name} is inactive.` };
      const m = sel.currentMembership(studentId);
      const st = sel.mStatus(m);
      if (!m || !R.isLive(st)) return { ok: false, message: `No valid membership (${st === 'None' ? 'no plan' : st}). Renew before check-in.` };
      if (sel.openAttendance(studentId)) return { ok: false, message: `${stu.name} is already checked in.` };
      const rec = { id: next('attendance', 'ATT', 4), studentId, branchId: m.branchId, seatId: m.seatId, date: time.slice(0, 10), checkIn: time, checkOut: null, mode };
      db.attendance.unshift(rec);
      log('LogIn', `${stu.name} checked in${m.seatId ? ' at ' + sel.seatLabel(m.seatId) : ''}`);
      return { ok: true, message: `${stu.name} checked in`, record: rec };
    },
    checkOut(attendanceId, time = R.nowLocal()) {
      const a = db.attendance.find((x) => x.id === attendanceId);
      a.checkOut = time < a.checkIn ? a.checkIn : time;
      const h = R.hoursBetween(a.checkIn, a.checkOut);
      log('LogOut', `${sel.studentName(a.studentId)} checked out — ${R.fmtHours(h)}`);
      return h;
    },
    addManualAttendance({ studentId, date, inTime, outTime, branchId }) {
      const m = sel.currentMembership(studentId);
      const rec = {
        id: next('attendance', 'ATT', 4), studentId, branchId: branchId || get.student(studentId).branchId, seatId: m ? m.seatId : null,
        date, checkIn: `${date}T${inTime}`, checkOut: outTime ? `${date}T${outTime}` : null, mode: 'Manual',
      };
      db.attendance.unshift(rec);
      log('ClipboardEdit', `Manual attendance added for ${sel.studentName(studentId)}`);
      return rec;
    },

    // ---------- service requests ----------
    createRequest(studentId, { category, subject, description, priority = 'Medium' }) {
      const stu = get.student(studentId);
      const now = R.nowLocal();
      const r = {
        id: `SR-${db.counters.request++}`, studentId, branchId: stu.branchId, category, subject, description, status: 'Open', priority,
        createdAt: now, updates: [{ at: now, by: stu.name, status: 'Open', text: 'Request raised.' }],
      };
      db.requests.unshift(r);
      log('MessageSquareWarning', `New service request ${r.id} — ${subject}`);
      return r;
    },
    updateRequest(id, status, text) {
      const r = get.request(id);
      r.status = status;
      r.updates.push({ at: R.nowLocal(), by: actorName(), status, text: text || `Status changed to ${status}.` });
      notify(r.studentId, 'maintenance', `Request ${r.id}: ${status}`, text || `Your request "${r.subject}" is now ${status.toLowerCase()}.`);
      log('MessageSquare', `${r.id} → ${status}`);
    },

    // ---------- seat bookings (student portal) ----------
    createBooking(studentId, { seatId, fromDate, note = '' }) {
      const seat = get.seat(seatId);
      const b = { id: `BK-${db.counters.booking++}`, studentId, branchId: seat.branchId, hallId: seat.hallId, seatId, fromDate, status: 'Pending', createdAt: R.nowLocal(), note };
      db.bookings.unshift(b);
      seat.status = 'Reserved';
      log('Armchair', `Seat booking request ${b.id} — ${sel.studentName(studentId)} for ${sel.seatLabel(seatId)}`);
      notify(studentId, 'booking', 'Booking request submitted', `Request ${b.id} for seat ${sel.seatLabel(seatId)} is awaiting confirmation.`);
      return b;
    },
    decideBooking(id, status, note = '') {
      const b = get.booking(id);
      b.status = status;
      if (note) b.note = note;
      const seat = get.seat(b.seatId);
      if (status === 'Approved') {
        const res = actions.allocateSeat(b.seatId, b.studentId);
        if (!res.ok) { seat.studentId = b.studentId; seat.status = 'Reserved'; }
      } else if (seat && !seat.studentId) {
        seat.status = 'Available';
      }
      notify(b.studentId, 'booking', `Booking ${status.toLowerCase()}`, `Your booking ${b.id} for seat ${sel.seatLabel(b.seatId)} was ${status.toLowerCase()}.${note ? ' ' + note : ''}`);
      log('Armchair', `Booking ${b.id} ${status.toLowerCase()}`);
    },

    // ---------- staff ----------
    saveStaff(data) {
      if (data.id && get.staff(data.id)) { Object.assign(get.staff(data.id), data); log('UserCog', `Staff updated — ${data.name}`); return get.staff(data.id); }
      const s = { status: 'Active', joinedOn: R.today(), ...data, id: `EMP${String(db.staff.length + 1).padStart(2, '0')}` };
      db.staff.push(s);
      log('UserCog', `Staff added — ${s.name} (${s.role})`);
      return s;
    },

    // ---------- notifications ----------
    notify,
    markNotificationsRead(studentId) { sel.notificationsFor(studentId).forEach((n) => { n.read = true; }); },
    announce(title, body) { notify('ALL', 'announcement', title, body); log('Megaphone', `Announcement sent — ${title}`); },
  };

  SSC.store = { db, ui, session, get, sel, actions, toast, confirm };
})();
