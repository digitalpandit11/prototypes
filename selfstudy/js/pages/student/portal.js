/* ==========================================================================
   Student portal — mobile-first. The logged-in student is session.user.refId.
   ========================================================================== */
SSC.pages = SSC.pages || {};

(function () {
  const S = () => SSC.store;
  const R = SSC.rules;

  // Common computed helpers for every portal page
  const me = {
    computed: {
      meId() { return (S().session.user || {}).refId; },
      me() { return S().get.student(this.meId) || {}; },
      current() { return S().sel.currentMembership(this.meId); },
      currentStatus() { return S().sel.mStatus(this.current); },
    },
  };

  const PAY_METHODS = [
    { key: 'UPI', icon: 'Smartphone', label: 'UPI' },
    { key: 'Card', icon: 'CreditCard', label: 'Debit / Credit card' },
    { key: 'Net Banking', icon: 'Landmark', label: 'Net banking' },
  ];

  // ---------- Simulated online payment block (shared by renewal + dues) ----------
  const FakeGateway = {
    props: { amount: Number, busy: Boolean, modelValue: String },
    emits: ['update:modelValue'],
    data() { return { methods: PAY_METHODS }; },
    template: `
      <div>
        <div class="label">Pay with</div>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="pm in methods" :key="pm.key" type="button" class="rounded-xl border p-3 text-center cursor-pointer bg-white font-[inherit] text-xs"
            :class="modelValue === pm.key ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600'" @click="$emit('update:modelValue', pm.key)">
            <Icon :name="pm.icon" :size="20" class="mx-auto mb-1" />{{ pm.label }}
          </button>
        </div>
        <div class="text-[11px] text-gray-400 mt-2"><Icon name="Lock" :size="11" class="inline -mt-0.5" /> Simulated payment — no gateway is connected in this prototype.</div>
      </div>`,
  };

  // ---------- Renewal / upgrade modal ----------
  const RenewModal = {
    mixins: [me],
    components: { FakeGateway },
    props: { show: Boolean, planId: String, mode: { type: String, default: 'renew' } },
    emits: ['close'],
    data() { return { plan: null, method: 'UPI', busy: false, done: null }; },
    watch: { show(v) { if (v) { this.plan = this.planId || (this.current && this.current.planId) || this.plans[0].id; this.busy = false; this.done = null; } } },
    computed: {
      plans() { return S().sel.plansFor(this.me.branchId).filter((p) => p.renewable); },
      planObj() { return S().get.plan(this.plan); },
      startDate() { return R.renewalStartDate(this.current && R.isLive(this.currentStatus) ? this.current : null, S().db.settings.renewalStart); },
      endDate() { return this.planObj ? R.endDateFor(this.planObj, this.startDate) : null; },
      calc() { return R.calcAmount(this.planObj, null, S().db.settings); },
    },
    methods: {
      pay() {
        this.busy = true;
        setTimeout(() => {
          const m = S().actions.renewMembership({ studentId: this.meId, planId: this.plan, startDate: this.startDate });
          const p = S().actions.recordPayment({ studentId: this.meId, membershipId: m.id, amount: this.calc.total, method: 'Online Payment', note: `Paid via ${this.method} (simulated)` });
          this.busy = false;
          this.done = { m, p };
          this.$toast(`Payment successful — ${R.inr(p.amount)}. Membership renewed.`);
        }, 1200);
      },
    },
    template: `
      <Modal :show="show" :title="done ? 'Renewal confirmed' : 'Renew membership'" size="md" @close="$emit('close')">
        <div v-if="done" class="text-center py-2">
          <div class="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto mb-3"><Icon name="CheckCircle2" :size="30" /></div>
          <div class="font-semibold text-lg">{{ $sel.planName(done.m.planId) }}</div>
          <div class="text-sm text-gray-500">{{ $date(done.m.startDate) }} → {{ $date(done.m.endDate) }}</div>
          <div class="text-sm mt-3">Paid <b>{{ $inr(done.p.amount) }}</b> · Receipt <b>{{ done.p.id }}</b></div>
          <router-link :to="'/student/receipt/' + done.p.id" class="btn btn-secondary btn-sm mt-4"><Icon name="Receipt" :size="14" />View receipt</router-link>
        </div>
        <div v-else class="space-y-4">
          <Field label="Plan">
            <select class="select" v-model="plan"><option v-for="p in plans" :key="p.id" :value="p.id">{{ p.name }} — {{ $inr(p.price) }} / {{ $R.durationLabel(p) }}</option></select>
          </Field>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="rounded-xl bg-gray-50 p-3"><div class="text-xs text-gray-500">Starts</div><div class="font-medium">{{ $date(startDate) }}</div></div>
            <div class="rounded-xl bg-gray-50 p-3"><div class="text-xs text-gray-500">Valid till</div><div class="font-medium">{{ $date(endDate) }}</div></div>
          </div>
          <div class="text-[11px] text-gray-500">Sample rule: renewal starts the day after your current membership ends (to be confirmed).</div>
          <div class="rounded-xl border border-gray-200 p-3 text-sm space-y-1">
            <div class="flex justify-between"><span class="text-gray-500">Plan fee</span><span>{{ $inr(calc.base) }}</span></div>
            <div class="flex justify-between font-semibold text-base pt-1 border-t border-gray-100"><span>Total payable</span><span>{{ $inr(calc.total) }}</span></div>
          </div>
          <FakeGateway v-model="method" />
        </div>
        <template #footer>
          <button v-if="done" class="btn btn-primary" @click="$emit('close')">Done</button>
          <template v-else>
            <button class="btn btn-secondary" :disabled="busy" @click="$emit('close')">Cancel</button>
            <button class="btn btn-primary" :disabled="busy || !planObj" @click="pay">
              <Icon v-if="busy" name="Loader2" :size="15" class="animate-spin" />{{ busy ? 'Processing…' : 'Pay ' + $inr(calc.total) }}
            </button>
          </template>
        </template>
      </Modal>`,
  };

  // ======================= Dashboard =======================
  SSC.pages.StudentDashboard = {
    mixins: [me],
    components: { RenewModal },
    data() { return { renew: false }; },
    computed: {
      firstName() { return (this.me.name || '').split(' ')[0]; },
      seat() { return S().sel.studentSeat(this.meId); },
      todayRec() { return S().db.attendance.find((a) => a.studentId === this.meId && a.date === R.today()); },
      monthHours() {
        const key = R.today().slice(0, 7);
        return S().sel.attendanceOf(this.meId).filter((a) => a.date.startsWith(key)).reduce((s, a) => s + (R.hoursBetween(a.checkIn, a.checkOut) || 0), 0);
      },
      dues() { return S().sel.duesOf(this.meId); },
      notes() { return S().sel.notificationsFor(this.meId).slice(0, 3); },
      daysLeft() { return this.current ? R.daysBetween(R.today(), this.current.endDate) : 0; },
      showRenew() { return ['Expiring Soon', 'Expired', 'None'].includes(this.currentStatus) || !this.current; },
    },
    methods: { nIcon(t) { return NOTE_ICON[t] || 'Bell'; } },
    template: `
      <div class="space-y-4">
        <div>
          <div class="text-sm text-gray-500">Welcome back,</div>
          <h1 class="text-2xl font-semibold m-0">{{ firstName }} 👋</h1>
        </div>

        <div v-if="showRenew && current" class="rounded-2xl p-4 flex items-center gap-3" :class="currentStatus === 'Expired' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'">
          <Icon name="CalendarClock" :size="22" />
          <div class="flex-1 text-sm">
            <b v-if="currentStatus === 'Expired'">Your membership has expired.</b>
            <b v-else>Your membership expires in {{ daysLeft }} day(s)</b>
            <div class="text-xs opacity-80">Expiry: {{ $date(current.endDate) }} · renew to keep your seat</div>
          </div>
          <button class="btn btn-primary btn-sm" @click="renew = true">Renew</button>
        </div>

        <MembershipSummary :membership="current" />

        <div class="grid grid-cols-2 gap-3">
          <div class="card p-4">
            <div class="text-xs text-gray-500 flex items-center gap-1"><Icon name="MapPin" :size="13" />Branch</div>
            <div class="font-semibold text-sm mt-1">{{ $sel.branchName(me.branchId) }}</div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-gray-500 flex items-center gap-1"><Icon name="Armchair" :size="13" />Seat</div>
            <div class="font-semibold text-sm mt-1">{{ seat ? $sel.seatLabel(seat.id) : 'Flexible' }}</div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-gray-500 flex items-center gap-1"><Icon name="CalendarCheck" :size="13" />Today</div>
            <div class="font-semibold text-sm mt-1" :class="todayRec ? 'text-emerald-600' : 'text-gray-700'">
              {{ todayRec ? (todayRec.checkOut ? 'Checked out' : 'Checked in') : 'Not checked in' }}
            </div>
            <div v-if="todayRec" class="text-[11px] text-gray-500">at {{ $time(todayRec.checkOut || todayRec.checkIn) }}</div>
          </div>
          <div class="card p-4">
            <div class="text-xs text-gray-500 flex items-center gap-1"><Icon name="Timer" :size="13" />Study hours</div>
            <div class="font-semibold text-sm mt-1">{{ $hours(monthHours) }}</div>
            <div class="text-[11px] text-gray-500">this month</div>
          </div>
        </div>

        <router-link v-if="dues" to="/student/payments" class="card p-4 flex items-center gap-3 no-underline text-inherit border-amber-200">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 grid place-items-center"><Icon name="Wallet" :size="20" /></div>
          <div class="flex-1"><div class="text-xs text-gray-500">Pending payment</div><div class="font-semibold">{{ $inr(dues) }}</div></div>
          <span class="btn btn-primary btn-sm">Pay now</span>
        </router-link>

        <div class="card">
          <div class="flex items-center justify-between px-4 pt-4 pb-2"><h3 class="card-title">Notifications</h3><router-link to="/student/notifications" class="text-xs text-brand-600 no-underline font-medium">See all</router-link></div>
          <div class="divide-y divide-gray-100">
            <div v-for="n in notes" :key="n.id" class="flex gap-3 px-4 py-3">
              <div class="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 grid place-items-center shrink-0"><Icon :name="nIcon(n.type)" :size="16" /></div>
              <div class="min-w-0"><div class="text-sm font-medium">{{ n.title }}</div><div class="text-xs text-gray-500 line-clamp-2">{{ n.body }}</div><div class="text-[11px] text-gray-400 mt-0.5">{{ $rel(n.at) }}</div></div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-2">
          <router-link v-for="q in [['Armchair','Book seat','/student/book'],['IdCard','Plans','/student/membership'],['LifeBuoy','Help','/student/requests'],['CalendarCheck','Attendance','/student/attendance']]" :key="q[2]" :to="q[2]" class="card py-3 flex flex-col items-center gap-1 no-underline text-gray-700 text-xs font-medium">
            <Icon :name="q[0]" :size="20" class="text-brand-500" />{{ q[1] }}
          </router-link>
        </div>

        <RenewModal :show="renew" @close="renew = false" />
      </div>`,
  };

  // ======================= My Membership =======================
  SSC.pages.MyMembership = {
    mixins: [me],
    components: { RenewModal },
    data() { return { renew: false, renewPlan: null }; },
    computed: {
      history() { return S().sel.membershipsOf(this.meId); },
      plans() { return S().sel.plansFor(this.me.branchId); },
      daysLeft() { return this.current ? R.daysBetween(R.today(), this.current.endDate) : 0; },
    },
    methods: {
      openRenew(p) { this.renewPlan = p ? p.id : null; this.renew = true; },
      async upgrade(p) {
        const ok = await this.$confirm({ title: `Request upgrade to ${p.name}?`, message: 'The centre will review your request and confirm the price difference and seat. (Prototype: this creates a request for the admin.)', confirmText: 'Send request' });
        if (!ok) return;
        S().actions.createRequest(this.meId, { category: 'Other', subject: `Plan upgrade request — ${p.name}`, description: `Current plan: ${this.current ? S().sel.planName(this.current.planId) : 'none'}. Requested: ${p.name} (${R.inr(p.price)}).`, priority: 'Low' });
        this.$toast('Upgrade request sent to the centre');
      },
      status(m) { return S().sel.mStatus(m); },
    },
    template: `
      <div class="space-y-5">
        <PageHeader title="My membership" subtitle="Validity, history and available plans" />
        <div class="card card-pad">
          <MembershipSummary :membership="current" />
          <div v-if="current" class="grid grid-cols-3 gap-2 mt-4 text-center">
            <div class="rounded-xl bg-gray-50 py-3"><div class="text-lg font-semibold">{{ Math.max(daysLeft, 0) }}</div><div class="text-[11px] text-gray-500">days left</div></div>
            <div class="rounded-xl bg-gray-50 py-3"><div class="text-sm font-semibold">{{ $get.plan(current.planId).seatType }}</div><div class="text-[11px] text-gray-500">seating</div></div>
            <div class="rounded-xl bg-gray-50 py-3"><div class="text-sm font-semibold">{{ $get.plan(current.planId).hoursFrom }}–{{ $get.plan(current.planId).hoursTo }}</div><div class="text-[11px] text-gray-500">hours</div></div>
          </div>
          <button class="btn btn-primary btn-lg w-full mt-4" @click="openRenew()"><Icon name="RefreshCw" :size="16" />Renew membership</button>
        </div>

        <div>
          <h3 class="card-title mb-3">Available plans</h3>
          <div class="grid sm:grid-cols-2 gap-3">
            <div v-for="p in plans" :key="p.id" class="card p-4 flex flex-col">
              <div class="flex items-start justify-between gap-2">
                <div><div class="font-semibold">{{ p.name }}</div><div class="text-xs text-gray-500">{{ $R.durationLabel(p) }} · {{ p.seatCategory }} · {{ p.seatType }}</div></div>
                <div class="text-lg font-semibold text-brand-600">{{ $inr(p.price) }}</div>
              </div>
              <div class="text-xs text-gray-500 mt-2 flex-1">{{ p.description }}</div>
              <div class="flex gap-2 mt-3">
                <button v-if="p.renewable" class="btn btn-secondary btn-sm flex-1" @click="openRenew(p)">Renew with this</button>
                <button v-if="current && p.id !== current.planId && p.price > $get.plan(current.planId).price" class="btn btn-ghost btn-sm flex-1" @click="upgrade(p)">Request upgrade</button>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="px-4 pt-4 pb-2"><h3 class="card-title">Membership history</h3></div>
          <div class="divide-y divide-gray-100">
            <div v-for="m in history" :key="m.id" class="flex items-center gap-3 px-4 py-3">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium">{{ $sel.planName(m.planId) }} <span class="text-xs text-gray-400">{{ m.id }}</span></div>
                <div class="text-xs text-gray-500">{{ $date(m.startDate) }} → {{ $date(m.endDate) }} · {{ $inr(m.amount - m.discount) }}</div>
              </div>
              <Badge :status="status(m)" />
            </div>
          </div>
          <EmptyState v-if="!history.length" icon="IdCard" title="No memberships yet" />
        </div>

        <RenewModal :show="renew" :plan-id="renewPlan" @close="renew = false" />
      </div>`,
  };

  // ======================= Book a seat (Workflow 6) =======================
  SSC.pages.BookSeat = {
    mixins: [me],
    data() {
      const stu = S().get.student((S().session.user || {}).refId) || {};
      const halls = S().sel.hallsOf(stu.branchId);
      const hall = halls.find((h) => S().sel.seatsOfHall(h.id).some((x) => x.status === 'Available')) || halls[0];
      return { branch: stu.branchId, hall: hall ? hall.id : null, seatId: null, fromDate: R.today(), note: '', submitted: null };
    },
    watch: { hall() { this.seatId = null; } },
    computed: {
      allowed() { return S().db.settings.allowStudentBooking; },
      hallObj() { return S().get.hall(this.hall); },
      seats() { return this.hall ? S().sel.seatsOfHall(this.hall) : []; },
      counts() { return this.seats.reduce((c, s) => { c[s.status] = (c[s.status] || 0) + 1; return c; }, {}); },
      seat() { return this.seatId ? S().get.seat(this.seatId) : null; },
      step() { return this.submitted ? 2 : this.seatId ? 1 : 0; },
      myBookings() { return S().db.bookings.filter((b) => b.studentId === this.meId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); },
      categories() { return [...new Set(this.seats.map((s) => s.category + ' · ' + s.type))]; },
    },
    methods: {
      pick(s) { this.seatId = s.id; this.$nextTick(() => { const el = this.$refs.confirm; if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }); },
      submit() {
        if (!this.fromDate || this.fromDate < R.today()) { this.$toast('Choose today or a future date', 'error'); return; }
        this.submitted = S().actions.createBooking(this.meId, { seatId: this.seatId, fromDate: this.fromDate, note: this.note });
        this.$toast(`Booking request ${this.submitted.id} submitted`);
      },
      again() { this.submitted = null; this.seatId = null; this.note = ''; },
    },
    template: `
      <div class="space-y-5">
        <PageHeader title="Book a seat" subtitle="Pick a branch, hall and an available seat" />
        <div v-if="!allowed" class="card card-pad"><EmptyState icon="Lock" title="Online seat booking is turned off" text="Please contact the front desk to change or book a seat." /></div>
        <template v-else>
          <div class="card card-pad"><Stepper :steps="['Choose hall', 'Pick seat', 'Request sent']" :current="step" /></div>

          <div v-if="submitted" class="card card-pad text-center">
            <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mx-auto mb-3"><Icon name="CheckCircle2" :size="34" /></div>
            <h2 class="text-lg font-semibold m-0">Booking request submitted</h2>
            <p class="text-sm text-gray-500 mt-1">The front desk will confirm your seat shortly. You'll get a notification.</p>
            <div class="max-w-xs mx-auto mt-4 text-left rounded-xl bg-gray-50 p-4 text-sm space-y-1.5">
              <div class="flex justify-between"><span class="text-gray-500">Request ID</span><b>{{ submitted.id }}</b></div>
              <div class="flex justify-between"><span class="text-gray-500">Seat</span><b>{{ $sel.seatLabel(submitted.seatId) }}</b></div>
              <div class="flex justify-between"><span class="text-gray-500">Branch</span><b>{{ $sel.branchName(submitted.branchId) }}</b></div>
              <div class="flex justify-between"><span class="text-gray-500">From</span><b>{{ $date(submitted.fromDate) }}</b></div>
              <div class="flex justify-between items-center"><span class="text-gray-500">Status</span><Badge :status="submitted.status" /></div>
            </div>
            <button class="btn btn-secondary mt-5" @click="again">Book another seat</button>
          </div>

          <template v-else>
            <div class="card card-pad"><HallPicker v-model:branch="branch" v-model:hall="hall" /></div>
            <div v-if="hallObj" class="card card-pad">
              <div class="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div><h3 class="card-title">{{ hallObj.name }} <span class="text-xs text-gray-400 font-normal">{{ hallObj.code }} · Floor {{ hallObj.floor }}</span></h3>
                  <div class="card-sub">{{ hallObj.type }} · {{ hallObj.openTime }}–{{ hallObj.closeTime }} · Seat types: {{ categories.join(', ') }}</div></div>
              </div>
              <SeatLegend :counts="counts" class="mb-4" />
              <div class="max-w-2xl"><SeatGrid :seats="seats" :cols="hallObj.cols" mode="select" :selected-id="seatId" :show-student="false" @select="pick" /></div>
              <div class="text-[11px] text-gray-400 mt-3">Tap a green seat to select it. Booking conflict and reservation rules will be finalised with the centre.</div>
            </div>

            <div v-if="seat" ref="confirm" class="card card-pad border-brand-200">
              <h3 class="card-title mb-3">Confirm request</h3>
              <div class="flex items-center gap-3 mb-4">
                <div class="seat available selected w-16 shrink-0">{{ seat.number }}</div>
                <div class="text-sm"><div class="font-medium">{{ $sel.seatLabel(seat.id) }}</div><div class="text-xs text-gray-500">{{ seat.category }} · {{ seat.type }} seat · {{ $sel.branchName(seat.branchId) }}</div></div>
              </div>
              <div class="grid sm:grid-cols-2 gap-3">
                <Field label="From date" required><input type="date" class="input h-11" v-model="fromDate" :min="$R.today()" /></Field>
                <Field label="Note for the desk"><input class="input h-11" v-model="note" placeholder="Optional, e.g. near window" /></Field>
              </div>
              <div class="flex gap-2 mt-4">
                <button class="btn btn-secondary btn-lg" @click="seatId = null">Change</button>
                <button class="btn btn-primary btn-lg flex-1" @click="submit"><Icon name="Send" :size="16" />Submit booking request</button>
              </div>
            </div>
          </template>

          <div class="card">
            <div class="px-4 pt-4 pb-2"><h3 class="card-title">My booking requests</h3></div>
            <div class="divide-y divide-gray-100">
              <div v-for="b in myBookings" :key="b.id" class="flex items-center gap-3 px-4 py-3">
                <div class="flex-1 min-w-0"><div class="text-sm font-medium">{{ $sel.seatLabel(b.seatId) }} <span class="text-xs text-gray-400">{{ b.id }}</span></div>
                  <div class="text-xs text-gray-500">{{ $sel.branchName(b.branchId) }} · from {{ $date(b.fromDate) }}</div>
                  <div v-if="b.note" class="text-xs text-gray-400">{{ b.note }}</div></div>
                <Badge :status="b.status" />
              </div>
            </div>
            <EmptyState v-if="!myBookings.length" icon="Armchair" title="No booking requests yet" />
          </div>
        </template>
      </div>`,
  };

  // ======================= Attendance =======================
  SSC.pages.MyAttendance = {
    mixins: [me],
    computed: {
      records() { return S().sel.attendanceOf(this.meId); },
      month() {
        const key = R.today().slice(0, 7);
        const recs = this.records.filter((a) => a.date.startsWith(key));
        const days = new Set(recs.map((a) => a.date)).size;
        const hours = recs.reduce((s, a) => s + (R.hoursBetween(a.checkIn, a.checkOut) || 0), 0);
        return { days, hours, avg: days ? hours / days : 0 };
      },
      grid() {
        const byDate = {};
        this.records.forEach((a) => { byDate[a.date] = (byDate[a.date] || 0) + (R.hoursBetween(a.checkIn, a.checkOut) || 0); });
        const out = [];
        for (let i = 29; i >= 0; i--) {
          const d = R.addDays(R.today(), -i);
          out.push({ d, day: Number(d.slice(8)), dow: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'narrow' }), h: byDate[d] || 0, today: i === 0 });
        }
        return out;
      },
    },
    template: `
      <div class="space-y-5">
        <PageHeader title="Attendance" subtitle="Your check-ins and study hours" />
        <div class="grid grid-cols-3 gap-3">
          <div class="card p-4 text-center"><div class="text-xl font-semibold">{{ month.days }}</div><div class="text-[11px] text-gray-500">days this month</div></div>
          <div class="card p-4 text-center"><div class="text-xl font-semibold">{{ $hours(month.hours) }}</div><div class="text-[11px] text-gray-500">total hours</div></div>
          <div class="card p-4 text-center"><div class="text-xl font-semibold">{{ $hours(month.avg) }}</div><div class="text-[11px] text-gray-500">avg / day</div></div>
        </div>
        <div class="card card-pad">
          <h3 class="card-title mb-3">Last 30 days</h3>
          <div class="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
            <div v-for="c in grid" :key="c.d" :title="$date(c.d) + (c.h ? ' · ' + $hours(c.h) : ' · absent')"
              class="aspect-square rounded-lg flex flex-col items-center justify-center text-[11px]"
              :class="[c.h ? (c.h >= 5 ? 'bg-brand-500 text-white' : 'bg-brand-200 text-brand-700') : 'bg-gray-100 text-gray-400', c.today ? 'ring-2 ring-offset-1 ring-brand-500' : '']">
              <span class="text-[9px] opacity-70">{{ c.dow }}</span><b>{{ c.day }}</b>
            </div>
          </div>
          <div class="flex gap-4 text-[11px] text-gray-500 mt-3">
            <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded bg-gray-100 inline-block"></i>Absent</span>
            <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded bg-brand-200 inline-block"></i>&lt; 5 h</span>
            <span class="inline-flex items-center gap-1"><i class="w-3 h-3 rounded bg-brand-500 inline-block"></i>5 h +</span>
          </div>
        </div>
        <div class="card">
          <div class="px-4 pt-4 pb-2"><h3 class="card-title">Records</h3></div>
          <div class="divide-y divide-gray-100">
            <div v-for="a in records" :key="a.id" class="flex items-center gap-3 px-4 py-3">
              <div class="w-11 text-center shrink-0"><div class="text-[10px] text-gray-400 uppercase">{{ new Date(a.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' }) }}</div><div class="text-lg font-semibold leading-none">{{ a.date.slice(8) }}</div></div>
              <div class="flex-1 text-sm"><div>{{ $time(a.checkIn) }} → {{ a.checkOut ? $time(a.checkOut) : 'now' }}</div><div class="text-xs text-gray-500">{{ a.seatId ? $sel.seatLabel(a.seatId) : 'Flexible seat' }}</div></div>
              <div class="text-right"><div class="text-sm font-medium">{{ $hours($R.hoursBetween(a.checkIn, a.checkOut)) }}</div><Badge :status="a.checkOut ? 'Checked Out' : 'Present'" /></div>
            </div>
          </div>
          <EmptyState v-if="!records.length" icon="CalendarX" title="No attendance yet" />
        </div>
      </div>`,
  };

  // ======================= Payments =======================
  SSC.pages.MyPayments = {
    mixins: [me],
    components: { FakeGateway },
    data() { return { paying: null, method: 'UPI', busy: false }; },
    computed: {
      list() { return S().sel.paymentsOf(this.meId); },
      dues() { return this.list.filter((p) => p.status === 'Pending'); },
      dueTotal() { return this.dues.reduce((s, p) => s + p.amount, 0); },
      paidTotal() { return this.list.filter((p) => p.status === 'Paid').reduce((s, p) => s + p.amount, 0); },
    },
    methods: {
      pay() {
        this.busy = true;
        setTimeout(() => {
          const p = S().actions.settlePayment(this.paying.id, 'Online Payment');
          p.note = (p.note ? p.note + ' · ' : '') + `Paid via ${this.method} (simulated)`;
          this.busy = false;
          this.paying = null;
          this.$toast(`Payment of ${R.inr(p.amount)} successful — receipt ${p.id}`);
        }, 1200);
      },
    },
    template: `
      <div class="space-y-5">
        <PageHeader title="Payments" subtitle="Dues, history and receipts" />
        <div class="grid grid-cols-2 gap-3">
          <div class="card p-4" :class="dueTotal ? 'border-amber-200 bg-amber-50/50' : ''"><div class="text-xs text-gray-500">Outstanding</div><div class="text-xl font-semibold" :class="dueTotal ? 'text-amber-700' : ''">{{ $inr(dueTotal) }}</div></div>
          <div class="card p-4"><div class="text-xs text-gray-500">Total paid</div><div class="text-xl font-semibold">{{ $inr(paidTotal) }}</div></div>
        </div>

        <div v-if="dues.length" class="card card-pad">
          <h3 class="card-title mb-3">Pending dues</h3>
          <div v-for="p in dues" :key="p.id" class="flex items-center gap-3 py-2">
            <div class="flex-1 text-sm"><b>{{ $inr(p.amount) }}</b><div class="text-xs text-gray-500">{{ p.note || 'Balance due' }}<template v-if="p.membershipId"> · {{ $sel.planName(($get.membership(p.membershipId) || {}).planId) }}</template></div></div>
            <button class="btn btn-primary" @click="paying = p; method = 'UPI'">Pay now</button>
          </div>
        </div>

        <div class="card">
          <div class="px-4 pt-4 pb-2"><h3 class="card-title">Payment history</h3></div>
          <div class="divide-y divide-gray-100">
            <div v-for="p in list" :key="p.id" class="flex items-center gap-3 px-4 py-3">
              <div class="w-9 h-9 rounded-lg grid place-items-center shrink-0" :class="p.type === 'Refund' ? 'bg-blue-50 text-blue-600' : p.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'">
                <Icon :name="p.type === 'Refund' ? 'Undo2' : p.status === 'Pending' ? 'Clock' : 'IndianRupee'" :size="17" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium">{{ $inr(p.amount) }} <span class="text-xs text-gray-400 font-normal">{{ p.id }}</span></div>
                <div class="text-xs text-gray-500 truncate">{{ $date(p.date) }} · {{ p.method }}<template v-if="p.membershipId"> · {{ $sel.planName(($get.membership(p.membershipId) || {}).planId) }}</template></div>
              </div>
              <div class="flex flex-col items-end gap-1">
                <Badge :status="p.status" />
                <router-link v-if="p.status !== 'Pending'" :to="'/student/receipt/' + p.id" class="text-xs text-brand-600 no-underline font-medium">Receipt</router-link>
              </div>
            </div>
          </div>
          <EmptyState v-if="!list.length" icon="Wallet" title="No payments yet" />
        </div>

        <Modal :show="!!paying" title="Pay outstanding amount" size="sm" @close="!busy && (paying = null)">
          <div v-if="paying" class="space-y-4">
            <div class="text-center"><div class="text-xs text-gray-500">Amount</div><div class="text-3xl font-semibold">{{ $inr(paying.amount) }}</div><div class="text-xs text-gray-400">{{ paying.id }}</div></div>
            <FakeGateway v-model="method" />
          </div>
          <template #footer>
            <button class="btn btn-secondary" :disabled="busy" @click="paying = null">Cancel</button>
            <button class="btn btn-primary" :disabled="busy" @click="pay"><Icon v-if="busy" name="Loader2" :size="15" class="animate-spin" />{{ busy ? 'Processing…' : 'Pay now' }}</button>
          </template>
        </Modal>
      </div>`,
  };

  // ======================= Service requests (Workflow 7, student side) =======================
  const CATEGORIES = ['AC / Ventilation', 'Wi-Fi / Internet', 'Cleanliness', 'Seat-related issue', 'Noise complaint', 'Other'];
  const CAT_ICON = { 'AC / Ventilation': 'Wind', 'Wi-Fi / Internet': 'Wifi', Cleanliness: 'Sparkles', 'Seat-related issue': 'Armchair', 'Noise complaint': 'Volume2', Other: 'HelpCircle' };

  SSC.pages.MyRequests = {
    mixins: [me],
    data() { return { showForm: false, form: { category: '', subject: '', description: '' }, errors: {}, expanded: null, categories: CATEGORIES }; },
    computed: { list() { return S().sel.requestsOf(this.meId); } },
    methods: {
      icon(c) { return CAT_ICON[c] || 'HelpCircle'; },
      submit() {
        const e = {};
        if (!this.form.category) e.category = 'Choose a category';
        if (!this.form.subject.trim()) e.subject = 'Add a short subject';
        else if (this.form.subject.trim().length < 5) e.subject = 'Subject is too short';
        if (!this.form.description.trim()) e.description = 'Describe the issue';
        this.errors = e;
        if (Object.keys(e).length) return;
        const r = S().actions.createRequest(this.meId, { ...this.form, subject: this.form.subject.trim(), description: this.form.description.trim() });
        this.$toast(`Request ${r.id} raised — the centre has been notified`);
        this.form = { category: '', subject: '', description: '' };
        this.showForm = false;
        this.expanded = r.id;
      },
    },
    template: `
      <div class="space-y-5">
        <PageHeader title="Service requests" subtitle="Report an issue — track its status here">
          <button v-if="!showForm" class="btn btn-primary" @click="showForm = true"><Icon name="Plus" :size="16" />New request</button>
        </PageHeader>

        <div v-if="showForm" class="card card-pad space-y-4">
          <h3 class="card-title">Raise a request</h3>
          <Field label="Category" required :error="errors.category">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button v-for="c in categories" :key="c" type="button" class="rounded-xl border px-3 py-3 text-xs font-medium flex items-center gap-2 cursor-pointer bg-white font-[inherit] text-left"
                :class="form.category === c ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-200 text-gray-600'" @click="form.category = c; errors.category = ''">
                <Icon :name="icon(c)" :size="16" />{{ c }}
              </button>
            </div>
          </Field>
          <Field label="Subject" required :error="errors.subject"><input class="input h-11" v-model="form.subject" :class="{ invalid: errors.subject }" maxlength="80" placeholder="e.g. Wi-Fi not working at my seat" /></Field>
          <Field label="Description" required :error="errors.description"><textarea class="textarea" v-model="form.description" :class="{ invalid: errors.description }" placeholder="What happened, where, since when…"></textarea></Field>
          <div class="flex gap-2">
            <button class="btn btn-secondary btn-lg" @click="showForm = false; errors = {}">Cancel</button>
            <button class="btn btn-primary btn-lg flex-1" @click="submit"><Icon name="Send" :size="16" />Submit request</button>
          </div>
        </div>

        <div class="space-y-3">
          <div v-for="r in list" :key="r.id" class="card">
            <button class="w-full flex items-start gap-3 p-4 text-left bg-transparent border-0 cursor-pointer font-[inherit]" @click="expanded = expanded === r.id ? null : r.id">
              <div class="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 grid place-items-center shrink-0"><Icon :name="icon(r.category)" :size="17" /></div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium">{{ r.subject }}</div>
                <div class="text-xs text-gray-500">{{ r.id }} · {{ r.category }} · {{ $rel(r.createdAt) }}</div>
              </div>
              <Badge :status="r.status" />
            </button>
            <div v-if="expanded === r.id" class="px-4 pb-4">
              <p class="text-sm text-gray-600 mt-0 mb-3">{{ r.description }}</p>
              <div class="border-l-2 border-gray-200 ml-2 pl-4 space-y-3">
                <div v-for="(u, i) in r.updates" :key="i" class="relative">
                  <span class="absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white" :class="{ 'bg-red-400': u.status === 'Open', 'bg-amber-400': u.status === 'In Progress', 'bg-emerald-500': u.status === 'Resolved' }"></span>
                  <div class="text-xs"><b>{{ u.status }}</b> · {{ u.by }} · {{ $dt(u.at) }}</div>
                  <div class="text-xs text-gray-600">{{ u.text }}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!list.length" class="card"><EmptyState icon="LifeBuoy" title="No requests yet" text="Facing an issue? Raise a request and track it here." /></div>
        </div>
      </div>`,
  };

  // ======================= Notifications =======================
  const NOTE_ICON = { expiry: 'CalendarClock', payment: 'IndianRupee', booking: 'Armchair', announcement: 'Megaphone', maintenance: 'Wrench' };
  SSC.pages.MyNotifications = {
    mixins: [me],
    computed: {
      list() { return S().sel.notificationsFor(this.meId); },
      unread() { return this.list.filter((n) => !n.read).length; },
    },
    methods: {
      icon(t) { return NOTE_ICON[t] || 'Bell'; },
      markAll() { S().actions.markNotificationsRead(this.meId); this.$toast('All notifications marked as read'); },
    },
    template: `
      <div class="space-y-5">
        <PageHeader title="Notifications" :subtitle="unread ? unread + ' unread' : 'You are all caught up'">
          <button class="btn btn-secondary btn-sm" :disabled="!unread" @click="markAll"><Icon name="CheckCheck" :size="14" />Mark all read</button>
        </PageHeader>
        <div class="card divide-y divide-gray-100">
          <div v-for="n in list" :key="n.id" class="flex gap-3 p-4" :class="n.read ? '' : 'bg-brand-50/40'" @click="n.read = true">
            <div class="w-9 h-9 rounded-lg bg-brand-50 text-brand-500 grid place-items-center shrink-0"><Icon :name="icon(n.type)" :size="17" /></div>
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-2"><div class="text-sm font-medium">{{ n.title }}</div><span v-if="!n.read" class="w-2 h-2 rounded-full bg-brand-500 mt-1.5 shrink-0"></span></div>
              <div class="text-xs text-gray-600 mt-0.5">{{ n.body }}</div>
              <div class="text-[11px] text-gray-400 mt-1">{{ $rel(n.at) }}<template v-if="n.studentId === 'ALL'"> · Centre announcement</template></div>
            </div>
          </div>
          <EmptyState v-if="!list.length" icon="BellOff" title="No notifications" />
        </div>
      </div>`,
  };

  // ======================= Profile =======================
  SSC.pages.MyProfile = {
    mixins: [me],
    data() { return { editing: false, form: {}, errors: {} }; },
    computed: {
      personal() {
        const s = this.me;
        return [
          { label: 'Student ID', value: s.id }, { label: 'Mobile', value: s.mobile }, { label: 'Email', value: s.email },
          { label: 'Date of birth', value: s.dob ? R.fmtDate(s.dob) : '' }, { label: 'Gender', value: s.gender }, { label: 'Address', value: s.address },
        ];
      },
      other() {
        const s = this.me;
        return [
          { label: 'ID proof', value: s.idType ? `${s.idType} — ${s.idNumber}` : '' },
          { label: 'Emergency contact', value: s.emergencyName ? `${s.emergencyName} · ${s.emergencyPhone}` : '' },
          { label: 'Home branch', value: S().sel.branchName(s.branchId) },
          { label: 'Member since', value: R.fmtDate(s.createdAt) },
        ];
      },
    },
    methods: {
      edit() {
        const s = this.me;
        this.form = { mobile: s.mobile, email: s.email, address: s.address, emergencyName: s.emergencyName, emergencyPhone: s.emergencyPhone };
        this.errors = {};
        this.editing = true;
      },
      save() {
        const e = {};
        if (!/^[6-9]\d{9}$/.test((this.form.mobile || '').replace(/\s/g, ''))) e.mobile = 'Enter a valid 10-digit mobile number';
        if (this.form.email && !/^\S+@\S+\.\S+$/.test(this.form.email)) e.email = 'Enter a valid email';
        this.errors = e;
        if (Object.keys(e).length) return;
        S().actions.updateStudent(this.meId, { ...this.form });
        this.editing = false;
        this.$toast('Profile updated');
      },
      async logout() {
        const ok = await this.$confirm({ title: 'Log out?', message: 'You will return to the demo login screen.', confirmText: 'Log out' });
        if (ok) { S().actions.logout(); this.$router.push('/login'); }
      },
    },
    template: `
      <div class="space-y-5">
        <div class="card card-pad flex items-center gap-4">
          <Avatar :name="me.name" :size="64" />
          <div class="flex-1 min-w-0">
            <div class="text-lg font-semibold">{{ me.name }}</div>
            <div class="text-xs text-gray-500">{{ me.id }} · {{ $sel.branchName(me.branchId) }}</div>
            <div class="mt-1"><Badge :status="currentStatus" /></div>
          </div>
        </div>
        <div class="card card-pad">
          <div class="flex items-center justify-between mb-3"><h3 class="card-title">Personal information</h3><button class="btn btn-secondary btn-sm" @click="edit"><Icon name="Pencil" :size="13" />Edit</button></div>
          <KeyValue :items="personal" />
        </div>
        <div class="card card-pad">
          <h3 class="card-title mb-3">Membership & verification</h3>
          <KeyValue :items="other" />
          <div class="text-[11px] text-gray-400 mt-3">Name, date of birth and ID proof can only be changed at the front desk.</div>
        </div>
        <button class="btn btn-secondary btn-lg w-full" @click="logout"><Icon name="LogOut" :size="16" />Log out</button>

        <Modal :show="editing" title="Edit contact details" @close="editing = false">
          <div class="grid sm:grid-cols-2 gap-3">
            <Field label="Mobile" required :error="errors.mobile"><input class="input" v-model="form.mobile" :class="{ invalid: errors.mobile }" /></Field>
            <Field label="Email" :error="errors.email"><input class="input" v-model="form.email" :class="{ invalid: errors.email }" /></Field>
            <div class="sm:col-span-2"><Field label="Address"><textarea class="textarea" v-model="form.address"></textarea></Field></div>
            <Field label="Emergency contact name"><input class="input" v-model="form.emergencyName" /></Field>
            <Field label="Emergency contact phone"><input class="input" v-model="form.emergencyPhone" /></Field>
          </div>
          <template #footer>
            <button class="btn btn-secondary" @click="editing = false">Cancel</button>
            <button class="btn btn-primary" @click="save">Save changes</button>
          </template>
        </Modal>
      </div>`,
  };
})();
