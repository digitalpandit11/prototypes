/* ==========================================================================
   Staff panel — front-desk dashboard and student search.
   Other staff routes (check-in, seats, payments, requests, admission, renew)
   reuse the admin screens.
   ========================================================================== */
SSC.pages = SSC.pages || {};

(function () {
  const S = () => SSC.store;
  const R = SSC.rules;

  // ---------- Shared: collect payment modal ----------
  const CollectPaymentModal = {
    props: { show: Boolean, studentId: String },
    emits: ['close'],
    data() { return { method: 'Cash', amount: '', note: '', newMethod: 'UPI', error: '' }; },
    computed: {
      student() { return this.studentId ? S().get.student(this.studentId) : null; },
      dues() { return this.studentId ? S().db.payments.filter((p) => p.studentId === this.studentId && p.status === 'Pending') : []; },
      membership() { return this.studentId ? S().sel.currentMembership(this.studentId) : null; },
    },
    watch: { show(v) { if (v) { this.amount = ''; this.note = ''; this.error = ''; } } },
    methods: {
      async settle(p) {
        const ok = await this.$confirm({ title: 'Collect due?', message: `Mark ${R.inr(p.amount)} (${p.id}) as paid via ${this.method}?`, confirmText: 'Collect' });
        if (!ok) return;
        S().actions.settlePayment(p.id, this.method);
        this.$toast(`${R.inr(p.amount)} collected — receipt ${p.id}`);
      },
      record() {
        const amt = Number(this.amount);
        if (!amt || amt <= 0) { this.error = 'Enter a valid amount'; return; }
        const p = S().actions.recordPayment({ studentId: this.studentId, membershipId: this.membership ? this.membership.id : null, amount: amt, method: this.newMethod, note: this.note });
        this.$toast(`Payment ${R.inr(amt)} recorded — receipt ${p.id}`);
        this.$emit('close');
      },
    },
    template: `
      <Modal :show="show" title="Collect payment" size="md" @close="$emit('close')">
        <div v-if="student" class="space-y-5">
          <div class="flex items-center gap-3"><Avatar :name="student.name" /><div><div class="font-medium">{{ student.name }}</div><div class="text-xs text-gray-500">{{ student.id }} · {{ student.mobile }}</div></div></div>
          <div>
            <div class="text-sm font-semibold mb-2">Pending dues</div>
            <div v-if="dues.length" class="space-y-2">
              <div class="flex items-center gap-2 mb-2"><span class="text-xs text-gray-500">Collect via</span>
                <select class="select h-8 w-auto text-xs" v-model="method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Online Payment</option></select>
              </div>
              <div v-for="p in dues" :key="p.id" class="flex items-center justify-between gap-3 border border-amber-200 bg-amber-50 rounded-xl px-3 py-2.5">
                <div class="text-sm"><b>{{ $inr(p.amount) }}</b> <span class="text-xs text-gray-500">· {{ p.id }} · {{ p.note || 'Balance due' }}</span></div>
                <button class="btn btn-success btn-sm" @click="settle(p)"><Icon name="Check" :size="14" />Collect</button>
              </div>
            </div>
            <div v-else class="text-sm text-gray-500">No pending dues.</div>
          </div>
          <div class="border-t border-gray-100 pt-4">
            <div class="text-sm font-semibold mb-2">Record a new payment</div>
            <div class="grid sm:grid-cols-2 gap-3">
              <Field label="Amount (₹)" required :error="error"><input class="input" type="number" min="1" v-model="amount" placeholder="e.g. 1500" :class="{ invalid: error }" @input="error = ''" /></Field>
              <Field label="Method"><select class="select" v-model="newMethod"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Online Payment</option></select></Field>
              <div class="sm:col-span-2"><Field label="Note" :hint="membership ? 'Linked to ' + membership.id + ' (' + $sel.planName(membership.planId) + ')' : 'No membership linked'"><input class="input" v-model="note" placeholder="Optional" /></Field></div>
            </div>
          </div>
        </div>
        <template #footer>
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
          <button class="btn btn-primary" @click="record"><Icon name="IndianRupee" :size="14" />Record payment</button>
        </template>
      </Modal>`,
  };

  // ---------- Shared: quick validity + check-in panel ----------
  const QuickCheck = {
    props: { studentId: String },
    computed: {
      s() { return S().get.student(this.studentId); },
      m() { return S().sel.currentMembership(this.studentId); },
      status() { return this.s.status === 'Inactive' ? 'Inactive' : S().sel.mStatus(this.m); },
      valid() { return this.s.status !== 'Inactive' && R.isLive(S().sel.mStatus(this.m)); },
      open() { return S().sel.openAttendance(this.studentId); },
      seat() { return this.m && this.m.seatId ? S().sel.seatLabel(this.m.seatId) : 'Flexible / not allocated'; },
      dues() { return S().sel.duesOf(this.studentId); },
    },
    methods: {
      checkIn() {
        const r = S().actions.checkIn(this.studentId);
        this.$toast(r.message, r.ok ? 'success' : 'error');
      },
      checkOut() {
        const h = S().actions.checkOut(this.open.id);
        this.$toast(`${this.s.name} checked out — ${R.fmtHours(h)}`);
      },
    },
    template: `
      <div class="rounded-xl border p-4" :class="valid ? 'border-emerald-200 bg-emerald-50/40' : 'border-red-200 bg-red-50/40'">
        <div class="flex flex-wrap items-center gap-3">
          <Avatar :name="s.name" :size="40" />
          <div class="min-w-0 flex-1">
            <div class="font-medium">{{ s.name }} <span class="text-xs text-gray-500 font-normal">{{ s.id }}</span></div>
            <div class="text-xs text-gray-600">{{ m ? $sel.planName(m.planId) + ' · valid till ' + $date(m.endDate) : 'No membership' }} · Seat {{ seat }}</div>
          </div>
          <Badge :status="status" />
        </div>
        <div v-if="dues" class="text-xs text-amber-700 mt-2"><Icon name="AlertTriangle" :size="12" class="inline -mt-0.5" /> Pending dues {{ $inr(dues) }}</div>
        <div class="flex flex-wrap gap-2 mt-3">
          <button v-if="open" class="btn btn-secondary btn-sm" @click="checkOut"><Icon name="LogOut" :size="14" />Check out (in since {{ $time(open.checkIn) }})</button>
          <button v-else class="btn btn-success btn-sm" :disabled="!valid" @click="checkIn"><Icon name="LogIn" :size="14" />Check in</button>
          <router-link v-if="!valid || status === 'Expiring Soon'" :to="$link('/renew') + '?student=' + s.id" class="btn btn-primary btn-sm"><Icon name="RefreshCw" :size="14" />Renew</router-link>
          <router-link :to="$link('/students/' + s.id)" class="btn btn-ghost btn-sm">Profile</router-link>
        </div>
      </div>`,
  };

  // ======================= Staff dashboard =======================
  SSC.pages.StaffDashboard = {
    components: { QuickCheck },
    data() { return { picked: null }; },
    computed: {
      user() { return S().session.user || {}; },
      branch() { return S().ui.branch; },
      k() { return S().sel.kpis(this.branch); },
      greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; },
      present() { return S().sel.presentNow(this.branch).slice().sort((a, b) => b.checkIn.localeCompare(a.checkIn)); },
      expiring() {
        return S().db.students.filter((s) => S().sel.inBranch(s, this.branch) && s.status !== 'Inactive')
          .map((s) => ({ s, m: S().sel.currentMembership(s.id) }))
          .filter((x) => x.m && S().sel.mStatus(x.m) === 'Expiring Soon')
          .sort((a, b) => a.m.endDate.localeCompare(b.m.endDate));
      },
      requests() { return S().db.requests.filter((r) => S().sel.inBranch(r, this.branch) && r.status !== 'Resolved').slice(0, 4); },
    },
    methods: {
      checkOut(a) {
        const h = S().actions.checkOut(a.id);
        this.$toast(`${S().sel.studentName(a.studentId)} checked out — ${R.fmtHours(h)}`);
      },
      daysLeft(m) { return R.daysBetween(R.today(), m.endDate); },
    },
    template: `
      <div>
        <PageHeader :title="greeting + ', ' + (user.name || '').split(' ')[0]" :subtitle="$sel.branchName(branch) + ' · ' + $date($R.today())">
          <router-link to="/staff/checkin" class="btn btn-secondary"><Icon name="ScanLine" :size="16" />Check-in desk</router-link>
          <router-link to="/staff/admission" class="btn btn-primary"><Icon name="UserPlus" :size="16" />New admission</router-link>
        </PageHeader>

        <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          <StatCard label="Present now" :value="k.presentNow" icon="Users" tone="ok" to="/staff/checkin" />
          <StatCard label="Today's check-ins" :value="k.todaysCheckins" icon="LogIn" tone="brand" to="/staff/checkin" />
          <StatCard label="Available seats" :value="k.availableSeats" icon="Armchair" tone="info" :hint="'of ' + k.totalSeats" to="/staff/seats" />
          <StatCard label="Expiring soon" :value="k.expiringSoon" icon="CalendarClock" tone="warn" />
          <StatCard label="Pending dues" :value="$inr(k.pendingAmount)" icon="Wallet" tone="bad" :hint="k.pendingCount + ' record(s)'" to="/staff/payments" />
          <StatCard label="Open requests" :value="k.openRequests" icon="MessageSquareWarning" tone="grey" to="/staff/requests" />
        </div>

        <div class="grid lg:grid-cols-3 gap-5">
          <div class="lg:col-span-2 space-y-5">
            <div class="card card-pad">
              <div class="flex items-center justify-between mb-3">
                <div><h3 class="card-title">Quick check-in</h3><div class="card-sub">Search, validate membership, check in</div></div>
                <router-link to="/staff/checkin" class="text-xs text-brand-600 no-underline font-medium">Open desk →</router-link>
              </div>
              <StudentPicker :branch-id="branch" @select="picked = $event.id" />
              <div v-if="picked" class="mt-3"><QuickCheck :student-id="picked" :key="picked" /></div>
            </div>

            <div class="card">
              <div class="card-pad flex items-center justify-between border-b border-gray-100">
                <div><h3 class="card-title">Currently present</h3><div class="card-sub">{{ present.length }} student(s) in the centre</div></div>
              </div>
              <div v-if="present.length" class="divide-y divide-gray-100 max-h-[380px] overflow-y-auto scroll-thin">
                <div v-for="a in present" :key="a.id" class="flex items-center gap-3 px-5 py-2.5">
                  <Avatar :name="$sel.studentName(a.studentId)" :size="32" />
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium truncate">{{ $sel.studentName(a.studentId) }}</div>
                    <div class="text-xs text-gray-500">{{ a.seatId ? $sel.seatLabel(a.seatId) : 'Flexible' }} · in at {{ $time(a.checkIn) }} · {{ $hours($R.hoursBetween(a.checkIn)) }}</div>
                  </div>
                  <button class="btn btn-secondary btn-sm" @click="checkOut(a)"><Icon name="LogOut" :size="14" />Check out</button>
                </div>
              </div>
              <EmptyState v-else icon="DoorOpen" title="No one checked in right now" />
            </div>
          </div>

          <div class="space-y-5">
            <router-link v-if="k.pendingBookings" to="/staff/seats" class="card card-pad flex items-center gap-3 no-underline text-inherit hover:border-brand-200">
              <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><Icon name="Armchair" :size="20" /></div>
              <div class="flex-1"><div class="text-sm font-medium">{{ k.pendingBookings }} seat booking request(s)</div><div class="text-xs text-gray-500">Waiting for approval</div></div>
              <Icon name="ChevronRight" :size="16" class="text-gray-400" />
            </router-link>

            <div class="card">
              <div class="card-pad border-b border-gray-100"><h3 class="card-title">Expiring soon</h3><div class="card-sub">Remind and renew at the desk</div></div>
              <div v-if="expiring.length" class="divide-y divide-gray-100">
                <div v-for="x in expiring" :key="x.s.id" class="flex items-center gap-3 px-5 py-2.5">
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium truncate">{{ x.s.name }}</div>
                    <div class="text-xs text-gray-500">{{ $sel.planName(x.m.planId) }} · {{ daysLeft(x.m) }} day(s) left</div>
                  </div>
                  <router-link :to="$link('/renew') + '?student=' + x.s.id" class="btn btn-secondary btn-sm">Renew</router-link>
                </div>
              </div>
              <EmptyState v-else icon="CalendarCheck" title="No memberships expiring" />
            </div>

            <div class="card">
              <div class="card-pad border-b border-gray-100 flex items-center justify-between"><h3 class="card-title">Open service requests</h3><router-link to="/staff/requests" class="text-xs text-brand-600 no-underline font-medium">View all →</router-link></div>
              <div v-if="requests.length" class="divide-y divide-gray-100">
                <div v-for="r in requests" :key="r.id" class="px-5 py-2.5">
                  <div class="flex items-center justify-between gap-2"><div class="text-sm font-medium truncate">{{ r.subject }}</div><Badge :status="r.status" /></div>
                  <div class="text-xs text-gray-500">{{ r.id }} · {{ r.category }} · {{ $sel.studentName(r.studentId) }} · {{ $rel(r.createdAt) }}</div>
                </div>
              </div>
              <EmptyState v-else icon="CheckCircle2" title="All requests resolved" />
            </div>
          </div>
        </div>
      </div>`,
  };

  // ======================= Student search =======================
  SSC.pages.StaffSearch = {
    components: { CollectPaymentModal },
    data() { return { id: this.$route.query.student || null, payOpen: false }; },
    computed: {
      branch() { return S().ui.branch; },
      s() { return this.id ? S().get.student(this.id) : null; },
      m() { return this.id ? S().sel.currentMembership(this.id) : null; },
      status() { return this.s ? S().sel.studentStatus(this.s) : ''; },
      valid() { return this.s && this.s.status !== 'Inactive' && R.isLive(S().sel.mStatus(this.m)); },
      seat() { return this.id ? S().sel.studentSeat(this.id) : null; },
      dues() { return this.id ? S().sel.duesOf(this.id) : 0; },
      open() { return this.id ? S().sel.openAttendance(this.id) : null; },
      todayRec() { return this.id ? S().db.attendance.find((a) => a.studentId === this.id && a.date === R.today()) : null; },
      recent() {
        const seen = new Set();
        return S().db.attendance.filter((a) => S().sel.inBranch(a, this.branch) && !seen.has(a.studentId) && seen.add(a.studentId))
          .slice(0, 8).map((a) => ({ a, s: S().get.student(a.studentId) }));
      },
    },
    methods: {
      select(stu) { this.id = stu.id; },
      checkIn() { const r = S().actions.checkIn(this.id); this.$toast(r.message, r.ok ? 'success' : 'error'); },
      checkOut() { const h = S().actions.checkOut(this.open.id); this.$toast(`${this.s.name} checked out — ${R.fmtHours(h)}`); },
    },
    template: `
      <div>
        <PageHeader title="Student search" subtitle="Find a student by name, mobile number or student ID" />
        <div class="card card-pad mb-5"><StudentPicker :branch-id="branch" autofocus placeholder="Type a name, mobile number or ID (e.g. STU1001)" @select="select" /></div>

        <div v-if="s" class="grid lg:grid-cols-3 gap-5">
          <div class="card card-pad lg:col-span-1 self-start">
            <div class="flex items-center gap-4">
              <Avatar :name="s.name" :size="64" />
              <div class="min-w-0">
                <div class="text-lg font-semibold">{{ s.name }}</div>
                <div class="text-xs text-gray-500">{{ s.id }} · {{ $sel.branchName(s.branchId) }}</div>
                <div class="mt-1"><Badge :status="status" /></div>
              </div>
            </div>
            <div class="mt-5 space-y-2 text-sm">
              <div class="flex items-center gap-2 text-gray-700"><Icon name="Phone" :size="15" class="text-gray-400" />{{ s.mobile }}</div>
              <div class="flex items-center gap-2 text-gray-700"><Icon name="Mail" :size="15" class="text-gray-400" />{{ s.email || '—' }}</div>
              <div class="flex items-center gap-2 text-gray-700"><Icon name="ShieldAlert" :size="15" class="text-gray-400" />{{ s.emergencyName || '—' }} · {{ s.emergencyPhone || '—' }}</div>
            </div>
            <router-link :to="$link('/students/' + s.id)" class="btn btn-secondary w-full mt-5"><Icon name="UserRound" :size="15" />View full profile</router-link>
          </div>

          <div class="lg:col-span-2 space-y-5">
            <div class="card card-pad">
              <h3 class="card-title mb-3">Membership</h3>
              <MembershipSummary :membership="m" />
              <div class="grid sm:grid-cols-3 gap-3 mt-4">
                <div class="rounded-xl bg-gray-50 p-3"><div class="text-xs text-gray-500">Assigned seat</div><div class="font-semibold mt-0.5">{{ seat ? $sel.seatLabel(seat.id) : 'None' }}</div><div v-if="seat" class="text-[11px] text-gray-500">{{ seat.category }} · {{ seat.type }}</div></div>
                <div class="rounded-xl p-3" :class="dues ? 'bg-amber-50' : 'bg-gray-50'"><div class="text-xs text-gray-500">Pending dues</div><div class="font-semibold mt-0.5" :class="dues ? 'text-amber-700' : ''">{{ $inr(dues) }}</div></div>
                <div class="rounded-xl bg-gray-50 p-3"><div class="text-xs text-gray-500">Today</div>
                  <div class="font-semibold mt-0.5">{{ open ? 'Present' : todayRec ? 'Checked out' : 'Not checked in' }}</div>
                  <div v-if="todayRec" class="text-[11px] text-gray-500">In {{ $time(todayRec.checkIn) }}<template v-if="todayRec.checkOut"> · Out {{ $time(todayRec.checkOut) }}</template></div>
                </div>
              </div>
            </div>
            <div class="card card-pad">
              <h3 class="card-title mb-3">Actions</h3>
              <div v-if="!valid" class="text-xs text-red-600 mb-3"><Icon name="AlertCircle" :size="13" class="inline -mt-0.5" /> Membership is not valid for check-in ({{ status }}). Renew first.</div>
              <div class="flex flex-wrap gap-2">
                <button v-if="open" class="btn btn-secondary" @click="checkOut"><Icon name="LogOut" :size="15" />Check out</button>
                <button v-else class="btn btn-success" :disabled="!valid" @click="checkIn"><Icon name="LogIn" :size="15" />Check in</button>
                <router-link :to="$link('/renew') + '?student=' + s.id" class="btn btn-primary"><Icon name="RefreshCw" :size="15" />Renew</router-link>
                <button class="btn btn-secondary" @click="payOpen = true"><Icon name="IndianRupee" :size="15" />Collect payment</button>
                <router-link to="/staff/seats" class="btn btn-secondary"><Icon name="Armchair" :size="15" />Allocate seat</router-link>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="card">
          <div class="card-pad border-b border-gray-100"><h3 class="card-title">Recently seen at the desk</h3><div class="card-sub">Tap a student to open their quick card</div></div>
          <div v-if="recent.length" class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 p-4">
            <button v-for="x in recent" :key="x.s.id" class="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white hover:border-brand-200 cursor-pointer text-left font-[inherit]" @click="id = x.s.id">
              <Avatar :name="x.s.name" :size="36" />
              <div class="min-w-0"><div class="text-sm font-medium truncate">{{ x.s.name }}</div><div class="text-xs text-gray-500">{{ x.s.id }} · {{ $date(x.a.date) }}</div></div>
            </button>
          </div>
          <EmptyState v-else icon="Users" title="No recent visits" />
        </div>

        <CollectPaymentModal :show="payOpen" :student-id="id" @close="payOpen = false" />
      </div>`,
  };

})();
