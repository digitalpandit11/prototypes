/* ==========================================================================
   Memberships listing, renewal wizard (Workflow 2), membership plans.
   ========================================================================== */
SSC.pages = SSC.pages || {};

(function () {
  const R = SSC.rules;
  const PAY_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Online Payment'];
  const STATUSES = ['Upcoming', 'Active', 'Expiring Soon', 'Expired', 'Suspended', 'Cancelled'];

  // ======================================================================
  // Membership listing
  // ======================================================================
  SSC.pages.MembershipList = {
    data() {
      return { q: '', branch: this.$ui.branch, status: 'All', plan: '', viewId: null, extend: { id: null, days: 7, reason: '' }, change: { id: null, planId: '' }, seatStudent: null };
    },
    computed: {
      base() {
        return this.$db.memberships.map((m) => ({
          ...m, student: this.$sel.studentName(m.studentId), plan: this.$sel.planName(m.planId), branch: this.$sel.branchName(m.branchId),
          seat: m.seatId ? this.$sel.seatLabel(m.seatId) : '', net: m.amount - m.discount, status: this.$sel.mStatus(m),
        }));
      },
      inBranch() { return this.base.filter((r) => this.branch === 'ALL' || r.branchId === this.branch); },
      tabs() {
        return [{ key: 'All', label: 'All', count: this.inBranch.length }].concat(STATUSES.map((s) => ({ key: s, label: s, count: this.inBranch.filter((r) => r.status === s).length })));
      },
      rows() {
        const q = this.q.trim().toLowerCase();
        return this.inBranch.filter((r) => (this.status === 'All' || r.status === this.status) && (!this.plan || r.planId === this.plan)
          && (!q || r.student.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.studentId.toLowerCase().includes(q)));
      },
      columns() {
        return [
          { key: 'id', label: 'Membership ID' }, { key: 'student', label: 'Student' }, { key: 'plan', label: 'Plan / Branch' },
          { key: 'startDate', label: 'Start' }, { key: 'endDate', label: 'End' }, { key: 'seat', label: 'Seat' }, { key: 'net', label: 'Amount', align: 'right' },
          { key: 'status', label: 'Status' }, { key: 'actions', label: 'Actions', sortable: false, align: 'right' },
        ];
      },
      viewM() { return this.$get.membership(this.viewId); },
    viewRow() { return this.base.find((r) => r.id === this.viewId) || {}; },
      viewPayments() { return this.$db.payments.filter((p) => p.membershipId === this.viewId); },
      extendM() { return this.$get.membership(this.extend.id); },
      changeM() { return this.$get.membership(this.change.id); },
      changePlans() { return this.changeM ? this.$sel.plansFor(this.changeM.branchId) : []; },
      changePlan() { return this.$get.plan(this.change.planId); },
    },
    methods: {
      isCurrent(r) { const c = this.$sel.currentMembership(r.studentId); return c && c.id === r.id; },
      renew(r) { this.$router.push({ path: this.$link(this.$role() === 'staff' ? '/renew' : '/memberships/renew'), query: { student: r.studentId } }); },
      openExtend(r) { this.extend = { id: r.id, days: 7, reason: '' }; },
      doExtend() {
        const d = parseInt(this.extend.days, 10);
        if (!d || d < 1 || d > 365) { this.$toast('Enter 1–365 days', 'error'); return; }
        this.$act.extendMembership(this.extend.id, d, this.extend.reason);
        this.$toast(`${this.extend.id} extended by ${d} day(s)`);
        this.extend.id = null;
      },
      openChange(r) { this.change = { id: r.id, planId: r.planId }; },
      doChange() {
        if (this.change.planId === this.changeM.planId) { this.change.id = null; return; }
        this.$act.changePlan(this.change.id, this.change.planId);
        this.$toast(`Plan changed to ${this.changePlan.name}`);
        this.change.id = null;
      },
      async suspend(r) {
        const resume = r.status === 'Suspended';
        const ok = await this.$confirm({
          title: resume ? 'Reactivate membership?' : 'Suspend membership?',
          message: resume ? `${r.id} for ${r.student} will become active again.` : `${r.student} will not be able to check in while ${r.id} is suspended. The seat stays reserved.`,
          confirmText: resume ? 'Reactivate' : 'Suspend', tone: resume ? 'primary' : 'danger',
        });
        if (!ok) return;
        this.$act.setMembershipOverride(r.id, resume ? null : 'Suspended');
        this.$toast(`Membership ${r.id} ${resume ? 'reactivated' : 'suspended'}`);
      },
      async cancel(r) {
        const ok = await this.$confirm({ title: 'Cancel membership?', message: `${r.id} (${r.plan}) for ${r.student} will be cancelled and the seat released. Refunds are recorded separately from Payments.`, confirmText: 'Cancel membership', tone: 'danger' });
        if (!ok) return;
        this.$act.setMembershipOverride(r.id, 'Cancelled');
        this.$toast(`Membership ${r.id} cancelled`);
      },
    },
    template: `
      <div>
        <PageHeader title="Memberships" subtitle="All memberships with validity, seat and payment status">
          <router-link :to="$link($role() === 'staff' ? '/renew' : '/memberships/renew')" class="btn btn-primary"><Icon name="RefreshCw" :size="16" />Renew membership</router-link>
        </PageHeader>
        <div class="card">
          <div class="p-4 flex flex-wrap gap-3 border-b border-gray-100">
            <div class="flex-1 min-w-[220px]"><SearchInput v-model="q" placeholder="Search student, student ID or membership ID" /></div>
            <select class="select w-auto" v-model="branch"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
            <select class="select w-auto" v-model="plan"><option value="">All plans</option><option v-for="p in $db.plans" :key="p.id" :value="p.id">{{ p.name }}</option></select>
          </div>
          <div class="px-4 pt-2"><Tabs :tabs="tabs" v-model="status" /></div>
          <DataTable :columns="columns" :rows="rows" :page-size="12">
            <template #cell-id="{ row }"><span class="text-xs font-medium text-gray-500">{{ row.id }}</span></template>
            <template #cell-student="{ row }"><router-link :to="$link('/students/' + row.studentId)" class="font-medium text-gray-800 no-underline hover:text-brand-600 whitespace-nowrap">{{ row.student }}</router-link></template>
            <template #cell-plan="{ row }"><div class="whitespace-nowrap">{{ row.plan }}</div><div class="text-xs text-gray-500 whitespace-nowrap">{{ row.branch }}</div></template>
            <template #cell-branch="{ row }"><span class="whitespace-nowrap">{{ row.branch.replace(' Branch', '') }}</span></template>
            <template #cell-startDate="{ row }"><span class="whitespace-nowrap">{{ $date(row.startDate) }}</span></template>
            <template #cell-endDate="{ row }"><span class="whitespace-nowrap">{{ $date(row.endDate) }}</span></template>
            <template #cell-seat="{ row }"><span class="whitespace-nowrap">{{ row.seat || '—' }}</span></template>
            <template #cell-net="{ row }">{{ $inr(row.net) }}</template>
            <template #cell-status="{ row }"><Badge :status="row.status" /></template>
            <template #cell-actions="{ row }">
              <div class="flex justify-end gap-1">
                <button class="btn btn-ghost btn-icon" title="Renew" @click="renew(row)"><Icon name="RefreshCw" :size="15" /></button>
                <button class="btn btn-secondary btn-sm" @click="viewId = row.id">Manage</button>
              </div>
            </template>
          </DataTable>
        </div>

        <Modal :show="!!viewM" :title="viewM ? 'Membership ' + viewM.id : ''" size="lg" @close="viewId = null">
          <template v-if="viewM">
            <div class="flex items-center gap-3 mb-4"><Avatar :name="$sel.studentName(viewM.studentId)" /><div><div class="font-medium">{{ $sel.studentName(viewM.studentId) }}</div><div class="text-xs text-gray-500">{{ viewM.studentId }}</div></div></div>
            <MembershipSummary :membership="viewM" />
            <div v-if="viewM.notes" class="text-xs text-gray-500 mt-3">Notes: {{ viewM.notes }}</div>
            <div class="text-sm font-medium mt-5 mb-2">Payments</div>
            <div v-for="p in viewPayments" :key="p.id" class="flex items-center justify-between py-2 border-b border-gray-100 text-sm">
              <span>{{ p.id }} · {{ $date(p.date) }} · {{ p.method }}</span><span class="flex items-center gap-2">{{ $inr(p.amount) }} <Badge :status="p.status" /></span>
            </div>
            <div v-if="!viewPayments.length" class="text-sm text-gray-500">No payments recorded.</div>
          </template>
          <template #footer>
            <div v-if="viewM" class="flex flex-wrap justify-end gap-2 w-full">
              <router-link :to="$link('/students/' + viewM.studentId)" class="btn btn-ghost btn-sm mr-auto">Open student</router-link>
              <button class="btn btn-secondary btn-sm" @click="renew(viewRow)"><Icon name="RefreshCw" :size="14" />Renew</button>
              <template v-if="!['Cancelled','Expired'].includes(viewRow.status)">
                <button class="btn btn-secondary btn-sm" @click="openExtend(viewRow); viewId = null"><Icon name="CalendarPlus" :size="14" />Extend</button>
                <button class="btn btn-secondary btn-sm" @click="openChange(viewRow); viewId = null"><Icon name="Repeat" :size="14" />Change plan</button>
                <button class="btn btn-secondary btn-sm" :disabled="!isCurrent(viewRow)" :title="isCurrent(viewRow) ? '' : 'Only for the current membership'" @click="seatStudent = viewRow.studentId; viewId = null"><Icon name="Armchair" :size="14" />Change seat</button>
                <button class="btn btn-secondary btn-sm" @click="suspend(viewRow)"><Icon :name="viewRow.status === 'Suspended' ? 'CirclePlay' : 'CirclePause'" :size="14" />{{ viewRow.status === 'Suspended' ? 'Reactivate' : 'Suspend' }}</button>
                <button class="btn btn-danger btn-sm" @click="cancel(viewRow)"><Icon name="CircleX" :size="14" />Cancel</button>
              </template>
            </div>
          </template>
        </Modal>

        <Modal :show="!!extendM" title="Extend membership" size="sm" @close="extend.id = null">
          <template v-if="extendM">
            <p class="text-sm text-gray-500 mt-0">{{ extendM.id }} · {{ $sel.studentName(extendM.studentId) }} · currently ends <b>{{ $date(extendM.endDate) }}</b></p>
            <div class="space-y-4">
              <Field label="Extend by (days)" required><input class="input" type="number" min="1" max="365" v-model="extend.days" /></Field>
              <Field label="Reason" hint="e.g. centre closed for maintenance, compensation"><input class="input" v-model="extend.reason" /></Field>
              <div class="text-sm">New end date: <b>{{ $date($R.addDays(extendM.endDate, parseInt(extend.days, 10) || 0)) }}</b></div>
            </div>
          </template>
          <template #footer><button class="btn btn-secondary" @click="extend.id = null">Cancel</button><button class="btn btn-primary" @click="doExtend">Extend</button></template>
        </Modal>

        <Modal :show="!!changeM" title="Change plan" size="sm" @close="change.id = null">
          <template v-if="changeM">
            <p class="text-sm text-gray-500 mt-0">{{ changeM.id }} · {{ $sel.studentName(changeM.studentId) }} · current plan <b>{{ $sel.planName(changeM.planId) }}</b></p>
            <Field label="New plan"><select class="select" v-model="change.planId"><option v-for="p in changePlans" :key="p.id" :value="p.id">{{ p.name }} — {{ $inr(p.price) }} / {{ $R.durationLabel(p) }}</option></select></Field>
            <div v-if="changePlan" class="text-sm mt-4 space-y-1">
              <div>New period: <b>{{ $date(changeM.startDate) }} → {{ $date($R.endDateFor(changePlan, changeM.startDate)) }}</b></div>
              <div>Price difference: <b>{{ $inr(changePlan.price - changeM.amount) }}</b> <span class="text-gray-500">(collect or refund from Payments)</span></div>
            </div>
          </template>
          <template #footer><button class="btn btn-secondary" @click="change.id = null">Cancel</button><button class="btn btn-primary" @click="doChange">Change plan</button></template>
        </Modal>

        <SeatChangeModal :show="!!seatStudent" :student-id="seatStudent" @close="seatStudent = null" />
      </div>`,
  };

  // ======================================================================
  // Renewal wizard — Workflow 2
  // ======================================================================
  SSC.pages.RenewalWizard = {
    data() {
      const sid = this.$route.query.student && this.$get.student(this.$route.query.student) ? this.$route.query.student : null;
      return {
        steps: ['Find student', 'Current membership', 'Plan & dates', 'Amount', 'Payment', 'Done'],
        step: sid ? 1 : 0, studentId: sid, planId: null, startMode: 'auto', customDate: R.today(), keepSeat: true,
        discount: { type: 'flat', value: 0 }, method: 'UPI', paidNow: 0, methods: PAY_METHODS, result: null,
      };
    },
    created() { if (this.studentId) this.initPlan(); },
    computed: {
      student() { return this.$get.student(this.studentId); },
      current() { return this.studentId ? this.$sel.currentMembership(this.studentId) : null; },
      currentStatus() { return this.$sel.mStatus(this.current); },
      dues() { return this.studentId ? this.$sel.duesOf(this.studentId) : 0; },
      branchId() { return this.current ? this.current.branchId : (this.student || {}).branchId; },
      plans() { return this.$sel.plansFor(this.branchId); },
      plan() { return this.$get.plan(this.planId); },
      autoStart() { return R.renewalStartDate(this.current && this.currentStatus !== 'Cancelled' ? this.current : null, this.$db.settings.renewalStart); },
      startDate() { return this.startMode === 'immediate' ? R.today() : this.startMode === 'custom' ? this.customDate : this.autoStart; },
      endDate() { return this.plan ? R.endDateFor(this.plan, this.startDate) : null; },
      currentSeat() { return this.current && this.current.seatId ? this.$get.seat(this.current.seatId) : null; },
      seatCompatible() { return this.currentSeat && this.plan && this.plan.seatType === 'Fixed' && this.currentSeat.category === this.plan.seatCategory; },
      calc() { return R.calcAmount(this.plan, { type: this.discount.type, value: Number(this.discount.value) || 0 }, this.$db.settings); },
      balance() { return Math.max(0, this.calc.total - (Number(this.paidNow) || 0)); },
      overlap() { return this.current && R.isLive(this.currentStatus) && this.startDate <= this.current.endDate; },
    },
    watch: { 'calc.total'(t) { this.paidNow = t; } },
    methods: {
      initPlan() {
        const cur = this.current;
        const p = cur && this.$get.plan(cur.planId);
        this.planId = p && p.status === 'Active' && p.renewable ? p.id : (this.plans.find((x) => x.id === 'PL4') || this.plans[0] || {}).id;
      },
      pick(s) { this.studentId = s.id; this.initPlan(); this.step = 1; },
      next() {
        if (this.step === 2) {
          if (!this.planId) { this.$toast('Select a plan', 'error'); return; }
          if (this.startDate < R.today()) { this.$toast('Renewal cannot start in the past', 'error'); return; }
        }
        this.step++;
      },
      finish() {
        const paid = Number(this.paidNow) || 0;
        if (paid < 0 || paid > this.calc.total) { this.$toast(`Enter an amount between ₹0 and ${R.inr(this.calc.total)}`, 'error'); return; }
        const m = this.$act.renewMembership({ studentId: this.studentId, planId: this.planId, startDate: this.startDate, discount: this.calc.discount, keepSeat: this.keepSeat && this.seatCompatible });
        let receipt = null;
        if (paid > 0) receipt = this.$act.recordPayment({ studentId: this.studentId, membershipId: m.id, amount: paid, method: this.method, note: 'Renewal' });
        let due = null;
        if (this.balance > 0) due = this.$act.recordPayment({ studentId: this.studentId, membershipId: m.id, amount: this.balance, status: 'Pending', note: 'Balance due' });
        this.result = { membership: m, receipt: receipt || due, due };
        this.step = 5;
        this.$toast(`Membership renewed — ${this.student.name}`);
      },
      restart() { this.$router.replace({ query: {} }); Object.assign(this.$data, this.$options.data.call(this), { step: 0, studentId: null }); },
    },
    template: `
      <div>
        <PageHeader title="Membership renewal" subtitle="Find student → review → choose plan → calculate → collect payment">
          <template #crumbs><router-link :to="$link($role() === 'staff' ? '/search' : '/memberships')" class="text-xs text-gray-500 no-underline inline-flex items-center gap-1 mb-1"><Icon name="ArrowLeft" :size="13" />Back</router-link></template>
        </PageHeader>
        <div class="card card-pad mb-4"><Stepper :steps="steps" :current="step" /></div>

        <div v-if="student && step > 0 && step < 5" class="card px-5 py-3 mb-4 flex items-center gap-3">
          <Avatar :name="student.name" :size="36" />
          <div class="flex-1"><div class="font-medium">{{ student.name }}</div><div class="text-xs text-gray-500">{{ student.id }} · {{ student.mobile }} · {{ $sel.branchName(student.branchId) }}</div></div>
          <button class="btn btn-ghost btn-sm" @click="step = 0">Change</button>
        </div>

        <div class="card">
          <div v-if="step === 0" class="card-pad">
            <h3 class="card-title mb-3">Search for an existing student</h3>
            <div class="max-w-xl"><StudentPicker autofocus @select="pick" /></div>
            <p class="text-xs text-gray-400 mt-3">Try “Aarav”, “STU1002” or part of a mobile number.</p>
          </div>

          <div v-if="step === 1" class="card-pad">
            <h3 class="card-title mb-3">Current membership</h3>
            <div class="grid lg:grid-cols-2 gap-4">
              <MembershipSummary :membership="current" />
              <div class="space-y-3 text-sm">
                <div class="rounded-xl p-4" :class="dues ? 'bg-amber-50 text-amber-800' : 'bg-gray-50'">Outstanding dues: <b>{{ $inr(dues) }}</b><div v-if="dues" class="text-xs mt-1">Dues can be collected from the student profile or Payments.</div></div>
                <div class="rounded-xl bg-gray-50 p-4">
                  <div class="text-xs text-gray-500 mb-1">Renewal rule (sample — to be confirmed)</div>
                  <div v-if="$db.settings.renewalStart === 'after_expiry'">Renewal starts the day after the current membership ends; if already expired, it starts today.</div>
                  <div v-else>Renewal starts immediately.</div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="step === 2" class="card-pad">
            <h3 class="card-title mb-3">Select renewal plan</h3>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button v-for="p in plans" :key="p.id" class="text-left rounded-xl border-2 p-4 cursor-pointer bg-white font-[inherit] transition" :class="p.id === planId ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'" @click="planId = p.id">
                <div class="flex items-start justify-between gap-2"><div class="font-semibold">{{ p.name }}</div><div class="text-lg font-bold text-brand-600">{{ $inr(p.price) }}</div></div>
                <div class="flex flex-wrap gap-1.5 mt-2"><span class="badge badge-grey">{{ $R.durationLabel(p) }}</span><span class="badge badge-info">{{ p.seatCategory }}</span><span class="badge badge-brand">{{ p.seatType }}</span></div>
                <div v-if="current && current.planId === p.id" class="text-[11px] text-brand-600 mt-2">Current plan</div>
              </button>
            </div>
            <div class="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <div class="label">Renewal start date</div>
                <div class="space-y-2 text-sm">
                  <label class="flex items-center gap-2"><input type="radio" value="auto" v-model="startMode" /> As per rule — <b>{{ $date(autoStart) }}</b></label>
                  <label class="flex items-center gap-2"><input type="radio" value="immediate" v-model="startMode" /> Start immediately — <b>{{ $date($R.today()) }}</b></label>
                  <label class="flex items-center gap-2"><input type="radio" value="custom" v-model="startMode" /> Choose date <input v-if="startMode === 'custom'" type="date" class="input h-8 w-auto" v-model="customDate" :min="$R.today()" /></label>
                </div>
                <div v-if="overlap" class="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-3">Starts before the current membership ends ({{ $date(current.endDate) }}) — the periods will overlap.</div>
              </div>
              <div class="rounded-xl bg-gray-50 p-4 text-sm space-y-2">
                <div>New period: <b>{{ $date(startDate) }} → {{ $date(endDate) }}</b></div>
                <template v-if="currentSeat">
                  <label v-if="seatCompatible" class="flex items-center gap-2"><input type="checkbox" v-model="keepSeat" /> Keep current seat <b>{{ $sel.seatLabel(currentSeat.id) }}</b></label>
                  <div v-else class="text-xs text-gray-500">Current seat {{ $sel.seatLabel(currentSeat.id) }} ({{ currentSeat.category }}) does not match this plan — allocate a new seat from the student profile.</div>
                </template>
                <div v-else-if="plan && plan.seatType === 'Fixed'" class="text-xs text-gray-500">No seat on record — allocate one from the student profile after renewal.</div>
                <div v-else class="text-xs text-gray-500">Flexible seating plan.</div>
              </div>
            </div>
          </div>

          <div v-if="step === 3" class="card-pad">
            <h3 class="card-title mb-3">Calculate amount</h3>
            <div class="grid lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="grid grid-cols-[1fr_120px] gap-3">
                  <Field label="Discount type"><select class="select" v-model="discount.type"><option value="flat">Flat amount (₹)</option><option value="percent">Percentage (%)</option></select></Field>
                  <Field label="Discount"><input class="input" type="number" min="0" v-model="discount.value" /></Field>
                </div>
                <div class="text-xs text-gray-500">Sample rule: maximum discount {{ $db.settings.maxDiscountPercent }}% of plan price.</div>
                <div v-if="calc.capped" class="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">Discount capped at {{ $db.settings.maxDiscountPercent }}% ({{ $inr(calc.discount) }}).</div>
              </div>
              <div class="rounded-xl bg-gray-50 p-5 text-sm space-y-2">
                <div class="flex justify-between"><span class="text-gray-500">{{ plan.name }} ({{ $R.durationLabel(plan) }})</span><span>{{ $inr(calc.base) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Discount</span><span>− {{ $inr(calc.discount) }}</span></div>
                <div class="border-t border-gray-200 my-2"></div>
                <div class="flex justify-between text-base font-semibold"><span>Total payable</span><span>{{ $inr(calc.total) }}</span></div>
              </div>
            </div>
          </div>

          <div v-if="step === 4" class="card-pad">
            <h3 class="card-title mb-3">Record payment</h3>
            <div class="grid lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <Field label="Payment method"><div class="flex flex-wrap gap-2"><button v-for="m in methods" :key="m" class="chip" :class="{ active: method === m }" @click="method = m">{{ m }}</button></div></Field>
                <Field label="Amount received now (₹)" hint="Less than the total records the balance as a pending due."><input class="input" type="number" min="0" v-model="paidNow" /></Field>
              </div>
              <div class="rounded-xl bg-gray-50 p-5 text-sm space-y-2">
                <div class="flex justify-between"><span class="text-gray-500">Total payable</span><span class="font-semibold">{{ $inr(calc.total) }}</span></div>
                <div class="flex justify-between text-emerald-700"><span>Received ({{ method }})</span><span>{{ $inr(paidNow || 0) }}</span></div>
                <div v-if="balance" class="flex justify-between text-amber-700"><span>Balance due</span><span>{{ $inr(balance) }}</span></div>
                <div class="text-xs text-gray-400 pt-2">Simulated payment — no gateway.</div>
              </div>
            </div>
          </div>

          <div v-if="step === 5 && result" class="card-pad text-center py-10">
            <div class="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mb-4"><Icon name="CheckCircle2" :size="30" /></div>
            <h2 class="text-xl font-semibold m-0">Membership renewed</h2>
            <p class="text-sm text-gray-500 mt-1">{{ student.name }} · {{ student.id }}</p>
            <div class="max-w-md mx-auto mt-6 text-left"><MembershipSummary :membership="result.membership" /></div>
            <div v-if="result.due" class="max-w-md mx-auto mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">Balance {{ $inr(result.due.amount) }} recorded as pending ({{ result.due.id }}).</div>
            <div class="flex flex-wrap justify-center gap-2 mt-6">
              <router-link v-if="result.receipt" :to="$link('/receipt/' + result.receipt.id)" class="btn btn-primary"><Icon name="Receipt" :size="16" />View receipt</router-link>
              <router-link :to="$link('/students/' + student.id)" class="btn btn-secondary">View profile</router-link>
              <button class="btn btn-secondary" @click="restart">Renew another</button>
            </div>
          </div>

          <div v-if="step > 0 && step < 5" class="modal-foot">
            <button class="btn btn-secondary" @click="step--"><Icon name="ArrowLeft" :size="15" />Back</button>
            <button v-if="step < 4" class="btn btn-primary" @click="next">Continue<Icon name="ArrowRight" :size="15" /></button>
            <button v-else class="btn btn-success" @click="finish"><Icon name="Check" :size="15" />Record payment & renew</button>
          </div>
        </div>
      </div>`,
  };

  // ======================================================================
  // Membership plans
  // ======================================================================
  const blankPlan = () => ({ id: null, name: '', description: '', duration: 30, unit: 'days', price: 0, branchId: 'ALL', seatCategory: 'Standard', seatType: 'Flexible', hoursFrom: '06:00', hoursTo: '23:00', renewable: true, status: 'Active' });

  SSC.pages.PlanList = {
    data() { return { show: false, form: blankPlan(), errors: {}, filter: 'All' }; },
    computed: {
      plans() { return this.$db.plans.filter((p) => this.filter === 'All' || p.status === this.filter); },
      categories() { return [...new Set(this.$db.halls.map((h) => h.category))]; },
    },
    methods: {
      activeCount(p) { return this.$db.memberships.filter((m) => m.planId === p.id && R.isLive(this.$sel.mStatus(m))).length; },
      openNew() { this.form = blankPlan(); this.errors = {}; this.show = true; },
      openEdit(p) { this.form = { ...p }; this.errors = {}; this.show = true; },
      save() {
        const f = this.form, e = {};
        if (!f.name || f.name.trim().length < 3) e.name = 'Plan name is required.';
        else if (this.$db.plans.some((p) => p.id !== f.id && p.name.toLowerCase() === f.name.trim().toLowerCase())) e.name = 'A plan with this name already exists.';
        if (!(Number(f.duration) >= 1) || !Number.isInteger(Number(f.duration))) e.duration = 'Whole number, at least 1.';
        if (!(Number(f.price) >= 0) || f.price === '') e.price = 'Enter a valid price.';
        if (f.unit === 'hours' && Number(f.duration) > 24) e.duration = 'Hourly plans can be at most 24 hours.';
        if (f.hoursFrom >= f.hoursTo) e.hoursTo = 'Must be after the start time.';
        this.errors = e;
        if (Object.keys(e).length) return;
        const saved = this.$act.savePlan({ ...f, name: f.name.trim(), duration: Number(f.duration), price: Number(f.price) });
        this.$toast(f.id ? `Plan "${saved.name}" updated` : `Plan "${saved.name}" created`);
        this.show = false;
      },
      async toggle(p) {
        const off = p.status === 'Active';
        const ok = await this.$confirm({ title: off ? 'Deactivate plan?' : 'Activate plan?', message: off ? `"${p.name}" will no longer be offered for new admissions or renewals. Existing memberships are not affected.` : `"${p.name}" will be available for admissions and renewals.`, confirmText: off ? 'Deactivate' : 'Activate', tone: off ? 'danger' : 'primary' });
        if (!ok) return;
        this.$act.savePlan({ ...p, status: off ? 'Inactive' : 'Active' });
        this.$toast(`Plan ${off ? 'deactivated' : 'activated'}`);
      },
    },
    template: `
      <div>
        <PageHeader title="Membership plans" subtitle="Durations and prices are configurable — sample values shown">
          <button class="btn btn-primary" @click="openNew"><Icon name="Plus" :size="16" />New plan</button>
        </PageHeader>
        <div class="flex gap-2 mb-4"><button v-for="f in ['All','Active','Inactive']" :key="f" class="chip" :class="{ active: filter === f }" @click="filter = f">{{ f }}</button></div>
        <div class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="p in plans" :key="p.id" class="card card-pad flex flex-col" :class="p.status !== 'Active' ? 'opacity-70' : ''">
            <div class="flex items-start justify-between gap-2">
              <div><div class="font-semibold text-gray-900">{{ p.name }}</div><div class="text-xs text-gray-500">{{ p.id }} · {{ $sel.branchName(p.branchId) }}</div></div>
              <Badge :status="p.status" :tone="p.status === 'Active' ? 'ok' : 'grey'" />
            </div>
            <div class="mt-3 flex items-baseline gap-1"><span class="text-2xl font-bold text-brand-600">{{ $inr(p.price) }}</span><span class="text-sm text-gray-500">/ {{ $R.durationLabel(p) }}</span></div>
            <p class="text-sm text-gray-500 mt-2 mb-3 flex-1">{{ p.description }}</p>
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="rounded-lg bg-gray-50 p-2"><div class="text-gray-500">Seat</div><div class="font-medium">{{ p.seatCategory }} · {{ p.seatType }}</div></div>
              <div class="rounded-lg bg-gray-50 p-2"><div class="text-gray-500">Hours</div><div class="font-medium">{{ p.hoursFrom }} – {{ p.hoursTo }}</div></div>
              <div class="rounded-lg bg-gray-50 p-2"><div class="text-gray-500">Renewal</div><div class="font-medium">{{ p.renewable ? 'Allowed' : 'Not allowed' }}</div></div>
              <div class="rounded-lg bg-gray-50 p-2"><div class="text-gray-500">Active members</div><div class="font-medium">{{ activeCount(p) }}</div></div>
            </div>
            <div class="flex gap-2 mt-4">
              <button class="btn btn-secondary btn-sm flex-1" @click="openEdit(p)"><Icon name="Pencil" :size="14" />Edit</button>
              <button class="btn btn-ghost btn-sm" @click="toggle(p)"><Icon :name="p.status === 'Active' ? 'PowerOff' : 'Power'" :size="14" />{{ p.status === 'Active' ? 'Deactivate' : 'Activate' }}</button>
            </div>
          </div>
        </div>
        <div v-if="!plans.length" class="card"><EmptyState icon="Tags" title="No plans in this filter" /></div>

        <Modal :show="show" :title="form.id ? 'Edit plan — ' + form.name : 'Create membership plan'" size="lg" @close="show = false">
          <div class="grid sm:grid-cols-2 gap-4">
            <Field label="Plan name" required :error="errors.name"><input class="input" :class="{ invalid: errors.name }" v-model="form.name" placeholder="e.g. Monthly" /></Field>
            <Field label="Status"><select class="select" v-model="form.status"><option>Active</option><option>Inactive</option></select></Field>
            <div class="sm:col-span-2"><Field label="Description"><textarea class="textarea" rows="2" v-model="form.description"></textarea></Field></div>
            <div class="grid grid-cols-2 gap-3">
              <Field label="Duration" required :error="errors.duration"><input class="input" :class="{ invalid: errors.duration }" type="number" min="1" v-model="form.duration" /></Field>
              <Field label="Unit"><select class="select" v-model="form.unit"><option value="hours">Hours</option><option value="days">Days</option><option value="weeks">Weeks</option><option value="months">Months</option></select></Field>
            </div>
            <Field label="Price (₹)" required :error="errors.price"><input class="input" :class="{ invalid: errors.price }" type="number" min="0" v-model="form.price" /></Field>
            <Field label="Applicable branch"><select class="select" v-model="form.branchId"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></Field>
            <Field label="Seat category"><select class="select" v-model="form.seatCategory"><option v-for="c in categories" :key="c">{{ c }}</option></select></Field>
            <Field label="Seat type"><div class="flex gap-2"><button v-for="t in ['Fixed','Flexible']" :key="t" class="chip" :class="{ active: form.seatType === t }" @click="form.seatType = t">{{ t }}</button></div></Field>
            <Field label="Renewal eligibility"><label class="flex items-center gap-2 h-10 text-sm"><input type="checkbox" v-model="form.renewable" /> Can be renewed</label></Field>
            <div class="grid grid-cols-2 gap-3 sm:col-span-2">
              <Field label="Allowed from"><input class="input" type="time" v-model="form.hoursFrom" /></Field>
              <Field label="Allowed until" :error="errors.hoursTo"><input class="input" :class="{ invalid: errors.hoursTo }" type="time" v-model="form.hoursTo" /></Field>
            </div>
          </div>
          <div v-if="form.unit && form.duration" class="text-xs text-gray-500 mt-4">Example: starting today, this plan would end on <b>{{ $date($R.endDateFor({ ...form, duration: Number(form.duration) || 1 }, $R.today())) }}</b>.</div>
          <template #footer><button class="btn btn-secondary" @click="show = false">Cancel</button><button class="btn btn-primary" @click="save">{{ form.id ? 'Save changes' : 'Create plan' }}</button></template>
        </Modal>
      </div>`,
  };
})();
