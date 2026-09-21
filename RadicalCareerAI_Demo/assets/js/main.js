/* Boot + demo guide */
(function () {
  const RC = window.RC, I = RC.ico;
  RC.live = () => { const h = location.hash; if (/^#\/(a\/(requests|dashboard|credits)|s\/(credits|interview\/plans))/.test(h)) RC.render(); };

  const asStudent = () => { RC.S.session = { role: 'student' }; RC.save(); };
  const asAdmin = () => { RC.S.session = { role: 'admin' }; RC.save(); };
  const GUIDE = [
    ['Student journey', [
      ['Register (form pre-filled) → verify → onboarding', () => { RC.S.session = null; RC.save(); RC.go('/register'); }],
      ['Dashboard: matches, wallet, follow-ups', () => { asStudent(); RC.go('/s/dashboard'); }],
      ['Job matches with source badges & filters', () => { asStudent(); RC.go('/s/jobs'); }],
      ['Job detail → “Apply now” opens the employer page', () => { asStudent(); RC.go('/s/jobs/j1'); }],
      ['Resume Studio: AI pipeline & ATS score', () => { asStudent(); RC.go('/s/resume/build/j1'); }],
      ['Cover letter generator', () => { asStudent(); RC.go('/s/cover'); }],
      ['Applications board & follow-up emails', () => { asStudent(); RC.go('/s/tracker'); }]]],
    ['Interview Lab', [
      ['Interview Lab hub (6 rounds)', () => { asStudent(); RC.go('/s/interview'); }],
      ['Aptitude test (timer, palette, review)', () => { asStudent(); RC.go('/s/interview/test/aptitude'); }],
      ['Group discussion: 3 AI bots + you (Premium)', () => { asStudent(); RC.S.plan = 'premium'; if (!RC.S.premiumUntil) RC.S.premiumUntil = new Date(2026, 9, 20).toISOString(); RC.save(); RC.go('/s/interview/gd'); }],
      ['Coding round with AI interviewer (Premium)', () => { asStudent(); RC.S.plan = 'premium'; if (!RC.S.premiumUntil) RC.S.premiumUntil = new Date(2026, 9, 20).toISOString(); RC.save(); RC.go('/s/interview/coding'); }],
      ['HR round (Basic + Premium)', () => { asStudent(); RC.go('/s/interview/hr'); }],
      ['Salary negotiation (Premium)', () => { asStudent(); RC.S.plan = 'premium'; if (!RC.S.premiumUntil) RC.S.premiumUntil = new Date(2026, 9, 20).toISOString(); RC.save(); RC.go('/s/interview/salary'); }],
      ['Career-readiness report + roadmap + courses', () => { asStudent(); RC.go('/s/interview/report'); }]]],
    ['Credits, plans & offline payment (student ↔ admin)', [
      ['1 · Student: request Premium', () => { asStudent(); RC.S.plan = 'basic'; RC.S.planRequests = RC.S.planRequests.filter(p => p.student !== 'Aarav Sharma'); RC.save(); RC.go('/s/interview/plans'); }],
      ['2 · Admin: send a quote', () => { asAdmin(); RC.go('/a/requests?t=plans'); }],
      ['3 · Student: pay & submit reference', () => { asStudent(); RC.go('/s/interview/plans'); }],
      ['4 · Admin: confirm payment → Premium active', () => { asAdmin(); RC.go('/a/requests?t=plans'); }],
      ['Student: request credits', () => { asStudent(); RC.go('/s/credits'); }],
      ['Admin: approve credits', () => { asAdmin(); RC.go('/a/requests'); }]]],
    ['Admin console', [
      ['Dashboard: spend, funnel, alerts', () => { asAdmin(); RC.go('/a/dashboard'); }],
      ['Users & enrolment (CSV import)', () => { asAdmin(); RC.go('/a/users'); }],
      ['Module access (live effect on student)', () => { asAdmin(); RC.go('/a/modules'); }],
      ['Credit wallets & Grant Advisor', () => { asAdmin(); RC.go('/a/credits'); }],
      ['Cost & usage, Quality/Lean, kill-switch', () => { asAdmin(); RC.go('/a/costs'); }],
      ['Jobs & content, interview sessions, reports', () => { asAdmin(); RC.go('/a/content'); }]]]
  ];
  const mountGuide = () => {
    const g = document.createElement('div'); g.className = 'guide'; g.innerHTML = `<div id="gp"></div>`; document.body.appendChild(g);
    const gbtn = document.createElement('button'); gbtn.id = 'gb'; gbtn.className = 'guide-tab'; gbtn.innerHTML = `${I('list', 14)} Demo guide`; const bar = document.getElementById('demobar'); bar.insertBefore(gbtn, bar.querySelector('.sp').nextSibling);
    let open = false; const draw = () => {
      $gp = document.getElementById('gp');
      if (!open) { $gp.innerHTML = ''; return; }
      let n = 0; $gp.innerHTML = `<div class="guide-panel" style="max-height:70vh;overflow:auto"><div class="h"><b style="font-family:var(--f-head)">Take the tour</b><div class="small" style="color:#c9cad3">Click any step to jump straight to it</div></div>${GUIDE.map(gr => `<div style="padding:8px 14px;background:var(--bg);font:700 10.5px var(--f-head);letter-spacing:1px;text-transform:uppercase;color:var(--muted)">${gr[0]}</div>` + gr[1].map(it => `<div class="it" data-i="${n++}"><span class="n">${n}</span><span class="small">${it[0]}</span></div>`).join('')).join('')}</div>`;
      const flat = GUIDE.flatMap(g => g[1]); document.querySelectorAll('#gp .it').forEach(el => el.onclick = () => { flat[+el.dataset.i][1](); });
    }; let $gp;
    document.getElementById('gb').onclick = () => { open = !open; draw(); };
  };

  window.addEventListener('DOMContentLoaded', () => {
    const q = new URLSearchParams(location.search); if (q.get('as')) { RC.S.session = { role: q.get('as') }; } if (q.get('plan')) { RC.S.plan = q.get('plan'); if (q.get('plan') === 'premium') RC.S.premiumUntil = RC.S.premiumUntil || new Date(2026, 9, 20).toISOString(); } if (q.get('as') || q.get('plan')) { RC.S.seenTip = true; RC.save(); }
    RC.mountDemobar(); mountGuide(); RC.updateDemobar();
    if (!location.hash) location.hash = '#/login'; RC.render();
    if (!RC.S.seenTip) { RC.S.seenTip = true; RC.save(); setTimeout(() => RC.toast('Tip: open the <b>DEMO GUIDE</b> (bottom-left) for a guided tour of every screen', 'info', 6500), 1500); }
  });
})();
