/* Login, registration, OTP, onboarding */
(function () {
  const RC = window.RC, D = RC.DATA, I = RC.ico, $ = RC.$;

  const hero = (h1, lead) => `<div class="auth-hero"><div class="logo-card"><img src="assets/img/logo@2x.png" alt="Radical Technologies"></div>
    <h1>${h1}</h1><p class="lead">${lead}</p>
    <div class="hero-feats"><div>${I('briefcase', 18)}Jobs matched to your wishlist</div><div>${I('file', 18)}ATS-ready resume for every job</div><div>${I('mic', 18)}AI mock interviews — 6 rounds</div><div>${I('book', 18)}Radical courses to close skill gaps</div></div>
    <div class="row gap8 mt16 small" style="color:#a9abb8">${I('shield', 14)} Your data stays private · DPDP-ready · 1 lakh+ learners trained by Radical</div></div>`;

  const typeInto = async (el, text, ms) => { el.value = ''; for (const ch of text) { el.value += ch; await RC.sleep(ms || 35); } };

  /* ---------- LOGIN ---------- */
  RC.route('/login', null, () => ({
    html: `<div class="auth">${hero('Land the job you <em>want</em>, faster.', 'Radical CareerAI finds matching jobs, builds a resume for every application, and lets you practise real interview rounds with AI — all in one place.')}
    <div class="auth-form"><div class="auth-card fadein">
      <h2>Welcome back</h2><p class="sub">Sign in to continue your job search.</p>
      <div class="seg"><a id="tabS" class="on">${I('user', 16)} Student / Job-seeker</a><a id="tabA">${I('shield', 16)} Radical Admin</a></div>
      <div class="field"><label class="f">Email</label><input class="input" id="lEmail" value="${D.student.email}"></div>
      <div class="field"><label class="f">Password</label><input class="input" id="lPwd" type="password" value="${D.student.pwd}"></div>
      <div class="row between mb16"><label class="row gap8 small"><input type="checkbox" checked> Keep me signed in</label><a class="small">Forgot password?</a></div>
      <button class="btn primary lg block" id="lGo">Sign in</button>
      <div class="row gap8 mt16"><div class="divider grow" style="margin:0"></div><span class="muted small">or</span><div class="divider grow" style="margin:0"></div></div>
      <button class="btn block mt16" id="lGoogle"><svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.1 1.4-4.9 2.3-8.2 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg> Continue with Google</button>
      <p class="center mt24 muted">New here? <a href="#/register" class="bold">Create a free account</a> — open to everyone, not only Radical students.</p>
      <div class="callout info mt16" style="font-size:12px">${I('info', 16)}<div><b>Demo tip:</b> credentials are pre-filled. Just press <b>Sign in</b>. Use the <b>Admin</b> tab (or the black bar at the top) to see the Radical admin console.</div></div>
    </div></div></div>`,
    mount() {
      let role = 'student';
      const set = r => { role = r; $('#tabS').classList.toggle('on', r === 'student'); $('#tabA').classList.toggle('on', r === 'admin'); $('#lEmail').value = r === 'admin' ? D.admin.email : D.student.email; $('#lPwd').value = r === 'admin' ? D.admin.pwd : D.student.pwd; };
      $('#tabS').onclick = () => set('student'); $('#tabA').onclick = () => set('admin');
      const go = async () => {
        const b = $('#lGo'); b.disabled = true; b.innerHTML = '<span class="spin" style="border-top-color:#fff;border-color:rgba(255,255,255,.3)"></span> Signing in…'; await RC.sleep(900);
        RC.S.session = { role }; RC.save(); RC.toast(role === 'admin' ? 'Welcome, <b>Sneha</b>. 5 items need your attention.' : 'Welcome back, <b>Aarav</b> 👋'); RC.go(role === 'admin' ? '/a/dashboard' : '/s/dashboard');
      };
      $('#lGo').onclick = go; $('#lGoogle').onclick = () => { $('#lGo').click(); };
      ['lEmail', 'lPwd'].forEach(id => $('#' + id).addEventListener('keydown', e => { if (e.key === 'Enter') go(); }));
    }
  }));

  /* ---------- REGISTER ---------- */
  RC.route('/register', null, () => ({
    html: `<div class="auth">${hero('One account. <em>Every step</em> of your job search.', 'Create your free account and get 400 starter credits — enough for a complete resume-and-job-hunt kit. No card needed.')}
    <div class="auth-form"><div class="auth-card fadein">
      <div class="stepper"><div class="s on"><b>1</b>Account</div><div class="ln"></div><div class="s"><b>2</b>Verify</div><div class="ln"></div><div class="s"><b>3</b>Your profile</div></div>
      <h2>Create your account</h2><p class="sub">Free for everyone. Radical students get extra monthly credits.</p>
      <div class="g2"><div class="field"><label class="f">Full name</label><input class="input" id="rName"></div><div class="field"><label class="f">Mobile</label><input class="input" id="rPhone"></div></div>
      <div class="field"><label class="f">Email</label><input class="input" id="rEmail"></div>
      <div class="g2"><div class="field"><label class="f">City</label><select class="input" id="rCity"><option>Pune</option><option>Bengaluru</option><option>Kochi</option><option>Mumbai</option><option>Hyderabad</option></select></div><div class="field"><label class="f">Password</label><input class="input" type="password" id="rPwd"></div></div>
      <div class="card flat tight" style="background:var(--bg)"><div class="row between"><div><b>I am a Radical Technologies student</b><div class="muted small">Unlock monthly credits and batch-specific practice</div></div><div class="switch" id="rIsStu"></div></div>
        <div id="rBatchBox" style="display:none;margin-top:12px"><label class="f">Batch / course</label><select class="input" id="rBatch"><option>AWS DevOps · Sept 2026</option><option>Azure Admin · Aug 2026</option><option>Python & Data · Sept 2026</option><option>Cyber Security · Aug 2026</option></select><div class="hint">Radical staff will verify your enrolment.</div></div></div>
      <label class="row gap8 mt16 small" style="align-items:flex-start"><input type="checkbox" id="rTerms" checked style="margin-top:3px"><span>I agree to the <a>Terms</a> and the <a>Privacy Notice</a> and consent to my resume data being processed to provide this service.</span></label>
      <div class="card flat tight mt12 row between" style="background:#F8FBF8;border-color:var(--green-m)"><div class="row gap8"><span class="tick">${I('check')}</span><b>Verified you are human</b></div><span class="muted tiny">Cloudflare Turnstile</span></div>
      <button class="btn primary lg block mt16" id="rGo">Continue ${I('arrowR', 16)}</button>
      <p class="center mt16 muted">Already have an account? <a href="#/login" class="bold">Sign in</a></p>
      <div class="center mt8"><a class="small" id="rFill">${I('refresh', 12)} Re-fill demo details</a></div>
    </div></div></div>`,
    mount() {
      const fill = async () => { await typeInto($('#rName'), 'Aarav Sharma', 25); await typeInto($('#rPhone'), '+91 98765 43210', 20); await typeInto($('#rEmail'), D.student.email, 15); $('#rPwd').value = D.student.pwd; };
      fill(); const sw = $('#rIsStu'); const box = $('#rBatchBox');
      sw.onclick = () => { sw.classList.toggle('on'); box.style.display = sw.classList.contains('on') ? 'block' : 'none'; };
      setTimeout(() => sw.click(), 1900);
      $('#rFill').onclick = fill;
      $('#rGo').onclick = async () => { const b = $('#rGo'); b.disabled = true; b.innerHTML = '<span class="spin" style="border-top-color:#fff;border-color:rgba(255,255,255,.3)"></span> Creating account…'; await RC.sleep(900); RC.toast('Account created. We sent a 6-digit code to <b>' + $('#rEmail').value + '</b>', 'info'); RC.go('/verify'); };
    }
  }));

  /* ---------- OTP ---------- */
  RC.route('/verify', null, () => ({
    html: `<div class="auth">${hero('Almost there — verify your email.', 'Verification keeps the platform free of fake accounts, so credits go to real learners.')}
    <div class="auth-form"><div class="auth-card fadein center">
      <div class="stepper"><div class="s done"><b>${I('check', 14)}</b>Account</div><div class="ln"></div><div class="s on"><b>2</b>Verify</div><div class="ln"></div><div class="s"><b>3</b>Your profile</div></div>
      <div style="width:64px;height:64px;border-radius:50%;background:var(--red-l);color:var(--red);display:grid;place-items:center;margin:0 auto 14px">${I('mail', 28)}</div>
      <h2>Enter the 6-digit code</h2><p class="sub">Sent to <b>${D.student.email}</b></p>
      <div class="otp" id="otp">${[0, 1, 2, 3, 4, 5].map(() => '<input maxlength="1" inputmode="numeric">').join('')}</div>
      <button class="btn primary lg block" id="vGo" disabled>Verify &amp; continue</button>
      <p class="muted small mt16">Didn’t get it? <a>Resend code</a> in 0:42</p>
    </div></div></div>`,
    async mount() {
      const boxes = RC.$$('#otp input'); const code = '482915';
      await RC.sleep(700); for (let i = 0; i < 6; i++) { boxes[i].value = code[i]; boxes[i].focus(); await RC.sleep(260); }
      $('#vGo').disabled = false;
      $('#vGo').onclick = async () => {
        const b = $('#vGo'); b.disabled = true; b.innerHTML = '<span class="spin" style="border-top-color:#fff;border-color:rgba(255,255,255,.3)"></span> Verifying…'; await RC.sleep(800);
        RC.S.session = { role: 'student' }; RC.save(); RC.toast('Email verified. <b>400 Free Starter credits</b> added to your wallet.'); RC.go('/onboarding');
      };
    }
  }));

  /* ---------- ONBOARDING ---------- */
  RC.route('/onboarding', 'student', () => {
    const pick = (list, on) => list.map(x => `<span class="chip ${on.includes(x) ? 'on' : ''}" data-v="${x}">${x}</span>`).join('');
    return {
      html: `<div class="auth" style="grid-template-columns:1fr"><div class="auth-form" style="align-items:flex-start;padding-top:36px"><div class="auth-card fadein" style="max-width:780px">
      <div class="row between mb16"><img src="assets/img/logo@2x.png" style="height:38px"><span class="muted small">Step <b id="obStep">1</b> of 3</span></div>
      <div class="stepper" id="obStepper"><div class="s on"><b>1</b>Upload resume</div><div class="ln"></div><div class="s"><b>2</b>Job wishlist</div><div class="ln"></div><div class="s"><b>3</b>Review &amp; consent</div></div>
      <div id="obBody"></div></div></div></div>`,
      mount() {
        const body = $('#obBody'); const stp = n => { $('#obStep').textContent = n; RC.$$('#obStepper .s').forEach((s, i) => { s.classList.toggle('on', i === n - 1); s.classList.toggle('done', i < n - 1); s.querySelector('b').innerHTML = i < n - 1 ? I('check', 14) : i + 1; }); };
        const s1 = () => { stp(1); body.innerHTML = `<h2>Upload your resume</h2><p class="sub muted mb16">We’ll read it to build your skill profile. No resume yet? Skip — we’ll build one for you later.</p>
          <div class="dropzone" id="dz">${I('upload', 34)}<h3 class="mt8">Drop your resume here or click to browse</h3><p class="muted small">PDF or DOCX · up to 5 MB</p><button class="btn dark mt8" id="useSample">${I('file', 16)} Use sample resume (Aarav_Sharma_Resume.pdf)</button></div>
          <div id="parse" class="mt16"></div><div class="row between mt24"><a id="skip1" class="muted">Skip for now</a><button class="btn primary" id="n1" disabled>Continue ${I('arrowR', 16)}</button></div>`;
          const run = async () => {
            $('#dz').style.display = 'none'; const p = $('#parse');
            const lines = ['Reading Aarav_Sharma_Resume.pdf (2 pages)', 'Scanning for personal details & contact', 'Extracting skills — found <b>11 skills</b> (AWS, Linux, Docker, Jenkins, Git, Python…)', 'Found <b>1 internship</b> — DevOps Intern, Vertex Softworks', 'Found <b>2 projects</b> and <b>2 certifications</b>', 'Building your skill profile (embeddings on Radical’s own servers)'];
            p.innerHTML = `<div class="card flat"><div class="row gap8 mb8"><span class="co-logo" style="width:36px;height:36px;background:var(--red)">${I('file', 18)}</span><div><b>Aarav_Sharma_Resume.pdf</b><div class="muted tiny">184 KB · uploaded just now</div></div></div><div id="pl"></div></div>`;
            for (const l of lines) { const row = document.createElement('div'); row.className = 'parse-line'; row.innerHTML = `<span class="spin"></span><span>${l}</span>`; $('#pl').appendChild(row); await RC.sleep(650); row.firstChild.outerHTML = `<span class="tick">${I('check')}</span>`; }
            p.insertAdjacentHTML('beforeend', `<div class="callout good mt12">${I('check', 18)}<div><b>Profile ready.</b> We found skills in cloud, DevOps and Linux. You can edit everything on the next screens.</div></div>`); $('#n1').disabled = false;
          };
          $('#useSample').onclick = e => { e.stopPropagation(); run(); }; $('#dz').onclick = run; $('#n1').onclick = s2; $('#skip1').onclick = s2;
        };
        const s2 = () => { stp(2); const W = D.wishlist; body.innerHTML = `<h2>What jobs are you looking for?</h2><p class="sub muted mb16">This is your <b>job wishlist</b>. Matching and resumes are built from it — change it any time.</p>
          <div class="field"><label class="f">Target roles</label><div class="row wrap gap8" data-multi="roles">${pick(['Cloud Engineer', 'DevOps Engineer', 'AWS Support Engineer', 'Site Reliability Engineer', 'Python Developer', 'Linux Administrator', 'Data Engineer', 'Security Analyst'], W.roles)}</div></div>
          <div class="field"><label class="f">Preferred locations</label><div class="row wrap gap8" data-multi="cities">${pick(['Pune', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Kochi', 'Remote'], W.cities)}</div></div>
          <div class="g2"><div class="field"><label class="f">Expected salary (LPA): <b id="salTxt">₹${W.salary[0]} – ₹${W.salary[1]}</b></label><div class="row gap8"><input type="range" min="3" max="20" value="${W.salary[0]}" id="sal0" class="grow"><input type="range" min="3" max="25" value="${W.salary[1]}" id="sal1" class="grow"></div></div>
          <div class="field"><label class="f">Experience</label><select class="input"><option>Fresher (0–1 yr)</option><option>1–3 yrs</option><option>3–5 yrs</option></select></div></div>
          <div class="field"><label class="f">Work mode</label><div class="row wrap gap8" data-multi="mode">${pick(['Onsite', 'Hybrid', 'Remote'], W.mode)}</div></div>
          <div class="field"><label class="f">Top skills (from your resume — edit if needed)</label><div class="row wrap gap8">${['AWS', 'Linux', 'Docker', 'Jenkins', 'Git', 'Python', 'Bash', 'CI/CD', 'SQL', 'Terraform', 'Kubernetes'].map(x => `<span class="badge green">${x}</span>`).join('')}<span class="chip">${I('plus', 14)} Add skill</span></div></div>
          <div class="row between mt24"><a id="b2" class="muted">${I('arrowL', 14)} Back</a><button class="btn primary" id="n2">Continue ${I('arrowR', 16)}</button></div>`;
          RC.$$('[data-multi] .chip').forEach(c => c.onclick = () => c.classList.toggle('on'));
          const up = () => { let a = +$('#sal0').value, b = +$('#sal1').value; if (a > b) { b = a; $('#sal1').value = b; } $('#salTxt').textContent = '₹' + a + ' – ₹' + b; }; $('#sal0').oninput = up; $('#sal1').oninput = up;
          $('#b2').onclick = s1; $('#n2').onclick = s3;
        };
        const s3 = () => { stp(3); body.innerHTML = `<h2>Review &amp; consent</h2><p class="sub muted mb16">Your data belongs to you. Here is exactly how we use it.</p>
          <div class="card flat" style="background:var(--bg)"><div class="row gap14 wrap"><div>${RC.av('aarav', 56)}</div><div class="grow"><b>Aarav Sharma</b> · Pune<div class="muted small">Looking for: Cloud Engineer, DevOps Engineer, AWS Support Engineer · ₹6–9 LPA · Fresher</div><div class="mt8 row wrap gap8"><span class="badge steel">11 skills</span><span class="badge steel">1 internship</span><span class="badge steel">2 projects</span></div></div></div></div>
          <div class="col gap8 mt16">
            <label class="row gap8" style="align-items:flex-start"><input type="checkbox" checked style="margin-top:3px"><span><b>Process my resume to find jobs and build documents</b><div class="muted small">Required. Personal identifiers are removed before text is sent to any paid AI provider.</div></span></label>
            <label class="row gap8" style="align-items:flex-start"><input type="checkbox" checked style="margin-top:3px"><span><b>Save my interview practice history</b><div class="muted small">So you can see progress. You can delete it any time.</div></span></label>
            <label class="row gap8" style="align-items:flex-start"><input type="checkbox" style="margin-top:3px"><span><b>Share my profile with Radical’s placement team</b><div class="muted small">Optional. Lets counsellors help you and recommend Radical courses.</div></span></label></div>
          <div class="callout info mt16">${I('shield', 18)}<div>You can <b>download</b> or <b>delete</b> all your data from <i>Profile &amp; Privacy</i> whenever you want.</div></div>
          <div class="row between mt24"><a id="b3" class="muted">${I('arrowL', 14)} Back</a><button class="btn primary lg" id="fin">Finish &amp; find my jobs</button></div>`;
          $('#b3').onclick = s2;
          $('#fin').onclick = async () => {
            body.innerHTML = `<div class="stage-loading"><div><div class="ring" style="width:96px;height:96px"><svg width="96" height="96"><circle cx="48" cy="48" r="40" fill="none" stroke="#eee" stroke-width="8"/><circle cx="48" cy="48" r="40" fill="none" stroke="var(--red)" stroke-width="8" stroke-linecap="round" stroke-dasharray="80 172" style="animation:rot 1.1s linear infinite;transform-origin:center"/></svg></div><h2 class="mt16">Finding your first matches…</h2><p class="muted" id="fmsg">Reading 9,600+ live jobs from company sites and job feeds</p></div></div>`;
            const msgs = ['Matching your skills to jobs (vector search)', 'Ranking by location, salary and skills', 'Writing “why it fits” for your top 10']; for (const m of msgs) { await RC.sleep(1000); $('#fmsg').textContent = m; } await RC.sleep(900);
            RC.toast('We found <b>22 jobs</b> — 3 above 90% match', 'good'); RC.go('/s/dashboard');
          };
        };
        s1();
      }
    };
  });
})();
