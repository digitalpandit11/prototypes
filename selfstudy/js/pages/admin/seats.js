/* Study halls & seats — visual seat layout, allocation (Workflow 5), blocking, booking requests. */
SSC.pages = SSC.pages || {};

(function () {
  const S = SSC.store;
  const R = SSC.rules;
  const CATEGORIES = ['Standard', 'AC', 'Premium Cabin'];

  SSC.pages.SeatManager = {
    data() {
      const role = this.$route.meta.role;
      let hall = this.$route.query.hall && S.get.hall(this.$route.query.hall) ? this.$route.query.hall : null;
      let branch = hall ? S.get.hall(hall).branchId : (S.ui.branch !== 'ALL' ? S.ui.branch : S.db.branches[0].id);
      if (role === 'staff' && S.ui.branch !== 'ALL') { branch = S.ui.branch; if (hall && S.get.hall(hall).branchId !== branch) hall = null; }
      if (!hall) { const h = S.sel.hallsOf(branch)[0]; hall = h ? h.id : null; }
      return {
        branch, hall, view: 'grid', category: 'All', selectedId: null,
        panel: null,            // 'allocate' | 'block' | 'edit' | null
        pickStudent: null, blockNote: '', edit: { category: '', type: '' },
        addOpen: false, add: { count: 4, category: 'Standard', type: 'Fixed' },
        rejectFor: null, rejectNote: '',
      };
    },
    computed: {
      isAdmin() { return this.$route.meta.role === 'admin'; },
      hallObj() { return S.get.hall(this.hall); },
      seats() { return this.hall ? S.sel.seatsOfHall(this.hall).filter((s) => this.category === 'All' || s.category === this.category) : []; },
      counts() {
        const c = { Available: 0, Occupied: 0, Reserved: 0, Blocked: 0 };
        (this.hall ? S.sel.seatsOfHall(this.hall) : []).forEach((s) => { c[s.status]++; });
        return c;
      },
      branchCounts() {
        const c = { Available: 0, Occupied: 0, Reserved: 0, Blocked: 0, total: 0 };
        S.db.seats.filter((s) => s.branchId === this.branch).forEach((s) => { c[s.status]++; c.total++; });
        return c;
      },
      seat() { return this.selectedId ? S.get.seat(this.selectedId) : null; },
      seatStudent() { return this.seat && this.seat.studentId ? S.get.student(this.seat.studentId) : null; },
      seatMembership() { return this.seatStudent ? S.sel.currentMembership(this.seatStudent.id) : null; },
      pickMembership() { return this.pickStudent ? S.sel.currentMembership(this.pickStudent.id) : null; },
      pickStatus() { return this.pickMembership ? S.sel.mStatus(this.pickMembership) : 'None'; },
      pickCurrentSeat() { return this.pickStudent ? S.sel.studentSeat(this.pickStudent.id) : null; },
      categoryMismatch() {
        if (!this.pickMembership || !this.seat) return false;
        const plan = S.get.plan(this.pickMembership.planId);
        return plan && plan.seatCategory !== this.seat.category;
      },
      bookings() { return S.db.bookings.filter((b) => b.status === 'Pending' && b.branchId === this.branch).sort((a, b) => a.createdAt.localeCompare(b.createdAt)); },
      tableRows() {
        return this.seats.map((s) => {
          const m = s.studentId ? S.sel.currentMembership(s.studentId) : null;
          return { ...s, student: s.studentId ? S.sel.studentName(s.studentId) : '', expiry: m ? m.endDate : '' };
        });
      },
      columns() {
        return [{ key: 'number', label: 'Seat' }, { key: 'category', label: 'Category' }, { key: 'type', label: 'Fixed / Flexible' }, { key: 'status', label: 'Status' },
          { key: 'student', label: 'Current student' }, { key: 'expiry', label: 'Membership expiry' }, { key: 'actions', label: '', sortable: false }];
      },
      categories() { return ['All', ...CATEGORIES]; },
      cats() { return CATEGORIES; },
    },
    mounted() {
      this.$watch(() => S.ui.branch, (v) => {
        if (v === 'ALL' || v === this.branch) return;
        this.branch = v;
        const h = S.sel.hallsOf(v)[0];
        this.hall = h ? h.id : null;
      });
    },
    watch: {
      hall() { this.selectedId = null; this.panel = null; },
    },
    methods: {
      select(s) { this.selectedId = s.id; this.panel = null; this.pickStudent = null; this.blockNote = ''; },
      close() { this.selectedId = null; this.panel = null; },
      openEdit() { this.edit = { category: this.seat.category, type: this.seat.type }; this.panel = 'edit'; },
      allocate() {
        if (!this.pickStudent) return;
        const res = S.actions.allocateSeat(this.seat.id, this.pickStudent.id);
        S.toast(res.message, res.ok ? 'success' : 'error');
        if (res.ok) { this.panel = null; this.pickStudent = null; }
      },
      async release() {
        const who = this.seatStudent ? this.seatStudent.name : 'the reservation';
        const ok = await S.confirm({ title: `Release seat ${this.seat.number}?`, message: `The seat will be removed from ${who} and marked Available. The membership itself stays active (flexible seating).`, confirmText: 'Release seat', tone: 'danger' });
        if (!ok) return;
        S.actions.releaseSeat(this.seat.id);
        S.toast(`Seat ${this.seat.number} is now available`);
      },
      async block() {
        if (!this.blockNote.trim()) { S.toast('Please enter a reason for blocking', 'warn'); return; }
        if (this.seat.studentId) {
          const ok = await S.confirm({ title: 'Seat is allocated', message: `Blocking will release the seat from ${S.sel.studentName(this.seat.studentId)}. Continue?`, confirmText: 'Block anyway', tone: 'danger' });
          if (!ok) return;
        }
        S.actions.blockSeat(this.seat.id, this.blockNote.trim());
        S.toast(`Seat ${this.seat.number} blocked`, 'warn');
        this.panel = null;
      },
      unblock() { S.actions.unblockSeat(this.seat.id); S.toast(`Seat ${this.seat.number} unblocked and available`); },
      saveEdit() { S.actions.updateSeat(this.seat.id, { ...this.edit }); S.toast(`Seat ${this.seat.number} updated`); this.panel = null; },
      addSeats() {
        const n = Number(this.add.count);
        if (!(n > 0 && n <= 40)) { S.toast('Enter between 1 and 40 seats', 'warn'); return; }
        S.actions.addSeats(this.hall, n, { category: this.add.category, type: this.add.type });
        S.toast(`${n} seat(s) added to ${this.hallObj.name}`);
        this.addOpen = false;
      },
      openAdd() { this.add = { count: 4, category: this.hallObj ? this.hallObj.category : 'Standard', type: 'Fixed' }; this.addOpen = true; },
      approve(b) {
        S.actions.decideBooking(b.id, 'Approved');
        S.toast(`Booking ${b.id} approved — seat ${S.sel.seatLabel(b.seatId)} allocated`);
      },
      openReject(b) { this.rejectFor = b; this.rejectNote = ''; },
      reject() {
        S.actions.decideBooking(this.rejectFor.id, 'Rejected', this.rejectNote.trim());
        S.toast(`Booking ${this.rejectFor.id} rejected`, 'info');
        this.rejectFor = null;
      },
      viewBooking(b) { this.hall = b.hallId; this.$nextTick(() => { this.selectedId = b.seatId; }); },
      bookingFor(seatId) { return S.db.bookings.find((b) => b.seatId === seatId && b.status === 'Pending'); },
      daysLeft(m) { return R.daysBetween(R.today(), m.endDate); },
    },
    template: `
      <div>
        <PageHeader :title="isAdmin ? 'Study Halls & Seats' : 'Seat Allocation'" :subtitle="isAdmin ? 'Visual seat layout per hall — allocate, change, block and configure seats' : 'Select a hall, pick a seat and assign a student'">
          <div class="flex rounded-full border border-gray-200 bg-white p-0.5">
            <button class="btn btn-sm" :class="view === 'grid' ? 'btn-primary' : 'btn-ghost'" @click="view = 'grid'"><Icon name="LayoutGrid" :size="14" />Layout</button>
            <button class="btn btn-sm" :class="view === 'table' ? 'btn-primary' : 'btn-ghost'" @click="view = 'table'"><Icon name="List" :size="14" />List</button>
          </div>
          <button v-if="isAdmin && hall" class="btn btn-primary" @click="openAdd"><Icon name="Plus" :size="16" />Add seats</button>
        </PageHeader>

        <!-- Branch-level summary -->
        <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <StatCard label="Total seats" :value="branchCounts.total" icon="Armchair" hint="Selected branch" />
          <StatCard label="Available" :value="branchCounts.Available" icon="CircleCheck" tone="ok" />
          <StatCard label="Occupied" :value="branchCounts.Occupied" icon="UserCheck" tone="brand" />
          <StatCard label="Reserved" :value="branchCounts.Reserved" icon="Clock" tone="warn" />
          <StatCard label="Blocked" :value="branchCounts.Blocked" icon="Ban" tone="grey" />
        </div>

        <!-- Pending booking requests from student portal -->
        <div v-if="bookings.length" class="card card-pad mb-5 border-amber-200 bg-amber-50/40">
          <div class="flex items-center gap-2 mb-3"><Icon name="BellRing" :size="18" class="text-amber-600" /><h3 class="card-title">Seat booking requests awaiting approval</h3><span class="badge badge-warn">{{ bookings.length }}</span></div>
          <div class="space-y-2">
            <div v-for="b in bookings" :key="b.id" class="flex flex-wrap items-center gap-3 bg-white rounded-xl border border-gray-200 p-3">
              <Avatar :name="$sel.studentName(b.studentId)" :size="34" />
              <div class="flex-1 min-w-[200px]">
                <div class="text-sm font-medium">{{ $sel.studentName(b.studentId) }} <span class="text-xs text-gray-400">{{ b.studentId }} · {{ b.id }}</span></div>
                <div class="text-xs text-gray-500">Seat <b>{{ $sel.seatLabel(b.seatId) }}</b> · from {{ $date(b.fromDate) }} · requested {{ $rel(b.createdAt) }}<span v-if="b.note"> · “{{ b.note }}”</span></div>
              </div>
              <button class="btn btn-ghost btn-sm" @click="viewBooking(b)"><Icon name="Eye" :size="14" />View seat</button>
              <button class="btn btn-secondary btn-sm" @click="openReject(b)"><Icon name="X" :size="14" />Reject</button>
              <button class="btn btn-success btn-sm" @click="approve(b)"><Icon name="Check" :size="14" />Approve</button>
            </div>
          </div>
        </div>

        <div class="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
          <div class="card card-pad">
            <HallPicker v-model:branch="branch" v-model:hall="hall" :lock-branch="!isAdmin" />
            <div v-if="hallObj" class="flex flex-wrap items-center justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
              <div>
                <div class="font-semibold">{{ hallObj.name }} <span class="text-xs text-gray-400 font-medium">{{ hallObj.code }} · Floor {{ hallObj.floor }} · {{ hallObj.type }} · {{ hallObj.openTime }}–{{ hallObj.closeTime }}</span></div>
                <SeatLegend :counts="counts" class="mt-2" />
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button v-for="c in categories" :key="c" class="chip" :class="{ active: category === c }" @click="category = c">{{ c }}</button>
              </div>
            </div>

            <div v-if="!hallObj" class="mt-4"><EmptyState icon="LayoutGrid" title="No hall selected" text="This branch has no study halls yet." /></div>
            <div v-else-if="view === 'grid'" class="mt-5">
              <SeatGrid :seats="seats" :cols="hallObj.cols" :selected-id="selectedId" @select="select" />
              <div v-if="!seats.length" class="text-sm text-gray-500 text-center py-6">No seats match this category.</div>
              <p class="text-[11px] text-gray-400 mt-4 mb-0">Grid layout is a simplified representation. Click a seat to see details and actions. Floor-plan drawing is out of scope for the prototype.</p>
            </div>
            <div v-else class="mt-4 border border-gray-100 rounded-xl overflow-hidden">
              <DataTable :columns="columns" :rows="tableRows" :page-size="12">
                <template #cell-number="{ row }"><span class="font-semibold">{{ row.number }}</span></template>
                <template #cell-status="{ row }"><Badge :status="row.status" /></template>
                <template #cell-student="{ row }">{{ row.student || '—' }}</template>
                <template #cell-expiry="{ row }">{{ row.expiry ? $date(row.expiry) : '—' }}</template>
                <template #cell-actions="{ row }"><button class="btn btn-ghost btn-sm" @click="select(row); view = 'grid'">Manage</button></template>
              </DataTable>
            </div>
          </div>

          <!-- Seat detail panel -->
          <div class="card lg:sticky lg:top-20">
            <div v-if="!seat" class="card-pad"><EmptyState icon="MousePointerClick" title="Select a seat" text="Click any seat in the layout to view its details, allocate a student or block it." /></div>
            <template v-else>
              <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div><div class="text-xs text-gray-500">{{ $sel.seatLabel(seat.id) }}</div><div class="text-lg font-semibold">Seat {{ seat.number }}</div></div>
                <div class="flex items-center gap-2"><Badge :status="seat.status" /><button class="btn btn-ghost btn-icon" @click="close"><Icon name="X" :size="16" /></button></div>
              </div>
              <div class="card-pad space-y-4">
                <KeyValue :items="[
                  { label: 'Hall', value: hallObj ? hallObj.name : '' },
                  { label: 'Category', value: seat.category },
                  { label: 'Seat type', value: seat.type },
                  { label: 'Note', value: seat.note },
                ]" />

                <div v-if="seatStudent" class="rounded-xl border border-gray-200 p-3">
                  <div class="flex items-center gap-3">
                    <Avatar :name="seatStudent.name" :size="36" />
                    <div class="min-w-0 flex-1"><div class="text-sm font-medium">{{ seatStudent.name }}</div><div class="text-xs text-gray-500">{{ seatStudent.id }} · {{ seatStudent.mobile }}</div></div>
                    <router-link :to="$link('/students/' + seatStudent.id)" class="btn btn-ghost btn-icon" title="Open profile"><Icon name="ExternalLink" :size="15" /></router-link>
                  </div>
                  <div v-if="seatMembership" class="mt-3 text-xs flex justify-between"><span class="text-gray-500">{{ $sel.planName(seatMembership.planId) }} · expires {{ $date(seatMembership.endDate) }}</span><Badge :status="$sel.mStatus(seatMembership)" /></div>
                </div>
                <div v-if="bookingFor(seat.id)" class="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">Pending booking request {{ bookingFor(seat.id).id }} from {{ $sel.studentName(bookingFor(seat.id).studentId) }}.</div>

                <!-- Action buttons -->
                <div v-if="!panel" class="flex flex-wrap gap-2">
                  <button v-if="seat.status === 'Available'" class="btn btn-primary btn-sm" @click="panel = 'allocate'"><Icon name="UserPlus" :size="14" />Allocate student</button>
                  <button v-if="seat.status === 'Occupied' || seat.status === 'Reserved'" class="btn btn-secondary btn-sm" @click="panel = 'allocate'"><Icon name="Repeat" :size="14" />Change allocation</button>
                  <button v-if="seat.studentId" class="btn btn-secondary btn-sm" @click="release"><Icon name="LogOut" :size="14" />Release</button>
                  <button v-if="seat.status !== 'Blocked'" class="btn btn-ghost btn-sm" @click="panel = 'block'"><Icon name="Ban" :size="14" />Block</button>
                  <button v-else class="btn btn-success btn-sm" @click="unblock"><Icon name="CircleCheck" :size="14" />Unblock</button>
                  <button v-if="isAdmin" class="btn btn-ghost btn-sm" @click="openEdit"><Icon name="Pencil" :size="14" />Edit seat</button>
                </div>

                <div v-if="panel === 'allocate'" class="space-y-3 border-t border-gray-100 pt-4">
                  <div class="text-sm font-medium">{{ seat.studentId ? 'Assign this seat to another student' : 'Assign student to seat ' + seat.number }}</div>
                  <StudentPicker :branch-id="branch" @select="pickStudent = $event" autofocus />
                  <div v-if="pickStudent" class="rounded-xl border border-gray-200 p-3 text-xs space-y-1.5">
                    <div class="flex items-center justify-between"><b class="text-sm">{{ pickStudent.name }}</b><Badge :status="pickStatus" /></div>
                    <div v-if="pickMembership" class="text-gray-500">{{ $sel.planName(pickMembership.planId) }} · {{ $date(pickMembership.startDate) }} → {{ $date(pickMembership.endDate) }}</div>
                    <div v-if="pickCurrentSeat" class="text-amber-700">Currently holds seat {{ $sel.seatLabel(pickCurrentSeat.id) }} — it will be released.</div>
                    <div v-if="categoryMismatch" class="text-amber-700">Plan seat category ({{ $get.plan(pickMembership.planId).seatCategory }}) differs from this seat ({{ seat.category }}).</div>
                    <div v-if="!['Active','Expiring Soon','Upcoming'].includes(pickStatus)" class="text-red-600">No active membership — renew before allocating.</div>
                  </div>
                  <div class="flex gap-2"><button class="btn btn-primary btn-sm" :disabled="!pickStudent" @click="allocate"><Icon name="Check" :size="14" />Confirm allocation</button><button class="btn btn-ghost btn-sm" @click="panel = null">Cancel</button></div>
                </div>

                <div v-if="panel === 'block'" class="space-y-3 border-t border-gray-100 pt-4">
                  <Field label="Reason for blocking" required><input class="input" v-model="blockNote" placeholder="e.g. Chair repair, AC leak" /></Field>
                  <div class="flex gap-2"><button class="btn btn-danger btn-sm" @click="block"><Icon name="Ban" :size="14" />Block seat</button><button class="btn btn-ghost btn-sm" @click="panel = null">Cancel</button></div>
                </div>

                <div v-if="panel === 'edit'" class="space-y-3 border-t border-gray-100 pt-4">
                  <Field label="Seat category"><select class="select" v-model="edit.category"><option v-for="c in cats" :key="c">{{ c }}</option></select></Field>
                  <Field label="Seat type"><select class="select" v-model="edit.type"><option>Fixed</option><option>Flexible</option></select></Field>
                  <div class="flex gap-2"><button class="btn btn-primary btn-sm" @click="saveEdit"><Icon name="Check" :size="14" />Save</button><button class="btn btn-ghost btn-sm" @click="panel = null">Cancel</button></div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <Modal :show="addOpen" title="Add seats" size="sm" @close="addOpen = false">
          <div class="space-y-4">
            <div class="text-sm text-gray-500">Adding to <b class="text-gray-800">{{ hallObj && hallObj.name }}</b> ({{ hallObj && hallObj.code }}). Seat numbers continue from the last seat.</div>
            <Field label="Number of seats" required><input class="input" type="number" min="1" max="40" v-model="add.count" /></Field>
            <Field label="Seat category"><select class="select" v-model="add.category"><option v-for="c in cats" :key="c">{{ c }}</option></select></Field>
            <Field label="Seat type"><select class="select" v-model="add.type"><option>Fixed</option><option>Flexible</option></select></Field>
          </div>
          <template #footer><button class="btn btn-secondary" @click="addOpen = false">Cancel</button><button class="btn btn-primary" @click="addSeats"><Icon name="Plus" :size="16" />Add seats</button></template>
        </Modal>

        <Modal :show="!!rejectFor" title="Reject booking request" size="sm" @close="rejectFor = null">
          <Field label="Reason (shared with the student)"><textarea class="textarea" v-model="rejectNote" placeholder="e.g. Seat promised to a waitlisted member"></textarea></Field>
          <template #footer><button class="btn btn-secondary" @click="rejectFor = null">Cancel</button><button class="btn btn-danger" @click="reject">Reject booking</button></template>
        </Modal>
      </div>`,
  };
})();
