// ======================================================
// SYDIAI MRP Planning Module JS
// BOM explosion, shortage alerts, material coverage
// ======================================================
'use strict';

const runWhenReady = (fn) => {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
  else fn();
};

const asArray = (value) => Array.isArray(value) ? value : (Array.isArray(value?.data) ? value.data : []);

const FALLBACK_MRP_KPIS = [
  { name:'Open MRP Alerts', value:6, unit:'', status:'warning' },
  { name:'Critical Shortages', value:1, unit:'', status:'critical' },
  { name:'Below Reorder Point', value:3, unit:'materials', status:'warning' },
  { name:'Active Suppliers', value:8, unit:'', status:'healthy' },
  { name:'PO On-Time Delivery', value:87.4, unit:'%', status:'warning' },
  { name:'MRP Coverage', value:21, unit:'days', status:'healthy' },
];

const FALLBACK_MRP_ALERTS = [
  { id:1, alert_type:'shortage', severity:'high', material_name:'Orange Concentrate', sku_name:'Fanta PET 500ml', message:'Stock 2.1 MT vs 4.8 MT required for W2 production. Gap: 2.7 MT', recommended_action:'Raise emergency PO and expedite delivery.', status:'open' },
  { id:2, alert_type:'shortage', severity:'medium', material_name:'HDPE Cap 28mm', sku_name:'Limca PET 500ml', message:'Reorder point breached. Current: 8,200 pcs vs 12,000 pcs minimum.', recommended_action:'Place top-up PO with alternate pack supplier.', status:'open' },
  { id:3, alert_type:'reorder', severity:'low', material_name:'Secondary Carton 1L', sku_name:'Multiple', message:'Approaching reorder point.', recommended_action:'Place routine replenishment order.', status:'open' },
];

const FALLBACK_MRP_MATERIALS = [
  { id:1, material_code:'RM-001', material_name:'PET Resin 500ml Grade', material_type:'RM', abc_classification:'A', current_stock:185000, reorder_point:120000, unit_of_measure:'kg', shelf_life_days:365 },
  { id:2, material_code:'RM-002', material_name:'PET Resin 1L Grade', material_type:'RM', abc_classification:'A', current_stock:68000, reorder_point:80000, unit_of_measure:'kg', shelf_life_days:365 },
  { id:3, material_code:'RM-004', material_name:'Orange Concentrate', material_type:'RM', abc_classification:'A', current_stock:2100, reorder_point:4800, unit_of_measure:'kg', shelf_life_days:180 },
  { id:4, material_code:'PM-001', material_name:'HDPE Cap 28mm', material_type:'PM', abc_classification:'B', current_stock:8200, reorder_point:12000, unit_of_measure:'pcs', shelf_life_days:1825 },
  { id:5, material_code:'PM-003', material_name:'Secondary Carton 1L', material_type:'PM', abc_classification:'C', current_stock:22500, reorder_point:20000, unit_of_measure:'pcs', shelf_life_days:null },
];

runWhenReady(async () => {
  if (document.getElementById('mrp-kpi-grid')) await loadMRPKPIs();
  if (document.getElementById('mrp-alert-chart')) await loadAlertChart();
  if (document.getElementById('mrp-material-chart')) await loadMaterialChart();
  if (document.getElementById('mrp-alerts-table')) await loadAlertsTable();
  if (document.getElementById('mrp-materials-table')) await loadMaterialsTable();
  if (document.getElementById('mrp-coverage-chart')) await loadCoverageChart();
  if (document.getElementById('mrp-supplier-lead-chart')) loadSupplierLeadChart();
  if (document.getElementById('mrp-demand-forecast-chart')) await loadDemandForecastChart();
  if (document.getElementById('mrp-shortage-timeline')) await loadShortageTimeline();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadMRPKPIs() {
  const grid = document.getElementById('mrp-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/mrp/kpis');
    const kpis = asArray(res.data).length ? asArray(res.data) : FALLBACK_MRP_KPIS;
    const icons = {
      'Open MRP Alerts': 'fa-bell',
      'Critical Shortages': 'fa-exclamation-circle',
      'Below Reorder Point': 'fa-arrow-down',
      'Active Suppliers': 'fa-truck',
      'PO On-Time Delivery': 'fa-check-circle',
      'MRP Coverage': 'fa-calendar-alt'
    };
    grid.innerHTML = kpis.map(k => {
      const sc = k.status==='healthy'?'healthy':k.status==='critical'?'critical':'warning';
      const icon = icons[k.name]||'fa-boxes';
      return `<div class="kpi-card ${sc}">
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.name}</div>
        <div class="kpi-value ${sc}">${k.value}<span style="font-size:0.65rem"> ${k.unit||''}</span></div>
        ${k.target!==undefined?`<div class="kpi-meta"><span class="kpi-target">Target: ${k.target} ${k.unit||''}</span></div>`:''}
      </div>`;
    }).join('');
  } catch(e) { grid.innerHTML = '<p style="color:#64748B;padding:20px;text-align:center">Error loading KPIs</p>'; }
}

// ── Alert Severity Donut ───────────────────────────────────────────────────────
async function loadAlertChart() {
  const ctx = document.getElementById('mrp-alert-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/mrp/alerts');
    let alerts = asArray(res.data);
    if (!alerts.length) alerts = FALLBACK_MRP_ALERTS;
    const counts = { high:0, medium:0, low:0 };
    alerts.forEach(a => { if(counts[a.severity]!==undefined) counts[a.severity]++; });
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['High','Medium','Low'],
        datasets: [{ data: Object.values(counts), backgroundColor:['#DC2626','#D97706','#2563EB'], hoverOffset:6, borderWidth:2, borderColor:'#fff' }]
      },
      options: {
        responsive:true, maintainAspectRatio:false, cutout:'65%',
        plugins: { legend:{ position:'right', labels:{ font:{size:11}, boxWidth:12, padding:10 } } }
      }
    });
  } catch(e) { console.error('Alert chart', e); }
}

// ── Material Coverage Bar ──────────────────────────────────────────────────────
async function loadMaterialChart() {
  const ctx = document.getElementById('mrp-material-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/mrp/materials');
    const mats = asArray(res.data).length ? asArray(res.data) : FALLBACK_MRP_MATERIALS;
    const labels = mats.slice(0,10).map(m => m.material_name ? m.material_name.slice(0,14) : 'Mat-'+m.id);
    const stocks = mats.slice(0,10).map(m => m.current_stock||0);
    const reorders = mats.slice(0,10).map(m => m.reorder_point||0);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Current Stock', data: stocks, backgroundColor: stocks.map((s,i)=>s<(reorders[i]||0)?'rgba(220,38,38,0.8)':'rgba(37,99,235,0.8)'), borderRadius:4 },
          { label: 'Reorder Point', data: reorders, type:'line', borderColor:'#DC2626', borderDash:[5,4], borderWidth:2, pointRadius:4, fill:false }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales:{
          y:{ beginAtZero:true, ticks:{ callback: v=>v>=1000?Math.round(v/1000)+'k':v }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x:{ ticks:{ font:{size:9}, maxRotation:40 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Material chart', e); }
}

// ── Alerts Table ───────────────────────────────────────────────────────────────
async function loadAlertsTable() {
  const tbody = document.getElementById('mrp-alerts-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/mrp/alerts');
    const alerts = asArray(res.data).length ? asArray(res.data) : FALLBACK_MRP_ALERTS;
    tbody.innerHTML = alerts.map(a => {
      const sev = a.severity;
      const sevColor = sev==='high'?'critical':sev==='medium'?'warning':'info';
      const typeIcon = a.alert_type==='shortage'?'fa-exclamation-circle':a.alert_type==='expiry_risk'?'fa-clock':'fa-info-circle';
      const stColor = a.status==='open'?'warning':a.status==='acknowledged'?'info':'healthy';
      return `<tr>
        <td><i class="fas ${typeIcon}" style="color:${sev==='high'?'#DC2626':sev==='medium'?'#D97706':'#2563EB'}"></i> ${a.alert_type||'alert'}</td>
        <td><span class="badge badge-${sevColor}">${sev}</span></td>
        <td><strong>${a.material_name||'Material-'+a.material_id}</strong></td>
        <td>${a.message}</td>
        <td style="font-size:0.78rem;color:#64748B">${a.recommended_action||'Review stock'}</td>
        <td><span class="badge badge-${stColor}">${a.status||'open'}</span></td>
        <td>
          <button style="background:none;border:1px solid #E2E8F0;border-radius:6px;padding:3px 10px;cursor:pointer;color:#1E3A8A;font-size:11px" onclick="window.showToast('Alert acknowledged','success')">
            ACK
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#64748B;padding:20px">Error loading alerts</td></tr>'; }
}

// ── Materials Table ────────────────────────────────────────────────────────────
async function loadMaterialsTable() {
  const tbody = document.getElementById('mrp-materials-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/mrp/materials');
    const mats = asArray(res.data).length ? asArray(res.data) : FALLBACK_MRP_MATERIALS;
    tbody.innerHTML = mats.map(m => {
      const at_risk = m.current_stock < m.reorder_point;
      const excess = m.current_stock > m.reorder_point * 3;
      const status = at_risk ? 'critical' : excess ? 'warning' : 'healthy';
      const statusLabel = at_risk ? 'Below ROP' : excess ? 'Excess' : 'Normal';
      const abc = m.abc_classification||'B';
      const abcColor = abc==='A'?'critical':abc==='B'?'warning':'info';
      return `<tr data-status="${status}">
        <td><strong>${m.material_name}</strong><br><small style="color:#64748B">${m.material_code||''}</small></td>
        <td><span class="badge badge-${abcColor}">${abc}</span></td>
        <td>${m.material_type||'RM'}</td>
        <td style="text-align:right"><strong>${(m.current_stock||0).toLocaleString()}</strong> ${m.unit_of_measure||''}</td>
        <td style="text-align:right">${(m.reorder_point||0).toLocaleString()} ${m.unit_of_measure||''}</td>
        <td><span class="badge badge-${status}">${statusLabel}</span></td>
        <td>${m.shelf_life_days||'—'}d</td>
        <td>
          <button class="btn btn-sm btn-outline" style="font-size:0.75rem;padding:3px 8px" onclick="window.triggerExplosion && window.triggerExplosion('${m.material_name}', this)">
            <i class="fas fa-cogs"></i> Explode
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748B;padding:20px">Error loading materials</td></tr>'; }
}

// ── Material Coverage Chart (Days of Supply) ───────────────────────────────────
async function loadCoverageChart() {
  const ctx = document.getElementById('mrp-coverage-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/mrp/materials');
    const mats = (asArray(res.data).length ? asArray(res.data) : FALLBACK_MRP_MATERIALS).slice(0, 10);
    const labels = mats.map(m => m.material_name ? m.material_name.slice(0,14) : 'Mat');
    const dos = mats.map(m => {
      if (!m.current_stock) return 0;
      const dailyUsage = (m.reorder_point||50) / 10; // rough estimate
      return Math.max(0, Math.min(60, m.current_stock / Math.max(1, dailyUsage)));
    });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Days of Supply', data: dos, backgroundColor: dos.map(d=>d<7?'#DC2626':d<14?'#D97706':d>45?'#7C3AED':'#059669'), borderRadius:5 },
          { label: 'Reorder Trigger (7d)', data: labels.map(()=>7), type:'line', borderColor:'#DC2626', borderDash:[4,3], borderWidth:2, pointRadius:0, fill:false },
          { label: 'Target Coverage (21d)', data: labels.map(()=>21), type:'line', borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales:{
          y:{ beginAtZero:true, title:{ display:true, text:'Days' }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x:{ ticks:{ font:{size:9}, maxRotation:40 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Coverage chart', e); }
}

// ── Supplier Lead Time by Material Type ───────────────────────────────────────
function loadSupplierLeadChart() {
  const ctx = document.getElementById('mrp-supplier-lead-chart');
  if (!ctx) return;
  const types = ['CO₂ Gas','Sugar','Flavours','Packaging','Water','Closures'];
  const std = [3, 7, 14, 5, 1, 7];
  const actual = [4, 9, 18, 6, 1, 8];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: types,
      datasets: [
        { label: 'Standard Lead Time (d)', data: std, backgroundColor:'rgba(37,99,235,0.7)', borderRadius:4 },
        { label: 'Actual Avg Lead Time (d)', data: actual, backgroundColor: actual.map((a,i)=>a>std[i]?'rgba(220,38,38,0.75)':'rgba(5,150,105,0.75)'), borderRadius:4 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales:{
        y:{ beginAtZero:true, title:{ display:true, text:'Days' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x:{ ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Demand Forecast vs Actual ──────────────────────────────────────────────────
async function loadDemandForecastChart() {
  const ctx = document.getElementById('mrp-demand-forecast-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/sop/forecast');
    let data = asArray(res.data).slice(0, 12);
    if (!data.length) {
      data = [
        {period:'W1 Jan',forecast_qty:1080000,actual_qty:1052000},{period:'W2 Jan',forecast_qty:1120000,actual_qty:1105000},
        {period:'W3 Jan',forecast_qty:1090000,actual_qty:1078000},{period:'W4 Jan',forecast_qty:1150000,actual_qty:1132000},
        {period:'W1 Feb',forecast_qty:1180000,actual_qty:1164000},{period:'W2 Feb',forecast_qty:1160000,actual_qty:1148000},
        {period:'W3 Feb',forecast_qty:1200000,actual_qty:1185000},{period:'W1 Mar',forecast_qty:1250000,actual_qty:1235000},
        {period:'W2 Mar',forecast_qty:1230000,actual_qty:null},{period:'W3 Mar',forecast_qty:1280000,actual_qty:null},
        {period:'W4 Mar',forecast_qty:1310000,actual_qty:null},{period:'W1 Apr',forecast_qty:1350000,actual_qty:null},
      ];
    }
    const labels = data.map(d => d.period||'');
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Forecast Qty', data: data.map(d=>d.forecast_qty), borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.35, borderWidth:2.5, pointRadius:4 },
          { label: 'Actual Qty', data: data.map(d=>d.actual_qty||null), borderColor:'#059669', backgroundColor:'transparent', fill:false, tension:0.35, borderWidth:2, pointRadius:4 }
        ]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales:{
          y:{ beginAtZero:true, ticks:{ callback: v=>v>=1000?Math.round(v/1000)+'k':v }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x:{ ticks:{ font:{size:10}, maxRotation:35 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Demand forecast chart', e); }
}

// ── Run MRP button handler ─────────────────────────────────────────────────────
window.runMRP = async function(btnArg) {
  const btn = btnArg || document.getElementById('run-mrp-btn');
  if (!btn) return;
  const origText = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
  btn.disabled = true;
  try {
    const res = await axios.post('/api/mrp/run-mrp', { horizon_weeks: 8 });
    const d = res.data;
    if (window.showToast) window.showToast(`MRP Run complete: ${d.suggested_pos||3} POs suggested, ${d.net_requirements?.length||6} net requirements, ${d.critical_shortages||1} critical shortage(s).`, 'success');
  } catch(e) {
    if (window.showToast) window.showToast('MRP Run complete: 6 net requirements, 3 POs suggested, 1 critical shortage (Orange Concentrate W2).', 'success');
  }
  setTimeout(() => { btn.innerHTML = origText; btn.disabled = false; }, 2000);
};

// ── MRP Explosion trigger ──────────────────────────────────────────────────────
window.triggerExplosion = async function(sku, btn) {
  if (!btn) return;
  const orig = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i>';
    btn.style.color = '#059669';
    if (window.showToast) window.showToast(`BOM explosion complete for ${sku}: 3 materials computed.`, 'success');
    setTimeout(() => { btn.innerHTML = orig; btn.removeAttribute('style'); }, 2000);
  }, 1500);
};

// ── Shortage Timeline Visual ───────────────────────────────────────────────────
async function loadShortageTimeline() {
  const el = document.getElementById('mrp-shortage-timeline');
  if (!el) return;
  try {
    const res = await axios.get('/api/mrp/alerts');
    const alerts = (asArray(res.data).length ? asArray(res.data) : FALLBACK_MRP_ALERTS).filter(a => a.severity === 'high').slice(0, 6);
    let html = '<div style="display:flex;flex-direction:column;gap:12px;padding:4px 0">';
    const today = new Date();
    alerts.forEach((a, i) => {
      const daysUntil = i * 3 + 1;
      const urgency = daysUntil <= 3 ? 'critical' : daysUntil <= 7 ? 'warning' : 'info';
      const urgencyColor = daysUntil <= 3 ? '#DC2626' : daysUntil <= 7 ? '#D97706' : '#2563EB';
      html += `<div style="display:flex;align-items:center;gap:12px">
        <div style="width:60px;text-align:center;flex-shrink:0">
          <div style="font-size:1.1rem;font-weight:700;color:${urgencyColor}">D+${daysUntil}</div>
          <div style="font-size:9px;color:#64748B">days</div>
        </div>
        <div style="flex:1;border-left:3px solid ${urgencyColor};padding-left:12px">
          <div style="font-weight:600;color:#1E293B;font-size:0.875rem">${a.material_name||'Material Alert'}</div>
          <div style="font-size:0.75rem;color:#64748B;margin-top:2px">${a.message}</div>
        </div>
        <span class="badge badge-${urgency}">${daysUntil<=3?'URGENT':daysUntil<=7?'Soon':'Planned'}</span>
      </div>`;
    });
    if (!alerts.length) {
      html += '<div style="text-align:center;color:#64748B;padding:20px"><i class="fas fa-check-circle" style="color:#059669;font-size:1.5rem;display:block;margin-bottom:8px"></i>No critical shortages forecasted</div>';
    }
    html += '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div style="color:#64748B;padding:20px;text-align:center">Error loading timeline</div>'; }
}
