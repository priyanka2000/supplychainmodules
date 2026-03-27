// SYDIAI Supply Chain Intelligence Suite - Global App JS
// Users: Sankar (Supply Chain Director) & Vikrant (Operations Manager)

(function() {
  'use strict';

  // ── MOCK DATA FALLBACK + AXIOS INTERCEPTOR ───────────────────────────────
  function isEmptyData(data) {
    if (data == null) return true;
    if (Array.isArray(data)) return data.length === 0;
    if (typeof data === 'object') {
      if (Array.isArray(data.data)) return data.data.length === 0;
      if (data.data == null && Object.keys(data).length === 0) return true;
      return Object.keys(data).length === 0;
    }
    return false;
  }

  function resolveMockFromUrl(url) {
    const u = String(url || '').toLowerCase();
    const mrp = window.getMRPData ? window.getMRPData() : null;

    if (u.includes('/mrp')) {
      if (u.includes('/kpis')) return mrp && mrp.kpis ? mrp.kpis : [];
      if (u.includes('/alerts')) return mrp && mrp.alerts ? mrp.alerts : [];
      if (u.includes('/materials')) return mrp && mrp.materials ? mrp.materials : [];
      if (u.includes('/run-mrp')) return mrp && mrp.runResult ? mrp.runResult : {};
      return mrp && mrp.alerts ? mrp.alerts : [];
    }

    if (u.includes('/network') || u.includes('/deployment')) {
      const network = window.getNetworkData ? window.getNetworkData() : { nodes: [] };
      if (u.includes('/kpis')) {
        return [
          { name: 'On-Time Delivery', value: '93.1%', target: '95%', status: 'warning', trend: '↑ +0.8%', icon: 'fa-clock' },
          { name: 'Truck Utilization', value: '84.6%', target: '88%', status: 'warning', trend: '↑ +1.1%', icon: 'fa-truck' },
          { name: 'Routes Optimized', value: '132', target: '150', status: 'warning', trend: '↑ +9', icon: 'fa-route' }
        ];
      }
      if (u.includes('/shipments')) {
        return network.lanes.map((l, i) => ({
          shipment_id: `SHP-MK-${String(i + 1).padStart(3, '0')}`,
          origin: l.origin,
          destination: l.destination,
          volume: 900 + i * 120,
          truck_type: '32ft Container',
          utilization: 78 + i * 4,
          etd: 'Mar 27, 08:00',
          eta: 'Mar 28, 10:00',
          status: i % 3 === 0 ? 'in_transit' : 'planned'
        }));
      }
      if (u.includes('/routes')) {
        return network.lanes.map((l, i) => ({
          route_id: l.lane_id,
          origin: l.origin,
          destination: l.destination,
          distance_km: 180 + i * 60,
          transit_time: `${6 + i} hrs`,
          cost_per_case: (15.5 + i * 0.9).toFixed(1),
          carrier: ['BlueDart Logistics', 'DHL Supply Chain', 'Gati-KWE', 'Mahindra Logistics'][i % 4],
          optimization_score: 80 + i * 3
        }));
      }
      return network.nodes || [];
    }

    if (u.includes('/forecast') || u.includes('/sop/forecast')) {
      return window.getForecastData ? window.getForecastData() : [];
    }

    if (u.includes('/atp')) {
      return window.getATPData ? window.getATPData() : [];
    }

    if (u.includes('/po') || u.includes('/procurement/plans')) {
      return window.getPOData ? window.getPOData() : [];
    }

    return null;
  }

  function setupAxiosFallbackInterceptor() {
    if (!window.axios || window.__mockAxiosInterceptorSet) return;

    window.axios.interceptors.response.use(
      function onFulfilled(response) {
        const url = response && response.config ? response.config.url : '';
        const mockData = resolveMockFromUrl(url);
        if (mockData !== null && isEmptyData(response.data)) {
          response.data = mockData;
        }
        return response;
      },
      function onRejected(error) {
        const config = error && error.config ? error.config : {};
        const mockData = resolveMockFromUrl(config.url);
        if (mockData !== null) {
          return Promise.resolve({
            data: mockData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config
          });
        }
        return Promise.reject(error);
      }
    );

    window.__mockAxiosInterceptorSet = true;
  }

  function loadMockDataScript() {
    if (window.getTimeSeriesData && window.getMRPData) {
      setupAxiosFallbackInterceptor();
      return;
    }

    const script = document.createElement('script');
    script.src = '/static/mock-data.js';
    script.async = false;
    script.onload = function () {
      setupAxiosFallbackInterceptor();
    };
    script.onerror = function () {
      setupAxiosFallbackInterceptor();
    };
    document.head.appendChild(script);
  }

  loadMockDataScript();

  window.__refreshMRPViews = async function() {
    if (typeof window.loadAlertsTable === 'function') await window.loadAlertsTable();
    if (typeof window.loadMaterialsTable === 'function') await window.loadMaterialsTable();
    if (typeof window.loadAlertChart === 'function') await window.loadAlertChart();
    if (typeof window.loadMaterialChart === 'function') await window.loadMaterialChart();
    if (typeof window.loadCoverageChart === 'function') await window.loadCoverageChart();
  };

  window.__simulateWithMockData = function() {
    window.dispatchEvent(new CustomEvent('mock-data-simulated', {
      detail: {
        ts: Date.now(),
        forecast: window.getForecastData ? window.getForecastData() : [],
        network: window.getNetworkData ? window.getNetworkData() : { nodes: [] }
      }
    }));
  };

  window.__exportCurrentTable = function(buttonEl) {
    const root = (buttonEl && (buttonEl.closest('.card') || buttonEl.closest('.panel') || buttonEl.closest('section'))) || document;
    const table = root.querySelector('table');
    if (!table) {
      if (window.showToast) window.showToast('No table available to export', 'warning');
      return;
    }

    const rows = Array.from(table.querySelectorAll('tr'));
    const csv = rows.map(row => Array.from(row.querySelectorAll('th,td'))
      .map(cell => `"${String(cell.textContent || '').replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`)
      .join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast('Table export downloaded', 'success');
  };

  // ── GLOBAL CLOCK ──────────────────────────────────────────────────────────
  function updateClock() {
    const el = document.getElementById('global-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  }
  setInterval(updateClock, 1000);
  updateClock();

  // ── NOTIFICATION PANEL TOGGLE ─────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('.notif-btn');
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    if (btn) {
      panel.classList.toggle('open');
      e.stopPropagation();
    } else if (!e.target.closest('#notif-panel')) {
      panel.classList.remove('open');
    }
  });

  // ── AI ASK WIDGET ─────────────────────────────────────────────────────────
  const askBtn = document.getElementById('ai-ask-btn');
  const askInput = document.getElementById('ai-ask-input');
  const askResponse = document.getElementById('ai-response-box');

  if (askBtn && askInput && askResponse) {
    const responses = {
      default: [
        "📊 Overall supply chain health is at 78%. Three bottlenecks identified in Mumbai PET Lines. Recommend immediate capacity rebalancing.",
        "⚠️ MRP alert: CO₂ Gas below reorder point (28 MT vs 30 MT minimum). Emergency PO required from Reliance Industries within 24 hrs.",
        "📈 OTIF service level at 92.8% vs 95% target. Main drag: Chennai Can Line changeover delays (+35% over standard time).",
        "💰 Cost per case trending ₹18.2 vs target ₹17.5. Primary driver: overtime costs +₹14L in Week 24. Resource rebalancing recommended.",
        "🏭 Mumbai Plant running at 84% capacity. Delhi Plant at 71% — opportunity to shift 2,000 MT production load to improve overall OEE.",
      ],
      forecast: "📊 Demand forecast for next 4 weeks: +12% above baseline driven by festive season. Current capacity can absorb up to +8%. Gap of ~4% requires either overtime authorization (Est. ₹8.2L) or supplier pre-positioning.",
      stock: "📦 Current stock positions: A-class SKUs average 14.7 days of supply vs 14-day target — on track. However, SKU-009 (Mango Delight) at 7.2 days — URGENT replenishment needed. SKU-011 (Energy Rush) excess 42 days — recommend promotion/diversion.",
      otif: "🎯 OTIF deep-dive: 92.8% overall. Worst performers: Chennai HoReCa (88.2%), Delhi General Trade (89.5%). Root cause: material shortage on 3 SKUs + Line 3 unplanned downtime. Actions: expedite PO-2024-1843, schedule Line 3 maintenance.",
    };
    
    askBtn.addEventListener('click', function() {
      const q = askInput.value.trim().toLowerCase();
      if (!q) return;
      
      let resp;
      if (q.includes('forecast') || q.includes('demand')) resp = responses.forecast;
      else if (q.includes('stock') || q.includes('inventory')) resp = responses.stock;
      else if (q.includes('otif') || q.includes('service')) resp = responses.otif;
      else resp = responses.default[Math.floor(Math.random() * responses.default.length)];
      
      askResponse.style.display = 'block';
      askResponse.innerHTML = `<strong>AI Analysis:</strong> ${resp}<br><small style="opacity:0.7;margin-top:8px;display:block">Query: "${askInput.value}" | Analyzed: ${new Date().toLocaleTimeString()}</small>`;
      askInput.value = '';
    });
    
    askInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') askBtn.click();
    });
  }

  // ── EXEC TICKER ───────────────────────────────────────────────────────────
  const ticker = document.getElementById('exec-ticker-msg');
  if (ticker) {
    const messages = [
      "🟢 Sankar: Mumbai PET Line 1 & 2 running at 96.2% — review capacity headroom for next week's +15% demand spike",
      "⚠️ Vikrant: CO₂ Gas shortage alert — 28 MT on hand vs 30 MT reorder point — place emergency PO immediately",
      "📊 S&OP Week 24 consensus: Forecast accuracy 87.3% | Supply plan adherence 89.5% | OTIF 92.8% — below 95% target",
      "💡 Optimization opportunity: Shifting 12,000 cases from Mumbai to Delhi can reduce logistics cost by ₹3.2L/week",
      "🏭 Sankar: Line 3 OEE trending down — 74.4% vs 78% target — changeover matrix review recommended",
      "📦 Vikrant: Inventory review — 12 SKUs at stockout risk, excess stock value ₹2.8M — replenishment plan needed",
    ];
    let idx = 0;
    function nextMsg() {
      ticker.textContent = messages[idx % messages.length];
      idx++;
    }
    nextMsg();
    setInterval(nextMsg, 10000);
  }

  // ── TAB SYSTEM ────────────────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    const tabGroup = tab.dataset.tabGroup || 'default';
    const tabTarget = tab.dataset.tab;
    
    document.querySelectorAll(`[data-tab-group="${tabGroup}"]`).forEach(t => t.classList.remove('active'));
    document.querySelectorAll(`[data-tab-content][data-tab-group="${tabGroup}"]`).forEach(t => t.style.display = 'none');
    
    tab.classList.add('active');
    const content = document.querySelector(`[data-tab-content="${tabTarget}"][data-tab-group="${tabGroup}"]`);
    if (content) content.style.display = '';
  });

  // ── FILTER CHIPS ──────────────────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    const chip = e.target.closest('.filter-chip');
    if (!chip) return;
    const group = chip.parentElement;
    if (!group) return;
    group.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    
    const filter = chip.dataset.filter;
    const target = chip.dataset.filterTarget;
    if (filter && target) {
      document.querySelectorAll(`[data-filterable="${target}"]`).forEach(row => {
        if (filter === 'all') row.style.display = '';
        else row.style.display = row.dataset.status === filter ? '' : 'none';
      });
    }
  });

  // ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────
  window.showToast = function(msg, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:9999;
      background:${type==='success'?'#10B981':type==='error'?'#EF4444':'#F59E0B'};
      color:#fff;padding:12px 20px;border-radius:10px;
      font-size:0.875rem;font-weight:600;
      box-shadow:0 4px 20px rgba(0,0,0,0.2);
      animation:slideInRight 0.3s ease;
      max-width:360px;line-height:1.5;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3500);
  };

  // ── SEARCH / FILTER TABLE ────────────────────────────────────────────────
  document.querySelectorAll('[data-search-table]').forEach(input => {
    input.addEventListener('input', function() {
      const tableId = this.dataset.searchTable;
      const q = this.value.toLowerCase();
      document.querySelectorAll(`#${tableId} tr`).forEach(row => {
        row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  });

  // ── SIMULATE ACTION BUTTONS ──────────────────────────────────────────────
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    
    if (action === 'run-optimization') {
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px"></span> Running...';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Optimization Complete';
        btn.style.background = '#10B981';
        window.showToast('✅ Optimization completed! Identified ₹2.1L savings opportunity.', 'success');
        setTimeout(() => { btn.innerHTML = btn.dataset.originalText || 'Run Optimization'; btn.style.background = ''; btn.disabled = false; }, 4000);
      }, 2500);
      btn.dataset.originalText = btn.textContent;
    }
    
    if (action === 'run-mrp') {
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px"></span> Computing...';
      btn.disabled = true;
      setTimeout(async () => {
        btn.innerHTML = '<i class="fas fa-check"></i> MRP Complete';
        btn.style.background = '#10B981';
        window.showToast('✅ MRP run complete. 5 new shortage alerts generated. 3 POs recommended.', 'success');
        if (typeof window.__refreshMRPViews === 'function') await window.__refreshMRPViews();
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-cogs"></i> Run MRP'; btn.style.background = ''; btn.disabled = false; }, 3000);
      }, 3000);
    }
    
    if (action === 'run-sop') {
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px"></span> Running S&OP...';
      btn.disabled = true;
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> S&OP Updated';
        btn.style.background = '#10B981';
        window.showToast('✅ S&OP cycle complete. Plan reliability: 93.5%. 4 new action items created.', 'success');
        setTimeout(() => { btn.innerHTML = '<i class="fas fa-chart-line"></i> Run S&OP'; btn.style.background = ''; btn.disabled = false; }, 3000);
      }, 2800);
    }

    if (action === 'simulate') {
      btn.disabled = true;
      const original = btn.innerHTML;
      btn.innerHTML = '<span class="spinner" style="width:14px;height:14px;border-width:2px;margin-right:8px"></span> Simulating...';
      setTimeout(() => {
        if (typeof window.__simulateWithMockData === 'function') window.__simulateWithMockData();
        btn.innerHTML = '<i class="fas fa-check"></i> Simulated';
        btn.style.background = '#2563EB';
        if (window.showToast) window.showToast('Simulation completed with updated mock dataset', 'success');
        setTimeout(() => {
          btn.innerHTML = original;
          btn.style.background = '';
          btn.disabled = false;
        }, 1800);
      }, 1200);
    }

    if (action === 'export') {
      if (typeof window.__exportCurrentTable === 'function') window.__exportCurrentTable(btn);
    }
    
    if (action === 'publish-plan') {
      if (confirm('Publish production plan to execution? This will lock sequences for the next 48 hours.')) {
        window.showToast('✅ Production plan published. Sequence locked for 48-hr horizon.', 'success');
      }
    }
    
    if (action === 'approve-po') {
      const row = btn.closest('tr');
      if (row) { row.style.background = '#ECFDF5'; btn.innerHTML = '<i class="fas fa-check"></i> Approved'; btn.disabled = true; }
      window.showToast('✅ Purchase order approved and sent to supplier.', 'success');
    }
    
    if (action === 'create-scenario') {
      const name = prompt('Enter scenario name:');
      if (name) window.showToast(`✅ Scenario "${name}" created. Configure parameters to run.`, 'success');
    }
  });

  // ── GLOBAL BUTTON HANDLERS (used across pages) ───────────────────────────

  window.newProcurementPO = function() {
    const mat = prompt('Material name:') || 'PET Resin 500ml';
    const qty = prompt('Quantity (units):') || '50000';
    const supplier = prompt('Supplier name:') || 'PetroPlastics Ltd';
    const del = prompt('Delivery date (YYYY-MM-DD):') || new Date(Date.now()+10*864e5).toISOString().slice(0,10);
    if (mat && qty) {
      const poNum = 'PO-' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + String(Math.floor(Math.random()*900)+100);
      window.showToast('PO ' + poNum + ' created: ' + mat + ' × ' + Number(qty).toLocaleString() + ' units from ' + supplier + '. Delivery: ' + del + '. Status: Draft.', 'success');
      const tbody = document.querySelector('#po-workbench-table tbody, .data-table tbody');
      if (tbody) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td><strong>' + poNum + '</strong></td><td>' + mat + '</td><td>' + supplier + '</td><td>' + Number(qty).toLocaleString() + '</td><td>₹' + (Number(qty)*0.00018).toFixed(1) + 'L</td><td>' + del + '</td><td><span class="badge badge-warning">draft</span></td><td><button class="btn btn-sm btn-success" data-action="approve-po">Approve</button> <button class="btn btn-sm btn-secondary">View</button></td>';
        tbody.insertBefore(tr, tbody.firstChild);
      }
    }
  };

  window.optimizeSeq = function(btn) {
    if (!btn) return;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Optimize Sequence';
      window.showToast('Sequence optimized: 3 changeovers eliminated. Efficiency gain: +12.4%. Estimated savings: ₹8.4L/month.', 'success');
    }, 2000);
  };

  window.autoOptimize = function(btn) {
    if (!btn) return;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Auto-Optimize';
      window.showToast('Auto-Optimization complete: Schedule adherence improved from 91.8% → 94.2%. 2 capacity conflicts resolved.', 'success');
    }, 2200);
  };

  window.publishPlan = function(btn) {
    if (confirm('Publish plan to execution? This will lock the schedule for the next 48 hours.')) {
      window.showToast('Plan published. Schedule locked for 48-hr horizon. MES notified.', 'success');
    }
  };

  window.addSequencingScenario = function(btn) {
    const name = prompt('Scenario name:') || 'New Scenario';
    const driver = prompt('Optimization driver (e.g., "Cost Optimal", "OTD Focused"):') || 'Cost Optimal';
    if (name) window.showToast('Scenario "' + name + '" (' + driver + ') created. Configure parameters and run to compare.', 'success');
  };

  window.addOperator = function() {
    const name = prompt('Operator name:') || 'New Operator';
    const plant = prompt('Plant (e.g., MUM, DEL, CHN):') || 'MUM';
    const skill = prompt('Primary skill (e.g., Line Operation, Packaging, Quality):') || 'Line Operation';
    if (name) window.showToast('Operator ' + name + ' added to ' + plant + ' plant with skill: ' + skill + '. Pending certification review.', 'success');
  };

  window.addSopActionItem = function() {
    const title = prompt('Action item title:') || 'New Action Item';
    const owner = prompt('Owner name:') || 'Supply Chain Team';
    const due = prompt('Due date (YYYY-MM-DD):') || new Date(Date.now()+7*864e5).toISOString().slice(0,10);
    if (title) window.showToast('Action item "' + title + '" assigned to ' + owner + '. Due: ' + due + '.', 'success');
  };

  window.recalcRCCP = function(btn) {
    if (!btn) return;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recalculating...';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync"></i> Recalculate';
      window.showToast('RCCP recalculated. 2 lines overloaded in W2 (MUM-L1: 91%, MUM-L2: 98%). Review and adjust.', 'warning');
    }, 1500);
  };

  window.resolveBottleneck = function(btn) {
    const row = btn && btn.closest('.alert');
    const title = row ? (row.querySelector('strong') || {}).textContent || 'bottleneck' : 'bottleneck';
    window.showToast('Resolution logged for: ' + title + '. Action item created. Follow-up in 24 hrs.', 'success');
    if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Resolved'; btn.disabled = true; btn.className = 'btn btn-sm btn-success'; }
  };

  window.runCarrierRFQ = function(btn) {
    if (!btn) return;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running RFQ...';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-gavel"></i> Run RFQ';
      window.showToast('RFQ sent to 5 carriers. Responses expected within 48 hours. BlueDart and DHL pre-qualified for preferential rates.', 'success');
    }, 2000);
  };

  window.addCarrier = function() {
    const name = prompt('Carrier name:') || 'New Carrier';
    const lanes = prompt('Number of lanes:') || '3';
    if (name) window.showToast('Carrier "' + name + '" added with ' + lanes + ' lanes. Pending contract upload and SLA configuration.', 'success');
  };

  window.runMLModel = function(btn, modelName) {
    if (!btn) return;
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Training...';
    setTimeout(() => {
      btn.disabled = false; btn.innerHTML = '<i class="fas fa-play"></i> Run';
      const acc = (Math.random() * 3 + 85).toFixed(1);
      window.showToast('ML Model "' + (modelName || 'Forecast') + '" training complete. Accuracy: ' + acc + '%. MAPE: ' + (100 - Number(acc)).toFixed(1) + '%. Model updated.', 'success');
    }, 2500);
  };

  window.lockHorizon = function(btn) {
    if (confirm('Lock scheduling horizon for the next 48 hours? Changes will require override authorization.')) {
      window.showToast('48-hour horizon locked. Override requires Plant Manager approval.', 'success');
      if (btn) { btn.innerHTML = '<i class="fas fa-lock"></i> Horizon Locked'; btn.disabled = true; }
    }
  };

  // ── HOME PAGE DATA LOADING ────────────────────────────────────────────────
  async function loadDashboardSummary() {
    const el = document.getElementById('dashboard-summary-stats');
    if (!el) return;
    try {
      const res = await fetch('/api/dashboard/summary');
      const data = await res.json();
      const d = data.data;
      el.innerHTML = `
        <div class="stat-item">
          <div class="stat-value" style="color:var(--color-primary)">${d.plants}</div>
          <div class="stat-label">Active Plants</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:var(--color-secondary)">${d.lines}</div>
          <div class="stat-label">Production Lines</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:var(--color-critical)">${d.open_alerts}</div>
          <div class="stat-label">Open Alerts</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" style="color:var(--color-healthy)">${d.active_jobs}</div>
          <div class="stat-label">Active Jobs</div>
        </div>
      `;
    } catch {}
  }

  async function loadModuleHealthScores() {
    const grid = document.getElementById('module-grid');
    if (!grid) return;

    const modules = [
      { id:'capacity', name:'Capacity Planning', icon:'fa-industry', gradient:'linear-gradient(135deg,#1E3A8A,#3B82F6)', path:'/capacity',
        kpi1:{label:'Utilization',val:'68.5%'}, kpi2:{label:'OEE',val:'71.4%'}, health:'warning', score:72, alerts:3,
        desc:'Monitor production capacity, utilization trends, OEE and bottleneck management across all plants.' },
      { id:'sequencing', name:'Sequencing & Scheduling', icon:'fa-calendar-alt', gradient:'linear-gradient(135deg,#0E7490,#06B6D4)', path:'/sequencing',
        kpi1:{label:'Adherence',val:'91.2%'}, kpi2:{label:'Delay',val:'1.2h'}, health:'healthy', score:88, alerts:2,
        desc:'Optimize production sequences, manage job queues, changeover matrix and live schedule adherence.' },
      { id:'mrp', name:'Material Requirements', icon:'fa-boxes', gradient:'linear-gradient(135deg,#065F46,#10B981)', path:'/mrp',
        kpi1:{label:'On-Time',val:'88.7%'}, kpi2:{label:'Shortages',val:'5'}, health:'warning', score:76, alerts:5,
        desc:'Full MRP explosion engine, BOM management, purchase order lifecycle and shortage alerts.' },
      { id:'inventory', name:'Inventory Planning', icon:'fa-warehouse', gradient:'linear-gradient(135deg,#92400E,#F59E0B)', path:'/inventory',
        kpi1:{label:'Turnover',val:'8.3x'}, kpi2:{label:'DoS',val:'32d'}, health:'warning', score:71, alerts:12,
        desc:'Safety stock, reorder points, ABC/XYZ classification and replenishment optimization.' },
      { id:'procurement', name:'Procurement Planning', icon:'fa-shopping-cart', gradient:'linear-gradient(135deg,#7C3AED,#A78BFA)', path:'/procurement',
        kpi1:{label:'On-Time',val:'94.1%'}, kpi2:{label:'Active POs',val:'48'}, health:'healthy', score:83, alerts:4,
        desc:'Complete PO lifecycle, supplier scorecard, contract management and GRN tracking.' },
      { id:'resource', name:'Resource Planning', icon:'fa-users-cog', gradient:'linear-gradient(135deg,#BE185D,#EC4899)', path:'/resource',
        kpi1:{label:'Utilization',val:'82.6%'}, kpi2:{label:'Efficiency',val:'91.3%'}, health:'healthy', score:85, alerts:2,
        desc:'Workforce optimization, skill matrix, shift planning and overtime management.' },
      { id:'sop', name:'Sales & Operations', icon:'fa-chart-line', gradient:'linear-gradient(135deg,#1D4ED8,#60A5FA)', path:'/sop',
        kpi1:{label:'Forecast Acc.',val:'87.3%'}, kpi2:{label:'OTIF',val:'92.8%'}, health:'warning', score:80, alerts:3,
        desc:'End-to-end S&OP process: demand review, supply plan, consensus meeting and scenarios.' },
    ];

    grid.innerHTML = modules.map(m => `
      <div class="module-card">
        <div class="module-card-top">
          <div class="module-card-icon-wrap" style="background:${m.gradient}">
            <i class="fas ${m.icon}"></i>
          </div>
          <div>
            <div class="module-status-pill ${m.health}">
              <div class="module-status-dot"></div>
              ${m.health === 'healthy' ? 'Healthy' : m.health === 'warning' ? 'Needs Attention' : 'Critical'}
            </div>
            <div style="font-size:0.7rem;color:var(--color-text-muted);margin-top:4px">${m.alerts} alert${m.alerts !== 1 ? 's' : ''}</div>
          </div>
        </div>
        <div class="module-card-body">
          <div class="module-card-name">${m.name}</div>
          <div class="module-card-desc">${m.desc}</div>
          <div class="module-kpi-row">
            <div class="module-mini-kpi">
              <div class="module-mini-kpi-label">${m.kpi1.label}</div>
              <div class="module-mini-kpi-value">${m.kpi1.val}</div>
            </div>
            <div class="module-mini-kpi">
              <div class="module-mini-kpi-label">${m.kpi2.label}</div>
              <div class="module-mini-kpi-value">${m.kpi2.val}</div>
            </div>
          </div>
          <div style="margin-bottom:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:0.7rem;font-weight:600;color:var(--color-text-muted)">HEALTH SCORE</span>
              <span style="font-size:0.8rem;font-weight:700;color:${m.score>=85?'var(--color-healthy)':m.score>=70?'var(--color-warning)':'var(--color-critical)'}">${m.score}/100</span>
            </div>
            <div class="progress-bar-track">
              <div class="progress-bar-fill ${m.score>=85?'healthy':m.score>=70?'warning':'critical'}" style="width:${m.score}%"></div>
            </div>
          </div>
        </div>
        <div class="module-card-footer">
          <a href="${m.path}" class="btn-open-module">
            <i class="fas fa-arrow-right"></i> Open Module
          </a>
        </div>
      </div>
    `).join('');
  }

  async function loadRecentAlerts() {
    const el = document.getElementById('recent-alerts');
    if (!el) return;
    try {
      const res = await fetch('/api/mrp/alerts');
      const data = await res.json();
      const alerts = (data.data || []).slice(0, 5);
      if (alerts.length === 0) { el.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i>No active alerts</div>'; return; }
      el.innerHTML = alerts.map(a => `
        <div class="alert-row ${a.severity === 'high' ? 'critical' : a.severity === 'medium' ? 'warning' : 'healthy'}">
          <div class="alert-icon">
            <i class="fas ${a.alert_type === 'shortage' ? 'fa-exclamation-triangle' : a.alert_type === 'expiry_risk' ? 'fa-clock' : 'fa-info-circle'}"></i>
          </div>
          <div class="alert-content">
            <div class="alert-title">${a.material_name || 'Material Alert'}</div>
            <div class="alert-desc">${a.message}</div>
          </div>
          <span class="badge badge-${a.severity === 'high' ? 'critical' : a.severity === 'medium' ? 'warning' : 'healthy'}">${a.severity}</span>
        </div>
      `).join('');
    } catch {
      el.innerHTML = `
        <div class="alert-row critical"><div class="alert-icon"><i class="fas fa-exclamation-triangle"></i></div><div class="alert-content"><div class="alert-title">CO₂ Gas Shortage</div><div class="alert-desc">Below reorder point - emergency order needed</div></div></div>
        <div class="alert-row warning"><div class="alert-icon"><i class="fas fa-clock"></i></div><div class="alert-content"><div class="alert-title">Natural Flavours Expiry</div><div class="alert-desc">120 Kg expiring in 18 days</div></div></div>
        <div class="alert-row warning"><div class="alert-icon"><i class="fas fa-truck"></i></div><div class="alert-content"><div class="alert-title">Sugar Supplier Delay</div><div class="alert-desc">5-day delay confirmed by Gujarat Alkalies</div></div></div>
      `;
    }
  }

  async function loadTopRecommendations() {
    const el = document.getElementById('top-recommendations');
    if (!el) return;
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      const recs = (data.data || []).slice(0, 4);
      el.innerHTML = recs.map(r => `
        <div style="padding:12px 0;border-bottom:1px solid var(--color-border);display:flex;gap:12px;align-items:flex-start">
          <div style="width:32px;height:32px;border-radius:8px;background:${r.impact==='high'?'var(--color-critical-bg)':r.impact==='medium'?'var(--color-warning-bg)':'var(--color-healthy-bg)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <i class="fas fa-lightbulb" style="font-size:0.75rem;color:${r.impact==='high'?'var(--color-critical)':r.impact==='medium'?'var(--color-warning)':'var(--color-healthy)'}"></i>
          </div>
          <div style="flex:1">
            <div style="font-size:0.875rem;font-weight:600;color:var(--color-text-primary)">${r.title}</div>
            <div style="font-size:0.75rem;color:var(--color-text-muted);margin-top:2px">${r.module ? r.module.toUpperCase() : 'SUPPLY CHAIN'}</div>
          </div>
          <span class="badge badge-${r.impact==='high'?'critical':r.impact==='medium'?'warning':'healthy'}">${r.impact}</span>
        </div>
      `).join('');
    } catch {
      el.innerHTML = `
        <div style="padding:12px 0;border-bottom:1px solid var(--color-border)"><strong>Shift 2,000 MT to Delhi Plant</strong><br><small style="color:var(--color-text-muted)">Reduce Mumbai overload and save ₹3.2L logistics</small></div>
        <div style="padding:12px 0;border-bottom:1px solid var(--color-border)"><strong>Activate backup CO₂ supplier</strong><br><small style="color:var(--color-text-muted)">Prevent production stoppage in 72 hrs</small></div>
        <div style="padding:12px 0"><strong>Increase SKU-007 safety stock by 20%</strong><br><small style="color:var(--color-text-muted)">Prevent stockout risk during festive season</small></div>
      `;
    }
  }

  // Load home page data if on home page
  if (document.getElementById('module-grid')) {
    loadDashboardSummary();
    loadModuleHealthScores();
    loadRecentAlerts();
    loadTopRecommendations();
  }

  // ── CHART DEFAULT CONFIG ───────────────────────────────────────────────────
  if (window.Chart) {
    Chart.defaults.font.family = "'Inter', 'Segoe UI', sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#64748B';
    Chart.defaults.plugins.legend.labels.boxWidth = 12;
    Chart.defaults.plugins.legend.labels.padding = 16;
  }

})();

// ── GLOBAL ACTION HANDLERS (accessible as window globals) ─────────────────

function showToastGlobal(msg, type) {
  if (typeof window.showToast === 'function') { window.showToast(msg, type || 'success'); return; }
  const t = document.createElement('div');
  t.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1e293b;color:#fff;padding:12px 20px;border-radius:8px;z-index:9999;font-size:14px;box-shadow:0 4px 12px rgba(0,0,0,.3);max-width:360px';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

// Sequencing
function lockHorizon(btn) {
  if (!btn) return;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Locking…';
  setTimeout(() => {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-lock"></i> Locked';
    btn.classList.replace('btn-secondary','btn-success');
    showToastGlobal('Production horizon locked for 48 hours. Sequence frozen for W1-W2.');
  }, 1800);
}

function optimizeSeq(btn) {
  if (!btn) return;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimising…';
  setTimeout(() => {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Optimize Sequence';
    showToastGlobal('Sequence Optimised: Changeover reduced 22 %, throughput +8.3 %. Apply to schedule?');
  }, 2600);
}

function autoOptimize(btn) {
  if (!btn) return;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimising…';
  setTimeout(() => {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-rocket"></i> Auto-Optimize';
    showToastGlobal('Auto-Optimize complete: 3 scenarios evaluated. Best plan selected — saves ₹14.2L/month.');
  }, 2400);
}

function addSequencingScenario(btn) {
  const name = prompt('New sequencing scenario name:');
  if (!name) return;
  showToastGlobal('Scenario "' + name + '" created. Configure constraints and run optimisation.');
}

// Resource
function addOperator(btn) {
  const name = prompt('Enter operator name:');
  if (!name) return;
  showToastGlobal('Operator "' + name + '" added to roster. Assign skills and shift pattern in profile.');
}

// SOP
function addSopActionItem() {
  const text = prompt('New action item description:');
  if (!text) return;
  showToastGlobal('Action item added: "' + text + '". Assigned to review queue.');
}

// Procurement
function newProcurementPO() {
  const supplier = prompt('Supplier name for new PO:');
  if (!supplier) return;
  showToastGlobal('Draft PO created for "' + supplier + '". Complete details in PO Workbench.');
}

// MRP
function recalcRCCP(btn) {
  if (!btn) return;
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recalculating…';
  setTimeout(() => {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-sync"></i> Recalculate';
    showToastGlobal('RCCP Recalculated: 2 lines over capacity in W2 (MUM-L2 103 %, DEL-L1 101 %). Review horizon.');
  }, 2200);
}

// Capacity
function resolveBottleneck(btn) {
  if (!btn) return;
  const row = btn.closest('tr');
  const line = row ? (row.cells[0] && row.cells[0].textContent.trim()) : 'Line';
  btn.disabled = true; btn.textContent = 'Resolving…';
  setTimeout(() => {
    btn.textContent = 'Resolved';
    btn.classList.replace('btn-secondary','btn-success');
    btn.disabled = true;
    showToastGlobal('Bottleneck on ' + line + ' resolved: Load rebalanced. ETA improvement 1.5 hrs.');
  }, 1500);
}

// Workbench — changeover matrix load
function loadChangeover() {
  showToastGlobal('Changeover matrix loaded from latest sequence master. All times in hours.');
}

// Carriers
function addCarrier() {
  const name = prompt('Enter carrier / 3PL name:');
  if (!name) return;
  showToastGlobal('Carrier "' + name + '" added to panel. Complete SLA and rate card in profile.');
}
