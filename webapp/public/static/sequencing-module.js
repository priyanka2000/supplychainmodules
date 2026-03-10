// ======================================================
// SYDIAI Sequencing & Scheduling Module JS
// Gantt, job tables, delay analysis, OTD trends
// ======================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('seq-kpi-grid')) await loadSeqKPIs();
  if (document.getElementById('seq-status-chart')) await loadSeqStatusChart();
  if (document.getElementById('seq-priority-chart')) await loadSeqPriorityChart();
  if (document.getElementById('seq-otd-chart')) loadSeqOTDChart();
  if (document.getElementById('seq-delay-chart')) loadSeqDelayChart();
  if (document.getElementById('seq-jobs-table')) await loadJobsTable();
  if (document.getElementById('seq-throughput-chart')) await loadThroughputChart();
  if (document.getElementById('seq-changeover-chart')) await loadChangeoverChart();
  if (document.getElementById('seq-timeline-mini')) await loadMiniTimeline();
  if (document.getElementById('seq-efficiency-chart')) loadEfficiencyChart();
  if (document.getElementById('seq-sched-adherence-chart')) loadSchedAdherenceChart();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadSeqKPIs() {
  const grid = document.getElementById('seq-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/sequencing/kpis');
    const kpis = res.data;
    const icons = {
      'Jobs In Progress': 'fa-play-circle',
      'Schedule Adherence': 'fa-calendar-check',
      'Avg Delay': 'fa-clock',
      'Changeover Loss': 'fa-exchange-alt',
      'OTD Performance': 'fa-truck',
      'Throughput Efficiency': 'fa-tachometer-alt'
    };
    grid.innerHTML = kpis.map(k => {
      const sc = k.status==='healthy'?'healthy':k.status==='critical'?'critical':'warning';
      const icon = icons[k.name] || 'fa-chart-bar';
      return `<div class="kpi-card ${sc}">
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.name}</div>
        <div class="kpi-value ${sc}">${k.value}<span style="font-size:0.65rem"> ${k.unit||''}</span></div>
        ${k.target !== undefined ? `<div class="kpi-meta"><span class="kpi-target">Target: ${k.target} ${k.unit||''}</span></div>` : ''}
      </div>`;
    }).join('');
  } catch(e) { console.error('SeqKPI error', e); }
}

// ── Job Status Doughnut ────────────────────────────────────────────────────────
async function loadSeqStatusChart() {
  const ctx = document.getElementById('seq-status-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/sequencing/jobs');
    const jobs = res.data;
    const statusCounts = {};
    jobs.forEach(j => { statusCounts[j.status] = (statusCounts[j.status]||0) + 1; });
    const colors = { in_progress:'#2563EB', scheduled:'#7C3AED', pending:'#D97706', completed:'#059669', delayed:'#DC2626' };
    const labels = Object.keys(statusCounts).map(s => s.replace('_',' ').replace(/\b\w/g, c=>c.toUpperCase()));
    const total = jobs.length;
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: Object.values(statusCounts), backgroundColor: Object.keys(statusCounts).map(s=>colors[s]||'#64748B'), hoverOffset:6, borderWidth:2, borderColor:'#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout:'68%',
        plugins: {
          legend: { position:'right', labels:{ font:{size:11}, boxWidth:12, padding:10 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw} jobs (${Math.round(ctx.raw/total*100)}%)` } }
        }
      }
    });
  } catch(e) { console.error('Status chart error', e); }
}

// ── Priority Distribution Bar ──────────────────────────────────────────────────
async function loadSeqPriorityChart() {
  const ctx = document.getElementById('seq-priority-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/sequencing/jobs');
    const jobs = res.data;
    const pri = { critical:0, high:0, medium:0, low:0 };
    jobs.forEach(j => { if (pri[j.priority]!==undefined) pri[j.priority]++; });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Critical','High','Medium','Low'],
        datasets: [{
          label: 'Jobs by Priority',
          data: Object.values(pri),
          backgroundColor: ['rgba(220,38,38,0.85)','rgba(217,119,6,0.85)','rgba(37,99,235,0.85)','rgba(100,116,139,0.85)'],
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend:{ display:false } },
        scales: {
          y: { beginAtZero:true, ticks:{ stepSize:1 }, grid:{ color:'rgba(0,0,0,0.04)' } },
          x: { grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Priority chart error', e); }
}

// ── OTD Trend Line ────────────────────────────────────────────────────────────
function loadSeqOTDChart() {
  const ctx = document.getElementById('seq-otd-chart');
  if (!ctx) return;
  const weeks = ['W13','W14','W15','W16','W17','W18','W19','W20','W21','W22','W23','W24'];
  const otd =   [85.2, 87.1, 86.8, 89.4, 88.7, 90.2, 88, 91, 89, 94, 92, 91.2];
  const adherence = [88, 89, 90, 87, 91, 93, 90, 94, 91, 95, 93, 91.5];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        { label: 'OTD %', data: otd, borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4, pointHoverRadius:6 },
        { label: 'Schedule Adherence %', data: adherence, borderColor:'#7C3AED', backgroundColor:'transparent', fill:false, tension:0.4, borderWidth:2, pointRadius:3 },
        { label: 'Target 95%', data: weeks.map(()=>95), borderColor:'#059669', borderDash:[6,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12, padding:14 } } },
      scales: {
        y: { min:80, max:100, ticks:{ callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Delay Root Cause Horizontal Bar ──────────────────────────────────────────
function loadSeqDelayChart() {
  const ctx = document.getElementById('seq-delay-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Equipment Fault','Material Wait','Changeover Overrun','Labour Shortage','Quality Hold','Utility Failure'],
      datasets: [
        { label: 'Delay Minutes (This Week)', data: [87, 42, 28, 15, 9, 6], backgroundColor: ['#DC2626','#0891B2','#D97706','#7C3AED','#64748B','#059669'], borderRadius: 4 },
        { label: 'Prev Week', data: [72, 55, 32, 18, 12, 4], backgroundColor: 'rgba(100,116,139,0.4)', borderRadius: 4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      indexAxis: 'y',
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        x: { beginAtZero:true, title:{ display:true, text:'Minutes' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        y: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Jobs Table ─────────────────────────────────────────────────────────────────
async function loadJobsTable() {
  const tbody = document.getElementById('seq-jobs-table');
  if (!tbody) return;
  try {
    const [jobsRes, skusRes] = await Promise.allSettled([
      axios.get('/api/sequencing/jobs'),
      axios.get('/api/skus')
    ]);
    const jobs = jobsRes.status==='fulfilled' ? jobsRes.value.data : [];
    const skus = skusRes.status==='fulfilled' ? skusRes.value.data : [];
    const skuMap = {};
    skus.forEach(s => skuMap[s.id] = s);
    tbody.innerHTML = jobs.slice(0, 20).map(j => {
      const sku = skuMap[j.sku_id] || {};
      const st = j.status;
      const stColor = st==='in_progress'?'info':st==='completed'?'healthy':st==='delayed'?'critical':st==='pending'?'warning':'';
      const priColor = j.priority==='critical'?'critical':j.priority==='high'?'warning':j.priority==='medium'?'info':'';
      const delay = j.delay_minutes > 0 ? `<span class="badge badge-critical">+${j.delay_minutes}m</span>` : `<span class="badge badge-healthy">On Time</span>`;
      const start = j.scheduled_start ? j.scheduled_start.slice(5,16).replace('T',' ') : '—';
      const end = j.scheduled_end ? j.scheduled_end.slice(5,16).replace('T',' ') : '—';
      return `<tr data-status="${st}">
        <td><strong style="font-size:0.8rem">${j.job_number||('JOB-'+j.id)}</strong></td>
        <td>${sku.sku_name||'SKU-'+j.sku_id}</td>
        <td>${j.quantity ? j.quantity.toLocaleString() : '—'}</td>
        <td><span class="badge badge-${priColor}">${j.priority||'—'}</span></td>
        <td><span class="badge badge-${stColor}">${st.replace('_',' ')}</span></td>
        <td style="font-size:0.78rem">${start}</td>
        <td style="font-size:0.78rem">${end}</td>
        <td>${delay}</td>
        <td>${j.line_name||'—'}</td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#64748B;padding:20px">Error loading jobs</td></tr>'; }
}

// ── Throughput Chart ───────────────────────────────────────────────────────────
async function loadThroughputChart() {
  const ctx = document.getElementById('seq-throughput-chart');
  if (!ctx) return;
  const hours = Array.from({length:12}, (_,i) => `${6+i*2}:00`);
  const actual = [82, 88, 91, 89, 85, 78, 73, 87, 92, 88, 84, 79];
  const target  = hours.map(()=>90);
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: hours,
      datasets: [
        { label: 'Actual Throughput %', data: actual, borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.1)', fill:true, tension:0.35, borderWidth:2.5, pointRadius:4 },
        { label: 'Target 90%', data: target, borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { min:60, max:105, ticks:{ callback: v=>v+'%' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Changeover Matrix Summary ──────────────────────────────────────────────────
async function loadChangeoverChart() {
  const ctx = document.getElementById('seq-changeover-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/sequencing/setup-matrix');
    const matrix = res.data;
    // Group by buckets
    const buckets = { '0-15 min':0, '16-30 min':0, '31-60 min':0, '60+ min':0 };
    matrix.forEach(m => {
      const t = m.setup_time_minutes || 0;
      if (t<=15) buckets['0-15 min']++;
      else if (t<=30) buckets['16-30 min']++;
      else if (t<=60) buckets['31-60 min']++;
      else buckets['60+ min']++;
    });
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(buckets),
        datasets: [{ data: Object.values(buckets), backgroundColor:['#059669','#2563EB','#D97706','#DC2626'], hoverOffset:6, borderWidth:2, borderColor:'#fff' }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout:'60%',
        plugins: { legend:{ position:'right', labels:{ font:{size:11}, boxWidth:12 } } }
      }
    });
  } catch(e) { console.error('Changeover chart', e); }
}

// ── Mini Timeline ─────────────────────────────────────────────────────────────
async function loadMiniTimeline() {
  const el = document.getElementById('seq-timeline-mini');
  if (!el) return;
  try {
    const res = await axios.get('/api/sequencing/jobs');
    const jobs = res.data.filter(j => j.scheduled_start).slice(0, 8);
    const colors = { in_progress:'#2563EB', scheduled:'#7C3AED', pending:'#D97706', completed:'#059669', delayed:'#DC2626' };
    let html = '<div style="display:flex;flex-direction:column;gap:4px">';
    jobs.forEach(j => {
      const c = colors[j.status] || '#64748B';
      const w = Math.max(8, Math.min(85, (j.quantity||1000)/500));
      const label = j.job_number || ('JOB-'+j.id);
      html += `<div style="display:flex;align-items:center;gap:8px;font-size:11px">
        <div style="width:90px;text-align:right;color:#64748B;font-weight:600;flex-shrink:0">${label}</div>
        <div style="flex:1;background:#F1F5F9;border-radius:3px;height:20px;position:relative;overflow:hidden">
          <div style="position:absolute;left:${Math.random()*20}%;width:${w}%;height:100%;background:${c};border-radius:3px;display:flex;align-items:center;padding:0 6px;color:#fff;font-size:10px;font-weight:700;overflow:hidden;white-space:nowrap">
            ${j.sku_name||'SKU'}${j.delay_minutes>0?' ⚠':''}</div>
        </div>
        <span style="color:${c};font-size:10px;font-weight:700;width:55px">${j.status.replace('_',' ')}</span>
      </div>`;
    });
    html += '</div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div style="color:#64748B;padding:12px;text-align:center">Unable to load timeline</div>'; }
}

// ── Efficiency Score Gauge ─────────────────────────────────────────────────────
function loadEfficiencyChart() {
  const ctx = document.getElementById('seq-efficiency-chart');
  if (!ctx) return;
  const val = 84.6;
  const rem = 100 - val;
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [val, rem],
        backgroundColor: ['#2563EB', '#F1F5F9'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout:'80%', rotation:-90, circumference:180,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    },
    plugins: [{
      afterDraw(chart) {
        const { ctx: c, chartArea:{top,bottom,left,right} } = chart;
        const cx = (left+right)/2, cy = bottom;
        c.save();
        c.font = 'bold 26px Inter,sans-serif';
        c.fillStyle = '#1E293B';
        c.textAlign = 'center';
        c.fillText(val.toFixed(1)+'%', cx, cy-12);
        c.font = '12px Inter,sans-serif';
        c.fillStyle = '#64748B';
        c.fillText('Throughput Efficiency', cx, cy+10);
        c.restore();
      }
    }]
  });
}

// ── Schedule Adherence Trend ───────────────────────────────────────────────────
function loadSchedAdherenceChart() {
  const ctx = document.getElementById('seq-sched-adherence-chart');
  if (!ctx) return;
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat'];
  const shifts = {
    'Shift A': [91, 94, 89, 96, 93, 87],
    'Shift B': [85, 88, 92, 90, 88, 82],
    'Shift C': [78, 82, 85, 87, 84, 80]
  };
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: Object.entries(shifts).map(([name, data], i) => ({
        label: name,
        data,
        backgroundColor: ['rgba(37,99,235,0.8)','rgba(124,58,237,0.8)','rgba(8,145,178,0.8)'][i],
        borderRadius: 4
      }))
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { min:70, max:100, ticks:{ callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { grid:{ display:false } }
      }
    }
  });
}
