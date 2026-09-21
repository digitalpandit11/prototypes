/* Core engine: state, router, UI helpers, icons, avatars, charts, voice */
(function () {
  'use strict';
  const RC = window.RC = window.RC || {};
  const D = RC.DATA;

  /* ---------------- helpers ---------------- */
  RC.$ = (s, r) => (r || document).querySelector(s);
  RC.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  RC.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  RC.sleep = ms => new Promise(r => setTimeout(r, ms));
  RC.rnd = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  RC.inr = (n, d) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  RC.num = n => Number(n).toLocaleString('en-IN');
  RC.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  RC.hash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); };
  RC.uid = () => Math.random().toString(36).slice(2, 9);
  RC.today = new Date(2026, 8, 20);
  RC.fmtDate = (d, withTime) => { d = new Date(d); const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]; let s = d.getDate() + ' ' + m + ' ' + d.getFullYear(); if (withTime) { s += ', ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); } return s; };
  RC.daysAgo = n => { const d = new Date(RC.today); d.setDate(d.getDate() - n); return d; };
  RC.ago = n => n === 0 ? 'Today' : n === 1 ? 'Yesterday' : n + ' days ago';

  /* ---------------- icons (Feather-style) ---------------- */
  const IC = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    chevR: '<polyline points="9 18 15 12 9 6"/>', chevD: '<polyline points="6 9 12 15 18 9"/>',
    arrowR: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
    arrowL: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    bars: '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    award: '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    cpu: '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    ext: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    refresh: '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    msg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    list: '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    vol: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    volx: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>',
    pie: '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    term: '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
    clip: '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    spark: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.7 1.8 1.8.7-1.8.7L19 20l-.7-1.8-1.8-.7 1.8-.7z"/>',
    bot: '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M12 8V4"/><circle cx="12" cy="3" r="1"/><circle cx="8.5" cy="14" r="1.2"/><circle cx="15.5" cy="14" r="1.2"/><path d="M9 17.5h6"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="18"/><line x1="15" y1="22" x2="15" y2="18"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>',
    rupee: '<path d="M6 3h12"/><path d="M6 8h12"/><path d="M6 13l8.5 8"/><path d="M6 13h3a4.5 4.5 0 0 0 0-10"/>',
    key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    dot: '<circle cx="12" cy="12" r="4"/>',
    rotate: '<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>',
    hand: '<path d="M18 11V6a2 2 0 0 0-4 0v5"/><path d="M14 10V4a2 2 0 0 0-4 0v6"/><path d="M10 10.5V6a2 2 0 0 0-4 0v8"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/>'
  };
  RC.ico = (n, size, cls) => `<svg class="i ${cls || ''}" viewBox="0 0 24 24"${size ? ` style="width:${size}px;height:${size}px"` : ''}>${IC[n] || IC.dot}</svg>`;
  const I = RC.ico;

  /* ---------------- avatars (flat illustrated SVG) ---------------- */
  RC.avatar = (key, o) => {
    const p = (D.people[key]) || D.people.aarav;
    const skin = p.skin, sh = p.skinShade || '#00000018';
    let hairBack = '', hairFront = '', extra = '';
    const hc = p.hair;
    if (p.style === 'long') {
      hairBack = `<path d="M27 50 C22 20 40 10 50 10 C62 10 78 20 73 50 L76 82 C66 84 61 76 60 70 L40 70 C39 76 34 84 24 82 Z" fill="${hc}"/>`;
      hairFront = `<path d="M30 42 C32 26 43 22 50 22 C58 22 68 27 70 42 C62 32 41 30 30 42 Z" fill="${hc}"/>`;
    } else if (p.style === 'bun') {
      hairBack = `<circle cx="50" cy="12" r="9" fill="${hc}"/>`;
      hairFront = `<path d="M30 46 C27 24 40 15 50 15 C62 15 74 24 70 46 C67 34 60 29 50 29 C40 29 33 34 30 46 Z" fill="${hc}"/>`;
    } else if (p.style === 'curly') {
      hairFront = [[34, 26], [44, 19], [56, 19], [66, 26], [30, 36], [70, 36], [50, 24]].map(c => `<circle cx="${c[0]}" cy="${c[1]}" r="10" fill="${hc}"/>`).join('');
    } else if (p.style === 'side') {
      hairFront = `<path d="M30 44 C26 22 42 14 54 15 C68 16 74 28 70 44 C68 34 62 30 54 29 C46 28 36 30 30 44 Z" fill="${hc}"/>`;
    } else if (p.style === 'bald') {
      hairFront = '';
    } else {
      hairFront = `<path d="M30 44 C28 24 40 16 50 16 C62 16 73 24 70 44 C66 34 60 30 50 30 C40 30 34 34 30 44 Z" fill="${hc}"/>`;
    }
    if (p.beard) extra += `<path d="M31 50 C33 72 67 72 69 50 C65 63 35 63 31 50 Z" fill="${hc}" opacity=".92"/>`;
    if (p.glasses) extra += `<g fill="none" stroke="#1a1a22" stroke-width="2"><circle cx="41" cy="47" r="7.5"/><circle cx="59" cy="47" r="7.5"/><line x1="48.5" y1="47" x2="51.5" y2="47"/></g>`;
    if (p.bindi) extra += `<circle cx="50" cy="35" r="1.8" fill="#B3282D"/>`;
    if (p.tie) extra += `<path d="M46 72 L54 72 L52 80 L56 100 L44 100 L48 80 Z" fill="${p.tie}"/>`;
    const mouth = p.smile === 'wide' ? '<path d="M42 57 Q50 65 58 57 Z" fill="#fff" stroke="#7a2b2b" stroke-width="1.5" stroke-linejoin="round"/>' : '<path d="M43 57 Q50 62 57 57" fill="none" stroke="#7a2b2b" stroke-width="2" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${p.bg}"/>${hairBack}<path d="M10 100 C12 78 30 70 50 70 C70 70 88 78 90 100 Z" fill="${p.shirt}"/><path d="M40 70 L50 82 L60 70 Z" fill="${skin}"/>${p.collar ? `<path d="M40 70 L50 84 L36 76 Z M60 70 L50 84 L64 76 Z" fill="${p.collar}"/>` : ''}<rect x="43" y="58" width="14" height="16" rx="6" fill="${skin}"/><rect x="43" y="64" width="14" height="6" fill="${sh}"/><ellipse cx="50" cy="46" rx="19" ry="22" fill="${skin}"/><circle cx="31" cy="48" r="4" fill="${skin}"/><circle cx="69" cy="48" r="4" fill="${skin}"/>${hairFront}<circle cx="43" cy="47" r="2.2" fill="#1a1a22"/><circle cx="57" cy="47" r="2.2" fill="#1a1a22"/><path d="M38 41 Q43 38.5 47 41 M53 41 Q57 38.5 62 41" fill="none" stroke="${hc}" stroke-width="2" stroke-linecap="round"/><path d="M50 49 L48.5 54 L51.5 54" fill="none" stroke="#00000030" stroke-width="1.4"/>${mouth}${extra}</svg>`;
  };
  RC.av = (key, size, extra) => `<div class="avatar-sm ${extra || ''}" style="width:${size || 32}px;height:${size || 32}px">${RC.avatar(key)}</div>`;
  RC.coLogo = (name, size) => {
    const cols = ['#B3282D', '#0B7E62', '#3F5A86', '#6B4FBB', '#D68A0A', '#0B0B0F', '#4A8F2A', '#8E1F24'];
    const ini = name.replace(/[^A-Za-z ]/g, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const s = size || 44;
    return `<div class="co-logo" style="background:${cols[RC.hash(name) % cols.length]};width:${s}px;height:${s}px;font-size:${Math.round(s * .36)}px">${ini}</div>`;
  };

  /* ---------------- charts ---------------- */
  RC.ring = (pct, size, stroke, color, label, sub) => {
    size = size || 84; stroke = stroke || 9; const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const col = color || (pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)');
    return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(120,120,130,.18)" stroke-width="${stroke}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" style="transition:stroke-dashoffset 1s"/></svg><div class="c"><b style="font-size:${Math.round(size * .27)}px">${label != null ? label : Math.round(pct)}</b>${sub ? `<small>${sub}</small>` : ''}</div></div>`;
  };
  RC.spark = (vals, color, w, h) => {
    w = w || 110; h = h || 34; const mx = Math.max(...vals), mn = Math.min(...vals), rg = (mx - mn) || 1;
    const pts = vals.map((v, i) => [i * (w / (vals.length - 1)), h - 4 - ((v - mn) / rg) * (h - 8)]);
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><path d="${d} L${w} ${h} L0 ${h} Z" fill="${color}" opacity=".12"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };
  RC.lineChart = (labels, series, o) => {
    o = o || {}; const W = 640, H = o.h || 230, pl = 40, pr = 12, pt = 12, pb = 26;
    const all = series.flatMap(s => s.data), mx = (o.max != null ? o.max : Math.ceil(Math.max(...all) * 1.12 / 5) * 5) || 10, mn = o.min || 0;
    const X = i => pl + i * ((W - pl - pr) / (labels.length - 1)), Y = v => pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn));
    let g = '';
    for (let k = 0; k <= 4; k++) { const v = mn + (mx - mn) * k / 4, y = Y(v); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#eceae5"/><text x="${pl - 8}" y="${y + 4}" font-size="10.5" fill="#9a9ea9" text-anchor="end">${o.fmt ? o.fmt(v) : Math.round(v)}</text>`; }
    labels.forEach((l, i) => { if (labels.length < 14 || i % 2 === 0) g += `<text x="${X(i)}" y="${H - 6}" font-size="10.5" fill="#9a9ea9" text-anchor="middle">${l}</text>`; });
    series.forEach((s, si) => {
      const d = s.data.map((v, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1)).join(' ');
      const id = 'g' + RC.uid();
      g += `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".22"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient></defs>`;
      if (o.area !== false) g += `<path d="${d} L${X(s.data.length - 1)} ${Y(mn)} L${X(0)} ${Y(mn)} Z" fill="url(#${id})"/>`;
      g += `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      if (o.dots) s.data.forEach((v, i) => g += `<circle cx="${X(i)}" cy="${Y(v)}" r="3" fill="#fff" stroke="${s.color}" stroke-width="2"/>`);
    });
    const lg = `<div class="legend mt8">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`;
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${g}</svg>${o.legend === false ? '' : lg}`;
  };
  RC.barChart = (labels, series, o) => {
    o = o || {}; const W = 640, H = o.h || 230, pl = 40, pr = 8, pt = 12, pb = 26;
    const stacked = o.stacked; const tot = labels.map((_, i) => stacked ? series.reduce((a, s) => a + s.data[i], 0) : Math.max(...series.map(s => s.data[i])));
    const mx = o.max || Math.ceil(Math.max(...tot) * 1.15 / 5) * 5 || 10;
    const bw = (W - pl - pr) / labels.length; let g = '';
    for (let k = 0; k <= 4; k++) { const v = mx * k / 4, y = pt + (H - pt - pb) * (1 - k / 4); g += `<line x1="${pl}" x2="${W - pr}" y1="${y}" y2="${y}" stroke="#eceae5"/><text x="${pl - 8}" y="${y + 4}" font-size="10.5" fill="#9a9ea9" text-anchor="end">${o.fmt ? o.fmt(v) : Math.round(v)}</text>`; }
    labels.forEach((l, i) => {
      const x0 = pl + i * bw; g += `<text x="${x0 + bw / 2}" y="${H - 6}" font-size="10.5" fill="#9a9ea9" text-anchor="middle">${l}</text>`;
      if (stacked) { let acc = 0; series.forEach(s => { const h = (H - pt - pb) * s.data[i] / mx, y = H - pb - acc - h; acc += h; g += `<rect x="${x0 + bw * .2}" y="${y}" width="${bw * .6}" height="${h}" fill="${s.color}" rx="2"/>`; }); }
      else { const n = series.length, w = bw * .7 / n; series.forEach((s, si) => { const h = (H - pt - pb) * s.data[i] / mx; g += `<rect x="${x0 + bw * .15 + si * w}" y="${H - pb - h}" width="${w - 2}" height="${h}" fill="${s.color}" rx="3"/>`; }); }
    });
    return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block">${g}</svg><div class="legend mt8">${series.map(s => `<span><i style="background:${s.color}"></i>${s.name}</span>`).join('')}</div>`;
  };
  RC.donut = (items, size, label, sub) => {
    size = size || 170; const tot = items.reduce((a, b) => a + b.v, 0), r = size / 2 - 16, c = 2 * Math.PI * r; let off = 0, g = '';
    items.forEach(it => { const len = c * it.v / tot; g += `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${it.c}" stroke-width="22" stroke-dasharray="${len} ${c - len}" stroke-dashoffset="${-off}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; off += len; });
    return `<div class="row gap18"><div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}">${g}</svg><div class="c"><b style="font-size:${Math.max(13, Math.round(size * .115))}px">${label || ''}</b>${sub ? `<small>${sub}</small>` : ''}</div></div><div class="col gap8 small">${items.map(it => `<div class="row gap8"><i style="width:10px;height:10px;border-radius:3px;background:${it.c};display:inline-block"></i><span>${it.n}</span><b class="mono" style="margin-left:auto">${it.f || it.v}</b></div>`).join('')}</div></div>`;
  };
  RC.radar = (labels, vals, o) => {
    o = o || {}; const S = 300, cx = 150, cy = 150, R = 105, n = labels.length; let g = '';
    const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return [cx + Math.cos(a) * R * v / 100, cy + Math.sin(a) * R * v / 100]; };
    [25, 50, 75, 100].forEach(l => { g += `<polygon points="${labels.map((_, i) => pt(i, l).join(',')).join(' ')}" fill="none" stroke="#e6e3dc"/>`; });
    labels.forEach((l, i) => { const [x, y] = pt(i, 100), [lx, ly] = pt(i, 122); g += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e6e3dc"/><text x="${lx}" y="${ly + 4}" font-size="11" font-weight="600" fill="#2a2c35" text-anchor="${Math.abs(lx - cx) < 8 ? 'middle' : lx > cx ? 'start' : 'end'}">${l}</text>`; });
    if (o.target) g += `<polygon points="${o.target.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="none" stroke="#0B7E62" stroke-width="1.6" stroke-dasharray="5 4"/>`;
    g += `<polygon points="${vals.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="rgba(179,40,45,.18)" stroke="#B3282D" stroke-width="2.4" stroke-linejoin="round"/>`;
    vals.forEach((v, i) => { const [x, y] = pt(i, v); g += `<circle cx="${x}" cy="${y}" r="4" fill="#fff" stroke="#B3282D" stroke-width="2.2"/>`; });
    return `<svg viewBox="-78 -6 ${S + 156} ${S + 12}" style="width:100%;max-width:${o.w || 420}px;display:block;margin:0 auto">${g}</svg>`;
  };
  RC.gauge = (pct, label) => {
    const r = 70, c = Math.PI * r, col = pct >= 80 ? '#0B7E62' : pct >= 60 ? '#D68A0A' : '#B3282D';
    return `<div class="gauge"><svg width="170" height="100" viewBox="0 0 170 100"><path d="M15 90 A70 70 0 0 1 155 90" fill="none" stroke="#ECEAE5" stroke-width="14" stroke-linecap="round"/><path d="M15 90 A70 70 0 0 1 155 90" fill="none" stroke="${col}" stroke-width="14" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" style="transition:stroke-dashoffset 1s"/></svg><div style="position:absolute;left:0;right:0;bottom:2px;text-align:center"><b style="font:700 30px var(--f-head)">${pct}</b><span class="muted small"> / 100</span><div class="tiny muted">${label || ''}</div></div></div>`;
  };
  RC.countUp = (el, to, ms, fmt) => { const t0 = performance.now(); const f = t => { const p = Math.min(1, (t - t0) / (ms || 900)); const v = Math.round(to * (1 - Math.pow(1 - p, 3))); el.textContent = fmt ? fmt(v) : v; if (p < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); };

  /* ---------------- state ---------------- */
  const KEY = 'rca_demo_state_v3';
  RC.defaults = () => JSON.parse(JSON.stringify(D.seed));
  RC.load = () => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s._v === D.seed._v) return s; } catch (e) { } return RC.defaults(); };
  RC.S = RC.load();
  RC.save = () => { try { localStorage.setItem(KEY, JSON.stringify(RC.S)); } catch (e) { } };
  RC.reset = () => { try { localStorage.removeItem(KEY); } catch (e) { } RC.S = RC.defaults(); RC.stopSpeech(); location.hash = '#/login'; location.reload(); };
  RC.ledgerAdd = (desc, credits, kind) => {
    const S = RC.S; const bal = S.wallet.free + S.wallet.paid;
    S.ledger.unshift({ id: RC.uid(), date: new Date(RC.today).toISOString(), desc, credits, kind: kind || (credits < 0 ? 'spend' : 'grant'), balance: bal });
  };
  RC.balance = () => RC.S.wallet.free + RC.S.wallet.paid;
  RC.spend = (n, desc) => { const w = RC.S.wallet; let rest = n; const f = Math.min(w.free, rest); w.free -= f; rest -= f; w.paid -= rest; RC.ledgerAdd(desc, -n); RC.S.usage.credits += n; RC.save(); RC.refreshCredits(); };
  RC.refreshCredits = () => { const e = RC.$('#creditNum'); if (e) e.textContent = RC.num(RC.balance()); };
  RC.notify = (text, kind) => { RC.S.notifications.unshift({ id: RC.uid(), text, kind: kind || 'info', t: 'Just now', read: false }); RC.save(); };
  window.addEventListener('storage', e => { if (e.key === KEY) { RC.S = RC.load(); if (RC.live) RC.live(); } });

  /* ---------------- toast / modal ---------------- */
  RC.toast = (msg, kind, ms) => {
    let box = RC.$('#toasts'); if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div'); t.className = 'toast ' + (kind || 'good');
    t.innerHTML = `<div style="margin-top:1px">${I(kind === 'bad' ? 'alert' : kind === 'info' ? 'info' : 'check')}</div><div>${msg}</div>`;
    box.appendChild(t); setTimeout(() => { t.style.opacity = 0; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, ms || 3600);
  };
  RC.modal = o => {
    RC.closeModal();
    const s = document.createElement('div'); s.className = 'scrim'; s.id = 'modalRoot';
    s.innerHTML = `<div class="modal ${o.size || ''}"><div class="modal-h"><div>${o.title ? `<h2>${o.title}</h2>` : ''}${o.sub ? `<p class="muted mt4">${o.sub}</p>` : ''}</div>${o.noClose ? '' : `<button class="iconbtn" data-close style="width:32px;height:32px">${I('x')}</button>`}</div><div class="modal-b">${o.body || ''}</div>${o.footer ? `<div class="modal-f">${o.footer}</div>` : '<div style="height:14px"></div>'}</div>`;
    document.body.appendChild(s);
    s.addEventListener('mousedown', e => { if (e.target === s && !o.noClose) RC.closeModal(); });
    RC.$$('[data-close]', s).forEach(b => b.addEventListener('click', () => RC.closeModal()));
    if (o.mount) o.mount(s);
    return s;
  };
  RC.closeModal = () => { const m = RC.$('#modalRoot'); if (m) m.remove(); };
  RC.drawer = (html, mount) => {
    RC.closeDrawer(); const d = document.createElement('div'); d.className = 'drawer'; d.id = 'drawerRoot';
    d.innerHTML = `<div style="position:sticky;top:0;background:#fff;padding:12px 16px;border-bottom:1px solid var(--line2);display:flex;justify-content:flex-end;z-index:2"><button class="iconbtn" style="width:32px;height:32px" data-dclose>${I('x')}</button></div><div style="padding:0 24px 30px">${html}</div>`;
    document.body.appendChild(d); RC.$('[data-dclose]', d).onclick = RC.closeDrawer; if (mount) mount(d);
  };
  RC.closeDrawer = () => { const d = RC.$('#drawerRoot'); if (d) d.remove(); };
  RC.confirm = (title, body, okText, cb) => {
    const m = RC.modal({ title, body: `<p class="muted">${body}</p>`, footer: `<button class="btn" data-close>Cancel</button><button class="btn primary" id="cfOk">${okText || 'Confirm'}</button>` });
    RC.$('#cfOk', m).onclick = () => { RC.closeModal(); cb && cb(); };
  };

  /* ---------------- voice (browser speech synthesis — no audio files needed) ---------------- */
  RC.voice = { on: true, list: [], map: {} };
  const loadVoices = () => { try { RC.voice.list = (speechSynthesis.getVoices() || []).filter(v => /^en/i.test(v.lang)); } catch (e) { RC.voice.list = []; } };
  try { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; } catch (e) { }
  const PERSONA = {
    riya: { pitch: 1.15, rate: 1.02, hint: /(zira|heera|female|samantha|aria|jenny|libby|natasha|neerja)/i, idx: 0 },
    kabir: { pitch: .82, rate: .98, hint: /(david|mark|ravi|male|daniel|guy|ryan|prabhat)/i, idx: 0 },
    meera: { pitch: 1.35, rate: 1.05, hint: /(female|zira|heera|samantha|sonia|ava)/i, idx: 1 },
    moderator: { pitch: .95, rate: .96, hint: /(mark|guy|david|male|george|james)/i, idx: 1 },
    priya: { pitch: 1.1, rate: 1.0, hint: /(zira|heera|female|aria|jenny|neerja)/i, idx: 0 },
    vikram: { pitch: .9, rate: 1.0, hint: /(david|ravi|male|mark|guy)/i, idx: 0 },
    coach: { pitch: 1.0, rate: 1.0, hint: /(zira|female|aria)/i, idx: 0 }
  };
  const pickVoice = k => {
    if (!RC.voice.list.length) loadVoices();
    if (RC.voice.map[k]) return RC.voice.map[k];
    const p = PERSONA[k] || PERSONA.coach; const cand = RC.voice.list.filter(v => p.hint.test(v.name));
    const v = cand[p.idx % (cand.length || 1)] || RC.voice.list[(RC.hash(k)) % (RC.voice.list.length || 1)] || null;
    if (RC.voice.list.length) RC.voice.map[k] = v; return v;
  };
  RC.stopSpeech = () => { try { speechSynthesis.cancel(); } catch (e) { } };
  RC.speak = (text, who) => new Promise(res => {
    const words = text.split(/\s+/).length; const est = Math.max(1500, words * 330);
    if (!RC.voice.on || !('speechSynthesis' in window)) { setTimeout(res, est * .78); return; }
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    try {
      const u = new SpeechSynthesisUtterance(text.replace(/[*_#]/g, '')); const p = PERSONA[who] || PERSONA.coach; const v = pickVoice(who);
      if (v) u.voice = v; u.lang = v ? v.lang : 'en-IN'; u.pitch = p.pitch; u.rate = p.rate; u.volume = 1;
      u.onend = fin; u.onerror = fin; speechSynthesis.speak(u); setTimeout(fin, est * 2 + 4000);
    } catch (e) { setTimeout(fin, est * .78); }
  });
  RC.typeInto = async (el, text, cps) => {
    cps = cps || 60; el.textContent = ''; const step = Math.max(1, Math.round(cps / 30));
    for (let i = 0; i < text.length; i += step) { el.textContent = text.slice(0, i + step); await RC.sleep(1000 / 30); }
    el.textContent = text;
  };

  /* ---------------- router ---------------- */
  RC.routes = []; RC.cleanups = [];
  RC.route = (pattern, role, fn) => {
    const keys = []; const re = new RegExp('^' + pattern.replace(/:([a-z]+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    RC.routes.push({ re, keys, role, fn });
  };
  RC.go = p => { if (location.hash === '#' + p) RC.render(); else location.hash = '#' + p; };
  RC.onLeave = fn => RC.cleanups.push(fn);
  RC.render = async () => {
    RC.cleanups.forEach(f => { try { f(); } catch (e) { } }); RC.cleanups = []; RC.closeModal(); RC.closeDrawer(); RC.stopSpeech();
    const path = (location.hash || '#/login').slice(1).split('?')[0] || '/login';
    const r = RC.routes.find(r => r.re.test(path));
    if (!r) { RC.go(RC.S.session ? (RC.S.session.role === 'admin' ? '/a/dashboard' : '/s/dashboard') : '/login'); return; }
    if (r.role && (!RC.S.session || RC.S.session.role !== r.role)) { RC.go('/login'); return; }
    const m = path.match(r.re); const params = {}; r.keys.forEach((k, i) => params[k] = decodeURIComponent(m[i + 1]));
    const out = await r.fn(params);
    const app = RC.$('#app'); app.innerHTML = out.html; window.scrollTo(0, 0); RC.updateDemobar();
    if (out.mount) out.mount(app);
    RC.refreshCredits();
  };
  window.addEventListener('hashchange', () => RC.render());

  /* ---------------- shell (sidebar + topbar) ---------------- */
  const navStudent = [
    ['dashboard', 'Dashboard', 'home'], ['jobs', 'Job Matches', 'briefcase', 'new'], ['resume', 'Resume Studio', 'file'], ['cover', 'Cover Letters', 'mail'],
    ['tracker', 'Applications', 'list'], ['interview', 'Interview Lab', 'mic', 'AI'], ['learn', 'Radical Courses', 'book'], ['credits', 'Credits & Plans', 'card'], ['profile', 'Profile & Privacy', 'user']
  ];
  const navAdmin = [
    ['dashboard', 'Dashboard', 'home'], ['users', 'Users & Enrolment', 'users'], ['modules', 'Module Access', 'sliders'], ['credits', 'Credit Wallets', 'card'],
    ['requests', 'Requests', 'clip', 'req'], ['costs', 'Cost & Usage', 'rupee'], ['content', 'Jobs & Content', 'db'], ['sessions', 'Interview Sessions', 'mic'], ['reports', 'Reports & Insights', 'pie'], ['settings', 'Settings & Audit', 'settings']
  ];
  RC.shell = (role, active, title, sub, actions, inner) => {
    const S = RC.S, nav = role === 'admin' ? navAdmin : navStudent, base = role === 'admin' ? '/a/' : '/s/';
    const pending = S.requests.filter(r => r.status === 'pending').length + S.planRequests.filter(r => ['requested', 'paid'].includes(r.status)).length;
    const unread = S.notifications.filter(n => !n.read && (n.role || 'student') === (role === 'admin' ? 'admin' : 'student')).length;
    const me = role === 'admin' ? D.admin : D.student;
    const links = nav.map(n => {
      const on = n[0] === active; let pill = '';
      if (n[3] === 'new') { const lj = (S.jobFeed && S.jobFeed.loaded) || 0; pill = lj ? `<span class="badge pill">${lj}/${D.jobs.length}</span>` : '<span class="badge red pill">5 free</span>'; }
      if (n[3] === 'AI') pill = '<span class="badge violet pill">AI</span>';
      if (n[3] === 'req' && pending) pill = `<span class="badge red pill">${pending}</span>`;
      const locked = role === 'student' && S.modules[n[0]] === false;
      return `<a href="#${base}${n[0]}" class="${on ? 'on' : ''} ${locked ? 'locked' : ''}">${I(n[2])}<span>${n[1]}</span>${locked ? `<span class="pill">${I('lock', 14)}</span>` : pill}</a>`;
    }).join('');
    const foot = role === 'student' ? (S.plan === 'basic' ? `<div class="upgrade"><h4>${I('spark', 16)} Interview Premium</h4><p>All 6 interview rounds, detailed AI feedback & a 30-day roadmap.</p><a class="btn primary sm block" href="#/s/interview/plans">See plans</a></div>` : `<div class="upgrade" style="background:linear-gradient(135deg,#08624C,#0B0B0F)"><h4>${I('award', 16)} Premium active</h4><p>Valid till ${RC.fmtDate(S.premiumUntil)}. All rounds unlocked.</p><a class="btn sm block" href="#/s/interview">Open Interview Lab</a></div>`)
      : `<div class="callout info tiny" style="font-size:11.5px">${I('shield', 14)}<div>Every admin action is written to the audit log.</div></div>`;
    return `<div class="shell"><aside class="sidebar"><div class="sb-logo"><img src="assets/img/logo@2x.png" alt="Radical Technologies"></div><div class="sb-role">${role === 'admin' ? 'Admin console' : 'CareerAI · Student'}</div><nav class="nav">${links}</nav><div class="sb-foot">${foot}</div></aside>
    <div class="main"><header class="topbar"><div class="search">${I('search', 16)}<input id="gsearch" placeholder="${role === 'admin' ? 'Search students, batches, requests…' : 'Search jobs, skills, companies…'}"></div><div class="grow"></div>
    ${role === 'student' ? `<a class="credit-pill" href="#/s/credits" style="text-decoration:none;color:inherit"><span class="dot">C</span><span><span id="creditNum">${RC.num(RC.balance())}</span> <span class="muted small" style="font-weight:500">credits</span></span></a>` : `<span class="badge green"><span class="status-dot" style="background:var(--green);margin:0"></span> All systems normal</span>`}
    <div style="position:relative"><button class="iconbtn" id="bellBtn">${I('bell')}${unread ? `<span class="n">${unread}</span>` : ''}</button><div id="notifPop"></div></div>
    <div class="userbox" id="userBox">${RC.av(role === 'admin' ? 'sneha' : 'aarav', 36)}<div><div class="nm">${me.name}</div><div class="sub">${role === 'admin' ? 'Placement Admin' : 'Radical student · AWS DevOps'}</div></div>${I('chevD', 16)}</div></header>
    <main class="page fadein"><div class="page-head"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="row gap8">${actions || ''}</div></div>${inner}</main></div></div>`;
  };
  RC.shellMount = role => {
    const bell = RC.$('#bellBtn'), pop = RC.$('#notifPop');
    if (bell) bell.onclick = e => {
      e.stopPropagation(); if (pop.innerHTML) { pop.innerHTML = ''; return; }
      const list = RC.S.notifications.filter(n => (n.role || 'student') === (role === 'admin' ? 'admin' : 'student')).slice(0, 8);
      pop.innerHTML = `<div class="notif-pop"><div style="padding:14px 16px;font-weight:650;display:flex;justify-content:space-between">Notifications <a class="small" id="markRead">Mark all read</a></div>${list.map(n => `<div class="it"><div>${I(n.kind === 'good' ? 'check' : n.kind === 'warn' ? 'alert' : 'bell', 16)}</div><div><div style="font-size:13px">${n.text}</div><div class="tiny muted">${n.t}</div></div></div>`).join('') || '<div class="empty">No notifications</div>'}</div>`;
      const mr = RC.$('#markRead'); if (mr) mr.onclick = () => { RC.S.notifications.forEach(n => n.read = true); RC.save(); RC.render(); };
    };
    document.addEventListener('click', () => { if (pop) pop.innerHTML = ''; }, { once: true });
    const ub = RC.$('#userBox'); if (ub) ub.onclick = () => RC.modal({
      title: 'Account', body: `<div class="row gap14">${RC.av(role === 'admin' ? 'sneha' : 'aarav', 54)}<div><b>${role === 'admin' ? D.admin.name : D.student.name}</b><div class="muted small">${role === 'admin' ? D.admin.email : D.student.email}</div></div></div>`,
      footer: `<button class="btn" data-close>Close</button><button class="btn dark" id="lo">${I('logout', 16)} Sign out</button>`, mount: m => RC.$('#lo', m).onclick = () => { RC.S.session = null; RC.save(); RC.closeModal(); RC.go('/login'); }
    });
    const gs = RC.$('#gsearch'); if (gs) gs.addEventListener('keydown', e => { if (e.key === 'Enter') { RC.S.q = gs.value; RC.save(); RC.go(role === 'admin' ? '/a/users' : '/s/jobs'); } });
  };

  /* ---------------- demo bar ---------------- */
  RC.mountDemobar = () => {
    const bar = document.createElement('div'); bar.id = 'demobar';
    bar.innerHTML = `<span class="tag">DEMO BUILD</span><span class="muted" style="color:#9a9ea9">Sample data only — nothing here is real</span><span class="sp"></span>
    <span style="color:#9a9ea9">View as</span><button id="dbStudent">Student</button><button id="dbAdmin">Admin</button>
    <span style="color:#9a9ea9;margin-left:6px">Interview plan</span><select id="dbPlan"><option value="basic">Basic</option><option value="premium">Premium</option></select>
    <button id="dbVoice"></button><button id="dbReset">Reset demo</button>`;
    document.body.prepend(bar);
    RC.$('#dbStudent').onclick = () => { RC.S.session = { role: 'student' }; RC.save(); RC.go('/s/dashboard'); };
    RC.$('#dbAdmin').onclick = () => { RC.S.session = { role: 'admin' }; RC.save(); RC.go('/a/dashboard'); };
    RC.$('#dbPlan').onchange = e => { RC.S.plan = e.target.value; if (RC.S.plan === 'premium' && !RC.S.premiumUntil) RC.S.premiumUntil = new Date(2026, 9, 20).toISOString(); RC.save(); RC.toast('Student plan switched to <b>' + (RC.S.plan === 'premium' ? 'Premium' : 'Basic') + '</b>', 'info'); RC.render(); };
    RC.$('#dbVoice').onclick = () => { RC.voice.on = !RC.voice.on; if (!RC.voice.on) RC.stopSpeech(); RC.updateDemobar(); };
    RC.$('#dbReset').onclick = () => RC.confirm('Reset the demo?', 'This clears everything you did in this demo (requests, applications, results) and restores the sample data.', 'Reset', RC.reset);
  };
  RC.updateDemobar = () => {
    const S = RC.S, r = S.session && S.session.role;
    const a = RC.$('#dbStudent'), b = RC.$('#dbAdmin'), p = RC.$('#dbPlan'), v = RC.$('#dbVoice'); if (!a) return;
    a.classList.toggle('on', r === 'student'); b.classList.toggle('on', r === 'admin'); p.value = S.plan;
    v.innerHTML = (RC.voice.on ? I('vol', 14) + ' Voice on' : I('volx', 14) + ' Voice off'); v.classList.toggle('on', RC.voice.on);
  };
  RC.printEl = el => { el.classList.add('printable'); setTimeout(() => { window.print(); setTimeout(() => el.classList.remove('printable'), 500); }, 80); };
  RC.pill = (t, c) => `<span class="badge ${c || ''}">${t}</span>`;
  RC.scoreColor = v => v >= 75 ? 'green' : v >= 55 ? 'amber' : 'red';
})();
