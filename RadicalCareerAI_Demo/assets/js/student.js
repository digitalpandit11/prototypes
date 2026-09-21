/* Student app: dashboard, jobs, resume, cover letters, tracker, credits/plans, courses, profile */
(function () {
  const RC = window.RC, D = RC.DATA, I = RC.ico, $ = RC.$, S = () => RC.S;
  const view = (active, title, sub, actions, inner, mount) => ({ html: RC.shell('student', active, title, sub, actions, inner), mount: a => { RC.shellMount('student'); mount && mount(a); } });
  const PRICE = { match: 5, resume: 20, master: 15, cover: 5, ats: 5, follow: 5, profile: 5 };
  RC.PRICE = PRICE;
  const BATCH = 5;
  const feed = () => (S().jobFeed = S().jobFeed || { loaded: 0 });
  RC.feedJobs = () => D.jobs.slice(0, feed().loaded);
  RC.availJobs = () => { const ids = new Set(RC.feedJobs().map(j => j.id)); S().tracker.forEach(t => ids.add(t.jobId)); return D.jobs.filter(j => ids.has(j.id)); };
  const trackerOf = jobId => S().tracker.find(t => t.jobId === jobId);
  const STAT = [['saved', 'Saved', 'bookmark', '#6A6E7A'], ['applied', 'Applied', 'send', '#3F5A86'], ['screening', 'Screening', 'eye', '#D68A0A'], ['interview', 'Interview', 'mic', '#6B4FBB'], ['offer', 'Offer', 'award', '#0B7E62'], ['rejected', 'Rejected', 'x', '#B3282D']];

  /* ---------- module lock guard ---------- */
  const guard = (key, name) => {
    if (S().modules[key] === false) return view(key, name, '', '', `<div class="card empty"><div style="width:64px;height:64px;border-radius:50%;background:var(--bg);display:grid;place-items:center;margin:0 auto 12px">${I('lock', 28)}</div><h2>${name} is not enabled for your account</h2><p>Radical has switched this module off for your batch. You can ask your counsellor to enable it.</p><button class="btn primary" id="askMod">Request access</button></div>`, () => { $('#askMod').onclick = () => { RC.toast('Request sent to Radical admin', 'info'); }; });
    return null;
  };

  /* ---------- job card ---------- */
  const skillChips = j => j.skills.map(s => `<span class="badge ${(D.skills[s] || 0) >= .55 ? 'skill-ok' : 'skill-miss'}">${s}</span>`).join('');
  const jobCard = (j, compact) => {
    const tr = trackerOf(j.id), saved = S().saved.includes(j.id);
    return `<div class="job" data-job="${j.id}">${RC.coLogo(j.company)}<div class="grow"><div class="row gap8 wrap"><span class="t">${j.title}</span>${j.hot ? '<span class="badge red">Hot</span>' : ''}${j.partner ? '<span class="badge dark">Radical partner</span>' : ''}${tr ? `<span class="badge steel">${tr.status[0].toUpperCase() + tr.status.slice(1)}</span>` : ''}</div>
      <div class="muted" style="margin-top:2px">${j.company}</div>
      <div class="meta"><span>${I('pin', 14)}${j.city} · ${j.mode}</span><span>${I('rupee', 14)}${j.lo}–${j.hi} LPA</span><span>${I('briefcase', 14)}${j.exp}</span><span>${I('clock', 14)}${j.posted === 0 ? 'Today' : j.posted + 'd ago'}</span><span class="src ${j.src}">${j.srcLabel}</span></div>
      ${compact ? '' : `<div class="skills">${skillChips(j)}</div><div class="small muted mt8">${I('spark', 13)} ${j.reasons[0]}${j.reasons[1] ? ' · ' + j.reasons[1] : ''}</div>`}</div>
      <div class="match">${RC.ring(j.match, 62, 7, null, j.match + '%')}<div class="tiny muted">match</div>
      ${compact ? '' : `<div class="row gap4"><button class="btn sm ghost" data-save="${j.id}" title="Save">${I('bookmark', 16)}</button><button class="btn sm primary" data-apply="${j.id}">Apply now ${I('ext', 14)}</button></div>`}</div></div>`;
  };
  const bindJobCards = root => {
    RC.$$('[data-job]', root).forEach(c => c.addEventListener('click', e => { if (e.target.closest('[data-save],[data-apply]')) return; RC.go('/s/jobs/' + c.dataset.job); }));
    RC.$$('[data-save]', root).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); const id = b.dataset.save, arr = S().saved; const i = arr.indexOf(id); if (i >= 0) { arr.splice(i, 1); RC.toast('Removed from saved', 'info'); } else { arr.push(id); if (!trackerOf(id)) S().tracker.push({ id: RC.uid(), jobId: id, status: 'saved', date: new Date(RC.today).toISOString(), followUps: [] }); RC.toast('Saved to your Applications board'); } RC.save(); }));
    RC.$$('[data-apply]', root).forEach(b => b.addEventListener('click', e => { e.stopPropagation(); RC.applyNow(b.dataset.apply); }));
  };

  /* ---------- apply now (opens the official page in a new tab) ---------- */
  RC.applyNow = id => {
    const j = D.jobById(id);
    const w = window.open(j.url, '_blank'); if (w) { try { w.opener = null; } catch (e) { } } S().pendingApply = id; RC.save();
    if (!w) RC.toast('Pop-up blocked — allow pop-ups for this page to open the employer site', 'bad');
    const ask = () => {
      window.removeEventListener('focus', ask); if (S().pendingApply !== id) return; RC.closeModal();
      RC.modal({
        title: 'Did you apply to this job?', sub: `${j.title} · ${j.company}`, body: `<p class="muted">We opened the official ${j.srcLabel} page in a new tab. Tell us how it went so we can track it and schedule your follow-ups.</p><div class="callout info">${I('spark', 16)}<div>Your tailored resume and cover letter are ready in <b>Resume Studio</b> if you need them for the form.</div></div>`,
        footer: `<button class="btn" id="apNot">Not yet</button><button class="btn" id="apNo">Not interested</button><button class="btn green" id="apYes">${I('check', 16)} Yes, I applied</button>`,
        mount: m => {
          $('#apYes', m).onclick = () => { let t = trackerOf(id); if (t) { t.status = 'applied'; t.date = new Date(RC.today).toISOString(); } else S().tracker.push({ id: RC.uid(), jobId: id, status: 'applied', date: new Date(RC.today).toISOString(), followUps: [{ day: 3, done: false }, { day: 7, done: false }, { day: 14, done: false }] }); if (t && !t.followUps.length) t.followUps = [{ day: 3, done: false }, { day: 7, done: false }, { day: 14, done: false }]; S().pendingApply = null; RC.save(); RC.closeModal(); RC.toast('Marked as <b>Applied</b>. Follow-up reminders set for day 3, 7 and 14.'); if (location.hash.includes('/s/jobs') || location.hash.includes('tracker')) RC.render(); };
          $('#apNot', m).onclick = () => { S().pendingApply = null; RC.save(); RC.closeModal(); };
          $('#apNo', m).onclick = () => { S().pendingApply = null; RC.save(); RC.closeModal(); RC.toast('Got it — we’ll show fewer jobs like this', 'info'); };
        }
      });
    };
    window.addEventListener('focus', ask); RC.onLeave(() => window.removeEventListener('focus', ask));
  };

  /* =============================================================== DASHBOARD */
  RC.route('/s/dashboard', 'student', () => {
    const top = RC.feedJobs().slice(0, 4), tr = S().tracker, loadedN = feed().loaded;
    const due = tr.filter(t => ['applied', 'screening'].includes(t.status)).map(t => ({ t, j: D.jobById(t.jobId), f: t.followUps.find(f => !f.done) })).filter(x => x.f).slice(0, 3);
    const res = S().results, avgATS = Math.round(S().resumes.reduce((a, r) => a + r.ats, 0) / S().resumes.length);
    const ready = Math.round((res.aptitude.score + res.technical.score + 70) / 3);
    const perWeek = [1, 2, 1, 3, 4, 2, 3];
    return view('dashboard', 'Good morning, Aarav', RC.fmtDate(RC.today) + ' · You have 3 follow-ups today' + (loadedN ? '.' : ' and 5 free job matches waiting for you.'), `<a class="btn" href="#/s/resume">${I('file', 16)} Build a resume</a><a class="btn primary" href="#/s/jobs">${I('briefcase', 16)} Find jobs</a>`, `
      <div class="g4">
        <div class="card kpi-card"><div class="kpi"><span class="l">Job matches</span><span class="v">${loadedN}</span><span class="d ${loadedN ? 'up' : 'muted'}">${loadedN ? 'of ' + D.jobs.length + ' found · ' + (D.jobs.length - loadedN) + ' more to load' : '5 free matches waiting'}</span></div><div class="ic" style="background:var(--red-l);color:var(--red)">${I('briefcase')}</div></div>
        <div class="card kpi-card"><div class="kpi"><span class="l">Applications</span><span class="v">${tr.filter(t => t.status !== 'saved').length}</span><span class="d up">1 interview · 1 offer</span></div><div class="ic" style="background:var(--green-l);color:var(--green)">${I('send')}</div></div>
        <div class="card kpi-card"><div class="kpi"><span class="l">Avg. ATS score</span><span class="v">${avgATS}</span><span class="d up">▲ 6 vs last month</span></div><div class="ic" style="background:var(--amber-l);color:var(--amber)">${I('file')}</div></div>
        <div class="card kpi-card"><div class="kpi"><span class="l">Interview readiness</span><span class="v">${ready}%</span><span class="d muted">2 of 6 rounds done</span></div><div class="ic" style="background:var(--violet-l);color:var(--violet)">${I('mic')}</div></div>
      </div>
      <div class="g-main mt16"><div class="col gap18">
        ${top.length ? `<div class="card"><div class="card-h"><h3>${I('target', 18)} Best matches for you</h3><a href="#/s/jobs" class="small bold">View all ${loadedN} ${I('arrowR', 12)}</a></div><div class="col">${top.map(j => jobCard(j, true)).join('')}</div></div>` : `<div class="card center" style="background:linear-gradient(135deg,#FFF5F5,#F1FAF6);border-color:var(--red-m);padding:34px 20px"><div style="width:68px;height:68px;border-radius:50%;background:#fff;box-shadow:var(--shadow);display:grid;place-items:center;margin:0 auto 12px;color:var(--red)">${I('briefcase', 30)}</div><h2>Enjoy your first 5 free job matches</h2><p class="muted" style="max-width:460px;margin:8px auto 16px">We’ll compare thousands of live jobs with your wishlist and rank the best fits for you.</p><a class="btn primary lg" href="#/s/jobs">Click here to get my 5 free matches</a></div>`}
        <div class="g2"><div class="card"><div class="card-h"><h3>Applications this week</h3></div>${RC.barChart(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], [{ name: 'Applied', color: '#B3282D', data: perWeek }], { h: 170, max: 5 })}</div>
        <div class="card"><div class="card-h"><h3>${I('bell', 18)} Follow-ups due</h3></div>${due.map(x => `<div class="row gap8 mb8"><span style="flex:none">${RC.coLogo(x.j.company, 34)}</span><div class="grow"><div class="bold" style="font-size:13px">${x.j.title}</div><div class="tiny muted">${x.j.company} · day ${x.f.day} follow-up</div></div><button class="btn sm" data-fu="${x.t.id}">Draft</button></div>`).join('') || '<div class="muted">Nothing due today 🎉</div>'}<a class="small bold" href="#/s/tracker">Open applications board ${I('arrowR', 12)}</a></div></div>
      </div>
      <div class="col gap18">
        <div class="card" style="background:linear-gradient(140deg,#0B0B0F,#1c1416 70%,#0d2a23);color:#fff;border:0"><div class="row between"><div><div class="small" style="color:#b9bbc7">Your wallet</div><div style="font:700 34px var(--f-head)" id="dbBal">0</div><div class="small" style="color:#b9bbc7">credits · ${RC.num(S().wallet.free)} free · ${RC.num(S().wallet.paid)} paid</div></div>${RC.ring(Math.min(100, RC.balance() / 6), 76, 8, '#6DB33F', '', '')}</div>
          <div class="row gap8 mt12"><a class="btn sm block" href="#/s/credits" style="color:var(--ink)">History</a><button class="btn sm primary block" id="reqCr">Request credits</button></div>
          <div class="tiny mt12" style="color:#b9bbc7">≈ ${Math.floor(RC.balance() / 20)} tailored resumes · ${Math.floor(RC.balance() / 90)} mock interviews</div></div>
        <div class="card"><div class="card-h"><h3>${I('zap', 18)} Next best actions</h3></div>
          <div class="col gap8">${[loadedN ? ['Build a resume for Persistent Systems (88% match)', '/s/resume/build/j1', 'file', 'red'] : ['Get your 5 free job matches', '/s/jobs', 'briefcase', 'red'], ['Practise a group discussion round', '/s/interview/gd', 'users', 'violet'], ['Close the Kubernetes gap — Radical DevOps course', '/s/learn', 'book', 'green']].map(a => `<a href="#${a[1]}" class="row gap8" style="text-decoration:none;color:inherit;padding:8px;border-radius:10px;background:var(--bg)"><span class="badge ${a[3]}" style="padding:6px">${I(a[2], 16)}</span><span class="grow bold" style="font-size:13px">${a[0]}</span>${I('chevR', 16)}</a>`).join('')}</div></div>
        <div class="card"><div class="card-h"><h3>Skills to add</h3></div><div class="small muted mb8">Most-requested skills in your matches that you don’t have yet:</div><div class="row wrap gap8"><span class="badge skill-miss">Kubernetes</span><span class="badge skill-miss">Terraform</span><span class="badge skill-miss">Prometheus</span></div><a class="btn sm block mt12" href="#/s/learn">See Radical courses</a></div>
      </div></div>`, a => {
      RC.countUp($('#dbBal', a), RC.balance(), 900, RC.num); bindJobCards(a);
      $('#reqCr', a).onclick = () => creditRequestModal();
      RC.$$('[data-fu]', a).forEach(b => b.onclick = () => followUpModal(b.dataset.fu));
    });
  });

  /* =============================================================== JOBS */
  RC.route('/s/jobs', 'student', () => {
    const g = guard('jobs', 'Job matches'); if (g) return g;
    const inner = `<div class="g-main"><div>
      <div class="card tight mb16" id="jFilters"><div class="filters"><div class="search" style="max-width:260px;flex:none">${I('search', 16)}<input id="jq" placeholder="Search title, company, skill" value="${RC.esc(S().q || '')}"></div>
      <select class="input" id="jCity" style="width:150px"><option value="">All locations</option>${['Pune', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Kochi', 'Remote'].map(c => `<option>${c}</option>`).join('')}</select>
      <select class="input" id="jMode" style="width:130px"><option value="">Any mode</option><option>Onsite</option><option>Hybrid</option><option>Remote</option></select>
      <select class="input" id="jSrc" style="width:160px"><option value="">All sources</option>${Object.entries(D.srcLabel).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>
      <select class="input" id="jSort" style="width:140px"><option value="match">Best match</option><option value="new">Newest</option><option value="sal">Highest salary</option></select>
      <label class="row gap8 small"><input type="checkbox" id="jTop"> 80%+ only</label></div></div>
      <div class="row between mb8" id="jHead"><div class="muted" id="jCount"></div><div class="small muted">Sources: company sites · Naukri · LinkedIn · Indeed · Radical partners</div></div>
      <div class="col" id="jList"></div><div id="jMore"></div></div>
      <div class="sticky-side col gap14"><div class="card"><div class="card-h"><h3>${I('target', 18)} Your wishlist</h3><a class="small bold" href="#/s/profile">Edit</a></div>
        <div class="small muted mb8">Roles</div><div class="row wrap gap6 mb8">${D.wishlist.roles.map(r => `<span class="badge steel">${r}</span>`).join('')}</div>
        <div class="small muted mb8">Locations</div><div class="row wrap gap6 mb8">${D.wishlist.cities.map(r => `<span class="badge">${r}</span>`).join('')}</div>
        <div class="small muted">Salary · Experience</div><div class="bold">₹6–9 LPA · Fresher</div>
        <div class="divider"></div><div class="row between small"><span class="muted">Matches loaded</span><b id="fpTxt"></b></div><div class="progress mt8"><i id="fpBar" style="width:0%"></i></div><div class="hint mt8">Your first 5 matches are free. After that, every 5 matches cost ${PRICE.match} credits.</div></div>
      <div class="card"><h4 class="mb8">Where these jobs come from</h4>${[['Company career pages', 34, '#3F5A86'], ['Naukri', 22, '#1B5FA8'], ['LinkedIn', 20, '#0A66C2'], ['Indeed', 14, '#2557A7'], ['Radical partners', 10, '#B3282D']].map(x => `<div class="row gap8 small mb8"><span style="width:8px;height:8px;border-radius:2px;background:${x[2]}"></span><span class="grow">${x[0]}</span><b>${x[1]}%</b></div>`).join('')}<div class="callout info tiny mt8" style="font-size:11.5px">${I('info', 14)}<div>“Apply now” opens the official page in a new tab. We never scrape or auto-apply on LinkedIn or Naukri.</div></div></div></div></div>`;
    return view('jobs', 'Job matches', 'Ranked against your wishlist and skills', `<button class="btn" id="savedOnly">${I('bookmark', 16)} Saved (${S().saved.length})</button>`, inner, a => {
      const total = D.jobs.length; let newFrom = -1;
      const setPill = () => { const nb = RC.$('.nav a.on .pill'); if (nb) nb.outerHTML = '<span class="badge pill">' + feed().loaded + '/' + total + '</span>'; };
      const emptyHtml = `<div class="card center fadein" style="background:linear-gradient(135deg,#FFF5F5,#F1FAF6);border-color:var(--red-m);padding:64px 24px"><div style="width:96px;height:96px;border-radius:50%;background:#fff;box-shadow:var(--shadow);display:grid;place-items:center;margin:0 auto 18px;color:var(--red)">${I('briefcase', 44)}</div>
        <h1 style="font-size:28px">Enjoy your first 5 free job matches</h1>
        <p class="muted" style="max-width:540px;margin:10px auto 22px;font-size:14.5px">We’ll compare thousands of live jobs from company career pages, Naukri, LinkedIn and Indeed with your wishlist — <b>${D.wishlist.roles.join(', ')}</b> · ${D.wishlist.cities.join(', ')} · ₹6–9 LPA — and rank the best fits for you.</p>
        <button class="btn primary lg" id="firstFive">${I('zap', 18)} Click here to get my 5 free matches</button>
        <div class="small muted mt12">No credits needed for your first 5. Want more later? Each next set of 5 costs ${PRICE.match} credits.</div></div>`;
      const moreHtml = () => {
        const loaded = feed().loaded, left = total - loaded, nxt = Math.min(BATCH, left);
        if (left <= 0) return `<div class="callout good mt16">${I('check', 18)}<div><b>All ${total} matches are loaded.</b> New matches arrive every morning.</div></div>`;
        return `<div class="card mt16" style="border:1.5px dashed var(--red-m);background:#FFFBFB"><div class="row gap14 wrap"><div style="width:54px;height:54px;border-radius:14px;background:var(--red-l);color:var(--red);display:grid;place-items:center;flex:none">${I('briefcase', 26)}</div>
          <div class="grow" style="min-width:240px"><h3>Showing ${loaded} of ${total} matches</h3><div class="muted small mt4">${loaded === BATCH ? 'Your first 5 were free. ' : ''}The next ${nxt} matches cost <b>${PRICE.match} credits</b>. Your balance: <b>${RC.num(RC.balance())} credits</b>.</div><div class="progress mt8" style="max-width:340px"><i style="width:${loaded / total * 100}%"></i></div></div>
          <div class="col gap6" style="align-items:stretch"><button class="btn primary lg" id="moreBtn">${I('zap', 16)} Use ${PRICE.match} credits · Load next ${nxt}</button><a class="small center" id="reqMore" style="cursor:pointer">Low on credits? Request more</a></div></div></div>`;
      };
      const draw = () => {
        const loaded = feed().loaded;
        $('#fpTxt', a).textContent = loaded + ' of ' + total; $('#fpBar', a).style.width = loaded / total * 100 + '%';
        if (!loaded) { $('#jFilters', a).style.display = 'none'; $('#jHead', a).style.display = 'none'; $('#jList', a).innerHTML = emptyHtml; $('#jMore', a).innerHTML = ''; $('#firstFive', a).onclick = firstFive; return; }
        $('#jFilters', a).style.display = ''; $('#jHead', a).style.display = '';
        const q = $('#jq', a).value.toLowerCase(), c = $('#jCity', a).value, m = $('#jMode', a).value, s = $('#jSrc', a).value, top = $('#jTop', a).checked, so = $('#jSort', a).value;
        let l = RC.feedJobs().filter(j => (!q || (j.title + j.company + j.skills.join(' ')).toLowerCase().includes(q)) && (!c || j.city === c) && (!m || j.mode === m) && (!s || j.src === s) && (!top || j.match >= 80));
        if (so === 'new') l = l.slice().sort((x, y) => x.posted - y.posted); if (so === 'sal') l = l.slice().sort((x, y) => y.hi - x.hi);
        $('#jCount', a).innerHTML = `<b>${l.length}</b> of ${loaded} loaded matches shown`; $('#jList', a).innerHTML = l.map(j => jobCard(j)).join('<div style="height:12px"></div>') || '<div class="card empty">No jobs match these filters.</div>'; bindJobCards(a);
        $('#jMore', a).innerHTML = moreHtml(); const mb = $('#moreBtn', a); if (mb) { mb.onclick = loadMore; $('#reqMore', a).onclick = () => creditRequestModal(); }
        if (newFrom >= 0) { const el = RC.$('[data-job="' + D.jobs[newFrom].id + '"]', a); newFrom = -1; if (el) { el.style.boxShadow = '0 0 0 3px var(--green-m)'; setTimeout(() => { el.style.boxShadow = ''; }, 2600); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } }
      };
      const firstFive = async () => {
        $('#jList', a).innerHTML = `<div class="card stage-loading"><div style="max-width:470px;text-align:left"><div class="center mb16"><div class="spin" style="width:44px;height:44px;border-width:4px"></div></div><h2 class="center mb16">Finding your 5 free matches…</h2><div id="anl"></div></div></div>`;
        const steps = ['Reading your wishlist — ' + D.wishlist.roles.join(', '), 'Searching 9,600+ live jobs across company sites, Naukri, LinkedIn and Indeed', 'Matching skills, location and salary (vector search on Radical’s own servers)', 'Writing “why it fits” for your top 5 jobs'];
        for (const st of steps) { const r = document.createElement('div'); r.className = 'parse-line'; r.innerHTML = `<span class="spin"></span><span>${st}</span>`; $('#anl', a).appendChild(r); await RC.sleep(900); r.firstChild.outerHTML = `<span class="tick">${I('check')}</span>`; }
        await RC.sleep(500); feed().loaded = BATCH; RC.ledgerAdd('Job matches — first 5 (free)', 0, 'free'); RC.save(); RC.toast('<b>5 free job matches</b> are ready! Your first 5 cost nothing.'); newFrom = 0; draw(); window.scrollTo(0, 0); setPill();
      };
      const loadMore = async () => {
        const loaded = feed().loaded, nxt = Math.min(BATCH, total - loaded); if (RC.balance() < PRICE.match) return needCredits(PRICE.match);
        const b = $('#moreBtn', a); b.disabled = true; b.innerHTML = '<span class="spin" style="border-top-color:#fff;border-color:rgba(255,255,255,.3)"></span> Finding the next ' + nxt + '…'; await RC.sleep(1500);
        RC.spend(PRICE.match, 'Job matches — next ' + nxt + ' (#' + (loaded + 1) + '–' + (loaded + nxt) + ')'); feed().loaded = loaded + nxt; RC.save(); newFrom = loaded; RC.toast('<b>' + nxt + ' more matches</b> loaded · ' + PRICE.match + ' credits used'); draw(); setPill();
      };
      ['jq', 'jCity', 'jMode', 'jSrc', 'jSort', 'jTop'].forEach(id => $('#' + id, a).addEventListener('input', draw)); draw();
      $('#savedOnly', a).onclick = () => { if (!feed().loaded) return RC.toast('Get your first 5 free matches first', 'info'); RC.$$('#jList .job', a).forEach(e => { e.style.display = S().saved.includes(e.dataset.job) ? '' : 'none'; }); RC.toast('Showing saved jobs', 'info'); };
    });
  });

  /* =============================================================== JOB DETAIL */
  RC.route('/s/jobs/:id', 'student', p => {
    const j = D.jobById(p.id); if (!j) return { html: '<div class="empty">Job not found</div>' };
    const tr = trackerOf(j.id), saved = S().saved.includes(j.id), band = [j.lo, j.hi];
    return view('jobs', j.title, `${j.company} · ${j.city}`, `<a class="btn" href="#/s/jobs">${I('arrowL', 16)} All jobs</a>`, `
      <div class="g-main"><div class="col gap18">
        <div class="card"><div class="row gap14 wrap">${RC.coLogo(j.company, 62)}<div class="grow"><h2>${j.title}</h2><div class="muted">${j.company}</div><div class="meta row wrap gap14 small muted mt8"><span>${I('pin', 14)} ${j.city} · ${j.mode}</span><span>${I('rupee', 14)} ${j.lo}–${j.hi} LPA</span><span>${I('briefcase', 14)} ${j.exp}</span><span>${I('clock', 14)} Posted ${RC.ago(j.posted).toLowerCase()}</span><span class="src ${j.src}">via ${j.srcLabel}</span></div></div>${RC.ring(j.match, 92, 10, null, j.match + '%', 'match')}</div></div>
        <div class="card" style="border-color:var(--green-m);background:#FAFDFB"><div class="card-h"><h3>${I('spark', 18)} Why this job fits you</h3><span class="badge green">AI analysis</span></div>
          <div class="col gap8">${j.reasons.map((r, i) => `<div class="row gap8"><span class="tick" style="${r.startsWith('Gap') ? 'background:var(--amber)' : ''}">${I(r.startsWith('Gap') ? 'alert' : 'check')}</span><span>${r}</span></div>`).join('')}</div>
          <div class="divider"></div><h4 class="mb8">Skill fit</h4>${j.skills.map(s => { const v = Math.round((D.skills[s] || .1) * 100); return `<div class="skillbar" style="grid-template-columns:130px 1fr 44px"><span>${s}</span><div class="progress ${v >= 55 ? 'g' : 'r'} thin"><i style="width:${v}%"></i></div><b class="mono small">${v}%</b></div>`; }).join('')}
          ${j.gaps.length ? `<div class="callout warn mt12">${I('book', 18)}<div><b>Close the gap:</b> ${j.gaps.join(', ')}. Radical’s <a href="#/s/learn">DevOps with Docker, Kubernetes & Terraform</a> starts 28 Sep 2026.</div></div>` : ''}</div>
        <div class="card jd"><h3>About the company</h3><p class="mt8">${j.about}</p><h4>What you will do</h4><ul>${j.resp.map(r => `<li>${r}</li>`).join('')}</ul><h4>What we look for</h4><ul><li>${j.exp} of experience or equivalent projects</li>${j.skills.map(s => `<li>Working knowledge of <b>${s}</b></li>`).join('')}<li>Good communication and a willingness to learn</li></ul><h4>Nice to have</h4><ul>${j.nice.map(r => `<li>${r}</li>`).join('')}</ul><h4>Benefits</h4><ul><li>Health insurance · learning budget · hybrid flexibility</li></ul></div>
      </div>
      <div class="sticky-side col gap14">
        <div class="card"><button class="btn primary lg block" id="apply">Apply now ${I('ext', 16)}</button><div class="hint center mt8">Opens the official ${j.srcLabel} page in a new tab</div>
          <div class="divider"></div><div class="col gap8"><button class="btn block" id="mkRes">${I('file', 16)} Build tailored resume <span class="badge red" style="margin-left:auto">${PRICE.resume} cr</span></button><button class="btn block" id="mkCov">${I('mail', 16)} Write cover letter <span class="badge red" style="margin-left:auto">${PRICE.cover} cr</span></button><button class="btn block" id="mkAts">${I('target', 16)} Check my ATS score <span class="badge red" style="margin-left:auto">${PRICE.ats} cr</span></button><button class="btn block" id="prac">${I('mic', 16)} Practise interview for this role</button><button class="btn block ${saved ? 'dark' : ''}" id="sv">${I('bookmark', 16)} ${saved ? 'Saved' : 'Save job'}</button></div>
          ${tr ? `<div class="callout info mt12" style="font-size:12.5px">${I('list', 16)}<div>On your board: <b>${tr.status}</b></div></div>` : ''}</div>
        <div class="card"><h4 class="mb8">Salary insight</h4><div class="small muted mb8">Offered ₹${j.lo}–${j.hi} LPA · market for this role in ${j.city}: ₹${(j.lo - .5).toFixed(1)}–${(j.hi + 1).toFixed(1)} LPA</div><div class="neg-meter" style="margin-top:28px"><i style="left:${RC.clamp(((j.lo + j.hi) / 2 - (j.lo - .5)) / ((j.hi + 1) - (j.lo - .5)) * 100, 5, 95)}%"></i><u style="left:${RC.clamp(((j.lo + j.hi) / 2 - (j.lo - .5)) / ((j.hi + 1) - (j.lo - .5)) * 100, 5, 95)}%">Mid-point</u></div></div>
      </div></div>`, a => {
      $('#apply', a).onclick = () => RC.applyNow(j.id);
      $('#mkRes', a).onclick = () => RC.go('/s/resume/build/' + j.id); $('#mkCov', a).onclick = () => RC.go('/s/cover?job=' + j.id);
      $('#mkAts', a).onclick = async () => { if (RC.balance() < PRICE.ats) return needCredits(PRICE.ats); const m = RC.modal({ title: 'Checking ATS fit…', body: '<div class="center" style="padding:24px"><span class="spin" style="width:32px;height:32px"></span></div>', noClose: true }); await RC.sleep(1400); RC.spend(PRICE.ats, 'ATS score check — ' + j.title); RC.closeModal(); const cov = atsCov(j); RC.modal({ title: 'ATS score for this job', body: `<div class="center">${RC.gauge(cov.score, 'Master resume vs this job')}</div><div class="mt16"><b>Matched keywords</b><div class="kw mt8">${cov.hit.map(k => `<span class="badge green">${k}</span>`).join('')}</div><b class="mt12" style="display:block">Missing keywords</b><div class="kw mt8">${cov.miss.map(k => `<span class="badge red">${k}</span>`).join('') || 'None 🎉'}</div></div>`, footer: `<button class="btn" data-close>Close</button><button class="btn primary" id="bt">Build tailored resume</button>`, mount: mm => $('#bt', mm).onclick = () => { RC.closeModal(); RC.go('/s/resume/build/' + j.id); } }); };
      $('#prac', a).onclick = () => RC.go('/s/interview'); $('#sv', a).onclick = () => { const id = j.id, arr = S().saved; if (!arr.includes(id)) { arr.push(id); if (!trackerOf(id)) S().tracker.push({ id: RC.uid(), jobId: id, status: 'saved', date: new Date(RC.today).toISOString(), followUps: [] }); RC.save(); RC.toast('Saved'); RC.render(); } };
    });
  });

  /* ---------- helpers: ATS coverage & resume html ---------- */
  const resumeText = () => JSON.stringify(D.resume).toLowerCase();
  const atsCov = j => { const t = resumeText(); const hit = j.skills.filter(s => t.includes(s.toLowerCase().replace('shell scripting', 'bash'))), miss = j.skills.filter(s => !hit.includes(s)); return { hit, miss, score: Math.round(58 + hit.length / j.skills.length * 34 + 6) }; };
  const resumeHTML = (j, master) => {
    const R = D.resume, keys = j ? j.skills.map(s => s.toLowerCase()) : [];
    const mark = s => { let out = RC.esc(s); keys.forEach(k => { out = out.replace(new RegExp('(' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '<mark>$1</mark>'); }); return out; };
    const has = (s, arr) => arr.some(k => s.toLowerCase().includes(k)); const sk = R.skills.slice().sort((a, b) => (has(b, keys) ? 1 : 0) - (has(a, keys) ? 1 : 0));
    const summary = j ? `Cloud and DevOps fresher with hands-on ${j.have.slice(0, 3).join(', ') || 'AWS, Linux and Docker'} experience from a 3-month internship and three deployed projects, AWS Cloud Practitioner certified. Seeking the ${j.title} role at ${j.company} to build reliable, automated ${j.kind === 'support' ? 'support and troubleshooting' : 'cloud'} workflows.` : R.summary;
    return `<h1>${R.name}</h1><div class="ttl">${j ? j.title : R.title}</div><div class="ct">${R.contact}</div><h2>Professional summary</h2><p>${mark(summary)}</p>
    <h2>Skills</h2><p>${sk.map(mark).join(' · ')}</p>
    <h2>Experience</h2>${R.exp.map(e => { const pts = e.pts.slice().sort((a, b) => (has(b, keys) ? 1 : 0) - (has(a, keys) ? 1 : 0)); return `<div class="jb"><span>${e.role} — ${e.org}</span><span>${e.when}</span></div><ul>${pts.map(x => `<li>${mark(x)}</li>`).join('')}</ul>`; }).join('')}
    <h2>Projects</h2>${R.projects.map(p => `<div class="jb"><span>${p.name}</span></div><ul>${p.pts.map(x => `<li>${mark(x)}</li>`).join('')}</ul>`).join('')}
    <h2>Education</h2>${R.edu.map(e => `<div class="jb"><span>${e.deg} — ${e.org}</span><span>${e.when}</span></div><div>${e.extra}</div>`).join('')}
    <h2>Certifications</h2><ul>${R.certs.map(c => `<li>${c}</li>`).join('')}</ul>`;
  };

  /* =============================================================== RESUME STUDIO */
  RC.route('/s/resume', 'student', () => {
    const g = guard('resume', 'Resume Studio'); if (g) return g;
    return view('resume', 'Resume Studio', 'ATS-ready resumes — built from your wishlist and tailored to each job', `<button class="btn primary" id="newRes">${I('plus', 16)} Tailor for a job</button>`, `
      <div class="g3">${S().resumes.map(r => { const j = r.job && D.jobById(r.job); return `<div class="card" data-res="${r.id}" style="cursor:pointer"><div class="row between"><div class="badge ${r.master ? 'dark' : 'steel'}">${r.master ? 'Master' : 'Tailored'}</div>${RC.ring(r.ats, 54, 6, null, r.ats, 'ATS')}</div>
        <div style="height:120px;background:#fff;border:1px solid var(--line);border-radius:8px;margin:12px 0;padding:10px;overflow:hidden;font-size:6px;line-height:1.5;color:#333"><b style="font-size:9px">Aarav Sharma</b><div style="height:4px;background:#ddd;margin:4px 0 6px"></div>${'<div style="height:4px;background:#eee;margin:3px 0;width:'.repeat(1) + '92%"></div><div style="height:4px;background:#eee;margin:3px 0;width:80%"></div><div style="height:4px;background:#eee;margin:3px 0;width:88%"></div><div style="height:4px;background:#ddd;margin:8px 0 3px;width:30%"></div><div style="height:4px;background:#eee;margin:3px 0;width:84%"></div><div style="height:4px;background:#eee;margin:3px 0;width:70%"></div>'}</div>
        <div class="bold">${r.title}</div><div class="muted small">${RC.fmtDate(r.date)}${j ? ' · ' + j.match + '% job match' : ''}</div><div class="row gap8 mt12"><button class="btn sm grow">Open</button><button class="btn sm" data-pdf="${r.id}">${I('download', 14)} PDF</button></div></div>`; }).join('')}
        <div class="card center" id="newRes2" style="border-style:dashed;cursor:pointer;display:grid;place-items:center;min-height:270px"><div><div style="width:52px;height:52px;border-radius:50%;background:var(--red-l);color:var(--red);display:grid;place-items:center;margin:0 auto 10px">${I('plus', 24)}</div><b>Build a new resume</b><div class="muted small">Pick any job — ${PRICE.resume} credits</div></div></div></div>
      <div class="callout info mt16">${I('info', 18)}<div><b>How it works:</b> analyse the job → map gaps to your real profile → write truthful bullets → ATS check → export. The AI only uses facts you confirm — it never invents experience.</div></div>`, a => {
      const pick = () => { RC.modal({ title: 'Tailor resume for which job?', body: `<div class="col" style="max-height:380px;overflow:auto">${RC.availJobs().slice(0, 10).map(j => `<div class="job" data-pick="${j.id}" style="padding:10px 12px;margin-bottom:8px">${RC.coLogo(j.company, 36)}<div class="grow"><b>${j.title}</b><div class="muted small">${j.company} · ${j.city}</div></div>${RC.ring(j.match, 44, 5, null, j.match)}</div>`).join('')}</div>`, mount: m => RC.$$('[data-pick]', m).forEach(e => e.onclick = () => { RC.closeModal(); RC.go('/s/resume/build/' + e.dataset.pick); }) }); };
      $('#newRes', a).onclick = pick; $('#newRes2', a).onclick = pick;
      RC.$$('[data-res]', a).forEach(c => c.addEventListener('click', e => { if (e.target.closest('[data-pdf]')) return; RC.go('/s/resume/view/' + c.dataset.res); }));
      RC.$$('[data-pdf]', a).forEach(b => b.onclick = e => { e.stopPropagation(); RC.go('/s/resume/view/' + b.dataset.pdf); setTimeout(() => RC.toast('Use “Download PDF” on the resume page', 'info'), 400); });
    });
  });

  RC.route('/s/resume/build/:job', 'student', p => {
    const j = D.jobById(p.job); const cost = PRICE.resume;
    return view('resume', 'Tailor resume', `${j.title} · ${j.company}`, `<a class="btn" href="#/s/resume">${I('arrowL', 16)} Back</a>`, `
      <div class="g-main"><div class="card" id="pipeCard"><div class="card-h"><h3>${I('cpu', 18)} AI resume pipeline</h3><span class="badge violet">5 steps</span></div>
        <div class="pipe" id="pipe">${[['Analyse the job', 'Must-have skills, keywords, seniority'], ['Gap map', 'Compare with your profile — you confirm the facts'], ['Write', 'Truthful, results-first bullets'], ['ATS check', 'Parse test, keyword coverage, formatting'], ['Export', 'Text-based PDF + Word']].map((s, i) => `<div class="st" id="st${i}"><div class="ic">${i + 1}</div><div class="grow"><b>${s[0]}</b><div class="muted small">${s[1]}</div><div class="extra mt8" id="ex${i}"></div></div></div>`).join('')}</div></div>
      <div class="sticky-side col gap14"><div class="card"><div class="row gap8">${RC.coLogo(j.company, 40)}<div><b>${j.title}</b><div class="muted small">${j.company}</div></div></div><div class="row gap8 mt12"><span class="badge green">${j.match}% match</span><span class="badge">${j.skills.length} key skills</span></div></div>
      <div class="reserve" id="rsv"><div style="font:700 13px var(--f-head);letter-spacing:.6px;color:#8fe3c3;margin-bottom:6px">CREDIT GUARANTEE</div><div class="b"><span>Price of this feature</span><b>${cost} credits</b></div><div class="b"><span>Your balance</span><b id="rsBal">${RC.balance()}</b></div><div class="b"><span>Status</span><b id="rsSt">Not started</b></div>
        <div class="tiny mt8" style="color:#a9abb8">We reserve the full price first. If anything fails you’re refunded automatically — no half-built resumes, no wasted credits.</div><button class="btn primary lg block mt12" id="gen">Generate resume · ${cost} credits</button></div></div></div>`, a => {
      $('#gen', a).onclick = async () => {
        if (RC.balance() < cost) return needCredits(cost);
        const b = $('#gen', a); b.disabled = true; b.textContent = 'Working…'; $('#rsSt', a).textContent = `${cost} credits reserved`; $('#rsBal', a).textContent = RC.balance() - cost + ' (held)'; RC.toast(`<b>${cost} credits reserved</b> for this resume`, 'info');
        const act = i => { RC.$$('.st', a).forEach((s, k) => { s.classList.toggle('act', k === i); s.classList.toggle('done', k < i); if (k < i) s.querySelector('.ic').innerHTML = I('check', 14); }); };
        act(0); await RC.sleep(900); $('#ex0', a).innerHTML = `<div class="kw">${j.skills.map(s => `<span class="badge steel">${s}</span>`).join('')}<span class="badge">${j.exp}</span><span class="badge">${j.mode}</span></div>`; await RC.sleep(900);
        act(1); await RC.sleep(700); $('#ex1', a).innerHTML = `<div class="small mb8">Please confirm these are true — we only write what you confirm:</div>${j.have.slice(0, 4).map(s => `<label class="row gap8 small mb8"><input type="checkbox" checked> I have real experience with <b>${s}</b></label>`).join('')}${j.gaps.slice(0, 2).map(s => `<label class="row gap8 small mb8"><input type="checkbox"> I have real experience with <b>${s}</b> <span class="badge amber">gap — left off unless you tick</span></label>`).join('')}<button class="btn dark sm" id="conf">Confirm &amp; continue</button>`;
        await new Promise(r => $('#conf', a).onclick = r); $('#conf', a).remove();
        act(2); await RC.sleep(1300); $('#ex2', a).innerHTML = '<div class="small">Rewrote summary and re-ordered 9 bullets around the job’s keywords.</div>';
        act(3); await RC.sleep(1200); const cov = atsCov(j); $('#ex3', a).innerHTML = `<div class="small">ATS parse test <b class="up">passed</b> · keyword coverage <b>${Math.round(cov.hit.length / j.skills.length * 100)}%</b> · formatting <b class="up">clean</b></div>`;
        act(4); await RC.sleep(900); RC.$$('.st', a).forEach(s => { s.classList.remove('act'); s.classList.add('done'); s.querySelector('.ic').innerHTML = I('check', 14); });
        const id = 'rs' + RC.uid(); S().resumes.unshift({ id, title: `${j.title} — ${j.company}`, job: j.id, ats: cov.score + 6, date: new Date(RC.today).toISOString() }); RC.spend(cost, `Tailored resume — ${j.title}, ${j.company}`); $('#rsSt', a).textContent = `${cost} credits charged`; $('#rsBal', a).textContent = RC.balance(); RC.toast('Resume ready! <b>' + cost + ' credits</b> charged.'); await RC.sleep(600); RC.go('/s/resume/view/' + id);
      };
    });
  });

  RC.route('/s/resume/view/:id', 'student', p => {
    const r = S().resumes.find(x => x.id === p.id) || S().resumes[0]; const j = r.job ? D.jobById(r.job) : null; const cov = j ? atsCov(j) : { hit: D.resume.skills.slice(0, 5), miss: [], score: r.ats };
    const checks = [['Single-column layout', true], ['Standard section headings', true], ['No tables, images or text boxes', true], ['Selectable text PDF (parsable)', true], ['Length: 1 page', true], ['Contact details in body (not header)', true], ['Quantified achievements', true], [j && cov.miss.length ? 'Missing keyword: ' + cov.miss[0] : 'All key skills covered', !(j && cov.miss.length)]];
    return view('resume', r.title, j ? `Tailored for ${j.company} · ${j.match}% match` : 'Master resume built from your wishlist', `<a class="btn" href="#/s/resume">${I('arrowL', 16)} All resumes</a><button class="btn" id="dW">${I('file', 16)} Word (.docx)</button><button class="btn primary" id="dP">${I('download', 16)} Download PDF</button>`, `
      <div class="g-main"><div><div class="paper" id="paper">${resumeHTML(j)}</div></div>
      <div class="sticky-side col gap14"><div class="card center"><h4 class="mb8">ATS score</h4>${RC.gauge(Math.min(98, r.ats), r.ats >= 85 ? 'Excellent' : 'Good')}<div class="row gap8 mt12"><span class="badge green">${cov.hit.length} keywords matched</span>${cov.miss.length ? `<span class="badge red">${cov.miss.length} missing</span>` : ''}</div></div>
        <div class="card"><h4 class="mb8">ATS checklist</h4>${checks.map(c => `<div class="row gap8 small mb8"><span class="tick" style="${c[1] ? '' : 'background:var(--amber)'}">${I(c[1] ? 'check' : 'alert')}</span>${c[0]}</div>`).join('')}</div>
        ${j && cov.miss.length ? `<div class="card"><h4 class="mb8">Missing keywords</h4><div class="kw">${cov.miss.map(k => `<span class="badge red">${k}</span>`).join('')}</div><p class="small muted mt8">We haven’t added these because they’re not in your confirmed profile. If you know them, add real evidence — or learn them in <a href="#/s/learn">Radical’s course</a>.</p></div>` : ''}
        <div class="card"><div class="row between"><b>Free revision</b><span class="badge green">1 left</span></div><p class="small muted mt8">Change something (e.g. “emphasise Docker projects”) without paying again.</p><div class="row gap8"><input class="input" id="rev" placeholder="e.g. Make the summary shorter"><button class="btn dark" id="revGo">Apply</button></div></div></div></div>`, a => {
      $('#dP', a).onclick = () => { RC.toast('Opening print dialog — choose “Save as PDF”', 'info'); RC.printEl($('#paper', a)); };
      $('#dW', a).onclick = () => RC.toast('Word file generated: <b>Aarav_Sharma_Resume.docx</b> (demo)', 'info');
      $('#revGo', a).onclick = async () => { if (!$('#rev', a).value) return RC.toast('Type what to change first', 'info'); $('#revGo', a).innerHTML = '<span class="spin" style="border-top-color:#fff"></span>'; await RC.sleep(1300); RC.toast('Revision applied — <b>0 credits</b> (free revision used)'); $('#revGo', a).textContent = 'Apply'; };
    });
  });

  /* =============================================================== COVER LETTERS */
  RC.route('/s/cover', 'student', () => {
    const g = guard('cover', 'Cover Letters'); if (g) return g;
    const q = new URLSearchParams((location.hash.split('?')[1]) || ''); const pre = q.get('job') || 'j1';
    return view('cover', 'Cover Letters', 'One tailored letter per job — written from your resume', '', `
      <div class="g2" style="grid-template-columns:380px 1fr"><div class="col gap14"><div class="card"><h3 class="mb8">New cover letter</h3>
        <div class="field"><label class="f">Job</label><select class="input" id="cJob">${RC.availJobs().slice(0, 12).map(j => `<option value="${j.id}" ${j.id === pre ? 'selected' : ''}>${j.title} — ${j.company}</option>`).join('')}</select></div>
        <div class="field"><label class="f">Tone</label><div class="row gap8 wrap" id="cTone"><span class="chip on" data-t="professional">Professional</span><span class="chip" data-t="friendly">Friendly</span><span class="chip" data-t="concise">Concise</span></div></div>
        <div class="field"><label class="f">Anything to emphasise? (optional)</label><textarea class="input" id="cNote" placeholder="e.g. mention my Jenkins internship result"></textarea></div>
        <button class="btn primary block" id="cGen">${I('spark', 16)} Generate · ${PRICE.cover} credits</button><div class="hint center">1 free revision included</div></div>
        <div class="card"><h4 class="mb8">Your letters</h4>${S().covers.map(c => { const j = D.jobById(c.job); return `<div class="row gap8 mb8">${RC.coLogo(j.company, 32)}<div class="grow small"><b>${j.title}</b><div class="muted">${j.company} · ${c.tone}</div></div><span class="muted tiny">${RC.fmtDate(c.date)}</span></div>`; }).join('')}</div></div>
      <div class="card" id="cOut"><div class="empty">${I('mail', 40)}<h3 class="mt8">Your letter will appear here</h3><p>Pick a job and tap Generate.</p></div></div></div>`, a => {
      let tone = 'professional'; RC.$$('#cTone .chip', a).forEach(c => c.onclick = () => { RC.$$('#cTone .chip', a).forEach(x => x.classList.remove('on')); c.classList.add('on'); tone = c.dataset.t; });
      $('#cGen', a).onclick = async () => {
        if (RC.balance() < PRICE.cover) return needCredits(PRICE.cover); const j = D.jobById($('#cJob', a).value);
        $('#cOut', a).innerHTML = `<div class="row between mb16"><div class="row gap8"><span class="spin"></span><b>Writing your letter…</b></div><span class="badge red">${PRICE.cover} credits reserved</span></div><div class="paper" id="cPaper" style="min-height:560px;padding:36px 44px;white-space:pre-wrap;font-size:12.5px"></div>`;
        await RC.typeInto($('#cPaper', a), D.coverLetter(j, tone), 260);
        RC.spend(PRICE.cover, `Cover letter — ${j.title}, ${j.company}`); S().covers.unshift({ id: RC.uid(), job: j.id, tone, date: new Date(RC.today).toISOString() }); RC.save();
        $('#cOut', a).firstChild.innerHTML = `<div class="row gap8"><span class="tick">${I('check')}</span><b>Letter ready</b> <span class="muted small">· ${PRICE.cover} credits charged</span></div><div class="row gap8"><button class="btn sm" id="cCopy">${I('copy', 14)} Copy</button><button class="btn sm" id="cPdf">${I('download', 14)} PDF</button><button class="btn sm" id="cEdit">${I('edit', 14)} Edit</button></div>`;
        $('#cCopy', a).onclick = () => { navigator.clipboard && navigator.clipboard.writeText($('#cPaper', a).textContent); RC.toast('Copied to clipboard'); }; $('#cPdf', a).onclick = () => RC.printEl($('#cPaper', a)); $('#cEdit', a).onclick = () => { const pp = $('#cPaper', a); pp.contentEditable = true; pp.focus(); RC.toast('You can edit the letter directly', 'info'); };
      };
    });
  });

  /* =============================================================== TRACKER */
  const followUpModal = tid => {
    const t = S().tracker.find(x => x.id === tid), j = D.jobById(t.jobId); if (!j) return;
    const m = RC.modal({ title: 'AI-drafted follow-up', sub: `${j.title} · ${j.company}`, size: 'wide', body: `<div class="callout violet mb8" style="font-size:12.5px">${I('spark', 16)}<div>Personalised from your resume and application date. Review before sending — <b>${PRICE.follow} credits</b>.</div></div><textarea class="input" id="fuTxt" rows="14" style="font-family:var(--f-body);white-space:pre-wrap"></textarea>`, footer: `<button class="btn" data-close>Close</button><button class="btn" id="fuCopy">${I('copy', 14)} Copy</button><button class="btn primary" id="fuSend">${I('send', 14)} Send from my Gmail</button>` });
    if (RC.balance() < PRICE.follow) { RC.closeModal(); return needCredits(PRICE.follow); }
    RC.typeInto($('#fuTxt', m), D.followUp(j).replace('{date}', RC.fmtDate(t.date)), 400);
    $('#fuCopy', m).onclick = () => { navigator.clipboard && navigator.clipboard.writeText($('#fuTxt', m).value); RC.toast('Copied'); };
    $('#fuSend', m).onclick = () => { RC.spend(PRICE.follow, 'Follow-up draft — ' + j.company); const f = t.followUps.find(x => !x.done); if (f) f.done = true; RC.save(); RC.closeModal(); RC.toast('Follow-up sent to <b>hr@' + j.company.split(' ')[0].toLowerCase() + '.example</b>. Next reminder scheduled.'); RC.render(); };
  };
  RC.route('/s/tracker', 'student', () => {
    const g = guard('tracker', 'Applications'); if (g) return g;
    const tr = S().tracker, cnt = k => tr.filter(t => t.status === k).length;
    const applied = tr.filter(t => t.status !== 'saved').length, resp = tr.filter(t => ['screening', 'interview', 'offer', 'rejected'].includes(t.status)).length;
    const due = tr.filter(t => ['applied', 'screening'].includes(t.status)).map(t => ({ t, j: D.jobById(t.jobId), f: t.followUps.find(f => !f.done) })).filter(x => x.f);
    return view('tracker', 'Applications', 'Drag cards between columns — reminders and follow-up drafts run automatically', `<a class="btn primary" href="#/s/jobs">${I('plus', 16)} Add from job matches</a>`, `
      <div class="g4 mb16"><div class="card tight kpi"><span class="l">Total tracked</span><span class="v">${tr.length}</span></div><div class="card tight kpi"><span class="l">Applied</span><span class="v">${applied}</span></div><div class="card tight kpi"><span class="l">Response rate</span><span class="v">${Math.round(resp / Math.max(1, applied) * 100)}%</span></div><div class="card tight kpi"><span class="l">Offers</span><span class="v up">${cnt('offer')}</span></div></div>
      <div class="kanban" id="kb">${STAT.map(([k, n, ic, col]) => `<div class="kcol" data-col="${k}"><h4 style="color:${col}"><span class="row gap6">${I(ic, 15)} ${n}</span><span class="badge">${cnt(k)}</span></h4>${tr.filter(t => t.status === k).map(t => { const j = D.jobById(t.jobId); return `<div class="kcard" draggable="true" data-t="${t.id}"><div class="row gap8">${RC.coLogo(j.company, 30)}<div class="grow"><div class="t">${j.title}</div><div class="c">${j.company}</div></div></div><div class="row between mt8 tiny muted"><span>${j.city}</span><span class="badge ${RC.scoreColor(j.match)}">${j.match}%</span></div>${t.followUps.some(f => !f.done) && ['applied', 'screening'].includes(t.status) ? `<div class="tiny mt8" style="color:var(--amber);font-weight:650">${I('bell', 12)} Follow-up day ${t.followUps.find(f => !f.done).day}</div>` : ''}</div>`; }).join('')}</div>`).join('')}</div>
      <div class="card mt16"><div class="card-h"><h3>${I('bell', 18)} Follow-up schedule</h3><span class="muted small">Auto-reminders on day 3, 7 and 14 after applying</span></div>
        <table class="table"><thead><tr><th>Job</th><th>Applied</th><th>Next reminder</th><th>Status</th><th></th></tr></thead><tbody>${due.map(x => `<tr><td><div class="row gap8">${RC.coLogo(x.j.company, 30)}<div><b>${x.j.title}</b><div class="muted tiny">${x.j.company}</div></div></div></td><td>${RC.fmtDate(x.t.date)}</td><td>Day ${x.f.day} follow-up</td><td><span class="badge amber">Due</span></td><td class="right"><button class="btn sm" data-fu="${x.t.id}">${I('spark', 14)} Draft email</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No reminders due</td></tr>'}</tbody></table></div>`, a => {
      RC.$$('[data-fu]', a).forEach(b => b.onclick = () => followUpModal(b.dataset.fu));
      let drag = null; RC.$$('.kcard', a).forEach(c => { c.addEventListener('dragstart', () => { drag = c.dataset.t; c.classList.add('drag'); }); c.addEventListener('dragend', () => c.classList.remove('drag')); c.addEventListener('click', () => trackerDrawer(c.dataset.t)); });
      RC.$$('.kcol', a).forEach(col => { col.addEventListener('dragover', e => { e.preventDefault(); col.classList.add('over'); }); col.addEventListener('dragleave', () => col.classList.remove('over')); col.addEventListener('drop', e => { e.preventDefault(); col.classList.remove('over'); const t = S().tracker.find(x => x.id === drag); if (!t) return; t.status = col.dataset.col; if (['applied', 'screening'].includes(t.status) && !t.followUps.length) t.followUps = [{ day: 3, done: false }, { day: 7, done: false }, { day: 14, done: false }]; RC.save(); RC.toast('Moved to <b>' + col.dataset.col + '</b>'); RC.render(); }); });
    });
  });
  const trackerDrawer = tid => {
    const t = S().tracker.find(x => x.id === tid), j = D.jobById(t.jobId);
    RC.drawer(`<div class="row gap14 mb16">${RC.coLogo(j.company, 52)}<div><h2>${j.title}</h2><div class="muted">${j.company} · ${j.city}</div></div></div>
      <div class="field"><label class="f">Status</label><select class="input" id="dSt">${STAT.map(s => `<option value="${s[0]}" ${t.status === s[0] ? 'selected' : ''}>${s[1]}</option>`).join('')}</select></div>
      <h4 class="mb8">Timeline</h4><div class="timeline"><div class="ev done"><b>Added to board</b><div class="muted small">${RC.fmtDate(t.date)}</div></div>${t.status !== 'saved' ? `<div class="ev done"><b>Applied via ${j.srcLabel}</b><div class="muted small">${RC.fmtDate(t.date)}</div></div>` : ''}${t.followUps.map(f => `<div class="ev ${f.done ? 'done' : ''}"><b>Day ${f.day} follow-up</b><div class="muted small">${f.done ? 'Sent' : 'Scheduled'}</div></div>`).join('')}</div>
      <div class="field mt16"><label class="f">Notes</label><textarea class="input" placeholder="Recruiter name, interview date, salary discussed…"></textarea></div>
      <div class="row gap8"><button class="btn primary grow" id="dOpen">Open job ${I('ext', 14)}</button><button class="btn" id="dRes">Resume</button><button class="btn" id="dPrep">${I('mic', 14)} Prepare</button></div>`, d => {
      $('#dSt', d).onchange = e => { t.status = e.target.value; RC.save(); RC.closeDrawer(); RC.toast('Status updated'); RC.render(); }; $('#dOpen', d).onclick = () => RC.applyNow(j.id); $('#dRes', d).onclick = () => { RC.closeDrawer(); RC.go('/s/resume/build/' + j.id); }; $('#dPrep', d).onclick = () => { RC.closeDrawer(); RC.go('/s/interview'); };
    });
  };

  /* =============================================================== CREDITS & PLANS */
  const needCredits = n => RC.modal({ title: 'Not enough credits', body: `<div class="callout warn">${I('alert', 18)}<div>This feature needs <b>${n} credits</b> but your balance is <b>${RC.balance()}</b>. We don’t start work we can’t finish — nothing was charged.</div></div>`, footer: `<button class="btn" data-close>Close</button><button class="btn primary" id="nc">Request credits</button>`, mount: m => $('#nc', m).onclick = () => { RC.closeModal(); creditRequestModal(); } });
  RC.needCredits = needCredits;
  const creditRequestModal = () => RC.modal({
    title: 'Request more credits', sub: 'Radical admin reviews every request', body: `<div class="field"><label class="f">How many credits?</label><div class="row gap8 wrap" id="crOpt">${[100, 250, 500, 1000].map((n, i) => `<span class="chip ${i === 2 ? 'on' : ''}" data-n="${n}">${n}</span>`).join('')}</div><div class="hint" id="crHint">≈ 1 full Job-Ready Kit (resume + cover letters + interview practice)</div></div>
    <div class="field"><label class="f">Why do you need them?</label><textarea class="input" id="crWhy">I have shortlisted 6 companies and want tailored resumes and cover letters for each, plus mock interview practice before my Persistent Systems interview.</textarea></div>`,
    footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="crSend">Send request</button>`, mount: m => {
      let n = 500; RC.$$('#crOpt .chip', m).forEach(c => c.onclick = () => { RC.$$('#crOpt .chip', m).forEach(x => x.classList.remove('on')); c.classList.add('on'); n = +c.dataset.n; $('#crHint', m).textContent = n >= 500 ? '≈ ' + Math.floor(n / 340) + ' full Job-Ready Kit(s)' : '≈ ' + Math.floor(n / 20) + ' tailored resumes or ' + Math.floor(n / 90) + ' mock interview(s)'; });
      $('#crSend', m).onclick = () => { S().requests.unshift({ id: RC.uid(), student: 'Aarav Sharma', av: 'aarav', ask: n, reason: $('#crWhy', m).value, status: 'pending', date: new Date(RC.today).toISOString(), type: 'credits', mine: true }); S().notifications.unshift({ id: RC.uid(), text: '<b>Aarav Sharma</b> requested ' + n + ' credits.', kind: 'warn', t: 'Just now', read: false, role: 'admin' }); RC.save(); RC.closeModal(); RC.toast('Request sent. Radical admin usually replies within a day.'); if (location.hash.includes('credits')) RC.render(); };
    }
  });
  RC.route('/s/credits', 'student', () => {
    const w = S().wallet, mine = S().requests.filter(r => r.student === 'Aarav Sharma' || r.mine);
    const costs = [['Next 5 job matches (first 5 free)', 5], ['Wishlist master resume', 15], ['Tailored ATS resume', 20], ['Cover letter', 5], ['ATS check', 5], ['Follow-up draft', 5]];
    return view('credits', 'Credits & Plans', 'Every feature shows its price before it starts — nothing is ever half-finished', `<button class="btn primary" id="reqCr">${I('plus', 16)} Request credits</button>`, `
      <div class="g3"><div class="card" style="background:linear-gradient(140deg,#0B0B0F,#1c1416 70%,#0d2a23);color:#fff;border:0"><div class="small" style="color:#b9bbc7">Available credits</div><div style="font:700 44px var(--f-head)">${RC.num(RC.balance())}</div><div class="row gap8 mt8"><span class="badge lime">${w.free} free</span><span class="badge green">${w.paid} paid</span></div><div class="tiny mt12" style="color:#b9bbc7">Free credits are used first. Free credits expire 90 days after grant.</div></div>
      <div class="card"><h4 class="mb8">What your credits can do</h4>${[['Tailored resumes', Math.floor(RC.balance() / 20)], ['Cover letters', Math.floor(RC.balance() / 5)], ['Mock interviews (Premium)', Math.floor(RC.balance() / 90)]].map(x => `<div class="row between mb8"><span>${x[0]}</span><b class="mono">${x[1]}</b></div>`).join('')}<div class="callout good tiny mt8" style="font-size:11.5px">${I('check', 14)}<div>Any grant is sized so you can finish at least one complete job-search kit.</div></div></div>
      <div class="card"><h4 class="mb8">Price list</h4>${costs.map(c => `<div class="row between small mb8"><span>${c[0]}</span><span class="badge red">${c[1]} credits</span></div>`).join('')}</div></div>
      <div class="g-2-1 mt16"><div class="card pad0"><div class="card-h" style="padding:16px 18px 0"><h3>Ledger</h3><span class="muted small">Every credit movement is recorded</span></div><table class="table"><thead><tr><th>Date</th><th>Description</th><th class="right">Credits</th><th class="right">Balance</th></tr></thead><tbody>${S().ledger.slice(0, 10).map(l => `<tr><td>${RC.fmtDate(l.date)}</td><td>${l.desc}</td><td class="right mono ${l.credits > 0 ? 'up' : ''}"><b>${l.credits > 0 ? '+' : ''}${l.credits}</b></td><td class="right mono">${l.balance}</td></tr>`).join('')}</tbody></table></div>
      <div class="card"><h3 class="mb8">My requests</h3>${mine.map(r => `<div class="mb12"><div class="row between"><b>${r.type === 'plan' ? 'Premium plan' : r.ask + ' credits'}</b><span class="badge ${r.status === 'approved' ? 'green' : r.status === 'declined' ? 'red' : 'amber'}">${r.status === 'approved' ? 'Approved +' + (r.granted || r.ask) : r.status}</span></div><div class="muted small">${RC.fmtDate(r.date)}</div>${r.note ? `<div class="small mt8" style="background:var(--bg);padding:8px 10px;border-radius:8px"><b>Radical:</b> ${r.note}</div>` : ''}</div>`).join('') || '<div class="muted">No requests yet.</div>'}</div></div>`, a => { $('#reqCr', a).onclick = creditRequestModal; });
  });

  /* ---------- Interview plans + offline payment request ---------- */
  const planStage = pr => !pr ? 0 : { requested: 1, quoted: 2, paid: 3, active: 4, declined: 0 }[pr.status] || 0;
  RC.route('/s/interview/plans', 'student', () => {
    const pr = S().planRequests.find(x => x.student === 'Aarav Sharma'); const st = planStage(pr); const prem = S().plan === 'premium';
    const feats = [['Aptitude test & Technical test', 1, 1], ['HR round (text & voice)', 1, 1], ['Group discussion with 3 AI participants', 0, 1], ['Coding round with live AI interviewer', 0, 1], ['Salary negotiation role-play', 0, 1], ['Overall score & 5 skill KPIs', 1, 1], ['Answer-by-answer review with model answers', 0, 1], ['Communication metrics (fillers, pace, structure)', 0, 1], ['Personal 30-day roadmap + progress trend', 0, 1], ['Radical course recommendation', 'basic', 'ranked'], ['Retakes', '1 attempt', 'Multiple attempts'], ['Downloadable PDF report', 0, 1]];
    const cell = v => v === 1 ? `<span class="tick">${I('check')}</span>` : v === 0 ? `<span class="faint">—</span>` : `<span class="small">${v}</span>`;
    const steps = [['Request', 'You tell Radical you want Premium'], ['Quote', 'Radical admin sets the price'], ['Pay', 'Pay Radical directly (UPI / bank / counter)'], ['Confirm', 'Admin confirms your payment'], ['Active', 'Premium unlocked for 30 days']];
    return view('interview', 'Interview plans', 'Choose the depth of practice you need — Radical confirms your plan personally', `<a class="btn" href="#/s/interview">${I('arrowL', 16)} Interview Lab</a>`, `
      <div class="g2" style="max-width:940px">
        <div class="plan-card"><div class="badge">Basic</div><div class="price mt8">Included</div><div class="muted small">Quick practice with a self-hosted Radical AI</div><ul><li>${I('check', 16)}Aptitude & technical tests</li><li>${I('check', 16)}HR round — 8 questions</li><li>${I('check', 16)}Overall score + 5 skill scores</li><li>${I('check', 16)}Top 3 strengths & fixes</li><li>${I('check', 16)}1 Radical course suggestion</li><li class="no">${I('x', 16)}Group discussion, coding & negotiation rounds</li><li class="no">${I('x', 16)}Answer-by-answer review & 30-day roadmap</li></ul>${!prem ? '<button class="btn block" disabled>Your current plan</button>' : ''}</div>
        <div class="plan-card pro"><div class="row between"><span class="badge red">Premium</span><span class="badge lime">Most complete</span></div><div class="price mt8">${pr && pr.quote ? RC.inr(pr.quote) : '₹599'}<span class="muted small" style="font-weight:500;font-family:var(--f-body)"> / 30 days</span></div><div class="muted small">${pr && pr.quote ? 'Your quote from Radical' : 'Indicative — final price confirmed by Radical admin'}</div><ul><li>${I('check', 16)}All 6 interview rounds</li><li>${I('check', 16)}Live group discussion with 3 AI participants</li><li>${I('check', 16)}Coding round with AI interviewer</li><li>${I('check', 16)}Salary negotiation role-play</li><li>${I('check', 16)}Answer-by-answer feedback with model answers</li><li>${I('check', 16)}Communication metrics & KPI dashboard</li><li>${I('check', 16)}Personal 30-day roadmap & ranked Radical courses</li></ul>
          ${prem ? `<div class="callout good">${I('check', 18)}<div><b>Premium is active</b> until ${RC.fmtDate(S().premiumUntil)}</div></div>` : !pr ? '<button class="btn primary lg block" id="reqPlan">Request Premium</button>' : ''}</div></div>
      ${pr && !prem ? `<div class="card mt16" style="max-width:940px"><h3 class="mb16">Your Premium request</h3><div class="stepper mb16">${steps.map((s, i) => `<div class="s ${i < st ? 'done' : i === st ? 'on' : ''}"><b>${i < st ? I('check', 14) : i + 1}</b>${s[0]}</div>${i < 4 ? '<div class="ln"></div>' : ''}`).join('')}</div>
        ${pr.status === 'requested' ? `<div class="callout info">${I('clock', 18)}<div><b>Waiting for Radical’s quote.</b> An admin will review your request and reply with the price — usually within a day.</div></div>` : ''}
        ${pr.status === 'quoted' ? `<div class="g2"><div><div class="callout good mb8">${I('check', 18)}<div><b>Quote received: ${RC.inr(pr.quote)}</b> for 30 days of Premium.</div></div><p class="small muted">Pay Radical directly by UPI, bank transfer or at the Aundh / Kharadi office. Use the reference <b class="mono">${pr.code}</b> so we can match your payment.</p><div class="field mt12"><label class="f">Payment reference / UTR</label><input class="input" id="payRef" placeholder="e.g. UPI transaction ID"></div><div class="field"><label class="f">Screenshot (optional)</label><div class="dropzone" style="padding:12px">${I('upload', 20)} <span class="small">payment-screenshot.png attached</span></div></div><button class="btn primary block" id="paidBtn">I have paid</button></div>
          <div class="card flat center" style="background:var(--bg)">${qrSvg(pr.code)}<div class="bold mt8">Pay ${RC.inr(pr.quote)} to Radical Technologies</div><div class="mono small">UPI: radicaltech@demo · Ref ${pr.code}</div></div></div>` : ''}
        ${pr.status === 'paid' ? `<div class="callout info">${I('clock', 18)}<div><b>Payment reference submitted (${pr.ref}).</b> Radical admin is confirming your payment. Premium activates as soon as it is approved.</div></div>` : ''}</div>` : ''}
      <div class="card mt16 pad0" style="max-width:940px"><table class="table"><thead><tr><th>What you get</th><th class="center" style="width:130px">Basic</th><th class="center" style="width:150px">Premium</th></tr></thead><tbody>${feats.map(f => `<tr><td>${f[0]}</td><td class="center">${cell(f[1])}</td><td class="center">${cell(f[2])}</td></tr>`).join('')}</tbody></table></div>`, a => {
      const b = $('#reqPlan', a); if (b) b.onclick = () => RC.modal({ title: 'Request Premium', body: `<p class="muted">Radical will confirm the price and how to pay. You pay Radical directly — no online payment on this platform.</p><div class="field"><label class="f">Note to Radical (optional)</label><textarea class="input">I’m preparing for Persistent Systems and want to practise group discussion and the coding round.</textarea></div>`, footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="go">Send request</button>`, mount: m => $('#go', m).onclick = () => { S().planRequests.unshift({ id: RC.uid(), student: 'Aarav Sharma', av: 'aarav', plan: 'premium', status: 'requested', quote: null, ref: '', date: new Date(RC.today).toISOString(), note: '' }); S().notifications.unshift({ id: RC.uid(), text: '<b>Aarav Sharma</b> requested the Premium interview plan.', kind: 'warn', t: 'Just now', read: false, role: 'admin' }); RC.save(); RC.closeModal(); RC.toast('Request sent to Radical admin'); RC.render(); } });
      const pb = $('#paidBtn', a); if (pb) pb.onclick = () => { const v = $('#payRef', a).value || 'UPI 5290 1184 66'; pr.status = 'paid'; pr.ref = v; S().notifications.unshift({ id: RC.uid(), text: '<b>Aarav Sharma</b> submitted payment for Premium (ref ' + v + ').', kind: 'warn', t: 'Just now', read: false, role: 'admin' }); RC.save(); RC.toast('Payment reference sent to Radical'); RC.render(); };
    });
  });
  const qrSvg = seed => { let s = RC.hash(seed || 'x'), cells = ''; const N = 21; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const finder = (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13); const on = finder ? ((x % 14 < 7 && (x === 0 || x === 6 || y === 0 || y === 6 || (x > 1 && x < 5 && y > 1 && y < 5))) || (x > 13 && (x === 14 || x === 20 || y === 0 || y === 6 || (x > 15 && x < 19 && y > 1 && y < 5))) || (y > 13 && (x === 0 || x === 6 || y === 14 || y === 20 || (x > 1 && x < 5 && y > 15 && y < 19)))) : (s >> 16) % 2; if (on) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`; } return `<svg class="qr" viewBox="-1 -1 ${N + 2} ${N + 2}" fill="#0B0B0F">${cells}</svg>`; };
  RC.qrSvg = qrSvg;

  /* =============================================================== COURSES */
  RC.route('/s/learn', 'student', () => {
    const rec = [['c2', 'Kubernetes gap in 4 of your top-5 matches', 'You scored 0% on the Kubernetes question in the technical test.'], ['c6', 'Communication is your lowest skill (58/100)', 'Group discussion & HR answers showed filler words and unstructured replies.'], ['c5', 'Coding efficiency needs practice', 'Your Two Sum solution passed but ran in O(n²).']];
    return view('learn', 'Radical Courses', 'Courses recommended from your real gaps — not generic ads', '', `
      <div class="card mb16" style="background:linear-gradient(120deg,#FFF5F5,#F1FAF6);border-color:var(--red-m)"><div class="card-h"><h3>${I('target', 18)} Recommended for you</h3><span class="badge red">Based on your job matches & practice results</span></div>
        <div class="g3">${rec.map(r => { const c = D.courseById(r[0]); return `<div class="course" style="flex-direction:column;background:#fff"><div class="row gap8"><div class="cv" style="background:${c.color};width:44px;height:44px">${I('book', 20)}</div><div><b style="font-size:13.5px">${c.title}</b><div class="muted tiny">${c.hrs} hrs · ${c.mode}</div></div></div><div class="callout warn tiny" style="font-size:12px">${I('spark', 14)}<div><b>${r[1]}</b><br>${r[2]}</div></div><div class="row gap8"><button class="btn sm primary grow" data-enq="${c.id}">Talk to a counsellor</button><span class="badge">Next batch ${c.next}</span></div></div>`; }).join('')}</div></div>
      <div class="row gap8 mb16 wrap" id="cats">${['All', 'Cloud', 'DevOps', 'Programming', 'Career', 'Systems', 'Security', 'Data'].map((c, i) => `<span class="chip ${i === 0 ? 'on' : ''}" data-c="${c}">${c}</span>`).join('')}</div>
      <div class="g3" id="cGrid"></div>`, a => {
      const draw = cat => { $('#cGrid', a).innerHTML = D.courses.filter(c => cat === 'All' || c.cat === cat).map(c => `<div class="card"><div class="row gap8"><div class="cv" style="background:${c.color};width:48px;height:48px;border-radius:12px;display:grid;place-items:center;color:#fff">${I('book', 22)}</div><div class="grow"><span class="badge">${c.cat}</span></div><span class="badge ${c.level === 'Beginner' ? 'green' : c.level === 'Advanced' ? 'red' : 'amber'}">${c.level}</span></div><h4 class="mt12" style="font-size:14.5px">${c.title}</h4><div class="muted small mt8">${c.hrs} hours · ${c.mode}</div><div class="row wrap gap6 mt8">${c.skills.map(s => `<span class="badge steel">${s}</span>`).join('')}</div><div class="divider"></div><div class="row between"><span class="small">Next batch <b>${c.next}</b></span><button class="btn sm" data-enq="${c.id}">Enquire</button></div></div>`).join(''); bindEnq(a); };
      RC.$$('#cats .chip', a).forEach(c => c.onclick = () => { RC.$$('#cats .chip', a).forEach(x => x.classList.remove('on')); c.classList.add('on'); draw(c.dataset.c); }); draw('All'); bindEnq(a);
    });
  });
  const bindEnq = root => RC.$$('[data-enq]', root).forEach(b => b.onclick = () => {
    const c = D.courseById(b.dataset.enq);
    RC.modal({ title: 'Talk to a Radical counsellor', sub: c.title, body: `<div class="callout info mb8">${I('info', 16)}<div>Your profile and interview results will be shared with the placement team <b>only because you asked</b>.</div></div><div class="g2"><div class="field"><label class="f">Preferred time</label><select class="input"><option>Today 5–7 pm</option><option>Tomorrow 11 am–1 pm</option></select></div><div class="field"><label class="f">Mobile</label><input class="input" value="+91 98765 43210"></div></div>`, footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="lead">Request callback</button>`, mount: m => $('#lead', m).onclick = () => { S().leadsNew = S().leadsNew || []; S().leadsNew.unshift({ n: 'Aarav Sharma', c: c.title, why: 'Skill gap from job matches', t: 'Just now', st: 'New' }); S().notifications.unshift({ id: RC.uid(), text: 'New course enquiry: <b>Aarav Sharma</b> → ' + c.title, kind: 'info', t: 'Just now', read: false, role: 'admin' }); RC.save(); RC.closeModal(); RC.toast('Callback requested. A counsellor will call you.'); } });
  });

  /* =============================================================== PROFILE & PRIVACY */
  RC.route('/s/profile', 'student', () => {
    const q = new URLSearchParams((location.hash.split('?')[1]) || ''); const tab = q.get('t') || 'profile';
    const tabs = [['profile', 'Profile'], ['wishlist', 'Job wishlist'], ['privacy', 'Privacy & data'], ['notif', 'Notifications']];
    const body = {
      profile: `<div class="g2"><div class="field"><label class="f">Full name</label><input class="input" value="Aarav Sharma"></div><div class="field"><label class="f">Email</label><input class="input" value="${D.student.email}"></div><div class="field"><label class="f">Mobile</label><input class="input" value="${D.student.phone}"></div><div class="field"><label class="f">City</label><input class="input" value="Pune"></div><div class="field"><label class="f">Radical batch</label><input class="input" value="${D.student.batch}" disabled><div class="hint">Verified by Radical admin ✓</div></div><div class="field"><label class="f">LinkedIn</label><input class="input" value="linkedin.com/in/aarav-sharma-demo"></div></div><button class="btn primary" id="saveP">Save changes</button>`,
      wishlist: `<div class="field"><label class="f">Target roles</label><div class="row wrap gap8">${D.wishlist.roles.map(r => `<span class="chip on">${r} ${I('x', 12)}</span>`).join('')}<span class="chip">${I('plus', 14)} Add role</span></div></div><div class="field"><label class="f">Locations</label><div class="row wrap gap8">${D.wishlist.cities.map(r => `<span class="chip on">${r}</span>`).join('')}</div></div><div class="g2"><div class="field"><label class="f">Salary (LPA)</label><input class="input" value="6 – 9"></div><div class="field"><label class="f">Notice period</label><input class="input" value="Immediate"></div></div><button class="btn primary" id="saveP">Save &amp; re-match jobs</button>`,
      privacy: `<div class="col gap14"><div class="row between card flat"><div><b>Process my resume for job matching</b><div class="muted small">Required to use the platform.</div></div><div class="switch on"></div></div><div class="row between card flat"><div><b>Keep my interview practice history</b><div class="muted small">Turn off to stop saving transcripts and scores.</div></div><div class="switch on"></div></div><div class="row between card flat"><div><b>Share my profile with Radical’s placement team</b><div class="muted small">Optional — helps counsellors support you.</div></div><div class="switch ${S().consent.marketing ? 'on' : ''}" id="swShare"></div></div>
        <div class="callout info">${I('shield', 18)}<div>Names, phone and address are stripped before any text is sent to a paid AI provider. Free AI tiers that train on user data are never used for your documents.</div></div>
        <div class="g2"><div class="card flat"><h4>Download my data</h4><p class="muted small">Get a copy of your profile, resumes, applications and interview results.</p><button class="btn" id="dlData">${I('download', 16)} Download (JSON)</button></div><div class="card flat" style="border-color:var(--red-m)"><h4 style="color:var(--red)">Delete my account</h4><p class="muted small">Permanently removes your profile, resumes and history within 30 days.</p><button class="btn" id="delAcc" style="color:var(--red);border-color:var(--red-m)">${I('trash', 16)} Delete account</button></div></div></div>`,
      notif: `<div class="col gap14">${['New job matches (daily digest)', 'Follow-up reminders', 'Credit approvals from Radical', 'Interview results ready', 'Radical course offers'].map((n, i) => `<div class="row between card flat"><b>${n}</b><div class="switch ${i < 4 ? 'on' : ''}"></div></div>`).join('')}</div>`
    };
    return view('profile', 'Profile & Privacy', 'Your details, your job wishlist and full control of your data', '', `<div class="card"><div class="tabs">${tabs.map(t => `<a class="${t[0] === tab ? 'on' : ''}" href="#/s/profile?t=${t[0]}">${t[1]}</a>`).join('')}</div>${body[tab]}</div>`, a => {
      RC.$$('.switch', a).forEach(s => s.onclick = () => s.classList.toggle('on')); const sp = $('#saveP', a); if (sp) sp.onclick = () => RC.toast('Saved');
      const dl = $('#dlData', a); if (dl) dl.onclick = () => { const blob = new Blob([JSON.stringify({ profile: D.student, wishlist: D.wishlist, resumes: S().resumes, applications: S().tracker, results: S().results, ledger: S().ledger }, null, 2)], { type: 'application/json' }); const u = URL.createObjectURL(blob), l = document.createElement('a'); l.href = u; l.download = 'my-radical-careerai-data.json'; l.click(); URL.revokeObjectURL(u); RC.toast('Your data file was downloaded'); };
      const da = $('#delAcc', a); if (da) da.onclick = () => RC.confirm('Delete your account?', 'This removes your profile, resumes, applications and interview history. This cannot be undone. (Demo: nothing is actually deleted.)', 'Delete', () => RC.toast('Deletion scheduled (demo)', 'info'));
    });
  });
})();
