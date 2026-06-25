/* ── Vendor Onboarding Portal — Shared JS ── */

const STORAGE_KEY = 'vop_vendors';
const CURRENT_KEY = 'vop_current_vendor';

/* ── Seed mock vendors if first load ── */
function seedVendors() {
  if (localStorage.getItem(STORAGE_KEY)) return;
  const mock = [
    {
      id: 'VND-1001',
      company: 'Apex Manufacturing Ltd.',
      type: 'Manufacturer',
      category: 'Electronics',
      email: 'procurement@apexmfg.com',
      phone: '+91 98200 11234',
      website: 'www.apexmfg.com',
      gst: '27AAPFU0939F1ZV',
      years: '12',
      turnover: '₹10 Cr – ₹50 Cr',
      bank: 'HDFC Bank',
      account: '****4521',
      ifsc: 'HDFC0001234',
      accountType: 'Current',
      submittedAt: '2026-06-10',
      status: 'approved',
      docs: { pan: 'PAN_APEX.pdf', gst: 'GST_CERT_APEX.pdf', bank: 'BANK_LETTER_APEX.pdf', trade: 'TRADE_LIC_APEX.pdf' }
    },
    {
      id: 'VND-1002',
      company: 'SwiftLogix Distributors',
      type: 'Distributor',
      category: 'Logistics & Supply',
      email: 'ops@swiftlogix.in',
      phone: '+91 99870 55678',
      website: 'www.swiftlogix.in',
      gst: '29AABCS1429B1Z5',
      years: '7',
      turnover: '₹5 Cr – ₹10 Cr',
      bank: 'ICICI Bank',
      account: '****8832',
      ifsc: 'ICIC0005678',
      accountType: 'Current',
      submittedAt: '2026-06-15',
      status: 'review',
      docs: { pan: 'PAN_SWIFT.pdf', gst: 'GST_CERT_SWIFT.pdf', bank: 'BANK_SWIFT.pdf', trade: 'TRADE_SWIFT.pdf' }
    },
    {
      id: 'VND-1003',
      company: 'GreenLeaf Organics',
      type: 'Manufacturer',
      category: 'Food & Beverages',
      email: 'info@greenleaf.org',
      phone: '+91 88001 22345',
      website: 'www.greenleaf.org',
      gst: '06AABCG1111B2ZA',
      years: '3',
      turnover: 'Below ₹1 Cr',
      bank: 'SBI',
      account: '****9910',
      ifsc: 'SBIN0009910',
      accountType: 'Current',
      submittedAt: '2026-06-18',
      status: 'pending',
      docs: { pan: 'PAN_GREEN.pdf', gst: 'GST_GREEN.pdf', bank: 'BANK_GREEN.pdf', trade: 'TRADE_GREEN.pdf' }
    },
    {
      id: 'VND-1004',
      company: 'TechEdge Solutions',
      type: 'Retailer',
      category: 'IT & Software',
      email: 'contact@techedge.io',
      phone: '+91 77009 88765',
      website: 'www.techedge.io',
      gst: '27AADCT4567R1ZQ',
      years: '5',
      turnover: '₹1 Cr – ₹5 Cr',
      bank: 'Axis Bank',
      account: '****3347',
      ifsc: 'UTIB0003347',
      accountType: 'Current',
      submittedAt: '2026-06-20',
      status: 'rejected',
      docs: { pan: 'PAN_TECH.pdf', gst: 'GST_TECH.pdf', bank: 'BANK_TECH.pdf', trade: 'TRADE_TECH.pdf' }
    },
    {
      id: 'VND-1005',
      company: 'BuildRight Construction',
      type: 'Distributor',
      category: 'Construction & Infra',
      email: 'bd@buildright.co.in',
      phone: '+91 91234 56789',
      website: 'www.buildright.co.in',
      gst: '24AACCB5678K1ZE',
      years: '20',
      turnover: 'Above ₹100 Cr',
      bank: 'Kotak Mahindra Bank',
      account: '****7723',
      ifsc: 'KKBK0007723',
      accountType: 'Current',
      submittedAt: '2026-06-22',
      status: 'pending',
      docs: { pan: 'PAN_BUILD.pdf', gst: 'GST_BUILD.pdf', bank: 'BANK_BUILD.pdf', trade: 'TRADE_BUILD.pdf' }
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mock));
}

function getVendors() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveVendors(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function getCurrentVendor() {
  return JSON.parse(localStorage.getItem(CURRENT_KEY) || 'null');
}

function setCurrentVendor(v) {
  localStorage.setItem(CURRENT_KEY, JSON.stringify(v));
}

function updateVendorStatus(id, status) {
  const vendors = getVendors();
  const idx = vendors.findIndex(v => v.id === id);
  if (idx !== -1) { vendors[idx].status = status; saveVendors(vendors); }
  const cur = getCurrentVendor();
  if (cur && cur.id === id) { cur.status = status; setCurrentVendor(cur); }
}

/* ── Status helpers ── */
const STATUS_META = {
  pending:  { label: 'Pending Review', icon: '🕐', cls: 'badge-pending' },
  review:   { label: 'Under Review',   icon: '🔍', cls: 'badge-review' },
  approved: { label: 'Approved',        icon: '✅', cls: 'badge-approved' },
  rejected: { label: 'Rejected',        icon: '❌', cls: 'badge-rejected' }
};

function statusBadge(status) {
  const m = STATUS_META[status] || STATUS_META.pending;
  return `<span class="badge ${m.cls}">${m.icon} ${m.label}</span>`;
}

/* ── Toast ── */
function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = 'toast' + (type === 'error' ? ' error' : '');
  t.innerHTML = `<span>${type === 'success' ? '✅' : '❌'}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3200);
}

/* ── Generate vendor ID ── */
function genId() {
  const vendors = getVendors();
  const max = vendors.reduce((m, v) => Math.max(m, parseInt(v.id.split('-')[1]) || 1000), 1000);
  return 'VND-' + (max + 1);
}

seedVendors();
