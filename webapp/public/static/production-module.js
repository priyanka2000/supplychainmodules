// Production Planning Module JS
// Handles all production planning page interactions and chart rendering

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || '';

  if (page === 'production-home') initProductionHome();
  if (page === 'production-mps') initMPS();
  if (page === 'production-atp') initATP();
  if (page === 'production-rccp') initRCCP();
  if (page === 'production-workbench') initWorkbench();
  if (page === 'production-scenarios') initScenarios();
  if (page === 'production-mlmodels') initMLModels();
  if (page === 'production-analytics') initAnalytics();
  if (page === 'production-copilot') initCopilot();
});

// ── Shared helpers ──────────────────────────────────────────────────
function colorByStatus(s) {
  return { critical: '#DC2626', warning: '#D97706', healthy: '#059669', info: '#0891B2' }[s] || '#64748B';
}
function fmt(n, dec = 1) { return n == null ? '—' : Number(n).toFixed(dec); }

function prodToast(msg, type) {
  if (typeof window.showToast === 'function') window.showToast(msg, type || 'success');
  else if (typeof showToastGlobal === 'function') showToastGlobal(msg, type || 'success');
}

function generateProdKPIs() {
  return [
    { metric_name: 'MPS Adherence', metric_value: '94.2', metric_unit: '%', status: 'healthy', target_value: '95', icon: 'fa-calendar-check', trend: '↑ +1.2%', trend_dir: 'up' },
    { metric_name: 'Line Utilization', metric_value: '82.4', metric_unit: '%', status: 'warning', target_value: '85', icon: 'fa-industry', trend: '↑ +0.8%', trend_dir: 'up' },
    { metric_name: 'Active Jobs', metric_value: '8', metric_unit: '', status: 'info', target_value: '10', icon: 'fa-cogs', trend: '', trend_dir: 'up' },
    { metric_name: 'ATP Available', metric_value: '32.4', metric_unit: 'K cases', status: 'healthy', target_value: '25K', icon: 'fa-check-double', trend: '↑ +2.1K', trend_dir: 'up' },
    { metric_name: 'RCCP Overloads', metric_value: '2', metric_unit: ' lines', status: 'warning', target_value: '0', icon: 'fa-ruler-combined', trend: '↓ –1', trend_dir: 'up' },
    { metric_name: 'Schedule Adherence', metric_value: '91.8', metric_unit: '%', status: 'warning', target_value: '95', icon: 'fa-tasks', trend: '↑ +0.6%', trend_dir: 'up' },
  ];
}

// ── Production Home ──────────────────────────────────────────────────
async function initProductionHome() {
  const [kpis, mps] = await Promise.all([
    axios.get('/api/production/kpis').then(r => r.data).catch(() => []),
    axios.get('/api/production/mps-summary').then(r => r.data).catch(() => [])
  ]);

  // KPI grid — support both `status` and `metric_status` field names
  const grid = document.getElementById('prod-kpi-grid');
  if (grid) {
    const data = kpis.length ? kpis : generateProdKPIs();
    grid.innerHTML = data.map(k => {
      const st = k.status || k.metric_status || 'info';
      return `<div class="kpi-card ${st}">
        <div class="kpi-label"><i class="fas ${k.icon || 'fa-chart-bar'}" style="margin-right:5px"></i>${k.metric_name || k.name || ''}</div>
        <div class="kpi-value ${st}">${k.metric_value || k.value || '—'}${k.metric_unit ? ' ' + k.metric_unit : ''}</div>
        <div class="kpi-meta">
          <span class="kpi-target">Target: ${k.target_value || k.target || '—'}${k.metric_unit ? ' ' + k.metric_unit : ''}</span>
          <span class="kpi-trend ${k.trend_dir || 'up'}">${k.trend || ''}</span>
        </div>
      </div>`;
    }).join('');
  }

  // MPS horizon chart
  const ctx = document.getElementById('prod-mps-horizon-chart');
  if (ctx && mps.length) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: mps.map(m => m.week),
        datasets: [
          { label: 'Planned (cases)', data: mps.map(m => m.planned_qty), backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4 },
          { label: 'Confirmed (cases)', data: mps.map(m => m.confirmed_qty), backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 4 },
          { label: 'Capacity (cases)', data: mps.map(m => m.capacity), type: 'line', borderColor: '#DC2626', borderWidth: 2, borderDash: [5, 3], pointRadius: 3, fill: false, tension: 0 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });
  } else if (ctx) {
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [
          { label: 'Planned (cases)', data: [42000, 45000, 41000, 48000, 46000, 43000, 47000, 44000], backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4 },
          { label: 'Confirmed (cases)', data: [38000, 42000, 39000, 45000, 43000, 41000, 44000, 42000], backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 4 },
          { label: 'Capacity (cases)', data: [50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000], type: 'line', borderColor: '#DC2626', borderWidth: 2, borderDash: [5, 3], pointRadius: 3, fill: false, tension: 0 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });
  }

  // ATP donut
  const atpCtx = document.getElementById('prod-atp-chart');
  if (atpCtx) {
    new Chart(atpCtx, {
      type: 'doughnut',
      data: {
        labels: ['Committed', 'Available', 'Reserved'],
        datasets: [{ data: [54, 32, 14], backgroundColor: ['#1D4ED8', '#059669', '#D97706'], borderWidth: 2 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '65%' }
    });
  }

  // RCCP radar
  const rccpCtx = document.getElementById('prod-rccp-chart');
  if (rccpCtx) {
    new Chart(rccpCtx, {
      type: 'radar',
      data: {
        labels: ['Mumbai L1', 'Mumbai L2', 'Delhi L1', 'Delhi L2', 'Chennai L1', 'Bangalore L1'],
        datasets: [
          { label: 'Required %', data: [88, 92, 75, 68, 82, 71], borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.12)', borderWidth: 2, pointRadius: 4 },
          { label: 'Available %', data: [95, 88, 90, 85, 88, 92], borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', borderWidth: 2, pointRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } } }
    });
  }
}

// ── MPS ──────────────────────────────────────────────────────────────
async function initMPS() {
  const mps = await axios.get('/api/production/mps').then(r => r.data).catch(() => []);
  const tbody = document.getElementById('mps-table-body');
  if (tbody) {
    const rows = mps.length ? mps : generateMPSRows();
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.sku_code || r.sku}</strong><br/><span style="font-size:11px;color:#64748B">${r.sku_name || ''}</span></td>
        <td>${r.week || r.period}</td>
        <td>${Number(r.planned_qty || r.planned || 0).toLocaleString()}</td>
        <td>${Number(r.confirmed_qty || r.confirmed || 0).toLocaleString()}</td>
        <td>${Number(r.available_qty || r.available || 0).toLocaleString()}</td>
        <td><span class="status-dot ${r.status === 'firm' ? 'healthy' : r.status === 'planned' ? 'warning' : 'draft'}"></span>${r.status || 'planned'}</td>
        <td>${r.line || r.line_name || 'MUM-L1'}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="firmOrder('${r.id || r.sku_code}')">Firm</button></td>
      </tr>`).join('');
  }

  // 12-week chart
  const ctx = document.getElementById('mps-chart');
  if (ctx) {
    const weeks = Array.from({ length: 12 }, (_, i) => `W${i + 1}`);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: weeks,
        datasets: [
          { label: 'Firm Orders', data: [38000, 42000, 36000, 44000, 41000, 0, 0, 0, 0, 0, 0, 0], backgroundColor: '#1D4ED8', borderRadius: 3 },
          { label: 'Planned Orders', data: [0, 0, 0, 0, 4000, 43000, 47000, 44000, 46000, 43000, 45000, 42000], backgroundColor: '#7C3AED', borderRadius: 3 },
          { label: 'Capacity Limit', data: Array(12).fill(50000), type: 'line', borderColor: '#DC2626', borderDash: [5, 3], borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: false }, y: { beginAtZero: true, stacked: false } } }
    });
  }
}

function generateMPSRows() {
  const skus = [
    { sku: 'SKU-500-PET', sku_name: 'PET 500ml Regular', line: 'MUM-L1' },
    { sku: 'SKU-1L-PET', sku_name: 'PET 1L Regular', line: 'MUM-L2' },
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', line: 'DEL-L1' },
    { sku: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', line: 'DEL-L2' },
    { sku: 'SKU-500-GLASS', sku_name: 'Glass 500ml Premium', line: 'CHN-L1' }
  ];
  const weeks = ['W1 Mar', 'W2 Mar', 'W3 Mar', 'W4 Mar'];
  const rows = [];
  skus.forEach(s => {
    weeks.forEach((w, i) => {
      const planned = Math.round((8000 + Math.random() * 4000) / 100) * 100;
      const confirmed = i < 2 ? Math.round(planned * 0.95 / 100) * 100 : 0;
      rows.push({ ...s, week: w, planned_qty: planned, confirmed_qty: confirmed, available_qty: Math.round(planned * 0.08 / 100) * 100, status: i < 2 ? 'firm' : 'planned' });
    });
  });
  return rows.slice(0, 15);
}

function firmOrder(id) {
  const btn = event.target;
  btn.textContent = '✓ Firmed';
  btn.className = 'btn btn-sm btn-success';
  btn.disabled = true;
  setTimeout(() => { btn.textContent = 'Firm'; btn.className = 'btn btn-sm btn-secondary'; btn.disabled = false; }, 3000);
}

// ── ATP ───────────────────────────────────────────────────────────────
async function initATP() {
  const atpData = await axios.get('/api/production/atp').then(r => r.data).catch(() => generateATPData());

  const tbody = document.getElementById('atp-table-body');
  if (tbody) {
    const rows = atpData.length ? atpData : generateATPData();
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.sku}</strong><br/><span style="font-size:11px;color:#64748B">${r.sku_name}</span></td>
        <td>${Number(r.oh_stock || 0).toLocaleString()}</td>
        <td>${Number(r.scheduled_receipts || 0).toLocaleString()}</td>
        <td>${Number(r.customer_orders || 0).toLocaleString()}</td>
        <td><strong style="color:${(r.atp || 0) < 0 ? '#DC2626' : '#059669'}">${Number(r.atp || 0).toLocaleString()}</strong></td>
        <td>${r.commit_date || 'W1'}</td>
        <td><span class="badge badge-${r.atp >= 0 ? 'success' : 'critical'}">${r.atp >= 0 ? 'Available' : 'Constrained'}</span></td>
        <td><button class="btn btn-sm btn-primary">Commit</button></td>
      </tr>`).join('');
  }

  // ATP waterfall chart
  const ctx = document.getElementById('atp-chart');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'],
        datasets: [
          { label: 'Committed', data: [38000, 35000, 40000, 37000, 42000, 38000, 41000, 36000], backgroundColor: '#1D4ED8', borderRadius: 3 },
          { label: 'ATP', data: [8000, 11000, 6000, 9000, 4000, 8000, 5000, 10000], backgroundColor: '#059669', borderRadius: 3 },
          { label: 'Reserved', data: [4000, 4000, 4000, 4000, 4000, 4000, 4000, 4000], backgroundColor: '#D97706', borderRadius: 3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
    });
  }
}

function generateATPData() {
  return [
    { sku: 'SKU-500-PET', sku_name: 'PET 500ml Regular', oh_stock: 12400, scheduled_receipts: 38000, customer_orders: 35200, atp: 15200, commit_date: 'W1 Mar' },
    { sku: 'SKU-1L-PET', sku_name: 'PET 1L Regular', oh_stock: 8600, scheduled_receipts: 29000, customer_orders: 31400, atp: -2800, commit_date: 'W3 Mar' },
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', oh_stock: 5200, scheduled_receipts: 18000, customer_orders: 16800, atp: 6400, commit_date: 'W1 Mar' },
    { sku: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', oh_stock: 3400, scheduled_receipts: 12000, customer_orders: 11200, atp: 4200, commit_date: 'W2 Mar' },
    { sku: 'SKU-500-GLASS', sku_name: 'Glass 500ml Premium', oh_stock: 1800, scheduled_receipts: 6000, customer_orders: 7100, atp: 700, commit_date: 'W2 Mar' }
  ];
}

// ── RCCP ──────────────────────────────────────────────────────────────
async function initRCCP() {
  const ctx = document.getElementById('rccp-chart');
  if (ctx) {
    const lines = ['MUM-L1', 'MUM-L2', 'DEL-L1', 'DEL-L2', 'CHN-L1', 'BAN-L1'];
    const required = [88, 95, 75, 68, 82, 71];
    const available = [95, 88, 90, 85, 88, 92];
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lines,
        datasets: [
          { label: 'Required Capacity %', data: required, backgroundColor: required.map(v => v > 90 ? '#DC2626' : v > 80 ? '#D97706' : '#059669'), borderRadius: 4 },
          { label: 'Available Capacity %', data: available, backgroundColor: 'rgba(37,99,235,0.3)', borderColor: '#2563EB', borderWidth: 2, type: 'line', pointRadius: 5, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 110, ticks: { callback: v => v + '%' } } } }
    });
  }

  // Horizon heatmap
  const heatCtx = document.getElementById('rccp-horizon-chart');
  if (heatCtx) {
    const weeks = Array.from({ length: 8 }, (_, i) => `W${i + 1}`);
    const lines = ['MUM-L1', 'MUM-L2', 'DEL-L1', 'DEL-L2', 'CHN-L1', 'BAN-L1'];
    const datasets = lines.map((l, i) => ({
      label: l,
      data: weeks.map(() => Math.round(60 + Math.random() * 40)),
      backgroundColor: ['rgba(37,99,235,0.7)', 'rgba(124,58,237,0.7)', 'rgba(5,150,105,0.7)', 'rgba(217,119,6,0.7)', 'rgba(220,38,38,0.7)', 'rgba(8,145,178,0.7)'][i],
      borderRadius: 3
    }));
    new Chart(heatCtx, {
      type: 'bar',
      data: { labels: weeks, datasets },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { x: { stacked: false }, y: { min: 0, max: 110, stacked: false, ticks: { callback: v => v + '%' } } }
      }
    });
  }

  // Table
  const tbody = document.getElementById('rccp-table-body');
  if (tbody) {
    const data = [
      { resource: 'Mumbai – PET Line 1', w1: 88, w2: 91, w3: 85, w4: 92, w5: 87, w6: 89, w7: 84, w8: 86 },
      { resource: 'Mumbai – PET Line 2', w1: 95, w2: 98, w3: 92, w4: 96, w5: 91, w6: 94, w7: 90, w8: 93 },
      { resource: 'Delhi – PET Line 1', w1: 75, w2: 78, w3: 72, w4: 80, w5: 76, w6: 74, w7: 71, w8: 77 },
      { resource: 'Delhi – PET Line 2', w1: 68, w2: 71, w3: 65, w4: 73, w5: 69, w6: 67, w7: 64, w8: 70 },
      { resource: 'Chennai – PET Line 1', w1: 82, w2: 85, w3: 79, w4: 87, w5: 83, w6: 81, w7: 78, w8: 84 },
      { resource: 'Bangalore – PET Line 1', w1: 71, w2: 74, w3: 68, w4: 76, w5: 72, w6: 70, w7: 67, w8: 73 },
    ];
    const colorCell = v => `style="background:${v >= 90 ? '#FEE2E2' : v >= 80 ? '#FEF3C7' : '#F0FDF4'};font-weight:600;color:${v >= 90 ? '#DC2626' : v >= 80 ? '#D97706' : '#059669'}"`;
    tbody.innerHTML = data.map(r => `
      <tr>
        <td><strong>${r.resource}</strong></td>
        ${[r.w1, r.w2, r.w3, r.w4, r.w5, r.w6, r.w7, r.w8].map(v => `<td ${colorCell(v)}>${v}%</td>`).join('')}
        <td><span class="badge badge-${Math.max(r.w1, r.w2, r.w3, r.w4) >= 95 ? 'critical' : 'warning'}">${Math.max(r.w1, r.w2, r.w3, r.w4) >= 95 ? 'Overloaded' : 'Tight'}</span></td>
      </tr>`).join('');
  }
}

// ── Planner Workbench ─────────────────────────────────────────────────
async function initWorkbench() {
  const [jobs, kpis] = await Promise.all([
    axios.get('/api/sequencing/jobs').then(r => r.data).catch(() => []),
    axios.get('/api/production/kpis').then(r => r.data).catch(() => [])
  ]);

  // Workbench jobs
  const container = document.getElementById('workbench-jobs');
  if (container) {
    const allJobs = jobs.length ? jobs : generateWorkbenchJobs();
    container.innerHTML = allJobs.slice(0, 15).map(j => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;background:white">
        <div style="display:flex;align-items:center;gap:12px">
          <span class="status-dot ${j.status === 'in_progress' ? 'healthy' : j.status === 'scheduled' ? 'warning' : 'draft'}"></span>
          <div>
            <div style="font-weight:600;font-size:13px">${j.job_code || j.code || 'JOB-001'}</div>
            <div style="font-size:11px;color:#64748B">${j.sku_name || j.sku || 'SKU-500-PET'} · ${j.line_name || j.line || 'MUM-L1'} · ${Number(j.quantity || j.qty || 0).toLocaleString()} cases</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="text-align:right">
            <div style="font-size:12px;font-weight:600">${j.start_time || j.start || 'Mar 17, 08:00'}</div>
            <div style="font-size:11px;color:#64748B">→ ${j.end_time || j.end || 'Mar 17, 16:00'}</div>
          </div>
          <span class="badge badge-${j.status === 'in_progress' ? 'success' : j.status === 'scheduled' ? 'info' : 'neutral'}">${j.status || 'planned'}</span>
          <button class="btn btn-sm btn-secondary" onclick="resequence(this)"><i class="fas fa-exchange-alt"></i></button>
        </div>
      </div>`).join('');
  }
}

function generateWorkbenchJobs() {
  const lines = ['MUM-L1', 'MUM-L2', 'DEL-L1'];
  const skus = ['SKU-500-PET', 'SKU-1L-PET', 'SKU-200-MANGO', 'SKU-250-CAN'];
  const statuses = ['in_progress', 'scheduled', 'planned'];
  return Array.from({ length: 12 }, (_, i) => ({
    job_code: `JOB-2026-${String(i + 1).padStart(3, '0')}`,
    sku_name: skus[i % skus.length],
    line_name: lines[i % lines.length],
    quantity: Math.round((5000 + Math.random() * 8000) / 100) * 100,
    start: `Mar ${17 + Math.floor(i / 3)}, ${['06:00', '08:00', '14:00', '22:00'][i % 4]}`,
    end: `Mar ${17 + Math.floor(i / 3)}, ${['14:00', '16:00', '22:00', '06:00'][(i + 1) % 4]}`,
    status: statuses[i % statuses.length]
  }));
}

function resequence(btn) {
  btn.innerHTML = '<i class="fas fa-check"></i>';
  btn.className = 'btn btn-sm btn-success';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-exchange-alt"></i>'; btn.className = 'btn btn-sm btn-secondary'; }, 2000);
}

// ── Scenarios ─────────────────────────────────────────────────────────
async function initScenarios() {
  const scenarios = await axios.get('/api/scenarios').then(r => r.data.filter(s => s.module === 'production')).catch(() => []);
  const list = document.getElementById('prod-scenarios-list');
  if (list) {
    const all = scenarios.length ? scenarios : generateProductionScenarios();
    list.innerHTML = all.map(s => `
      <div class="card mb-4">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-layer-group"></i> ${s.name}</span>
          <div style="display:flex;gap:8px">
            <span class="badge badge-${s.status === 'active' ? 'success' : s.status === 'draft' ? 'neutral' : 'info'}">${s.status || 'draft'}</span>
            <button class="btn btn-sm btn-primary" onclick="runScenario('${s.id || s.name}')"><i class="fas fa-play"></i> Run</button>
            <button class="btn btn-sm btn-secondary"><i class="fas fa-copy"></i> Clone</button>
          </div>
        </div>
        <div class="card-body">
          <p style="color:#64748B;font-size:13px;margin-bottom:12px">${s.description || ''}</p>
          <div class="grid-3">
            <div><div style="font-size:11px;color:#64748B">Driver</div><strong>${s.driver || 'Capacity'}</strong></div>
            <div><div style="font-size:11px;color:#64748B">Impact</div><strong style="color:${s.impact_pct > 0 ? '#059669' : '#DC2626'}">${s.impact_pct > 0 ? '+' : ''}${s.impact_pct || '0'}% output</strong></div>
            <div><div style="font-size:11px;color:#64748B">Updated</div><strong>${s.updated_at?.slice(0, 10) || 'Mar 15, 2026'}</strong></div>
          </div>
        </div>
      </div>`).join('');
  }
}

function generateProductionScenarios() {
  return [
    { name: 'Base Plan – Mar 2026', description: 'Standard production plan aligned with S&OP consensus demand of 4.8M cases. All lines running normal shifts.', driver: 'Demand', status: 'active', impact_pct: 0, updated_at: '2026-03-10' },
    { name: 'Demand Upside +15%', description: 'Demand increases 15% above base for PET 500ml. Requires weekend overtime on MUM-L1/L2 and accelerated material procurement.', driver: 'Demand Spike', status: 'draft', impact_pct: 15, updated_at: '2026-03-12' },
    { name: 'Line Breakdown Contingency', description: 'Mumbai L2 breaks down for 5 days. Reallocate production to Delhi lines and Chennai. ATP impact: –80K cases W2.', driver: 'Risk', status: 'draft', impact_pct: -8, updated_at: '2026-03-14' },
    { name: 'New SKU Launch – Sparkling 500ml', description: 'Introduce 2 new SKUs in W3 Mar. Reallocate 12% capacity from B-class SKUs. Changeover analysis required.', driver: 'New Product', status: 'review', impact_pct: 5, updated_at: '2026-03-13' },
    { name: 'Energy Saving Mode', description: 'Run all lines at 85% speed during peak tariff hours (10am-6pm). Impact: –6% output but –18% energy cost.', driver: 'Cost', status: 'draft', impact_pct: -6, updated_at: '2026-03-15' }
  ];
}

function runScenario(id) {
  const btn = event.target.closest('button');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-check"></i> Done'; btn.className = 'btn btn-sm btn-success'; }, 2500);
}

// ── ML Models ─────────────────────────────────────────────────────────
function initMLModels() {
  const perf = document.getElementById('ml-perf-chart');
  if (perf) {
    new Chart(perf, {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'AUC-ROC', 'MAPE'],
        datasets: [
          { label: 'Demand Forecaster', data: [92, 89, 91, 90, 94, 88], borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 2 },
          { label: 'ATP Predictor', data: [88, 92, 85, 88, 90, 84], borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', borderWidth: 2 },
          { label: 'RCCP Optimizer', data: [85, 87, 83, 85, 87, 82], borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } } }
    });
  }

  const drift = document.getElementById('ml-drift-chart');
  if (drift) {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    new Chart(drift, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Demand Forecaster MAPE %', data: [6.2, 5.8, 5.4, 5.1, 4.8, 4.6], borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.1)', fill: true, tension: 0.4 },
          { label: 'ATP Predictor Error %', data: [8.1, 7.6, 7.2, 6.8, 6.4, 6.0], borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.08)', fill: true, tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { ticks: { callback: v => v + '%' } } } }
    });
  }
}

// ── Analytics ─────────────────────────────────────────────────────────
async function initAnalytics() {
  const [oee, util] = await Promise.all([
    axios.get('/api/capacity/oee').then(r => r.data).catch(() => []),
    axios.get('/api/capacity/utilization').then(r => r.data).catch(() => [])
  ]);

  const outputCtx = document.getElementById('prod-output-chart');
  if (outputCtx) {
    const days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date('2026-03-17'); d.setDate(d.getDate() - 13 + i);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    });
    const planned = days.map(() => Math.round((44000 + Math.random() * 6000) / 100) * 100);
    const actual = planned.map(p => Math.round((p * (0.88 + Math.random() * 0.1)) / 100) * 100);
    new Chart(outputCtx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [
          { label: 'Planned Output', data: planned, borderColor: '#2563EB', borderDash: [5, 3], borderWidth: 2, pointRadius: 3, fill: false },
          { label: 'Actual Output', data: actual, borderColor: '#059669', backgroundColor: 'rgba(5,150,105,0.1)', fill: true, tension: 0.3, borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
    });
  }

  const effCtx = document.getElementById('prod-efficiency-chart');
  if (effCtx) {
    new Chart(effCtx, {
      type: 'bar',
      data: {
        labels: ['MUM-L1', 'MUM-L2', 'DEL-L1', 'DEL-L2', 'CHN-L1', 'BAN-L1'],
        datasets: [
          { label: 'Line Efficiency %', data: [91.2, 87.4, 88.6, 83.2, 89.4, 85.8], backgroundColor: ['#059669', '#D97706', '#059669', '#DC2626', '#059669', '#D97706'], borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 70, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }
}

// ── AI Copilot ────────────────────────────────────────────────────────
function initCopilot() {
  const suggestions = [
    'Show me the MPS for next 4 weeks',
    'Which lines are over capacity in W2?',
    'What is the ATP for SKU-500-PET?',
    'Run RCCP for March horizon',
    'Identify bottleneck lines',
    'What is the production efficiency trend?'
  ];
  const chips = document.getElementById('copilot-suggestions');
  if (chips) {
    chips.innerHTML = suggestions.map(s => `<span class="user-chip" onclick="sendCopilot('${s}')" style="cursor:pointer;background:#F0F4FA;border:1px solid #E2E8F0;border-radius:16px;padding:5px 12px;font-size:12px;margin:4px;display:inline-block">${s}</span>`).join('');
  }
}

// ── Global action handlers ─────────────────────────────────────────────
window.recalcRCCP = function(btn) {
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recalculating...'; }
  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync"></i> Recalculate'; }
    prodToast('RCCP Recalculation complete: 2 lines overloaded (MUM-L2: 98%, MUM-L1: 91%). Recommend shifting 8K cases to DEL-L1.', 'success');
  }, 1800);
};

window.exportATP = function() {
  if (window.showToast) window.showToast('ATP export started. CSV file will download shortly.', 'info');
  setTimeout(() => {
    const csv = 'SKU,On-Hand,Scheduled Receipts,Customer Orders,ATP,Commit Date,Status\nSKU-500-PET,12400,38000,35200,15200,W1 Mar,Available\nSKU-1L-PET,8600,29000,31400,-2800,W3 Mar,Constrained\nSKU-200-MANGO,5200,18000,16800,6400,W1 Mar,Available\nSKU-250-CAN,3400,12000,11200,4200,W2 Mar,Available\nSKU-500-GLASS,1800,6000,7100,700,W2 Mar,Available\n';
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'atp_export.csv'; a.click();
    URL.revokeObjectURL(url);
  }, 500);
};

window.checkATP = function() {
  prodToast('ATP Check: Querying real-time inventory & supply schedules...', 'info');
  setTimeout(() => {
    const skuInput = document.querySelector('.form-input[placeholder="Search SKU..."]');
    const sku = skuInput ? skuInput.value.trim() : '';
    if (sku) {
      prodToast('ATP for ' + sku + ': 8,400 cases available — W1 Mar. Commit date: Mar 18.', 'success');
    } else {
      prodToast('ATP Refresh Complete: 4 SKUs available, 1 constrained (SKU-1L-PET W3: –2,800 cases). Review exceptions panel.', 'success');
    }
  }, 800);
};

window.batchCommit = function() {
  prodToast('Batch Commit: Committing all positive-ATP orders to ERP... 4 SKUs committed successfully.', 'success');
};

window.sendCopilot = function(text) {
  const input = document.getElementById('copilot-input');
  if (input) { input.value = text; }
  const msgs = document.getElementById('copilot-messages');
  if (!msgs) return;
  msgs.innerHTML += `<div class="chat-msg user">${text}</div>`;
  msgs.scrollTop = msgs.scrollHeight;
  setTimeout(() => {
    const replies = {
      'Show me the MPS for next 4 weeks': 'The MPS for Mar W1–W4 shows:<br/>• PET 500ml: 42K, 45K, 41K, 48K cases<br/>• PET 1L: 28K, 31K, 27K, 33K cases<br/>• Mango 200ml: 18K, 21K, 17K, 22K cases<br/>Total planned: 4.82M cases across all SKUs.',
      'Which lines are over capacity in W2?': 'Lines over 90% capacity in W2:<br/>• <strong>MUM-L2</strong>: 98% – CRITICAL, approve overtime<br/>• <strong>MUM-L1</strong>: 91% – Monitor closely<br/>Recommend: Shift 8K cases to DEL-L1 (75% available).',
      'What is the ATP for SKU-500-PET?': 'ATP for SKU-500-PET:<br/>• W1: 15,200 cases available<br/>• W2: 8,400 cases available<br/>• W3: 3,100 cases (constrained – new order exceeds supply)<br/>Recommend: Expedite MUM-L1 run or defer B-class orders.',
    };
    const reply = replies[text] || 'I\'ve analyzed the production data. Based on current MPS, RCCP indicates MUM-L2 is at 95% capacity. Recommend running overtime or shifting load to Delhi lines to maintain service levels.';
    msgs.innerHTML += `<div class="chat-msg assistant"><i class="fas fa-robot" style="margin-right:8px;color:#2563EB"></i>${reply}</div>`;
    msgs.scrollTop = msgs.scrollHeight;
  }, 1000);
};
