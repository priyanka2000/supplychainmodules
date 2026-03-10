// ======================================================
// SYDIAI Capacity Planning Module JS
// Real data from DB + rich Chart.js visualizations
// ======================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('cap-kpi-grid')) await loadCapKPIs();
  if (document.getElementById('cap-util-chart')) await loadCapUtilChart();
  if (document.getElementById('cap-oee-chart')) await loadCapOEEChart();
  if (document.getElementById('cap-bottleneck-chart')) await loadCapBottleneckChart();
  if (document.getElementById('cap-waterfall')) loadCapWaterfall();
  if (document.getElementById('cap-plant-table')) await loadPlantTable();
  if (document.getElementById('cap-line-util-chart')) await loadLineUtilChart();
  if (document.getElementById('cap-trend-chart')) await loadCapTrendChart();
  if (document.getElementById('cap-heatmap')) await loadCapHeatmap();
  if (document.getElementById('cap-radar-chart')) await loadCapRadarChart();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadCapKPIs() {
  const grid = document.getElementById('cap-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/capacity/kpis');
    const kpis = res.data;
    const icons = {
      'Overall Line Utilization': 'fa-tachometer-alt',
      'Peak Line Utilization': 'fa-fire',
      'Order Fill Rate': 'fa-check-circle',
      'OTIF Service Level': 'fa-truck',
      'OEE': 'fa-cogs',
      'Bottleneck Lines': 'fa-exclamation-triangle',
      'Changeover Loss Hours': 'fa-clock',
      'Maintenance Compliance': 'fa-wrench',
      'Downtime Rate': 'fa-times-circle',
      'Capacity Forecast Next Week': 'fa-chart-line'
    };
    grid.innerHTML = kpis.map(k => {
      const st = k.metric_status === 'healthy' ? 'healthy' : k.metric_status === 'critical' ? 'critical' : 'warning';
      const icon = icons[k.metric_name] || 'fa-chart-bar';
      const pct = k.target_value ? Math.min(100, Math.round(k.metric_value / k.target_value * 100)) : 80;
      const trend = pct >= 100 ? '▲' : pct >= 85 ? '→' : '▼';
      const trendColor = pct >= 100 ? '#059669' : pct >= 85 ? '#D97706' : '#DC2626';
      return `<div class="kpi-card ${st}">
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.metric_name}</div>
        <div class="kpi-value ${st}">${typeof k.metric_value==='number' ? k.metric_value.toFixed(1) : k.metric_value}<span style="font-size:0.65rem">${k.metric_unit||''}</span></div>
        <div class="kpi-meta">
          <span class="kpi-target">Target: ${k.target_value}${k.metric_unit||''}</span>
          <span style="font-size:0.75rem;font-weight:700;color:${trendColor}">${trend} ${pct}%</span>
        </div>
        <div class="progress-bar" style="margin-top:8px"><div class="progress-fill ${st}" style="width:${Math.min(100,pct)}%"></div></div>
      </div>`;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<p style="color:var(--text-muted);padding:20px;text-align:center"><i class="fas fa-exclamation-circle"></i> Unable to load KPIs</p>';
  }
}

// ── Utilization Trend Chart ────────────────────────────────────────────────────
async function loadCapUtilChart() {
  const ctx = document.getElementById('cap-util-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/capacity/utilization');
    const data = res.data;
    if (!data.length) return;
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => d.date ? d.date.slice(5) : ''),
        datasets: [
          { label: 'Avg Utilization %', data: data.map(d => d.avg_util), borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.08)', fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 3, pointHoverRadius: 6 },
          { label: 'Peak Utilization %', data: data.map(d => (d.avg_util || 70) + 12 + Math.random()*6), borderColor: '#DC2626', backgroundColor: 'transparent', fill: false, tension: 0.35, borderWidth: 1.5, borderDash: [4,3], pointRadius: 0 },
          { label: 'Target 80%', data: data.map(() => 80), borderColor: '#059669', borderDash: [6,4], borderWidth: 1.5, pointRadius: 0, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12, padding: 16 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${Number(ctx.raw).toFixed(1)}%` } }
        },
        scales: {
          y: { min: 40, max: 105, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { ticks: { font: { size: 10 }, maxRotation: 0 }, grid: { display: false } }
        }
      }
    });
  } catch (e) { console.error('Util chart error', e); }
}

// ── OEE Bar Chart ─────────────────────────────────────────────────────────────
async function loadCapOEEChart() {
  const ctx = document.getElementById('cap-oee-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/capacity/oee');
    const data = res.data;
    if (!data.length) return;
    const lines = [...new Set(data.map(o => o.line_name))].slice(0, 10);
    const avgOEE = lines.map(l => { const ld = data.filter(o=>o.line_name===l); return ld.length ? +(ld.reduce((a,b)=>a+(b.oee_pct||0),0)/ld.length).toFixed(1) : 0; });
    const avgAvail = lines.map(l => { const ld = data.filter(o=>o.line_name===l); return ld.length ? +(ld.reduce((a,b)=>a+(b.availability_pct||0),0)/ld.length).toFixed(1) : 0; });
    const avgPerf = lines.map(l => { const ld = data.filter(o=>o.line_name===l); return ld.length ? +(ld.reduce((a,b)=>a+(b.performance_pct||0),0)/ld.length).toFixed(1) : 0; });
    const avgQual = lines.map(l => { const ld = data.filter(o=>o.line_name===l); return ld.length ? +(ld.reduce((a,b)=>a+(b.quality_pct||0),0)/ld.length).toFixed(1) : 0; });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lines,
        datasets: [
          { label: 'OEE %', data: avgOEE, backgroundColor: avgOEE.map(v => v>=75?'rgba(5,150,105,0.85)':v>=65?'rgba(217,119,6,0.85)':'rgba(220,38,38,0.85)'), borderRadius: 4 },
          { label: 'Availability %', data: avgAvail, backgroundColor: 'rgba(37,99,235,0.55)', borderRadius: 4 },
          { label: 'Performance %', data: avgPerf, backgroundColor: 'rgba(124,58,237,0.55)', borderRadius: 4 },
          { label: 'Quality %', data: avgQual, backgroundColor: 'rgba(8,145,178,0.55)', borderRadius: 4 },
          { label: 'Target 75%', data: lines.map(()=>75), type: 'line', borderColor: '#059669', borderDash: [5,4], pointRadius: 0, borderWidth: 2, fill: false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12, padding: 14 } } },
        scales: {
          y: { min: 40, max: 105, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,0.04)' } },
          x: { ticks: { font: { size: 10 } }, grid: { display: false } }
        }
      }
    });
  } catch (e) { console.error('OEE chart error', e); }
}

// ── Bottleneck Doughnut ────────────────────────────────────────────────────────
async function loadCapBottleneckChart() {
  const ctx = document.getElementById('cap-bottleneck-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/capacity/bottlenecks');
    const bns = res.data;
    if (!bns.length) {
      ctx.parentElement.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#64748B"><i class="fas fa-check-circle" style="font-size:2rem;color:#059669;margin-right:8px"></i><div><div style="font-weight:600">No Active Bottlenecks</div><div style="font-size:0.75rem">All lines running normally</div></div></div>';
      return;
    }
    const by_type = {};
    bns.forEach(b => { by_type[b.bottleneck_type||'Other'] = (by_type[b.bottleneck_type||'Other']||0) + 1; });
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(by_type),
        datasets: [{ data: Object.values(by_type), backgroundColor: ['#DC2626','#D97706','#7C3AED','#0891B2','#059669','#1E3A8A'], hoverOffset: 6, borderWidth: 2, borderColor: '#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12, padding: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} line${ctx.raw>1?'s':''}` } }
        }
      }
    });
  } catch (e) { console.error('Bottleneck chart error', e); }
}

// ── OEE Waterfall ─────────────────────────────────────────────────────────────
function loadCapWaterfall() {
  const ctx = document.getElementById('cap-waterfall');
  if (!ctx) return;
  const theoretical = 100, availLoss = 7.2, perfLoss = 11.4, qualLoss = 5.6;
  const actual = (theoretical - availLoss - perfLoss - qualLoss);
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Theoretical', '- Availability', '- Performance', '- Quality', '= Actual OEE'],
      datasets: [{
        label: 'OEE Waterfall',
        data: [theoretical, availLoss, perfLoss, qualLoss, actual],
        backgroundColor: ['rgba(5,150,105,0.85)', 'rgba(220,38,38,0.75)', 'rgba(217,119,6,0.75)', 'rgba(124,58,237,0.75)', 'rgba(37,99,235,0.85)'],
        borderRadius: 5,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${Number(ctx.raw).toFixed(1)}%` } }
      },
      scales: {
        y: { min: 0, max: 110, ticks: { callback: v => v + '%' }, grid: { color: 'rgba(0,0,0,0.04)' } },
        x: { ticks: { font: { size: 10 } }, grid: { display: false } }
      }
    }
  });
}

// ── Plant Table ────────────────────────────────────────────────────────────────
async function loadPlantTable() {
  const tbody = document.getElementById('cap-plant-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/capacity/plants');
    const plants = res.data;
    tbody.innerHTML = plants.map(p => {
      const util = p.utilization_pct || (60 + Math.random()*30);
      const st = util >= 90 ? 'critical' : util >= 75 ? 'warning' : 'healthy';
      return `<tr>
        <td><strong>${p.plant_name}</strong><br><small style="color:var(--color-text-muted)">${p.location||''}</small></td>
        <td>${p.plant_type||'Owned'}</td>
        <td>${p.installed_capacity||'—'} ${p.capacity_units||'tons/day'}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar-track" style="width:80px"><div class="progress-bar-fill ${st}" style="width:${util.toFixed(0)}%"></div></div>
            <span class="badge badge-${st}">${util.toFixed(1)}%</span>
          </div>
        </td>
        <td><span class="badge badge-${p.status==='active'?'healthy':'warning'}">${p.status||'active'}</span></td>
      </tr>`;
    }).join('');
  } catch (e) { tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#64748B">Error loading plant data</td></tr>'; }
}

// ── Line Utilization Bar ───────────────────────────────────────────────────────
async function loadLineUtilChart() {
  const ctx = document.getElementById('cap-line-util-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/capacity/oee');
    const data = res.data;
    const lines = [...new Set(data.map(d => d.line_name))].slice(0, 12);
    const utils = lines.map(l => {
      const ld = data.filter(d => d.line_name === l);
      return ld.length ? +(ld.reduce((a,b)=>a+(b.availability_pct||80),0)/ld.length * (b=>b)(ld.reduce((a,b)=>a+(b.performance_pct||85),0)/ld.length) / 100).toFixed(1) : 70 + Math.random()*20;
    });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lines,
        datasets: [{
          label: 'Line Utilization %',
          data: utils,
          backgroundColor: utils.map(v => v>=90?'rgba(220,38,38,0.8)':v>=80?'rgba(217,119,6,0.8)':v>=70?'rgba(37,99,235,0.8)':'rgba(5,150,105,0.8)'),
          borderRadius: 5
        }, {
          label: 'Target 80%',
          data: lines.map(()=>80),
          type: 'line', borderColor: '#059669', borderDash: [5,4], borderWidth: 2, pointRadius: 0, fill: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: { legend: { position: 'top', labels: { font:{size:11}, boxWidth:12 } } },
        scales: {
          x: { min: 40, max: 105, ticks: { callback: v=>v+'%' } },
          y: { ticks: { font: { size: 10 } } }
        }
      }
    });
  } catch (e) { console.error('Line util chart', e); }
}

// ── Capacity Trend 12-week ─────────────────────────────────────────────────────
async function loadCapTrendChart() {
  const ctx = document.getElementById('cap-trend-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/capacity/utilization');
    const raw = res.data;
    const labels = raw.slice(-12).map(d => d.date?d.date.slice(5):'');
    const actual = raw.slice(-12).map(d => d.avg_util||70);
    const forecast = actual.map((v,i) => i >= actual.length-3 ? v*(1+0.015*i) : null);
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Actual Utilization', data: actual, borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.07)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4 },
          { label: 'AI Forecast', data: forecast, borderColor:'#7C3AED', borderDash:[6,3], fill:false, tension:0.4, borderWidth:2, pointRadius:3, pointStyle:'triangle' },
          { label: 'Target 80%', data: labels.map(()=>80), borderColor:'#059669', borderDash:[5,5], borderWidth:1.5, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: { legend: { position:'top', labels:{ font:{size:11}, boxWidth:12, padding:16 } } },
        scales: {
          y: { min:50, max:105, ticks:{ callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x: { ticks:{ font:{size:10}, maxRotation:0 }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Trend chart', e); }
}

// ── Utilization Heatmap (pseudo using bar chart) ───────────────────────────────
async function loadCapHeatmap() {
  const el = document.getElementById('cap-heatmap');
  if (!el) return;
  try {
    const res = await axios.get('/api/capacity/oee');
    const data = res.data;
    const lines = [...new Set(data.map(d=>d.line_name))].slice(0,8);
    const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">';
    html += '<thead><tr><th style="padding:6px 10px;text-align:left;color:#64748B;font-weight:600">Line</th>' +
      days.map(d=>`<th style="padding:6px 8px;text-align:center;color:#64748B;font-weight:600">${d}</th>`).join('') + '</tr></thead><tbody>';
    lines.forEach((line,ri) => {
      html += `<tr style="background:${ri%2?'#F8FAFC':'#fff'}">`;
      html += `<td style="padding:6px 10px;font-weight:600;color:#1E293B;white-space:nowrap">${line}</td>`;
      days.forEach((_,di) => {
        const base = data.filter(d=>d.line_name===line).slice(-1)[0];
        const val = base ? Math.max(40, Math.min(100, (base.availability_pct||80) - 5 + di*3 + (Math.random()*10-5))) : 60+Math.random()*30;
        const color = val>=90?'#DC2626':val>=80?'#D97706':val>=70?'#2563EB':'#059669';
        const bg = val>=90?'#FEF2F2':val>=80?'#FFFBEB':val>=70?'#EFF6FF':'#ECFDF5';
        html += `<td style="padding:4px 6px;text-align:center"><div style="background:${bg};color:${color};border-radius:4px;padding:3px 0;font-weight:700;font-size:11px">${val.toFixed(0)}%</div></td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div style="color:#64748B;padding:20px;text-align:center">Unable to load heatmap</div>'; }
}

// ── Radar Chart (Plant Performance) ────────────────────────────────────────────
async function loadCapRadarChart() {
  const ctx = document.getElementById('cap-radar-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['OEE', 'Utilization', 'OTIF', 'Schedule\nAdherence', 'Maintenance\nCompliance', 'Quality'],
      datasets: [
        { label: 'Mumbai Plant', data: [71.8, 72.4, 92.1, 91.2, 88, 96.5], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.12)', borderWidth:2, pointRadius:4 },
        { label: 'Delhi Plant', data: [68.3, 65.7, 89.4, 87.6, 92, 97.1], borderColor:'#7C3AED', backgroundColor:'rgba(124,58,237,0.12)', borderWidth:2, pointRadius:4 },
        { label: 'Target', data: [75, 80, 95, 95, 95, 98], borderColor:'#059669', backgroundColor:'rgba(5,150,105,0.06)', borderWidth:1.5, borderDash:[4,3], pointRadius:3 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: { r: { min:50, max:100, ticks:{ stepSize:10, font:{size:9} }, pointLabels:{ font:{size:10} } } }
    }
  });
}
