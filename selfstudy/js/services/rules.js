/* ==========================================================================
   Business rules & formatting — pure functions, no UI.
   These are SAMPLE rules for the prototype; each one is a candidate item for
   the requirement-freeze discussion (see README "Open questions").
   ========================================================================== */
(function () {
  const { isoDate, addDays, pad } = SSC.seed;

  const today = () => isoDate(new Date());
  const nowLocal = () => { const d = new Date(); return `${isoDate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

  // ---------- Formatting ----------
  const inr = (n) => (n < 0 ? '−' : '') + '₹' + Math.abs(Math.round(n || 0)).toLocaleString('en-IN');
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso.length > 10 ? iso : iso + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const fmtTime = (iso) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };
  const fmtDateTime = (iso) => (iso ? `${fmtDate(iso)}, ${fmtTime(iso)}` : '—');
  const fmtHours = (h) => (h == null ? '—' : `${Math.floor(h)}h ${pad(Math.round((h % 1) * 60))}m`);
  const relTime = (iso) => {
    const mins = Math.round((Date.now() - new Date(iso)) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)} h ago`;
    const d = Math.floor(mins / 1440);
    return d === 1 ? 'yesterday' : `${d} days ago`;
  };
  const initials = (name) => (name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  // ---------- Membership ----------
  /** Upcoming | Active | Expiring Soon | Expired | Suspended | Cancelled */
  function membershipStatus(m, settings) {
    if (!m) return 'None';
    if (m.override) return m.override;
    const t = today();
    if (m.startDate > t) return 'Upcoming';
    if (m.endDate < t) return 'Expired';
    const soon = settings ? settings.expiringSoonDays : 7;
    if (daysBetween(t, m.endDate) <= soon) return 'Expiring Soon';
    return 'Active';
  }
  const isLive = (status) => status === 'Active' || status === 'Expiring Soon';

  function endDateFor(plan, startDate) {
    if (plan.unit === 'hours') return startDate;
    const days = plan.unit === 'weeks' ? plan.duration * 7 : plan.unit === 'months' ? plan.duration * 30 : plan.duration;
    return addDays(startDate, days - 1);
  }

  function durationLabel(plan) {
    const u = plan.duration === 1 ? plan.unit.replace(/s$/, '') : plan.unit;
    return `${plan.duration} ${u}`;
  }

  /**
   * Price calculation for admission / renewal.
   * discount: { type: 'flat' | 'percent', value }
   */
  function calcAmount(plan, discount, settings) {
    const base = plan ? plan.price : 0;
    let disc = 0;
    if (discount && discount.value > 0) {
      disc = discount.type === 'percent' ? Math.round((base * Math.min(discount.value, 100)) / 100) : Math.min(discount.value, base);
    }
    const maxPct = settings ? settings.maxDiscountPercent : 100;
    const capped = Math.min(disc, Math.round((base * maxPct) / 100));
    return { base, discount: capped, total: base - capped, capped: capped < disc };
  }

  /** Renewal starts the day after current expiry (if still running) or today. */
  function renewalStartDate(current, mode) {
    const t = today();
    if (mode === 'immediate' || !current) return t;
    return current.endDate >= t ? addDays(current.endDate, 1) : t;
  }

  // ---------- Attendance ----------
  function hoursBetween(checkIn, checkOut) {
    if (!checkIn) return null;
    const end = checkOut ? new Date(checkOut) : new Date();
    return Math.max(0, (end - new Date(checkIn)) / 3600000);
  }

  // ---------- Status → badge colour ----------
  const badgeTone = {
    Active: 'ok', 'Expiring Soon': 'warn', Expired: 'bad', Upcoming: 'info', Suspended: 'grey', Cancelled: 'grey', None: 'grey',
    Inactive: 'grey', Paid: 'ok', Pending: 'warn', Refunded: 'info', Failed: 'bad',
    Open: 'bad', 'In Progress': 'warn', Resolved: 'ok',
    Available: 'ok', Occupied: 'brand', Reserved: 'warn', Blocked: 'grey',
    Approved: 'ok', Rejected: 'bad', Present: 'ok', 'Checked Out': 'grey', Absent: 'bad',
    High: 'bad', Medium: 'warn', Low: 'grey',
    Admin: 'brand', Manager: 'info', Staff: 'grey',
  };
  const tone = (status) => badgeTone[status] || 'grey';

  SSC.rules = {
    today, nowLocal, daysBetween, addDays, isoDate,
    inr, fmtDate, fmtTime, fmtDateTime, fmtHours, relTime, initials,
    membershipStatus, isLive, endDateFor, durationLabel, calcAmount, renewalStartDate,
    hoursBetween, tone,
  };
})();
