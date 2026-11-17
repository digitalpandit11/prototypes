/* Admin dashboard — KPIs, charts, recent admissions, activity, expiring soon. */
SSC.pages = SSC.pages || {};

SSC.pages.AdminDashboard = {
  data() {
    const t = SSC.rules.today();
    return { range: 'today', customFrom: SSC.rules.addDays(t, -6), customTo: t };
  },
  computed: {
    branch() { return this.$ui.branch; },
    from() {
      const t = SSC.rules.today();
      if (this.range === '7d') return SSC.rules.addDays(t, -6);
      if (this.range === 'month') return t.slice(0, 8) + '01';
      if (this.range === 'custom') return this.customFrom || t;
      return t;
    },
    to() { return this.range === 'custom' ? (this.customTo || SSC.rules.today()) : SSC.rules.today(); },
    rangeLabel() { return { today: 'Today', '7d': 'Last 7 days', month: 'This month', custom: 'Selected range' }[this.range]; },
    k() { return this.$sel.kpis(this.branch, this.from, this.to); },
    series() { return this.$sel.monthlySeries(this.branch); },
    labels() { return this.series.map((r, i) => (i === this.series.length - 1 ? r.label + ' (MTD)' : r.label)); },
    revenueChart() { return { labels: this.labels, datasets: [{ label: 'Revenue', data: this.series.map((r) => r.revenue) }] }; },
    growthChart() {
      return {
        labels: this.labels,
        datasets: [
          { label: 'Active members', data: this.series.map((r) => r.activeMembers), color: '#6C63FF' },
          { label: 'New admissions', data: this.series.map((r) => r.newMembers), color: '#14b8a6' },
        ],
      };
    },
    occupancyChart() {
      const k = this.k;
      return {
        labels: ['Occupied', 'Available', 'Reserved', 'Blocked'],
        datasets: [{ label: 'Seats', data: [k.occupiedSeats, k.availableSeats, k.reservedSeats, k.blockedSeats], colors: ['#6C63FF', '#34d399', '#fbbf24', '#d1d5db'] }],
      };
    },
    branchChart() {
      const bs = this.$db.branches;
      const per = bs.map((b) => this.$sel.monthlySeries(b.id).slice(-6));
      return {
        labels: per[0] ? per[0].map((r) => r.label) : [],
        datasets: bs.map((b, i) => ({ label: b.name, data: per[i].map((r) => r.revenue), color: ['#6C63FF', '#14b8a6', '#f59e0b'][i % 3] })),
      };
    },
    branchRows() {
      return this.$db.branches.map((b) => {
        const k = this.$sel.kpis(b.id);
        const s = this.$sel.monthlySeries(b.id);
        return { b, active: k.activeMemberships, occupancy: s[s.length - 1].occupancy, revenue: s[s.length - 1].revenue, present: k.presentNow };
      });
    },
    recentAdmissions() {
      return this.$db.students.filter((s) => this.$sel.inBranch(s, this.branch))
        .slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
    },
    activity() { return this.$db.activity.slice(0, 7); },
    expiring() {
      return this.$db.memberships.filter((m) => this.$sel.inBranch(m, this.branch) && this.$sel.mStatus(m) === 'Expiring Soon')
        .sort((a, b) => a.endDate.localeCompare(b.endDate)).slice(0, 6);
    },
    firstName() { const u = SSC.store.session.user; return u ? u.name.split(' ')[0] : 'there'; },
    greeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; },
  },
  methods: {
    daysLeft(m) { const d = this.$R.daysBetween(this.$R.today(), m.endDate); return d === 0 ? 'today' : `in ${d} day${d > 1 ? 's' : ''}`; },
  },
  template: `
    <div>
      <PageHeader :title="greeting + ', ' + firstName" :subtitle="'Overview for ' + $sel.branchName(branch) + ' · ' + $date($R.today())">
        <router-link :to="$link('/students/new')" class="btn btn-primary"><Icon name="UserPlus" :size="16" />New admission</router-link>
        <router-link :to="$link('/memberships/renew')" class="btn btn-secondary"><Icon name="RefreshCw" :size="16" />Renew</router-link>
        <router-link :to="$link('/attendance')" class="btn btn-secondary"><Icon name="ScanLine" :size="16" />Check-in</router-link>
        <router-link :to="$link('/payments')" class="btn btn-secondary"><Icon name="IndianRupee" :size="16" />Record payment</router-link>
      </PageHeader>

      <div class="card px-4 py-3 mb-5 flex flex-wrap items-center gap-3">
        <span class="text-xs font-medium text-gray-500">Collections period</span>
        <div class="flex flex-wrap gap-1.5">
          <button v-for="r in [['today','Today'],['7d','7 days'],['month','This month'],['custom','Custom']]" :key="r[0]" class="chip" :class="{ active: range === r[0] }" @click="range = r[0]">{{ r[1] }}</button>
        </div>
        <template v-if="range === 'custom'">
          <input type="date" class="input h-8 w-auto text-xs" v-model="customFrom" />
          <span class="text-xs text-gray-400">to</span>
          <input type="date" class="input h-8 w-auto text-xs" v-model="customTo" />
        </template>
        <div class="flex-1"></div>
        <span class="text-xs text-gray-500 inline-flex items-center gap-1"><Icon name="MapPin" :size="14" />{{ $sel.branchName(branch) }} <span class="text-gray-400">(change in top bar)</span></span>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-5">
        <StatCard label="Registered students" :value="k.totalStudents" icon="Users" :to="$link('/students')" />
        <StatCard label="Active memberships" :value="k.activeMemberships" icon="IdCard" tone="ok" :to="$link('/memberships')" />
        <StatCard label="Expiring in 7 days" :value="k.expiringSoon" icon="CalendarClock" tone="warn" :to="$link('/memberships')" />
        <StatCard label="Today's check-ins" :value="k.todaysCheckins" icon="LogIn" tone="info" :hint="k.presentNow + ' present right now'" :to="$link('/attendance')" />
        <StatCard label="Occupied seats" :value="k.occupiedSeats + ' / ' + k.totalSeats" icon="Armchair" :hint="k.reservedSeats + ' reserved · ' + k.blockedSeats + ' blocked'" :to="$link('/seats')" />
        <StatCard label="Available seats" :value="k.availableSeats" icon="SquareCheck" tone="ok" :to="$link('/seats')" />
        <StatCard :label="'Collections · ' + rangeLabel" :value="$inr(k.collections)" icon="IndianRupee" tone="ok" :to="$link('/payments')" />
        <StatCard label="Pending payments" :value="$inr(k.pendingAmount)" icon="Hourglass" tone="bad" :hint="k.pendingCount + ' dues outstanding'" :to="$link('/payments')" />
      </div>

      <div class="grid lg:grid-cols-3 gap-4 mb-5">
        <div class="lg:col-span-2"><ChartCard title="Monthly revenue" subtitle="Last 12 months · current month from live payments" type="bar" money :labels="revenueChart.labels" :datasets="revenueChart.datasets" /></div>
        <ChartCard title="Seat occupancy" :subtitle="k.totalSeats + ' seats · ' + $sel.branchName(branch)" type="doughnut" :labels="occupancyChart.labels" :datasets="occupancyChart.datasets" />
      </div>

      <div class="grid lg:grid-cols-2 gap-4 mb-5">
        <ChartCard title="Membership growth" subtitle="Active members vs new admissions per month" type="line" :labels="growthChart.labels" :datasets="growthChart.datasets" />
        <div class="card card-pad">
          <h3 class="card-title">Branch-wise performance</h3>
          <div class="card-sub mb-3">Revenue over the last 6 months</div>
          <ChartCard class="!border-0 !p-0 !shadow-none" type="bar" money :height="170" :labels="branchChart.labels" :datasets="branchChart.datasets" />
          <table class="table mt-3">
            <thead><tr><th>Branch</th><th class="text-right">This month</th><th class="text-right">Active</th><th class="text-right">Occupancy</th><th class="text-right">Present</th></tr></thead>
            <tbody>
              <tr v-for="r in branchRows" :key="r.b.id">
                <td class="font-medium">{{ r.b.name }}</td><td class="text-right">{{ $inr(r.revenue) }}</td>
                <td class="text-right">{{ r.active }}</td><td class="text-right">{{ r.occupancy }}%</td><td class="text-right">{{ r.present }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-4">
        <div class="card">
          <div class="flex items-center justify-between px-5 pt-4 pb-2"><h3 class="card-title">Recent admissions</h3><router-link :to="$link('/students')" class="text-xs text-brand-600 no-underline">View all</router-link></div>
          <div class="divide-y divide-gray-100">
            <router-link v-for="s in recentAdmissions" :key="s.id" :to="$link('/students/' + s.id)" class="flex items-center gap-3 px-5 py-2.5 hover:bg-gray-50 no-underline text-inherit">
              <Avatar :name="s.name" :size="32" />
              <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">{{ s.name }}</div><div class="text-xs text-gray-500">{{ s.id }} · {{ $date(s.createdAt) }}</div></div>
              <Badge :status="$sel.studentStatus(s)" />
            </router-link>
          </div>
        </div>
        <div class="card">
          <div class="flex items-center justify-between px-5 pt-4 pb-2"><h3 class="card-title">Expiring soon</h3><router-link :to="$link('/memberships')" class="text-xs text-brand-600 no-underline">All memberships</router-link></div>
          <div v-if="expiring.length" class="divide-y divide-gray-100">
            <div v-for="m in expiring" :key="m.id" class="flex items-center gap-3 px-5 py-2.5">
              <div class="flex-1 min-w-0"><div class="text-sm font-medium truncate">{{ $sel.studentName(m.studentId) }}</div><div class="text-xs text-gray-500">{{ $sel.planName(m.planId) }} · expires {{ daysLeft(m) }}</div></div>
              <router-link :to="{ path: $link('/memberships/renew'), query: { student: m.studentId } }" class="btn btn-secondary btn-sm">Renew</router-link>
            </div>
          </div>
          <EmptyState v-else icon="CalendarCheck" title="No memberships expiring this week" />
        </div>
        <div class="card">
          <div class="px-5 pt-4 pb-2"><h3 class="card-title">Recent activity</h3></div>
          <div class="px-5 pb-3">
            <div v-for="(a, i) in activity" :key="i" class="flex gap-3 py-2">
              <div class="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 grid place-items-center shrink-0"><Icon :name="a.icon" :size="15" /></div>
              <div class="min-w-0"><div class="text-sm text-gray-700">{{ a.text }}</div><div class="text-[11px] text-gray-400">{{ $rel(a.at) }}</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>`,
};
