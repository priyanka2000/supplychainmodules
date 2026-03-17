// ======================================================
// SYDIAI Procurement Planning Module JS
// Supplier scorecard, PO lifecycle, spend analysis
// ======================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('proc-kpi-grid')) await loadProcKPIs();
  if (document.getElementById('proc-supplier-chart')) await loadSupplierChart();
  if (document.getElementById('proc-po-status-chart')) await loadPOStatusChart();
  if (document.getElementById('proc-spend-chart')) loadSpendChart();
  if (document.getElementById('proc-supplier-table')) await loadSupplierTable();
  if (document.getElementById('proc-po-table')) await loadPOTable();
  if (document.getElementById('proc-lead-time-chart')) await loadLeadTimeChart();
  if (document.getElementById('proc-risk-matrix')) await loadRiskMatrix();
  if (document.getElementById('proc-otif-trend')) loadProcOTIFTrend();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadProcKPIs() {
  const grid = document.getElementById('proc-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/procurement/kpis');
    const kpis = res.data;
    const icons = {
      'Active Suppliers': 'fa-handshake',
      'High Risk Suppliers': 'fa-exclamation-triangle',
      'Approved POs': 'fa-file-invoice',
      'Avg Lead Time': 'fa-shipping-fast',
      'Supplier OTIF': 'fa-check-double',
      'Spend This Month': 'fa-rupee-sign'
    };
    grid.innerHTML = kpis.map(k => {
      const sc = k.status==='healthy'?'healthy':k.status==='critical'?'critical':'warning';
      const icon = icons[k.name]||'fa-shopping-cart';
      return `<div class="kpi-card ${sc}">
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.name}</div>
        <div class="kpi-value ${sc}">${k.value}<span style="font-size:0.65rem"> ${k.unit||''}</span></div>
        ${k.target!==undefined?`<div class="kpi-meta"><span class="kpi-target">Target: ${k.target} ${k.unit||''}</span></div>`:''}
      </div>`;
    }).join('');
  } catch(e) { grid.innerHTML = '<p style="color:#64748B;padding:20px;text-align:center">Error loading KPIs</p>'; }
}

// ── Supplier Scorecard Radar ───────────────────────────────────────────────────
async function loadSupplierChart() {
  const ctx = document.getElementById('proc-supplier-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/procurement/suppliers');
    const suppliers = res.data.slice(0, 4);
    const metrics = ['OTIF', 'Quality', 'Reliability', 'Lead Time', 'Price Comp.'];
    const colors = ['#2563EB','#DC2626','#059669','#D97706'];
    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: metrics,
        datasets: suppliers.map((s, i) => ({
          label: s.name,
          data: [
            s.reliability_score || 85,
            88 + Math.random()*10,
            s.reliability_score || 82,
            Math.max(30, 100 - (s.lead_time_days||10)*3),
            80 + Math.random()*15
          ],
          borderColor: colors[i%colors.length],
          backgroundColor: colors[i%colors.length].replace(')',',0.1)').replace('rgb','rgba'),
          borderWidth: 2,
          pointRadius: 3
        }))
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales: { r: { min:50, max:100, ticks:{ stepSize:10, font:{size:9} }, pointLabels:{ font:{size:10} } } }
      }
    });
  } catch(e) { console.error('Supplier chart', e); }
}

// ── PO Status Doughnut ────────────────────────────────────────────────────────
async function loadPOStatusChart() {
  const ctx = document.getElementById('proc-po-status-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/procurement/plans');
    let plans = res.data;
    if (!plans.length) {
      plans = [{status:'approved'},{status:'approved'},{status:'approved'},{status:'pending'},{status:'pending'},{status:'executed'},{status:'executed'},{status:'draft'}];
    }
    const statusCounts = {};
    plans.forEach(p => { statusCounts[p.status] = (statusCounts[p.status]||0) + 1; });
    const colors = { approved:'#059669', pending:'#D97706', draft:'#2563EB', cancelled:'#DC2626', executed:'#7C3AED' };
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusCounts).map(s=>s.charAt(0).toUpperCase()+s.slice(1)),
        datasets: [{ data: Object.values(statusCounts), backgroundColor: Object.keys(statusCounts).map(s=>colors[s]||'#64748B'), hoverOffset:6, borderWidth:2, borderColor:'#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout:'65%',
        plugins: { legend:{ position:'right', labels:{ font:{size:11}, boxWidth:12, padding:10 } } }
      }
    });
  } catch(e) { console.error('PO Status chart', e); }
}

// ── Monthly Spend Bar ──────────────────────────────────────────────────────────
function loadSpendChart() {
  const ctx = document.getElementById('proc-spend-chart');
  if (!ctx) return;
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const categories = {
    'Raw Materials': [68.4, 72.1, 85.3, 74.2, 79.8, 85.6],
    'Packaging': [22.1, 24.3, 28.7, 23.5, 26.4, 28.9],
    'Utilities': [8.2, 9.1, 10.4, 8.8, 9.5, 10.1],
    'Capex/Spares': [5.1, 6.3, 4.2, 7.1, 5.8, 6.2]
  };
  const colors = ['#2563EB','#7C3AED','#059669','#D97706'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: Object.entries(categories).map(([name, data], i) => ({
        label: name, data,
        backgroundColor: colors[i%colors.length].replace(')',',0.8)').replace('#','rgba(').replace(/^rgba\(([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2}),/i, (_, r, g, b) => `rgba(${parseInt(r,16)},${parseInt(g,16)},${parseInt(b,16)},`),
        borderRadius: i===3?4:0
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: {
        legend: { position:'top', labels:{ font:{size:11}, boxWidth:12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ₹${ctx.raw.toFixed(1)}L` } }
      },
      scales: {
        x: { stacked:true, ticks:{ font:{size:10} }, grid:{ display:false } },
        y: { stacked:true, title:{ display:true, text:'₹ Lakh' }, grid:{ color:'rgba(0,0,0,0.04)' } }
      }
    }
  });
}

// ── Supplier Performance Table ─────────────────────────────────────────────────
async function loadSupplierTable() {
  const tbody = document.getElementById('proc-supplier-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/procurement/suppliers');
    const suppliers = res.data;
    tbody.innerHTML = suppliers.map(s => {
      const risk = s.risk_level||'low';
      const riskColor = risk==='high'?'critical':risk==='medium'?'warning':'healthy';
      const rating = s.rating||4;
      const stars = '★'.repeat(Math.floor(rating)) + (rating%1>=0.5?'½':'') + '☆'.repeat(5-Math.ceil(rating));
      return `<tr>
        <td><strong>${s.name}</strong></td>
        <td>${s.location||'India'}</td>
        <td><span style="color:#D97706;font-size:1rem">${stars}</span> <span style="font-size:0.75rem;color:#64748B">${rating}/5</span></td>
        <td>${(s.reliability_score||80).toFixed(1)}%</td>
        <td>${s.lead_time_days||'—'} days</td>
        <td><span class="badge badge-${riskColor}">${risk}</span></td>
        <td>${s.is_sustainable?'<span class="badge badge-healthy"><i class="fas fa-leaf"></i> Yes</span>':'<span class="badge badge-warning">No</span>'}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="window.showToast('Viewing '+${JSON.stringify(s.name)}+' details','success')" style="font-size:0.75rem;padding:3px 8px">
            <i class="fas fa-eye"></i> View
          </button>
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748B;padding:20px">Error loading suppliers</td></tr>'; }
}

// ── Purchase Orders Table ──────────────────────────────────────────────────────
async function loadPOTable() {
  const tbody = document.getElementById('proc-po-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/procurement/plans');
    let plans = res.data;
    if (!plans.length) {
      plans = [
        {material_name:'PET Resin 500ml',supplier_name:'IndoPlast Industries',planned_qty:120000,planned_cost:11400000,period:'2026-03',status:'approved'},
        {material_name:'PET Resin 1L',supplier_name:'PetroPlastics Ltd',planned_qty:85000,planned_cost:7480000,period:'2026-03',status:'approved'},
        {material_name:'Mango Concentrate',supplier_name:'GlobalFlavors Co',planned_qty:32000,planned_cost:4000000,period:'2026-03',status:'pending'},
        {material_name:'Orange Concentrate',supplier_name:'GlobalFlavors Co',planned_qty:28000,planned_cost:3080000,period:'2026-03',status:'pending'},
        {material_name:'Sugar Food Grade',supplier_name:'SweetSource Ltd',planned_qty:55000,planned_cost:5610000,period:'2026-03',status:'executed'},
        {material_name:'Label Film 500ml',supplier_name:'IndoPlast Industries',planned_qty:95000,planned_cost:9975000,period:'2026-03',status:'executed'},
        {material_name:'Can Body 250ml',supplier_name:'CanTech Solutions',planned_qty:22000,planned_cost:2530000,period:'2026-04',status:'draft'},
        {material_name:'HDPE Cap 28mm',supplier_name:'IndoPlast Industries',planned_qty:45000,planned_cost:3240000,period:'2026-04',status:'draft'},
      ];
    }
    tbody.innerHTML = plans.slice(0, 15).map((p, idx) => {
      const stColor = p.status==='approved'?'healthy':p.status==='pending'?'warning':p.status==='cancelled'?'critical':'info';
      const period = p.period||'2026-03';
      const cost = p.planned_cost||0;
      const po_num = `PO-2026-${String(1000+idx+1).padStart(4,'0')}`;
      return `<tr>
        <td><strong style="font-size:0.8rem">${po_num}</strong></td>
        <td>${p.material_name||'Material-'+p.material_id}</td>
        <td>${p.supplier_name||'Supplier-'+p.supplier_id}</td>
        <td>${(p.planned_qty||0).toLocaleString()} kg</td>
        <td>₹${(cost/100000).toFixed(2)}L</td>
        <td>${period}</td>
        <td><span class="badge badge-${stColor}">${p.status}</span></td>
        <td>
          ${p.status==='pending'?`<button class="btn btn-sm btn-outline" data-action="approve-po" style="font-size:0.75rem;padding:3px 8px"><i class="fas fa-check"></i> Approve</button>`:
            `<button class="btn btn-sm btn-outline" style="font-size:0.75rem;padding:3px 8px" onclick="window.showToast('PO ${po_num} details loaded','success')"><i class="fas fa-eye"></i> View</button>`}
        </td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748B;padding:20px">Error loading POs</td></tr>'; }
}

// ── Lead Time by Supplier ──────────────────────────────────────────────────────
async function loadLeadTimeChart() {
  const ctx = document.getElementById('proc-lead-time-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/procurement/suppliers');
    const suppliers = res.data;
    const names = suppliers.map(s => s.name.length>12 ? s.name.slice(0,10)+'..' : s.name);
    const leads = suppliers.map(s => s.lead_time_days||10);
    const target = suppliers.map(()=>10);
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: names,
        datasets: [
          { label: 'Lead Time (days)', data: leads, backgroundColor: leads.map(d=>d>14?'rgba(220,38,38,0.8)':d>10?'rgba(217,119,6,0.8)':'rgba(5,150,105,0.8)'), borderRadius:5 },
          { label: 'Target 10d', data: target, type:'line', borderColor:'#059669', borderDash:[5,4], borderWidth:2, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales: {
          y: { beginAtZero:true, title:{ display:true, text:'Days' }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x: { ticks:{ font:{size:9} }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Lead time chart', e); }
}

// ── Supplier Risk Matrix ───────────────────────────────────────────────────────
async function loadRiskMatrix() {
  const el = document.getElementById('proc-risk-matrix');
  if (!el) return;
  try {
    const res = await axios.get('/api/procurement/suppliers');
    const suppliers = res.data;
    let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<thead><tr style="background:#F8FAFC"><th style="padding:8px 12px;text-align:left;color:#475569;font-weight:600">Supplier</th><th style="padding:8px;text-align:center">Risk Level</th><th style="padding:8px;text-align:center">Rating</th><th style="padding:8px;text-align:center">Reliability</th><th style="padding:8px;text-align:center">Lead Time</th><th style="padding:8px;text-align:center">Sustainable</th><th style="padding:8px;text-align:center">Action</th></tr></thead><tbody>';
    suppliers.forEach((s, i) => {
      const risk = s.risk_level||'low';
      const riskColor = risk==='high'?'#FEF2F2':risk==='medium'?'#FFFBEB':'#ECFDF5';
      const riskBadge = risk==='high'?'critical':risk==='medium'?'warning':'healthy';
      html += `<tr style="background:${i%2?'#F8FAFC':'#fff'};border-bottom:1px solid #F1F5F9">
        <td style="padding:8px 12px"><strong>${s.name}</strong><br><small style="color:#64748B">${s.location||'India'}</small></td>
        <td style="padding:8px;text-align:center"><span class="badge badge-${riskBadge}">${risk}</span></td>
        <td style="padding:8px;text-align:center">${(s.rating||4).toFixed(1)}/5</td>
        <td style="padding:8px;text-align:center">${(s.reliability_score||80).toFixed(1)}%</td>
        <td style="padding:8px;text-align:center">${s.lead_time_days||'—'}d</td>
        <td style="padding:8px;text-align:center">${s.is_sustainable?'<i class="fas fa-leaf" style="color:#059669"></i>':'<i class="fas fa-times" style="color:#DC2626"></i>'}</td>
        <td style="padding:8px;text-align:center">
          <button style="background:none;border:1px solid #E2E8F0;border-radius:6px;padding:3px 10px;cursor:pointer;color:#1E3A8A;font-size:11px" onclick="window.showToast('Supplier scorecard loaded: ${s.name}','success')">
            Scorecard
          </button>
        </td>
      </tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div style="color:#64748B;padding:20px;text-align:center">Error loading risk matrix</div>'; }
}

// ── Supplier OTIF Trend ────────────────────────────────────────────────────────
function loadProcOTIFTrend() {
  const ctx = document.getElementById('proc-otif-trend');
  if (!ctx) return;
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Overall OTIF %', data: [84.2, 85.6, 82.1, 86.8, 87.4, 88.1], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4 },
        { label: 'Quality Compliance %', data: [97.1, 96.8, 98.2, 97.5, 98.1, 97.9], borderColor:'#059669', backgroundColor:'transparent', fill:false, tension:0.4, borderWidth:2, pointRadius:4 },
        { label: 'Target 95%', data: months.map(()=>95), borderColor:'#DC2626', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { min:75, max:100, ticks:{ callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}
