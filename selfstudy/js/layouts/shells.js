/* ==========================================================================
   Layouts: DemoBar (prototype controls), AppShell (admin + staff, sidebar),
   StudentShell (mobile-first, bottom navigation).
   ========================================================================== */
(function () {
  const C = SSC.components;

  SSC.nav = {
    admin: [
      { to: '/admin', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
      { to: '/admin/students', label: 'Students', icon: 'Users' },
      { to: '/admin/memberships', label: 'Memberships', icon: 'IdCard' },
      { to: '/admin/plans', label: 'Membership Plans', icon: 'Tags' },
      { to: '/admin/branches', label: 'Branches', icon: 'Building2' },
      { to: '/admin/seats', label: 'Study Halls & Seats', icon: 'Armchair' },
      { to: '/admin/attendance', label: 'Attendance', icon: 'CalendarCheck' },
      { to: '/admin/payments', label: 'Payments', icon: 'IndianRupee' },
      { to: '/admin/requests', label: 'Service Requests', icon: 'MessageSquareWarning', badge: 'requests' },
      { to: '/admin/staff', label: 'Staff', icon: 'UserCog' },
      { to: '/admin/reports', label: 'Reports', icon: 'BarChart3' },
      { to: '/admin/settings', label: 'Settings', icon: 'Settings' },
    ],
    staff: [
      { to: '/staff', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
      { to: '/staff/search', label: 'Student Search', icon: 'Search' },
      { to: '/staff/checkin', label: 'Check-in / Check-out', icon: 'ScanLine' },
      { to: '/staff/seats', label: 'Seat Allocation', icon: 'Armchair' },
      { to: '/staff/payments', label: 'Payments', icon: 'IndianRupee' },
      { to: '/staff/requests', label: 'Service Requests', icon: 'MessageSquareWarning', badge: 'requests' },
    ],
    student: [
      { to: '/student', label: 'Home', icon: 'House', exact: true, bottom: true },
      { to: '/student/membership', label: 'My Membership', short: 'Plan', icon: 'IdCard', bottom: true },
      { to: '/student/book', label: 'Book a Seat', short: 'Book', icon: 'Armchair', bottom: true },
      { to: '/student/attendance', label: 'Attendance', icon: 'CalendarCheck' },
      { to: '/student/payments', label: 'Payments', icon: 'Wallet', bottom: true },
      { to: '/student/requests', label: 'Service Requests', short: 'Help', icon: 'LifeBuoy', bottom: true },
      { to: '/student/notifications', label: 'Notifications', icon: 'Bell' },
      { to: '/student/profile', label: 'My Profile', icon: 'UserRound' },
    ],
  };

  // ---------- Prototype control strip ----------
  C.DemoBar = {
    data() { return { open: false }; },
    computed: { user() { return SSC.store.session.user; } },
    methods: {
      switchTo(role) {
        this.open = false;
        SSC.store.actions.login(role);
        this.$router.push({ admin: '/admin', staff: '/staff', student: '/student' }[role]);
        this.$toast(`Switched to ${SSC.store.db.demoUsers[role].name} (${role})`, 'info');
      },
      async reset() {
        this.open = false;
        const ok = await this.$confirm({ title: 'Reset demo data?', message: 'All changes made during this demo (admissions, payments, check-ins, requests…) will be discarded and the original sample data restored.', confirmText: 'Reset data', tone: 'danger' });
        if (ok) SSC.store.actions.resetDemo();
      },
      logout() { this.open = false; SSC.store.actions.logout(); this.$router.push('/login'); },
    },
    template: `
      <div class="demo-ribbon no-print flex items-center justify-center gap-3 relative">
        <span><b>Prototype</b> · sample data only · no backend</span>
        <div class="relative">
          <button class="underline font-medium bg-transparent border-0 cursor-pointer text-[11px] text-orange-800 font-[inherit]" @click="open = !open">Switch role ▾</button>
          <div v-if="open" class="absolute right-0 top-6 z-50 card p-1.5 w-56 text-left shadow-lg" @mouseleave="open = false">
            <button v-for="r in ['admin','staff','student']" :key="r" class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 border-0 bg-white cursor-pointer text-xs font-[inherit] text-gray-700 flex items-center justify-between" @click="switchTo(r)">
              <span><b class="capitalize">{{ r }}</b> — {{ $db.demoUsers[r].name }}</span><Icon v-if="user && user.role === r" name="Check" :size="14" class="text-brand-500" />
            </button>
            <div class="border-t border-gray-100 my-1"></div>
            <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 border-0 bg-white cursor-pointer text-xs font-[inherit] text-gray-700" @click="reset"><Icon name="RotateCcw" :size="13" class="inline -mt-0.5 mr-1" />Reset demo data</button>
            <button class="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 border-0 bg-white cursor-pointer text-xs font-[inherit] text-gray-700" @click="logout"><Icon name="LogOut" :size="13" class="inline -mt-0.5 mr-1" />Back to demo login</button>
          </div>
        </div>
      </div>`,
  };

  // ---------- Admin / Staff shell ----------
  C.AppShell = {
    computed: {
      role() { return this.$route.meta.role; },
      items() { return SSC.nav[this.role] || []; },
      user() { return SSC.store.session.user || {}; },
      staffMember() { return SSC.store.get.staff(this.user.refId); },
      branchLocked() { return this.role === 'staff'; },
      openRequests() { return SSC.store.db.requests.filter((r) => r.status !== 'Resolved' && SSC.store.sel.inBranch(r, SSC.store.ui.branch)).length; },
      branchModel: {
        get() { return SSC.store.ui.branch; },
        set(v) { SSC.store.ui.branch = v; },
      },
    },
    watch: { $route() { SSC.store.ui.sidebarOpen = false; } },
    created() {
      if (this.role === 'staff' && this.staffMember && this.staffMember.branchId !== 'ALL') SSC.store.ui.branch = this.staffMember.branchId;
    },
    methods: {
      logout() { SSC.store.actions.logout(); this.$router.push('/login'); },
      isActive(it) { return it.exact ? this.$route.path === it.to : this.$route.path.startsWith(it.to); },
    },
    template: `
      <div class="min-h-screen flex flex-col">
        <DemoBar />
        <div class="flex flex-1 min-h-0">
          <!-- Sidebar -->
          <div v-if="$ui.sidebarOpen" class="fixed inset-0 bg-black/30 z-30 lg:hidden" @click="$ui.sidebarOpen = false"></div>
          <aside class="no-print fixed lg:sticky top-0 z-40 h-screen w-64 bg-white border-r border-gray-200 flex flex-col transition-transform lg:translate-x-0" :class="$ui.sidebarOpen ? 'translate-x-0' : '-translate-x-full'">
            <div class="h-16 flex items-center gap-2.5 px-5 border-b border-gray-100">
              <div class="w-9 h-9 rounded-xl bg-brand-500 text-white grid place-items-center"><Icon name="BookOpen" :size="18" /></div>
              <div class="leading-tight"><div class="font-semibold text-gray-900">StudyNest</div><div class="text-[11px] text-gray-500 capitalize">{{ role }} panel</div></div>
            </div>
            <nav class="flex-1 overflow-y-auto scroll-thin p-3 space-y-0.5">
              <router-link v-for="it in items" :key="it.to" :to="it.to" class="nav-link" :class="{ 'router-link-active': isActive(it) }" active-class="" exact-active-class="">
                <Icon :name="it.icon" :size="17" /><span class="flex-1">{{ it.label }}</span>
                <span v-if="it.badge === 'requests' && openRequests" class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600">{{ openRequests }}</span>
              </router-link>
            </nav>
            <div class="p-3 border-t border-gray-100">
              <div class="flex items-center gap-2.5 p-2">
                <Avatar :name="user.name" :size="34" />
                <div class="min-w-0 flex-1 leading-tight"><div class="text-sm font-medium truncate">{{ user.name }}</div><div class="text-[11px] text-gray-500 truncate">{{ user.title }}</div></div>
                <button class="btn btn-ghost btn-icon" title="Log out" @click="logout"><Icon name="LogOut" :size="16" /></button>
              </div>
            </div>
          </aside>

          <!-- Main -->
          <div class="flex-1 min-w-0 flex flex-col">
            <header class="no-print h-16 bg-white/90 backdrop-blur border-b border-gray-200 flex items-center gap-3 px-4 md:px-6 sticky top-0 z-20">
              <button class="btn btn-ghost btn-icon lg:hidden" @click="$ui.sidebarOpen = true" aria-label="Menu"><Icon name="Menu" /></button>
              <div class="hidden md:block text-sm text-gray-500">{{ $db.settings.centreName }}</div>
              <div class="flex-1"></div>
              <div class="flex items-center gap-2">
                <Icon name="MapPin" :size="16" class="text-gray-400" />
                <select v-if="!branchLocked" class="select h-9 w-auto pr-8 text-xs" v-model="branchModel" title="Branch filter (applies across screens)">
                  <option value="ALL">All branches</option>
                  <option v-for="b in $db.branches" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
                <span v-else class="text-xs font-medium text-gray-700">{{ $sel.branchName($ui.branch) }}</span>
              </div>
              <router-link v-if="role === 'staff'" to="/staff/admission" class="btn btn-primary btn-sm hidden sm:inline-flex"><Icon name="UserPlus" :size="14" />New admission</router-link>
            </header>
            <main class="flex-1 p-4 md:p-6 max-w-[1400px] w-full mx-auto">
              <router-view v-slot="{ Component, route }"><component :is="Component" :key="route.fullPath" /></router-view>
            </main>
          </div>
        </div>
      </div>`,
  };

  // ---------- Student shell (mobile-first) ----------
  C.StudentShell = {
    computed: {
      items() { return SSC.nav.student; },
      bottom() { return this.items.filter((i) => i.bottom); },
      user() { return SSC.store.session.user || {}; },
      unread() { return SSC.store.sel.notificationsFor(this.user.refId).filter((n) => !n.read).length; },
    },
    data() { return { menu: false }; },
    watch: { $route() { this.menu = false; } },
    methods: {
      isActive(it) { return it.exact ? this.$route.path === it.to : this.$route.path.startsWith(it.to); },
      logout() { SSC.store.actions.logout(); this.$router.push('/login'); },
    },
    template: `
      <div class="min-h-screen flex flex-col bg-[#f5f6fa]">
        <DemoBar />
        <header class="no-print sticky top-0 z-20 bg-white border-b border-gray-200">
          <div class="max-w-4xl mx-auto h-14 px-4 flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg bg-brand-500 text-white grid place-items-center"><Icon name="BookOpen" :size="16" /></div>
            <div class="font-semibold">StudyNest</div>
            <nav class="hidden md:flex items-center gap-1 ml-4">
              <router-link v-for="it in items.slice(0, 6)" :key="it.to" :to="it.to" class="px-3 py-1.5 rounded-lg text-xs font-medium no-underline" :class="isActive(it) ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-gray-100'">{{ it.label }}</router-link>
            </nav>
            <div class="flex-1"></div>
            <router-link to="/student/notifications" class="relative btn btn-ghost btn-icon" aria-label="Notifications">
              <Icon name="Bell" :size="19" />
              <span v-if="unread" class="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] grid place-items-center">{{ unread }}</span>
            </router-link>
            <div class="relative">
              <button class="border-0 bg-transparent p-0 cursor-pointer" @click="menu = !menu"><Avatar :name="user.name" :size="32" /></button>
              <div v-if="menu" class="absolute right-0 top-10 z-50 card p-1.5 w-52 shadow-lg">
                <div class="px-3 py-2 text-xs text-gray-500 border-b border-gray-100 mb-1">{{ user.name }}<br>{{ user.refId }}</div>
                <router-link v-for="it in items" :key="it.to" :to="it.to" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs text-gray-700 no-underline"><Icon :name="it.icon" :size="14" />{{ it.label }}</router-link>
                <button class="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 text-xs text-gray-700 border-0 bg-white cursor-pointer font-[inherit]" @click="logout"><Icon name="LogOut" :size="14" />Log out</button>
              </div>
            </div>
          </div>
        </header>
        <main class="flex-1 w-full max-w-4xl mx-auto px-4 pt-4 pb-24 md:pb-8">
          <router-view v-slot="{ Component, route }"><component :is="Component" :key="route.fullPath" /></router-view>
        </main>
        <nav class="no-print md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-gray-200 grid grid-cols-5">
          <router-link v-for="it in bottom" :key="it.to" :to="it.to" class="flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium no-underline" :class="isActive(it) ? 'text-brand-600' : 'text-gray-500'">
            <Icon :name="it.icon" :size="20" />{{ it.short || it.label }}
          </router-link>
        </nav>
      </div>`,
  };
})();
