/* App bootstrap: registers components + template helpers, mounts the router. */
(function () {
  const { createApp } = Vue;
  const S = SSC.store;
  const R = SSC.rules;

  const App = {
    template: `
      <router-view v-slot="{ Component, route }"><component :is="Component" :key="route.meta.role || 'public'" /></router-view>
      <ConfirmHost />
      <ToastHost />`,
  };

  const app = createApp(App);

  Object.entries(SSC.components).forEach(([name, def]) => app.component(name, def));

  // Template helpers available in every component
  Object.assign(app.config.globalProperties, {
    $db: S.db, $sel: S.sel, $act: S.actions, $ui: S.ui, $get: S.get, $R: R,
    $inr: R.inr, $date: R.fmtDate, $time: R.fmtTime, $dt: R.fmtDateTime, $hours: R.fmtHours, $rel: R.relTime,
    $toast: S.toast, $confirm: S.confirm,
    /** Path inside the current panel: $link('/students') → /admin/students or /staff/students */
    $link(path) {
      const role = (SSC.router.currentRoute.value.meta || {}).role || 'admin';
      return '/' + role + path;
    },
    $role() { return (SSC.router.currentRoute.value.meta || {}).role; },
  });

  app.config.errorHandler = (err) => { console.error(err); S.toast('Something went wrong in the prototype: ' + err.message, 'error'); };

  app.use(SSC.router);
  app.mount('#app');
})();
