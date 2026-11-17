/* ==========================================================================
   Domain widgets: charts, seat grid, student picker, hall picker, receipt,
   membership summary. Registered globally in main.js.
   ========================================================================== */
(function () {
  const C = SSC.components;
  const { markRaw } = Vue;

  // ---------- Chart card (Chart.js) ----------
  // datasets: [{ label, data, color }]; type: line | bar | doughnut
  const PALETTE = ['#6C63FF', '#14b8a6', '#f59e0b', '#ef4444', '#0ea5e9', '#a3a3a3'];
  C.ChartCard = {
    props: { title: String, subtitle: String, type: { type: String, default: 'bar' }, labels: Array, datasets: Array, height: { type: Number, default: 240 }, money: Boolean, percent: Boolean, stacked: Boolean },
    data() { return { chart: null }; },
    mounted() { this.render(); },
    beforeUnmount() { if (this.chart) this.chart.destroy(); },
    watch: { labels: { handler() { this.render(); }, deep: true }, datasets: { handler() { this.render(); }, deep: true } },
    methods: {
      fmt(v) { return this.money ? SSC.rules.inr(v) : this.percent ? v + '%' : v.toLocaleString('en-IN'); },
      render() {
        if (this.chart) this.chart.destroy();
        const isDough = this.type === 'doughnut';
        const ds = (this.datasets || []).map((d, i) => {
          const color = d.color || PALETTE[i % PALETTE.length];
          return {
            label: d.label, data: d.data,
            backgroundColor: isDough ? (d.colors || PALETTE) : this.type === 'line' ? color + '22' : color,
            borderColor: isDough ? '#fff' : color, borderWidth: isDough ? 2 : 2,
            borderRadius: this.type === 'bar' ? 6 : 0, maxBarThickness: 28,
            tension: 0.35, fill: this.type === 'line' && i === 0, pointRadius: this.type === 'line' ? 2.5 : 0,
          };
        });
        const self = this;
        this.chart = markRaw(new Chart(this.$refs.canvas, {
          type: this.type,
          data: { labels: this.labels, datasets: ds },
          options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 300 },
            cutout: isDough ? '68%' : undefined,
            plugins: {
              legend: { display: isDough || ds.length > 1, position: 'bottom', labels: { boxWidth: 10, boxHeight: 10, font: { family: 'Poppins', size: 11 } } },
              tooltip: { callbacks: { label: (c) => `${c.dataset.label || c.label}: ${self.fmt(c.parsed.y ?? c.parsed)}` } },
            },
            scales: isDough ? {} : {
              x: { stacked: this.stacked, grid: { display: false }, ticks: { font: { family: 'Poppins', size: 11 } } },
              y: { stacked: this.stacked, beginAtZero: true, grid: { color: '#f1f2f5' }, ticks: { font: { family: 'Poppins', size: 11 }, callback: (v) => (self.money ? '₹' + (v >= 1000 ? v / 1000 + 'k' : v) : self.percent ? v + '%' : v) } },
            },
          },
        }));
      },
    },
    template: `
      <div class="card card-pad">
        <div class="flex items-start justify-between mb-3">
          <div><h3 class="card-title">{{ title }}</h3><div v-if="subtitle" class="card-sub">{{ subtitle }}</div></div>
          <slot name="actions"></slot>
        </div>
        <div :style="{ height: height + 'px', position: 'relative' }"><canvas ref="canvas"></canvas></div>
      </div>`,
  };

  // ---------- Seat legend ----------
  C.SeatLegend = {
    props: { counts: Object },
    template: `
      <div class="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
        <span class="inline-flex items-center gap-1.5"><i class="legend-dot" style="background:#ecfdf5;border-color:#6ee7b7"></i>Available<b v-if="counts" class="text-gray-800">{{ counts.Available || 0 }}</b></span>
        <span class="inline-flex items-center gap-1.5"><i class="legend-dot" style="background:#eef2ff;border-color:#a5b4fc"></i>Occupied<b v-if="counts" class="text-gray-800">{{ counts.Occupied || 0 }}</b></span>
        <span class="inline-flex items-center gap-1.5"><i class="legend-dot" style="background:#fffbeb;border-color:#fcd34d"></i>Reserved<b v-if="counts" class="text-gray-800">{{ counts.Reserved || 0 }}</b></span>
        <span class="inline-flex items-center gap-1.5"><i class="legend-dot" style="background:#f3f4f6;border-color:#d1d5db"></i>Blocked<b v-if="counts" class="text-gray-800">{{ counts.Blocked || 0 }}</b></span>
      </div>`,
  };

  // ---------- Seat grid ----------
  // mode 'manage': every seat clickable; 'select': only `selectable` statuses clickable.
  C.SeatGrid = {
    props: {
      seats: Array, cols: { type: Number, default: 4 }, selectedId: String,
      mode: { type: String, default: 'manage' }, selectable: { type: Array, default: () => ['Available'] },
      showStudent: { type: Boolean, default: true }, highlightStudent: String,
    },
    emits: ['select'],
    computed: {
      gridStyle() { return { display: 'grid', gridTemplateColumns: `repeat(${this.cols}, minmax(54px, 1fr))`, gap: '10px' }; },
    },
    methods: {
      cls(s) {
        return [s.status.toLowerCase(), {
          selected: s.id === this.selectedId || (this.highlightStudent && s.studentId === this.highlightStudent),
          disabled: this.mode === 'select' && !this.selectable.includes(s.status),
        }];
      },
      sub(s) {
        if (s.status === 'Blocked') return 'Blocked';
        if (this.showStudent && s.studentId) return SSC.rules.initials(SSC.store.sel.studentName(s.studentId));
        return s.type === 'Flexible' ? 'Flex' : s.category === 'Premium Cabin' ? 'Cabin' : s.category;
      },
      tip(s) {
        const who = s.studentId ? ` · ${SSC.store.sel.studentName(s.studentId)}` : '';
        return `${s.number} · ${s.category} · ${s.type} · ${s.status}${who}${s.note ? ' · ' + s.note : ''}`;
      },
      click(s) { if (this.mode === 'select' && !this.selectable.includes(s.status)) return; this.$emit('select', s); },
    },
    template: `
      <div class="overflow-x-auto scroll-thin pb-1">
        <div class="text-center text-[10px] tracking-[.3em] uppercase text-gray-400 mb-3 border-b border-dashed border-gray-200 pb-2">Entrance / Front desk side</div>
        <div :style="gridStyle">
          <div v-for="s in seats" :key="s.id" class="seat" :class="cls(s)" :title="tip(s)" @click="click(s)">
            {{ s.number }}<small>{{ sub(s) }}</small>
          </div>
        </div>
      </div>`,
  };

  // ---------- Branch + hall picker (chips) ----------
  C.HallPicker = {
    props: { branch: String, hall: String, lockBranch: Boolean },
    emits: ['update:branch', 'update:hall'],
    computed: {
      branches() { return SSC.store.db.branches.filter((b) => b.status === 'Active'); },
      halls() { return SSC.store.sel.hallsOf(this.branch); },
    },
    methods: {
      setBranch(id) { this.$emit('update:branch', id); const h = SSC.store.sel.hallsOf(id)[0]; this.$emit('update:hall', h ? h.id : null); },
      free(hallId) { return SSC.store.sel.seatsOfHall(hallId).filter((s) => s.status === 'Available').length; },
    },
    template: `
      <div class="space-y-3">
        <div v-if="!lockBranch">
          <div class="label">Branch</div>
          <div class="flex flex-wrap gap-2">
            <button v-for="b in branches" :key="b.id" class="chip" :class="{ active: b.id === branch }" @click="setBranch(b.id)">{{ b.name }}</button>
          </div>
        </div>
        <div>
          <div class="label">Study hall</div>
          <div class="flex flex-wrap gap-2">
            <button v-for="h in halls" :key="h.id" class="chip" :class="{ active: h.id === hall }" @click="$emit('update:hall', h.id)">
              {{ h.name }} <span class="opacity-70">· {{ h.type }} · {{ free(h.id) }} free</span>
            </button>
          </div>
        </div>
      </div>`,
  };

  // ---------- Student search / picker ----------
  C.StudentPicker = {
    props: { branchId: { type: String, default: 'ALL' }, placeholder: { type: String, default: 'Search by name, mobile or student ID' }, autofocus: Boolean },
    emits: ['select'],
    data() { return { q: '', open: false }; },
    computed: { results() { return SSC.store.sel.search(this.q, this.branchId); } },
    mounted() { if (this.autofocus) this.$refs.input.focus(); },
    methods: {
      choose(s) { this.$emit('select', s); this.q = ''; this.open = false; },
      status(s) { return SSC.store.sel.studentStatus(s); },
      blur() { setTimeout(() => { this.open = false; }, 150); },
    },
    template: `
      <div class="relative">
        <Icon name="Search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input ref="input" class="input pl-9 h-11" v-model="q" :placeholder="placeholder" @focus="open = true" @input="open = true" @blur="blur" @keydown.enter.prevent="results[0] && choose(results[0])" />
        <div v-if="open && q" class="absolute z-30 left-0 right-0 mt-1 card overflow-hidden shadow-lg">
          <button v-for="s in results" :key="s.id" class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 text-left border-0 bg-white cursor-pointer font-[inherit]" @mousedown.prevent="choose(s)">
            <Avatar :name="s.name" :size="32" />
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium text-gray-800">{{ s.name }}</div>
              <div class="text-xs text-gray-500">{{ s.id }} · {{ s.mobile }} · {{ $sel.branchName(s.branchId) }}</div>
            </div>
            <Badge :status="status(s)" />
          </button>
          <div v-if="!results.length" class="px-3 py-4 text-sm text-gray-500 text-center">No student matches “{{ q }}”</div>
        </div>
      </div>`,
  };

  // ---------- Membership summary card ----------
  C.MembershipSummary = {
    props: { membership: Object, compact: Boolean },
    computed: {
      m() { return this.membership; },
      plan() { return this.m ? SSC.store.get.plan(this.m.planId) : null; },
      status() { return SSC.store.sel.mStatus(this.m); },
      daysLeft() { return this.m ? SSC.rules.daysBetween(SSC.rules.today(), this.m.endDate) : 0; },
      progress() {
        if (!this.m) return 0;
        const total = SSC.rules.daysBetween(this.m.startDate, this.m.endDate) + 1;
        const used = SSC.rules.daysBetween(this.m.startDate, SSC.rules.today()) + 1;
        return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
      },
    },
    template: `
      <div v-if="m" class="rounded-xl border border-gray-200 p-4 bg-gradient-to-br from-brand-50 to-white">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="text-xs text-gray-500">{{ m.id }}</div>
            <div class="text-base font-semibold text-gray-900">{{ plan ? plan.name : '—' }}</div>
            <div class="text-xs text-gray-500">{{ $sel.branchName(m.branchId) }} · {{ m.seatId ? 'Seat ' + $sel.seatLabel(m.seatId) : (plan && plan.seatType === 'Flexible' ? 'Flexible seating' : 'Seat not allocated') }}</div>
          </div>
          <Badge :status="status" />
        </div>
        <div class="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div><div class="text-gray-500">Start</div><div class="font-medium">{{ $date(m.startDate) }}</div></div>
          <div><div class="text-gray-500">Expiry</div><div class="font-medium">{{ $date(m.endDate) }}</div></div>
          <div><div class="text-gray-500">Amount</div><div class="font-medium">{{ $inr(m.amount - m.discount) }}</div></div>
        </div>
        <div v-if="!compact && (status === 'Active' || status === 'Expiring Soon')" class="mt-3">
          <div class="h-1.5 bg-gray-200 rounded-full overflow-hidden"><div class="h-full bg-brand-500 rounded-full" :style="{ width: progress + '%' }"></div></div>
          <div class="text-[11px] text-gray-500 mt-1">{{ daysLeft }} day(s) left</div>
        </div>
      </div>
      <div v-else class="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 text-center">No membership on record</div>`,
  };

  // ---------- Printable receipt ----------
  C.ReceiptView = {
    props: { paymentId: String },
    computed: {
      p() { return SSC.store.get.payment(this.paymentId); },
      s() { return this.p ? SSC.store.get.student(this.p.studentId) : null; },
      m() { return this.p && this.p.membershipId ? SSC.store.get.membership(this.p.membershipId) : null; },
      b() { return this.p ? SSC.store.get.branch(this.p.branchId) : null; },
      st() { return SSC.store.db.settings; },
    },
    template: `
      <div v-if="p" class="print-area bg-white rounded-xl border border-gray-200 p-6 md:p-8 max-w-2xl mx-auto">
        <div class="flex items-start justify-between gap-4 pb-4 border-b-2 border-gray-800">
          <div>
            <div class="flex items-center gap-2"><div class="w-9 h-9 rounded-lg bg-brand-500 text-white grid place-items-center"><Icon name="BookOpen" :size="18" /></div>
              <div class="text-lg font-bold">{{ st.centreName }}</div></div>
            <div class="text-xs text-gray-600 mt-2">{{ b ? b.name + ' — ' + b.address : st.address }}</div>
            <div class="text-xs text-gray-600">{{ b ? b.phone : st.phone }} · {{ st.email }}</div>
          </div>
          <div class="text-right">
            <div class="text-xs uppercase tracking-wider text-gray-500">{{ p.type === 'Refund' ? 'Refund voucher' : 'Payment receipt' }}</div>
            <div class="text-lg font-bold">{{ p.id }}</div>
            <div class="text-xs text-gray-600">{{ $date(p.date) }}</div>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 py-5 text-sm">
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Received from</div>
            <div class="font-semibold">{{ s.name }}</div>
            <div class="text-gray-600">{{ s.id }} · {{ s.mobile }}</div>
            <div class="text-gray-600">{{ s.email }}</div>
          </div>
          <div>
            <div class="text-xs uppercase tracking-wider text-gray-500 mb-1">Membership</div>
            <template v-if="m">
              <div class="font-semibold">{{ $sel.planName(m.planId) }} <span class="text-gray-500 font-normal">({{ m.id }})</span></div>
              <div class="text-gray-600">{{ $date(m.startDate) }} → {{ $date(m.endDate) }}</div>
              <div class="text-gray-600">{{ m.seatId ? 'Seat ' + $sel.seatLabel(m.seatId) : 'Flexible / no fixed seat' }}</div>
            </template>
            <div v-else class="text-gray-600">General payment</div>
          </div>
        </div>
        <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
          <tbody>
            <tr class="bg-gray-50"><td class="p-3">Description</td><td class="p-3 text-right">Amount</td></tr>
            <tr v-if="m && p.type !== 'Refund'"><td class="p-3 border-t">Plan fee — {{ $sel.planName(m.planId) }}</td><td class="p-3 border-t text-right">{{ $inr(m.amount) }}</td></tr>
            <tr v-if="m && m.discount && p.type !== 'Refund'"><td class="p-3 border-t">Discount</td><td class="p-3 border-t text-right">− {{ $inr(m.discount) }}</td></tr>
            <tr v-if="p.note"><td class="p-3 border-t text-gray-500" colspan="2">Note: {{ p.note }}</td></tr>
            <tr class="font-bold"><td class="p-3 border-t">{{ p.type === 'Refund' ? 'Amount refunded' : 'Amount received (this receipt)' }}</td><td class="p-3 border-t text-right">{{ $inr(Math.abs(p.amount)) }}</td></tr>
          </tbody>
        </table>
        <div class="flex flex-wrap justify-between gap-3 mt-5 text-sm">
          <div>Payment method: <b>{{ p.method }}</b></div>
          <div>Status: <Badge :status="p.status" /></div>
        </div>
        <div class="mt-8 pt-4 border-t border-dashed border-gray-300 flex justify-between text-xs text-gray-500">
          <span>Computer-generated receipt (prototype — not a valid tax invoice).</span>
          <span>Authorised signatory</span>
        </div>
      </div>
      <EmptyState v-else icon="FileX" title="Receipt not found" />`,
  };
})();
