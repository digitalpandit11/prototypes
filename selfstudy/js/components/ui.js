/* ==========================================================================
   Reusable UI primitives. Registered globally in main.js.
   Templates can use: $db, $sel, $act, $ui, $R, $inr(n), $date(iso), $time(iso), $toast(msg, type), $confirm(opts)
   ========================================================================== */
SSC.components = SSC.components || {};

(function () {
  const { h, computed, ref, watch } = Vue;
  const C = SSC.components;

  // ---------- Icon (Lucide, rendered as inline SVG via Vue) ----------
  C.Icon = {
    props: { name: { type: String, required: true }, size: { type: [Number, String], default: 18 }, stroke: { type: [Number, String], default: 2 } },
    setup(props, { attrs }) {
      return () => {
        const lib = window.lucide || {};
        const node = lib[props.name] || (lib.icons && lib.icons[props.name]) || lib.Circle;
        const [, base, children] = node;
        return h('svg', { ...base, ...attrs, width: props.size, height: props.size, 'stroke-width': props.stroke, 'aria-hidden': 'true', class: ['shrink-0', attrs.class] },
          children.map(([tag, a]) => h(tag, a)));
      };
    },
    inheritAttrs: false,
  };

  // ---------- Badge ----------
  C.Badge = {
    props: { status: String, tone: String },
    computed: { cls() { return 'badge badge-' + (this.tone || SSC.rules.tone(this.status)); } },
    template: `<span :class="cls"><slot>{{ status }}</slot></span>`,
  };

  // ---------- Avatar (initials) ----------
  const avatarColors = ['#6C63FF', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#ec4899'];
  C.Avatar = {
    props: { name: String, size: { type: Number, default: 36 } },
    computed: {
      style() {
        const n = (this.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        return { width: this.size + 'px', height: this.size + 'px', fontSize: Math.round(this.size * 0.38) + 'px', background: avatarColors[n % avatarColors.length] };
      },
      text() { return SSC.rules.initials(this.name); },
    },
    template: `<span class="avatar" :style="style">{{ text }}</span>`,
  };

  // ---------- Page header ----------
  C.PageHeader = {
    props: { title: String, subtitle: String },
    template: `
      <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div class="min-w-0">
          <slot name="crumbs"></slot>
          <h1 class="text-xl md:text-2xl font-semibold text-gray-900 m-0">{{ title }}</h1>
          <p v-if="subtitle" class="text-sm text-gray-500 mt-1 mb-0">{{ subtitle }}</p>
        </div>
        <div class="flex flex-wrap items-center gap-2"><slot></slot></div>
      </div>`,
  };

  // ---------- Stat card ----------
  C.StatCard = {
    props: { label: String, value: [String, Number], icon: String, tone: { type: String, default: 'brand' }, hint: String, to: [String, Object] },
    computed: {
      iconStyle() {
        const map = { brand: ['#f1f0ff', '#6C63FF'], ok: ['#ecfdf5', '#059669'], warn: ['#fffbeb', '#d97706'], bad: ['#fef2f2', '#dc2626'], info: ['#eff6ff', '#2563eb'], grey: ['#f3f4f6', '#4b5563'] };
        const [bg, fg] = map[this.tone] || map.brand;
        return { background: bg, color: fg };
      },
    },
    template: `
      <component :is="to ? 'router-link' : 'div'" :to="to" class="card card-pad flex items-start gap-3 no-underline text-inherit" :class="to ? 'hover:border-brand-200 transition' : ''">
        <div class="w-10 h-10 rounded-xl grid place-items-center" :style="iconStyle"><Icon :name="icon" :size="20" /></div>
        <div class="min-w-0">
          <div class="text-xs text-gray-500">{{ label }}</div>
          <div class="text-xl font-semibold text-gray-900 leading-tight mt-0.5">{{ value }}</div>
          <div v-if="hint" class="text-[11px] text-gray-400 mt-0.5">{{ hint }}</div>
        </div>
      </component>`,
  };

  // ---------- Empty state ----------
  C.EmptyState = {
    props: { icon: { type: String, default: 'Inbox' }, title: { type: String, default: 'Nothing here yet' }, text: String },
    template: `
      <div class="text-center py-10 px-4">
        <div class="w-12 h-12 mx-auto rounded-full bg-gray-100 grid place-items-center text-gray-400 mb-3"><Icon :name="icon" :size="22" /></div>
        <div class="font-medium text-gray-700">{{ title }}</div>
        <div v-if="text" class="text-sm text-gray-500 mt-1">{{ text }}</div>
        <div class="mt-4"><slot></slot></div>
      </div>`,
  };

  // ---------- Modal ----------
  C.Modal = {
    props: { show: Boolean, title: String, size: { type: String, default: 'md' } },
    emits: ['close'],
    computed: { width() { return { sm: '420px', md: '560px', lg: '760px', xl: '980px' }[this.size] || '560px'; } },
    mounted() { this._esc = (e) => { if (e.key === 'Escape' && this.show) this.$emit('close'); }; window.addEventListener('keydown', this._esc); },
    unmounted() { window.removeEventListener('keydown', this._esc); },
    template: `
      <teleport to="body">
        <div v-if="show" class="modal-backdrop" @mousedown.self="$emit('close')">
          <div class="modal" :style="{ maxWidth: width }" role="dialog" aria-modal="true">
            <div class="modal-head">
              <h3 class="text-base font-semibold m-0">{{ title }}</h3>
              <button class="btn btn-ghost btn-icon" @click="$emit('close')" aria-label="Close"><Icon name="X" /></button>
            </div>
            <div class="modal-body"><slot></slot></div>
            <div v-if="$slots.footer" class="modal-foot"><slot name="footer"></slot></div>
          </div>
        </div>
      </teleport>`,
  };

  // ---------- Global confirm dialog + toasts (mounted once in App) ----------
  C.ConfirmHost = {
    computed: { c() { return SSC.store.ui.confirm; } },
    methods: {
      done(v) { const c = this.c; SSC.store.ui.confirm = null; c.resolve(v); },
    },
    template: `
      <Modal :show="!!c" :title="c ? c.title : ''" size="sm" @close="done(false)">
        <p class="text-sm text-gray-600 m-0" v-if="c">{{ c.message }}</p>
        <template #footer>
          <button class="btn btn-secondary" @click="done(false)">Cancel</button>
          <button class="btn" :class="c && c.tone === 'danger' ? 'btn-danger' : 'btn-primary'" @click="done(true)">{{ c ? c.confirmText : 'OK' }}</button>
        </template>
      </Modal>`,
  };

  C.ToastHost = {
    computed: { toasts() { return SSC.store.ui.toasts; } },
    methods: { icon(t) { return { success: 'CheckCircle2', error: 'XCircle', info: 'Info', warn: 'AlertTriangle' }[t] || 'Info'; },
      color(t) { return { success: '#34d399', error: '#f87171', info: '#93c5fd', warn: '#fbbf24' }[t] || '#93c5fd'; } },
    template: `
      <div class="toast-stack no-print">
        <div v-for="t in toasts" :key="t.id" class="toast"><Icon :name="icon(t.type)" :style="{ color: color(t.type) }" /><span>{{ t.message }}</span></div>
      </div>`,
  };

  // ---------- Tabs ----------
  C.Tabs = {
    props: { tabs: Array, modelValue: String },
    emits: ['update:modelValue'],
    template: `
      <div class="tabs scroll-thin">
        <button v-for="t in tabs" :key="t.key" class="tab" :class="{ active: modelValue === t.key }" @click="$emit('update:modelValue', t.key)">
          {{ t.label }}<span v-if="t.count != null" class="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{{ t.count }}</span>
        </button>
      </div>`,
  };

  // ---------- Search input ----------
  C.SearchInput = {
    props: { modelValue: String, placeholder: { type: String, default: 'Search…' } },
    emits: ['update:modelValue'],
    template: `
      <div class="relative">
        <Icon name="Search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input class="input pl-9" :value="modelValue" :placeholder="placeholder" @input="$emit('update:modelValue', $event.target.value)" />
      </div>`,
  };

  // ---------- Form field wrapper ----------
  C.Field = {
    props: { label: String, required: Boolean, error: String, hint: String },
    template: `
      <div>
        <label v-if="label" class="label">{{ label }} <span v-if="required" class="req">*</span></label>
        <slot></slot>
        <div v-if="error" class="field-error">{{ error }}</div>
        <div v-else-if="hint" class="hint">{{ hint }}</div>
      </div>`,
  };

  // ---------- Data table: sorting + pagination; filtering is done by the parent ----------
  // columns: [{ key, label, sortable?: true, align?: 'right', class? }]
  // slots: #cell-<key>="{ row, value }", #empty
  C.DataTable = {
    props: { columns: Array, rows: Array, pageSize: { type: Number, default: 10 }, rowKey: { type: String, default: 'id' }, emptyTitle: { type: String, default: 'No records found' }, emptyText: { type: String, default: 'Try changing the search or filters.' }, loading: Boolean, clickable: Boolean },
    emits: ['row-click'],
    data() { return { sortKey: null, sortDir: 1, page: 1 }; },
    watch: { rows() { if (this.page > this.pages) this.page = 1; } },
    computed: {
      sorted() {
        if (!this.sortKey) return this.rows;
        const k = this.sortKey, d = this.sortDir;
        return [...this.rows].sort((a, b) => {
          const x = a[k], y = b[k];
          if (typeof x === 'number' && typeof y === 'number') return (x - y) * d;
          return String(x ?? '').localeCompare(String(y ?? ''), 'en', { numeric: true }) * d;
        });
      },
      pages() { return Math.max(1, Math.ceil(this.rows.length / this.pageSize)); },
      paged() { const s = (this.page - 1) * this.pageSize; return this.sorted.slice(s, s + this.pageSize); },
      range() { const s = (this.page - 1) * this.pageSize; return `${this.rows.length ? s + 1 : 0}–${Math.min(s + this.pageSize, this.rows.length)} of ${this.rows.length}`; },
    },
    methods: {
      sort(c) { if (c.sortable === false) return; if (this.sortKey === c.key) this.sortDir *= -1; else { this.sortKey = c.key; this.sortDir = 1; } },
    },
    template: `
      <div>
        <div class="table-wrap scroll-thin">
          <table class="table">
            <thead><tr>
              <th v-for="c in columns" :key="c.key" :class="[c.class, c.align === 'right' ? 'text-right' : '', c.sortable !== false ? 'cursor-pointer select-none' : '']" @click="sort(c)">
                {{ c.label }}<span v-if="sortKey === c.key">{{ sortDir === 1 ? ' ↑' : ' ↓' }}</span>
              </th>
            </tr></thead>
            <tbody v-if="loading">
              <tr v-for="i in 5" :key="i"><td v-for="c in columns" :key="c.key"><div class="skeleton h-4 w-3/4"></div></td></tr>
            </tbody>
            <tbody v-else>
              <tr v-for="row in paged" :key="row[rowKey]" :class="clickable ? 'cursor-pointer' : ''" @click="clickable && $emit('row-click', row)">
                <td v-for="c in columns" :key="c.key" :class="[c.class, c.align === 'right' ? 'text-right' : '']">
                  <slot :name="'cell-' + c.key" :row="row" :value="row[c.key]">{{ row[c.key] ?? '—' }}</slot>
                </td>
              </tr>
            </tbody>
          </table>
          <EmptyState v-if="!loading && !rows.length" icon="SearchX" :title="emptyTitle" :text="emptyText"><slot name="empty"></slot></EmptyState>
        </div>
        <div v-if="rows.length > pageSize" class="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
          <span>{{ range }}</span>
          <div class="flex items-center gap-1">
            <button class="btn btn-secondary btn-sm" :disabled="page === 1" @click="page--"><Icon name="ChevronLeft" :size="14" /></button>
            <span class="px-2">Page {{ page }} / {{ pages }}</span>
            <button class="btn btn-secondary btn-sm" :disabled="page === pages" @click="page++"><Icon name="ChevronRight" :size="14" /></button>
          </div>
        </div>
      </div>`,
  };

  // ---------- Stepper for wizards ----------
  C.Stepper = {
    props: { steps: Array, current: Number },
    template: `
      <div class="flex items-center gap-3 overflow-x-auto scroll-thin pb-1">
        <template v-for="(s, i) in steps" :key="i">
          <div class="step" :class="{ active: i === current, done: i < current }">
            <span class="num"><Icon v-if="i < current" name="Check" :size="14" /><template v-else>{{ i + 1 }}</template></span>{{ s }}
          </div>
          <div v-if="i < steps.length - 1" class="h-px w-6 md:w-10 bg-gray-200 shrink-0"></div>
        </template>
      </div>`,
  };

  // ---------- Simple key/value list ----------
  C.KeyValue = {
    props: { items: Array }, // [{ label, value }]
    template: `<dl class="kv"><template v-for="it in items" :key="it.label"><dt>{{ it.label }}</dt><dd>{{ it.value || '—' }}</dd></template></dl>`,
  };
})();
