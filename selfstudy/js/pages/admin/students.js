/* ==========================================================================
   Students: listing, admission wizard (Workflow 1), student profile.
   Also defines shared student-related components (registered globally by
   main.js because they are added to SSC.components before mount):
   StudentFormFields, StudentEditModal, RecordPaymentModal, SeatChooser, SeatChangeModal.
   ========================================================================== */
SSC.pages = SSC.pages || {};

(function () {
  const C = SSC.components;
  const R = SSC.rules;

  const PAY_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Online Payment'];
  const ID_TYPES = ['Aadhaar Card', 'PAN Card', 'Driving Licence', 'Passport', 'Voter ID', 'College ID'];

  const digits = (v) => String(v || '').replace(/\D/g, '');
  const fmtMobile = (v) => { const d = digits(v).slice(-10); return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : v; };

  /** Validates the registration form. Returns { field: message }. */
  function validateStudent(f, ignoreId) {
    const e = {};
    if (!f.name || f.name.trim().length < 3) e.name = 'Enter the full name (min 3 characters).';
    if (!/^[6-9]\d{9}$/.test(digits(f.mobile))) e.mobile = 'Enter a valid 10-digit Indian mobile number.';
    else {
      const dup = SSC.store.db.students.find((s) => s.id !== ignoreId && digits(s.mobile) === digits(f.mobile));
      if (dup) e.mobile = `Already registered to ${dup.name} (${dup.id}).`;
    }
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (f.dob && f.dob > R.today()) e.dob = 'Date of birth cannot be in the future.';
    if (!f.address || f.address.trim().length < 5) e.address = 'Address is required.';
    if (!f.idType) e.idType = 'Select an ID proof type.';
    if (!f.idNumber || f.idNumber.trim().length < 4) e.idNumber = 'Enter the ID proof number.';
    if (!f.emergencyName) e.emergencyName = 'Emergency contact name is required.';
    if (!/^[6-9]\d{9}$/.test(digits(f.emergencyPhone))) e.emergencyPhone = 'Enter a valid 10-digit number.';
    return e;
  }
  SSC.validateStudent = validateStudent;

  const blankStudent = () => ({ name: '', mobile: '', email: '', dob: '', gender: '', address: '', photo: null, idType: '', idNumber: '', emergencyName: '', emergencyPhone: '', notes: '' });

  // ---------- Registration fields (shared by admission + edit) ----------
  C.StudentFormFields = {
    props: { form: Object, errors: { type: Object, default: () => ({}) } },
    data() { return { idTypes: ID_TYPES }; },
    methods: {
      onPhoto(ev) {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
          const size = 120, c = document.createElement('canvas');
          const s = Math.min(img.width, img.height);
          c.width = c.height = size;
          c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
          this.form.photo = c.toDataURL('image/jpeg', 0.7);   // small thumbnail only — prototype
          URL.revokeObjectURL(url);
        };
        img.src = url;
      },
    },
    template: `
      <div class="grid md:grid-cols-[140px_1fr] gap-6">
        <div class="flex flex-col items-center gap-2">
          <div class="w-28 h-28 rounded-2xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden grid place-items-center text-gray-400">
            <img v-if="form.photo" :src="form.photo" class="w-full h-full object-cover" alt="Photo" />
            <Icon v-else name="Camera" :size="28" />
          </div>
          <label class="btn btn-secondary btn-sm cursor-pointer">Upload photo<input type="file" accept="image/*" class="hidden" @change="onPhoto" /></label>
          <button v-if="form.photo" class="btn btn-ghost btn-sm" @click="form.photo = null">Remove</button>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <Field label="Full name" required :error="errors.name"><input class="input" :class="{ invalid: errors.name }" v-model="form.name" placeholder="e.g. Rahul Verma" /></Field>
          <Field label="Mobile number" required :error="errors.mobile"><input class="input" :class="{ invalid: errors.mobile }" v-model="form.mobile" inputmode="numeric" maxlength="11" placeholder="98765 43210" /></Field>
          <Field label="Email" :error="errors.email"><input class="input" :class="{ invalid: errors.email }" v-model="form.email" type="email" placeholder="name@example.com" /></Field>
          <Field label="Date of birth" :error="errors.dob"><input class="input" :class="{ invalid: errors.dob }" v-model="form.dob" type="date" /></Field>
          <Field label="Gender" hint="Optional">
            <select class="select" v-model="form.gender"><option value="">Prefer not to say</option><option>Male</option><option>Female</option><option>Other</option></select>
          </Field>
          <Field label="ID proof type" required :error="errors.idType">
            <select class="select" :class="{ invalid: errors.idType }" v-model="form.idType"><option value="">Select…</option><option v-for="t in idTypes" :key="t">{{ t }}</option></select>
          </Field>
          <Field label="ID proof number" required :error="errors.idNumber"><input class="input" :class="{ invalid: errors.idNumber }" v-model="form.idNumber" placeholder="e.g. XXXX XXXX 1234" /></Field>
          <div class="sm:col-span-2"><Field label="Address" required :error="errors.address"><textarea class="textarea" :class="{ invalid: errors.address }" v-model="form.address" rows="2" placeholder="Flat, building, area, city"></textarea></Field></div>
          <Field label="Emergency contact name" required :error="errors.emergencyName"><input class="input" :class="{ invalid: errors.emergencyName }" v-model="form.emergencyName" placeholder="Parent / guardian" /></Field>
          <Field label="Emergency contact number" required :error="errors.emergencyPhone"><input class="input" :class="{ invalid: errors.emergencyPhone }" v-model="form.emergencyPhone" inputmode="numeric" maxlength="11" placeholder="98765 43210" /></Field>
          <div class="sm:col-span-2"><Field label="Notes"><textarea class="textarea" v-model="form.notes" rows="2" placeholder="Exam preparing for, preferences, etc."></textarea></Field></div>
        </div>
      </div>`,
  };

  // ---------- Edit student modal ----------
  C.StudentEditModal = {
    props: { show: Boolean, studentId: String },
    emits: ['close'],
    data() { return { form: blankStudent(), errors: {} }; },
    watch: {
      show: { immediate: true, handler(v) { if (v) { const s = SSC.store.get.student(this.studentId); this.form = { ...blankStudent(), ...s }; this.errors = {}; } } },
    },
    methods: {
      save() {
        this.errors = validateStudent(this.form, this.studentId);
        if (Object.keys(this.errors).length) return;
        const f = this.form;
        SSC.store.actions.updateStudent(this.studentId, {
          name: f.name.trim(), mobile: fmtMobile(f.mobile), email: f.email, dob: f.dob, gender: f.gender, address: f.address, photo: f.photo,
          idType: f.idType, idNumber: f.idNumber, emergencyName: f.emergencyName, emergencyPhone: fmtMobile(f.emergencyPhone), notes: f.notes,
        });
        this.$toast('Student details updated');
        this.$emit('close');
      },
    },
    template: `
      <Modal :show="show" title="Edit student details" size="xl" @close="$emit('close')">
        <StudentFormFields :form="form" :errors="errors" />
        <template #footer>
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" @click="save">Save changes</button>
        </template>
      </Modal>`,
  };

  // ---------- Record payment / collect dues modal ----------
  C.RecordPaymentModal = {
    props: { show: Boolean, studentId: String },
    emits: ['close', 'done'],
    data() { return { methods: PAY_METHODS, form: { membershipId: '', amount: '', method: 'UPI', date: R.today(), note: '' }, error: '', collectMethod: 'UPI' }; },
    computed: {
      student() { return SSC.store.get.student(this.studentId); },
      dues() { return SSC.store.db.payments.filter((p) => p.studentId === this.studentId && p.status === 'Pending'); },
      memberships() { return SSC.store.sel.membershipsOf(this.studentId); },
    },
    watch: {
      show(v) {
        if (!v) return;
        const cur = SSC.store.sel.currentMembership(this.studentId);
        this.form = { membershipId: cur ? cur.id : '', amount: '', method: 'UPI', date: R.today(), note: '' };
        this.error = '';
      },
    },
    methods: {
      collect(p) {
        const paid = SSC.store.actions.settlePayment(p.id, this.collectMethod);
        this.$toast(`${R.inr(paid.amount)} collected · receipt ${paid.id}`);
        this.$emit('done', paid);
      },
      save() {
        const amt = Number(this.form.amount);
        if (!amt || amt <= 0) { this.error = 'Enter an amount greater than zero.'; return; }
        if (this.form.date > R.today()) { this.error = 'Payment date cannot be in the future.'; return; }
        const p = SSC.store.actions.recordPayment({ studentId: this.studentId, membershipId: this.form.membershipId || null, amount: amt, method: this.form.method, date: this.form.date, note: this.form.note });
        this.$toast(`Payment of ${R.inr(amt)} recorded · receipt ${p.id}`);
        this.$emit('done', p);
        this.$emit('close');
      },
    },
    template: `
      <Modal :show="show" :title="'Record payment' + (student ? ' — ' + student.name : '')" size="md" @close="$emit('close')">
        <div v-if="dues.length" class="mb-5">
          <div class="text-sm font-medium mb-2">Pending dues</div>
          <div class="rounded-xl border border-amber-200 bg-amber-50/60 divide-y divide-amber-100">
            <div v-for="d in dues" :key="d.id" class="flex items-center gap-3 px-3 py-2.5">
              <div class="flex-1 text-sm"><b>{{ $inr(d.amount) }}</b> <span class="text-gray-500">· {{ d.id }} · {{ d.note || 'Due' }}</span></div>
              <select class="select h-8 w-auto text-xs" v-model="collectMethod"><option v-for="m in methods" :key="m">{{ m }}</option></select>
              <button class="btn btn-success btn-sm" @click="collect(d)">Collect</button>
            </div>
          </div>
          <div class="text-xs text-gray-400 mt3 mt-3 mb-1">— or record a new payment —</div>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div class="sm:col-span-2"><Field label="Against membership">
            <select class="select" v-model="form.membershipId">
              <option value="">General / other payment</option>
              <option v-for="m in memberships" :key="m.id" :value="m.id">{{ m.id }} · {{ $sel.planName(m.planId) }} · {{ $sel.mStatus(m) }}</option>
            </select></Field></div>
          <Field label="Amount (₹)" required :error="error"><input class="input" type="number" min="1" v-model="form.amount" placeholder="0" /></Field>
          <Field label="Payment method" required><select class="select" v-model="form.method"><option v-for="m in methods" :key="m">{{ m }}</option></select></Field>
          <Field label="Payment date"><input class="input" type="date" v-model="form.date" /></Field>
          <Field label="Note"><input class="input" v-model="form.note" placeholder="Optional" /></Field>
        </div>
        <p class="text-xs text-gray-400 mt-3 mb-0">Simulated — no payment gateway is involved.</p>
        <template #footer>
          <button class="btn btn-secondary" @click="$emit('close')">Close</button>
          <button class="btn btn-primary" @click="save"><Icon name="IndianRupee" :size="15" />Record payment</button>
        </template>
      </Modal>`,
  };

  // ---------- Seat chooser (branch fixed; halls filtered by seat category) ----------
  C.SeatChooser = {
    props: { branchId: String, category: String, modelValue: String, currentSeatId: String },
    emits: ['update:modelValue'],
    data() { return { hallId: null }; },
    computed: {
      halls() {
        const all = SSC.store.sel.hallsOf(this.branchId).filter((h) => h.status === 'Active');
        const match = all.filter((h) => !this.category || h.category === this.category);
        return match.length ? match : all;
      },
      hall() { return SSC.store.get.hall(this.hallId); },
      seats() { return this.hallId ? SSC.store.sel.seatsOfHall(this.hallId) : []; },
      counts() { return this.seats.reduce((a, s) => { a[s.status] = (a[s.status] || 0) + 1; return a; }, {}); },
      selected() { return SSC.store.get.seat(this.modelValue); },
      freeTotal() { return this.halls.reduce((t, h) => t + this.free(h.id), 0); },
    },
    watch: { branchId: { immediate: true, handler() { this.pickHall(); } }, category() { this.pickHall(); } },
    methods: {
      pickHall() {
        const cur = this.currentSeatId && SSC.store.get.seat(this.currentSeatId);
        const h = (cur && this.halls.find((x) => x.id === cur.hallId)) || this.halls[0];
        this.hallId = h ? h.id : null;
      },
      free(id) { return SSC.store.sel.seatsOfHall(id).filter((s) => s.status === 'Available').length; },
    },
    template: `
      <div>
        <div v-if="halls.length && !freeTotal" class="rounded-xl bg-amber-50 text-amber-800 text-sm p-3 mb-4 flex gap-2"><Icon name="AlertTriangle" :size="18" />No free {{ category || '' }} seats in {{ $sel.branchName(branchId) }} right now. Skip and allocate later (waitlist), or pick a different plan / branch.</div>
        <div class="flex flex-wrap gap-2 mb-4">
          <button v-for="h in halls" :key="h.id" class="chip" :class="{ active: h.id === hallId }" @click="hallId = h.id">{{ h.name }} <span class="opacity-70">· {{ h.category }} · {{ free(h.id) }} free</span></button>
        </div>
        <div v-if="hall" class="grid lg:grid-cols-[1fr_220px] gap-4">
          <div class="rounded-xl border border-gray-200 p-4">
            <SeatGrid :seats="seats" :cols="hall.cols" mode="select" :selected-id="modelValue || currentSeatId" @select="$emit('update:modelValue', $event.id)" />
            <div class="mt-4"><SeatLegend :counts="counts" /></div>
          </div>
          <div class="rounded-xl bg-gray-50 p-4 text-sm">
            <div class="text-xs text-gray-500 mb-1">Selected seat</div>
            <template v-if="selected">
              <div class="text-lg font-semibold">{{ selected.number }}</div>
              <div class="text-gray-600">{{ hall.name }} ({{ hall.code }})</div>
              <div class="text-gray-600">{{ selected.category }} · {{ selected.type }}</div>
            </template>
            <div v-else class="text-gray-500">Click a green seat to select it.</div>
            <div v-if="currentSeatId" class="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">Current seat: <b>{{ $sel.seatLabel(currentSeatId) }}</b></div>
          </div>
        </div>
        <EmptyState v-else icon="Armchair" title="No halls in this branch" />
      </div>`,
  };

  // ---------- Change / allocate seat modal ----------
  C.SeatChangeModal = {
    props: { show: Boolean, studentId: String },
    emits: ['close'],
    data() { return { seatId: null }; },
    computed: {
      m() { return SSC.store.sel.currentMembership(this.studentId); },
      plan() { return this.m ? SSC.store.get.plan(this.m.planId) : null; },
      branchId() { return this.m ? this.m.branchId : (SSC.store.get.student(this.studentId) || {}).branchId; },
      current() { return SSC.store.sel.studentSeat(this.studentId); },
    },
    watch: { show(v) { if (v) this.seatId = null; } },
    methods: {
      save() {
        if (!this.seatId) return;
        const res = SSC.store.actions.allocateSeat(this.seatId, this.studentId);
        this.$toast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) this.$emit('close');
      },
    },
    template: `
      <Modal :show="show" :title="(current ? 'Change seat' : 'Allocate seat') + ' — ' + $sel.studentName(studentId)" size="xl" @close="$emit('close')">
        <div v-if="plan" class="text-sm text-gray-500 mb-4">Plan: <b class="text-gray-800">{{ plan.name }}</b> · seat category <b class="text-gray-800">{{ plan.seatCategory }}</b> · {{ $sel.branchName(branchId) }}</div>
        <SeatChooser v-if="show" :branch-id="branchId" :category="plan && plan.seatType === 'Fixed' ? plan.seatCategory : ''" :current-seat-id="current ? current.id : null" v-model="seatId" />
        <template #footer>
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" :disabled="!seatId" @click="save">Allocate seat</button>
        </template>
      </Modal>`,
  };

  // ======================================================================
  // Student listing
  // ======================================================================
  SSC.pages.StudentList = {
    data() {
      return { q: '', branch: this.$ui.branch, status: 'All', plan: '', editId: null, payId: null };
    },
    computed: {
      base() {
        return this.$db.students.map((s) => {
          const m = this.$sel.currentMembership(s.id);
          const seat = this.$sel.studentSeat(s.id);
          return {
            id: s.id, name: s.name, mobile: s.mobile, email: s.email, branchId: s.branchId, branch: this.$sel.branchName(s.branchId),
            status: this.$sel.studentStatus(s), expiry: m ? m.endDate : '', planId: m ? m.planId : '', seat: seat ? this.$sel.seatLabel(seat.id) : '',
            dues: this.$sel.duesOf(s.id), active: s.status === 'Active',
          };
        });
      },
      inBranch() { return this.base.filter((r) => this.branch === 'ALL' || r.branchId === this.branch); },
      statusTabs() {
        const list = ['All', 'Active', 'Expiring Soon', 'Expired', 'Upcoming', 'Suspended', 'Inactive', 'None'];
        return list.map((s) => ({ key: s, label: s === 'None' ? 'No plan' : s, count: s === 'All' ? this.inBranch.length : this.inBranch.filter((r) => r.status === s).length })).filter((t) => t.key === 'All' || t.count);
      },
      rows() {
        const q = this.q.trim().toLowerCase();
        const qd = digits(q);
        return this.inBranch.filter((r) =>
          (this.status === 'All' || r.status === this.status)
          && (!this.plan || r.planId === this.plan)
          && (!q || r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || (qd && digits(r.mobile).includes(qd))));
      },
      columns() {
        return [
          { key: 'name', label: 'Student / ID' }, { key: 'mobile', label: 'Mobile / Email' },
          { key: 'branch', label: 'Branch' }, { key: 'status', label: 'Membership' }, { key: 'expiry', label: 'Expiry' }, { key: 'seat', label: 'Seat' },
          { key: 'actions', label: 'Actions', sortable: false, align: 'right' },
        ];
      },
    },
    methods: {
      view(r) { this.$router.push(this.$link('/students/' + r.id)); },
      addMembership(r) { this.$router.push({ path: this.$link(this.$role() === 'staff' ? '/renew' : '/memberships/renew'), query: { student: r.id } }); },
      async toggle(r) {
        const deactivate = r.active;
        const ok = await this.$confirm({
          title: deactivate ? `Deactivate ${r.name}?` : `Activate ${r.name}?`,
          message: deactivate ? 'The student will be marked inactive and any allocated seat will be released. Membership history is kept.' : 'The student will be marked active again.',
          confirmText: deactivate ? 'Deactivate' : 'Activate', tone: deactivate ? 'danger' : 'primary',
        });
        if (!ok) return;
        this.$act.setStudentStatus(r.id, deactivate ? 'Inactive' : 'Active');
        this.$toast(`${r.name} ${deactivate ? 'deactivated' : 'activated'}`);
      },
    },
    template: `
      <div>
        <PageHeader title="Students" :subtitle="$db.students.length + ' registered students across ' + $db.branches.length + ' branches'">
          <router-link :to="$link($role() === 'staff' ? '/admission' : '/students/new')" class="btn btn-primary"><Icon name="UserPlus" :size="16" />New admission</router-link>
        </PageHeader>
        <div class="card">
          <div class="p-4 flex flex-wrap gap-3 items-end border-b border-gray-100">
            <div class="flex-1 min-w-[220px]"><SearchInput v-model="q" placeholder="Search by name, mobile or student ID" /></div>
            <select class="select w-auto" v-model="branch"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
            <select class="select w-auto" v-model="plan"><option value="">All membership types</option><option v-for="p in $db.plans" :key="p.id" :value="p.id">{{ p.name }}</option></select>
          </div>
          <div class="px-4 pt-2"><Tabs :tabs="statusTabs" v-model="status" /></div>
          <DataTable :columns="columns" :rows="rows" :page-size="12">
            <template #cell-id="{ row }"><span class="text-xs font-medium text-gray-500">{{ row.id }}</span></template>
            <template #cell-name="{ row }">
              <router-link :to="$link('/students/' + row.id)" class="flex items-center gap-2.5 no-underline text-inherit">
                <Avatar :name="row.name" :size="30" /><span><span class="block font-medium text-gray-800 whitespace-nowrap">{{ row.name }}</span><span class="block text-xs text-gray-500">{{ row.id }}</span></span>
                <span v-if="row.dues" class="badge badge-warn" :title="'Dues ' + $inr(row.dues)">Due</span>
              </router-link>
            </template>
            <template #cell-mobile="{ row }"><div class="whitespace-nowrap">{{ row.mobile }}</div><div class="text-xs text-gray-500">{{ row.email || '—' }}</div></template>
            <template #cell-branch="{ row }"><span class="whitespace-nowrap">{{ row.branch.replace(' Branch', '') }}</span></template>
            <template #cell-status="{ row }"><Badge :status="row.status">{{ row.status === 'None' ? 'No plan' : row.status }}</Badge></template>
            <template #cell-expiry="{ row }"><span class="whitespace-nowrap">{{ $date(row.expiry) }}</span></template>
            <template #cell-seat="{ row }"><span class="whitespace-nowrap">{{ row.seat || '—' }}</span></template>
            <template #cell-actions="{ row }">
              <div class="flex justify-end gap-0.5">
                <button class="btn btn-ghost btn-icon" title="View details" @click="view(row)"><Icon name="Eye" :size="16" /></button>
                <button class="btn btn-ghost btn-icon" title="Edit" @click="editId = row.id"><Icon name="Pencil" :size="15" /></button>
                <button class="btn btn-ghost btn-icon" title="Add / renew membership" @click="addMembership(row)"><Icon name="CalendarPlus" :size="16" /></button>
                <button class="btn btn-ghost btn-icon" title="Record payment" @click="payId = row.id"><Icon name="IndianRupee" :size="16" /></button>
                <button class="btn btn-ghost btn-icon" title="View history" @click="$router.push({ path: $link('/students/' + row.id), query: { tab: 'memberships' } })"><Icon name="History" :size="16" /></button>
                <button class="btn btn-ghost btn-icon" :title="row.active ? 'Deactivate' : 'Activate'" @click="toggle(row)"><Icon :name="row.active ? 'UserX' : 'UserCheck'" :size="16" :class="row.active ? 'text-red-500' : 'text-emerald-600'" /></button>
              </div>
            </template>
          </DataTable>
        </div>
        <StudentEditModal :show="!!editId" :student-id="editId" @close="editId = null" />
        <RecordPaymentModal :show="!!payId" :student-id="payId" @close="payId = null" />
      </div>`,
  };

  // ======================================================================
  // Admission wizard — Workflow 1
  // ======================================================================
  SSC.pages.AdmissionWizard = {
    data() {
      const staffBranch = this.$ui.branch !== 'ALL' ? this.$ui.branch : this.$db.branches[0].id;
      return {
        steps: ['Registration', 'Branch', 'Plan', 'Seat', 'Payment', 'Confirmation'],
        step: 0,
        form: blankStudent(),
        errors: {},
        branchId: staffBranch,
        planId: null,
        startDate: R.today(),
        seatId: null,
        discount: { type: 'flat', value: 0 },
        method: 'UPI',
        paidNow: 0,
        payError: '',
        methods: PAY_METHODS,
        result: null,
      };
    },
    computed: {
      branches() { return this.$db.branches.filter((b) => b.status === 'Active'); },
      plans() { return this.$sel.plansFor(this.branchId); },
      plan() { return this.$get.plan(this.planId); },
      endDate() { return this.plan ? R.endDateFor(this.plan, this.startDate) : null; },
      needsSeat() { return this.plan && this.plan.seatType === 'Fixed'; },
      calc() { return R.calcAmount(this.plan, { type: this.discount.type, value: Number(this.discount.value) || 0 }, this.$db.settings); },
      balance() { return Math.max(0, this.calc.total - (Number(this.paidNow) || 0)); },
      seat() { return this.$get.seat(this.seatId); },
    },
    watch: {
      'calc.total'(t) { this.paidNow = t; },
      branchId() { this.planId = null; this.seatId = null; },
      planId() { this.seatId = null; },
    },
    methods: {
      next() {
        if (this.step === 0) {
          this.errors = validateStudent(this.form);
          if (Object.keys(this.errors).length) { this.$toast('Please fix the highlighted fields', 'error'); return; }
        }
        if (this.step === 2) {
          if (!this.planId) { this.$toast('Select a membership plan', 'error'); return; }
          if (!this.startDate || this.startDate < R.today()) { this.$toast('Start date cannot be in the past', 'error'); return; }
        }
        if (this.step === 1 && !this.branchId) return;
        this.step++;
      },
      back() { if (this.step > 0) this.step--; },
      finish() {
        const paid = Number(this.paidNow) || 0;
        if (paid < 0 || paid > this.calc.total) { this.payError = `Enter an amount between ₹0 and ${R.inr(this.calc.total)}.`; return; }
        this.payError = '';
        const f = this.form;
        const stu = this.$act.addStudent({
          name: f.name.trim(), mobile: fmtMobile(f.mobile), email: f.email, dob: f.dob, gender: f.gender, address: f.address, photo: f.photo,
          idType: f.idType, idNumber: f.idNumber, emergencyName: f.emergencyName, emergencyPhone: fmtMobile(f.emergencyPhone), notes: f.notes, branchId: this.branchId,
        });
        const m = this.$act.createMembership({ studentId: stu.id, planId: this.planId, branchId: this.branchId, startDate: this.startDate, seatId: this.needsSeat ? this.seatId : null, discount: this.calc.discount });
        let receipt = null;
        if (paid > 0) receipt = this.$act.recordPayment({ studentId: stu.id, membershipId: m.id, amount: paid, method: this.method, note: 'Admission' });
        let due = null;
        if (this.balance > 0) due = this.$act.recordPayment({ studentId: stu.id, membershipId: m.id, amount: this.balance, status: 'Pending', note: 'Balance due' });
        this.$act.notify(stu.id, 'announcement', 'Welcome to StudyNest!', `Your ${this.plan.name} membership starts on ${R.fmtDate(this.startDate)}.`);
        this.result = { student: stu, membership: m, receipt: receipt || due, due };
        this.step = 5;
        this.$toast(`Admission complete — ${stu.name} (${stu.id})`);
      },
      restart() { Object.assign(this.$data, this.$options.data.call(this)); },
    },
    template: `
      <div>
        <PageHeader title="New student admission" subtitle="Register → branch → plan → seat → payment">
          <template #crumbs><router-link :to="$link($role() === 'staff' ? '/search' : '/students')" class="text-xs text-gray-500 no-underline inline-flex items-center gap-1 mb-1"><Icon name="ArrowLeft" :size="13" />Back</router-link></template>
        </PageHeader>
        <div class="card card-pad mb-4"><Stepper :steps="steps" :current="step" /></div>

        <div class="card">
          <!-- 1. Registration -->
          <div v-if="step === 0" class="card-pad">
            <h3 class="card-title mb-1">Student registration</h3>
            <p class="card-sub mb-5">Fields marked * are required.</p>
            <StudentFormFields :form="form" :errors="errors" />
          </div>

          <!-- 2. Branch -->
          <div v-if="step === 1" class="card-pad">
            <h3 class="card-title mb-4">Select branch</h3>
            <div class="grid md:grid-cols-2 gap-3">
              <button v-for="b in branches" :key="b.id" class="text-left rounded-xl border-2 p-4 cursor-pointer bg-white font-[inherit] transition" :class="b.id === branchId ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'" @click="branchId = b.id">
                <div class="flex items-center justify-between"><div class="font-semibold">{{ b.name }}</div><Icon v-if="b.id === branchId" name="CheckCircle2" class="text-brand-500" /></div>
                <div class="text-xs text-gray-500 mt-1">{{ b.address }}</div>
                <div class="text-xs text-gray-500 mt-2">{{ b.openTime }}–{{ b.closeTime }} · Holiday: {{ b.weeklyHoliday }} · <b class="text-emerald-600">{{ $sel.kpis(b.id).availableSeats }} seats free</b></div>
              </button>
            </div>
          </div>

          <!-- 3. Plan -->
          <div v-if="step === 2" class="card-pad">
            <h3 class="card-title mb-4">Select membership plan</h3>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <button v-for="p in plans" :key="p.id" class="text-left rounded-xl border-2 p-4 cursor-pointer bg-white font-[inherit] transition" :class="p.id === planId ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-gray-300'" @click="planId = p.id">
                <div class="flex items-start justify-between gap-2"><div class="font-semibold">{{ p.name }}</div><div class="text-lg font-bold text-brand-600">{{ $inr(p.price) }}</div></div>
                <div class="text-xs text-gray-500 mt-1">{{ p.description }}</div>
                <div class="flex flex-wrap gap-1.5 mt-3"><span class="badge badge-grey">{{ $R.durationLabel(p) }}</span><span class="badge badge-info">{{ p.seatCategory }}</span><span class="badge badge-brand">{{ p.seatType }} seat</span></div>
              </button>
            </div>
            <div class="grid sm:grid-cols-3 gap-4 mt-5 max-w-2xl">
              <Field label="Start date" required><input type="date" class="input" v-model="startDate" :min="$R.today()" /></Field>
              <Field label="End date"><div class="input bg-gray-50 flex items-center">{{ endDate ? $date(endDate) : '—' }}</div></Field>
            </div>
          </div>

          <!-- 4. Seat -->
          <div v-if="step === 3" class="card-pad">
            <h3 class="card-title mb-1">Allocate seat</h3>
            <template v-if="needsSeat">
              <p class="card-sub mb-4">{{ plan.name }} includes a fixed {{ plan.seatCategory }} seat. Pick an available seat or skip and allocate later.</p>
              <SeatChooser :branch-id="branchId" :category="plan.seatCategory" v-model="seatId" />
            </template>
            <div v-else class="rounded-xl bg-blue-50 text-blue-800 text-sm p-4 mt-3 flex gap-2"><Icon name="Info" :size="18" />{{ plan.name }} uses flexible seating — the student can take any free {{ plan.seatCategory.toLowerCase() }} seat on arrival. No allocation needed.</div>
          </div>

          <!-- 5. Payment -->
          <div v-if="step === 4" class="card-pad">
            <h3 class="card-title mb-4">Payment</h3>
            <div class="grid lg:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div class="grid grid-cols-[1fr_120px] gap-3">
                  <Field label="Discount type"><select class="select" v-model="discount.type"><option value="flat">Flat amount (₹)</option><option value="percent">Percentage (%)</option></select></Field>
                  <Field label="Discount"><input class="input" type="number" min="0" v-model="discount.value" /></Field>
                </div>
                <div v-if="calc.capped" class="text-xs text-amber-700 bg-amber-50 rounded-lg p-2">Discount capped at {{ $db.settings.maxDiscountPercent }}% of plan price (sample business rule).</div>
                <Field label="Payment method"><div class="flex flex-wrap gap-2"><button v-for="m in methods" :key="m" class="chip" :class="{ active: method === m }" @click="method = m">{{ m }}</button></div></Field>
                <Field label="Amount paid now (₹)" :error="payError" hint="Enter less than the total to record a part payment; the balance is saved as a pending due.">
                  <input class="input" type="number" min="0" v-model="paidNow" />
                </Field>
              </div>
              <div class="rounded-xl bg-gray-50 p-5 text-sm space-y-2">
                <div class="font-semibold mb-2">Summary</div>
                <div class="flex justify-between"><span class="text-gray-500">Student</span><span class="font-medium">{{ form.name }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Branch</span><span>{{ $sel.branchName(branchId) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Plan</span><span>{{ plan.name }} ({{ $R.durationLabel(plan) }})</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Period</span><span>{{ $date(startDate) }} → {{ $date(endDate) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Seat</span><span>{{ seat ? $sel.seatLabel(seat.id) : (needsSeat ? 'Allocate later' : 'Flexible') }}</span></div>
                <div class="border-t border-gray-200 my-2"></div>
                <div class="flex justify-between"><span class="text-gray-500">Plan fee</span><span>{{ $inr(calc.base) }}</span></div>
                <div class="flex justify-between"><span class="text-gray-500">Discount</span><span>− {{ $inr(calc.discount) }}</span></div>
                <div class="flex justify-between text-base font-semibold"><span>Total payable</span><span>{{ $inr(calc.total) }}</span></div>
                <div class="flex justify-between text-emerald-700"><span>Paid now ({{ method }})</span><span>{{ $inr(paidNow || 0) }}</span></div>
                <div v-if="balance" class="flex justify-between text-amber-700"><span>Balance due</span><span>{{ $inr(balance) }}</span></div>
              </div>
            </div>
          </div>

          <!-- 6. Confirmation -->
          <div v-if="step === 5 && result" class="card-pad text-center py-10">
            <div class="w-16 h-16 mx-auto rounded-full bg-emerald-50 text-emerald-600 grid place-items-center mb-4"><Icon name="PartyPopper" :size="30" /></div>
            <h2 class="text-xl font-semibold m-0">Admission confirmed</h2>
            <p class="text-sm text-gray-500 mt-1">{{ result.student.name }} is now registered as <b>{{ result.student.id }}</b>.</p>
            <div class="max-w-md mx-auto mt-6 text-left"><MembershipSummary :membership="result.membership" /></div>
            <div v-if="result.due" class="max-w-md mx-auto mt-3 text-sm text-amber-700 bg-amber-50 rounded-lg p-3">Balance of {{ $inr(result.due.amount) }} recorded as pending ({{ result.due.id }}).</div>
            <div class="flex flex-wrap justify-center gap-2 mt-6">
              <router-link v-if="result.receipt" :to="$link('/receipt/' + result.receipt.id)" class="btn btn-primary"><Icon name="Receipt" :size="16" />View receipt</router-link>
              <router-link :to="$link('/students/' + result.student.id)" class="btn btn-secondary"><Icon name="UserRound" :size="16" />View profile</router-link>
              <button class="btn btn-secondary" @click="restart"><Icon name="UserPlus" :size="16" />New admission</button>
            </div>
          </div>

          <div v-if="step < 5" class="modal-foot">
            <button class="btn btn-secondary" :disabled="step === 0" @click="back"><Icon name="ArrowLeft" :size="15" />Back</button>
            <button v-if="step === 3 && needsSeat && !seatId" class="btn btn-ghost" @click="step++">Skip — allocate later</button>
            <button v-if="step < 4" class="btn btn-primary" :disabled="(step === 3 && needsSeat && !seatId)" @click="next">Continue<Icon name="ArrowRight" :size="15" /></button>
            <button v-else class="btn btn-success" @click="finish"><Icon name="Check" :size="15" />Record payment & confirm</button>
          </div>
        </div>
      </div>`,
  };

  // ======================================================================
  // Student profile
  // ======================================================================
  SSC.pages.StudentProfile = {
    data() { return { tab: this.$route.query.tab || 'personal', editOpen: false, payOpen: false, seatOpen: false }; },
    computed: {
      s() { return this.$get.student(this.$route.params.id); },
      status() { return this.$sel.studentStatus(this.s); },
      m() { return this.$sel.currentMembership(this.s.id); },
      dues() { return this.$sel.duesOf(this.s.id); },
      memberships() { return this.$sel.membershipsOf(this.s.id); },
      attendance() { return this.$sel.attendanceOf(this.s.id).map((a) => ({ ...a, hours: R.hoursBetween(a.checkIn, a.checkOut), state: a.checkOut ? 'Checked Out' : 'Present' })); },
      payments() { return this.$sel.paymentsOf(this.s.id); },
      requests() { return this.$sel.requestsOf(this.s.id); },
      seat() { return this.$sel.studentSeat(this.s.id); },
      present() { return this.$sel.openAttendance(this.s.id); },
      totalHours() { return this.attendance.reduce((t, a) => t + (a.hours || 0), 0); },
      tabs() {
        return [
          { key: 'personal', label: 'Personal Information' },
          { key: 'memberships', label: 'Membership History', count: this.memberships.length },
          { key: 'attendance', label: 'Attendance History', count: this.attendance.length },
          { key: 'payments', label: 'Payment History', count: this.payments.length },
          { key: 'seat', label: 'Seat Allocation' },
          { key: 'requests', label: 'Complaints / Requests', count: this.requests.length },
        ];
      },
      personal() {
        const s = this.s;
        return [
          { label: 'Student ID', value: s.id }, { label: 'Full name', value: s.name }, { label: 'Mobile', value: s.mobile }, { label: 'Email', value: s.email },
          { label: 'Date of birth', value: s.dob ? R.fmtDate(s.dob) : '' }, { label: 'Gender', value: s.gender }, { label: 'Address', value: s.address },
          { label: 'ID proof', value: s.idType ? `${s.idType} — ${s.idNumber}` : '' }, { label: 'Emergency contact', value: s.emergencyName ? `${s.emergencyName} · ${s.emergencyPhone}` : '' },
          { label: 'Home branch', value: this.$sel.branchName(s.branchId) }, { label: 'Registered on', value: R.fmtDate(s.createdAt) }, { label: 'Notes', value: s.notes },
        ];
      },
      renewPath() { return { path: this.$link(this.$role() === 'staff' ? '/renew' : '/memberships/renew'), query: { student: this.s.id } }; },
    },
    methods: {
      checkIn() { const r = this.$act.checkIn(this.s.id); this.$toast(r.message, r.ok ? 'success' : 'error'); },
      checkOut() { const h = this.$act.checkOut(this.present.id); this.$toast(`${this.s.name} checked out — ${R.fmtHours(h)}`); },
      async toggle() {
        const deactivate = this.s.status === 'Active';
        const ok = await this.$confirm({ title: deactivate ? 'Deactivate student?' : 'Activate student?', message: deactivate ? 'Any allocated seat will be released. History is kept.' : 'The student will be marked active again.', confirmText: deactivate ? 'Deactivate' : 'Activate', tone: deactivate ? 'danger' : 'primary' });
        if (!ok) return;
        this.$act.setStudentStatus(this.s.id, deactivate ? 'Inactive' : 'Active');
        this.$toast(`${this.s.name} ${deactivate ? 'deactivated' : 'activated'}`);
      },
      async release() {
        const ok = await this.$confirm({ title: 'Release seat?', message: `Seat ${this.$sel.seatLabel(this.seat.id)} will become available for other students.`, confirmText: 'Release seat', tone: 'danger' });
        if (!ok) return;
        this.$act.releaseSeat(this.seat.id);
        this.$toast('Seat released');
      },
    },
    template: `
      <div v-if="s">
        <router-link :to="$link($role() === 'staff' ? '/search' : '/students')" class="text-xs text-gray-500 no-underline inline-flex items-center gap-1 mb-3"><Icon name="ArrowLeft" :size="13" />Students</router-link>
        <div class="card card-pad mb-4">
          <div class="flex flex-wrap items-center gap-4">
            <img v-if="s.photo" :src="s.photo" class="w-16 h-16 rounded-2xl object-cover" alt="" />
            <Avatar v-else :name="s.name" :size="64" />
            <div class="flex-1 min-w-[200px]">
              <div class="flex flex-wrap items-center gap-2"><h1 class="text-xl font-semibold m-0">{{ s.name }}</h1><Badge :status="status">{{ status === 'None' ? 'No plan' : status }}</Badge><span v-if="present" class="badge badge-ok">In centre since {{ $time(present.checkIn) }}</span></div>
              <div class="text-sm text-gray-500 mt-1">{{ s.id }} · {{ s.mobile }} · {{ $sel.branchName(s.branchId) }}</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <router-link :to="renewPath" class="btn btn-primary btn-sm"><Icon name="RefreshCw" :size="14" />Renew</router-link>
              <button class="btn btn-secondary btn-sm" @click="payOpen = true"><Icon name="IndianRupee" :size="14" />Record payment</button>
              <button v-if="!present" class="btn btn-secondary btn-sm" @click="checkIn"><Icon name="LogIn" :size="14" />Check in</button>
              <button v-else class="btn btn-secondary btn-sm" @click="checkOut"><Icon name="LogOut" :size="14" />Check out</button>
              <button class="btn btn-secondary btn-sm" @click="editOpen = true"><Icon name="Pencil" :size="14" />Edit</button>
              <button class="btn btn-ghost btn-sm" :class="s.status === 'Active' ? 'text-red-600' : 'text-emerald-600'" @click="toggle"><Icon :name="s.status === 'Active' ? 'UserX' : 'UserCheck'" :size="14" />{{ s.status === 'Active' ? 'Deactivate' : 'Activate' }}</button>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-3 gap-4 mb-4">
          <div class="lg:col-span-2"><MembershipSummary :membership="m" /></div>
          <div class="grid grid-cols-2 lg:grid-cols-1 gap-3">
            <div class="card card-pad" :class="dues ? 'border-amber-300 bg-amber-50/40' : ''"><div class="text-xs text-gray-500">Outstanding dues</div><div class="text-xl font-semibold" :class="dues ? 'text-amber-700' : ''">{{ $inr(dues) }}</div>
              <button v-if="dues" class="btn btn-secondary btn-sm mt-2" @click="payOpen = true">Collect</button></div>
            <div class="card card-pad"><div class="text-xs text-gray-500">Study hours ({{ attendance.length }} visits recorded)</div><div class="text-xl font-semibold">{{ $hours(totalHours) }}</div></div>
          </div>
        </div>

        <div class="card">
          <div class="px-4 pt-2"><Tabs :tabs="tabs" v-model="tab" /></div>

          <div v-if="tab === 'personal'" class="card-pad">
            <div class="flex justify-end mb-2"><button class="btn btn-secondary btn-sm" @click="editOpen = true"><Icon name="Pencil" :size="14" />Edit details</button></div>
            <KeyValue :items="personal" />
          </div>

          <div v-if="tab === 'memberships'">
            <DataTable :columns="[{key:'id',label:'Membership'},{key:'planId',label:'Plan'},{key:'startDate',label:'Start'},{key:'endDate',label:'End'},{key:'seatId',label:'Seat'},{key:'amount',label:'Amount',align:'right'},{key:'status',label:'Status',sortable:false}]" :rows="memberships" empty-title="No memberships yet">
              <template #cell-planId="{ row }">{{ $sel.planName(row.planId) }}</template>
              <template #cell-startDate="{ row }">{{ $date(row.startDate) }}</template>
              <template #cell-endDate="{ row }">{{ $date(row.endDate) }}</template>
              <template #cell-seatId="{ row }">{{ row.seatId ? $sel.seatLabel(row.seatId) : '—' }}</template>
              <template #cell-amount="{ row }">{{ $inr(row.amount - row.discount) }}<div v-if="row.discount" class="text-[11px] text-gray-400">incl. {{ $inr(row.discount) }} off</div></template>
              <template #cell-status="{ row }"><Badge :status="$sel.mStatus(row)" /></template>
            </DataTable>
          </div>

          <div v-if="tab === 'attendance'">
            <DataTable :columns="[{key:'date',label:'Date'},{key:'checkIn',label:'Check-in'},{key:'checkOut',label:'Check-out'},{key:'hours',label:'Hours'},{key:'seatId',label:'Seat'},{key:'mode',label:'Mode'},{key:'state',label:'Status'}]" :rows="attendance" empty-title="No attendance yet">
              <template #cell-date="{ row }">{{ $date(row.date) }}</template>
              <template #cell-checkIn="{ row }">{{ $time(row.checkIn) }}</template>
              <template #cell-checkOut="{ row }">{{ row.checkOut ? $time(row.checkOut) : '—' }}</template>
              <template #cell-hours="{ row }">{{ $hours(row.hours) }}</template>
              <template #cell-seatId="{ row }">{{ row.seatId ? $sel.seatLabel(row.seatId) : 'Flexible' }}</template>
              <template #cell-state="{ row }"><Badge :status="row.state" /></template>
            </DataTable>
          </div>

          <div v-if="tab === 'payments'">
            <DataTable :columns="[{key:'id',label:'Receipt'},{key:'date',label:'Date'},{key:'membershipId',label:'Membership'},{key:'amount',label:'Amount',align:'right'},{key:'method',label:'Method'},{key:'status',label:'Status'},{key:'act',label:'',sortable:false,align:'right'}]" :rows="payments" empty-title="No payments yet">
              <template #cell-date="{ row }">{{ $date(row.date) }}</template>
              <template #cell-membershipId="{ row }">{{ row.membershipId ? row.membershipId + ' · ' + $sel.planName(($get.membership(row.membershipId) || {}).planId) : 'General' }}</template>
              <template #cell-amount="{ row }"><span :class="row.amount < 0 ? 'text-blue-600' : ''">{{ $inr(row.amount) }}</span></template>
              <template #cell-status="{ row }"><Badge :status="row.status" /></template>
              <template #cell-act="{ row }">
                <button v-if="row.status === 'Pending'" class="btn btn-secondary btn-sm" @click="payOpen = true">Collect</button>
                <router-link v-else :to="$link('/receipt/' + row.id)" class="btn btn-ghost btn-sm"><Icon name="Receipt" :size="14" />Receipt</router-link>
              </template>
            </DataTable>
          </div>

          <div v-if="tab === 'seat'" class="card-pad">
            <div v-if="seat" class="flex flex-wrap items-center gap-4">
              <div class="seat occupied w-20 h-20 text-base">{{ seat.number }}<small>{{ seat.category }}</small></div>
              <div class="flex-1 text-sm">
                <div class="font-semibold text-base">{{ $sel.seatLabel(seat.id) }}</div>
                <div class="text-gray-500">{{ ($get.hall(seat.hallId) || {}).name }} · Floor {{ ($get.hall(seat.hallId) || {}).floor }} · {{ seat.category }} · {{ seat.type }}</div>
                <div class="mt-1"><Badge :status="seat.status" /></div>
              </div>
              <div class="flex gap-2"><button class="btn btn-primary btn-sm" @click="seatOpen = true"><Icon name="ArrowLeftRight" :size="14" />Change seat</button><button class="btn btn-secondary btn-sm" @click="release">Release seat</button></div>
            </div>
            <EmptyState v-else icon="Armchair" title="No seat allocated" :text="m && $get.plan(m.planId) && $get.plan(m.planId).seatType === 'Flexible' ? 'Current plan uses flexible seating.' : 'Allocate a fixed seat for this student.'">
              <button class="btn btn-primary btn-sm" @click="seatOpen = true">Allocate seat</button>
            </EmptyState>
          </div>

          <div v-if="tab === 'requests'" class="divide-y divide-gray-100">
            <div v-for="r in requests" :key="r.id" class="px-5 py-3 flex items-start gap-3">
              <div class="flex-1"><div class="text-sm font-medium">{{ r.subject }}</div><div class="text-xs text-gray-500">{{ r.id }} · {{ r.category }} · {{ $dt(r.createdAt) }}</div><div class="text-sm text-gray-600 mt-1">{{ r.description }}</div></div>
              <Badge :status="r.status" />
            </div>
            <EmptyState v-if="!requests.length" icon="MessageSquare" title="No complaints or requests" />
          </div>
        </div>

        <StudentEditModal :show="editOpen" :student-id="s.id" @close="editOpen = false" />
        <RecordPaymentModal :show="payOpen" :student-id="s.id" @close="payOpen = false" />
        <SeatChangeModal :show="seatOpen" :student-id="s.id" @close="seatOpen = false" />
      </div>
      <div v-else class="card"><EmptyState icon="UserX" title="Student not found" text="The record may have been removed by a demo reset."><router-link :to="$link('/students')" class="btn btn-secondary btn-sm">Back to students</router-link></EmptyState></div>`,
  };
})();
