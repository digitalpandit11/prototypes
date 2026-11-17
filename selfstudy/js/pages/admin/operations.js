/* Operations: service requests (Workflow 7, admin/staff side), staff management, settings. */
SSC.pages = SSC.pages || {};

(function () {
  const S = SSC.store;
  const R = SSC.rules;
  const CATEGORIES = ['AC / Ventilation', 'Wi-Fi / Internet', 'Cleanliness', 'Seat-related issue', 'Noise complaint', 'Other'];
  const catIcon = { 'AC / Ventilation': 'AirVent', 'Wi-Fi / Internet': 'Wifi', Cleanliness: 'Sparkles', 'Seat-related issue': 'Armchair', 'Noise complaint': 'Volume2', Other: 'CircleHelp' };

  // ======================= Service requests =======================
  SSC.pages.RequestList = {
    data() { return { status: 'Active', category: 'All', branch: S.ui.branch, q: '', openId: null, newStatus: '', note: '' }; },
    mounted() { this.$watch(() => S.ui.branch, (v) => { this.branch = v; }); },
    computed: {
      isStaff() { return this.$route.meta.role === 'staff'; },
      branchFilter() { return this.isStaff ? S.ui.branch : this.branch; },
      categories() { return CATEGORIES; },
      base() { return S.db.requests.filter((r) => S.sel.inBranch(r, this.branchFilter)); },
      counts() {
        const c = { All: this.base.length, Active: 0, Open: 0, 'In Progress': 0, Resolved: 0 };
        this.base.forEach((r) => { c[r.status]++; if (r.status !== 'Resolved') c.Active++; });
        return c;
      },
      rows() {
        const q = this.q.trim().toLowerCase();
        return this.base.filter((r) => (this.status === 'All' || (this.status === 'Active' ? r.status !== 'Resolved' : r.status === this.status))
          && (this.category === 'All' || r.category === this.category)
          && (!q || r.subject.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || S.sel.studentName(r.studentId).toLowerCase().includes(q)))
          .map((r) => ({ ...r, student: S.sel.studentName(r.studentId) }))
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      },
      columns() {
        return [{ key: 'id', label: 'Ticket' }, { key: 'subject', label: 'Request' }, { key: 'student', label: 'Student' }, { key: 'branchId', label: 'Branch' },
          { key: 'priority', label: 'Priority' }, { key: 'createdAt', label: 'Raised' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', sortable: false }];
      },
      statusChips() { return ['Active', 'Open', 'In Progress', 'Resolved', 'All']; },
      req() { return this.openId ? S.get.request(this.openId) : null; },
    },
    methods: {
      icon(c) { return catIcon[c] || 'CircleHelp'; },
      open(r) { this.openId = r.id; this.newStatus = r.status === 'Open' ? 'In Progress' : r.status === 'In Progress' ? 'Resolved' : 'Resolved'; this.note = ''; },
      save() {
        if (this.newStatus === this.req.status && !this.note.trim()) { S.toast('Change the status or add a note', 'warn'); return; }
        S.actions.updateRequest(this.req.id, this.newStatus, this.note.trim());
        S.toast(`${this.req.id} updated to ${this.newStatus} — student notified`);
        this.openId = null;
      },
      quick(r, status) { S.actions.updateRequest(r.id, status, ''); S.toast(`${r.id} → ${status}`); },
    },
    template: `
      <div>
        <PageHeader title="Service Requests" subtitle="Complaints and maintenance requests raised by students" />
        <div class="grid grid-cols-3 gap-4 mb-5">
          <StatCard label="Open" :value="counts.Open" icon="CircleAlert" tone="bad" />
          <StatCard label="In progress" :value="counts['In Progress']" icon="Wrench" tone="warn" />
          <StatCard label="Resolved" :value="counts.Resolved" icon="CircleCheck" tone="ok" />
        </div>
        <div class="card">
          <div class="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div class="flex flex-wrap gap-1.5">
              <button v-for="s in statusChips" :key="s" class="chip" :class="{ active: status === s }" @click="status = s">{{ s === 'Active' ? 'Open + In progress' : s }} <span class="opacity-60">{{ counts[s] }}</span></button>
            </div>
            <div class="flex-1"></div>
            <select class="select h-9 w-48" v-model="category"><option value="All">All categories</option><option v-for="c in categories" :key="c">{{ c }}</option></select>
            <select v-if="!isStaff" class="select h-9 w-44" v-model="branch"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select>
            <div class="w-56"><SearchInput v-model="q" placeholder="Ticket, subject, student" /></div>
          </div>
          <DataTable :columns="columns" :rows="rows" clickable @row-click="open" empty-title="No requests here" empty-text="Nothing matches the selected filters.">
            <template #cell-id="{ row }"><span class="font-medium">{{ row.id }}</span></template>
            <template #cell-subject="{ row }">
              <div class="flex items-center gap-2.5"><div class="w-8 h-8 rounded-lg bg-gray-100 grid place-items-center text-gray-500"><Icon :name="icon(row.category)" :size="16" /></div>
                <div class="min-w-0"><div class="font-medium text-gray-800 truncate max-w-[260px]">{{ row.subject }}</div><div class="text-xs text-gray-400">{{ row.category }}</div></div></div>
            </template>
            <template #cell-branchId="{ row }"><span class="text-xs">{{ $sel.branchName(row.branchId) }}</span></template>
            <template #cell-priority="{ row }"><Badge :status="row.priority" /></template>
            <template #cell-createdAt="{ row }"><span class="text-xs text-gray-500" :title="$dt(row.createdAt)">{{ $rel(row.createdAt) }}</span></template>
            <template #cell-status="{ row }"><Badge :status="row.status" /></template>
            <template #cell-actions="{ row }">
              <div class="flex justify-end" @click.stop>
                <button v-if="row.status === 'Open'" class="btn btn-ghost btn-sm" @click="quick(row, 'In Progress')">Start</button>
                <button v-else-if="row.status === 'In Progress'" class="btn btn-ghost btn-sm text-emerald-700" @click="quick(row, 'Resolved')">Resolve</button>
                <button class="btn btn-ghost btn-icon" @click="open(row)"><Icon name="ChevronRight" :size="16" /></button>
              </div>
            </template>
          </DataTable>
        </div>

        <Modal :show="!!req" :title="req ? req.id + ' · ' + req.subject : ''" size="lg" @close="openId = null">
          <div v-if="req" class="grid md:grid-cols-[1fr_260px] gap-6">
            <div>
              <div class="flex flex-wrap gap-2 mb-3"><Badge :status="req.status" /><Badge :status="req.priority">{{ req.priority }} priority</Badge><span class="badge badge-grey">{{ req.category }}</span></div>
              <p class="text-sm text-gray-700 mt-0">{{ req.description }}</p>
              <div class="text-xs uppercase tracking-wider text-gray-400 mt-5 mb-3">Timeline</div>
              <ol class="relative border-l border-gray-200 ml-2 space-y-4 list-none pl-0">
                <li v-for="(u, i) in req.updates" :key="i" class="ml-4">
                  <span class="absolute -left-[5px] w-2.5 h-2.5 rounded-full mt-1.5" :class="u.status === 'Resolved' ? 'bg-emerald-500' : u.status === 'In Progress' ? 'bg-amber-500' : 'bg-red-500'"></span>
                  <div class="text-xs text-gray-400">{{ $dt(u.at) }} · {{ u.by }}</div>
                  <div class="text-sm"><b>{{ u.status }}</b> — {{ u.text }}</div>
                </li>
              </ol>
            </div>
            <div class="space-y-4">
              <div class="rounded-xl bg-gray-50 p-3 text-sm">
                <div class="flex items-center gap-2"><Avatar :name="$sel.studentName(req.studentId)" :size="30" /><div><div class="font-medium">{{ $sel.studentName(req.studentId) }}</div><div class="text-xs text-gray-500">{{ req.studentId }} · {{ $sel.branchName(req.branchId) }}</div></div></div>
                <div v-if="$sel.studentSeat(req.studentId)" class="text-xs text-gray-500 mt-2">Seat {{ $sel.seatLabel($sel.studentSeat(req.studentId).id) }}</div>
              </div>
              <Field label="Update status"><select class="select" v-model="newStatus"><option>Open</option><option>In Progress</option><option>Resolved</option></select></Field>
              <Field label="Note to student"><textarea class="textarea" v-model="note" placeholder="e.g. Technician visiting at 4 PM"></textarea></Field>
              <button class="btn btn-primary w-full" @click="save"><Icon name="Send" :size="16" />Update & notify</button>
              <div class="text-[11px] text-gray-400">The student sees this update in their portal (Service Requests & Notifications).</div>
            </div>
          </div>
        </Modal>
      </div>`,
  };

  // ======================= Staff management =======================
  const ROLE_MATRIX = [
    ['Dashboard & reports', 'All branches', 'Own branch', 'Basic counts'],
    ['Student registration / admission', '✓', '✓', '✓'],
    ['Check-in / check-out', '✓', '✓', '✓'],
    ['Record payments', '✓', '✓', '✓'],
    ['Refunds & discounts', '✓', 'Up to limit', '—'],
    ['Seat allocation / blocking', '✓', '✓', 'Allocate only'],
    ['Membership plans & pricing', '✓', '—', '—'],
    ['Branches, halls, settings', '✓', '—', '—'],
    ['Staff management', '✓', 'View', '—'],
  ];

  SSC.pages.StaffList = {
    data() { return { q: '', role: 'All', status: 'All', form: false, f: {}, errors: {} }; },
    computed: {
      rows() {
        const q = this.q.trim().toLowerCase();
        return S.db.staff.filter((s) => (this.role === 'All' || s.role === this.role) && (this.status === 'All' || s.status === this.status)
          && (S.ui.branch === 'ALL' || s.branchId === S.ui.branch || s.branchId === 'ALL')
          && (!q || s.name.toLowerCase().includes(q) || s.mobile.replace(/\s/g, '').includes(q.replace(/\s/g, '')) || s.id.toLowerCase().includes(q)));
      },
      columns() {
        return [{ key: 'name', label: 'Name' }, { key: 'role', label: 'Role' }, { key: 'branchId', label: 'Branch' }, { key: 'mobile', label: 'Mobile' },
          { key: 'email', label: 'Email' }, { key: 'joinedOn', label: 'Joined' }, { key: 'status', label: 'Status' }, { key: 'actions', label: '', sortable: false }];
      },
      matrix() { return ROLE_MATRIX; },
      counts() { const c = { Admin: 0, Manager: 0, Staff: 0, Active: 0 }; S.db.staff.forEach((s) => { c[s.role]++; if (s.status === 'Active') c.Active++; }); return c; },
    },
    methods: {
      add() { this.f = { name: '', mobile: '', email: '', role: 'Staff', branchId: S.db.branches[0].id, status: 'Active', joinedOn: R.today() }; this.errors = {}; this.form = true; },
      edit(s) { this.f = { ...s }; this.errors = {}; this.form = true; },
      save() {
        const e = {};
        if (!this.f.name.trim()) e.name = 'Name is required';
        if (!/^\d{10}$/.test((this.f.mobile || '').replace(/\D/g, '').slice(-10)) || (this.f.mobile || '').replace(/\D/g, '').length < 10) e.mobile = 'Enter a 10-digit mobile number';
        if (this.f.email && !/^\S+@\S+\.\S+$/.test(this.f.email)) e.email = 'Enter a valid email';
        this.errors = e;
        if (Object.keys(e).length) return;
        const isNew = !this.f.id;
        const s = S.actions.saveStaff({ ...this.f });
        S.toast(isNew ? `${s.name} added as ${s.role} — login invite simulated` : `${s.name} updated`);
        this.form = false;
      },
      async toggle(s) {
        const to = s.status === 'Active' ? 'Inactive' : 'Active';
        if (s.id === (S.session.user || {}).refId) { S.toast('You cannot deactivate your own account', 'error'); return; }
        const ok = await S.confirm({ title: `${to === 'Inactive' ? 'Deactivate' : 'Activate'} ${s.name}?`, message: to === 'Inactive' ? 'They will no longer be able to log in to the staff panel.' : 'They will be able to log in again.', confirmText: to === 'Inactive' ? 'Deactivate' : 'Activate', tone: to === 'Inactive' ? 'danger' : 'primary' });
        if (!ok) return;
        S.actions.saveStaff({ ...s, status: to });
        S.toast(`${s.name} is now ${to.toLowerCase()}`);
      },
    },
    template: `
      <div>
        <PageHeader title="Staff" subtitle="Team members, roles and branch assignments">
          <button class="btn btn-primary" @click="add"><Icon name="UserPlus" :size="16" />Add staff</button>
        </PageHeader>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Active staff" :value="counts.Active" icon="UserCheck" tone="ok" />
          <StatCard label="Admins" :value="counts.Admin" icon="ShieldCheck" />
          <StatCard label="Managers" :value="counts.Manager" icon="BriefcaseBusiness" tone="info" />
          <StatCard label="Front-desk staff" :value="counts.Staff" icon="ConciergeBell" tone="grey" />
        </div>
        <div class="space-y-5">
          <div class="card">
            <div class="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div class="w-60"><SearchInput v-model="q" placeholder="Name, mobile or ID" /></div>
              <select class="select h-9 w-36" v-model="role"><option value="All">All roles</option><option>Admin</option><option>Manager</option><option>Staff</option></select>
              <select class="select h-9 w-36" v-model="status"><option value="All">All statuses</option><option>Active</option><option>Inactive</option></select>
            </div>
            <DataTable :columns="columns" :rows="rows">
              <template #cell-name="{ row }"><div class="flex items-center gap-2.5"><Avatar :name="row.name" :size="32" /><div><div class="font-medium">{{ row.name }}</div><div class="text-xs text-gray-400">{{ row.id }}</div></div></div></template>
              <template #cell-role="{ row }"><Badge :status="row.role" /></template>
              <template #cell-branchId="{ row }"><span class="text-xs">{{ $sel.branchName(row.branchId) }}</span></template>
              <template #cell-email="{ row }"><span class="text-xs text-gray-500">{{ row.email }}</span></template>
              <template #cell-joinedOn="{ row }"><span class="text-xs">{{ $date(row.joinedOn) }}</span></template>
              <template #cell-status="{ row }"><Badge :status="row.status" /></template>
              <template #cell-actions="{ row }">
                <div class="flex gap-1 justify-end">
                  <button class="btn btn-ghost btn-icon" title="Edit" @click="edit(row)"><Icon name="Pencil" :size="15" /></button>
                  <button class="btn btn-ghost btn-icon" :title="row.status === 'Active' ? 'Deactivate' : 'Activate'" @click="toggle(row)"><Icon :name="row.status === 'Active' ? 'UserX' : 'UserCheck'" :size="15" /></button>
                </div>
              </template>
            </DataTable>
          </div>
          <div class="card card-pad">
            <div class="flex items-center justify-between mb-1"><h3 class="card-title">Role concept</h3><span class="badge badge-warn">To be finalised</span></div>
            <p class="card-sub mt-0 mb-3">Illustrative only. Detailed permission configuration will be agreed during requirement freeze.</p>
            <div class="table-wrap max-w-3xl"><table class="table text-xs">
              <thead><tr><th>Capability</th><th>Admin</th><th>Manager</th><th>Staff</th></tr></thead>
              <tbody><tr v-for="r in matrix" :key="r[0]"><td class="!py-2">{{ r[0] }}</td><td class="!py-2 text-center">{{ r[1] }}</td><td class="!py-2 text-center">{{ r[2] }}</td><td class="!py-2 text-center">{{ r[3] }}</td></tr></tbody>
            </table></div>
          </div>
        </div>

        <Modal :show="form" :title="f.id ? 'Edit staff member' : 'Add staff member'" @close="form = false">
          <div class="grid sm:grid-cols-2 gap-4">
            <Field label="Full name" required :error="errors.name"><input class="input" :class="{invalid: errors.name}" v-model="f.name" /></Field>
            <Field label="Mobile number" required :error="errors.mobile"><input class="input" :class="{invalid: errors.mobile}" v-model="f.mobile" placeholder="98XXX XXXXX" /></Field>
            <Field label="Email" :error="errors.email"><input class="input" type="email" v-model="f.email" /></Field>
            <Field label="Joined on"><input class="input" type="date" v-model="f.joinedOn" /></Field>
            <Field label="Role" hint="Admin · Manager · Staff — permissions TBD"><select class="select" v-model="f.role"><option>Admin</option><option>Manager</option><option>Staff</option></select></Field>
            <Field label="Assigned branch"><select class="select" v-model="f.branchId"><option value="ALL">All branches</option><option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option></select></Field>
            <Field label="Status"><select class="select" v-model="f.status"><option>Active</option><option>Inactive</option></select></Field>
          </div>
          <template #footer><button class="btn btn-secondary" @click="form = false">Cancel</button><button class="btn btn-primary" @click="save"><Icon name="Check" :size="16" />Save</button></template>
        </Modal>
      </div>`,
  };

  // ======================= Settings =======================
  SSC.pages.SettingsPage = {
    data() { return { f: { ...S.db.settings }, ann: { title: '', body: '' } }; },
    methods: {
      save(section) {
        if (!this.f.centreName.trim()) { S.toast('Centre name is required', 'error'); return; }
        const days = Number(this.f.expiringSoonDays), pct = Number(this.f.maxDiscountPercent);
        if (!(days >= 1 && days <= 30)) { S.toast('Expiring-soon window must be 1–30 days', 'error'); return; }
        if (!(pct >= 0 && pct <= 100)) { S.toast('Max discount must be 0–100%', 'error'); return; }
        Object.assign(S.db.settings, { ...this.f, expiringSoonDays: days, maxDiscountPercent: pct, receiptPrefix: (this.f.receiptPrefix || 'RCP').toUpperCase() });
        S.toast(`${section} saved`);
      },
      async reset() {
        const ok = await S.confirm({ title: 'Reset demo data?', message: 'All changes made during the demo will be discarded and the original sample data restored.', confirmText: 'Reset data', tone: 'danger' });
        if (!ok) return;
        S.actions.resetDemo();
        this.f = { ...S.db.settings };
      },
      exportJson() {
        const blob = new Blob([JSON.stringify(S.db, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `studynest-demo-data-${R.today()}.json`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
        S.toast('Demo data exported as JSON');
      },
      announce() {
        if (!this.ann.title.trim() || !this.ann.body.trim()) { S.toast('Enter a title and message', 'warn'); return; }
        S.actions.announce(this.ann.title.trim(), this.ann.body.trim());
        S.toast('Announcement posted to all student portals');
        this.ann = { title: '', body: '' };
      },
    },
    template: `
      <div>
        <PageHeader title="Settings" subtitle="Centre profile, sample business rules and demo controls" />
        <div class="grid lg:grid-cols-2 gap-5 items-start">
          <div class="card card-pad space-y-4">
            <div><h3 class="card-title">Centre profile</h3><div class="card-sub">Shown on receipts and the student portal</div></div>
            <Field label="Centre name" required><input class="input" v-model="f.centreName" /></Field>
            <Field label="Tagline"><input class="input" v-model="f.tagline" /></Field>
            <Field label="Head-office address"><textarea class="textarea" rows="2" v-model="f.address"></textarea></Field>
            <div class="grid sm:grid-cols-2 gap-4">
              <Field label="Phone"><input class="input" v-model="f.phone" /></Field>
              <Field label="Email"><input class="input" type="email" v-model="f.email" /></Field>
              <Field label="Receipt number prefix" hint="e.g. RCP → RCP-0042"><input class="input uppercase" maxlength="6" v-model="f.receiptPrefix" /></Field>
            </div>
            <button class="btn btn-primary" @click="save('Centre profile')"><Icon name="Check" :size="16" />Save profile</button>
          </div>

          <div class="card card-pad space-y-4">
            <div class="flex items-start justify-between"><div><h3 class="card-title">Business rules</h3><div class="card-sub">Sample rules used by the prototype calculations</div></div><span class="badge badge-warn">For client decision</span></div>
            <div class="grid sm:grid-cols-2 gap-4">
              <Field label="“Expiring soon” window (days)"><input class="input" type="number" min="1" max="30" v-model="f.expiringSoonDays" /></Field>
              <Field label="Max discount without approval (%)"><input class="input" type="number" min="0" max="100" v-model="f.maxDiscountPercent" /></Field>
            </div>
            <div>
              <div class="label">Renewal start date</div>
              <div class="space-y-2">
                <label class="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" value="after_expiry" v-model="f.renewalStart" class="mt-1" /><span><b>After current expiry</b><br><span class="text-xs text-gray-500">Renewal begins the day after the running membership ends.</span></span></label>
                <label class="flex items-start gap-2 text-sm cursor-pointer"><input type="radio" value="immediate" v-model="f.renewalStart" class="mt-1" /><span><b>Immediately</b><br><span class="text-xs text-gray-500">Renewal starts on the payment date; remaining days are forfeited.</span></span></label>
              </div>
            </div>
            <label class="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-3 py-2.5 cursor-pointer">
              <span><span class="text-sm font-medium">Allow students to request seat bookings</span><br><span class="text-xs text-gray-500">Requests need staff approval</span></span>
              <input type="checkbox" v-model="f.allowStudentBooking" class="w-5 h-5 accent-[#6C63FF]" />
            </label>
            <button class="btn btn-primary" @click="save('Business rules')"><Icon name="Check" :size="16" />Save rules</button>
          </div>

          <div class="card card-pad space-y-4">
            <div><h3 class="card-title">Send announcement</h3><div class="card-sub">Appears in every student's notifications (in-app only in the prototype)</div></div>
            <Field label="Title"><input class="input" v-model="ann.title" placeholder="e.g. Centre closed on Diwali" /></Field>
            <Field label="Message"><textarea class="textarea" v-model="ann.body"></textarea></Field>
            <button class="btn btn-primary" @click="announce"><Icon name="Megaphone" :size="16" />Post announcement</button>
          </div>

          <div class="card card-pad space-y-4">
            <div><h3 class="card-title">Demo data</h3><div class="card-sub">Data is stored in this browser only (localStorage). Nothing is sent to a server.</div></div>
            <div class="grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ $db.students.length }}</div>Students</div>
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ $db.memberships.length }}</div>Memberships</div>
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ $db.payments.length }}</div>Payments</div>
            </div>
            <div class="flex flex-wrap gap-2">
              <button class="btn btn-danger" @click="reset"><Icon name="RotateCcw" :size="16" />Reset demo data</button>
              <button class="btn btn-secondary" @click="exportJson"><Icon name="Download" :size="16" />Export JSON</button>
            </div>
            <div class="text-xs text-gray-400">Integrations (SMS, WhatsApp, payment gateway, biometric/RFID) are out of scope for this prototype.</div>
          </div>
        </div>
      </div>`,
  };
})();
