/* ==========================================================================
   Routes. Hash history so the prototype works when opened from the file system.
   meta.role decides the shell and nav; screens shared by admin and staff read
   $route.meta.role and use $link('/path') to stay inside the current panel.
   ========================================================================== */
(function () {
  const P = SSC.pages;
  const C = SSC.components;

  // Placeholder used if a screen is not implemented (keeps navigation working).
  const page = (name) => P[name] || {
    template: `<div><PageHeader title="${name}" subtitle="Screen placeholder" /><div class="card"><EmptyState icon="Construction" title="Coming in the next iteration" /></div></div>`,
  };

  const admin = [
    { path: '', name: 'admin-dashboard', component: page('AdminDashboard') },
    { path: 'students', component: page('StudentList') },
    { path: 'students/new', component: page('AdmissionWizard') },
    { path: 'students/:id', component: page('StudentProfile') },
    { path: 'memberships', component: page('MembershipList') },
    { path: 'memberships/renew', component: page('RenewalWizard') },
    { path: 'plans', component: page('PlanList') },
    { path: 'branches', component: page('BranchList') },
    { path: 'branches/:id', component: page('BranchDetail') },
    { path: 'seats', component: page('SeatManager') },
    { path: 'attendance', component: page('AttendancePage') },
    { path: 'payments', component: page('PaymentList') },
    { path: 'receipt/:id', component: page('ReceiptPage') },
    { path: 'requests', component: page('RequestList') },
    { path: 'staff', component: page('StaffList') },
    { path: 'reports', component: page('ReportsPage') },
    { path: 'settings', component: page('SettingsPage') },
  ];

  const staff = [
    { path: '', component: page('StaffDashboard') },
    { path: 'search', component: page('StaffSearch') },
    { path: 'checkin', component: page('AttendancePage') },
    { path: 'seats', component: page('SeatManager') },
    { path: 'payments', component: page('PaymentList') },
    { path: 'requests', component: page('RequestList') },
    { path: 'admission', component: page('AdmissionWizard') },
    { path: 'students/:id', component: page('StudentProfile') },
    { path: 'renew', component: page('RenewalWizard') },
    { path: 'receipt/:id', component: page('ReceiptPage') },
  ];

  const student = [
    { path: '', component: page('StudentDashboard') },
    { path: 'membership', component: page('MyMembership') },
    { path: 'book', component: page('BookSeat') },
    { path: 'attendance', component: page('MyAttendance') },
    { path: 'payments', component: page('MyPayments') },
    { path: 'receipt/:id', component: page('ReceiptPage') },
    { path: 'requests', component: page('MyRequests') },
    { path: 'notifications', component: page('MyNotifications') },
    { path: 'profile', component: page('MyProfile') },
  ];

  const withRole = (list, role) => list.map((r) => ({ ...r, meta: { role } }));

  const routes = [
    { path: '/', redirect: () => { const u = SSC.store.session.user; return u ? '/' + u.role : '/login'; } },
    { path: '/login', component: P.Login, meta: { public: true } },
    { path: '/admin', component: C.AppShell, children: withRole(admin, 'admin'), meta: { role: 'admin' } },
    { path: '/staff', component: C.AppShell, children: withRole(staff, 'staff'), meta: { role: 'staff' } },
    { path: '/student', component: C.StudentShell, children: withRole(student, 'student'), meta: { role: 'student' } },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ];

  const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
    scrollBehavior: () => ({ top: 0 }),
  });

  // Simulated auth: no session → login. Opening another panel's URL switches the demo persona.
  router.beforeEach((to) => {
    if (to.meta.public) return true;
    const role = to.meta.role;
    // Direct demo links: #/admin?as=admin opens a panel without the login screen.
    if (!SSC.store.session.user && role && to.query.as === role) SSC.store.actions.login(role);
    const user = SSC.store.session.user;
    if (!user) return '/login';
    if (role && user.role !== role) SSC.store.actions.login(role);
    return true;
  });

  SSC.router = router;
})();
