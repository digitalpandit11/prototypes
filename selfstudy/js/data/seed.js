/* ==========================================================================
   Mock data generator.
   Everything here is FICTIONAL demo data. Dates are generated relative to
   "today" so the demo always looks current. Deterministic (seeded PRNG), so a
   reset always produces the same dataset.
   ========================================================================== */
window.SSC = window.SSC || {};

(function () {
  // ---------- small helpers (also reused by rules.js) ----------
  const pad = (n) => String(n).padStart(2, '0');
  const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return isoDate(d); };
  const dt = (iso, hh, mm) => `${iso}T${pad(hh)}:${pad(mm)}`;

  function rng(seed) {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  function generate() {
    const r = rng(20261117);
    const pick = (arr) => arr[Math.floor(r() * arr.length)];
    const int = (a, b) => a + Math.floor(r() * (b - a + 1));
    const today = isoDate(new Date());

    // ---------- Centre settings ----------
    const settings = {
      centreName: 'StudyNest Self-Study Centre',
      tagline: 'Quiet spaces for focused minds',
      address: 'Head Office: 2nd Floor, Demo Plaza, Pune 411001',
      phone: '+91 20 0000 1234',
      email: 'hello@studynest.example',
      receiptPrefix: 'RCP',
      expiringSoonDays: 7,
      renewalStart: 'after_expiry',          // 'after_expiry' | 'immediate' — open question for client
      allowStudentBooking: true,
      maxDiscountPercent: 20,
      lateCheckoutHour: 23,
    };

    // ---------- Branches, halls, seats ----------
    const branches = [
      { id: 'BR1', code: 'KTH', name: 'Kothrud Branch', address: 'Plot 12, Karve Road, Kothrud, Pune 411038', phone: '+91 98000 11001', email: 'kothrud@studynest.example', openTime: '06:00', closeTime: '23:00', weeklyHoliday: 'None', status: 'Active', managerId: 'EMP02' },
      { id: 'BR2', code: 'SVN', name: 'Shivaji Nagar Branch', address: '3rd Floor, FC Road, Shivaji Nagar, Pune 411005', phone: '+91 98000 11002', email: 'shivajinagar@studynest.example', openTime: '07:00', closeTime: '22:00', weeklyHoliday: 'Sunday', status: 'Active', managerId: 'EMP04' },
    ];

    const hallTemplates = [
      { suffix: 'A', name: 'Silent Hall', type: 'AC', category: 'AC', rows: 5, cols: 4, floor: 1 },
      { suffix: 'B', name: 'Focus Hall', type: 'Non-AC', category: 'Standard', rows: 4, cols: 4, floor: 1 },
      { suffix: 'C', name: 'Premium Cabins', type: 'AC Cabins', category: 'Premium Cabin', rows: 3, cols: 4, floor: 2 },
    ];
    const halls = [];
    const seats = [];
    branches.forEach((b) => {
      hallTemplates.forEach((t) => {
        const hall = {
          id: `${b.id}-${t.suffix}`, branchId: b.id, name: t.name, code: `${b.code}-${t.suffix}`,
          floor: t.floor, capacity: t.rows * t.cols, type: t.type, category: t.category,
          openTime: b.openTime, closeTime: b.closeTime, status: 'Active', rows: t.rows, cols: t.cols,
        };
        halls.push(hall);
        for (let i = 1; i <= hall.capacity; i++) {
          seats.push({
            id: `${hall.code}-${pad(i)}`, hallId: hall.id, branchId: b.id, number: `${t.suffix}${pad(i)}`,
            category: t.category,
            type: t.suffix === 'B' && i <= 4 ? 'Flexible' : 'Fixed',
            status: 'Available', studentId: null, note: '',
          });
        }
      });
    });
    // A few blocked seats for maintenance
    [['KTH-A-16', 'Chair repair'], ['KTH-B-12', 'Lamp not working'], ['SVN-A-08', 'AC vent leak'], ['SVN-C-12', 'Under renovation']].forEach(([id, note]) => {
      const s = seats.find((x) => x.id === id); s.status = 'Blocked'; s.note = note;
    });

    // ---------- Membership plans ----------
    const plans = [
      { id: 'PL1', name: 'Hourly Pass', description: '3-hour flexible slot, any free standard seat.', duration: 3, unit: 'hours', price: 50, branchId: 'ALL', seatCategory: 'Standard', seatType: 'Flexible', hoursFrom: '06:00', hoursTo: '23:00', renewable: false, status: 'Active' },
      { id: 'PL2', name: 'Daily Pass', description: 'Full-day access, flexible seating.', duration: 1, unit: 'days', price: 100, branchId: 'ALL', seatCategory: 'Standard', seatType: 'Flexible', hoursFrom: '06:00', hoursTo: '23:00', renewable: true, status: 'Active' },
      { id: 'PL3', name: 'Weekly', description: '7 days, flexible seating in standard halls.', duration: 7, unit: 'days', price: 500, branchId: 'ALL', seatCategory: 'Standard', seatType: 'Flexible', hoursFrom: '06:00', hoursTo: '23:00', renewable: true, status: 'Active' },
      { id: 'PL4', name: 'Monthly', description: '30 days with a fixed reserved AC seat.', duration: 30, unit: 'days', price: 1500, branchId: 'ALL', seatCategory: 'AC', seatType: 'Fixed', hoursFrom: '06:00', hoursTo: '23:00', renewable: true, status: 'Active' },
      { id: 'PL5', name: 'Quarterly', description: '90 days with a fixed AC seat — best value.', duration: 90, unit: 'days', price: 4000, branchId: 'ALL', seatCategory: 'AC', seatType: 'Fixed', hoursFrom: '06:00', hoursTo: '23:00', renewable: true, status: 'Active' },
      { id: 'PL6', name: 'Premium Cabin Monthly', description: 'Private cabin with locker and charging point.', duration: 30, unit: 'days', price: 2500, branchId: 'ALL', seatCategory: 'Premium Cabin', seatType: 'Fixed', hoursFrom: '06:00', hoursTo: '23:00', renewable: true, status: 'Active' },
      { id: 'PL7', name: 'Night Owl Monthly', description: 'Evening slot 6 PM – 11 PM (discontinued pilot).', duration: 30, unit: 'days', price: 900, branchId: 'BR1', seatCategory: 'Standard', seatType: 'Flexible', hoursFrom: '18:00', hoursTo: '23:00', renewable: false, status: 'Inactive' },
    ];

    // ---------- Staff ----------
    const staff = [
      { id: 'EMP01', name: 'Rohan Deshpande', mobile: '98220 10001', email: 'rohan@studynest.example', role: 'Admin', branchId: 'ALL', status: 'Active', joinedOn: addDays(today, -720) },
      { id: 'EMP02', name: 'Sneha Kulkarni', mobile: '98220 10002', email: 'sneha@studynest.example', role: 'Manager', branchId: 'BR1', status: 'Active', joinedOn: addDays(today, -540) },
      { id: 'EMP03', name: 'Amit Patil', mobile: '98220 10003', email: 'amit@studynest.example', role: 'Staff', branchId: 'BR1', status: 'Active', joinedOn: addDays(today, -300) },
      { id: 'EMP04', name: 'Kavita Joshi', mobile: '98220 10004', email: 'kavita@studynest.example', role: 'Manager', branchId: 'BR2', status: 'Active', joinedOn: addDays(today, -410) },
      { id: 'EMP05', name: 'Suresh Jadhav', mobile: '98220 10005', email: 'suresh@studynest.example', role: 'Staff', branchId: 'BR2', status: 'Active', joinedOn: addDays(today, -200) },
      { id: 'EMP06', name: 'Pooja Shinde', mobile: '98220 10006', email: 'pooja@studynest.example', role: 'Staff', branchId: 'BR2', status: 'Inactive', joinedOn: addDays(today, -150) },
    ];

    // ---------- Students ----------
    const names = [
      ['Aarav Sharma', 'M'], ['Priya Nair', 'F'], ['Vivaan Gupta', 'M'], ['Ananya Iyer', 'F'], ['Aditya Kulkarni', 'M'], ['Diya Patel', 'F'],
      ['Arjun Mehta', 'M'], ['Ishita Reddy', 'F'], ['Kabir Singh', 'M'], ['Meera Joshi', 'F'], ['Rohan Pawar', 'M'], ['Sanya Kapoor', 'F'],
      ['Yash Deshmukh', 'M'], ['Tanvi Gokhale', 'F'], ['Siddharth Rao', 'M'], ['Neha Bhosale', 'F'], ['Karan Malhotra', 'M'], ['Riya Chavan', 'F'],
      ['Omkar Salunkhe', 'M'], ['Shruti Apte', 'F'], ['Harsh Vardhan', 'M'], ['Pallavi More', 'F'], ['Nikhil Gaikwad', 'M'], ['Aditi Phadke', 'F'],
      ['Rahul Verma', 'M'], ['Sakshi Jain', 'F'], ['Varun Menon', 'M'], ['Kritika Das', 'F'], ['Pranav Kale', 'M'], ['Gauri Sathe', 'F'],
      ['Manish Yadav', 'M'], ['Rutuja Pande', 'F'], ['Tejas Wagh', 'M'], ['Swati Mane', 'F'], ['Akash Tiwari', 'M'], ['Bhavna Rane', 'F'],
    ];
    const exams = ['UPSC CSE', 'MPSC', 'CA Final', 'GATE', 'NEET PG', 'Bank PO', 'CAT', 'JEE', 'SSC CGL', 'CS Executive'];
    const areas = ['Kothrud', 'Karve Nagar', 'Erandwane', 'Deccan', 'Shivaji Nagar', 'Model Colony', 'Aundh', 'Baner', 'Warje', 'Sadashiv Peth'];
    const idTypes = ['Aadhaar Card', 'PAN Card', 'Driving Licence', 'College ID'];

    const students = names.map(([name, g], i) => {
      const first = name.split(' ')[0].toLowerCase();
      const idType = pick(idTypes);
      return {
        id: `STU${1001 + i}`,
        name,
        mobile: `${pick(['98', '97', '96', '88', '79', '70'])}${int(100, 999)} ${int(10000, 99999)}`,
        email: `${first}.${1001 + i}@mail.example`,
        dob: isoDate(new Date(int(1996, 2005), int(0, 11), int(1, 28))),
        gender: g === 'M' ? 'Male' : 'Female',
        address: `${int(1, 120)}, ${pick(['Sai', 'Shree', 'Gokul', 'Om', 'Laxmi'])} ${pick(['Apartments', 'Residency', 'Society'])}, ${pick(areas)}, Pune`,
        photo: null,
        idType,
        idNumber: idType === 'Aadhaar Card' ? `XXXX XXXX ${int(1000, 9999)}` : idType === 'PAN Card' ? `ABCPD${int(1000, 9999)}K` : `ID-${int(100000, 999999)}`,
        emergencyName: `${pick(['Ramesh', 'Sunita', 'Prakash', 'Asha', 'Vijay', 'Lata'])} ${name.split(' ')[1]}`,
        emergencyPhone: `98${int(100, 999)} ${int(10000, 99999)}`,
        notes: `Preparing for ${pick(exams)}.`,
        branchId: i % 3 === 2 ? 'BR2' : 'BR1',
        status: 'Active',
        createdAt: addDays(today, -int(20, 300)),
      };
    });

    // Scenario per student → membership timeline. Offsets are "end date relative to today".
    // a = active, s = expiring soon, x = expired, u = upcoming, p = suspended, n = no membership, h = hourly/daily flex
    const scenario = 'sasaaaxaasupaaxaahaxsaauaasaxnaaasxh';
    const memberships = [];
    const payments = [];
    let memNo = 2001, rcpNo = 1;
    const fixedPlanFor = (branchId, k) => (k % 5 === 0 ? 'PL6' : k % 3 === 0 ? 'PL5' : 'PL4');

    const freeSeat = (branchId, category, status = 'Available') =>
      seats.find((s) => s.branchId === branchId && s.category === category && s.type === 'Fixed' && s.status === status);

    function addMembership(stu, planId, start, opts = {}) {
      const plan = plans.find((p) => p.id === planId);
      const end = plan.unit === 'hours' ? start : addDays(start, plan.duration - 1);
      const m = {
        id: `MEM${memNo++}`, studentId: stu.id, planId, branchId: stu.branchId, seatId: null,
        startDate: start, endDate: end, amount: plan.price, discount: opts.discount || 0,
        override: opts.override || null, createdAt: addDays(start, -1), notes: '',
      };
      memberships.push(m);
      const net = m.amount - m.discount;
      const payDate = start > today ? addDays(today, -1) : start;
      if (opts.pending) {
        const paid = Math.round(net / 2 / 100) * 100;
        payments.push({ id: `RCP-${pad(rcpNo++).padStart(4, '0')}`, studentId: stu.id, membershipId: m.id, branchId: stu.branchId, date: payDate, amount: paid, method: pick(['Cash', 'UPI']), status: 'Paid', type: 'Payment', note: 'Part payment' });
        payments.push({ id: `RCP-${pad(rcpNo++).padStart(4, '0')}`, studentId: stu.id, membershipId: m.id, branchId: stu.branchId, date: payDate, amount: net - paid, method: '—', status: 'Pending', type: 'Payment', note: 'Balance due' });
      } else {
        payments.push({ id: `RCP-${pad(rcpNo++).padStart(4, '0')}`, studentId: stu.id, membershipId: m.id, branchId: stu.branchId, date: payDate, amount: net, method: pick(['Cash', 'UPI', 'UPI', 'Bank Transfer', 'Online Payment']), status: 'Paid', type: 'Payment', note: '' });
      }
      return m;
    }

    students.forEach((stu, i) => {
      const sc = scenario[i] || 'a';
      if (sc === 'n') { stu.status = i % 2 ? 'Inactive' : 'Active'; return; }
      if (sc === 'h') {
        addMembership(stu, i % 2 ? 'PL2' : 'PL3', addDays(today, i % 2 ? 0 : -3));
        return;
      }
      const planId = fixedPlanFor(stu.branchId, i);
      const plan = plans.find((p) => p.id === planId);
      const len = plan.duration;
      let endOffset;
      if (sc === 'a') endOffset = int(9, len - 2);
      else if (sc === 's') endOffset = int(1, 6);
      else if (sc === 'x') endOffset = -int(3, 25);
      else if (sc === 'p') endOffset = int(10, 20);
      else if (sc === 'u') endOffset = len + int(2, 6);
      const start = addDays(today, endOffset - len + 1);

      // Older, expired membership for a richer history
      if (i % 4 === 0 && sc !== 'u') addMembership(stu, 'PL4', addDays(start, -30));
      if (sc === 'u') addMembership(stu, 'PL3', addDays(start, -7));

      const m = addMembership(stu, planId, start, {
        override: sc === 'p' ? 'Suspended' : null,
        discount: i % 7 === 0 ? 200 : 0,
        pending: [1, 6, 13, 22].includes(i),
      });
      if (sc === 'x') { if (i % 2) stu.status = 'Inactive'; return; }
      const seat = freeSeat(stu.branchId, plan.seatCategory);
      if (seat) { m.seatId = seat.id; seat.studentId = stu.id; seat.status = sc === 'u' ? 'Reserved' : 'Occupied'; }
    });

    // One refund + one cancelled membership for completeness
    const cancelStu = students[29];
    const cm = addMembership(cancelStu, 'PL3', addDays(today, -10));
    cm.override = 'Cancelled';
    payments.push({ id: `RCP-${String(rcpNo++).padStart(4, '0')}`, studentId: cancelStu.id, membershipId: cm.id, branchId: cancelStu.branchId, date: addDays(today, -8), amount: -300, method: 'UPI', status: 'Refunded', type: 'Refund', note: 'Cancelled after 2 days — partial refund' });

    // ---------- Attendance: last 14 days ----------
    // Past days: normal study sessions. Today: some finished sessions plus students who
    // checked in within the last few hours and are still present.
    const attendance = [];
    let attNo = 1;
    const now = new Date();
    const nowH = now.getHours(), nowM = now.getMinutes();
    const activeMs = memberships.filter((m) => !m.override && m.startDate <= today && m.endDate >= today);
    const push = (m, day, inH, inM, outH, outM) => attendance.push({
      id: `ATT${String(attNo++).padStart(4, '0')}`, studentId: m.studentId, branchId: m.branchId, seatId: m.seatId,
      date: day, checkIn: dt(day, inH, inM), checkOut: outH == null ? null : dt(day, outH, outM), mode: 'Desk',
    });
    for (let d = 13; d >= 1; d--) {
      const day = addDays(today, -d);
      activeMs.forEach((m) => {
        if (day < m.startDate) return;
        const regular = m.studentId === 'STU1001';
        if (r() < (regular ? 0.1 : 0.3)) return;          // absent
        const inH = int(7, 13), inM = int(0, 59);
        push(m, day, inH, inM, Math.min(inH + int(3, 8), 22), int(0, 59));
      });
    }
    if (nowH >= 8) {
      activeMs.forEach((m, k) => {
        if (r() < 0.3) return;
        if (k % 3 === 0 && nowH >= 12) {                    // came in the morning, already left
          const inH = int(7, Math.min(9, nowH - 4)), outH = Math.min(inH + int(2, 4), nowH - 1);
          push(m, today, inH, int(0, 59), outH, int(0, 59));
        } else {                                            // still studying: arrived 1–4 h ago
          const back = int(40, 240);
          const t = new Date(now.getTime() - back * 60000);
          if (t.getHours() < 6 || t.getDate() !== now.getDate()) return;
          push(m, today, t.getHours(), t.getMinutes(), null, 0);
        }
      });
    }

    // ---------- Service requests ----------
    const reqSeed = [
      ['STU1001', 'AC / Ventilation', 'AC too cold near seat A03', 'The AC vent above row 1 is blowing directly on the seats. Please adjust the louvers.', 'Open', 'Medium', 0],
      ['STU1002', 'Wi-Fi / Internet', 'Wi-Fi disconnecting frequently', 'Wi-Fi drops every 15–20 minutes in the Silent Hall since Monday.', 'In Progress', 'High', -2],
      ['STU1005', 'Cleanliness', 'Washroom needs cleaning', 'Ground floor washroom was not cleaned this morning.', 'Resolved', 'Medium', -4],
      ['STU1004', 'Noise complaint', 'Loud phone calls in Focus Hall', 'Some students are taking phone calls inside the hall in the evening.', 'Open', 'Low', -1],
      ['STU1009', 'Seat-related issue', 'Seat lamp flickering', 'Desk lamp at my seat flickers constantly.', 'In Progress', 'Medium', -3],
      ['STU1003', 'Other', 'Request for locker', 'Can I get a locker along with my monthly plan?', 'Resolved', 'Low', -9],
      ['STU1012', 'Wi-Fi / Internet', 'Cannot log in to Wi-Fi portal', 'The Wi-Fi login page shows an error for my mobile number.', 'Open', 'Medium', 0],
      ['STU1008', 'AC / Ventilation', 'Premium cabin is stuffy', 'Ventilation in cabin C04 is poor after 6 PM.', 'Resolved', 'High', -12],
    ];
    const requests = reqSeed.map(([studentId, category, subject, description, status, priority, off], i) => {
      const stu = students.find((s) => s.id === studentId);
      const created = dt(addDays(today, off), 9 + i, 15);
      const updates = [{ at: created, by: stu.name, status: 'Open', text: 'Request raised.' }];
      if (status !== 'Open') updates.push({ at: dt(addDays(today, off), 12 + (i % 5), 5), by: 'Amit Patil', status: 'In Progress', text: 'Assigned to maintenance team.' });
      if (status === 'Resolved') updates.push({ at: dt(addDays(today, Math.min(off + 1, 0)), 11, 30), by: 'Sneha Kulkarni', status: 'Resolved', text: 'Issue fixed and verified with the student.' });
      return { id: `SR-${101 + i}`, studentId, branchId: stu.branchId, category, subject, description, status, priority, createdAt: created, updates };
    });

    // ---------- Seat booking requests (student portal) ----------
    const bookings = [];
    const bkSeat = seats.find((s) => s.branchId === 'BR1' && s.category === 'AC' && s.status === 'Available')
      || seats.find((s) => s.branchId === 'BR1' && s.type === 'Fixed' && s.status === 'Available');
    if (bkSeat) {
      bkSeat.status = 'Reserved';
      bookings.push({ id: 'BK-301', studentId: 'STU1011', branchId: 'BR1', hallId: bkSeat.hallId, seatId: bkSeat.id, fromDate: addDays(today, 2), status: 'Pending', createdAt: dt(addDays(today, -1), 18, 20), note: 'Prefer a seat near the window.' });
    }
    bookings.push({ id: 'BK-302', studentId: 'STU1014', branchId: 'BR2', hallId: 'BR2-A', seatId: 'SVN-A-05', fromDate: addDays(today, -6), status: 'Approved', createdAt: dt(addDays(today, -8), 11, 0), note: '' });
    bookings.push({ id: 'BK-303', studentId: 'STU1020', branchId: 'BR1', hallId: 'BR1-C', seatId: 'KTH-C-11', fromDate: addDays(today, -3), status: 'Rejected', createdAt: dt(addDays(today, -5), 16, 45), note: 'Cabin already promised to a waitlisted member.' });

    // ---------- Notifications (student portal) ----------
    const notifications = [
      { id: 'N1', studentId: 'STU1001', type: 'expiry', title: 'Membership expiring soon', body: 'Your membership expires in a few days. Renew now to keep your seat.', at: dt(today, 8, 0), read: false },
      { id: 'N2', studentId: 'ALL', type: 'announcement', title: 'Extended hours during exam season', body: 'Kothrud branch will stay open till 11:30 PM from next Monday.', at: dt(addDays(today, -1), 10, 0), read: false },
      { id: 'N3', studentId: 'STU1001', type: 'payment', title: 'Payment received', body: 'We received your payment. Receipt is available under Payments.', at: dt(addDays(today, -6), 12, 30), read: true },
      { id: 'N4', studentId: 'ALL', type: 'maintenance', title: 'Wi-Fi maintenance on Sunday', body: 'Internet will be unavailable from 7 AM to 9 AM on Sunday for router upgrade.', at: dt(addDays(today, -2), 17, 0), read: true },
      { id: 'N5', studentId: 'STU1001', type: 'booking', title: 'Seat booking confirmed', body: 'Your seat booking at Kothrud Branch has been confirmed.', at: dt(addDays(today, -24), 11, 15), read: true },
      { id: 'N6', studentId: 'ALL', type: 'announcement', title: 'Mock test series', body: 'Free weekly mock test every Saturday 10 AM in the seminar room.', at: dt(addDays(today, -4), 9, 0), read: true },
    ];

    // ---------- Recent activity feed ----------
    const activity = [
      { at: dt(today, 9, 42), icon: 'LogIn', text: 'Arjun Mehta checked in at KTH-A' },
      { at: dt(today, 9, 15), icon: 'IndianRupee', text: 'Payment ₹1,500 received from Priya Nair (UPI)' },
      { at: dt(today, 8, 50), icon: 'MessageSquareWarning', text: 'New service request SR-107 — Wi-Fi login issue' },
      { at: dt(addDays(today, -1), 18, 20), icon: 'Armchair', text: 'Seat booking request BK-301 submitted' },
      { at: dt(addDays(today, -1), 16, 5), icon: 'UserPlus', text: 'New admission — Rutuja Pande (Monthly)' },
      { at: dt(addDays(today, -1), 11, 0), icon: 'RefreshCw', text: 'Membership renewed — Kabir Singh (Quarterly)' },
    ];

    // ---------- Historical aggregates for charts (synthetic, 11 previous months) ----------
    const history = { months: [] };
    for (let k = 11; k >= 1; k--) {
      const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - k);
      const growth = 1 + (11 - k) * 0.045;
      history.months.push({
        key: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
        label: d.toLocaleString('en-IN', { month: 'short' }),
        revenue: { BR1: Math.round(20000 * growth + int(-2000, 2000)), BR2: Math.round(13000 * growth + int(-1500, 1500)) },
        newMembers: { BR1: int(3, 7), BR2: int(2, 5) },
        activeMembers: { BR1: Math.round(14 + (11 - k) * 0.5), BR2: Math.round(7 + (11 - k) * 0.3) },
        occupancy: { BR1: Math.min(95, 58 + (11 - k) * 2.5 + int(-4, 4)), BR2: Math.min(92, 46 + (11 - k) * 2.2 + int(-4, 4)) },
      });
    }

    const demoUsers = {
      admin: { role: 'admin', refId: 'EMP01', name: 'Rohan Deshpande', title: 'Owner / Administrator' },
      staff: { role: 'staff', refId: 'EMP03', name: 'Amit Patil', title: 'Front Desk — Kothrud' },
      student: { role: 'student', refId: 'STU1001', name: 'Aarav Sharma', title: 'Student — Monthly plan' },
    };

    return {
      version: 2, generatedOn: today,
      settings, branches, halls, seats, plans, staff, students, memberships, payments,
      attendance, requests, bookings, notifications, activity, history, demoUsers,
      counters: { student: 1001 + students.length, membership: memNo, receipt: rcpNo, attendance: attNo, request: 101 + requests.length, booking: 304, notification: 7 },
    };
  }

  SSC.seed = { generate, isoDate, addDays, pad };
})();
