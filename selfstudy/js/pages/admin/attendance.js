/* Attendance — desk check-in / check-out (Workflows 3 & 4), daily register, manual entry. */
SSC.pages = SSC.pages || {};

(function () {
  const S = SSC.store;
  const R = SSC.rules;

  SSC.pages.AttendancePage = {
    data() {
      return {
        now: Date.now(), timer: null,
        picked: null, lastResult: null,
        date: R.today(), branch: S.ui.branch, q: '', statusFilter: 'All',
        manual: false, mf: {}, mErrors: {},
      };
    },
    mounted() {
      this.timer = setInterval(() => { this.now = Date.now(); }, 30000);
      this.$watch(() => S.ui.branch, (v) => { this.branch = v; });
    },
    unmounted() { clearInterval(this.timer); },
    computed: {
      isStaff() { return this.$route.meta.role === 'staff'; },
      branchFilter() { return this.isStaff ? S.ui.branch : this.branch; },
      // ---- check-in panel ----
      pm() { return this.picked ? S.sel.currentMembership(this.picked.id) : null; },
      pmStatus() { return S.sel.mStatus(this.pm); },
      pickedOpen() { return this.picked ? S.sel.openAttendance(this.picked.id) : null; },
      pickedDues() { return this.picked ? S.sel.duesOf(this.picked.id) : 0; },
      validity() {
        if (!this.picked) return null;
        if (this.picked.status === 'Inactive') return { ok: false, text: 'Student is inactive' };
        if (!this.pm) return { ok: false, text: 'No membership on record' };
        if (R.isLive(this.pmStatus)) return { ok: true, text: `Valid till ${R.fmtDate(this.pm.endDate)} (${R.daysBetween(R.today(), this.pm.endDate)} day(s) left)` };
        return { ok: false, text: `Membership ${this.pmStatus.toLowerCase()} — renew before check-in` };
      },
      // ---- present now ----
      present() {
        this.now; // re-evaluate as time passes
        return S.sel.presentNow(this.branchFilter).map((a) => ({ ...a, name: S.sel.studentName(a.studentId), hours: R.hoursBetween(a.checkIn, null) }))
          .sort((a, b) => a.checkIn.localeCompare(b.checkIn));
      },
      // ---- register ----
      dayRecords() { return S.db.attendance.filter((a) => a.date === this.date && S.sel.inBranch(a, this.branchFilter)); },
      rows() {
        this.now;
        const q = this.q.trim().toLowerCase();
        return this.dayRecords.map((a) => {
          const stu = S.get.student(a.studentId) || {};
          return {
            ...a, name: stu.name, mobile: stu.mobile, seat: a.seatId ? S.sel.seatLabel(a.seatId) : 'Flexible',
            hours: R.hoursBetween(a.checkIn, a.checkOut), status: a.checkOut ? 'Checked Out' : 'Present',
          };
        }).filter((r) => (this.statusFilter === 'All' || r.status === this.statusFilter)
          && (!q || (r.name || '').toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q) || (r.mobile || '').replace(/\s/g, '').includes(q.replace(/\s/g, ''))));
      },
      stats() {
        const recs = this.dayRecords;
        const done = recs.filter((a) => a.checkOut);
        const avg = done.length ? done.reduce((s, a) => s + R.hoursBetween(a.checkIn, a.checkOut), 0) / done.length : null;
        const live = S.db.memberships.filter((m) => S.sel.inBranch(m, this.branchFilter) && R.isLive(S.sel.mStatus(m)));
        const attended = new Set(recs.map((a) => a.studentId));
        return { checkins: recs.length, present: recs.filter((a) => !a.checkOut).length, avg, absent: live.filter((m) => !attended.has(m.studentId)).length };
      },
      isToday() { return this.date === R.today(); },
      columns() {
        return [{ key: 'name', label: 'Student' }, { key: 'studentId', label: 'Student ID' }, { key: 'seat', label: 'Seat' },
          { key: 'checkIn', label: 'Check-in' }, { key: 'checkOut', label: 'Check-out' }, { key: 'hours', label: 'Total hours', align: 'right' },
          { key: 'status', label: 'Status' }, { key: 'mode', label: 'Mode' }, { key: 'actions', label: '', sortable: false }];
      },
    },
    methods: {
      pick(s) { this.picked = s; this.lastResult = null; },
      checkIn() {
        const res = S.actions.checkIn(this.picked.id);
        this.lastResult = res;
        S.toast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) { this.date = R.today(); setTimeout(() => { if (this.lastResult === res) { this.picked = null; this.lastResult = null; } }, 2500); }
      },
      async checkOut(a) {
        const name = S.sel.studentName(a.studentId);
        const ok = await S.confirm({ title: `Check out ${name}?`, message: `Checked in at ${R.fmtTime(a.checkIn)}. Study time will be calculated up to now.`, confirmText: 'Check out' });
        if (!ok) return;
        const h = S.actions.checkOut(a.id);
        S.toast(`${name} checked out · ${R.fmtHours(h)} studied`);
      },
      openManual() {
        this.mf = { student: null, date: this.date, inTime: '09:00', outTime: '13:00' };
        this.mErrors = {};
        this.manual = true;
      },
      saveManual() {
        const e = {};
        if (!this.mf.student) e.student = 'Select a student';
        if (!this.mf.date) e.date = 'Date is required';
        if (this.mf.date > R.today()) e.date = 'Date cannot be in the future';
        if (!this.mf.inTime) e.inTime = 'Check-in time is required';
        if (this.mf.outTime && this.mf.outTime <= this.mf.inTime) e.outTime = 'Check-out must be after check-in';
        this.mErrors = e;
        if (Object.keys(e).length) return;
        S.actions.addManualAttendance({ studentId: this.mf.student.id, date: this.mf.date, inTime: this.mf.inTime, outTime: this.mf.outTime || null });
        S.toast(`Manual attendance saved for ${this.mf.student.name}`);
        this.date = this.mf.date;
        this.manual = false;
      },
      shiftDate(n) { this.date = R.addDays(this.date, n); },
    },
    template: `
      <div>
        <PageHeader :title="isStaff ? 'Check-in / Check-out' : 'Attendance'" :subtitle="'Front-desk attendance · ' + $sel.branchName(branchFilter)">
          <button class="btn btn-secondary" @click="openManual"><Icon name="ClipboardPen" :size="16" />Manual entry</button>
        </PageHeader>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard :label="isToday ? 'Check-ins today' : 'Check-ins on ' + $date(date)" :value="stats.checkins" icon="LogIn" />
          <StatCard label="Present now" :value="present.length" icon="UserCheck" tone="ok" />
          <StatCard label="Avg. study time" :value="stats.avg == null ? '—' : $hours(stats.avg)" icon="Timer" tone="info" hint="Completed sessions" />
          <StatCard label="Members not visited" :value="stats.absent" icon="UserX" tone="warn" hint="Active members, selected date" />
        </div>

        <div class="grid lg:grid-cols-[1.1fr_1fr] gap-5 mb-5 items-start">
          <!-- Check-in panel -->
          <div class="card card-pad">
            <div class="flex items-center gap-2 mb-1"><Icon name="ScanLine" :size="18" class="text-brand-500" /><h3 class="card-title">Student check-in</h3></div>
            <p class="text-xs text-gray-500 mt-0 mb-3">Search by name, mobile or student ID. QR / RFID / biometric are future options (not in prototype).</p>
            <StudentPicker :branch-id="branchFilter" @select="pick" />

            <div v-if="picked" class="mt-4 space-y-3">
              <div class="flex items-center gap-3">
                <Avatar :name="picked.name" :size="44" />
                <div class="flex-1 min-w-0">
                  <div class="font-semibold">{{ picked.name }}</div>
                  <div class="text-xs text-gray-500">{{ picked.id }} · {{ picked.mobile }} · {{ $sel.branchName(picked.branchId) }}</div>
                </div>
                <button class="btn btn-ghost btn-icon" @click="picked = null"><Icon name="X" :size="16" /></button>
              </div>
              <div class="rounded-xl px-3 py-2.5 text-sm flex items-center gap-2" :class="validity.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                <Icon :name="validity.ok ? 'ShieldCheck' : 'ShieldAlert'" :size="18" /><span class="font-medium">{{ validity.ok ? 'Membership valid' : 'Not allowed' }}</span><span class="text-xs opacity-80">· {{ validity.text }}</span>
              </div>
              <MembershipSummary :membership="pm" compact />
              <div v-if="pickedDues" class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex items-center justify-between gap-2">
                <span><Icon name="AlertTriangle" :size="14" class="inline -mt-0.5" /> Pending dues {{ $inr(pickedDues) }}</span>
                <router-link :to="$link('/payments')" class="font-medium text-amber-900">Collect →</router-link>
              </div>
              <div v-if="pickedOpen" class="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">Already checked in at {{ $time(pickedOpen.checkIn) }}.</div>
              <div class="flex flex-wrap gap-2">
                <button v-if="!pickedOpen" class="btn btn-primary btn-lg flex-1" :disabled="!validity.ok" @click="checkIn"><Icon name="LogIn" :size="18" />Check in{{ pm && pm.seatId ? ' · Seat ' + $sel.seatLabel(pm.seatId) : '' }}</button>
                <button v-else class="btn btn-secondary btn-lg flex-1" @click="checkOut(pickedOpen)"><Icon name="LogOut" :size="18" />Check out now</button>
                <router-link v-if="!validity.ok && picked.status !== 'Inactive'" :to="$link($role() === 'staff' ? '/renew' : '/memberships/renew') + '?student=' + picked.id" class="btn btn-secondary btn-lg"><Icon name="RefreshCw" :size="16" />Renew</router-link>
              </div>
              <div v-if="lastResult && lastResult.ok" class="text-center text-sm text-emerald-700 font-medium"><Icon name="CircleCheck" :size="16" class="inline -mt-0.5" /> {{ lastResult.message }} at {{ $time(lastResult.record.checkIn) }}</div>
            </div>
            <div v-else class="mt-4 rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              <Icon name="UserSearch" :size="28" class="mx-auto mb-2" />Search a student to validate membership and check in.
            </div>
          </div>

          <!-- Present now -->
          <div class="card">
            <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div class="flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><h3 class="card-title">Currently present</h3><span class="badge badge-ok">{{ present.length }}</span></div>
              <span class="text-xs text-gray-400">Live · updates every 30s</span>
            </div>
            <div class="max-h-[420px] overflow-y-auto scroll-thin divide-y divide-gray-100">
              <div v-for="a in present" :key="a.id" class="flex items-center gap-3 px-5 py-2.5">
                <Avatar :name="a.name" :size="32" />
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium truncate">{{ a.name }}</div>
                  <div class="text-xs text-gray-500">{{ a.seatId ? $sel.seatLabel(a.seatId) : 'Flexible' }} · in {{ $time(a.checkIn) }} · <b class="text-gray-700">{{ $hours(a.hours) }}</b></div>
                </div>
                <button class="btn btn-secondary btn-sm" @click="checkOut(a)"><Icon name="LogOut" :size="14" />Check out</button>
              </div>
              <EmptyState v-if="!present.length" icon="Armchair" title="No one is checked in right now" />
            </div>
          </div>
        </div>

        <!-- Daily register -->
        <div class="card">
          <div class="flex flex-wrap items-end gap-3 px-5 py-4 border-b border-gray-100">
            <div><h3 class="card-title">Daily attendance register</h3><div class="card-sub">{{ $date(date) }} · {{ rows.length }} record(s)</div></div>
            <div class="flex-1"></div>
            <div class="flex items-center gap-1">
              <button class="btn btn-secondary btn-icon" @click="shiftDate(-1)" title="Previous day"><Icon name="ChevronLeft" :size="16" /></button>
              <input class="input h-9 w-40" type="date" v-model="date" :max="$R.today()" />
              <button class="btn btn-secondary btn-icon" :disabled="isToday" @click="shiftDate(1)" title="Next day"><Icon name="ChevronRight" :size="16" /></button>
            </div>
            <select v-if="!isStaff" class="select h-9 w-44" v-model="branch"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
            <select class="select h-9 w-36" v-model="statusFilter"><option value="All">All statuses</option><option>Present</option><option>Checked Out</option></select>
            <div class="w-60"><SearchInput v-model="q" placeholder="Name, ID or mobile" /></div>
          </div>
          <DataTable :columns="columns" :rows="rows" :page-size="12" empty-title="No attendance for this day" empty-text="Change the date or branch, or add a manual entry.">
            <template #cell-name="{ row }"><router-link :to="$link('/students/' + row.studentId)" class="flex items-center gap-2 no-underline text-gray-800 hover:text-brand-600"><Avatar :name="row.name" :size="28" /><span class="font-medium">{{ row.name }}</span></router-link></template>
            <template #cell-checkIn="{ row }">{{ $time(row.checkIn) }}</template>
            <template #cell-checkOut="{ row }">{{ row.checkOut ? $time(row.checkOut) : '—' }}</template>
            <template #cell-hours="{ row }"><span :class="row.checkOut ? 'font-medium' : 'text-gray-400'">{{ $hours(row.hours) }}</span></template>
            <template #cell-status="{ row }"><Badge :status="row.status" /></template>
            <template #cell-mode="{ row }"><span class="text-xs text-gray-500">{{ row.mode }}</span></template>
            <template #cell-actions="{ row }"><button v-if="!row.checkOut" class="btn btn-ghost btn-sm" @click="checkOut(row)">Check out</button></template>
          </DataTable>
        </div>

        <Modal :show="manual" title="Manual attendance entry" @close="manual = false">
          <div class="space-y-4">
            <Field label="Student" required :error="mErrors.student">
              <div v-if="mf.student" class="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2"><Avatar :name="mf.student.name" :size="28" /><span class="text-sm font-medium flex-1">{{ mf.student.name }} <span class="text-xs text-gray-400">{{ mf.student.id }}</span></span><button class="btn btn-ghost btn-sm" @click="mf.student = null">Change</button></div>
              <StudentPicker v-else :branch-id="branchFilter" @select="mf.student = $event" />
            </Field>
            <div class="grid sm:grid-cols-3 gap-4">
              <Field label="Date" required :error="mErrors.date"><input class="input" type="date" v-model="mf.date" :max="$R.today()" /></Field>
              <Field label="Check-in" required :error="mErrors.inTime"><input class="input" type="time" v-model="mf.inTime" /></Field>
              <Field label="Check-out" :error="mErrors.outTime" hint="Leave blank if still present"><input class="input" type="time" v-model="mf.outTime" /></Field>
            </div>
            <div class="text-xs text-gray-500">Manual entries are tagged “Manual” for audit. Use for missed check-ins or corrections.</div>
          </div>
          <template #footer><button class="btn btn-secondary" @click="manual = false">Cancel</button><button class="btn btn-primary" @click="saveManual"><Icon name="Check" :size="16" />Save entry</button></template>
        </Modal>
      </div>`,
  };
})();
