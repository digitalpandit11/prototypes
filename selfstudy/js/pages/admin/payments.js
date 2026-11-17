/* Payments — listing, record payment, collect dues, refunds, receipts. All simulated. */
SSC.pages = SSC.pages || {};

(function () {
  const S = SSC.store;
  const R = SSC.rules;
  const METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Online Payment'];

  SSC.pages.PaymentList = {
    data() {
      return {
        view: 'all', q: '', from: R.addDays(R.today(), -30), to: R.today(), branch: S.ui.branch, method: 'All', status: 'All',
        recordOpen: false, rf: {}, rErrors: {},
        collectFor: null, collectMethod: 'UPI',
        refundFor: null, refund: {}, refundErrors: {},
      };
    },
    mounted() { this.$watch(() => S.ui.branch, (v) => { this.branch = v; }); },
    computed: {
      isStaff() { return this.$route.meta.role === 'staff'; },
      branchFilter() { return this.isStaff ? S.ui.branch : this.branch; },
      methods() { return METHODS; },
      base() { return S.db.payments.filter((p) => S.sel.inBranch(p, this.branchFilter)); },
      rows() {
        const q = this.q.trim().toLowerCase();
        let list = this.base;
        if (this.view === 'dues') list = list.filter((p) => p.status === 'Pending');
        else {
          list = list.filter((p) => p.date >= this.from && p.date <= this.to);
          if (this.method !== 'All') list = list.filter((p) => p.method === this.method);
          if (this.status !== 'All') list = list.filter((p) => p.status === this.status);
        }
        return list.map((p) => {
          const m = p.membershipId ? S.get.membership(p.membershipId) : null;
          return { ...p, student: S.sel.studentName(p.studentId), plan: m ? S.sel.planName(m.planId) : 'General' };
        }).filter((p) => !q || p.id.toLowerCase().includes(q) || p.student.toLowerCase().includes(q) || p.studentId.toLowerCase().includes(q))
          .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
      },
      stats() {
        const inRange = this.base.filter((p) => p.date >= this.from && p.date <= this.to);
        const paid = inRange.filter((p) => p.status === 'Paid');
        const refunds = inRange.filter((p) => p.status === 'Refunded');
        const dues = this.base.filter((p) => p.status === 'Pending');
        const byMethod = {};
        paid.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
        return {
          collected: paid.reduce((s, p) => s + p.amount, 0), count: paid.length,
          refunds: refunds.reduce((s, p) => s + Math.abs(p.amount), 0), refundCount: refunds.length,
          dues: dues.reduce((s, p) => s + p.amount, 0), dueCount: dues.length,
          today: this.base.filter((p) => p.status === 'Paid' && p.date === R.today()).reduce((s, p) => s + p.amount, 0),
          byMethod,
        };
      },
      tabs() { return [{ key: 'all', label: 'All transactions' }, { key: 'dues', label: 'Pending dues', count: this.stats.dueCount }]; },
      columns() {
        return [{ key: 'id', label: 'Receipt no.' }, { key: 'student', label: 'Student' }, { key: 'date', label: 'Date' }, { key: 'plan', label: 'Membership' },
          { key: 'amount', label: 'Amount', align: 'right' }, { key: 'method', label: 'Method' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', sortable: false }];
      },
      // record-payment helpers
      rfMemberships() { return this.rf.student ? S.sel.membershipsOf(this.rf.student.id).filter((m) => m.override !== 'Cancelled') : []; },
      rfDues() { return this.rf.student ? S.db.payments.filter((p) => p.studentId === this.rf.student.id && p.status === 'Pending') : []; },
      refundMax() { return this.refundFor ? this.refundFor.amount - this.alreadyRefunded(this.refundFor) : 0; },
    },
    methods: {
      openRecord(student) {
        this.rf = { student: student || null, membershipId: '', amount: '', method: 'UPI', date: R.today(), note: '' };
        this.rErrors = {};
        if (student) this.onStudent(student);
        this.recordOpen = true;
      },
      onStudent(s) {
        this.rf.student = s;
        const m = S.sel.currentMembership(s.id);
        this.rf.membershipId = m ? m.id : '';
        this.onMembership();
      },
      onMembership() {
        const m = this.rf.membershipId ? S.get.membership(this.rf.membershipId) : null;
        if (!m) return;
        const paid = S.db.payments.filter((p) => p.membershipId === m.id && p.status === 'Paid').reduce((s, p) => s + p.amount, 0);
        const due = m.amount - m.discount - paid;
        this.rf.amount = due > 0 ? due : m.amount - m.discount;
      },
      saveRecord() {
        const e = {};
        if (!this.rf.student) e.student = 'Select a student';
        if (!(Number(this.rf.amount) > 0)) e.amount = 'Enter an amount greater than 0';
        if (!this.rf.date) e.date = 'Date is required';
        this.rErrors = e;
        if (Object.keys(e).length) return;
        // Dues for the chosen membership are settled first (each due becomes a paid receipt); any remainder is a new receipt.
        let left = Number(this.rf.amount);
        const ids = [];
        if (this.rf.membershipId) {
          this.rfDues.filter((x) => x.membershipId === this.rf.membershipId).forEach((x) => {
            if (left >= x.amount) { left -= x.amount; ids.push(S.actions.settlePayment(x.id, this.rf.method).id); }
          });
        }
        if (left > 0) ids.push(S.actions.recordPayment({ studentId: this.rf.student.id, membershipId: this.rf.membershipId || null, amount: left, method: this.rf.method, date: this.rf.date, note: this.rf.note }).id);
        const p = { amount: Number(this.rf.amount), date: ids.length > 1 || left <= 0 ? R.today() : this.rf.date };
        this.recordOpen = false;
        S.toast(`Payment ${R.inr(p.amount)} recorded · Receipt ${ids.join(', ')}`);
        this.view = 'all';
        if (p.date < this.from) this.from = p.date;
        if (p.date > this.to) this.to = p.date;
      },
      openCollect(p) { this.collectFor = p; this.collectMethod = 'UPI'; },
      collect() {
        const p = S.actions.settlePayment(this.collectFor.id, this.collectMethod);
        S.toast(`Collected ${R.inr(p.amount)} from ${S.sel.studentName(p.studentId)} via ${this.collectMethod}`);
        this.collectFor = null;
      },
      alreadyRefunded(p) { return S.db.payments.filter((x) => x.type === 'Refund' && (x.note || '').includes(p.id)).reduce((s, x) => s + Math.abs(x.amount), 0); },
      openRefund(p) {
        this.refundFor = p;
        this.refund = { amount: p.amount - this.alreadyRefunded(p), method: p.method === '—' ? 'Cash' : p.method, reason: '' };
        this.refundErrors = {};
      },
      async doRefund() {
        const e = {};
        const amt = Number(this.refund.amount);
        if (!(amt > 0)) e.amount = 'Enter a refund amount';
        else if (amt > this.refundMax) e.amount = `Cannot exceed ${R.inr(this.refundMax)}`;
        if (!this.refund.reason.trim()) e.reason = 'Reason is required for refunds';
        this.refundErrors = e;
        if (Object.keys(e).length) return;
        const ok = await S.confirm({ title: `Refund ${R.inr(amt)}?`, message: `A refund voucher will be created against ${this.refundFor.id} for ${S.sel.studentName(this.refundFor.studentId)}. Refund rules (cancellation window, deductions) are yet to be finalised with the client.`, confirmText: 'Issue refund', tone: 'danger' });
        if (!ok) return;
        const r = S.actions.refundPayment(this.refundFor.id, amt, this.refund.method, this.refund.reason.trim());
        S.toast(`Refund ${R.inr(amt)} recorded · Voucher ${r.id}`);
        this.refundFor = null;
      },
      receipt(p) { this.$router.push(this.$link('/receipt/' + p.id)); },
      setRange(days) { this.to = R.today(); this.from = R.addDays(R.today(), -days); },
    },
    template: `
      <div>
        <PageHeader title="Payments" :subtitle="'Collections, dues, refunds and receipts · ' + $sel.branchName(branchFilter)">
          <button class="btn btn-primary" @click="openRecord()"><Icon name="Plus" :size="16" />Record payment</button>
        </PageHeader>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Collected today" :value="$inr(stats.today)" icon="IndianRupee" tone="ok" />
          <StatCard label="Collected in range" :value="$inr(stats.collected)" icon="Wallet" :hint="stats.count + ' receipt(s) · ' + $date(from) + ' – ' + $date(to)" />
          <StatCard label="Pending dues" :value="$inr(stats.dues)" icon="Hourglass" tone="warn" :hint="stats.dueCount + ' open due(s)'" />
          <StatCard label="Refunds in range" :value="$inr(stats.refunds)" icon="Undo2" tone="info" :hint="stats.refundCount + ' voucher(s)'" />
        </div>

        <div class="card">
          <div class="px-4 pt-2"><Tabs :tabs="tabs" v-model="view" /></div>
          <div class="flex flex-wrap items-end gap-3 px-5 py-4 border-b border-gray-100">
            <div class="w-64"><SearchInput v-model="q" placeholder="Receipt no., student or ID" /></div>
            <template v-if="view === 'all'">
              <div class="flex items-center gap-1.5"><input class="input h-9 w-36" type="date" v-model="from" /><span class="text-gray-400 text-xs">to</span><input class="input h-9 w-36" type="date" v-model="to" /></div>
              <div class="flex gap-1"><button class="chip" @click="setRange(0)">Today</button><button class="chip" @click="setRange(6)">7 days</button><button class="chip" @click="setRange(30)">30 days</button></div>
              <select class="select h-9 w-40" v-model="method"><option value="All">All methods</option><option v-for="m in methods" :key="m">{{ m }}</option></select>
              <select class="select h-9 w-36" v-model="status"><option value="All">All statuses</option><option>Paid</option><option>Pending</option><option>Refunded</option></select>
            </template>
            <select v-if="!isStaff" class="select h-9 w-44" v-model="branch"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
          </div>
          <div v-if="view === 'dues'" class="px-5 py-3 text-xs text-amber-800 bg-amber-50 border-b border-amber-100">Outstanding balances across all dates. Use <b>Collect</b> to record the payment and mark the due as paid.</div>
          <DataTable :columns="columns" :rows="rows" :page-size="12" :empty-title="view === 'dues' ? 'No pending dues' : 'No payments found'">
            <template #cell-id="{ row }"><span class="font-medium text-gray-900">{{ row.id }}</span></template>
            <template #cell-student="{ row }"><router-link :to="$link('/students/' + row.studentId)" class="no-underline text-gray-800 hover:text-brand-600"><div class="font-medium">{{ row.student }}</div><div class="text-xs text-gray-400">{{ row.studentId }}</div></router-link></template>
            <template #cell-date="{ row }">{{ $date(row.date) }}</template>
            <template #cell-amount="{ row }"><span class="font-semibold" :class="row.amount < 0 ? 'text-blue-600' : ''">{{ $inr(row.amount) }}</span></template>
            <template #cell-status="{ row }"><Badge :status="row.status" /></template>
            <template #cell-actions="{ row }">
              <div class="flex gap-1 justify-end">
                <button v-if="row.status === 'Pending'" class="btn btn-success btn-sm" @click="openCollect(row)"><Icon name="HandCoins" :size="14" />Collect</button>
                <button v-if="row.status !== 'Pending'" class="btn btn-ghost btn-sm" @click="receipt(row)"><Icon name="Receipt" :size="14" />Receipt</button>
                <button v-if="row.status === 'Paid' && row.amount > alreadyRefunded(row)" class="btn btn-ghost btn-icon" title="Refund" @click="openRefund(row)"><Icon name="Undo2" :size="15" /></button>
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Record payment -->
        <Modal :show="recordOpen" title="Record payment" @close="recordOpen = false">
          <div class="space-y-4">
            <Field label="Student" required :error="rErrors.student">
              <div v-if="rf.student" class="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2"><Avatar :name="rf.student.name" :size="30" /><div class="flex-1"><div class="text-sm font-medium">{{ rf.student.name }}</div><div class="text-xs text-gray-500">{{ rf.student.id }} · {{ rf.student.mobile }}</div></div><button class="btn btn-ghost btn-sm" @click="rf.student = null">Change</button></div>
              <StudentPicker v-else :branch-id="branchFilter" @select="onStudent" />
            </Field>
            <div v-if="rfDues.length" class="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">Pending dues: <b>{{ $inr(rfDues.reduce((s, p) => s + p.amount, 0)) }}</b> — recording the full due amount against the membership clears it.</div>
            <Field label="Against membership">
              <select class="select" v-model="rf.membershipId" @change="onMembership" :disabled="!rf.student">
                <option value="">General payment (no membership)</option>
                <option v-for="m in rfMemberships" :key="m.id" :value="m.id">{{ m.id }} · {{ $sel.planName(m.planId) }} · {{ $date(m.startDate) }} → {{ $date(m.endDate) }} ({{ $sel.mStatus(m) }})</option>
              </select>
            </Field>
            <div class="grid sm:grid-cols-2 gap-4">
              <Field label="Amount (₹)" required :error="rErrors.amount"><input class="input" type="number" min="1" v-model="rf.amount" /></Field>
              <Field label="Payment date" required :error="rErrors.date"><input class="input" type="date" v-model="rf.date" :max="$R.today()" /></Field>
            </div>
            <div>
              <div class="label">Payment method</div>
              <div class="flex flex-wrap gap-2"><button v-for="m in methods" :key="m" class="chip" :class="{ active: rf.method === m }" @click="rf.method = m">{{ m }}</button></div>
              <div class="hint">Simulated — no payment gateway in the prototype.</div>
            </div>
            <Field label="Note"><input class="input" v-model="rf.note" placeholder="Optional — e.g. UPI ref no." /></Field>
          </div>
          <template #footer><button class="btn btn-secondary" @click="recordOpen = false">Cancel</button><button class="btn btn-primary" @click="saveRecord"><Icon name="Check" :size="16" />Save & generate receipt</button></template>
        </Modal>

        <!-- Collect due -->
        <Modal :show="!!collectFor" title="Collect pending due" size="sm" @close="collectFor = null">
          <div v-if="collectFor" class="space-y-4">
            <div class="rounded-xl bg-gray-50 p-4 text-center">
              <div class="text-xs text-gray-500">{{ $sel.studentName(collectFor.studentId) }} · {{ collectFor.id }}</div>
              <div class="text-3xl font-semibold mt-1">{{ $inr(collectFor.amount) }}</div>
              <div class="text-xs text-gray-500 mt-1">{{ collectFor.note }}</div>
            </div>
            <div><div class="label">Payment method</div><div class="flex flex-wrap gap-2"><button v-for="m in methods" :key="m" class="chip" :class="{ active: collectMethod === m }" @click="collectMethod = m">{{ m }}</button></div></div>
          </div>
          <template #footer><button class="btn btn-secondary" @click="collectFor = null">Cancel</button><button class="btn btn-success" @click="collect"><Icon name="Check" :size="16" />Mark as paid</button></template>
        </Modal>

        <!-- Refund -->
        <Modal :show="!!refundFor" title="Record refund" size="sm" @close="refundFor = null">
          <div v-if="refundFor" class="space-y-4">
            <div class="text-sm text-gray-600">Against receipt <b>{{ refundFor.id }}</b> · {{ $sel.studentName(refundFor.studentId) }} · paid {{ $inr(refundFor.amount) }}</div>
            <Field label="Refund amount (₹)" required :error="refundErrors.amount" :hint="'Maximum ' + $inr(refundMax)"><input class="input" type="number" min="1" :max="refundMax" v-model="refund.amount" /></Field>
            <Field label="Refund via"><select class="select" v-model="refund.method"><option v-for="m in methods" :key="m">{{ m }}</option></select></Field>
            <Field label="Reason" required :error="refundErrors.reason"><textarea class="textarea" v-model="refund.reason" placeholder="e.g. Membership cancelled within 48 hours"></textarea></Field>
          </div>
          <template #footer><button class="btn btn-secondary" @click="refundFor = null">Cancel</button><button class="btn btn-danger" @click="doRefund"><Icon name="Undo2" :size="16" />Issue refund</button></template>
        </Modal>
      </div>`,
  };

  // ---------- Receipt page (admin, staff and student) ----------
  SSC.pages.ReceiptPage = {
    computed: {
      id() { return this.$route.params.id; },
      p() { return S.get.payment(this.id); },
      back() { return this.$link(this.$route.meta.role === 'student' ? '/payments' : '/payments'); },
    },
    methods: { print() { window.print(); }, goBack() { if (window.history.length > 1) this.$router.back(); else this.$router.push(this.back); } },
    template: `
      <div>
        <div class="no-print flex flex-wrap items-center justify-between gap-3 mb-5">
          <button class="btn btn-ghost" @click="goBack"><Icon name="ArrowLeft" :size="16" />Back</button>
          <div class="flex gap-2">
            <button class="btn btn-secondary" @click="$toast('Receipt shared on WhatsApp/SMS — simulated; messaging integrations are out of prototype scope', 'info')"><Icon name="Share2" :size="16" />Share</button>
            <button class="btn btn-primary" @click="print" :disabled="!p"><Icon name="Printer" :size="16" />Print / Save PDF</button>
          </div>
        </div>
        <ReceiptView :payment-id="id" />
      </div>`,
  };
})();
