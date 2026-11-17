/* Branch & centre management: BranchList, BranchDetail (info, hours, contact, halls, staff). */
SSC.pages = SSC.pages || {};

(function () {
  const S = SSC.store;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const HALL_TYPES = ['AC', 'Non-AC', 'AC Cabins', 'Silent Zone', 'Group Study'];
  const CATEGORIES = ['Standard', 'AC', 'Premium Cabin'];

  const branchStats = (b) => {
    const halls = S.sel.hallsOf(b.id);
    const seats = S.db.seats.filter((s) => s.branchId === b.id);
    const active = S.db.students.filter((s) => s.branchId === b.id && SSC.rules.isLive(S.sel.studentStatus(s))).length;
    return { halls: halls.length, seats: seats.length, occupied: seats.filter((s) => s.status === 'Occupied').length, active };
  };

  const emptyBranch = () => ({ id: null, name: '', code: '', address: '', phone: '', email: '', openTime: '06:00', closeTime: '22:00', weeklyHoliday: 'None', status: 'Active' });

  // ---------- Shared branch form modal ----------
  const BranchForm = {
    props: { show: Boolean, branch: Object },
    emits: ['close', 'saved'],
    data() { return { f: emptyBranch(), errors: {} }; },
    watch: { show(v) { if (v) { this.f = { ...emptyBranch(), ...(this.branch || {}) }; this.errors = {}; } } },
    methods: {
      save() {
        const e = {};
        if (!this.f.name.trim()) e.name = 'Branch name is required';
        if (!this.f.code.trim()) e.code = 'Branch code is required';
        if (this.f.phone && !/^[+\d\s-]{8,}$/.test(this.f.phone)) e.phone = 'Enter a valid phone number';
        this.errors = e;
        if (Object.keys(e).length) return;
        const b = S.actions.saveBranch({ ...this.f, code: this.f.code.toUpperCase() });
        S.toast(this.branch ? 'Branch updated' : `Branch "${b.name}" added`);
        this.$emit('saved', b);
        this.$emit('close');
      },
    },
    template: `
      <Modal :show="show" :title="branch ? 'Edit branch' : 'Add branch'" @close="$emit('close')">
        <div class="grid sm:grid-cols-2 gap-4">
          <Field label="Branch name" required :error="errors.name"><input class="input" :class="{invalid: errors.name}" v-model="f.name" placeholder="e.g. Baner Branch" /></Field>
          <Field label="Branch code" required :error="errors.code" hint="Short code used in seat numbers"><input class="input uppercase" :class="{invalid: errors.code}" v-model="f.code" maxlength="5" placeholder="BNR" /></Field>
          <div class="sm:col-span-2"><Field label="Address"><textarea class="textarea" v-model="f.address" rows="2"></textarea></Field></div>
          <Field label="Contact number" :error="errors.phone"><input class="input" v-model="f.phone" placeholder="+91 98000 00000" /></Field>
          <Field label="Email"><input class="input" v-model="f.email" type="email" /></Field>
          <Field label="Opens at"><input class="input" type="time" v-model="f.openTime" /></Field>
          <Field label="Closes at"><input class="input" type="time" v-model="f.closeTime" /></Field>
          <Field label="Status"><select class="select" v-model="f.status"><option>Active</option><option>Inactive</option></select></Field>
        </div>
        <template #footer>
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" @click="save"><Icon name="Check" :size="16" />Save branch</button>
        </template>
      </Modal>`,
  };

  // ---------- Hall form modal ----------
  const HallForm = {
    props: { show: Boolean, hall: Object, branchId: String },
    emits: ['close'],
    data() { return { f: {}, errors: {} }; },
    watch: {
      show(v) {
        if (!v) return;
        const b = S.get.branch(this.branchId);
        this.f = this.hall ? { ...this.hall } : { name: '', code: '', floor: 1, capacity: 16, cols: 4, type: 'AC', category: 'AC', openTime: b.openTime, closeTime: b.closeTime, status: 'Active', branchId: this.branchId };
        this.errors = {};
      },
    },
    methods: {
      save() {
        const e = {};
        if (!this.f.name.trim()) e.name = 'Hall name is required';
        if (!(Number(this.f.capacity) > 0)) e.capacity = 'Capacity must be at least 1';
        this.errors = e;
        if (Object.keys(e).length) return;
        const data = { ...this.f, floor: Number(this.f.floor), cols: Number(this.f.cols) || 4 };
        if (this.hall) {
          const current = S.sel.seatsOfHall(this.hall.id).length;
          const want = Number(this.f.capacity);
          delete data.capacity;
          S.actions.saveHall(data);
          if (want > current) S.actions.addSeats(this.hall.id, want - current, { category: data.category, type: 'Fixed' });
          S.toast(want > current ? `Hall updated · ${want - current} seat(s) added` : 'Hall updated');
        } else {
          data.capacity = Number(this.f.capacity);
          const h = S.actions.saveHall(data);
          S.toast(`Hall "${h.name}" created with ${h.capacity} seats`);
        }
        this.$emit('close');
      },
    },
    template: `
      <Modal :show="show" :title="hall ? 'Edit study hall' : 'Add study hall'" @close="$emit('close')">
        <div class="grid sm:grid-cols-2 gap-4">
          <Field label="Hall name" required :error="errors.name"><input class="input" :class="{invalid: errors.name}" v-model="f.name" placeholder="e.g. Silent Hall" /></Field>
          <Field label="Hall code" hint="Auto-generated if left blank"><input class="input" v-model="f.code" :disabled="!!hall" /></Field>
          <Field label="Floor number"><input class="input" type="number" min="0" v-model="f.floor" /></Field>
          <Field label="Capacity (seats)" required :error="errors.capacity" :hint="hall ? 'Increasing capacity adds seats; remove seats from the seat layout' : 'Seats are generated automatically'"><input class="input" type="number" min="1" v-model="f.capacity" /></Field>
          <Field label="Hall type"><select class="select" v-model="f.type"><option v-for="t in types" :key="t">{{ t }}</option></select></Field>
          <Field label="Default seat category"><select class="select" v-model="f.category"><option v-for="c in cats" :key="c">{{ c }}</option></select></Field>
          <Field label="Seats per row" hint="Used for the grid layout"><input class="input" type="number" min="2" max="10" v-model="f.cols" /></Field>
          <Field label="Status"><select class="select" v-model="f.status"><option>Active</option><option>Inactive</option><option>Under Maintenance</option></select></Field>
          <Field label="Opens at"><input class="input" type="time" v-model="f.openTime" /></Field>
          <Field label="Closes at"><input class="input" type="time" v-model="f.closeTime" /></Field>
        </div>
        <template #footer>
          <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
          <button class="btn btn-primary" @click="save"><Icon name="Check" :size="16" />Save hall</button>
        </template>
      </Modal>`,
    computed: { types() { return HALL_TYPES; }, cats() { return CATEGORIES; } },
  };

  // ======================= Branch listing =======================
  SSC.pages.BranchList = {
    components: { BranchForm },
    data() { return { form: false, editing: null, view: 'cards' }; },
    computed: {
      rows() { return S.db.branches.map((b) => ({ ...b, ...branchStats(b), _ref: b })); },
      columns() {
        return [
          { key: 'name', label: 'Branch' }, { key: 'code', label: 'Code' }, { key: 'address', label: 'Address' }, { key: 'phone', label: 'Contact' },
          { key: 'halls', label: 'Halls', align: 'right' }, { key: 'seats', label: 'Seats', align: 'right' }, { key: 'active', label: 'Active students', align: 'right' },
          { key: 'status', label: 'Status' }, { key: 'actions', label: '', sortable: false },
        ];
      },
    },
    methods: {
      add() { this.editing = null; this.form = true; },
      edit(b) { this.editing = S.get.branch(b.id); this.form = true; },
      async toggle(b) {
        const to = b.status === 'Active' ? 'Inactive' : 'Active';
        const ok = await S.confirm({ title: `${to === 'Inactive' ? 'Deactivate' : 'Activate'} ${b.name}?`, message: to === 'Inactive' ? 'The branch will be hidden from new admissions and student bookings. Existing memberships are not affected.' : 'The branch will be available for admissions and bookings again.', confirmText: to === 'Inactive' ? 'Deactivate' : 'Activate', tone: to === 'Inactive' ? 'danger' : 'primary' });
        if (!ok) return;
        S.actions.saveBranch({ id: b.id, status: to });
        S.toast(`${b.name} is now ${to.toLowerCase()}`);
      },
      occ(b) { return b.seats ? Math.round((b.occupied / b.seats) * 100) : 0; },
    },
    template: `
      <div>
        <PageHeader title="Branches" subtitle="Centres, their halls, seats and staff">
          <div class="flex rounded-full border border-gray-200 bg-white p-0.5">
            <button class="btn btn-sm" :class="view === 'cards' ? 'btn-primary' : 'btn-ghost'" @click="view = 'cards'"><Icon name="LayoutGrid" :size="14" /></button>
            <button class="btn btn-sm" :class="view === 'table' ? 'btn-primary' : 'btn-ghost'" @click="view = 'table'"><Icon name="List" :size="14" /></button>
          </div>
          <button class="btn btn-primary" @click="add"><Icon name="Plus" :size="16" />Add branch</button>
        </PageHeader>

        <div v-if="view === 'cards'" class="grid md:grid-cols-2 gap-4">
          <div v-for="b in rows" :key="b.id" class="card card-pad">
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-start gap-3">
                <div class="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 grid place-items-center"><Icon name="Building2" :size="22" /></div>
                <div>
                  <div class="font-semibold text-gray-900">{{ b.name }} <span class="text-xs font-medium text-gray-400 ml-1">{{ b.code }}</span></div>
                  <div class="text-xs text-gray-500 mt-0.5">{{ b.address }}</div>
                  <div class="text-xs text-gray-500 mt-0.5"><Icon name="Phone" :size="12" class="inline -mt-0.5" /> {{ b.phone }} · {{ b.openTime }}–{{ b.closeTime }} · Holiday: {{ b.weeklyHoliday }}</div>
                </div>
              </div>
              <Badge :status="b.status" />
            </div>
            <div class="grid grid-cols-4 gap-2 mt-4 text-center">
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ b.halls }}</div><div class="text-[11px] text-gray-500">Halls</div></div>
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ b.seats }}</div><div class="text-[11px] text-gray-500">Seats</div></div>
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ b.active }}</div><div class="text-[11px] text-gray-500">Active students</div></div>
              <div class="rounded-lg bg-gray-50 py-2"><div class="text-lg font-semibold">{{ occ(b) }}%</div><div class="text-[11px] text-gray-500">Occupancy</div></div>
            </div>
            <div class="flex flex-wrap gap-2 mt-4">
              <router-link :to="$link('/branches/' + b.id)" class="btn btn-secondary btn-sm"><Icon name="Eye" :size="14" />Manage</router-link>
              <router-link :to="$link('/seats') + '?hall=' + b.id + '-A'" class="btn btn-secondary btn-sm"><Icon name="Armchair" :size="14" />Seat layout</router-link>
              <button class="btn btn-ghost btn-sm" @click="edit(b)"><Icon name="Pencil" :size="14" />Edit</button>
              <button class="btn btn-ghost btn-sm" @click="toggle(b)"><Icon :name="b.status === 'Active' ? 'PowerOff' : 'Power'" :size="14" />{{ b.status === 'Active' ? 'Deactivate' : 'Activate' }}</button>
            </div>
          </div>
        </div>

        <div v-else class="card">
          <DataTable :columns="columns" :rows="rows">
            <template #cell-name="{ row }"><router-link :to="$link('/branches/' + row.id)" class="font-medium text-gray-900 hover:text-brand-600 no-underline">{{ row.name }}</router-link></template>
            <template #cell-address="{ row }"><span class="text-xs text-gray-500">{{ row.address }}</span></template>
            <template #cell-status="{ row }"><Badge :status="row.status" /></template>
            <template #cell-actions="{ row }">
              <div class="flex gap-1 justify-end">
                <button class="btn btn-ghost btn-icon" title="Edit" @click="edit(row)"><Icon name="Pencil" :size="15" /></button>
                <button class="btn btn-ghost btn-icon" :title="row.status === 'Active' ? 'Deactivate' : 'Activate'" @click="toggle(row)"><Icon :name="row.status === 'Active' ? 'PowerOff' : 'Power'" :size="15" /></button>
              </div>
            </template>
          </DataTable>
        </div>

        <BranchForm :show="form" :branch="editing" @close="form = false" />
      </div>`,
  };

  // ======================= Branch detail =======================
  SSC.pages.BranchDetail = {
    components: { HallForm },
    data() { return { tab: 'info', f: null, hallForm: false, editingHall: null, assignId: '' }; },
    created() { this.loadForm(); },
    computed: {
      b() { return S.get.branch(this.$route.params.id); },
      stats() { return this.b ? branchStats(this.b) : {}; },
      halls() { return this.b ? S.sel.hallsOf(this.b.id).map((h) => {
        const seats = S.sel.seatsOfHall(h.id);
        return { ...h, seatCount: seats.length, free: seats.filter((s) => s.status === 'Available').length, occupied: seats.filter((s) => s.status === 'Occupied').length };
      }) : []; },
      staff() { return this.b ? S.db.staff.filter((s) => s.branchId === this.b.id) : []; },
      otherStaff() { return this.b ? S.db.staff.filter((s) => s.branchId !== this.b.id && s.status === 'Active') : []; },
      tabs() {
        return [{ key: 'info', label: 'Branch information' }, { key: 'hours', label: 'Operating hours' }, { key: 'contact', label: 'Contact details' },
          { key: 'halls', label: 'Halls', count: this.halls.length }, { key: 'staff', label: 'Staff', count: this.staff.length }];
      },
      days() { return DAYS; },
      holidays() { return (this.f.weeklyHoliday || 'None') === 'None' ? [] : this.f.weeklyHoliday.split(',').map((d) => d.trim()); },
      hallCols() {
        return [{ key: 'name', label: 'Hall' }, { key: 'code', label: 'Code' }, { key: 'floor', label: 'Floor', align: 'right' }, { key: 'type', label: 'Type' },
          { key: 'seatCount', label: 'Seats', align: 'right' }, { key: 'free', label: 'Available', align: 'right' }, { key: 'hours', label: 'Hours', sortable: false },
          { key: 'status', label: 'Status' }, { key: 'actions', label: '', sortable: false }];
      },
    },
    methods: {
      loadForm() { this.f = this.b ? { ...this.b } : null; },
      save(section) {
        if (!this.f.name.trim()) { S.toast('Branch name is required', 'error'); return; }
        S.actions.saveBranch({ ...this.f });
        S.toast(`${section} saved`);
      },
      toggleDay(d) {
        const set = new Set(this.holidays);
        set.has(d) ? set.delete(d) : set.add(d);
        const list = DAYS.filter((x) => set.has(x));
        this.f.weeklyHoliday = list.length ? list.join(', ') : 'None';
      },
      addHall() { this.editingHall = null; this.hallForm = true; },
      editHall(h) { this.editingHall = S.get.hall(h.id); this.hallForm = true; },
      assign() {
        const s = S.get.staff(this.assignId);
        if (!s) return;
        S.actions.saveStaff({ ...s, branchId: this.b.id });
        S.toast(`${s.name} assigned to ${this.b.name}`);
        this.assignId = '';
      },
      async unassign(s) {
        const ok = await S.confirm({ title: `Remove ${s.name} from this branch?`, message: 'The staff member will be moved to "All branches" (unassigned). You can reassign them later.', confirmText: 'Remove' });
        if (!ok) return;
        S.actions.saveStaff({ ...s, branchId: 'ALL' });
        S.toast(`${s.name} unassigned`);
      },
    },
    template: `
      <div v-if="b">
        <PageHeader :title="b.name" :subtitle="b.code + ' · ' + b.address">
          <template #crumbs><router-link :to="$link('/branches')" class="text-xs text-gray-500 no-underline hover:text-brand-600 inline-flex items-center gap-1 mb-1"><Icon name="ArrowLeft" :size="13" />Branches</router-link></template>
          <Badge :status="b.status" />
          <router-link :to="$link('/seats') + '?hall=' + (halls[0] ? halls[0].id : '')" class="btn btn-secondary"><Icon name="Armchair" :size="16" />Seat layout</router-link>
        </PageHeader>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          <StatCard label="Study halls" :value="stats.halls" icon="LayoutGrid" />
          <StatCard label="Total seats" :value="stats.seats" icon="Armchair" tone="info" />
          <StatCard label="Occupied seats" :value="stats.occupied" icon="UserCheck" tone="ok" />
          <StatCard label="Active students" :value="stats.active" icon="Users" tone="warn" />
        </div>

        <div class="card">
          <div class="px-4 pt-2"><Tabs :tabs="tabs" v-model="tab" /></div>
          <div class="card-pad">
            <div v-if="tab === 'info'" class="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <Field label="Branch name" required><input class="input" v-model="f.name" /></Field>
              <Field label="Branch code"><input class="input" v-model="f.code" disabled /></Field>
              <div class="sm:col-span-2"><Field label="Address"><textarea class="textarea" v-model="f.address" rows="2"></textarea></Field></div>
              <Field label="Status"><select class="select" v-model="f.status"><option>Active</option><option>Inactive</option></select></Field>
              <Field label="Branch manager"><select class="select" v-model="f.managerId"><option :value="null">— None —</option><option v-for="s in $db.staff.filter(x => x.role !== 'Staff')" :key="s.id" :value="s.id">{{ s.name }} ({{ s.role }})</option></select></Field>
              <div class="sm:col-span-2 flex gap-2"><button class="btn btn-primary" @click="save('Branch information')"><Icon name="Check" :size="16" />Save changes</button><button class="btn btn-ghost" @click="loadForm">Discard</button></div>
            </div>

            <div v-else-if="tab === 'hours'" class="max-w-3xl space-y-5">
              <div class="grid sm:grid-cols-2 gap-4">
                <Field label="Opens at"><input class="input" type="time" v-model="f.openTime" /></Field>
                <Field label="Closes at"><input class="input" type="time" v-model="f.closeTime" /></Field>
              </div>
              <div>
                <div class="label">Weekly holidays</div>
                <div class="flex flex-wrap gap-2">
                  <button v-for="d in days" :key="d" class="chip" :class="{ active: holidays.includes(d) }" @click="toggleDay(d)">{{ d.slice(0, 3) }}</button>
                </div>
                <div class="hint">Selected: {{ f.weeklyHoliday }}. Hall-level hours can be overridden in the Halls tab.</div>
              </div>
              <div class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800"><b>To confirm with client:</b> are public holidays and special exam-season timings needed?</div>
              <button class="btn btn-primary" @click="save('Operating hours')"><Icon name="Check" :size="16" />Save hours</button>
            </div>

            <div v-else-if="tab === 'contact'" class="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <Field label="Contact number"><input class="input" v-model="f.phone" /></Field>
              <Field label="Email"><input class="input" type="email" v-model="f.email" /></Field>
              <div class="sm:col-span-2"><Field label="Address"><textarea class="textarea" v-model="f.address" rows="2"></textarea></Field></div>
              <div class="sm:col-span-2"><button class="btn btn-primary" @click="save('Contact details')"><Icon name="Check" :size="16" />Save contact details</button></div>
            </div>

            <div v-else-if="tab === 'halls'">
              <div class="flex justify-end mb-3"><button class="btn btn-primary btn-sm" @click="addHall"><Icon name="Plus" :size="14" />Add hall</button></div>
              <div class="border border-gray-100 rounded-xl overflow-hidden">
                <DataTable :columns="hallCols" :rows="halls">
                  <template #cell-name="{ row }"><span class="font-medium">{{ row.name }}</span></template>
                  <template #cell-hours="{ row }"><span class="text-xs">{{ row.openTime }}–{{ row.closeTime }}</span></template>
                  <template #cell-status="{ row }"><Badge :status="row.status" :tone="row.status === 'Active' ? 'ok' : 'grey'" /></template>
                  <template #cell-actions="{ row }">
                    <div class="flex gap-1 justify-end">
                      <router-link :to="$link('/seats') + '?hall=' + row.id" class="btn btn-ghost btn-sm"><Icon name="Armchair" :size="14" />Seats</router-link>
                      <button class="btn btn-ghost btn-icon" title="Edit hall" @click="editHall(row)"><Icon name="Pencil" :size="15" /></button>
                    </div>
                  </template>
                </DataTable>
              </div>
            </div>

            <div v-else-if="tab === 'staff'">
              <div class="flex flex-wrap items-end gap-2 mb-4">
                <div class="w-72"><Field label="Assign existing staff"><select class="select" v-model="assignId"><option value="">Select staff member…</option><option v-for="s in otherStaff" :key="s.id" :value="s.id">{{ s.name }} — {{ s.role }} ({{ $sel.branchName(s.branchId) }})</option></select></Field></div>
                <button class="btn btn-primary" :disabled="!assignId" @click="assign"><Icon name="UserPlus" :size="16" />Assign</button>
                <router-link v-if="$role() === 'admin'" :to="$link('/staff')" class="btn btn-ghost">Manage all staff</router-link>
              </div>
              <div v-if="staff.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div v-for="s in staff" :key="s.id" class="rounded-xl border border-gray-200 p-3 flex items-center gap-3">
                  <Avatar :name="s.name" :size="38" />
                  <div class="min-w-0 flex-1"><div class="text-sm font-medium">{{ s.name }}</div><div class="text-xs text-gray-500">{{ s.mobile }}</div><div class="mt-1 flex gap-1"><Badge :status="s.role" /><Badge :status="s.status" /></div></div>
                  <button class="btn btn-ghost btn-icon" title="Unassign" @click="unassign(s)"><Icon name="UserMinus" :size="15" /></button>
                </div>
              </div>
              <EmptyState v-else icon="Users" title="No staff assigned" text="Assign an existing staff member above." />
            </div>
          </div>
        </div>
        <HallForm :show="hallForm" :hall="editingHall" :branch-id="b.id" @close="hallForm = false" />
      </div>
      <div v-else class="card"><EmptyState icon="Building2" title="Branch not found"><router-link :to="$link('/branches')" class="btn btn-secondary">Back to branches</router-link></EmptyState></div>`,
  };
})();
