// ======================================================
// SYDIAI Resource Planning Module JS
// Workforce utilization, skills, shift planning
// ======================================================
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById('res-kpi-grid')) await loadResKPIs();
  if (document.getElementById('res-util-chart')) await loadResUtilChart();
  if (document.getElementById('res-skill-matrix')) await loadSkillMatrix();
  if (document.getElementById('res-shift-chart')) loadShiftChart();
  if (document.getElementById('res-overtime-chart')) loadOvertimeChart();
  if (document.getElementById('res-operators-table')) await loadOperatorsTable();
  if (document.getElementById('res-capacity-chart')) await loadResCapacityChart();
  if (document.getElementById('res-efficiency-trend')) loadEfficiencyTrend();
  if (document.getElementById('res-headcount-chart')) loadHeadcountChart();
});

// ── KPI Cards ─────────────────────────────────────────────────────────────────
async function loadResKPIs() {
  const grid = document.getElementById('res-kpi-grid');
  if (!grid) return;
  try {
    const res = await axios.get('/api/resource/kpis');
    const kpis = res.data;
    const icons = {
      'Avg Resource Utilization': 'fa-tachometer-alt',
      'Operators On Shift': 'fa-users',
      'Overtime Hours': 'fa-clock',
      'Training Coverage': 'fa-graduation-cap',
      'Workforce Efficiency': 'fa-chart-line',
      'Skill Gap Lines': 'fa-exclamation-circle'
    };
    grid.innerHTML = kpis.map(k => {
      const sc = k.status==='healthy'?'healthy':k.status==='critical'?'critical':'warning';
      const icon = icons[k.name]||'fa-users-cog';
      return `<div class="kpi-card ${sc}">
        <div class="kpi-label"><i class="fas ${icon}" style="margin-right:4px"></i>${k.name}</div>
        <div class="kpi-value ${sc}">${k.value}<span style="font-size:0.65rem"> ${k.unit||''}</span></div>
        ${k.target!==undefined?`<div class="kpi-meta"><span class="kpi-target">Target: ${k.target} ${k.unit||''}</span></div>`:''}
      </div>`;
    }).join('');
  } catch(e) { grid.innerHTML = '<p style="color:#64748B;padding:20px;text-align:center">Error loading KPIs</p>'; }
}

// ── Resource Utilization by Line ───────────────────────────────────────────────
async function loadResUtilChart() {
  const ctx = document.getElementById('res-util-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/resource/capacity');
    const data = res.data;
    const lines = [...new Set(data.map(d => d.line_name||d.plant_name||'Line'))].slice(0, 10);
    const avgUtil = lines.map(l => {
      const ld = data.filter(d => (d.line_name||d.plant_name) === l);
      return ld.length ? +(ld.reduce((a,b)=>a+(b.utilization_pct||80),0)/ld.length).toFixed(1) : 75+Math.random()*20;
    });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: lines,
        datasets: [
          { label: 'Utilization %', data: avgUtil, backgroundColor: avgUtil.map(v=>v>90?'rgba(220,38,38,0.8)':v>80?'rgba(217,119,6,0.8)':'rgba(37,99,235,0.8)'), borderRadius:5 },
          { label: 'Target 85%', data: lines.map(()=>85), type:'line', borderColor:'#059669', borderDash:[5,4], borderWidth:2, pointRadius:0, fill:false }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis:'y',
        plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales: {
          x: { min:40, max:105, ticks:{ callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
          y: { ticks:{ font:{size:10} }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Res util chart', e); }
}

// ── Skill Matrix Table ─────────────────────────────────────────────────────────
async function loadSkillMatrix() {
  const el = document.getElementById('res-skill-matrix');
  if (!el) return;
  try {
    const res = await axios.get('/api/resource/operators');
    const operators = res.data.slice(0, 12);
    const skills = [...new Set(operators.map(o => o.skill_name))].slice(0, 6);
    let html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">';
    html += '<thead><tr style="background:#F8FAFC"><th style="padding:8px 12px;text-align:left;white-space:nowrap;font-weight:600;color:#475569">Operator</th>' +
      skills.map(s => `<th style="padding:8px;text-align:center;font-weight:600;color:#475569;white-space:nowrap">${s.slice(0,14)}</th>`).join('') +
      '<th style="padding:8px;text-align:center;font-weight:600;color:#475569">Status</th></tr></thead><tbody>';

    const operatorNames = [...new Set(operators.map(o => o.operator_name))].slice(0, 8);
    operatorNames.forEach((name, ri) => {
      html += `<tr style="background:${ri%2?'#F8FAFC':'#fff'};border-bottom:1px solid #F1F5F9">`;
      html += `<td style="padding:7px 12px;font-weight:600;color:#1E293B;white-space:nowrap">
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#1E3A8A,#3B82F6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:700">${name.slice(0,1)}</div>
          ${name.length>14?name.slice(0,12)+'..':name}
        </div>
      </td>`;
      skills.forEach(skill => {
        const op = operators.find(o => o.operator_name === name && o.skill_name === skill);
        if (op) {
          const lvl = op.proficiency_level||2;
          const colors = {1:'#DC2626',2:'#D97706',3:'#2563EB',4:'#059669',5:'#7C3AED'};
          const labels = {1:'Basic',2:'Developing',3:'Proficient',4:'Expert',5:'Master'};
          const dots = Array.from({length:5}, (_,i) => `<span style="width:10px;height:10px;border-radius:50%;background:${i<lvl?colors[lvl]:'#E2E8F0'};display:inline-block;margin:0 1px"></span>`).join('');
          html += `<td style="padding:7px 8px;text-align:center">
            <div style="display:flex;align-items:center;justify-content:center;gap:1px">${dots}</div>
            <div style="font-size:9px;color:${colors[lvl]};font-weight:600;margin-top:2px">${labels[lvl]}</div>
          </td>`;
        } else {
          html += `<td style="padding:7px 8px;text-align:center"><span style="color:#E2E8F0;font-size:1.2rem">—</span></td>`;
        }
      });
      const opData = operators.find(o => o.operator_name === name);
      const st = opData ? opData.status : 'active';
      html += `<td style="padding:7px 8px;text-align:center"><span class="badge badge-${st==='active'?'healthy':'warning'}">${st}</span></td></tr>`;
    });
    html += '</tbody></table></div>';
    el.innerHTML = html;
  } catch(e) { el.innerHTML = '<div style="color:#64748B;padding:20px;text-align:center">Error loading skill matrix</div>'; }
}

// ── Shift Coverage Chart ───────────────────────────────────────────────────────
function loadShiftChart() {
  const ctx = document.getElementById('res-shift-chart');
  if (!ctx) return;
  const lines = ['PET Line 1','PET Line 2','Can Line 1','Glass Line','Tetra Line'];
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: lines,
      datasets: [
        { label: 'Shift A (06:00-14:00)', data: [8,8,6,5,4], backgroundColor:'rgba(37,99,235,0.8)', borderRadius:3 },
        { label: 'Shift B (14:00-22:00)', data: [7,8,6,4,4], backgroundColor:'rgba(124,58,237,0.8)', borderRadius:3 },
        { label: 'Shift C (22:00-06:00)', data: [6,7,5,4,3], backgroundColor:'rgba(8,145,178,0.8)', borderRadius:3 },
        { label: 'Required', data: [8,8,6,5,4], type:'line', borderColor:'#DC2626', borderDash:[4,3], borderWidth:2, pointRadius:4, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { beginAtZero:true, title:{ display:true, text:'Operators' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Overtime Trend ─────────────────────────────────────────────────────────────
function loadOvertimeChart() {
  const ctx = document.getElementById('res-overtime-chart');
  if (!ctx) return;
  const weeks = ['W19','W20','W21','W22','W23','W24'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: weeks,
      datasets: [
        { label: 'Overtime Hours', data: [118, 132, 145, 138, 142, 142], borderColor:'#DC2626', backgroundColor:'rgba(220,38,38,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4 },
        { label: 'Target Max 100h', data: weeks.map(()=>100), borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { beginAtZero:true, title:{ display:true, text:'Hours/week' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Operators Table ────────────────────────────────────────────────────────────
async function loadOperatorsTable() {
  const tbody = document.getElementById('res-operators-table');
  if (!tbody) return;
  try {
    const res = await axios.get('/api/resource/operators');
    const ops = res.data.slice(0, 15);
    const byOp = {};
    ops.forEach(o => {
      if (!byOp[o.operator_name]) byOp[o.operator_name] = { ...o, skills: [] };
      byOp[o.operator_name].skills.push(o.skill_name);
    });
    tbody.innerHTML = Object.values(byOp).map((op, i) => {
      const profColor = op.proficiency_level>=4?'healthy':op.proficiency_level>=3?'info':op.proficiency_level>=2?'warning':'critical';
      const certDate = op.certification_date ? op.certification_date.slice(0,10) : '—';
      const expDate = op.expiry_date ? op.expiry_date.slice(0,10) : '—';
      return `<tr>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#1E3A8A,#3B82F6);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:700;flex-shrink:0">${op.operator_name.slice(0,1)}</div>
            <strong>${op.operator_name}</strong>
          </div>
        </td>
        <td>${op.plant_name||'Mumbai'}</td>
        <td>${op.line_name||'PET Line'}</td>
        <td>${op.skills.slice(0,3).map(s=>`<span style="display:inline-block;background:#EFF6FF;color:#2563EB;padding:1px 6px;border-radius:4px;font-size:10px;margin:1px">${s.slice(0,12)}</span>`).join('')}</td>
        <td><span class="badge badge-${profColor}">Level ${op.proficiency_level||2}</span></td>
        <td style="font-size:0.78rem;color:#64748B">${certDate}</td>
        <td style="font-size:0.78rem;color:#64748B">${expDate}</td>
        <td><span class="badge badge-${op.status==='active'?'healthy':'warning'}">${op.status||'active'}</span></td>
      </tr>`;
    }).join('');
  } catch(e) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#64748B;padding:20px">Error loading operators</td></tr>'; }
}

// ── Available Hours vs Utilization ────────────────────────────────────────────
async function loadResCapacityChart() {
  const ctx = document.getElementById('res-capacity-chart');
  if (!ctx) return;
  try {
    const res = await axios.get('/api/resource/capacity');
    const data = res.data.slice(0, 10);
    const labels = data.map(d => d.capacity_date ? d.capacity_date.slice(5,10) : 'Day');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Available Hours', data: data.map(d => d.available_hours||16), backgroundColor:'rgba(37,99,235,0.7)', borderRadius:4 },
          { label: 'Maintenance', data: data.map(d => d.maintenance_hours||2), backgroundColor:'rgba(220,38,38,0.6)', borderRadius:4 },
          { label: 'Utilization %', data: data.map(d => d.utilization_pct||80), type:'line', borderColor:'#059669', backgroundColor:'transparent', borderWidth:2, pointRadius:4, yAxisID:'y2' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        interaction: { mode:'index', intersect:false },
        plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
        scales: {
          y: { beginAtZero:true, title:{ display:true, text:'Hours' }, grid:{ color:'rgba(0,0,0,0.04)' } },
          y2: { position:'right', min:50, max:110, title:{ display:true, text:'%' }, ticks:{ callback:v=>v+'%' }, grid:{ display:false } },
          x: { ticks:{ font:{size:10} }, grid:{ display:false } }
        }
      }
    });
  } catch(e) { console.error('Res capacity chart', e); }
}

// ── Workforce Efficiency Trend ─────────────────────────────────────────────────
function loadEfficiencyTrend() {
  const ctx = document.getElementById('res-efficiency-trend');
  if (!ctx) return;
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        { label: 'Workforce Efficiency %', data: [85.2, 86.1, 84.8, 87.4, 88.2, 88.5], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:5 },
        { label: 'Training Coverage %', data: [71, 72.5, 74, 75.1, 76.4, 77.2], borderColor:'#7C3AED', backgroundColor:'transparent', fill:false, tension:0.4, borderWidth:2, pointRadius:4 },
        { label: 'Target 90%', data: months.map(()=>90), borderColor:'#059669', borderDash:[5,4], borderWidth:1.5, pointRadius:0, fill:false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y: { min:65, max:100, ticks:{ callback: v=>v+'%' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
}

// ── Headcount by Plant ─────────────────────────────────────────────────────────
function loadHeadcountChart() {
  const ctx = document.getElementById('res-headcount-chart');
  if (!ctx) return;
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Mumbai','Delhi','Chennai','Hyderabad'],
      datasets: [
        { label: 'Operators', data: [48, 36, 28, 22], backgroundColor:'rgba(37,99,235,0.8)', borderRadius:4 },
        { label: 'Technicians', data: [12, 9, 7, 6], backgroundColor:'rgba(124,58,237,0.8)', borderRadius:4 },
        { label: 'Supervisors', data: [6, 4, 3, 2], backgroundColor:'rgba(8,145,178,0.8)', borderRadius:4 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        x: { stacked:true, ticks:{ font:{size:10} }, grid:{ display:false } },
        y: { stacked:true, title:{ display:true, text:'Headcount' }, grid:{ color:'rgba(0,0,0,0.04)' } }
      }
    }
  });
}
