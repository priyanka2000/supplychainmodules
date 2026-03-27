// Deployment Planning Module JS
// Handles all deployment/distribution planning page interactions and chart rendering

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || '';

  if (page === 'deployment-home') initDeploymentHome();
  if (page === 'deployment-network') initNetwork();
  if (page === 'deployment-workbench') initDeployWorkbench();
  if (page === 'deployment-routes') initRoutes();
  if (page === 'deployment-load') initLoadPlanning();
  if (page === 'deployment-carriers') initCarriers();
  if (page === 'deployment-scenarios') initDeployScenarios();
  if (page === 'deployment-mlmodels') initDeployMLModels();
  if (page === 'deployment-analytics') initDeployAnalytics();
});

// ── Shared helpers ──────────────────────────────────────────────────
const COLORS = { blue: '#2563EB', green: '#059669', amber: '#D97706', red: '#DC2626', purple: '#7C3AED', cyan: '#0891B2', navy: '#1E3A8A' };

// ── Deployment Home ──────────────────────────────────────────────────
async function initDeploymentHome() {
  // KPIs
  const kpis = await axios.get('/api/deployment/kpis').then(r => r.data).catch(() => generateDeployKPIs());
  const grid = document.getElementById('dep-kpi-grid');
  if (grid) {
    const data = kpis.length ? kpis : generateDeployKPIs();
    grid.innerHTML = data.map(k => `
      <div class="kpi-card ${k.status}">
        <div class="kpi-label"><i class="fas ${k.icon || 'fa-truck'}" style="margin-right:5px"></i>${k.name}</div>
        <div class="kpi-value ${k.status}">${k.value}</div>
        <div class="kpi-meta">
          <span class="kpi-target">Target: ${k.target}</span>
          <span class="kpi-trend ${k.trend_dir || 'up'}">${k.trend || ''}</span>
        </div>
      </div>`).join('');
  }

  // Fleet utilization chart
  const fleetCtx = document.getElementById('dep-fleet-chart');
  if (fleetCtx) {
    new Chart(fleetCtx, {
      type: 'bar',
      data: {
        labels: ['Mumbai Hub', 'Delhi Hub', 'Chennai Hub', 'Kolkata Hub', 'Bangalore Hub', 'Hyderabad Hub'],
        datasets: [
          { label: 'Truck Utilization %', data: [87, 79, 83, 71, 88, 76], backgroundColor: [87, 79, 83, 71, 88, 76].map(v => v >= 85 ? '#1D4ED8' : v >= 75 ? '#059669' : '#D97706'), borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }

  // On-time delivery trend
  const otdCtx = document.getElementById('dep-otd-chart');
  if (otdCtx) {
    const weeks = ['W-8', 'W-7', 'W-6', 'W-5', 'W-4', 'W-3', 'W-2', 'W-1'];
    new Chart(otdCtx, {
      type: 'line',
      data: {
        labels: weeks,
        datasets: [
          { label: 'OTD %', data: [88.2, 89.1, 87.4, 90.3, 91.2, 89.8, 92.1, 91.4], borderColor: COLORS.green, backgroundColor: 'rgba(5,150,105,0.1)', fill: true, tension: 0.4, borderWidth: 2 },
          { label: 'Target 95%', data: Array(8).fill(95), borderColor: COLORS.red, borderDash: [5, 3], borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 80, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }

  // Cost breakdown donut
  const costCtx = document.getElementById('dep-cost-chart');
  if (costCtx) {
    new Chart(costCtx, {
      type: 'doughnut',
      data: {
        labels: ['Primary Transport', 'Secondary Transport', 'Warehousing', 'Last Mile', 'Cold Chain'],
        datasets: [{ data: [42, 28, 15, 10, 5], backgroundColor: [COLORS.blue, COLORS.purple, COLORS.green, COLORS.amber, COLORS.cyan], borderWidth: 2 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '60%' }
    });
  }
}

function generateDeployKPIs() {
  return [
    { name: 'On-Time Delivery', value: '91.4%', target: '95%', status: 'warning', icon: 'fa-clock', trend: '↑ +0.7%', trend_dir: 'up' },
    { name: 'Truck Utilization', value: '84.2%', target: '88%', status: 'warning', icon: 'fa-truck', trend: '↑ +1.2%', trend_dir: 'up' },
    { name: 'Logistics Cost/Case', value: '₹18.4', target: '₹17.0', status: 'critical', icon: 'fa-rupee-sign', trend: '↓ –₹0.3', trend_dir: 'up' },
    { name: 'Routes Optimized', value: '124', target: '150', status: 'warning', icon: 'fa-route', trend: '↑ +12', trend_dir: 'up' },
    { name: 'Avg Lead Time', value: '2.8 days', target: '2.5 days', status: 'warning', icon: 'fa-hourglass-half', trend: '↓ –0.2d', trend_dir: 'up' },
    { name: 'Fill Rate', value: '96.8%', target: '98%', status: 'warning', icon: 'fa-boxes', trend: '↑ +0.4%', trend_dir: 'up' }
  ];
}

// ── Distribution Network ──────────────────────────────────────────────
function initNetwork() {
  const flowCtx = document.getElementById('network-flow-chart');
  if (flowCtx) {
    const labels = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore', 'Hyderabad'];
    new Chart(flowCtx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Outbound Volume (K cases/wk)', data: [480, 360, 280, 220, 310, 195], backgroundColor: COLORS.blue, borderRadius: 3 },
          { label: 'Inbound Transfers (K cases/wk)', data: [0, 120, 80, 60, 40, 55], backgroundColor: COLORS.cyan, borderRadius: 3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });
  }

  const covCtx = document.getElementById('network-coverage-chart');
  if (covCtx) {
    const channels = ['Modern Trade', 'General Trade', 'E-Commerce', 'HoReCa', 'Exports'];
    new Chart(covCtx, {
      type: 'radar',
      data: {
        labels: channels,
        datasets: [
          { label: 'Coverage %', data: [96, 88, 82, 74, 68], borderColor: COLORS.blue, backgroundColor: 'rgba(37,99,235,0.12)', borderWidth: 2 },
          { label: 'Target %', data: [98, 95, 90, 85, 80], borderColor: COLORS.red, backgroundColor: 'rgba(220,38,38,0.06)', borderDash: [5, 3], borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } } }
    });
  }

  const tbody = document.getElementById('network-nodes-table');
  if (tbody) {
    const nodes = [
      { hub: 'Mumbai Mega Hub', type: 'Manufacturing + Distribution', capacity: 2800, utilization: 87, lanes: 42, otd: 91.2, status: 'critical' },
      { hub: 'Delhi Primary DC', type: 'Distribution Centre', capacity: 1800, utilization: 79, lanes: 31, otd: 93.4, status: 'warning' },
      { hub: 'Chennai Regional DC', type: 'Distribution Centre', capacity: 1400, utilization: 83, lanes: 24, otd: 89.8, status: 'warning' },
      { hub: 'Kolkata Secondary DC', type: 'Distribution Centre', capacity: 1100, utilization: 71, lanes: 19, otd: 94.1, status: 'healthy' },
      { hub: 'Bangalore Tech DC', type: 'Distribution Centre', capacity: 1600, utilization: 88, lanes: 27, otd: 90.6, status: 'critical' },
      { hub: 'Hyderabad Hub', type: 'Cross-dock + Storage', capacity: 980, utilization: 76, lanes: 16, otd: 92.3, status: 'warning' },
    ];
    tbody.innerHTML = nodes.map(n => `
      <tr>
        <td><strong>${n.hub}</strong></td>
        <td>${n.type}</td>
        <td>${n.capacity.toLocaleString()} cases/day</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="progress-bar" style="width:80px"><div class="progress-fill ${n.status}" style="width:${n.utilization}%"></div></div>
            <span style="font-weight:600;color:${n.utilization >= 85 ? '#DC2626' : '#D97706'}">${n.utilization}%</span>
          </div>
        </td>
        <td>${n.lanes} active</td>
        <td style="font-weight:600;color:${n.otd >= 93 ? '#059669' : '#D97706'}">${n.otd}%</td>
        <td><span class="badge badge-${n.status}">${n.status === 'critical' ? 'Capacity Alert' : n.status === 'warning' ? 'Monitor' : 'Optimal'}</span></td>
        <td><button class="btn btn-sm btn-secondary"><i class="fas fa-map-marker-alt"></i> Details</button></td>
      </tr>`).join('');
  }
}

// ── Deployment Workbench ──────────────────────────────────────────────
async function initDeployWorkbench() {
  const shipments = await axios.get('/api/deployment/shipments').then(r => r.data).catch(() => generateShipments());
  const tbody = document.getElementById('dep-shipments-table');
  if (tbody) {
    const rows = shipments.length ? shipments : generateShipments();
    tbody.innerHTML = rows.slice(0, 18).map(s => `
      <tr>
        <td><strong>${s.id || s.shipment_id}</strong></td>
        <td>${s.origin}</td>
        <td>${s.destination}</td>
        <td>${Number(s.volume || 0).toLocaleString()} cases</td>
        <td>${s.truck_type}</td>
        <td style="font-weight:600">${s.utilization}%</td>
        <td>${s.etd}</td>
        <td>${s.eta}</td>
        <td><span class="badge badge-${s.status === 'in_transit' ? 'success' : s.status === 'planned' ? 'info' : s.status === 'delayed' ? 'critical' : 'neutral'}">${s.status}</span></td>
        <td>
          <button class="btn btn-sm btn-secondary" onclick="optimizeLoad('${s.id || s.shipment_id}')"><i class="fas fa-compress-arrows-alt"></i></button>
          <button class="btn btn-sm btn-secondary"><i class="fas fa-eye"></i></button>
        </td>
      </tr>`).join('');
  }

  // Load gauge chart
  const loadCtx = document.getElementById('dep-load-gauge-chart');
  if (loadCtx) {
    new Chart(loadCtx, {
      type: 'doughnut',
      data: {
        labels: ['Loaded', 'Empty'],
        datasets: [{ data: [84, 16], backgroundColor: [COLORS.blue, '#E2E8F0'], borderWidth: 0, circumference: 180, rotation: 270 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { enabled: false } }, cutout: '70%' }
    });
    const center = document.getElementById('dep-load-gauge-value');
    if (center) center.textContent = '84%';
  }
}

function generateShipments() {
  const origins = ['Mumbai', 'Delhi', 'Chennai', 'Bangalore'];
  const destinations = ['Pune', 'Nashik', 'Surat', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Nagpur', 'Coimbatore', 'Mysore', 'Hyderabad', 'Vizag', 'Bhopal', 'Indore'];
  const trucks = ['22ft Container', '32ft Container', '20ft Refrigerated', '40ft Trailer'];
  const statuses = ['in_transit', 'planned', 'planned', 'loading', 'delayed'];
  return Array.from({ length: 18 }, (_, i) => {
    const vol = Math.round((800 + Math.random() * 1200) / 10) * 10;
    const util = Math.round(75 + Math.random() * 22);
    return {
      id: `SHP-${String(20260317 + i).slice(-4)}-${String(i + 1).padStart(3, '0')}`,
      origin: origins[i % origins.length],
      destination: destinations[i % destinations.length],
      volume: vol,
      truck_type: trucks[i % trucks.length],
      utilization: util,
      etd: `Mar ${17 + Math.floor(i / 6)}, 08:00`,
      eta: `Mar ${17 + Math.floor(i / 6) + 1}, ${['10:00', '14:00', '18:00', '22:00'][i % 4]}`,
      status: statuses[i % statuses.length]
    };
  });
}

function optimizeLoad(id) {
  const btn = event.target.closest('button');
  btn.innerHTML = '<i class="fas fa-check"></i>';
  btn.style.background = '#059669';
  btn.style.color = 'white';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i>'; btn.removeAttribute('style'); }, 2000);
}

// ── Route Optimization ─────────────────────────────────────────────────
async function initRoutes() {
  const routes = await axios.get('/api/deployment/routes').then(r => r.data).catch(() => generateRoutes());

  const tbody = document.getElementById('routes-table-body');
  if (tbody) {
    const rows = routes.length ? routes : generateRoutes();
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><strong>${r.route_id}</strong></td>
        <td>${r.origin} → ${r.destination}</td>
        <td>${r.distance_km} km</td>
        <td>${r.transit_time}</td>
        <td style="font-weight:600;color:${r.cost_per_case > 20 ? '#DC2626' : r.cost_per_case > 17 ? '#D97706' : '#059669'}">₹${r.cost_per_case}/case</td>
        <td>${r.carrier}</td>
        <td><span class="badge badge-${r.optimization_score >= 90 ? 'success' : r.optimization_score >= 75 ? 'warning' : 'critical'}">${r.optimization_score}%</span></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="reoptimizeRoute('${r.route_id}')"><i class="fas fa-route"></i> Optimize</button>
        </td>
      </tr>`).join('');
  }

  // Route cost by mode chart
  const costCtx = document.getElementById('routes-cost-chart');
  if (costCtx) {
    new Chart(costCtx, {
      type: 'bar',
      data: {
        labels: ['Road – Full Truck', 'Road – Partial', 'Rail – Freight', 'Air – Express', 'Milk Run – GT'],
        datasets: [
          { label: 'Avg Cost/Case (₹)', data: [16.2, 22.8, 12.4, 48.6, 19.1], backgroundColor: [COLORS.green, COLORS.amber, COLORS.blue, COLORS.red, COLORS.purple], borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₹' + v } } } }
    });
  }

  // Transit time distribution
  const transitCtx = document.getElementById('routes-transit-chart');
  if (transitCtx) {
    new Chart(transitCtx, {
      type: 'bar',
      data: {
        labels: ['< 1 day', '1–2 days', '2–3 days', '3–4 days', '> 4 days'],
        datasets: [
          { label: 'Routes', data: [18, 42, 31, 12, 5], backgroundColor: [COLORS.green, COLORS.blue, COLORS.cyan, COLORS.amber, COLORS.red], borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  }
}

function generateRoutes() {
  const pairs = [
    ['Mumbai', 'Pune', 148, '4 hrs'], ['Mumbai', 'Surat', 284, '6 hrs'], ['Mumbai', 'Nashik', 167, '4.5 hrs'],
    ['Delhi', 'Jaipur', 281, '5 hrs'], ['Delhi', 'Lucknow', 555, '9 hrs'], ['Delhi', 'Chandigarh', 260, '5 hrs'],
    ['Chennai', 'Bangalore', 346, '6 hrs'], ['Chennai', 'Coimbatore', 498, '8 hrs'], ['Bangalore', 'Hyderabad', 568, '9 hrs'],
    ['Mumbai', 'Nagpur', 842, '13 hrs'], ['Delhi', 'Agra', 233, '4 hrs'], ['Chennai', 'Vizag', 723, '12 hrs']
  ];
  const carriers = ['BlueDart Logistics', 'DHL Supply Chain', 'Gati-KWE', 'Mahindra Logistics', 'VRL Logistics'];
  return pairs.map((p, i) => ({
    route_id: `RT-${String(i + 1).padStart(3, '0')}`,
    origin: p[0], destination: p[1], distance_km: p[2], transit_time: p[3],
    cost_per_case: (14 + Math.random() * 10).toFixed(1),
    carrier: carriers[i % carriers.length],
    optimization_score: Math.round(70 + Math.random() * 28)
  }));
}

function reoptimizeRoute(id) {
  const btn = event.target.closest('button');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-check"></i> Done'; btn.className = 'btn btn-sm btn-success'; }, 2000);
}

// ── Load Planning ─────────────────────────────────────────────────────
function initLoadPlanning() {
  const ctx = document.getElementById('load-utilization-chart');
  if (ctx) {
    const trucks = ['Truck 001', 'Truck 002', 'Truck 003', 'Truck 004', 'Truck 005', 'Truck 006', 'Truck 007', 'Truck 008'];
    const util = [92, 78, 88, 65, 95, 82, 71, 89];
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: trucks,
        datasets: [
          { label: 'Space Utilization %', data: util, backgroundColor: util.map(v => v >= 90 ? COLORS.blue : v >= 75 ? COLORS.green : COLORS.amber), borderRadius: 4 },
          { label: 'Weight Utilization %', data: util.map(v => Math.round(v * 0.92)), backgroundColor: util.map(v => `rgba(37,99,235,0.3)`), borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }

  // SKU mix donut
  const mixCtx = document.getElementById('load-sku-mix-chart');
  if (mixCtx) {
    new Chart(mixCtx, {
      type: 'doughnut',
      data: {
        labels: ['PET 500ml', 'PET 1L', 'Mango 200ml', 'Can 250ml', 'Glass 500ml', 'Others'],
        datasets: [{ data: [35, 28, 18, 12, 5, 2], backgroundColor: [COLORS.blue, COLORS.purple, COLORS.green, COLORS.amber, COLORS.cyan, '#94A3B8'], borderWidth: 2 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } }, cutout: '55%' }
    });
  }

  // Load plans table
  const tbody = document.getElementById('load-plans-table');
  if (tbody) {
    const plans = [
      { id: 'LP-001', truck: 'MH-04-AB-1234', type: '32ft Container', origin: 'Mumbai WH', destination: 'Pune DC', skus: 3, cases: 1240, weight: '18.6T', space: 92, weight_util: 87, depart: 'Mar 17, 06:00' },
      { id: 'LP-002', truck: 'DL-01-CD-5678', type: '22ft Container', origin: 'Delhi WH', destination: 'Jaipur DC', skus: 2, cases: 820, weight: '12.3T', space: 78, weight_util: 74, depart: 'Mar 17, 08:00' },
      { id: 'LP-003', truck: 'TN-09-EF-9012', type: '22ft Container', origin: 'Chennai WH', destination: 'Coimbatore DC', skus: 4, cases: 960, weight: '14.4T', space: 88, weight_util: 83, depart: 'Mar 17, 07:00' },
      { id: 'LP-004', truck: 'KA-03-GH-3456', type: '32ft Container', origin: 'Bangalore WH', destination: 'Hyderabad DC', skus: 5, cases: 1380, weight: '20.7T', space: 95, weight_util: 91, depart: 'Mar 18, 06:00' },
      { id: 'LP-005', truck: 'MH-04-IJ-7890', type: '22ft Container', origin: 'Mumbai WH', destination: 'Nashik DC', skus: 2, cases: 680, weight: '10.2T', space: 65, weight_util: 62, depart: 'Mar 17, 10:00' }
    ];
    tbody.innerHTML = plans.map(p => `
      <tr>
        <td><strong>${p.id}</strong></td>
        <td>${p.truck}</td>
        <td>${p.type}</td>
        <td>${p.origin} → ${p.destination}</td>
        <td>${p.skus} SKUs · ${p.cases.toLocaleString()} cases</td>
        <td>${p.weight}</td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="progress-bar" style="width:60px"><div class="progress-fill ${p.space >= 90 ? 'healthy' : 'warning'}" style="width:${p.space}%"></div></div>
            ${p.space}%
          </div>
        </td>
        <td>${p.depart}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="optimizeLoadPlan('${p.id}')"><i class="fas fa-magic"></i> Optimize</button>
        </td>
      </tr>`).join('');
  }
}

function optimizeLoadPlan(id) {
  const btn = event.target.closest('button');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
  setTimeout(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> +3.2%';
    btn.className = 'btn btn-sm btn-success';
  }, 2000);
}

// ── Carrier Selection ──────────────────────────────────────────────────
function initCarriers() {
  const perfCtx = document.getElementById('carrier-perf-chart');
  if (perfCtx) {
    new Chart(perfCtx, {
      type: 'radar',
      data: {
        labels: ['On-Time %', 'Damage Rate', 'Cost Score', 'Tracking', 'Flexibility', 'Capacity'],
        datasets: [
          { label: 'BlueDart', data: [94, 92, 78, 96, 85, 88], borderColor: COLORS.blue, backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 2 },
          { label: 'DHL Supply', data: [92, 95, 72, 98, 90, 82], borderColor: COLORS.green, backgroundColor: 'rgba(5,150,105,0.1)', borderWidth: 2 },
          { label: 'Gati-KWE', data: [88, 88, 88, 84, 86, 92], borderColor: COLORS.amber, backgroundColor: 'rgba(217,119,6,0.1)', borderWidth: 2 },
          { label: 'Mahindra Log', data: [90, 90, 85, 88, 88, 90], borderColor: COLORS.purple, backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } } }
    });
  }

  const tbody = document.getElementById('carrier-table-body');
  if (tbody) {
    const carriers = [
      { name: 'BlueDart Logistics', lanes: 28, otd: 94.2, damage: 0.12, cost: 16.8, tracking: 'GPS + IoT', rating: 4.6, spend_share: 32, status: 'preferred' },
      { name: 'DHL Supply Chain', lanes: 22, otd: 92.1, damage: 0.08, cost: 18.4, tracking: 'Real-time', rating: 4.4, spend_share: 24, status: 'preferred' },
      { name: 'Gati-KWE', lanes: 34, otd: 88.4, damage: 0.21, cost: 14.2, tracking: 'Manual', rating: 3.9, spend_share: 28, status: 'approved' },
      { name: 'Mahindra Logistics', lanes: 18, otd: 90.3, damage: 0.16, cost: 15.6, tracking: 'GPS', rating: 4.1, spend_share: 12, status: 'approved' },
      { name: 'VRL Logistics', lanes: 12, otd: 85.6, damage: 0.28, cost: 12.8, tracking: 'Basic', rating: 3.6, spend_share: 4, status: 'conditional' }
    ];
    tbody.innerHTML = carriers.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.lanes}</td>
        <td style="font-weight:600;color:${c.otd >= 92 ? '#059669' : '#D97706'}">${c.otd}%</td>
        <td style="color:${c.damage <= 0.1 ? '#059669' : c.damage <= 0.2 ? '#D97706' : '#DC2626'}">${c.damage}%</td>
        <td>₹${c.cost}/case</td>
        <td>${c.tracking}</td>
        <td>⭐ ${c.rating}</td>
        <td>${c.spend_share}%</td>
        <td><span class="badge badge-${c.status === 'preferred' ? 'success' : c.status === 'approved' ? 'info' : 'warning'}">${c.status}</span></td>
        <td><button class="btn btn-sm btn-primary"><i class="fas fa-file-contract"></i> Contract</button></td>
      </tr>`).join('');
  }
}

// ── Scenarios ─────────────────────────────────────────────────────────
function initDeployScenarios() {
  const list = document.getElementById('dep-scenarios-list');
  if (!list) return;
  const scenarios = [
    { name: 'Base Deployment Plan – Mar 2026', desc: 'Standard distribution aligned with production plan. 124 routes active across 6 hubs.', driver: 'Standard', status: 'active', impact: '0%', updated: 'Mar 15, 2026' },
    { name: 'Hub Consolidation – Close Kolkata', desc: 'Consolidate Kolkata DC into Bhubaneswar hub. Reduce fixed cost by ₹18L/month. Transit +0.3 days for eastern routes.', driver: 'Cost', status: 'draft', impact: '–₹18L/mo', updated: 'Mar 12, 2026' },
    { name: 'Direct-to-Retail Pilot', desc: 'Skip regional DC for top 50 Modern Trade chains. Expected OTD improvement to 97%. Cost increase +₹1.2/case.', driver: 'Service', status: 'review', impact: '+5.6% OTD', updated: 'Mar 14, 2026' },
    { name: 'Rail Freight Expansion', desc: 'Shift 30% of long-haul (>600km) routes to rail freight. Cost reduction ₹4.2/case, transit +6 hrs.', driver: 'Cost', status: 'draft', impact: '–26% cost', updated: 'Mar 13, 2026' },
    { name: 'Flood Contingency – West Coast', desc: 'Reroute Mumbai shipments via Pune during monsoon. Backup carriers activated. Service maintained at 88% OTD.', driver: 'Risk', status: 'draft', impact: '–3.4% OTD', updated: 'Mar 16, 2026' }
  ];
  list.innerHTML = scenarios.map(s => `
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-layer-group"></i> ${s.name}</span>
        <div style="display:flex;gap:8px">
          <span class="badge badge-${s.status === 'active' ? 'success' : s.status === 'draft' ? 'neutral' : 'info'}">${s.status}</span>
          <button class="btn btn-sm btn-primary" onclick="runDeployScenario(this)"><i class="fas fa-play"></i> Run</button>
          <button class="btn btn-sm btn-secondary"><i class="fas fa-copy"></i> Clone</button>
        </div>
      </div>
      <div class="card-body">
        <p style="color:#64748B;font-size:13px;margin-bottom:12px">${s.desc}</p>
        <div class="grid-3">
          <div><div style="font-size:11px;color:#64748B">Driver</div><strong>${s.driver}</strong></div>
          <div><div style="font-size:11px;color:#64748B">Impact</div><strong style="color:${s.impact.startsWith('+') && !s.impact.includes('OTD') ? '#059669' : s.impact.startsWith('–') ? '#DC2626' : '#059669'}">${s.impact}</strong></div>
          <div><div style="font-size:11px;color:#64748B">Updated</div><strong>${s.updated}</strong></div>
        </div>
      </div>
    </div>`).join('');
}

function runDeployScenario(btn) {
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
  setTimeout(() => { btn.innerHTML = '<i class="fas fa-check"></i> Done'; btn.className = 'btn btn-sm btn-success'; }, 2500);
}

// ── ML Models ─────────────────────────────────────────────────────────
function initDeployMLModels() {
  const perf = document.getElementById('dep-ml-perf-chart');
  if (perf) {
    new Chart(perf, {
      type: 'radar',
      data: {
        labels: ['Accuracy', 'Precision', 'Recall', 'F1 Score', 'Coverage', 'Speed'],
        datasets: [
          { label: 'Route Optimizer', data: [91, 89, 92, 90, 88, 95], borderColor: COLORS.blue, backgroundColor: 'rgba(37,99,235,0.1)', borderWidth: 2 },
          { label: 'OTD Predictor', data: [87, 90, 85, 87, 84, 92], borderColor: COLORS.green, backgroundColor: 'rgba(5,150,105,0.1)', borderWidth: 2 },
          { label: 'Load Optimizer', data: [94, 92, 91, 92, 90, 88], borderColor: COLORS.purple, backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 2 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } } }
    });
  }

  const trend = document.getElementById('dep-ml-trend-chart');
  if (trend) {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    new Chart(trend, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          { label: 'Route Optimizer Score', data: [84, 86, 87, 89, 90, 91], borderColor: COLORS.blue, fill: false, tension: 0.4 },
          { label: 'OTD Prediction Accuracy', data: [81, 83, 84, 85, 86, 87], borderColor: COLORS.green, fill: false, tension: 0.4 },
          { label: 'Load Optimizer Score', data: [88, 89, 91, 92, 93, 94], borderColor: COLORS.purple, fill: false, tension: 0.4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 75, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }
}

// ── Analytics ─────────────────────────────────────────────────────────
async function initDeployAnalytics() {
  const otdCtx = document.getElementById('dep-otd-trend-chart');
  if (otdCtx) {
    const weeks = Array.from({ length: 12 }, (_, i) => `W-${12 - i}`);
    new Chart(otdCtx, {
      type: 'line',
      data: {
        labels: weeks.reverse(),
        datasets: [
          { label: 'Actual OTD %', data: [87.2, 88.1, 86.4, 89.3, 90.2, 88.8, 91.1, 90.4, 92.3, 91.8, 92.1, 91.4], borderColor: COLORS.blue, fill: false, tension: 0.4, borderWidth: 2 },
          { label: 'Target 95%', data: Array(12).fill(95), borderColor: COLORS.red, borderDash: [5, 3], borderWidth: 2, pointRadius: 0, fill: false }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { min: 80, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }

  const costCtx = document.getElementById('dep-cost-trend-chart');
  if (costCtx) {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    new Chart(costCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: 'Primary Transport (₹L)', data: [142, 148, 156, 138, 144, 140], backgroundColor: COLORS.blue, borderRadius: 3 },
          { label: 'Secondary Transport (₹L)', data: [94, 98, 104, 91, 96, 93], backgroundColor: COLORS.purple, borderRadius: 3 },
          { label: 'Warehousing (₹L)', data: [52, 54, 58, 50, 53, 51], backgroundColor: COLORS.green, borderRadius: 3 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
    });
  }
}

// ── Global action handlers ─────────────────────────────────────────────
window.redesignNetwork = function() {
  const btn = document.querySelector('[onclick="redesignNetwork()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...'; }
  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-sitemap"></i> Redesign Network'; }
    if (window.showToast) window.showToast('Network Redesign Complete: 3 hub consolidations identified. Projected savings ₹18.4L/year. Review recommendations in Scenarios tab.', 'success');
  }, 2200);
};

window.optimizeLane = function(from, to) {
  if (window.showToast) window.showToast('Lane Optimization: ' + from + ' → ' + to + ' — Re-routing via alternate hub. ETA improvement: +2.1 hrs. Carrier switch recommended.', 'success');
};
