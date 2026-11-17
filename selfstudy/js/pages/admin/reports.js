/* Reports — 8 sample reports with shared date/branch filters, charts, tables, CSV export and print. */
SSC.pages = SSC.pages || {};

(function () {
  const S = SSC.store;
  const R = SSC.rules;

  const REPORTS = [
    { key: 'admission', label: 'Student Admission', icon: 'UserPlus' },
    { key: 'active', label: 'Active Membership', icon: 'IdCard' },
    { key: 'expiry', label: 'Membership Expiry', icon: 'CalendarClock' },
    { key: 'attendance', label: 'Daily Attendance', icon: 'CalendarCheck' },
    { key: 'seats', label: 'Seat Utilization', icon: 'Armchair' },
    { key: 'collection', label: 'Payment Collection', icon: 'IndianRupee' },
    { key: 'outstanding', label: 'Outstanding Payment', icon: 'Hourglass' },
    { key: 'branch', label: 'Branch Performance', icon: 'Building2' },
  ];

  // Days between from..to (inclusive), capped for chart readability.
  const dayList = (from, to) => {
    const out = [];
    let d = from;
    while (d <= to && out.length < 62) { out.push(d); d = R.addDays(d, 1); }
    return out;
  };
  const short = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  SSC.pages.ReportsPage = {
    data() {
      return { active: 'admission', from: R.addDays(R.today(), -29), to: R.today(), branch: S.ui.branch };
    },
    mounted() { this.$watch(() => S.ui.branch, (v) => { this.branch = v; }); },
    computed: {
      reports() { return REPORTS; },
      current() { return REPORTS.find((r) => r.key === this.active); },
      inB() { return (x) => S.sel.inBranch(x, this.branch); },
      inRange() { return (d) => d >= this.from && d <= this.to; },
      days() { return dayList(this.from, this.to); },

      // Every report returns { stats: [{label,value,icon,tone}], chart: {...}|null, columns, rows }
      report() { return this['r_' + this.active](); },
    },
    methods: {
      r_admission() {
        const studs = S.db.students.filter((s) => this.inB(s) && this.inRange(s.createdAt));
        const firstPlan = (s) => { const ms = S.sel.membershipsOf(s.id); return ms.length ? S.sel.planName(ms[ms.length - 1].planId) : '—'; };
        const rows = studs.map((s) => ({ id: s.id, name: s.name, mobile: s.mobile, branch: S.sel.branchName(s.branchId), date: s.createdAt, plan: firstPlan(s), status: S.sel.studentStatus(s) }))
          .sort((a, b) => b.date.localeCompare(a.date));
        const per = this.days.map((d) => studs.filter((s) => s.createdAt === d).length);
        return {
          stats: [
            { label: 'New admissions', value: rows.length, icon: 'UserPlus' },
            { label: 'Still active', value: rows.filter((r) => R.isLive(r.status)).length, icon: 'UserCheck', tone: 'ok' },
            { label: 'Avg per week', value: (rows.length / Math.max(1, this.days.length / 7)).toFixed(1), icon: 'TrendingUp', tone: 'info' },
          ],
          chart: { type: 'bar', title: 'Admissions per day', labels: this.days.map(short), datasets: [{ label: 'Admissions', data: per }] },
          columns: [{ key: 'id', label: 'Student ID' }, { key: 'name', label: 'Name' }, { key: 'mobile', label: 'Mobile' }, { key: 'branch', label: 'Branch' }, { key: 'date', label: 'Admission date', fmt: 'date' }, { key: 'plan', label: 'First plan' }, { key: 'status', label: 'Status', fmt: 'badge' }],
          rows,
        };
      },
      r_active() {
        const ms = S.db.memberships.filter((m) => this.inB(m) && R.isLive(S.sel.mStatus(m)));
        const rows = ms.map((m) => ({ id: m.id, student: S.sel.studentName(m.studentId), plan: S.sel.planName(m.planId), branch: S.sel.branchName(m.branchId), seat: m.seatId ? S.sel.seatLabel(m.seatId) : 'Flexible', start: m.startDate, end: m.endDate, amount: m.amount - m.discount, status: S.sel.mStatus(m) }));
        const byPlan = {};
        rows.forEach((r) => { byPlan[r.plan] = (byPlan[r.plan] || 0) + 1; });
        return {
          stats: [
            { label: 'Active memberships', value: rows.length, icon: 'IdCard', tone: 'ok' },
            { label: 'Fixed seats in use', value: rows.filter((r) => r.seat !== 'Flexible').length, icon: 'Armchair' },
            { label: 'Contract value', value: R.inr(rows.reduce((s, r) => s + r.amount, 0)), icon: 'IndianRupee', tone: 'info' },
          ],
          chart: { type: 'doughnut', title: 'Active memberships by plan', labels: Object.keys(byPlan), datasets: [{ label: 'Members', data: Object.values(byPlan) }] },
          columns: [{ key: 'id', label: 'Membership' }, { key: 'student', label: 'Student' }, { key: 'plan', label: 'Plan' }, { key: 'branch', label: 'Branch' }, { key: 'seat', label: 'Seat' }, { key: 'start', label: 'Start', fmt: 'date' }, { key: 'end', label: 'End', fmt: 'date' }, { key: 'amount', label: 'Amount', fmt: 'inr', align: 'right' }, { key: 'status', label: 'Status', fmt: 'badge' }],
          rows,
        };
      },
      r_expiry() {
        const t = R.today();
        const ms = S.db.memberships.filter((m) => this.inB(m) && !m.override && this.inRange(m.endDate));
        // Only the latest membership per student matters for follow-up
        const renewed = (m) => S.db.memberships.some((x) => x.studentId === m.studentId && x.id !== m.id && x.startDate > m.startDate && x.override !== 'Cancelled');
        const rows = ms.map((m) => {
          const stu = S.get.student(m.studentId);
          return { id: m.id, student: stu.name, mobile: stu.mobile, plan: S.sel.planName(m.planId), branch: S.sel.branchName(m.branchId), end: m.endDate, days: R.daysBetween(t, m.endDate), renewed: renewed(m) ? 'Renewed' : 'Not renewed', status: S.sel.mStatus(m) };
        }).sort((a, b) => a.end.localeCompare(b.end));
        const notRenewed = rows.filter((r) => r.renewed === 'Not renewed');
        return {
          stats: [
            { label: 'Expiring / expired in range', value: rows.length, icon: 'CalendarClock', tone: 'warn' },
            { label: 'Renewed', value: rows.length - notRenewed.length, icon: 'RefreshCw', tone: 'ok' },
            { label: 'Follow-up needed', value: notRenewed.length, icon: 'PhoneCall', tone: 'bad' },
            { label: 'Renewal rate', value: rows.length ? Math.round(((rows.length - notRenewed.length) / rows.length) * 100) + '%' : '—', icon: 'Percent', tone: 'info' },
          ],
          chart: null,
          columns: [{ key: 'id', label: 'Membership' }, { key: 'student', label: 'Student' }, { key: 'mobile', label: 'Mobile' }, { key: 'plan', label: 'Plan' }, { key: 'branch', label: 'Branch' }, { key: 'end', label: 'Expiry', fmt: 'date' }, { key: 'days', label: 'Days left', align: 'right' }, { key: 'renewed', label: 'Renewal', fmt: 'badgeRenew' }, { key: 'status', label: 'Status', fmt: 'badge' }],
          rows,
        };
      },
      r_attendance() {
        const recs = S.db.attendance.filter((a) => this.inB(a) && this.inRange(a.date));
        const rows = recs.map((a) => ({ id: a.id, date: a.date, student: S.sel.studentName(a.studentId), studentId: a.studentId, seat: a.seatId ? S.sel.seatLabel(a.seatId) : 'Flexible', in: R.fmtTime(a.checkIn), out: a.checkOut ? R.fmtTime(a.checkOut) : '—', hours: Number(R.hoursBetween(a.checkIn, a.checkOut).toFixed(2)), mode: a.mode }))
          .sort((a, b) => (b.date + b.in).localeCompare(a.date + a.in));
        const daysWithData = this.days.filter((d) => recs.some((a) => a.date === d) || d >= R.addDays(R.today(), -6));
        const done = recs.filter((a) => a.checkOut);
        const totalH = done.reduce((s, a) => s + R.hoursBetween(a.checkIn, a.checkOut), 0);
        return {
          stats: [
            { label: 'Check-ins', value: recs.length, icon: 'LogIn' },
            { label: 'Unique students', value: new Set(recs.map((a) => a.studentId)).size, icon: 'Users', tone: 'info' },
            { label: 'Total study hours', value: Math.round(totalH).toLocaleString('en-IN'), icon: 'Timer', tone: 'ok' },
            { label: 'Avg session', value: done.length ? R.fmtHours(totalH / done.length) : '—', icon: 'Clock', tone: 'warn' },
          ],
          chart: { type: 'bar', title: 'Check-ins per day', subtitle: 'Sample data covers the last 6 days', labels: daysWithData.map(short), datasets: [{ label: 'Check-ins', data: daysWithData.map((d) => recs.filter((a) => a.date === d).length) }] },
          columns: [{ key: 'date', label: 'Date', fmt: 'date' }, { key: 'student', label: 'Student' }, { key: 'studentId', label: 'ID' }, { key: 'seat', label: 'Seat' }, { key: 'in', label: 'In' }, { key: 'out', label: 'Out' }, { key: 'hours', label: 'Hours', fmt: 'hours', align: 'right' }, { key: 'mode', label: 'Mode' }],
          rows,
        };
      },
      r_seats() {
        const halls = S.db.halls.filter((h) => this.inB(h));
        const rows = halls.map((h) => {
          const seats = S.sel.seatsOfHall(h.id);
          const c = { Available: 0, Occupied: 0, Reserved: 0, Blocked: 0 };
          seats.forEach((s) => { c[s.status]++; });
          const usable = seats.length - c.Blocked;
          return { id: h.id, hall: h.name, code: h.code, branch: S.sel.branchName(h.branchId), type: h.type, total: seats.length, occupied: c.Occupied, reserved: c.Reserved, available: c.Available, blocked: c.Blocked, util: usable ? Math.round(((c.Occupied + c.Reserved) / usable) * 100) : 0 };
        });
        const tot = rows.reduce((a, r) => ({ total: a.total + r.total, occ: a.occ + r.occupied + r.reserved, blocked: a.blocked + r.blocked }), { total: 0, occ: 0, blocked: 0 });
        return {
          stats: [
            { label: 'Total seats', value: tot.total, icon: 'Armchair' },
            { label: 'Occupied + reserved', value: tot.occ, icon: 'UserCheck', tone: 'ok' },
            { label: 'Utilisation', value: Math.round((tot.occ / Math.max(1, tot.total - tot.blocked)) * 100) + '%', icon: 'Gauge', tone: 'info' },
            { label: 'Blocked', value: tot.blocked, icon: 'Ban', tone: 'grey' },
          ],
          chart: { type: 'bar', title: 'Seat status by hall', stacked: true, labels: rows.map((r) => r.code), datasets: [
            { label: 'Occupied', data: rows.map((r) => r.occupied), color: '#6C63FF' }, { label: 'Reserved', data: rows.map((r) => r.reserved), color: '#f59e0b' },
            { label: 'Available', data: rows.map((r) => r.available), color: '#10b981' }, { label: 'Blocked', data: rows.map((r) => r.blocked), color: '#d1d5db' }] },
          columns: [{ key: 'hall', label: 'Hall' }, { key: 'code', label: 'Code' }, { key: 'branch', label: 'Branch' }, { key: 'type', label: 'Type' }, { key: 'total', label: 'Seats', align: 'right' }, { key: 'occupied', label: 'Occupied', align: 'right' }, { key: 'reserved', label: 'Reserved', align: 'right' }, { key: 'available', label: 'Available', align: 'right' }, { key: 'blocked', label: 'Blocked', align: 'right' }, { key: 'util', label: 'Utilisation', fmt: 'pct', align: 'right' }],
          rows,
        };
      },
      r_collection() {
        const pays = S.db.payments.filter((p) => this.inB(p) && this.inRange(p.date) && p.status !== 'Pending');
        const rows = pays.map((p) => ({ id: p.id, date: p.date, student: S.sel.studentName(p.studentId), branch: S.sel.branchName(p.branchId), method: p.method, type: p.type, amount: p.amount, status: p.status })).sort((a, b) => b.date.localeCompare(a.date));
        const paid = pays.filter((p) => p.status === 'Paid');
        const methods = ['Cash', 'UPI', 'Bank Transfer', 'Online Payment'];
        return {
          stats: [
            { label: 'Gross collection', value: R.inr(paid.reduce((s, p) => s + p.amount, 0)), icon: 'IndianRupee', tone: 'ok' },
            { label: 'Refunds', value: R.inr(Math.abs(pays.filter((p) => p.status === 'Refunded').reduce((s, p) => s + p.amount, 0))), icon: 'Undo2', tone: 'info' },
            { label: 'Net collection', value: R.inr(pays.reduce((s, p) => s + p.amount, 0)), icon: 'Wallet' },
            { label: 'Receipts', value: paid.length, icon: 'Receipt', tone: 'grey' },
          ],
          chart: { type: 'doughnut', title: 'Collection by payment method', money: true, labels: methods, datasets: [{ label: 'Amount', data: methods.map((m) => paid.filter((p) => p.method === m).reduce((s, p) => s + p.amount, 0)) }] },
          columns: [{ key: 'id', label: 'Receipt' }, { key: 'date', label: 'Date', fmt: 'date' }, { key: 'student', label: 'Student' }, { key: 'branch', label: 'Branch' }, { key: 'type', label: 'Type' }, { key: 'method', label: 'Method' }, { key: 'amount', label: 'Amount', fmt: 'inr', align: 'right' }, { key: 'status', label: 'Status', fmt: 'badge' }],
          rows,
        };
      },
      r_outstanding() {
        const dues = S.db.payments.filter((p) => this.inB(p) && p.status === 'Pending');
        const t = R.today();
        const rows = dues.map((p) => {
          const stu = S.get.student(p.studentId);
          const m = p.membershipId ? S.get.membership(p.membershipId) : null;
          return { id: p.id, student: stu.name, mobile: stu.mobile, branch: S.sel.branchName(p.branchId), plan: m ? S.sel.planName(m.planId) : '—', since: p.date, age: R.daysBetween(p.date, t), amount: p.amount };
        }).sort((a, b) => b.age - a.age);
        const bucket = (lo, hi) => rows.filter((r) => r.age >= lo && r.age <= hi).reduce((s, r) => s + r.amount, 0);
        return {
          stats: [
            { label: 'Total outstanding', value: R.inr(rows.reduce((s, r) => s + r.amount, 0)), icon: 'Hourglass', tone: 'warn' },
            { label: 'Students with dues', value: new Set(dues.map((p) => p.studentId)).size, icon: 'Users', tone: 'bad' },
            { label: 'Oldest due', value: rows.length ? rows[0].age + ' days' : '—', icon: 'CalendarX', tone: 'grey' },
          ],
          chart: { type: 'bar', title: 'Ageing of dues', money: true, labels: ['0–7 days', '8–15 days', '16–30 days', '30+ days'], datasets: [{ label: 'Outstanding', data: [bucket(0, 7), bucket(8, 15), bucket(16, 30), bucket(31, 9999)], color: '#f59e0b' }] },
          columns: [{ key: 'id', label: 'Due ref' }, { key: 'student', label: 'Student' }, { key: 'mobile', label: 'Mobile' }, { key: 'branch', label: 'Branch' }, { key: 'plan', label: 'Membership' }, { key: 'since', label: 'Due since', fmt: 'date' }, { key: 'age', label: 'Age (days)', align: 'right' }, { key: 'amount', label: 'Amount', fmt: 'inr', align: 'right' }],
          rows,
          note: 'Outstanding dues are shown as of today (date range not applied).',
        };
      },
      r_branch() {
        const rows = S.db.branches.map((b) => {
          const inb = (x) => x.branchId === b.id;
          const seats = S.db.seats.filter(inb);
          const usable = seats.filter((s) => s.status !== 'Blocked').length;
          const occ = seats.filter((s) => s.status === 'Occupied' || s.status === 'Reserved').length;
          const pays = S.db.payments.filter((p) => inb(p) && this.inRange(p.date) && p.status !== 'Pending');
          return {
            id: b.id, branch: b.name, students: S.db.students.filter(inb).length,
            active: S.db.memberships.filter((m) => inb(m) && R.isLive(S.sel.mStatus(m))).length,
            admissions: S.db.students.filter((s) => inb(s) && this.inRange(s.createdAt)).length,
            revenue: pays.reduce((s, p) => s + p.amount, 0),
            dues: S.db.payments.filter((p) => inb(p) && p.status === 'Pending').reduce((s, p) => s + p.amount, 0),
            checkins: S.db.attendance.filter((a) => inb(a) && this.inRange(a.date)).length,
            util: usable ? Math.round((occ / usable) * 100) : 0,
            requests: S.db.requests.filter((r) => inb(r) && r.status !== 'Resolved').length,
          };
        });
        const series = S.db.branches.map((b) => ({ label: b.name, data: S.sel.monthlySeries(b.id).map((m) => m.revenue) }));
        return {
          stats: rows.map((r, i) => ({ label: r.branch + ' revenue', value: R.inr(r.revenue), icon: 'Building2', tone: i ? 'info' : 'brand' })),
          chart: { type: 'line', title: 'Monthly revenue by branch (12 months)', money: true, labels: S.sel.monthlySeries('ALL').map((m) => m.label), datasets: series },
          columns: [{ key: 'branch', label: 'Branch' }, { key: 'students', label: 'Students', align: 'right' }, { key: 'active', label: 'Active members', align: 'right' }, { key: 'admissions', label: 'Admissions', align: 'right' }, { key: 'revenue', label: 'Revenue (range)', fmt: 'inr', align: 'right' }, { key: 'dues', label: 'Dues', fmt: 'inr', align: 'right' }, { key: 'checkins', label: 'Check-ins', align: 'right' }, { key: 'util', label: 'Seat util.', fmt: 'pct', align: 'right' }, { key: 'requests', label: 'Open requests', align: 'right' }],
          rows,
          note: 'Branch filter is ignored — this report compares all branches.',
        };
      },
      fmt(col, v) {
        if (v == null || v === '') return '—';
        if (col.fmt === 'date') return R.fmtDate(v);
        if (col.fmt === 'inr') return R.inr(v);
        if (col.fmt === 'pct') return v + '%';
        if (col.fmt === 'hours') return R.fmtHours(v);
        return v;
      },
      setRange(days) { this.to = R.today(); this.from = R.addDays(R.today(), -days); },
      exportCsv() {
        const { columns, rows } = this.report;
        const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
        const lines = [columns.map((c) => esc(c.label)).join(',')];
        rows.forEach((r) => lines.push(columns.map((c) => esc(c.fmt === 'inr' || c.fmt === 'pct' || c.fmt === 'hours' ? r[c.key] : this.fmt(c, r[c.key]))).join(',')));
        const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${this.current.label.replace(/\s+/g, '-').toLowerCase()}-${this.from}-to-${this.to}.csv`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        S.toast(`${this.current.label} report exported (${rows.length} rows)`);
      },
      print() { window.print(); },
      slotName(k) { return 'cell-' + k; },
    },
    template: `
      <div>
        <PageHeader title="Reports" :subtitle="current.label + ' report · ' + $date(from) + ' – ' + $date(to) + ' · ' + $sel.branchName(branch)">
          <button class="btn btn-secondary no-print" @click="exportCsv"><Icon name="FileSpreadsheet" :size="16" />Export CSV</button>
          <button class="btn btn-secondary no-print" @click="print"><Icon name="Printer" :size="16" />Print</button>
        </PageHeader>

        <div class="card card-pad mb-5 no-print flex flex-wrap items-end gap-3">
          <Field label="From"><input class="input h-9 w-40" type="date" v-model="from" :max="to" /></Field>
          <Field label="To"><input class="input h-9 w-40" type="date" v-model="to" :min="from" /></Field>
          <div class="flex gap-1 pb-0.5"><button class="chip" @click="setRange(6)">7 days</button><button class="chip" @click="setRange(29)">30 days</button><button class="chip" @click="setRange(89)">90 days</button></div>
          <Field label="Branch"><select class="select h-9 w-48" v-model="branch"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></Field>
        </div>

        <div class="grid lg:grid-cols-[230px_1fr] gap-5 items-start">
          <nav class="card p-2 no-print lg:sticky lg:top-20 flex lg:flex-col gap-1 overflow-x-auto scroll-thin">
            <button v-for="r in reports" :key="r.key" class="nav-link border-0 bg-transparent cursor-pointer text-left whitespace-nowrap font-[inherit]" :class="{ 'router-link-active': active === r.key }" @click="active = r.key">
              <Icon :name="r.icon" :size="16" />{{ r.label }}
            </button>
          </nav>

          <div class="space-y-5 min-w-0 print-area">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard v-for="s in report.stats" :key="s.label" :label="s.label" :value="s.value" :icon="s.icon" :tone="s.tone || 'brand'" />
            </div>
            <ChartCard v-if="report.chart" :key="active" :title="report.chart.title" :subtitle="report.chart.subtitle" :type="report.chart.type" :labels="report.chart.labels" :datasets="report.chart.datasets" :money="report.chart.money" :stacked="report.chart.stacked" :height="report.chart.type === 'doughnut' ? 220 : 240" />
            <div class="card">
              <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div><h3 class="card-title">{{ current.label }}</h3><div class="card-sub">{{ report.rows.length }} row(s)<span v-if="report.note"> · {{ report.note }}</span></div></div>
              </div>
              <DataTable :key="active" :columns="report.columns" :rows="report.rows" :page-size="10" empty-title="No data for this range">
                <template v-for="c in report.columns" :key="c.key" #[slotName(c.key)]="{ row }">
                  <Badge v-if="c.fmt === 'badge'" :status="row[c.key]" />
                  <Badge v-else-if="c.fmt === 'badgeRenew'" :status="row[c.key]" :tone="row[c.key] === 'Renewed' ? 'ok' : 'bad'" />
                  <span v-else>{{ fmt(c, row[c.key]) }}</span>
                </template>
              </DataTable>
            </div>
          </div>
        </div>
      </div>`,
  };
})();
