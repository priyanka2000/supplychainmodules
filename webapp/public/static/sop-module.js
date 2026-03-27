// ======================================================
// SYDIAI S&OP Planning Module JS
// Demand/Supply review, consensus, scenarios
// ======================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('sop-kpi-grid')) await loadSOPKPIs();
  if (document.getElementById('sop-waterfall-chart')) await loadSOPWaterfall();
  if (document.getElementById('sop-demand-chart')) await loadDemandChart();
  if (document.getElementById('sop-supply-chart')) loadSupplyChart();
  if (document.getElementById('sop-scenarios-table')) await loadScenariosTable();
  if (document.getElementById('sop-kpi-table')) await loadKPITable();
  if (document.getElementById('sop-consensus-chart')) loadConsensusChart();
  if (document.getElementById('sop-forecast-accuracy-chart')) loadForecastAccuracyChart();
  if (document.getElementById('sop-gap-chart')) loadGapChart();
  if (document.getElementById('sop-actions-table')) await loadActionsTable();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadSOPKPIs() {
  const grid = document.getElementById('sop-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/sop/kpis');
    const kpis = Array.isArray(res.data) ? res.data : [];
    const icons = {
      'Demand': 'fa-chart-area',
      'Supply': 'fa-industry',
      'Inventory': 'fa-boxes',
      'Financial': 'fa-rupee-sign',
      'Service': 'fa-bullseye'
    };
    const display = kpis.slice(0,8);
    grid.innerHTML = display.map(k => {
      const sc = (k.value < k.target * 0.9) ? (k.trend==='down'?'critical':'warning') : 'healthy';
      const icon = icons[k.category]||'fa-chart-bar';
      const trend = k.trend==='up'?'▲':k.trend==='down'?'▼':'→';
      const tColor = k.trend==='up'?'#059669':k.trend==='down'?'#DC2626':'#D97706';
      const gap = k.target ? ((k.value - k.target) / k.target * 100).toFixed(1) : 0;
      return `<div class="kpi-card ${sc}">
        <div class="kpi-label" style="font-size:0.7rem;color:#64748B">${k.category?.toUpperCase()||'KPI'}</div>
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.name}</div>
        <div class="kpi-value ${sc}">${k.value}<span style="font-size:0.65rem"> ${k.unit||''}</span></div>
        <div class="kpi-meta">
          <span class="kpi-target">Target: ${k.target} ${k.unit||''}</span>
          <span style="color:${tColor};font-weight:700">${trend} ${Math.abs(gap)}%</span>
        </div>
      </div>`;
    }).join('');
  } catch(e) { grid.innerHTML = '<p style="color:#64748B;padding:20px;text-align:center">Error loading KPIs</p>'; }
}

// ── S&OP Waterfall: Revenue Plan ──────────────────────────────────────────────
async function loadSOPWaterfall() {
  const ctx = document.getElementById('sop-waterfall-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Annual Plan', 'Q1 Actual', 'Q2 Forecast', 'Q3 Forecast', 'Q4 Forecast', 'YE Forecast'],
      datasets: [{
        label: 'Revenue (₹ Cr)',
        data: [480, 112, 124, 136, 128, 500],
        backgroundColor: ['rgba(37,99,235,0.8)', 'rgba(5,150,105,0.8)', 'rgba(5,150,105,0.7)', 'rgba(217,119,6,0.7)', 'rgba(37,99,235,0.7)', 'rgba(124,58,237,0.85)'],
        borderRadius: 5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ₹${ctx.raw} Cr` } }
      },
      scales: {
        y: { min: 80, title: { display: true, text: '₹ Crore' }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
}

// ── Demand vs Supply Plan Chart ────────────────────────────────────────────────
async function loadDemandChart() {
  const ctx = document.getElementById('sop-demand-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/sop/forecast');
    let data = res.data.slice(0, 10);
    if (!data.length) {
      data = [
        {period:'W1 Jan',forecast_qty:1080000,actual_qty:1052000,confidence_level:0.88},{period:'W2 Jan',forecast_qty:1120000,actual_qty:1105000,confidence_level:0.86},
        {period:'W3 Jan',forecast_qty:1090000,actual_qty:1078000,confidence_level:0.89},{period:'W4 Jan',forecast_qty:1150000,actual_qty:1132000,confidence_level:0.87},
        {period:'W1 Feb',forecast_qty:1180000,actual_qty:1164000,confidence_level:0.91},{period:'W2 Feb',forecast_qty:1160000,actual_qty:1148000,confidence_level:0.90},
        {period:'W1 Mar',forecast_qty:1250000,actual_qty:1235000,confidence_level:0.92},{period:'W2 Mar',forecast_qty:1230000,actual_qty:null,confidence_level:0.85},
        {period:'W3 Mar',forecast_qty:1280000,actual_qty:null,confidence_level:0.83},{period:'W4 Mar',forecast_qty:1310000,actual_qty:null,confidence_level:0.80},
      ];
    }
    const labels = data.map(d => d.period||'');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Demand Forecast', data: data.map(d=>d.forecast_qty), backgroundColor:'rgba(37,99,235,0.75)', borderRadius:4 },
          { label: 'Actual Demand', data: data.map(d=>d.actual_qty||null), backgroundColor:'rgba(5,150,105,0.75)', borderRadius:4 },
          { label: 'Confidence Band (High)', data: data.map(d=>(d.forecast_qty||0)*(1+(1-Math.min(0.99,(d.confidence_level||0.8)))*0.5)), type:'line', borderColor:'rgba(37,99,235,0.3)', fill:'+1', tension:0.4, borderWidth:1, pointRadius:0 },
          { label: 'Confidence Band (Low)', data: data.map(d=>(d.forecast_qty||0)*(1-(1-Math.min(0.99,(d.confidence_level||0.8)))*0.5)), type:'line', borderColor:'rgba(37,99,235,0.3)', fill:false, tension:0.4, borderWidth:1, pointRadius:0, backgroundColor:'rgba(37,99,235,0.05)' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: { legend: { position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales: {
          y: { beginAtZero:true, ticks:{ callback: v=>v>=1000?Math.round(v/1000)+'k':v }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x: { ticks:{ font:{size:10}, maxRotation:35 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Demand chart', e); }
}

// ── Supply vs Demand Gap ───────────────────────────────────────────────────────
function loadSupplyChart() {
  const ctx = document.getElementById('sop-supply-chart');
  if (!ctx) return;
  const weeks = ['W25','W26','W27','W28','W29','W30','W31','W32'];
  const demand = [48000, 52000, 55000, 49000, 51000, 58000, 60000, 56000];
  const supply = [47000, 51000, 52000, 49000, 50000, 55000, 57000, 54000];
  const capacity = [62000, 62000, 62000, 62000, 62000, 62000, 62000, 62000];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        { label: 'Demand Plan', data: demand, borderColor:'#DC2626', backgroundColor:'rgba(220,38,38,0.06)', fill:true, tension:0.3, borderWidth:2.5, pointRadius:4 },
        { label: 'Supply Plan', data: supply, borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.06)', fill:true, tension:0.3, borderWidth:2.5, pointRadius:4 },
        { label: 'Capacity Ceiling', data: capacity, borderColor:'#064E3B', borderDash:[6,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { position:'top', labels:{ font:{size:11}, boxWidth:12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.raw.toLocaleString()} cases` } }
      },
      scales: {
        y: { beginAtZero:false, ticks:{ callback: v=>Math.round(v/1000)+'k' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Scenarios Table ────────────────────────────────────────────────────────────
async function loadScenariosTable() {
  const tbody = document.getElementById('sop-scenarios-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/sop/scenarios');
    const scenarios = res.data;
    tbody.innerHTML = scenarios.map(s => {
      const stColor = s.status==='approved'?'healthy':s.status==='draft'?'warning':s.status==='rejected'?'critical':'info';
      const isBaseline = s.is_baseline;
      return `<tr${isBaseline?' style="background:#EFF6FF"':''}>
        <td><strong>${s.name}</strong>${isBaseline?'<span class="badge badge-info" style="margin-left:6px;font-size:10px">Baseline</span>':''}</td>
        <td>${s.module||'S&OP'}</td>
        <td>${s.driver||'—'}</td>
        <td style="font-size:0.78rem;color:#64748B">${s.description||'—'}</td>
        <td><span class="badge badge-${stColor}">${s.status}</span></td>
        <td style="font-size:0.78rem;color:#64748B">${s.updated_at?s.updated_at.slice(0,10):'—'}</td>
        <td>
          <button style="background:none;border:1px solid #E2E8F0;border-radius:6px;padding:3px 10px;cursor:pointer;color:#1E3A8A;font-size:11px" onclick="window.showToast('Loading scenario: ${s.name}','success')">
            View
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:20px">Error loading scenarios</td></tr>'; }
}

// ── KPI Summary Table ──────────────────────────────────────────────────────────
async function loadKPITable() {
  const tbody = document.getElementById('sop-kpi-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/sop/kpis');
    const kpis = Array.isArray(res.data) ? res.data : [];
    tbody.innerHTML = kpis.map(k => {
      const gap = k.target ? k.value - k.target : 0;
      const pct = k.target ? (k.value / k.target * 100).toFixed(1) : 100;
      const st = pct >= 95 ? 'healthy' : pct >= 85 ? 'warning' : 'critical';
      const trend = k.trend==='up'?'<span style="color:#059669">▲ Up</span>':k.trend==='down'?'<span style="color:#DC2626">▼ Down</span>':'<span style="color:#D97706">→ Stable</span>';
      return `<tr>
        <td><span style="font-size:0.7rem;background:#EFF6FF;color:#2563EB;padding:1px 6px;border-radius:4px">${k.category}</span> ${k.name}</td>
        <td style="text-align:right;font-weight:700">${k.value} ${k.unit||''}</td>
        <td style="text-align:right;color:#64748B">${k.target} ${k.unit||''}</td>
        <td style="text-align:right;color:${gap>=0?'#059669':'#DC2626'};font-weight:600">${gap>=0?'+':''}${gap.toFixed(1)} ${k.unit||''}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="progress-bar-track" style="width:60px"><div class="progress-bar-fill ${st}" style="width:${Math.min(100,pct)}%"></div></div>
            <span style="font-size:0.75rem;color:#64748B">${pct}%</span>
          </div>
        </td>
        <td>${trend}</td>
        <td style="font-size:0.78rem;color:#64748B">${k.period||'2026-03'}</td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:20px">Error loading KPIs</td></tr>'; }
}

// ── Consensus Plan Chart ───────────────────────────────────────────────────────
function loadConsensusChart() {
  const ctx = document.getElementById('sop-consensus-chart');
  if (!ctx) return;
  const months = ['Jan','Feb','Mar','Apr','May','Jun'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Sales Input', data: [52000, 54000, 58000, 61000, 65000, 68000], backgroundColor:'rgba(37,99,235,0.6)', borderRadius:4 },
        { label: 'Operations Input', data: [50000, 52000, 55000, 58000, 62000, 64000], backgroundColor:'rgba(124,58,237,0.6)', borderRadius:4 },
        { label: 'Finance Input', data: [48000, 51000, 54000, 57000, 60000, 63000], backgroundColor:'rgba(8,145,178,0.6)', borderRadius:4 },
        { label: 'Consensus Plan', data: [50500, 52500, 56000, 59000, 62500, 65000], type:'line', borderColor:'#DC2626', backgroundColor:'transparent', borderWidth:2.5, pointRadius:5, tension:0.3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend: { position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { beginAtZero:false, ticks:{ callback: v=>Math.round(v/1000)+'k' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Forecast Accuracy Trend ────────────────────────────────────────────────────
function loadForecastAccuracyChart() {
  const ctx = document.getElementById('sop-forecast-accuracy-chart');
  if (!ctx) return;
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Forecast Accuracy %', data: [83.1, 85.2, 82.8, 86.4, 87.3, 87.8], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:5 },
        { label: 'MAPE (error)', data: [16.9, 14.8, 17.2, 13.6, 12.7, 12.2], borderColor:'#DC2626', backgroundColor:'transparent', fill:false, tension:0.4, borderWidth:2, pointRadius:4, borderDash:[4,3] },
        { label: 'Target 90%', data: months.map(()=>90), borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend: { position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { min: 0, max: 100, ticks: { callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Demand-Supply Gap by Category ─────────────────────────────────────────────
function loadGapChart() {
  const ctx = document.getElementById('sop-gap-chart');
  if (!ctx) return;
  const categories = ['PET Bottles','Cans','Glass','Tetra Pak','Powder Mix'];
  const gaps = [2000, -1500, 800, -500, 1200]; // + = excess supply, - = shortfall
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Supply vs Demand Gap (cases)',
        data: gaps,
        backgroundColor: gaps.map(g => g > 0 ? 'rgba(5,150,105,0.75)' : 'rgba(220,38,38,0.75)'),
        borderRadius: 5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.raw > 0 ? 'Surplus:' : 'Shortfall:'} ${Math.abs(ctx.raw).toLocaleString()} cases` } }
      },
      scales: {
        y: { title: { display: true, text: 'Cases (+ surplus, – shortfall)' }, ticks: { callback: v => v>=0?'+'+v.toLocaleString():v.toLocaleString() }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Action Items Table ─────────────────────────────────────────────────────────
async function loadActionsTable() {
  const tbody = document.getElementById('sop-actions-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/action-items');
    const items = (res.data.data || res.data).filter(a => a.module === 'sop' || !a.module).slice(0, 8);
    if (!items.length) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:20px">No action items</td></tr>'; return; }
    tbody.innerHTML = items.map(a => {
      const prColor = a.priority==='critical'||a.priority==='high'?'critical':a.priority==='medium'?'warning':'info';
      const stColor = a.status==='completed'?'healthy':a.status==='overdue'?'critical':a.status==='in_progress'?'info':'warning';
      const due = a.due_date ? a.due_date.slice(0,10) : '—';
      const now = new Date();
      const dueDate = new Date(a.due_date);
      const daysLeft = a.due_date ? Math.round((dueDate - now) / 86400000) : null;
      return `<tr>
        <td><strong>${a.title}</strong><br><small style="color:#64748B">${(a.description||'').slice(0,60)}${a.description?.length>60?'...':''}</small></td>
        <td>${a.owner||'—'}</td>
        <td style="font-size:0.78rem">${due}${daysLeft!==null?`<br><small style="color:${daysLeft<0?'#DC2626':daysLeft<3?'#D97706':'#64748B'}">${daysLeft<0?'Overdue '+Math.abs(daysLeft)+'d':daysLeft+'d left'}</small>`:''}</td>
        <td><span class="badge badge-${prColor}">${a.priority}</span></td>
        <td><span class="badge badge-${stColor}">${a.status}</span></td>
        <td>${(a.module||'S&OP').toUpperCase()}</td>
        <td>
          <button style="background:none;border:1px solid #E2E8F0;border-radius:6px;padding:3px 10px;cursor:pointer;color:#059669;font-size:11px" onclick="window.showToast('Action item updated','success')">
            Update
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:20px">Error loading actions</td></tr>'; }
}
