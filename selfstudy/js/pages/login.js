/* Demo login — simulated. Pick a role; no real authentication. */
SSC.pages = SSC.pages || {};

SSC.pages.Login = {
  computed: {
    profiles() {
      const u = SSC.store.db.demoUsers;
      return [
        { key: 'admin', icon: 'ShieldCheck', label: 'Admin', who: u.admin.name, desc: 'Owner view — dashboard, students, memberships, branches, seats, payments, staff, reports.', home: '/admin' },
        { key: 'staff', icon: 'ConciergeBell', label: 'Staff', who: u.staff.name, desc: 'Front desk — check-in / check-out, admissions, seat allocation, payments, requests.', home: '/staff' },
        { key: 'student', icon: 'GraduationCap', label: 'Student', who: u.student.name, desc: 'Mobile-first portal — membership, seat booking, attendance, payments, requests.', home: '/student' },
      ];
    },
  },
  methods: {
    enter(p) { SSC.store.actions.login(p.key); this.$router.push(p.home); },
    async reset() {
      const ok = await this.$confirm({ title: 'Reset demo data?', message: 'Restore the original sample data. Any changes made during previous demos will be lost.', confirmText: 'Reset', tone: 'danger' });
      if (ok) SSC.store.actions.resetDemo();
    },
  },
  template: `
    <div class="min-h-screen flex flex-col">
      <div class="demo-ribbon"><b>Prototype</b> · for requirement validation · sample data only · no backend</div>
      <div class="flex-1 grid lg:grid-cols-2">
        <div class="hidden lg:flex flex-col justify-between p-12 text-white" style="background: linear-gradient(135deg, #0f0c29, #302b63 60%, #24243e)">
          <div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-brand-500 grid place-items-center"><Icon name="BookOpen" :size="20" /></div><div class="text-lg font-semibold">StudyNest</div></div>
          <div>
            <h1 class="text-4xl font-semibold leading-tight m-0">Self-Study Centre<br>Management System</h1>
            <p class="text-white/70 mt-4 max-w-md">Students, memberships, seats, attendance and payments for every branch — in one place.</p>
            <div class="grid grid-cols-3 gap-3 mt-10 max-w-md">
              <div class="rounded-xl bg-white/10 p-3"><div class="text-2xl font-semibold">{{ $db.branches.length }}</div><div class="text-xs text-white/60">Branches</div></div>
              <div class="rounded-xl bg-white/10 p-3"><div class="text-2xl font-semibold">{{ $db.seats.length }}</div><div class="text-xs text-white/60">Seats</div></div>
              <div class="rounded-xl bg-white/10 p-3"><div class="text-2xl font-semibold">{{ $db.students.length }}</div><div class="text-xs text-white/60">Students</div></div>
            </div>
          </div>
          <div class="text-xs text-white/40">UI discovery prototype · v0.1</div>
        </div>
        <div class="flex items-center justify-center p-6">
          <div class="w-full max-w-md">
            <div class="lg:hidden flex items-center gap-2 mb-6"><div class="w-9 h-9 rounded-xl bg-brand-500 text-white grid place-items-center"><Icon name="BookOpen" :size="18" /></div><div class="font-semibold">StudyNest</div></div>
            <h2 class="text-2xl font-semibold m-0">Choose a demo profile</h2>
            <p class="text-sm text-gray-500 mt-1">Login is simulated. Each profile opens a different interface.</p>
            <div class="space-y-3 mt-6">
              <button v-for="p in profiles" :key="p.key" class="card w-full text-left p-4 flex items-start gap-4 cursor-pointer hover:border-brand-200 hover:shadow-md transition font-[inherit]" @click="enter(p)">
                <div class="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 grid place-items-center shrink-0"><Icon :name="p.icon" :size="22" /></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between"><div class="font-semibold text-gray-900">{{ p.label }}</div><Icon name="ArrowRight" :size="16" class="text-gray-400" /></div>
                  <div class="text-xs text-brand-600 font-medium">{{ p.who }}</div>
                  <div class="text-xs text-gray-500 mt-1">{{ p.desc }}</div>
                </div>
              </button>
            </div>
            <button class="btn btn-ghost btn-sm mt-6" @click="reset"><Icon name="RotateCcw" :size="14" />Reset demo data</button>
          </div>
        </div>
      </div>
    </div>`,
};
