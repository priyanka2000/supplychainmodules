// ======================================================
// SYDIAI Inventory Planning Module JS
// ABC classification, stock positions, replenishment
// ======================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('inv-kpi-grid')) await loadInvKPIs();
  if (document.getElementById('inv-stock-chart')) await loadStockChart();
  if (document.getElementById('inv-abc-chart')) loadABCChart();
  if (document.getElementById('inv-dos-chart')) await loadDOSChart();
  if (document.getElementById('inv-stock-table')) await loadStockTable();
  if (document.getElementById('inv-turnover-chart')) loadTurnoverChart();
  if (document.getElementById('inv-coverage-chart')) loadCoverageChart();
  if (document.getElementById('inv-replenishment-chart')) loadReplenishmentChart();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadInvKPIs() {
  const grid = document.getElementById('inv-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/inventory/kpis');
    const kpis = res.data;
    const icons = {
      'Total SKUs Tracked': 'fa-boxes',
      'Stockout Risk': 'fa-exclamation-circle',
      'Excess Inventory': 'fa-layer-group',
      'Avg Days of Supply': 'fa-calendar-alt',
      'Inventory Turns': 'fa-sync-alt',
      'Service Level': 'fa-bullseye'
    };
    grid.innerHTML = kpis.map(k => {
      const sc = k.status==='healthy'?'healthy':k.status==='critical'?'critical':'warning';
      const icon = icons[k.name]||'fa-chart-bar';
      return `<div class="kpi-card ${sc}">
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.name}</div>
        <div class="kpi-value ${sc}">${k.value}<span style="font-size:0.65rem"> ${k.unit||''}</span></div>
        ${k.target!==undefined?`<div class="kpi-meta"><span class="kpi-target">Target: ${k.target} ${k.unit||''}</span></div>`:''}
      </div>`;
    }).join('');
  } catch(e) { grid.innerHTML = '<p style="color:#64748B;padding:20px;text-align:center">Error loading KPIs</p>'; }
}

// ── Stock Position Bar Chart ───────────────────────────────────────────────────
async function loadStockChart() {
  const ctx = document.getElementById('inv-stock-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/inventory/stock');
    const stocks = res.data;
    const labels = stocks.map(s => s.sku_name ? s.sku_name.slice(0,12) : 'SKU-'+s.sku_id);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'On Hand', data: stocks.map(s=>s.on_hand_qty), backgroundColor:'rgba(37,99,235,0.8)', borderRadius:4 },
          { label: 'Reserved', data: stocks.map(s=>s.reserved_qty), backgroundColor:'rgba(124,58,237,0.6)', borderRadius:4 },
          { label: 'In Transit', data: stocks.map(s=>s.in_transit_qty), backgroundColor:'rgba(8,145,178,0.6)', borderRadius:4 },
          { label: 'Safety Stock', data: stocks.map(s=>s.safety_stock), type:'line', borderColor:'#DC2626', borderDash:[5,4], borderWidth:2, pointRadius:3, fill:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12, padding:14 } } },
        scales: {
          y: { beginAtZero:true, ticks:{ callback: v => v>=1000?Math.round(v/1000)+'k':v }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x: { ticks:{ font:{size:9}, maxRotation:35 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Stock chart', e); }
}

// ── ABC Classification Donut ───────────────────────────────────────────────────
function loadABCChart() {
  const ctx = document.getElementById('inv-abc-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['A Class (High Value)', 'B Class (Medium)', 'C Class (Low)'],
      datasets: [{
        data: [3, 4, 3],
        backgroundColor: ['#DC2626', '#D97706', '#2563EB'],
        hoverOffset: 6, borderWidth: 2, borderColor: '#fff'
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout:'65%',
      plugins: {
        legend: { position:'right', labels:{ font:{size:11}, boxWidth:12, padding:10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} SKUs (${Math.round(ctx.raw/10*100)}%)` } }
      }
    }
  });
}

// ── Days of Supply Chart ───────────────────────────────────────────────────────
async function loadDOSChart() {
  const ctx = document.getElementById('inv-dos-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/inventory/stock');
    const stocks = res.data;
    const labels = stocks.map(s => s.sku_name ? s.sku_name.slice(0,12) : 'SKU-'+s.sku_id);
    const dos = stocks.map(s => s.days_of_supply || 0);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Days of Supply',
            data: dos,
            backgroundColor: dos.map(d => d<7?'#DC2626':d<14?'#D97706':d>30?'#7C3AED':'#059669'),
            borderRadius: 5
          },
          { label: 'Min Safety (7d)', data: labels.map(()=>7), type:'line', borderColor:'#DC2626', borderDash:[4,3], borderWidth:1.5, pointRadius:0, fill:false },
          { label: 'Target (14d)', data: labels.map(()=>14), type:'line', borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false },
          { label: 'Max (30d)', data: labels.map(()=>30), type:'line', borderColor:'#7C3AED', borderDash:[3,3], borderWidth:1.5, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales: {
          y: { beginAtZero:true, title:{ display:true, text:'Days' }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x: { ticks:{ font:{size:9}, maxRotation:35 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('DoS chart', e); }
}

// ── Stock Positions Table ──────────────────────────────────────────────────────
async function loadStockTable() {
  const tbody = document.getElementById('inv-stock-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/inventory/stock');
    const stocks = res.data;
    tbody.innerHTML = stocks.map(s => {
      const dos = s.days_of_supply || 0;
      const risk = dos<7?'critical':dos<14?'warning':'healthy';
      const avail = s.available_qty || (s.on_hand_qty - (s.reserved_qty||0));
      const utilPct = s.max_stock ? Math.min(100, Math.round(s.on_hand_qty/s.max_stock*100)) : 60;
      return `<tr data-status="${risk}">
        <td><strong>${s.sku_name||'SKU-'+s.sku_id}</strong><br><small style="color:#64748B">${s.sku_code||''}</small></td>
        <td>${s.plant_name||'—'}</td>
        <td>${(s.on_hand_qty||0).toLocaleString()}</td>
        <td>${(s.reserved_qty||0).toLocaleString()}</td>
        <td>${(s.in_transit_qty||0).toLocaleString()}</td>
        <td><strong>${avail.toLocaleString()}</strong></td>
        <td>${(s.safety_stock||0).toLocaleString()}</td>
        <td><span class="badge badge-${risk}">${dos.toFixed(1)}d</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="progress-bar-track" style="width:60px"><div class="progress-bar-fill ${utilPct>90?'critical':utilPct>70?'warning':'healthy'}" style="width:${utilPct}%"></div></div>
            <span style="font-size:0.75rem;color:#64748B">${utilPct}%</span>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748B;padding:20px">Error loading stock data</td></tr>'; }
}

// ── Inventory Turns Trend ─────────────────────────────────────────────────────
function loadTurnoverChart() {
  const ctx = document.getElementById('inv-turnover-chart');
  if (!ctx) return;
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Inventory Turns', data: [16.8, 17.2, 15.9, 18.4, 18.2, 18.5], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:5 },
        { label: 'Target 20x', data: months.map(()=>20), borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { min:12, max:24, title:{ display:true, text:'Turns/year' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Coverage vs Safety Stock ───────────────────────────────────────────────────
function loadCoverageChart() {
  const ctx = document.getElementById('inv-coverage-chart');
  if (!ctx) return;
  const skus = ['Limca PET 500ml','Sprite PET 750ml','Thums Up Can 330ml','Fanta PET 1L','Maaza Tetra 200ml'];
  const coverage = [14.7, 22.3, 7.2, 18.9, 31.4];
  const safety = [14, 14, 14, 14, 14];
  const max = [30, 30, 30, 30, 30];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: skus.map(s => s.length>14?s.slice(0,12)+'..':s),
      datasets: [
        { label: 'Current DoS', data: coverage, backgroundColor: coverage.map(d=>d<7?'#DC2626':d<14?'#D97706':d>28?'#7C3AED':'#059669'), borderRadius: 5 },
        { label: 'Safety Stock (14d)', data: safety, type:'line', borderColor:'#DC2626', borderDash:[4,3], borderWidth:2, pointRadius:3, fill:false },
        { label: 'Max (30d)', data: max, type:'line', borderColor:'#7C3AED', borderDash:[3,3], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { beginAtZero:true, title:{ display:true, text:'Days' }, max: 36, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Replenishment Plan Chart ───────────────────────────────────────────────────
function loadReplenishmentChart() {
  const ctx = document.getElementById('inv-replenishment-chart');
  if (!ctx) return;
  const weeks = ['W25','W26','W27','W28','W29','W30'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: weeks,
      datasets: [
        { label: 'Planned Replenishment (cases)', data: [45000, 38000, 52000, 41000, 48000, 36000], backgroundColor:'rgba(37,99,235,0.75)', borderRadius:4, yAxisID:'y' },
        { label: 'Forecasted Demand', data: [42000, 40000, 49000, 43000, 46000, 38000], type:'line', borderColor:'#DC2626', backgroundColor:'transparent', borderWidth:2, pointRadius:4, yAxisID:'y' },
        { label: 'Ending Stock DoS', data: [16, 14, 17, 15, 17, 15], type:'line', borderColor:'#059669', backgroundColor:'transparent', borderWidth:2, pointRadius:4, borderDash:[4,3], yAxisID:'y2' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { beginAtZero:true, title:{ display:true, text:'Cases' }, ticks:{ callback: v=>v>=1000?Math.round(v/1000)+'k':v }, grid:{ color:'rgba(0,0,0,0.04)' } },
        y2: { position:'right', title:{ display:true, text:'Days of Supply' }, min:0, max:30, grid:{ display:false } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}
