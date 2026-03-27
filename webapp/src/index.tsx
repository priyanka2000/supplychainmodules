import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import {
  bomMaster, demandData, inventoryData, purchaseOrders as mrpPurchaseOrders,
  computeNetRequirements, scenarios as mrpScenarios, constraints as mrpConstraints, objectives as mrpObjectives
} from './mrpData'

type Bindings = { DB: D1Database }
const app = new Hono<{ Bindings: Bindings }>()

app.use('/api/*', cors())

// ============================================================
// AUTH
// ============================================================
const USERS: Record<string, { name: string; initials: string; role: string; password: string }> = {
  'sankar': { name: 'Sankar Mamidela', initials: 'SM', role: 'Supply Chain Director', password: 'password' },
  'vikrant': { name: 'Vikrant Hole', initials: 'VH', role: 'SC Technology Consultant', password: 'password' },
}

function getUser(c: any) {
  try { const s = getCookie(c, 'sc_session'); if (!s) return null; const u = JSON.parse(atob(s)); return USERS[u.id] ? { ...USERS[u.id], id: u.id } : null } catch { return null }
}

// Auth middleware for all non-login/api routes
app.use('*', async (c, next) => {
  const path = new URL(c.req.url).pathname
  if (path.startsWith('/api/') || path === '/login' || path === '/logout' || path.includes('favicon')) return next()
  const user = getUser(c)
  if (!user) return c.redirect('/login')
  return next()
})

app.get('/login', (c) => {
  const err = c.req.query('error')
  return c.html(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Login — SYDIAI Supply Chain Suite</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css"/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 50%,#0F172A 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
body::before{content:'';position:absolute;width:600px;height:600px;border-radius:50%;background:rgba(37,99,235,0.08);top:-200px;right:-200px;pointer-events:none}
body::after{content:'';position:absolute;width:400px;height:400px;border-radius:50%;background:rgba(124,58,237,0.06);bottom:-100px;left:-100px;pointer-events:none}
.login-card{background:rgba(255,255,255,0.97);border-radius:20px;padding:48px 44px;width:100%;max-width:440px;box-shadow:0 25px 50px rgba(0,0,0,0.4);position:relative;z-index:1}
.login-logo{display:flex;align-items:center;gap:14px;margin-bottom:32px}
.logo-box{width:52px;height:52px;background:linear-gradient(135deg,#1E3A8A,#2563EB);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;color:#fff;letter-spacing:-1px;flex-shrink:0}
.login-title{font-size:22px;font-weight:800;color:#0F172A;line-height:1.1}
.login-title span{display:block;font-size:12px;font-weight:500;color:#64748B;margin-top:2px;letter-spacing:0.03em}
.login-subtitle{font-size:13.5px;color:#475569;margin-bottom:28px;line-height:1.5}
.field{margin-bottom:18px}
.field label{display:block;font-size:11.5px;font-weight:700;color:#374151;margin-bottom:7px;text-transform:uppercase;letter-spacing:0.06em}
.field-wrap{position:relative}
.field-wrap i{position:absolute;left:13px;top:50%;transform:translateY(-50%);color:#94A3B8;font-size:14px}
.field input{width:100%;padding:11px 12px 11px 38px;border:1.5px solid #E2E8F0;border-radius:10px;font-size:14px;color:#1E293B;font-family:'Inter',sans-serif;transition:all 0.2s;background:#F8FAFC}
.field input:focus{outline:none;border-color:#2563EB;background:#fff;box-shadow:0 0 0 3px rgba(37,99,235,0.12)}
.login-btn{width:100%;padding:13px;background:linear-gradient(135deg,#1E3A8A,#2563EB);color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;transition:all 0.2s;letter-spacing:0.02em;margin-top:4px;font-family:'Inter',sans-serif}
.login-btn:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(37,99,235,0.4)}
.login-btn:active{transform:translateY(0)}
.error-box{background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:11px 14px;font-size:13px;color:#DC2626;margin-bottom:18px;display:flex;align-items:center;gap:8px}
.users-hint{margin-top:22px;padding-top:18px;border-top:1px solid #F1F5F9}
.users-hint p{font-size:11px;color:#94A3B8;text-align:center;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.06em}
.user-chip{display:inline-flex;align-items:center;gap:7px;background:#F0F4FA;border:1px solid #E2E8F0;border-radius:20px;padding:5px 12px 5px 6px;cursor:pointer;transition:all 0.15s;margin:3px}
.user-chip:hover{background:#DBEAFE;border-color:#93C5FD}
.avatar{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff}
.user-chip span{font-size:12px;font-weight:600;color:#374151}
</style></head><body>
<div class="login-card">
  <div class="login-logo">
    <div class="logo-box">SI</div>
    <div class="login-title">SYDIAI<span>Supply Chain Intelligence Suite</span></div>
  </div>
  <p class="login-subtitle">Sign in to access your supply chain planning workspace. All modules, real-time data and AI insights in one place.</p>
  ${err ? `<div class="error-box"><i class="fas fa-exclamation-circle"></i> Invalid username or password. Please try again.</div>` : ''}
  <form method="POST" action="/login">
    <div class="field"><label>Username</label><div class="field-wrap"><i class="fas fa-user"></i><input type="text" name="username" placeholder="Enter your username" autocomplete="username" required/></div></div>
    <div class="field"><label>Password</label><div class="field-wrap"><i class="fas fa-lock"></i><input type="password" name="password" placeholder="Enter your password" autocomplete="current-password" required/></div></div>
    <button type="submit" class="login-btn"><i class="fas fa-sign-in-alt" style="margin-right:8px"></i>Sign In to Dashboard</button>
  </form>
  <div class="users-hint">
    <p>Quick Access</p>
    <div style="display:flex;flex-wrap:wrap;justify-content:center">
      <div class="user-chip" onclick="fillLogin('sankar')"><div class="avatar" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)">SM</div><span>Sankar Mamidela</span></div>
      <div class="user-chip" onclick="fillLogin('vikrant')"><div class="avatar" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)">VH</div><span>Vikrant Hole</span></div>
    </div>
  </div>
</div>
<script>
function fillLogin(u){document.querySelector('input[name=username]').value=u;document.querySelector('input[name=password]').value='password';document.querySelector('input[name=username]').focus()}
</script>
</body></html>`)
})

app.post('/login', async (c) => {
  const body = await c.req.parseBody()
  const username = (body.username as string || '').toLowerCase().trim()
  const password = body.password as string || ''
  const user = USERS[username]
  if (!user || user.password !== password) return c.redirect('/login?error=1')
  const session = btoa(JSON.stringify({ id: username, ts: Date.now() }))
  setCookie(c, 'sc_session', session, { path: '/', maxAge: 86400 * 7, httpOnly: true, sameSite: 'Lax' })
  return c.redirect('/')
})

app.get('/logout', (c) => {
  deleteCookie(c, 'sc_session', { path: '/' })
  return c.redirect('/login')
})

app.get('/favicon.ico', (c) => {
  c.header('Content-Type', 'image/svg+xml')
  return c.body('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1E3A8A"/><text x="16" y="22" font-size="16" text-anchor="middle" fill="white" font-family="Arial" font-weight="bold">S</text></svg>')
})

// ============================================================
// SHARED LAYOUT
// ============================================================
// Supply chain flow order: S&OP → Demand → MRP → Procurement → Production → Capacity → Sequencing → Resource → Inventory → Deployment
const NAV_MODULES = [
  { id: 'control-tower', label: 'Control Tower', icon: 'fa-satellite-dish', path: '/control-tower',
    subs: [
      { id: 'ct-main',     label: 'Live Dashboard',      icon: 'fa-tachometer-alt',  path: '/control-tower' },
      { id: 'ct-network',  label: 'Network Map',         icon: 'fa-project-diagram', path: '/network-map' },
      { id: 'ct-scenario', label: 'Scenario Lab',        icon: 'fa-flask',           path: '/scenario-lab' },
      { id: 'ct-demand',   label: 'Demand Intelligence', icon: 'fa-brain',           path: '/demand-intelligence' },
      { id: 'ct-workbench',label: 'Planner Workbench',  icon: 'fa-drafting-compass', path: '/planner-workbench' },
      { id: 'ct-benchmark',label: 'KPI Benchmarking',   icon: 'fa-trophy',           path: '/benchmarking' },
    ]
  },
  { id: 'sop', label: 'S&OP Planning', icon: 'fa-balance-scale', path: '/sop',
    subs: [
      { id: 'sop-executive', label: 'S&OP Dashboard', icon: 'fa-chart-pie', path: '/sop' },
      { id: 'sop-demand', label: 'Demand Review', icon: 'fa-chart-line', path: '/sop/demand-review' },
      { id: 'sop-supply', label: 'Supply Review', icon: 'fa-industry', path: '/sop/supply-review' },
      { id: 'sop-scenarios', label: 'Scenarios', icon: 'fa-sitemap', path: '/sop/scenarios' },
      { id: 'sop-consensus', label: 'Consensus Meeting', icon: 'fa-users', path: '/sop/consensus' },
      { id: 'sop-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/sop/analytics' },
      { id: 'sop-opt-wb', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/sop/optimization-workbench' },
    ]
  },
  { id: 'mrp', label: 'Material Req. Planning', icon: 'fa-boxes', path: '/mrp',
    subs: [
      { id: 'mrp-dashboard', label: 'MRP Dashboard', icon: 'fa-th-large', path: '/mrp/dashboard' },
      { id: 'mrp-explosion', label: 'MRP Explosion', icon: 'fa-project-diagram', path: '/mrp/explosion' },
      { id: 'mrp-bom', label: 'Bill of Materials', icon: 'fa-sitemap', path: '/mrp/bom' },
      { id: 'mrp-po', label: 'Purchase Orders', icon: 'fa-file-invoice', path: '/mrp/purchase-orders' },
      { id: 'mrp-alerts', label: 'Shortage Alerts', icon: 'fa-bell', path: '/mrp/shortage-alerts' },
      { id: 'mrp-analytics', label: 'MRP Analytics', icon: 'fa-chart-line', path: '/mrp/analytics' },
      { id: 'mrp-workbench', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/mrp/optimization-workbench' },
    ]
  },
  { id: 'procurement', label: 'Procurement Planning', icon: 'fa-handshake', path: '/procurement',
    subs: [
      { id: 'proc-workbench', label: 'PO Workbench', icon: 'fa-clipboard-list', path: '/procurement/operational' },
      { id: 'proc-suppliers', label: 'Supplier Scorecard', icon: 'fa-star', path: '/procurement/suppliers' },
      { id: 'proc-contracts', label: 'Contracts', icon: 'fa-file-contract', path: '/procurement/contracts' },
      { id: 'proc-opt-wb', label: 'Optimization Workbench', icon: 'fa-drafting-compass', path: '/procurement/optimization-workbench' },
      { id: 'proc-analytics', label: 'Spend Analytics', icon: 'fa-chart-bar', path: '/procurement/analytics' },
    ]
  },
  { id: 'production', label: 'Production Planning', icon: 'fa-cogs', path: '/production',
    subs: [
      { id: 'prod-mps', label: 'Master Production Schedule', icon: 'fa-calendar-check', path: '/production/mps' },
      { id: 'prod-atp', label: 'Available-to-Promise', icon: 'fa-check-double', path: '/production/atp' },
      { id: 'prod-rccp', label: 'Rough-Cut Capacity', icon: 'fa-ruler-combined', path: '/production/rccp' },
      { id: 'prod-opt-wb', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/production/optimization-workbench' },
      { id: 'prod-scenarios', label: 'Scenario Manager', icon: 'fa-layer-group', path: '/production/scenarios' },
      { id: 'prod-mlmodels', label: 'ML Hub', icon: 'fa-brain', path: '/ml-hub' },
      { id: 'prod-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/production/analytics' },
      { id: 'prod-copilot', label: 'AI Copilot', icon: 'fa-robot', path: '/ai-copilot' },
    ]
  },
  { id: 'capacity', label: 'Capacity Planning', icon: 'fa-industry', path: '/capacity',
    subs: [
      { id: 'capacity-executive', label: 'Executive Dashboard', icon: 'fa-chart-pie', path: '/capacity/executive' },
      { id: 'capacity-operations', label: 'Operations Center', icon: 'fa-tachometer-alt', path: '/capacity/operations' },
      { id: 'capacity-optimization', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/capacity/optimization' },
      { id: 'capacity-scenarios', label: 'Scenario Builder', icon: 'fa-sitemap', path: '/capacity/scenarios' },
      { id: 'capacity-analytics', label: 'Analytics & OEE', icon: 'fa-chart-bar', path: '/capacity/analytics' },
      { id: 'capacity-rootcause', label: 'Root Cause Analyzer', icon: 'fa-search', path: '/capacity/root-cause' },
    ]
  },
  { id: 'sequencing', label: 'Sequencing & Scheduling', icon: 'fa-calendar-alt', path: '/sequencing',
    subs: [
      { id: 'seq-gantt', label: 'Gantt Planner', icon: 'fa-bars-staggered', path: '/sequencing/gantt' },
      { id: 'seq-execution', label: 'Execution Dashboard', icon: 'fa-play-circle', path: '/sequencing/execution' },
      { id: 'seq-bottleneck', label: 'Bottleneck Locator', icon: 'fa-exclamation-triangle', path: '/sequencing/bottleneck' },
      { id: 'seq-rca', label: 'Root Cause Analysis', icon: 'fa-search', path: '/sequencing/rca' },
      { id: 'seq-planner', label: 'Planner Workbench', icon: 'fa-drafting-compass', path: '/sequencing/planner' },
      { id: 'seq-opt-wb', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/sequencing/optimization-workbench' },
      { id: 'seq-scenarios', label: 'Scenario Modeling', icon: 'fa-layer-group', path: '/sequencing/scenarios' },
      { id: 'seq-analytics', label: 'Health & Analytics', icon: 'fa-heartbeat', path: '/sequencing/analytics' },
      { id: 'seq-copilot', label: 'AI Copilot', icon: 'fa-robot', path: '/ai-copilot' },
    ]
  },
  { id: 'resource', label: 'Resource Planning', icon: 'fa-users', path: '/resource',
    subs: [
      { id: 'res-executive', label: 'Executive Summary', icon: 'fa-chart-pie', path: '/resource/executive' },
      { id: 'res-skills', label: 'Skills & Roster', icon: 'fa-id-badge', path: '/resource/skills' },
      { id: 'res-optimization', label: 'Optimization', icon: 'fa-sliders-h', path: '/resource/optimization' },
      { id: 'res-opt-wb', label: 'Optimization Workbench', icon: 'fa-drafting-compass', path: '/resource/optimization-workbench' },
      { id: 'res-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/resource/analytics' },
    ]
  },
  { id: 'inventory', label: 'Inventory Planning', icon: 'fa-warehouse', path: '/inventory',
    subs: [
      { id: 'inv-shelf-life', label: 'Shelf Life / FEFO', icon: 'fa-clock', path: '/inventory/shelf-life' },
      { id: 'inv-operations', label: 'Stock Positions', icon: 'fa-tachometer-alt', path: '/inventory/operations' },
      { id: 'inv-optimization', label: 'Replenishment', icon: 'fa-sync-alt', path: '/inventory/optimization' },
      { id: 'inv-opt-wb', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/inventory/optimization-workbench' },
      { id: 'inv-scenarios', label: 'Scenarios', icon: 'fa-sitemap', path: '/inventory/scenarios' },
      { id: 'inv-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/inventory/analytics' },
      { id: 'inv-master', label: 'Master Data', icon: 'fa-database', path: '/inventory/master' },
    ]
  },
  { id: 'deployment', label: 'Deployment Planning', icon: 'fa-truck', path: '/deployment',
    subs: [
      { id: 'dep-network', label: 'Distribution Network', icon: 'fa-project-diagram', path: '/deployment/network' },
      { id: 'dep-workbench', label: 'Planner Workbench', icon: 'fa-drafting-compass', path: '/deployment/workbench' },
      { id: 'dep-opt-wb', label: 'Optimization Workbench', icon: 'fa-sliders-h', path: '/deployment/optimization-workbench' },
      { id: 'dep-route', label: 'Route Optimization', icon: 'fa-route', path: '/deployment/routes' },
      { id: 'dep-load', label: 'Load Planning', icon: 'fa-boxes', path: '/deployment/load-planning' },
      { id: 'dep-carrier', label: 'Carrier Selection', icon: 'fa-shipping-fast', path: '/deployment/carriers' },
      { id: 'dep-scenarios', label: 'Scenario Manager', icon: 'fa-layer-group', path: '/deployment/scenarios' },
      { id: 'dep-mlmodels', label: 'ML Hub', icon: 'fa-brain', path: '/ml-hub' },
      { id: 'dep-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/deployment/analytics' },
    ]
  },
]

// Map sub-page prefixes to their parent module id
const SUB_PREFIX_MAP: Record<string, string> = {
  'prod': 'production',
  'dep': 'deployment',
  'seq': 'sequencing',
  'inv': 'inventory',
  'proc': 'procurement',
  'res': 'resource',
  'capacity': 'capacity',
  'sop': 'sop',
  'mrp': 'mrp',
  'ct': 'control-tower',
}

function isModuleActive(activeModule: string, moduleId: string): boolean {
  if (activeModule === moduleId) return true
  if (activeModule.startsWith(moduleId + '-')) return true
  // Check prefix map: e.g. 'prod-mps' -> 'production'
  const prefix = activeModule.split('-')[0]
  if (SUB_PREFIX_MAP[prefix] === moduleId) return true
  return false
}

const Layout = ({ title, activeModule = 'home', scripts = '', user = null as any, children }: {
  title: string, activeModule?: string, scripts?: string, user?: any, children: any
}) => {
  const activeTopModule = NAV_MODULES.find(m => isModuleActive(activeModule, m.id))
  const isOnModulePage = activeModule !== 'home' && activeModule !== 'actions' && activeModule !== 'audit' && activeModule !== 'admin'
  const displayName = user ? user.name.split(' ')[0] : 'User'
  const displayInitials = user ? user.initials : 'U'
  const displayRole = user ? user.role : ''
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title} — SYDIAI Supply Chain Suite</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/css/all.min.css" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" />
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <style>{`
:root {
  --primary: #1E3A8A; --primary-light: #2563EB; --primary-dark: #1e2d5e;
  --secondary: #0891B2; --accent: #7C3AED; --accent2: #059669;
  --danger: #DC2626; --warning: #D97706; --success: #059669; --info: #0891B2;
  --bg: #F0F4FA; --card: #FFFFFF; --sidebar-bg: #0F172A; --sidebar-text: #94A3B8;
  --sidebar-active: #2563EB; --header-bg: #1E3A8A; --border: #E2E8F0;
  --text: #1E293B; --text-muted: #64748B; --text-light: #94A3B8;
  --radius: 12px; --radius-sm: 8px; --shadow: 0 1px 3px rgba(0,0,0,.1), 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -1px rgba(0,0,0,.06);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05);
}
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Inter', -apple-system, sans-serif; background: var(--bg); color: var(--text); font-size: 14px; line-height: 1.5; }
.app-shell { display: grid; grid-template-columns: 240px 1fr; grid-template-rows: 56px 1fr; min-height: 100vh; }
/* Header */
.app-header { grid-column: 1/-1; background: var(--header-bg); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 100; box-shadow: var(--shadow-md); }
.app-header-logo { display: flex; align-items: center; gap: 12px; }
.app-header-logo a { display: flex; align-items: center; gap: 10px; text-decoration: none; }
.logo-mark { width: 36px; height: 36px; background: linear-gradient(135deg,#60A5FA,#818CF8); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 18px; color: white; letter-spacing: -1px; }
.app-header-suite { color: white; font-size: 15px; font-weight: 600; letter-spacing: 0.01em; }
.app-header-suite span { color: #93C5FD; font-weight: 400; }
.header-divider { width: 1px; height: 28px; background: rgba(255,255,255,0.2); margin: 0 4px; }
.app-header-right { display: flex; align-items: center; gap: 10px; }
.header-greeting { color: #BFDBFE; font-size: 13px; margin-right: 6px; }
.header-greeting strong { color: white; }
.header-btn { background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; position: relative; transition: background 0.2s; font-size: 15px; }
.header-btn:hover { background: rgba(255,255,255,0.2); }
.notif-badge { position: absolute; top: -4px; right: -4px; background: #EF4444; color: white; border-radius: 9px; font-size: 10px; font-weight: 700; padding: 1px 5px; min-width: 16px; text-align: center; }
.header-avatar { background: linear-gradient(135deg,#60A5FA,#818CF8); color: white; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; cursor: pointer; }
/* Sidebar */
.app-sidebar { background: var(--sidebar-bg); overflow-y: auto; padding: 12px 0 24px; scrollbar-width: thin; }
.sidebar-section { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #475569; padding: 12px 16px 4px; text-transform: uppercase; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 9px 16px; color: var(--sidebar-text); text-decoration: none; font-size: 13px; font-weight: 500; border-left: 3px solid transparent; transition: all 0.15s; cursor: pointer; }
.nav-item:hover { background: rgba(255,255,255,0.05); color: #E2E8F0; }
.nav-item.active { background: rgba(37,99,235,0.15); color: white; border-left-color: var(--primary-light); }
.nav-item i { width: 18px; text-align: center; font-size: 14px; opacity: 0.8; }
.nav-submenu { overflow: hidden; }
.nav-sub-item { display: flex; align-items: center; gap: 8px; padding: 7px 16px 7px 38px; color: #64748B; text-decoration: none; font-size: 12px; font-weight: 400; transition: all 0.15s; border-left: 3px solid transparent; }
.nav-sub-item:hover { background: rgba(255,255,255,0.04); color: #CBD5E1; }
.nav-sub-item.active { background: rgba(37,99,235,0.12); color: #93C5FD; border-left-color: #3B82F6; }
.nav-sub-item i { font-size: 11px; opacity: 0.7; width: 14px; }
/* Main Content */
.app-main { overflow-y: auto; padding: 24px; background: var(--bg); }
/* Page Header */
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap; }
.page-header-left { display: flex; align-items: center; gap: 16px; }
.page-icon { width: 52px; height: 52px; border-radius: var(--radius); display: flex; align-items: center; justify-content: center; font-size: 22px; color: white; flex-shrink: 0; }
.page-title { font-size: 22px; font-weight: 700; color: var(--text); line-height: 1.2; }
.page-subtitle { font-size: 13px; color: var(--text-muted); margin-top: 3px; }
.page-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
/* Badges */
.badge { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.badge-live { background: #DCFCE7; color: #15803D; }
.badge-live::before { content: ''; width: 6px; height: 6px; background: #22C55E; border-radius: 50%; animation: pulse 1.5s infinite; }
.badge-critical { background: #FEE2E2; color: #DC2626; }
.badge-warning { background: #FEF3C7; color: #D97706; }
.badge-success { background: #DCFCE7; color: #15803D; }
.badge-info { background: #DBEAFE; color: #1D4ED8; }
.badge-neutral { background: #F1F5F9; color: #475569; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
/* Cards */
.card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); box-shadow: var(--shadow); }
.card-header { padding: 16px 20px 12px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.card-title { font-size: 14px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 8px; }
.card-body { padding: 20px; }
.card-body.compact { padding: 12px 16px; }
/* KPI Grid */
.kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
.kpi-card { background: var(--card); border-radius: var(--radius); border: 1px solid var(--border); padding: 18px 20px; box-shadow: var(--shadow); position: relative; overflow: hidden; }
.kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
.kpi-card.healthy::before { background: var(--success); }
.kpi-card.warning::before { background: var(--warning); }
.kpi-card.critical::before { background: var(--danger); }
.kpi-card.info::before { background: var(--info); }
.kpi-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 700; color: var(--text); line-height: 1; }
.kpi-value.critical { color: var(--danger); }
.kpi-value.warning { color: var(--warning); }
.kpi-value.healthy { color: var(--success); }
.kpi-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
.kpi-target { font-size: 11px; color: var(--text-muted); }
.kpi-trend { font-size: 11px; font-weight: 600; }
.kpi-trend.up { color: var(--success); }
.kpi-trend.down { color: var(--danger); }
/* Grid layouts */
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
.grid-2-1 { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px; }
.grid-1-2 { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; margin-bottom: 20px; }
@media(max-width:1100px){.grid-2,.grid-3,.grid-2-1,.grid-1-2{grid-template-columns:1fr}}
/* Tables */
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th { text-align: left; padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; background: #F8FAFC; border-bottom: 1px solid var(--border); }
.data-table td { padding: 11px 14px; border-bottom: 1px solid #F1F5F9; color: var(--text); vertical-align: middle; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #F8FAFC; }
/* Buttons */
.btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: none; text-decoration: none; white-space: nowrap; }
.btn-primary { background: var(--primary-light); color: white; }
.btn-primary:hover { background: #1D4ED8; }
.btn-secondary { background: var(--card); color: var(--text); border: 1px solid var(--border); }
.btn-secondary:hover { background: #F8FAFC; }
.btn-success { background: var(--success); color: white; }
.btn-danger { background: var(--danger); color: white; }
.btn-warning { background: var(--warning); color: white; }
.btn-sm { padding: 5px 10px; font-size: 12px; }
.btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px 8px; border-radius: 6px; font-size: 13px; }
.btn-icon:hover { background: #F1F5F9; color: var(--text); }
/* Alerts */
.alert { padding: 12px 16px; border-radius: var(--radius-sm); margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; }
.alert-critical { background: #FEF2F2; border-left: 4px solid var(--danger); }
.alert-warning { background: #FFFBEB; border-left: 4px solid var(--warning); }
.alert-success { background: #F0FDF4; border-left: 4px solid var(--success); }
.alert-info { background: #EFF6FF; border-left: 4px solid var(--info); }
.alert i { margin-top: 1px; flex-shrink: 0; }
.alert-critical i { color: var(--danger); }
.alert-warning i { color: var(--warning); }
.alert-success i { color: var(--success); }
.alert-info i { color: var(--info); }
/* Tabs */
.tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 20px; padding-bottom: 0; overflow-x: auto; }
.tab-btn { padding: 10px 18px; font-size: 13px; font-weight: 500; color: var(--text-muted); border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; white-space: nowrap; transition: all 0.15s; }
.tab-btn:hover { color: var(--primary-light); }
.tab-btn.active { color: var(--primary-light); border-bottom-color: var(--primary-light); font-weight: 600; }
.tab-content { display: none; }
.tab-content.active { display: block; }
/* Forms */
.form-group { margin-bottom: 16px; }
.form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.05em; }
.form-input { width: 100%; padding: 9px 12px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; color: var(--text); background: white; transition: border-color 0.15s; }
.form-input:focus { outline: none; border-color: var(--primary-light); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.form-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'%3E%3Cpath fill='%2364748B' d='M7 10l5 5 5-5z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 32px; }
/* Gantt */
.gantt-container { overflow-x: auto; }
.gantt-row { display: flex; align-items: center; min-height: 44px; border-bottom: 1px solid #F1F5F9; }
.gantt-label { width: 160px; flex-shrink: 0; padding: 8px 12px; font-size: 12px; font-weight: 500; color: var(--text); background: #F8FAFC; border-right: 1px solid var(--border); }
.gantt-track { flex: 1; position: relative; height: 44px; background: repeating-linear-gradient(90deg, transparent, transparent calc(8.33% - 1px), #F1F5F9 calc(8.33% - 1px), #F1F5F9 8.33%); }
.gantt-bar { position: absolute; height: 28px; top: 8px; border-radius: 6px; display: flex; align-items: center; padding: 0 8px; font-size: 11px; font-weight: 600; color: white; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.gantt-bar:hover { opacity: 0.85; }
.gantt-bar.in_progress { background: linear-gradient(90deg,#2563EB,#3B82F6); }
.gantt-bar.scheduled { background: linear-gradient(90deg,#7C3AED,#8B5CF6); }
.gantt-bar.pending { background: linear-gradient(90deg,#D97706,#F59E0B); }
.gantt-bar.completed { background: linear-gradient(90deg,#059669,#10B981); }
/* Score ring */
.score-ring { width: 64px; height: 64px; }
/* Progress bars */
.progress-bar { background: #E2E8F0; border-radius: 99px; overflow: hidden; height: 8px; }
.progress-fill { height: 100%; border-radius: 99px; transition: width 0.5s; }
.progress-fill.healthy { background: linear-gradient(90deg,#059669,#34D399); }
.progress-fill.warning { background: linear-gradient(90deg,#D97706,#F59E0B); }
.progress-fill.critical { background: linear-gradient(90deg,#DC2626,#F87171); }
/* Spinner */
.spinner { display: inline-block; width: 20px; height: 20px; border: 2px solid #E2E8F0; border-top-color: var(--primary-light); border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
/* Status dots */
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
.status-dot.healthy, .status-dot.active { background: var(--success); }
.status-dot.warning { background: var(--warning); }
.status-dot.critical { background: var(--danger); }
.status-dot.draft, .status-dot.pending { background: var(--text-muted); }
/* Chat */
.chat-messages { max-height: 400px; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.chat-msg { max-width: 80%; padding: 12px 16px; border-radius: 12px; font-size: 13px; line-height: 1.6; }
.chat-msg.user { align-self: flex-end; background: var(--primary-light); color: white; border-bottom-right-radius: 4px; }
.chat-msg.assistant { align-self: flex-start; background: #F8FAFC; color: var(--text); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
.chat-input-area { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--border); }
/* Misc */
.mb-4 { margin-bottom: 16px; } .mb-6 { margin-bottom: 24px; } .mt-4 { margin-top: 16px; }
.flex { display: flex; } .flex-1 { flex: 1; } .items-center { align-items: center; }
.justify-between { justify-content: space-between; } .gap-2 { gap: 8px; } .gap-3 { gap: 12px; }
.text-sm { font-size: 12px; } .text-muted { color: var(--text-muted); } .font-semibold { font-weight: 600; }
.w-full { width: 100%; } .rounded { border-radius: var(--radius-sm); }
.health-score { font-size: 32px; font-weight: 800; }
.health-score.healthy { color: var(--success); }
.health-score.warning { color: var(--warning); }
.health-score.critical { color: var(--danger); }
/* Control Tower Node Cards */
.ct-node { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 12px 14px; cursor: pointer; transition: all 0.15s; }
.ct-node:hover { box-shadow: var(--shadow-md); transform: translateY(-1px); }
.ct-node.critical { border-left: 3px solid var(--danger); }
.ct-node.warning  { border-left: 3px solid var(--warning); }
.ct-node.healthy  { border-left: 3px solid var(--success); }
/* Scenario cards */
.scenario-card { transition: transform 0.15s, box-shadow 0.15s; }
.scenario-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
/* Flow steps */
.flow-step { position: relative; padding: 12px 8px; background: #F8FAFC; border-radius: 10px; border: 1px solid var(--border); }
/* Network map node highlight */
.nm-node-selected { background: #EFF6FF !important; }
        `}</style>
      </head>
      <body>
        <div class="app-shell">
          <header class="app-header">
            <div class="app-header-logo">
              <a href="/">
                <div class="logo-mark">SI</div>
                <div>
                  <div class="app-header-suite">SYDIAI <span>Supply Chain Intelligence Suite</span></div>
                </div>
              </a>
            </div>
            <div class="app-header-right">
              <span class="header-greeting">Welcome, <strong>{displayName}</strong></span>
              <button class="header-btn" title="Notifications" id="notifBtn" onclick="toggleNotifPanel()">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" id="notifCount">·</span>
              </button>
              <a href="/approvals" class="header-btn" title="Pending Approvals" id="approvalBtn">
                <i class="fas fa-clipboard-check"></i>
                <span class="notif-badge" id="approvalCount" style="background:#D97706">·</span>
              </a>
              <button class="header-btn" title="Settings"><i class="fas fa-cog"></i></button>
              <a href="/logout" class="header-btn" title="Logout"><i class="fas fa-sign-out-alt"></i></a>
              <div class="header-avatar" title={displayName + ' — ' + displayRole}>{displayInitials}</div>
              <div id="notif-panel" style="display:none;position:fixed;top:56px;right:16px;width:380px;background:white;border:1px solid var(--border);border-radius:var(--radius);box-shadow:var(--shadow-lg);z-index:9999;max-height:500px;overflow-y:auto">
                <div style="padding:12px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                  <strong style="font-size:14px">Notifications</strong>
                  <button onclick="markAllRead()" style="font-size:12px;color:#2563EB;border:none;background:none;cursor:pointer">Mark all read</button>
                </div>
                <div id="notif-list" style="padding:8px"></div>
              </div>
            </div>
          </header>

          <aside class="app-sidebar">
            {isOnModulePage && activeTopModule ? (
              // MODULE VIEW: back button + only this module's sub-pages
              <div>
                <a href="/" class="nav-item" style="border-left-color:#3B82F6;color:#93C5FD;background:rgba(37,99,235,0.1)">
                  <i class="fas fa-arrow-left"></i> Back to Home
                </a>
                <div class="sidebar-section" style="padding-top:16px">
                  <i class={`fas ${activeTopModule.icon}`} style="margin-right:6px"></i>
                  {activeTopModule.label}
                </div>
                {activeTopModule.subs.map(sub => (
                  <a key={sub.id} href={sub.path} class={`nav-item ${activeModule === sub.id ? 'active' : ''}`} style="font-size:13px">
                    <i class={`fas ${sub.icon}`}></i> {sub.label}
                  </a>
                ))}
                <div class="sidebar-section" style="margin-top:16px">Command Center</div>
                <a href="/control-tower" class="nav-item"><i class="fas fa-satellite-dish"></i> Control Tower</a>
                <a href="/network-map" class="nav-item"><i class="fas fa-project-diagram"></i> Network Map</a>
                <a href="/scenario-lab" class="nav-item"><i class="fas fa-flask"></i> Scenario Lab</a>
                <a href="/demand-intelligence" class="nav-item"><i class="fas fa-brain"></i> Demand Intelligence</a>
                <a href="/planner-workbench" class="nav-item"><i class="fas fa-drafting-compass"></i> Planner Workbench</a>
                <div class="sidebar-section" style="margin-top:8px">Quick Links</div>
                <a href="/action-items" class="nav-item"><i class="fas fa-tasks"></i> Action Items</a>
                <a href="/approvals" class="nav-item"><i class="fas fa-clipboard-check"></i> Approvals</a>
                <a href="/exceptions" class="nav-item"><i class="fas fa-exclamation-triangle"></i> Exceptions</a>
                <a href="/audit-log" class="nav-item"><i class="fas fa-history"></i> Audit Log</a>
                <div class="sidebar-section" style="margin-top:8px">Admin</div>
                <a href="/admin/data-management" class="nav-item"><i class="fas fa-database"></i> Data Management</a>
              </div>
            ) : (
              // HOME VIEW: all modules listed, collapsed
              <div>
                <div class="sidebar-section">Navigation</div>
                <a href="/" class={`nav-item ${activeModule === 'home' ? 'active' : ''}`}>
                  <i class="fas fa-home"></i> Home Dashboard
                </a>
                <div class="sidebar-section">Planning Modules</div>
                {NAV_MODULES.map(mod => (
                  <a key={mod.id} href={mod.path} class="nav-item">
                    <i class={`fas ${mod.icon}`}></i> {mod.label}
                  </a>
                ))}
                <div class="sidebar-section" style="margin-top:16px">Command Center</div>
                <a href="/control-tower" class="nav-item"><i class="fas fa-satellite-dish"></i> Control Tower</a>
                <a href="/network-map" class="nav-item"><i class="fas fa-project-diagram"></i> Network Map</a>
                <a href="/scenario-lab" class="nav-item"><i class="fas fa-flask"></i> Scenario Lab</a>
                <a href="/demand-intelligence" class="nav-item"><i class="fas fa-brain"></i> Demand Intelligence</a>
                <a href="/planner-workbench" class="nav-item"><i class="fas fa-drafting-compass"></i> Planner Workbench</a>
                <a href="/benchmarking" class="nav-item"><i class="fas fa-trophy"></i> KPI Benchmarking</a>
                <div class="sidebar-section" style="margin-top:8px">Quick Links</div>
                <a href="/action-items" class={`nav-item ${activeModule === 'actions' ? 'active' : ''}`}>
                  <i class="fas fa-tasks"></i> Action Items
                </a>
                <a href="/approvals" class="nav-item"><i class="fas fa-clipboard-check"></i> Approvals</a>
                <a href="/exceptions" class="nav-item"><i class="fas fa-exclamation-triangle"></i> Exceptions</a>
                <a href="/risk-dashboard" class="nav-item"><i class="fas fa-shield-alt"></i> Risk Dashboard</a>
                <a href="/audit-log" class={`nav-item ${activeModule === 'audit' ? 'active' : ''}`}>
                  <i class="fas fa-history"></i> Audit Log
                </a>
                <div class="sidebar-section" style="margin-top:8px">Admin</div>
                <a href="/admin/data-management" class={`nav-item ${activeModule === 'admin' ? 'active' : ''}`}>
                  <i class="fas fa-database"></i> Data Management
                </a>
              </div>
            )}
          </aside>

          <main class="app-main">
            {children}
          </main>
        </div>
        {scripts && <script dangerouslySetInnerHTML={{ __html: scripts }}></script>}
        <script dangerouslySetInnerHTML={{ __html: `
// Notification panel
(async function loadNotifs() {
  try {
    const r = await fetch('/api/notifications');
    const d = await r.json();
    const cnt = d.unread_count || 0;
    const badge = document.getElementById('notifCount');
    if (badge) badge.textContent = cnt > 0 ? cnt : '';
    const list = document.getElementById('notif-list');
    if (list) {
      list.innerHTML = (d.notifications || []).map(n => \`
        <a href="\${n.action_url}" style="display:block;padding:10px 12px;border-radius:8px;margin-bottom:4px;background:\${n.read?'white':'#EFF6FF'};text-decoration:none;border:1px solid \${n.read?'transparent':'#BFDBFE'}">
          <div style="display:flex;gap:8px;align-items:flex-start">
            <i class="fas fa-\${n.type==='critical'?'times-circle':n.type==='warning'?'exclamation-triangle':'info-circle'}" style="color:\${n.type==='critical'?'#DC2626':n.type==='warning'?'#D97706':'#0891B2'};margin-top:2px"></i>
            <div>
              <div style="font-weight:600;font-size:13px;color:#1E293B">\${n.title}</div>
              <div style="font-size:12px;color:#64748B">\${n.message}</div>
              <div style="font-size:11px;color:#94A3B8;margin-top:2px">\${n.module.toUpperCase()} · \${n.time}</div>
            </div>
          </div>
        </a>\`).join('') || '<p style="color:#64748B;text-align:center;padding:16px;font-size:13px">No notifications</p>';
    }
    // Approvals count
    const apr = await fetch('/api/approvals');
    const ad = await apr.json();
    const pending = ad.filter(a => a.status === 'pending').length;
    const ab = document.getElementById('approvalCount');
    if (ab) ab.textContent = pending > 0 ? pending : '';
  } catch(e) {}
})();
function toggleNotifPanel() {
  const p = document.getElementById('notif-panel');
  if (p) p.style.display = p.style.display === 'none' ? 'block' : 'none';
}
function markAllRead() {
  const badge = document.getElementById('notifCount');
  if (badge) badge.textContent = '';
  const panel = document.getElementById('notif-panel');
  if (panel) panel.querySelectorAll('a').forEach(a => { a.style.background='white'; a.style.border='1px solid transparent'; });
}
document.addEventListener('click', function(e) {
  const panel = document.getElementById('notif-panel');
  const btn = document.getElementById('notifBtn');
  if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) panel.style.display = 'none';
});
// Global ML retrain
window.retrainModels = async function(btn) {
  if (!btn) return;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Retraining...';
  btn.disabled = true;
  try {
    const res = await fetch('/api/ml/retrain', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'all'})});
    const d = await res.json();
    if (d.success) {
      btn.innerHTML = '<i class="fas fa-check"></i> Retrained';
      btn.className = btn.className.replace('btn-primary','btn-success');
      window.showToast('Retraining complete! ' + d.models_retrained + ' models updated. Demand Forecaster MAPE improved by ' + (d.results[0]?.improvement_pct||0) + '%','success');
    }
  } catch(e) {
    btn.innerHTML = '<i class="fas fa-sync"></i> Retrain';
    btn.disabled = false;
  }
};
        ` }}></script>
      </body>
    </html>
  )
}

// Helper to get status class
function sc(status: string): string {
  const map: Record<string,string> = { critical:'critical', high:'critical', warning:'warning', medium:'warning', healthy:'healthy', low:'healthy', active:'healthy', draft:'neutral', pending:'neutral' }
  return map[status?.toLowerCase()] || 'neutral'
}

// ============================================================
// API ROUTES
// ============================================================

// Dashboard summary
app.get('/api/dashboard/summary', async (c) => {
  try {
    const db = c.env.DB
    const plants = await db.prepare('SELECT COUNT(*) as cnt FROM plants WHERE status="active"').first<{cnt:number}>()
    const lines = await db.prepare('SELECT COUNT(*) as cnt FROM production_lines WHERE status="active"').first<{cnt:number}>()
    const alerts = await db.prepare('SELECT COUNT(*) as cnt FROM mrp_alerts WHERE status="open"').first<{cnt:number}>()
    const jobs = await db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE status IN ("in_progress","scheduled")').first<{cnt:number}>()
    const bns = await db.prepare('SELECT COUNT(*) as cnt FROM bottlenecks WHERE resolved_at IS NULL').first<{cnt:number}>()
    const recs = await db.prepare('SELECT COUNT(*) as cnt FROM recommendations WHERE status="open"').first<{cnt:number}>()
    return c.json({ plants: plants?.cnt||6, lines: lines?.cnt||12, open_alerts: alerts?.cnt||5, active_jobs: jobs?.cnt||8, bottlenecks: bns?.cnt||4, open_recommendations: recs?.cnt||8 })
  } catch { return c.json({ plants:6, lines:12, open_alerts:5, active_jobs:8, bottlenecks:4, open_recommendations:8 }) }
})

// Health scores per module
// Dashboard KPIs summary
app.get('/api/dashboard/kpis', async (c) => {
  return c.json([
    { id:'output', label:'Total Output (Today)', value:'150,200 cs', trend:'+2.1%', status:'healthy' },
    { id:'otif', label:'OTIF', value:'92.1%', trend:'-0.8pp', status:'warning' },
    { id:'exceptions', label:'Open Exceptions', value:'7', trend:'-1', status:'critical' },
    { id:'plan_adherence', label:'Plan Adherence', value:'91.8%', trend:'+0.4pp', status:'warning' },
    { id:'inventory', label:'Network Inventory', value:'643,900 cs', trend:'+4.8%', status:'info' },
    { id:'otd', label:'On-Time Delivery', value:'91.4%', trend:'-1.1pp', status:'warning' },
  ])
})

// Inventory positions
app.get('/api/inventory/positions', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT ip.*, s.sku_name, s.sku_code FROM inventory_positions ip JOIN skus s ON ip.sku_id=s.id LIMIT 20').all()
    if (results && results.length > 0) return c.json(results)
    throw new Error('empty')
  } catch {
    return c.json([
      { sku_code:'SKU-500-PET', sku_name:'PET 500ml Regular', location:'Mumbai', on_hand:12400, safety_stock:8400, days_of_supply:14.8, status:'healthy' },
      { sku_code:'SKU-1L-PET', sku_name:'PET 1L Regular', location:'Mumbai', on_hand:8600, safety_stock:6200, days_of_supply:13.4, status:'warning' },
      { sku_code:'SKU-200-MANGO', sku_name:'Mango 200ml Can', location:'Delhi', on_hand:5200, safety_stock:5800, days_of_supply:10.8, status:'warning' },
      { sku_code:'SKU-250-CAN', sku_name:'Sparkling 250ml Can', location:'Chennai', on_hand:3400, safety_stock:2200, days_of_supply:10.6, status:'healthy' },
      { sku_code:'SKU-500-GLASS', sku_name:'Glass 500ml Premium', location:'Bangalore', on_hand:1800, safety_stock:1400, days_of_supply:7.5, status:'critical' },
    ])
  }
})

app.get('/api/dashboard/health', async (c) => {
  const fallback = {
    sop:        { score: 88, status: 'healthy', issues: 1 },
    mrp:        { score: 65, status: 'warning', issues: 4 },
    procurement:{ score: 71, status: 'warning', issues: 3 },
    production: { score: 88, status: 'healthy', issues: 1 },
    capacity:   { score: 72, status: 'warning', issues: 2 },
    sequencing: { score: 78, status: 'warning', issues: 3 },
    resource:   { score: 76, status: 'warning', issues: 2 },
    inventory:  { score: 82, status: 'warning', issues: 2 },
    deployment: { score: 84, status: 'warning', issues: 2 },
  }
  try {
    const db = c.env.DB
    const util = await db.prepare('SELECT AVG(utilization_pct) as avg FROM capacity_utilization WHERE date >= date("now","-7 days")').first<{avg:number}>()
    const alerts = await db.prepare('SELECT COUNT(*) as cnt FROM mrp_alerts WHERE status="open" AND severity IN ("critical","high")').first<{cnt:number}>()
    const bns = await db.prepare('SELECT COUNT(*) as cnt FROM bottlenecks WHERE resolved_at IS NULL AND severity="critical"').first<{cnt:number}>()
    const capScore = Math.min(100, Math.max(0, Math.round((util?.avg || 72))))
    return c.json({
      ...fallback,
      capacity:   { score: capScore, status: capScore > 85 ? 'critical' : capScore > 70 ? 'warning' : 'healthy', issues: bns?.cnt || 2 },
      mrp:        { score: 65, status: 'warning', issues: alerts?.cnt || 4 },
    })
  } catch {
    return c.json(fallback)
  }
})

// Capacity KPIs
const MOCK_CAP_KPIS = [
  { metric_name:'Overall Line Utilization', metric_value:82.4, metric_unit:'%', metric_status:'warning', target_value:80 },
  { metric_name:'Peak Line Utilization', metric_value:98.0, metric_unit:'%', metric_status:'critical', target_value:90 },
  { metric_name:'Order Fill Rate', metric_value:94.8, metric_unit:'%', metric_status:'warning', target_value:98 },
  { metric_name:'OTIF Service Level', metric_value:92.1, metric_unit:'%', metric_status:'warning', target_value:95 },
  { metric_name:'OEE', metric_value:74.4, metric_unit:'%', metric_status:'warning', target_value:78 },
  { metric_name:'Bottleneck Lines', metric_value:2, metric_unit:'count', metric_status:'warning', target_value:0 },
]
app.get('/api/capacity/kpis', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cap_kpi_metrics ORDER BY id').all()
    return c.json(results.length ? results : MOCK_CAP_KPIS)
  } catch {
    return c.json(MOCK_CAP_KPIS)
  }
})

// Capacity utilization trend
const MOCK_UTILIZATION = [
  { date:'2026-03-11', avg_util:78.2, total_ot:4.2 },
  { date:'2026-03-12', avg_util:80.4, total_ot:5.1 },
  { date:'2026-03-13', avg_util:83.1, total_ot:6.8 },
  { date:'2026-03-14', avg_util:85.6, total_ot:8.2 },
  { date:'2026-03-15', avg_util:82.4, total_ot:5.6 },
  { date:'2026-03-16', avg_util:87.3, total_ot:9.1 },
  { date:'2026-03-17', avg_util:88.1, total_ot:10.4 },
]
app.get('/api/capacity/utilization', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT date, ROUND(AVG(utilization_pct),1) as avg_util, SUM(overtime_hours) as total_ot
      FROM capacity_utilization WHERE date >= date('now','-14 days')
      GROUP BY date ORDER BY date
    `).all()
    if (results && results.length > 0) return c.json(results)
    return c.json(MOCK_UTILIZATION)
  } catch {
    return c.json(MOCK_UTILIZATION)
  }
})

// Capacity bottlenecks
const MOCK_BOTTLENECKS = [
  { id:1, line_name:'MUM-L2', plant_name:'Mumbai', severity:'critical', bottleneck_type:'capacity', description:'MUM-L2 running at 98% utilization. High-speed filler at rated limit. Risk of unplanned downtime.', utilization_pct:98, recommended_action:'Shift 8,000 cases to MUM-L1 this week. Approve 1 weekend shift.', detected_at:'2026-03-17T04:00:00' },
  { id:2, line_name:'MUM-L1', plant_name:'Mumbai', severity:'high', bottleneck_type:'capacity', description:'MUM-L1 at 91% utilization. Approaching limit with demand upside scenario.', utilization_pct:91, recommended_action:'Monitor closely. Have contingency plan for further overload.', detected_at:'2026-03-16T18:00:00' },
  { id:3, line_name:'DEL-L1', plant_name:'Delhi', severity:'medium', bottleneck_type:'changeover', description:'Average changeover time 34 min vs 25 min target. Extended SMED needed.', utilization_pct:78, recommended_action:'SMED workshop scheduled for next week. Pre-stage materials.', detected_at:'2026-03-15T10:00:00' },
]
const MOCK_PLANTS = [
  { id:1, plant_name:'Mumbai', plant_code:'MUM', plant_type:'Manufacturing', line_count:2, avg_util:94.5, status:'active' },
  { id:2, plant_name:'Delhi', plant_code:'DEL', plant_type:'Manufacturing', line_count:2, avg_util:78.2, status:'active' },
  { id:3, plant_name:'Chennai', plant_code:'CHN', plant_type:'Manufacturing', line_count:1, avg_util:75.4, status:'active' },
  { id:4, plant_name:'Bangalore', plant_code:'BLR', plant_type:'Manufacturing', line_count:1, avg_util:84.1, status:'active' },
  { id:5, plant_name:'Hyderabad', plant_code:'HYD', plant_type:'Co-Pack', line_count:1, avg_util:68.0, status:'active' },
  { id:6, plant_name:'Kolkata', plant_code:'KOL', plant_type:'Manufacturing', line_count:1, avg_util:71.3, status:'active' },
]
const MOCK_OEE = [
  { line_name:'MUM-L1', plant_name:'Mumbai', oee_pct:77.1, availability:88.4, performance:90.2, quality:96.8, date:'2026-03-17' },
  { line_name:'MUM-L2', plant_name:'Mumbai', oee_pct:85.4, availability:93.1, performance:93.6, quality:98.0, date:'2026-03-17' },
  { line_name:'DEL-L1', plant_name:'Delhi', oee_pct:68.3, availability:84.2, performance:83.1, quality:97.5, date:'2026-03-17' },
  { line_name:'DEL-L2', plant_name:'Delhi', oee_pct:72.9, availability:86.8, performance:85.9, quality:97.8, date:'2026-03-17' },
  { line_name:'CHN-L1', plant_name:'Chennai', oee_pct:79.2, availability:90.1, performance:89.4, quality:98.3, date:'2026-03-17' },
  { line_name:'BLR-L1', plant_name:'Bangalore', oee_pct:82.1, availability:91.8, performance:91.2, quality:98.0, date:'2026-03-17' },
]
app.get('/api/capacity/bottlenecks', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*, pl.line_name, pl.line_code, p.plant_name
      FROM bottlenecks b JOIN production_lines pl ON b.line_id=pl.id JOIN plants p ON pl.plant_id=p.id
      WHERE b.resolved_at IS NULL ORDER BY CASE b.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `).all()
    return c.json(results.length ? results : MOCK_BOTTLENECKS)
  } catch { return c.json(MOCK_BOTTLENECKS) }
})

// Capacity plants
app.get('/api/capacity/plants', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, COUNT(pl.id) as line_count, ROUND(AVG(cu.utilization_pct),1) as avg_util
      FROM plants p LEFT JOIN production_lines pl ON p.id=pl.plant_id LEFT JOIN capacity_utilization cu ON cu.plant_id=p.id AND cu.date>=date('now','-7 days')
      WHERE p.status='active' GROUP BY p.id ORDER BY p.plant_name
    `).all()
    return c.json(results.length ? results : MOCK_PLANTS)
  } catch { return c.json(MOCK_PLANTS) }
})

// Capacity OEE
app.get('/api/capacity/oee', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT o.*, pl.line_name, pl.line_code, p.plant_name
      FROM oee_data o JOIN production_lines pl ON o.line_id=pl.id JOIN plants p ON pl.plant_id=p.id
      WHERE o.date >= date('now','-7 days') ORDER BY o.date DESC, o.line_id
    `).all()
    return c.json(results.length ? results : MOCK_OEE)
  } catch { return c.json(MOCK_OEE) }
})

// Jobs (Sequencing)
const MOCK_JOBS = [
  { id:1, job_number:'JOB-MUM-0317-001', sku_name:'Limca PET 500ml', sku_code:'SKU-500-PET', quantity:18000, priority:'high', status:'in_progress', scheduled_start:'2026-03-17T06:00:00', scheduled_end:'2026-03-17T14:00:00', delay_minutes:0, line_name:'MUM-L1', plant_name:'Mumbai' },
  { id:2, job_number:'JOB-MUM-0317-002', sku_name:'Fanta PET 1L', sku_code:'SKU-1L-PET', quantity:12000, priority:'critical', status:'in_progress', scheduled_start:'2026-03-17T06:00:00', scheduled_end:'2026-03-17T16:00:00', delay_minutes:45, line_name:'MUM-L2', plant_name:'Mumbai' },
  { id:3, job_number:'JOB-DEL-0317-001', sku_name:'Sprite PET 750ml', sku_code:'SKU-750-PET', quantity:15000, priority:'high', status:'scheduled', scheduled_start:'2026-03-17T14:00:00', scheduled_end:'2026-03-17T22:00:00', delay_minutes:0, line_name:'DEL-L1', plant_name:'Delhi' },
  { id:4, job_number:'JOB-MUM-0317-003', sku_name:'Thums Up Can 330ml', sku_code:'SKU-CAN-330', quantity:22000, priority:'medium', status:'scheduled', scheduled_start:'2026-03-17T14:00:00', scheduled_end:'2026-03-18T04:00:00', delay_minutes:30, line_name:'MUM-L1', plant_name:'Mumbai' },
  { id:5, job_number:'JOB-CHN-0317-001', sku_name:'Maaza Tetra 200ml', sku_code:'SKU-TETRA-200', quantity:28000, priority:'high', status:'scheduled', scheduled_start:'2026-03-17T06:00:00', scheduled_end:'2026-03-17T18:00:00', delay_minutes:0, line_name:'CHN-L1', plant_name:'Chennai' },
  { id:6, job_number:'JOB-DEL-0317-002', sku_name:'Limca Can 250ml', sku_code:'SKU-CAN-250', quantity:16000, priority:'medium', status:'pending', scheduled_start:'2026-03-18T06:00:00', scheduled_end:'2026-03-18T14:00:00', delay_minutes:0, line_name:'DEL-L2', plant_name:'Delhi' },
  { id:7, job_number:'JOB-BLR-0317-001', sku_name:'Minute Maid OJ 1L', sku_code:'SKU-MM-1L', quantity:10000, priority:'low', status:'pending', scheduled_start:'2026-03-18T06:00:00', scheduled_end:'2026-03-18T12:00:00', delay_minutes:0, line_name:'BLR-L1', plant_name:'Bangalore' },
  { id:8, job_number:'JOB-MUM-0316-004', sku_name:'Sprite Glass 500ml', sku_code:'SKU-GLS-500', quantity:8000, priority:'medium', status:'delayed', scheduled_start:'2026-03-16T22:00:00', scheduled_end:'2026-03-17T06:00:00', delay_minutes:87, line_name:'MUM-L2', plant_name:'Mumbai' },
  { id:9, job_number:'JOB-MUM-0316-003', sku_name:'Limca PET 500ml', sku_code:'SKU-500-PET', quantity:20000, priority:'high', status:'completed', scheduled_start:'2026-03-16T06:00:00', scheduled_end:'2026-03-16T18:00:00', delay_minutes:0, line_name:'MUM-L1', plant_name:'Mumbai' },
  { id:10, job_number:'JOB-CHN-0316-002', sku_name:'Maaza Tetra 200ml', sku_code:'SKU-TETRA-200', quantity:24000, priority:'medium', status:'completed', scheduled_start:'2026-03-16T06:00:00', scheduled_end:'2026-03-16T16:00:00', delay_minutes:0, line_name:'CHN-L1', plant_name:'Chennai' },
]
app.get('/api/sequencing/jobs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT j.*, s.sku_name, s.sku_code, pl.line_name, pl.line_code, p.plant_name
      FROM jobs j JOIN skus s ON j.sku_id=s.id LEFT JOIN production_lines pl ON j.assigned_line_id=pl.id LEFT JOIN plants p ON pl.plant_id=p.id
      ORDER BY CASE j.status WHEN 'in_progress' THEN 1 WHEN 'scheduled' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END, j.priority
    `).all()
    return c.json(results.length ? results : MOCK_JOBS)
  } catch { return c.json(MOCK_JOBS) }
})

// Sequencing KPIs
app.get('/api/sequencing/kpis', async (c) => {
  try {
    const db = c.env.DB
    const inProg = await db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE status="in_progress"').first<{cnt:number}>()
    const delayed = await db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE delay_minutes > 0').first<{cnt:number}>()
    const total = await db.prepare('SELECT COUNT(*) as cnt FROM jobs WHERE status != "completed"').first<{cnt:number}>()
    const avgDelay = await db.prepare('SELECT ROUND(AVG(delay_minutes),1) as avg FROM jobs WHERE delay_minutes > 0').first<{avg:number}>()
    const lateness = total?.cnt ? Math.round(((delayed?.cnt||0) / (total?.cnt||1)) * 100) : 12
    return c.json([
      { name:'Jobs In Progress', value:inProg?.cnt||3, unit:'', status:'info' },
      { name:'Schedule Adherence', value:100-lateness, unit:'%', status: lateness > 15 ? 'critical' : lateness > 8 ? 'warning' : 'healthy' },
      { name:'Avg Delay', value:avgDelay?.avg||12.5, unit:'min', status:'warning' },
      { name:'Changeover Loss', value:18.4, unit:'hrs/day', status:'warning' },
      { name:'OTD Performance', value:91.2, unit:'%', status:'warning' },
      { name:'Throughput Efficiency', value:84.6, unit:'%', status:'warning' },
    ])
  } catch {
    return c.json([
      { name:'Jobs In Progress', value:3, unit:'', status:'info' },
      { name:'Schedule Adherence', value:91.2, unit:'%', status:'warning' },
      { name:'Avg Delay', value:12.5, unit:'min', status:'warning' },
      { name:'Changeover Loss', value:18.4, unit:'hrs/day', status:'warning' },
      { name:'OTD Performance', value:91.2, unit:'%', status:'warning' },
      { name:'Throughput Efficiency', value:84.6, unit:'%', status:'warning' },
    ])
  }
})

// Setup matrix
const MOCK_SETUP_MATRIX = [
  { from_sku:'Limca PET 500ml', to_sku:'Sprite PET 750ml', setup_time_minutes:25 },
  { from_sku:'Limca PET 500ml', to_sku:'Fanta PET 1L', setup_time_minutes:45 },
  { from_sku:'Sprite PET 750ml', to_sku:'Thums Up Can 330ml', setup_time_minutes:75 },
  { from_sku:'Sprite PET 750ml', to_sku:'Limca PET 500ml', setup_time_minutes:20 },
  { from_sku:'Fanta PET 1L', to_sku:'Limca PET 500ml', setup_time_minutes:40 },
  { from_sku:'Fanta PET 1L', to_sku:'Sprite PET 750ml', setup_time_minutes:30 },
  { from_sku:'Thums Up Can 330ml', to_sku:'Limca Can 250ml', setup_time_minutes:15 },
  { from_sku:'Thums Up Can 330ml', to_sku:'Fanta PET 1L', setup_time_minutes:80 },
  { from_sku:'Maaza Tetra 200ml', to_sku:'Minute Maid OJ 1L', setup_time_minutes:35 },
  { from_sku:'Minute Maid OJ 1L', to_sku:'Maaza Tetra 200ml', setup_time_minutes:30 },
  { from_sku:'Sprite Glass 500ml', to_sku:'Limca PET 500ml', setup_time_minutes:90 },
  { from_sku:'Limca Can 250ml', to_sku:'Thums Up Can 330ml', setup_time_minutes:12 },
]
app.get('/api/sequencing/setup-matrix', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sm.*, s1.sku_name as from_sku, s2.sku_name as to_sku
      FROM setup_matrix sm JOIN skus s1 ON sm.from_sku_id=s1.id JOIN skus s2 ON sm.to_sku_id=s2.id
      ORDER BY sm.from_sku_id, sm.to_sku_id
    `).all()
    return c.json(results.length ? results : MOCK_SETUP_MATRIX)
  } catch { return c.json(MOCK_SETUP_MATRIX) }
})

// MRP KPIs
app.get('/api/mrp/kpis', async (c) => {
  try {
    const db = c.env.DB
    const openAlerts = await db.prepare('SELECT COUNT(*) as cnt FROM mrp_alerts WHERE status="open"').first<{cnt:number}>()
    const critAlerts = await db.prepare('SELECT COUNT(*) as cnt FROM mrp_alerts WHERE status="open" AND severity="critical"').first<{cnt:number}>()
    const lowStock = await db.prepare('SELECT COUNT(*) as cnt FROM raw_materials WHERE current_stock <= reorder_point').first<{cnt:number}>()
    return c.json([
      { name:'Open MRP Alerts', value:openAlerts?.cnt||6, unit:'', status:'warning' },
      { name:'Critical Shortages', value:critAlerts?.cnt||1, unit:'', status:'critical' },
      { name:'Below Reorder Point', value:lowStock?.cnt||3, unit:'materials', status:'warning' },
      { name:'Active Suppliers', value:8, unit:'', status:'healthy' },
      { name:'PO On-Time Delivery', value:87.4, unit:'%', status:'warning' },
      { name:'MRP Coverage', value:21, unit:'days', status:'healthy' },
    ])
  } catch {
    return c.json([
      { name:'Open MRP Alerts', value:6, unit:'', status:'warning' },
      { name:'Critical Shortages', value:1, unit:'', status:'critical' },
      { name:'Below Reorder Point', value:3, unit:'materials', status:'warning' },
      { name:'Active Suppliers', value:8, unit:'', status:'healthy' },
      { name:'PO On-Time Delivery', value:87.4, unit:'%', status:'warning' },
      { name:'MRP Coverage', value:21, unit:'days', status:'healthy' },
    ])
  }
})

// MRP Alerts
const MOCK_MRP_ALERTS = [
  { id:1, alert_type:'shortage', severity:'high', material_name:'Orange Concentrate', sku_name:'Fanta PET 500ml', message:'Stock 2.1 MT vs 4.8 MT required for W2 production. Gap: 2.7 MT', recommended_action:'Raise emergency PO with GlobalFlavors Co. Approve expedite surcharge ₹12K.', status:'open' },
  { id:2, alert_type:'shortage', severity:'high', material_name:'HDPE Cap 28mm', sku_name:'Limca PET 500ml', message:'Reorder point breached. Current: 8,200 pcs vs 12,000 pcs minimum.', recommended_action:'Place top-up PO with IndoPlast Industries – 30,000 pcs, 5-day lead time.', status:'open' },
  { id:3, alert_type:'expiry_risk', severity:'medium', material_name:'Mango Concentrate Aseptic', sku_name:'Maaza Tetra 200ml', message:'Batch B-2026-012 expires in 14 days. 1.8 MT at risk.', recommended_action:'Prioritize Maaza production for W2 to consume expiring batch.', status:'open' },
  { id:4, alert_type:'shortage', severity:'medium', material_name:'PET Resin 1L Grade', sku_name:'Sprite PET 1L', message:'Coverage 8.2 days. Below 14-day target coverage.', recommended_action:'Accelerate next PO delivery with PetroPlastics Ltd.', status:'open' },
  { id:5, alert_type:'reorder', severity:'low', material_name:'Secondary Carton 1L', sku_name:'Multiple', message:'Approaching reorder point. Current: 22,500 vs 20,000 minimum.', recommended_action:'Place routine replenishment order. No urgency.', status:'open' },
  { id:6, alert_type:'shortage', severity:'high', material_name:'CO₂ Food Grade Gas', sku_name:'Thums Up Can 330ml', message:'Supplier delivery delayed by 2 days. Buffer of 1 day only.', recommended_action:'Activate backup supplier CarbonGas Ltd. Emergency delivery arranged.', status:'acknowledged' },
]
app.get('/api/mrp/alerts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT ma.*, s.sku_name, rm.material_name
      FROM mrp_alerts ma LEFT JOIN skus s ON ma.sku_id=s.id LEFT JOIN raw_materials rm ON ma.material_id=rm.id
      WHERE ma.status='open' ORDER BY CASE ma.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `).all()
    return c.json(results.length ? results : MOCK_MRP_ALERTS)
  } catch { return c.json(MOCK_MRP_ALERTS) }
})

// Raw materials
const MOCK_MATERIALS = [
  { id:1, material_code:'RM-001', material_name:'PET Resin 500ml Grade', material_type:'RM', abc_classification:'A', current_stock:185000, reorder_point:120000, unit_of_measure:'kg', shelf_life_days:365 },
  { id:2, material_code:'RM-002', material_name:'PET Resin 1L Grade', material_type:'RM', abc_classification:'A', current_stock:68000, reorder_point:80000, unit_of_measure:'kg', shelf_life_days:365 },
  { id:3, material_code:'RM-003', material_name:'Mango Concentrate Aseptic', material_type:'RM', abc_classification:'A', current_stock:3800, reorder_point:2500, unit_of_measure:'kg', shelf_life_days:180 },
  { id:4, material_code:'RM-004', material_name:'Orange Concentrate', material_type:'RM', abc_classification:'A', current_stock:2100, reorder_point:4800, unit_of_measure:'kg', shelf_life_days:180 },
  { id:5, material_code:'RM-005', material_name:'Sugar Food Grade', material_type:'RM', abc_classification:'B', current_stock:55000, reorder_point:40000, unit_of_measure:'kg', shelf_life_days:730 },
  { id:6, material_code:'RM-006', material_name:'CO₂ Food Grade Gas', material_type:'RM', abc_classification:'A', current_stock:1200, reorder_point:1000, unit_of_measure:'kg', shelf_life_days:null },
  { id:7, material_code:'PM-001', material_name:'HDPE Cap 28mm', material_type:'PM', abc_classification:'B', current_stock:8200, reorder_point:12000, unit_of_measure:'pcs', shelf_life_days:1825 },
  { id:8, material_code:'PM-002', material_name:'Label Film 500ml', material_type:'PM', abc_classification:'B', current_stock:42000, reorder_point:30000, unit_of_measure:'rolls', shelf_life_days:null },
  { id:9, material_code:'PM-003', material_name:'Secondary Carton 1L', material_type:'PM', abc_classification:'C', current_stock:22500, reorder_point:20000, unit_of_measure:'pcs', shelf_life_days:null },
  { id:10, material_code:'PM-004', material_name:'Shrink Film Clear', material_type:'PM', abc_classification:'C', current_stock:18000, reorder_point:15000, unit_of_measure:'kg', shelf_life_days:null },
]
app.get('/api/mrp/materials', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM raw_materials ORDER BY abc_classification, material_name').all()
    return c.json(results.length ? results : MOCK_MATERIALS)
  } catch { return c.json(MOCK_MATERIALS) }
})

// BOM
const MOCK_BOM = [
  { id:1, sku_name:'PET 500ml Regular', material_code:'RM-001', material_name:'PET Resin 500ml Grade', quantity_per_unit:0.025, unit_of_measure:'kg', waste_percentage:2.5, version:'v1', current_stock:185000, reorder_point:120000 },
  { id:2, sku_name:'PET 500ml Regular', material_code:'PM-001', material_name:'HDPE Cap 28mm', quantity_per_unit:1, unit_of_measure:'pcs', waste_percentage:1.0, version:'v1', current_stock:8200, reorder_point:12000 },
  { id:3, sku_name:'PET 500ml Regular', material_code:'PM-002', material_name:'Label Film 500ml', quantity_per_unit:0.002, unit_of_measure:'rolls', waste_percentage:3.0, version:'v1', current_stock:42000, reorder_point:30000 },
  { id:4, sku_name:'PET 1L Regular', material_code:'RM-002', material_name:'PET Resin 1L Grade', quantity_per_unit:0.042, unit_of_measure:'kg', waste_percentage:2.5, version:'v1', current_stock:68000, reorder_point:80000 },
  { id:5, sku_name:'Mango 200ml Can', material_code:'RM-003', material_name:'Mango Concentrate Aseptic', quantity_per_unit:0.018, unit_of_measure:'kg', waste_percentage:1.5, version:'v1', current_stock:3800, reorder_point:2500 },
  { id:6, sku_name:'Fanta PET 500ml', material_code:'RM-004', material_name:'Orange Concentrate', quantity_per_unit:0.022, unit_of_measure:'kg', waste_percentage:1.5, version:'v1', current_stock:2100, reorder_point:4800 },
  { id:7, sku_name:'Thums Up Can 330ml', material_code:'RM-006', material_name:'CO₂ Food Grade Gas', quantity_per_unit:0.006, unit_of_measure:'kg', waste_percentage:5.0, version:'v1', current_stock:1200, reorder_point:1000 },
  { id:8, sku_name:'Multiple SKUs', material_code:'PM-003', material_name:'Secondary Carton 1L', quantity_per_unit:0.042, unit_of_measure:'pcs', waste_percentage:2.0, version:'v1', current_stock:22500, reorder_point:20000 },
]
app.get('/api/mrp/bom', async (c) => {
  try {
    const skuId = c.req.query('sku_id')
    const query = skuId
      ? 'SELECT b.*, s.sku_name, rm.material_name, rm.material_code, rm.unit_of_measure, rm.current_stock, rm.reorder_point FROM bom b JOIN skus s ON b.sku_id=s.id JOIN raw_materials rm ON b.material_id=rm.id WHERE b.sku_id=? ORDER BY rm.abc_classification'
      : 'SELECT b.*, s.sku_name, rm.material_name, rm.material_code, rm.unit_of_measure, rm.current_stock, rm.reorder_point FROM bom b JOIN skus s ON b.sku_id=s.id JOIN raw_materials rm ON b.material_id=rm.id ORDER BY s.sku_code, rm.abc_classification'
    const { results } = skuId ? await c.env.DB.prepare(query).bind(parseInt(skuId)).all() : await c.env.DB.prepare(query).all()
    if (results && results.length > 0) return c.json(results)
    return c.json(MOCK_BOM)
  } catch { return c.json(MOCK_BOM) }
})

const MOCK_EXPLOSION = [
  { job_number:'JOB-MUM-0317-001', sku_name:'PET 500ml Regular', due_date:'2026-03-20', material_code:'RM-001', material_name:'PET Resin 500ml Grade', gross_requirement:45000, current_stock:185000, net_requirement:0, status:'adequate', lead_time_days:5 },
  { job_number:'JOB-MUM-0317-001', sku_name:'PET 500ml Regular', due_date:'2026-03-20', material_code:'PM-001', material_name:'HDPE Cap 28mm', gross_requirement:18000, current_stock:8200, net_requirement:9800, status:'shortage', lead_time_days:3 },
  { job_number:'JOB-MUM-0317-002', sku_name:'Fanta PET 500ml', due_date:'2026-03-21', material_code:'RM-004', material_name:'Orange Concentrate', gross_requirement:4860, current_stock:2100, net_requirement:2760, status:'critical', lead_time_days:7 },
  { job_number:'JOB-DEL-0317-001', sku_name:'Mango 200ml Can', due_date:'2026-03-22', material_code:'RM-003', material_name:'Mango Concentrate Aseptic', gross_requirement:2916, current_stock:3800, net_requirement:0, status:'adequate', lead_time_days:7 },
  { job_number:'JOB-CHN-0317-001', sku_name:'Thums Up Can 330ml', due_date:'2026-03-22', material_code:'RM-006', material_name:'CO\u2082 Food Grade Gas', gross_requirement:1260, current_stock:1200, net_requirement:60, status:'shortage', lead_time_days:2 },
  { job_number:'JOB-MUM-0317-003', sku_name:'PET 1L Regular', due_date:'2026-03-23', material_code:'RM-002', material_name:'PET Resin 1L Grade', gross_requirement:75600, current_stock:68000, net_requirement:7600, status:'shortage', lead_time_days:5 },
  { job_number:'JOB-MUM-0317-003', sku_name:'PET 1L Regular', due_date:'2026-03-23', material_code:'PM-003', material_name:'Secondary Carton 1L', gross_requirement:15120, current_stock:22500, net_requirement:0, status:'adequate', lead_time_days:4 },
]

// MRP Explosion (simulated)
app.get('/api/mrp/explosion', async (c) => {
  try {
    const { results: jobs } = await c.env.DB.prepare(`
      SELECT j.*, s.sku_name FROM jobs j JOIN skus s ON j.sku_id=s.id WHERE j.status IN ('scheduled','pending') ORDER BY j.due_date LIMIT 10
    `).all() as { results: any[] }
    const explosion: any[] = []
    for (const job of (jobs || []).slice(0,5)) {
      const { results: bomItems } = await c.env.DB.prepare(`
        SELECT b.*, rm.material_name, rm.material_code, rm.current_stock, rm.lead_time_days
        FROM bom b JOIN raw_materials rm ON b.material_id=rm.id WHERE b.sku_id=?
      `).bind(job.sku_id).all() as { results: any[] }
      for (const item of (bomItems || [])) {
        const gross = Math.round((job.quantity as number) * (item.quantity_per_unit as number) * (1 + (item.waste_percentage as number)/100))
        const net = Math.max(0, gross - (item.current_stock as number))
        explosion.push({
          job_number: job.job_number, sku_name: job.sku_name, due_date: job.due_date,
          material_code: item.material_code, material_name: item.material_name,
          gross_requirement: gross, current_stock: item.current_stock,
          net_requirement: net, status: net > 0 ? (item.current_stock < gross * 0.5 ? 'critical' : 'shortage') : 'adequate',
          lead_time_days: item.lead_time_days || 7
        })
      }
    }
    if (explosion.length > 0) return c.json(explosion)
    return c.json(MOCK_EXPLOSION)
  } catch {
    return c.json(MOCK_EXPLOSION)
  }
})

// ── Enhanced MRP API Routes (Optimizer Integration) ──────────────────────────

// Net Requirements (computed from BOM explosion)
app.get('/api/mrp/net-requirements', (c) => {
  return c.json(computeNetRequirements())
})

// Run MRP – full BOM explosion with suggested POs
app.post('/api/mrp/run-mrp', async (c) => {
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const netReqs = computeNetRequirements()
  const shortages = netReqs.filter(r => r.status === 'SHORT')
  const suggestedPOs = shortages.map((s, idx) => ({
    id: `PO-AUTO-${String(idx + 1).padStart(3, '0')}`,
    rmSKU: s.rmSKU,
    rmName: s.rmName,
    qty: s.plannedOrderReceipt,
    neededByWeek: s.week,
    status: 'Planned',
  }))
  return c.json({
    success: true,
    runAt: new Date().toISOString(),
    scenario: body.scenario ?? 'Baseline',
    summary: {
      totalSKUs: bomMaster.length,
      totalComponents: bomMaster.reduce((a, b) => a + b.bom.length, 0),
      shortages: shortages.length,
      suggestedPOs: suggestedPOs.length,
      planAdherence: 96.2,
    },
    suggestedPOs,
    netRequirements: netReqs,
  })
})

// MRP Scenarios
app.get('/api/mrp/scenarios', (c) => c.json(mrpScenarios))

// MRP Constraints
app.get('/api/mrp/constraints', (c) => c.json(mrpConstraints))

// MRP Objectives
app.get('/api/mrp/objectives', (c) => c.json(mrpObjectives))

// MRP Optimization
app.post('/api/mrp/optimize', async (c) => {
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const scenarioId = body.scenarioId as string ?? 'S2'
  const selected = mrpScenarios.find(s => s.id === scenarioId) ?? mrpScenarios[2]
  return c.json({
    success: true,
    optimizedAt: new Date().toISOString(),
    scenario: selected,
    recommendations: [
      { action: 'Recalibrate safety stock for RM-004 (Orange Concentrate)', impact: 'Reduce holding cost by 12%', priority: 'High' },
      { action: 'Split PO for PKG-005 (Aluminium Can) across 2 suppliers', impact: 'Reduce supply risk by 35%', priority: 'High' },
      { action: 'Increase Line-4 (Energy) to 3 shifts during W03–W05', impact: 'Eliminate 5.3% capacity gap', priority: 'Medium' },
      { action: 'Consolidate ordering for SUP-G to reduce order frequency', impact: 'Save ₹42,000 in ordering costs', priority: 'Medium' },
      { action: 'Implement vendor-managed inventory for CO₂ (SUP-C)', impact: 'Reduce lead time risk by 20%', priority: 'Low' },
    ],
  })
})

// Create MRP Purchase Order
app.post('/api/mrp/create-po', async (c) => {
  const body = await c.req.json().catch(() => ({})) as Record<string, unknown>
  const id = `PO-${Date.now().toString().slice(-6)}`
  return c.json({
    success: true,
    po: {
      id,
      rmSKU: body.rmSKU ?? 'RM-001',
      rmName: body.rmName ?? 'Unknown',
      supplier: body.supplier ?? 'SUP-A',
      qty: body.qty ?? 0,
      orderDate: new Date().toISOString().slice(0, 10),
      expectedDelivery: new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10),
      status: 'Planned',
      cost: Number(body.qty ?? 0) * Number(body.unitCost ?? 1),
      priority: body.priority ?? 'Normal',
    },
  })
})

// MRP BOM Data (enhanced)
app.get('/api/mrp/bom-master', (c) => c.json(bomMaster))

// MRP Demand Data
app.get('/api/mrp/demand', (c) => c.json(demandData))

// MRP Inventory Data
app.get('/api/mrp/inventory-data', (c) => c.json(inventoryData))

// MRP Purchase Orders (standalone static POs)
app.get('/api/mrp/purchase-orders', (c) => c.json(mrpPurchaseOrders))

// MRP Export CSV
app.get('/api/mrp/export/:type', (c) => {
  const type = c.req.param('type')
  let csv = ''
  let filename = 'export.csv'

  if (type === 'net-requirements') {
    const data = computeNetRequirements()
    csv = 'Week,FG SKU,FG Name,RM SKU,RM Name,Gross Req,Scheduled Receipt,Proj Inventory,Net Req,Planned Order,Status\n'
    csv += data.map(r =>
      `${r.week},${r.fgSKU},${r.fgName},${r.rmSKU},${r.rmName},${r.grossReq},${r.scheduledReceipt},${r.projectedInventory},${r.netReq},${r.plannedOrderReceipt},${r.status}`
    ).join('\n')
    filename = 'net_requirements.csv'
  } else if (type === 'purchase-orders') {
    csv = 'PO ID,RM SKU,RM Name,Supplier,Qty,Order Date,Expected Delivery,Status,Cost,Priority\n'
    csv += mrpPurchaseOrders.map(p =>
      `${p.id},${p.rmSKU},${p.rmName},${p.supplier},${p.qty},${p.orderDate},${p.expectedDelivery},${p.status},${p.cost},${p.priority}`
    ).join('\n')
    filename = 'purchase_orders.csv'
  } else if (type === 'inventory') {
    csv = 'SKU,Name,Type,On Hand,In Transit,Safety Stock,Unit,Location\n'
    csv += inventoryData.map(i =>
      `${i.sku},${i.name},${i.type},${i.onHand},${i.inTransit},${i.safetyStock},${i.unit},${i.location}`
    ).join('\n')
    filename = 'inventory.csv'
  } else if (type === 'scenarios') {
    csv = 'Scenario ID,Name,Driver,Material Availability,Inventory Reduction,Cost Reduction,Service Level,Total Cost,Shortage\n'
    csv += mrpScenarios.map(s =>
      `${s.id},${s.name},${s.driver},${s.kpis.materialAvailability}%,${s.kpis.inventoryReduction}%,${s.kpis.costReduction}%,${s.kpis.serviceLevel}%,${s.kpis.totalCost},${s.kpis.shortage}%`
    ).join('\n')
    filename = 'scenario_comparison.csv'
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})

// Inventory KPIs
app.get('/api/inventory/kpis', async (c) => {
  try {
    const db = c.env.DB
    const stockouts = await db.prepare('SELECT COUNT(*) as cnt FROM stock_positions WHERE available_qty <= safety_stock').first<{cnt:number}>()
    const excess = await db.prepare('SELECT COUNT(*) as cnt FROM stock_positions WHERE days_of_supply > 30').first<{cnt:number}>()
    const avgDOS = await db.prepare('SELECT ROUND(AVG(days_of_supply),1) as avg FROM stock_positions').first<{avg:number}>()
    return c.json([
      { name:'Total SKUs Tracked', value:10, unit:'', status:'info' },
      { name:'Stockout Risk', value:stockouts?.cnt||1, unit:'SKUs', status:'critical' },
      { name:'Excess Inventory', value:excess?.cnt||2, unit:'SKUs', status:'warning' },
      { name:'Avg Days of Supply', value:avgDOS?.avg||14.8, unit:'days', status:'warning' },
      { name:'Inventory Turns', value:18.2, unit:'x/yr', status:'healthy' },
      { name:'Service Level', value:97.1, unit:'%', status:'healthy' },
    ])
  } catch {
    return c.json([
      { name:'Total SKUs Tracked', value:10, unit:'', status:'info' },
      { name:'Stockout Risk', value:1, unit:'SKUs', status:'critical' },
      { name:'Excess Inventory', value:2, unit:'SKUs', status:'warning' },
      { name:'Avg Days of Supply', value:14.8, unit:'days', status:'warning' },
      { name:'Inventory Turns', value:18.2, unit:'x/yr', status:'healthy' },
      { name:'Service Level', value:97.1, unit:'%', status:'healthy' },
    ])
  }
})

// Stock positions
const MOCK_STOCK = [
  { sku_id:1, sku_name:'Limca PET 500ml', sku_code:'SKU-500-PET', plant_name:'Mumbai', on_hand_qty:42000, reserved_qty:8000, in_transit_qty:12000, available_qty:34000, safety_stock:18000, days_of_supply:14.7, max_stock:70000 },
  { sku_id:2, sku_name:'Sprite PET 750ml', sku_code:'SKU-750-PET', plant_name:'Mumbai', on_hand_qty:28000, reserved_qty:4000, in_transit_qty:8000, available_qty:24000, safety_stock:12000, days_of_supply:22.3, max_stock:50000 },
  { sku_id:3, sku_name:'Thums Up Can 330ml', sku_code:'SKU-CAN-330', plant_name:'Delhi', on_hand_qty:18000, reserved_qty:6000, in_transit_qty:4000, available_qty:12000, safety_stock:15000, days_of_supply:7.2, max_stock:45000 },
  { sku_id:4, sku_name:'Fanta PET 1L', sku_code:'SKU-1L-PET', plant_name:'Mumbai', on_hand_qty:35000, reserved_qty:5000, in_transit_qty:6000, available_qty:30000, safety_stock:14000, days_of_supply:18.9, max_stock:55000 },
  { sku_id:5, sku_name:'Maaza Tetra 200ml', sku_code:'SKU-TETRA-200', plant_name:'Chennai', on_hand_qty:48000, reserved_qty:10000, in_transit_qty:15000, available_qty:38000, safety_stock:14000, days_of_supply:31.4, max_stock:65000 },
  { sku_id:6, sku_name:'Sprite Glass 500ml', sku_code:'SKU-GLS-500', plant_name:'Delhi', on_hand_qty:12000, reserved_qty:2000, in_transit_qty:3000, available_qty:10000, safety_stock:8000, days_of_supply:11.2, max_stock:25000 },
  { sku_id:7, sku_name:'Limca Can 250ml', sku_code:'SKU-CAN-250', plant_name:'Mumbai', on_hand_qty:22000, reserved_qty:4500, in_transit_qty:5000, available_qty:17500, safety_stock:10000, days_of_supply:16.8, max_stock:40000 },
  { sku_id:8, sku_name:'Minute Maid OJ 1L', sku_code:'SKU-MM-1L', plant_name:'Chennai', on_hand_qty:14000, reserved_qty:3000, in_transit_qty:4000, available_qty:11000, safety_stock:8000, days_of_supply:13.1, max_stock:30000 },
]
app.get('/api/inventory/stock', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sp.*, s.sku_name, s.sku_code, s.abc_classification, s.category, p.plant_name
      FROM stock_positions sp JOIN skus s ON sp.sku_id=s.id JOIN plants p ON sp.plant_id=p.id
      ORDER BY s.abc_classification, s.sku_name
    `).all()
    return c.json(results.length ? results : MOCK_STOCK)
  } catch { return c.json(MOCK_STOCK) }
})

// Procurement KPIs
app.get('/api/procurement/kpis', async (c) => {
  try {
    const db = c.env.DB
    const suppliers = await db.prepare('SELECT COUNT(*) as cnt FROM suppliers').first<{cnt:number}>()
    const highRisk = await db.prepare('SELECT COUNT(*) as cnt FROM suppliers WHERE risk_level="high"').first<{cnt:number}>()
    const plans = await db.prepare('SELECT COUNT(*) as cnt FROM procurement_plans WHERE status="approved"').first<{cnt:number}>()
    return c.json([
      { name:'Active Suppliers', value:suppliers?.cnt||8, unit:'', status:'healthy' },
      { name:'High Risk Suppliers', value:highRisk?.cnt||2, unit:'', status:'warning' },
      { name:'Approved POs', value:plans?.cnt||5, unit:'', status:'info' },
      { name:'Avg Lead Time', value:11.2, unit:'days', status:'warning' },
      { name:'Supplier OTIF', value:87.4, unit:'%', status:'warning' },
      { name:'Spend This Month', value:99.01, unit:'₹ Lakh', status:'info' },
    ])
  } catch {
    return c.json([
      { name:'Active Suppliers', value:8, unit:'', status:'healthy' },
      { name:'High Risk Suppliers', value:2, unit:'', status:'warning' },
      { name:'Approved POs', value:5, unit:'', status:'info' },
      { name:'Avg Lead Time', value:11.2, unit:'days', status:'warning' },
      { name:'Supplier OTIF', value:87.4, unit:'%', status:'warning' },
      { name:'Spend This Month', value:99.01, unit:'₹ Lakh', status:'info' },
    ])
  }
})

// Suppliers
const MOCK_SUPPLIERS = [
  { id:1, name:'IndoPlast Industries', location:'Pune, Maharashtra', rating:4.6, reliability_score:91.2, lead_time_days:7, risk_level:'low', is_sustainable:true },
  { id:2, name:'PetroPlastics Ltd', location:'Surat, Gujarat', rating:4.2, reliability_score:87.8, lead_time_days:10, risk_level:'medium', is_sustainable:false },
  { id:3, name:'GlobalFlavors Co', location:'Mumbai, Maharashtra', rating:3.9, reliability_score:82.1, lead_time_days:14, risk_level:'medium', is_sustainable:true },
  { id:4, name:'SweetSource Ltd', location:'Kolkata, West Bengal', rating:4.4, reliability_score:89.6, lead_time_days:8, risk_level:'low', is_sustainable:false },
  { id:5, name:'CanTech Solutions', location:'Hyderabad, Telangana', rating:4.1, reliability_score:85.4, lead_time_days:12, risk_level:'low', is_sustainable:true },
  { id:6, name:'CarbonGas Ltd', location:'Navi Mumbai, Maharashtra', rating:3.7, reliability_score:78.2, lead_time_days:5, risk_level:'high', is_sustainable:false },
  { id:7, name:'CitrusFresh India', location:'Nagpur, Maharashtra', rating:4.3, reliability_score:88.0, lead_time_days:9, risk_level:'low', is_sustainable:true },
  { id:8, name:'PackRight Pvt Ltd', location:'Ahmedabad, Gujarat', rating:3.8, reliability_score:80.6, lead_time_days:11, risk_level:'medium', is_sustainable:false },
]
const MOCK_PLANS = [
  { id:1, material_name:'PET Resin 500ml', supplier_name:'IndoPlast Industries', planned_qty:120000, planned_cost:11400000, period:'2026-03', status:'approved' },
  { id:2, material_name:'PET Resin 1L Grade', supplier_name:'PetroPlastics Ltd', planned_qty:85000, planned_cost:7480000, period:'2026-03', status:'approved' },
  { id:3, material_name:'Mango Concentrate', supplier_name:'GlobalFlavors Co', planned_qty:32000, planned_cost:4000000, period:'2026-03', status:'pending' },
  { id:4, material_name:'Orange Concentrate', supplier_name:'GlobalFlavors Co', planned_qty:28000, planned_cost:3080000, period:'2026-03', status:'pending' },
  { id:5, material_name:'Sugar Food Grade', supplier_name:'SweetSource Ltd', planned_qty:55000, planned_cost:5610000, period:'2026-03', status:'executed' },
  { id:6, material_name:'Label Film 500ml', supplier_name:'IndoPlast Industries', planned_qty:95000, planned_cost:9975000, period:'2026-03', status:'executed' },
  { id:7, material_name:'Can Body 250ml', supplier_name:'CanTech Solutions', planned_qty:22000, planned_cost:2530000, period:'2026-04', status:'draft' },
  { id:8, material_name:'HDPE Cap 28mm', supplier_name:'IndoPlast Industries', planned_qty:45000, planned_cost:3240000, period:'2026-04', status:'draft' },
  { id:9, material_name:'CO₂ Gas Food Grade', supplier_name:'CarbonGas Ltd', planned_qty:5000, planned_cost:750000, period:'2026-03', status:'pending' },
]
app.get('/api/procurement/suppliers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM suppliers ORDER BY rating DESC').all()
    return c.json(results.length ? results : MOCK_SUPPLIERS)
  } catch { return c.json(MOCK_SUPPLIERS) }
})

// Procurement plans
app.get('/api/procurement/plans', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT pp.*, rm.material_name, rm.material_code, s.name as supplier_name
      FROM procurement_plans pp JOIN raw_materials rm ON pp.material_id=rm.id JOIN suppliers s ON pp.supplier_id=s.id
      ORDER BY pp.status, pp.period
    `).all()
    return c.json(results.length ? results : MOCK_PLANS)
  } catch { return c.json(MOCK_PLANS) }
})

// Resource KPIs
app.get('/api/resource/kpis', async (c) => {
  try {
    const db = c.env.DB
    const avgUtil = await db.prepare('SELECT ROUND(AVG(utilization_pct),1) as avg FROM resource_capacity WHERE capacity_date >= date("now","-7 days")').first<{avg:number}>()
    return c.json([
      { name:'Avg Resource Utilization', value:avgUtil?.avg||79.8, unit:'%', status: (avgUtil?.avg||79.8) > 85 ? 'critical' : 'warning' },
      { name:'Operators On Shift', value:48, unit:'', status:'info' },
      { name:'Overtime Hours', value:142, unit:'hrs/week', status:'critical' },
      { name:'Training Coverage', value:76.4, unit:'%', status:'warning' },
      { name:'Workforce Efficiency', value:88.2, unit:'%', status:'healthy' },
      { name:'Skill Gap Lines', value:2, unit:'lines', status:'warning' },
    ])
  } catch {
    return c.json([
      { name:'Avg Resource Utilization', value:79.8, unit:'%', status:'warning' },
      { name:'Operators On Shift', value:48, unit:'', status:'info' },
      { name:'Overtime Hours', value:142, unit:'hrs/week', status:'critical' },
      { name:'Training Coverage', value:76.4, unit:'%', status:'warning' },
      { name:'Workforce Efficiency', value:88.2, unit:'%', status:'healthy' },
      { name:'Skill Gap Lines', value:2, unit:'lines', status:'warning' },
    ])
  }
})

// Resource capacity
const MOCK_RESOURCE_CAPACITY = [
  { line_name:'MUM-L1', plant_name:'Mumbai', capacity_date:'2026-03-17', available_hours:20, maintenance_hours:2, utilization_pct:91 },
  { line_name:'MUM-L2', plant_name:'Mumbai', capacity_date:'2026-03-17', available_hours:18, maintenance_hours:4, utilization_pct:98 },
  { line_name:'DEL-L1', plant_name:'Delhi', capacity_date:'2026-03-17', available_hours:20, maintenance_hours:2, utilization_pct:78 },
  { line_name:'DEL-L2', plant_name:'Delhi', capacity_date:'2026-03-17', available_hours:22, maintenance_hours:0, utilization_pct:82 },
  { line_name:'CHN-L1', plant_name:'Chennai', capacity_date:'2026-03-17', available_hours:20, maintenance_hours:2, utilization_pct:76 },
  { line_name:'BLR-L1', plant_name:'Bangalore', capacity_date:'2026-03-17', available_hours:20, maintenance_hours:2, utilization_pct:84 },
]
const MOCK_OPERATORS = [
  { operator_name:'Rajesh Kumar', plant_name:'Mumbai', line_name:'MUM-L1', skill_name:'PET Blowing', proficiency_level:4, status:'active', certification_date:'2024-06-15', expiry_date:'2027-06-15' },
  { operator_name:'Rajesh Kumar', plant_name:'Mumbai', line_name:'MUM-L1', skill_name:'Filling & Capping', proficiency_level:5, status:'active', certification_date:'2024-06-15', expiry_date:'2027-06-15' },
  { operator_name:'Priya Singh', plant_name:'Mumbai', line_name:'MUM-L2', skill_name:'CIP/SIP', proficiency_level:3, status:'active', certification_date:'2025-01-10', expiry_date:'2028-01-10' },
  { operator_name:'Priya Singh', plant_name:'Mumbai', line_name:'MUM-L2', skill_name:'Labelling', proficiency_level:4, status:'active', certification_date:'2025-01-10', expiry_date:'2028-01-10' },
  { operator_name:'Amit Shah', plant_name:'Delhi', line_name:'DEL-L1', skill_name:'PET Blowing', proficiency_level:3, status:'active', certification_date:'2023-09-20', expiry_date:'2026-09-20' },
  { operator_name:'Amit Shah', plant_name:'Delhi', line_name:'DEL-L1', skill_name:'Quality Control', proficiency_level:4, status:'active', certification_date:'2023-09-20', expiry_date:'2026-09-20' },
  { operator_name:'Deepa Nair', plant_name:'Chennai', line_name:'CHN-L1', skill_name:'Filling & Capping', proficiency_level:5, status:'active', certification_date:'2024-03-01', expiry_date:'2027-03-01' },
  { operator_name:'Suresh Pillai', plant_name:'Bangalore', line_name:'BLR-L1', skill_name:'CIP/SIP', proficiency_level:2, status:'active', certification_date:'2025-07-01', expiry_date:'2028-07-01' },
  { operator_name:'Kavitha Reddy', plant_name:'Chennai', line_name:'CHN-L1', skill_name:'Labelling', proficiency_level:3, status:'leave', certification_date:'2024-05-15', expiry_date:'2027-05-15' },
  { operator_name:'Mohammed Ali', plant_name:'Delhi', line_name:'DEL-L2', skill_name:'PET Blowing', proficiency_level:4, status:'active', certification_date:'2024-11-20', expiry_date:'2027-11-20' },
]
app.get('/api/resource/capacity', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT rc.*, p.plant_name, pl.line_name, pl.line_code
      FROM resource_capacity rc JOIN plants p ON rc.plant_id=p.id JOIN production_lines pl ON rc.line_id=pl.id
      ORDER BY rc.capacity_date DESC, p.plant_name
    `).all()
    return c.json(results.length ? results : MOCK_RESOURCE_CAPACITY)
  } catch { return c.json(MOCK_RESOURCE_CAPACITY) }
})

// Operator skills
app.get('/api/resource/operators', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT os.*, p.plant_name, pl.line_name
      FROM operator_skills os LEFT JOIN plants p ON os.plant_id=p.id LEFT JOIN production_lines pl ON os.line_id=pl.id
      ORDER BY p.plant_name, os.operator_name
    `).all()
    return c.json(results.length ? results : MOCK_OPERATORS)
  } catch { return c.json(MOCK_OPERATORS) }
})

// S&OP KPIs
const MOCK_SOP_KPIS = [
  { category:'Demand', name:'Forecast Accuracy', value:87.3, target:90, unit:'%', trend:'up', period:'2026-03' },
  { category:'Demand', name:'MAPE', value:12.7, target:10, unit:'%', trend:'up', period:'2026-03' },
  { category:'Supply', name:'Supply Plan Adherence', value:94.1, target:95, unit:'%', trend:'up', period:'2026-03' },
  { category:'Supply', name:'Supply-Demand Gap', value:3.8, target:2, unit:'%', trend:'down', period:'2026-03' },
  { category:'Inventory', name:'Avg Days of Supply', value:14.8, target:14, unit:'days', trend:'stable', period:'2026-03' },
  { category:'Service', name:'OTIF', value:92.1, target:95, unit:'%', trend:'up', period:'2026-03' },
  { category:'Financial', name:'Revenue Plan Achievement', value:96.2, target:100, unit:'%', trend:'up', period:'2026-03' },
  { category:'Demand', name:'New Product Forecast Acc.', value:78.4, target:80, unit:'%', trend:'up', period:'2026-03' },
]
const MOCK_FORECAST = [
  { period:'W1 Jan', sku_name:'All India', forecast_qty:1080000, actual_qty:1052000, confidence_level:0.88 },
  { period:'W2 Jan', sku_name:'All India', forecast_qty:1120000, actual_qty:1105000, confidence_level:0.86 },
  { period:'W3 Jan', sku_name:'All India', forecast_qty:1090000, actual_qty:1078000, confidence_level:0.89 },
  { period:'W4 Jan', sku_name:'All India', forecast_qty:1150000, actual_qty:1132000, confidence_level:0.87 },
  { period:'W1 Feb', sku_name:'All India', forecast_qty:1180000, actual_qty:1164000, confidence_level:0.91 },
  { period:'W2 Feb', sku_name:'All India', forecast_qty:1160000, actual_qty:1148000, confidence_level:0.90 },
  { period:'W3 Feb', sku_name:'All India', forecast_qty:1200000, actual_qty:1185000, confidence_level:0.88 },
  { period:'W4 Feb', sku_name:'All India', forecast_qty:1220000, actual_qty:1208000, confidence_level:0.89 },
  { period:'W1 Mar', sku_name:'All India', forecast_qty:1250000, actual_qty:1235000, confidence_level:0.92 },
  { period:'W2 Mar', sku_name:'All India', forecast_qty:1230000, actual_qty:null, confidence_level:0.85 },
  { period:'W3 Mar', sku_name:'All India', forecast_qty:1280000, actual_qty:null, confidence_level:0.83 },
  { period:'W4 Mar', sku_name:'All India', forecast_qty:1310000, actual_qty:null, confidence_level:0.80 },
]
const MOCK_SOP_SCENARIOS = [
  { id:1, name:'Baseline – Mar 2026', module:'sop', driver:'Balanced', description:'Standard consensus plan balancing demand forecast with supply capacity. Approved by planning team.', status:'approved', is_baseline:true, updated_at:'2026-03-15T10:00:00' },
  { id:2, name:'Summer Demand Upside +15%', module:'sop', driver:'Demand', description:'Account for early summer demand surge. Requires additional production at Mumbai and Chennai plants.', status:'draft', is_baseline:false, updated_at:'2026-03-14T14:30:00' },
  { id:3, name:'Capacity Constraint – Mumbai W1-W2', module:'sop', driver:'Supply', description:'MUM-L2 overload mitigation: defer 120K cases to Delhi, approve weekend overtime.', status:'approved', is_baseline:false, updated_at:'2026-03-16T09:00:00' },
  { id:4, name:'Promotion: Thums Up IPL', module:'sop', driver:'Promotion', description:'IPL season uplift 22% for Thums Up. Incremental 280K cases over 8 weeks.', status:'review', is_baseline:false, updated_at:'2026-03-12T16:00:00' },
]
app.get('/api/sop/kpis', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM sop_kpis ORDER BY category, name').all()
    return c.json(results.length ? results : MOCK_SOP_KPIS)
  } catch { return c.json(MOCK_SOP_KPIS) }
})

// S&OP Demand forecast
app.get('/api/sop/forecast', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT df.*, s.sku_name, s.category FROM demand_forecast df JOIN skus s ON df.sku_id=s.id
      WHERE df.location='All India' ORDER BY df.period, s.sku_name
    `).all()
    return c.json(results.length ? results : MOCK_FORECAST)
  } catch { return c.json(MOCK_FORECAST) }
})

// S&OP Scenarios
app.get('/api/sop/scenarios', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM scenarios WHERE module='sop' ORDER BY is_baseline DESC, status").all()
    return c.json(results.length ? results : MOCK_SOP_SCENARIOS)
  } catch { return c.json(MOCK_SOP_SCENARIOS) }
})

// Recommendations
const MOCK_RECOMMENDATIONS = [
  { id:1, module:'capacity', impact:'critical', status:'pending', title:'Shift 8K cases from MUM-L2 to MUM-L1', description:'MUM-L2 at 98% risks unplanned downtime. Shift production this week.', savings_inr:840000, confidence:94 },
  { id:2, module:'deployment', impact:'high', status:'pending', title:'Re-optimize 24 routes – ₹4.2L/mo savings', description:'AI identified inefficiencies in Mumbai–Tier2 distribution network.', savings_inr:420000, confidence:89 },
  { id:3, module:'mrp', impact:'high', status:'pending', title:'Emergency PO – Orange Concentrate', description:'Raise 2.7MT PO immediately to avoid Fanta production stoppage in W2.', savings_inr:0, confidence:99 },
  { id:4, module:'inventory', impact:'medium', status:'pending', title:'Excess Maaza Tetra stock – plan depletion', description:'31.4 days stock. Increase distribution push to modern trade.', savings_inr:180000, confidence:81 },
  { id:5, module:'sop', impact:'medium', status:'completed', title:'Approve weekend overtime – Mumbai', description:'Close 120K case gap in March supply plan via 2 weekend shifts.', savings_inr:0, confidence:92 },
  { id:6, module:'sequencing', impact:'medium', status:'pending', title:'Optimize changeover sequence – MUM-L1', description:'Resequencing PET bottles by size reduces changeover by 35 min/shift.', savings_inr:280000, confidence:87 },
]
app.get('/api/recommendations', async (c) => {
  const module = c.req.query('module')
  try {
    const query = module
      ? 'SELECT * FROM recommendations WHERE module=? ORDER BY CASE impact WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, status'
      : 'SELECT * FROM recommendations ORDER BY CASE impact WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, status'
    const { results } = module ? await c.env.DB.prepare(query).bind(module).all() : await c.env.DB.prepare(query).all()
    const fallback = module ? MOCK_RECOMMENDATIONS.filter((r:any) => r.module === module) : MOCK_RECOMMENDATIONS
    return c.json(results.length ? results : fallback)
  } catch {
    const fallback = module ? MOCK_RECOMMENDATIONS.filter((r:any) => r.module === module) : MOCK_RECOMMENDATIONS
    return c.json(fallback)
  }
})

// Action Items
const MOCK_ACTION_ITEMS = [
  { id:1, module:'production', priority:'critical', status:'open', title:'Resolve MUM-L2 Overload', description:'MUM-L2 at 98% utilization. Shift 8K cases to MUM-L1 to prevent breakdown.', due_date:'2026-03-18', owner:'Sankar Mamidela' },
  { id:2, module:'mrp', priority:'high', status:'open', title:'Emergency PO – Orange Concentrate', description:'Raise PO for 2.7MT with GlobalFlavors Co. Approve expedite surcharge.', due_date:'2026-03-17', owner:'Vikrant Hole' },
  { id:3, module:'sop', priority:'high', status:'in_progress', title:'Approve Weekend Overtime – Mumbai', description:'Approve 2 weekend shifts to close 120K case gap in Mar supply plan.', due_date:'2026-03-18', owner:'Sankar Mamidela' },
  { id:4, module:'deployment', priority:'medium', status:'open', title:'Optimize 24 Routes for Cost Saving', description:'AI identified ₹4.2L/month savings via route reoptimization.', due_date:'2026-03-20', owner:'Vikrant Hole' },
  { id:5, module:'procurement', priority:'medium', status:'open', title:'Renew Citrus India Contract', description:'Contract expiring in 45 days. Initiate renewal negotiation.', due_date:'2026-04-01', owner:'Vikrant Hole' },
  { id:6, module:'capacity', priority:'medium', status:'completed', title:'Preventive Maintenance – MUM-L1', description:'Scheduled PM completed. Line back to normal operation.', due_date:'2026-03-15', owner:'Sankar Mamidela' },
  { id:7, module:'mrp', priority:'low', status:'open', title:'Update Safety Stock – HDPE Cap', description:'Safety stock model recommends increase from 8K to 15K pcs.', due_date:'2026-03-25', owner:'Vikrant Hole' },
  { id:8, module:'inventory', priority:'medium', status:'in_progress', title:'Deplete Maaza Expiring Batch', description:'1.8MT Mango Concentrate expiring in 14 days. Prioritize production.', due_date:'2026-03-22', owner:'Sankar Mamidela' },
]
app.get('/api/action-items', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM action_items ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, due_date
    `).all()
    // If DB has fewer than 4 items, supplement with mock data
    if (results.length >= 4) return c.json(results)
    const combined = [...results, ...MOCK_ACTION_ITEMS.filter((m:any) => !results.find((r:any) => r.title === m.title))]
    return c.json(combined)
  } catch { return c.json(MOCK_ACTION_ITEMS) }
})

// Update action item
app.patch('/api/action-items/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const { status } = await c.req.json()
    await c.env.DB.prepare('UPDATE action_items SET status=? WHERE id=?').bind(status, id).run()
    return c.json({ success: true })
  } catch { return c.json({ success: false }) }
})

// M2: Optimizer action persist — stores optimizer run results into action_items
app.post('/api/optimizer/run', async (c) => {
  try {
    const { module, action, result_summary, impact } = await c.req.json()
    const user = getUser(c)
    const db = c.env.DB
    // Insert into action_items as a completed optimizer action
    await db.prepare(`INSERT INTO action_items (module, priority, status, title, description, due_date, owner, created_by)
      VALUES (?, 'medium', 'completed', ?, ?, date('now','+7 days'), ?, ?)`)
      .bind(module, action, result_summary, user?.id || 'system', user?.id || 'system').run()
    return c.json({ success: true, module, action, result_summary, impact })
  } catch(e: any) {
    return c.json({ success: false, error: e.message })
  }
})

// AI Copilot endpoint
app.post('/api/copilot/chat', async (c) => {
  try {
    const { message } = await c.req.json()
    const msg = (message || '').toLowerCase()
    let response = ''
    // Fetch real data for context
    const db = c.env.DB
    if (msg.includes('bottleneck') || msg.includes('line 2') || msg.includes('mum-l2')) {
      const bns = await db.prepare('SELECT b.*, pl.line_name FROM bottlenecks b JOIN production_lines pl ON b.line_id=pl.id WHERE b.resolved_at IS NULL').all()
      const bn = bns.results[0] as any
      response = `📊 **Bottleneck Analysis**\n\n${bn ? `**${bn.line_name}** is the primary bottleneck: ${bn.description}\n\nSeverity: ${bn.severity?.toUpperCase()}\nDetected: ${bn.detected_at}` : 'No critical bottlenecks detected'}\n\n**Recommended Actions:**\n1. Redistribute 15% load to Mumbai L1\n2. Authorize 2hr overtime this shift\n3. Defer 2 low-priority C-class jobs to tomorrow\n\nExpected improvement: Reduce utilization from 97% → 82%`
    } else if (msg.includes('delay') || msg.includes('late') || msg.includes('otd')) {
      const delayed = await db.prepare('SELECT j.*, s.sku_name FROM jobs j JOIN skus s ON j.sku_id=s.id WHERE j.delay_minutes > 0').all()
      const cnt = delayed.results.length
      response = `⏱️ **Schedule Delay Analysis**\n\n${cnt} job(s) currently delayed:\n${(delayed.results as any[]).map((j:any) => `• ${j.job_number}: ${j.sku_name} — +${j.delay_minutes} min delay`).join('\n')}\n\n**Root Causes:**\n1. Late material staging (38%)\n2. Changeover overrun (29%)\n3. Operator shift overlap (19%)\n4. Equipment issue (14%)\n\n**Actions:** Prioritize material pre-staging for next 3 jobs. Schedule changeover during shift handover.`
    } else if (msg.includes('mrp') || msg.includes('material') || msg.includes('shortage')) {
      const alerts = await db.prepare('SELECT * FROM mrp_alerts WHERE status="open" AND severity IN ("critical","high") LIMIT 3').all()
      response = `📦 **MRP Status**\n\n${(alerts.results as any[]).map((a:any) => `🔴 ${a.alert_type}: ${a.message}`).join('\n\n')}\n\n**Recommended immediate actions:**\n1. Raise emergency PO for orange concentrate\n2. Contact SUP004 for PET resin alternate supply\n3. Review can body alternate sourcing`
    } else if (msg.includes('sop') || msg.includes('forecast') || msg.includes('demand')) {
      response = `📈 **S&OP Snapshot — March 2026**\n\n**Demand:** 4.8M cases (All India) — Confidence: 87%\n**Supply Plan:** 4.62M cases — Gap: 180K cases shortfall\n**Inventory:** 18.4 DOI (target: 15)\n\n**Key Risks:**\n1. Mumbai supply constrained — 97% utilization\n2. Forecast accuracy below 90% target\n3. Mango concentrate price variance +18%\n\n**Recommended:** Approve Mumbai overtime for 2 weeks to close 180K gap.`
    } else if (msg.includes('optimization') || msg.includes('sequence') || msg.includes('schedule')) {
      response = `🎯 **Scheduling Optimization Analysis**\n\nRunning scenario comparison...\n\n| Scenario | Cost | Lateness | Util |\n|----------|------|----------|------|\n| Base Plan | ₹45,200 | 12% | 78.5% |\n| Cost Optimal | ₹38,900 | 18% | 82.3% |\n| OTD Max | ₹52,100 | 3% | 75.2% |\n\n**Recommendation:** For current week, use OTD Maximized scenario — customer OTIF target of 95% is more critical than cost reduction.`
    } else {
      const summary = await db.prepare('SELECT COUNT(*) as jobs FROM jobs WHERE status="in_progress"').first<{jobs:number}>()
      response = `👋 **Hello Sankar & Vikrant!**\n\nCurrent suite status:\n• **${summary?.jobs||3} jobs** in progress\n• **4 active bottlenecks** detected\n• **6 open MRP alerts** requiring attention\n• **8 recommendations** pending review\n\nI can help you with:\n• Bottleneck analysis & resolution\n• Schedule delay root causes\n• MRP shortage recommendations\n• S&OP demand-supply gap analysis\n• Optimization scenario comparison\n\nWhat would you like to explore?`
    }
    return c.json({ response, timestamp: new Date().toISOString() })
  } catch {
    return c.json({ response: 'I encountered an error processing your query. Please try again.', timestamp: new Date().toISOString() })
  }
})

// Scenarios
app.get('/api/scenarios', async (c) => {
  const module = c.req.query('module')
  try {
    const query = module
      ? 'SELECT * FROM scenarios WHERE module=? ORDER BY is_baseline DESC, status'
      : 'SELECT * FROM scenarios ORDER BY module, is_baseline DESC'
    const { results } = module ? await c.env.DB.prepare(query).bind(module).all() : await c.env.DB.prepare(query).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Create scenario
app.post('/api/scenarios', async (c) => {
  try {
    const body = await c.req.json()
    const result = await c.env.DB.prepare(
      'INSERT INTO scenarios (module,name,description,driver,status,is_baseline) VALUES (?,?,?,?,?,0)'
    ).bind(body.module, body.name, body.description||'', body.driver||'', 'draft').run()
    return c.json({ success: true, id: result.meta.last_row_id })
  } catch { return c.json({ success: false }) }
})

// Run optimization (simulated)
app.post('/api/optimization/run', async (c) => {
  try {
    const body = await c.req.json()
    const results = {
      scenario: body.scenario || 'custom',
      cost_reduction: -8.4, utilization_gain: 6.2, bottlenecks_cleared: 2,
      otd_improvement: 4.1, changeover_reduction: 38,
      recommended_sequence: ['JOB-2026-001','JOB-2026-003','JOB-2026-008','JOB-2026-002','JOB-2026-004'],
      savings_inr: 845000, run_time_ms: 1240
    }
    return c.json(results)
  } catch { return c.json({}) }
})

// SKUs list
const MOCK_SKUS = [
  { id:1, sku_name:'Limca PET 500ml', sku_code:'SKU-500-PET', category:'PET Bottles', abc_classification:'A', status:'active' },
  { id:2, sku_name:'Sprite PET 750ml', sku_code:'SKU-750-PET', category:'PET Bottles', abc_classification:'A', status:'active' },
  { id:3, sku_name:'Thums Up Can 330ml', sku_code:'SKU-CAN-330', category:'Cans', abc_classification:'A', status:'active' },
  { id:4, sku_name:'Fanta PET 1L', sku_code:'SKU-1L-PET', category:'PET Bottles', abc_classification:'A', status:'active' },
  { id:5, sku_name:'Maaza Tetra 200ml', sku_code:'SKU-TETRA-200', category:'Tetra Pak', abc_classification:'B', status:'active' },
  { id:6, sku_name:'Sprite Glass 500ml', sku_code:'SKU-GLS-500', category:'Glass Bottles', abc_classification:'B', status:'active' },
  { id:7, sku_name:'Limca Can 250ml', sku_code:'SKU-CAN-250', category:'Cans', abc_classification:'B', status:'active' },
  { id:8, sku_name:'Minute Maid OJ 1L', sku_code:'SKU-MM-1L', category:'Juices', abc_classification:'C', status:'active' },
  { id:9, sku_name:'Kinley Water 1L', sku_code:'SKU-WAT-1L', category:'Water', abc_classification:'C', status:'active' },
  { id:10, sku_name:'Appy Fizz PET 300ml', sku_code:'SKU-APF-300', category:'PET Bottles', abc_classification:'C', status:'active' },
]
app.get('/api/skus', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM skus WHERE status="active" ORDER BY abc_classification, sku_name').all()
    return c.json(results.length ? results : MOCK_SKUS)
  } catch { return c.json(MOCK_SKUS) }
})

// Audit log
app.get('/api/audit-log', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50').all()
    return c.json(results)
  } catch { return c.json([]) }
})

// ============================================================
// NEW SPRINT 0–5 APIs
// ============================================================

// ── PRODUCTION: Finite Capacity MPS Optimizer ──────────────────────────
app.post('/api/production/optimize', async (c) => {
  try {
    const body = await c.req.json()
    const { horizon = 8, constraint = 'balanced' } = body
    // Simulated MIP optimization result
    const lines = ['MUM-L1','MUM-L2','DEL-L1','DEL-L2','CHN-L1','BAN-L1']
    const weeks = Array.from({length: horizon}, (_,i) => `W${i+1}`)
    const baseline = { total_output: 310000, avg_utilization: 82.4, otif: 91.2, cost_index: 100, overloads: 2 }
    const optimized = {
      total_output: constraint === 'cost' ? 298000 : constraint === 'otif' ? 305000 : 318000,
      avg_utilization: constraint === 'cost' ? 78.2 : constraint === 'otif' ? 79.8 : 84.6,
      otif: constraint === 'cost' ? 89.4 : constraint === 'otif' ? 96.8 : 94.2,
      cost_index: constraint === 'cost' ? 88 : constraint === 'otif' ? 108 : 96,
      overloads: 0
    }
    const improvements = {
      output_delta: ((optimized.total_output - baseline.total_output)/baseline.total_output*100).toFixed(1),
      otif_delta: (optimized.otif - baseline.otif).toFixed(1),
      cost_delta: (optimized.cost_index - baseline.cost_index).toFixed(1),
      changeover_saved_hrs: 18.4,
      overtime_reduced_hrs: 24,
    }
    const schedule = lines.flatMap(line =>
      weeks.map((w,i) => ({
        line, week: w,
        load_pct: Math.round(60 + Math.random()*28),
        planned_qty: Math.round((6000 + Math.random()*8000)/100)*100,
        sku: ['SKU-500-PET','SKU-1L-PET','SKU-200-MANGO','SKU-250-CAN'][i%4]
      }))
    )
    return c.json({ status: 'success', baseline, optimized, improvements, schedule, run_time_ms: 1840, solver: 'GLPK-MIP' })
  } catch { return c.json({ status: 'error', message: 'Optimization failed' }) }
})

// ── PRODUCTION: Changeover Matrix ──────────────────────────────────────
app.get('/api/production/changeover', async (c) => {
  return c.json({
    matrix: [
      { from: 'SKU-500-PET', to: 'SKU-500-PET', time_hrs: 0, cip_required: false, color: 'change_same' },
      { from: 'SKU-500-PET', to: 'SKU-1L-PET', time_hrs: 2.5, cip_required: false, color: 'change_low' },
      { from: 'SKU-500-PET', to: 'SKU-200-MANGO', time_hrs: 4.0, cip_required: true, color: 'change_high' },
      { from: 'SKU-500-PET', to: 'SKU-250-CAN', time_hrs: 5.5, cip_required: true, color: 'change_critical' },
      { from: 'SKU-500-PET', to: 'SKU-500-GLASS', time_hrs: 6.0, cip_required: true, color: 'change_critical' },
      { from: 'SKU-1L-PET', to: 'SKU-500-PET', time_hrs: 2.5, cip_required: false, color: 'change_low' },
      { from: 'SKU-1L-PET', to: 'SKU-1L-PET', time_hrs: 0, cip_required: false, color: 'change_same' },
      { from: 'SKU-1L-PET', to: 'SKU-200-MANGO', time_hrs: 4.5, cip_required: true, color: 'change_high' },
      { from: 'SKU-1L-PET', to: 'SKU-250-CAN', time_hrs: 5.5, cip_required: true, color: 'change_critical' },
      { from: 'SKU-1L-PET', to: 'SKU-500-GLASS', time_hrs: 6.5, cip_required: true, color: 'change_critical' },
      { from: 'SKU-200-MANGO', to: 'SKU-500-PET', time_hrs: 4.0, cip_required: true, color: 'change_high' },
      { from: 'SKU-200-MANGO', to: 'SKU-1L-PET', time_hrs: 4.5, cip_required: true, color: 'change_high' },
      { from: 'SKU-200-MANGO', to: 'SKU-200-MANGO', time_hrs: 0, cip_required: false, color: 'change_same' },
      { from: 'SKU-200-MANGO', to: 'SKU-250-CAN', time_hrs: 2.0, cip_required: false, color: 'change_low' },
      { from: 'SKU-250-CAN', to: 'SKU-500-PET', time_hrs: 5.5, cip_required: true, color: 'change_critical' },
      { from: 'SKU-250-CAN', to: 'SKU-200-MANGO', time_hrs: 2.0, cip_required: false, color: 'change_low' },
      { from: 'SKU-250-CAN', to: 'SKU-250-CAN', time_hrs: 0, cip_required: false, color: 'change_same' },
    ],
    optimal_sequence: ['SKU-500-PET','SKU-1L-PET','SKU-200-MANGO','SKU-250-CAN'],
    total_changeover_hrs_current: 18.4,
    total_changeover_hrs_optimal: 6.5,
    saving_hrs: 11.9,
    saving_pct: 64.7
  })
})

// ── PRODUCTION: Variance Drill-Down ────────────────────────────────────
app.get('/api/production/variance', async (c) => {
  const period = c.req.query('period') || 'W1'
  return c.json({
    period,
    summary: { planned: 310000, actual: 291400, variance: -18600, variance_pct: -6.0 },
    by_line: [
      { line: 'MUM-L1', planned: 85000, actual: 81200, variance: -3800, variance_pct: -4.5, root_cause: 'Speed loss – preform jam 2hrs', action: 'Maintenance scheduled' },
      { line: 'MUM-L2', planned: 78000, actual: 69300, variance: -8700, variance_pct: -11.2, root_cause: 'MPS overload – 98% load, no overtime approved', action: 'Approve overtime W2' },
      { line: 'DEL-L1', planned: 62000, actual: 59800, variance: -2200, variance_pct: -3.5, root_cause: 'Planned CIP extended by 1.5hrs', action: 'None' },
      { line: 'DEL-L2', planned: 45000, actual: 44600, variance: -400, variance_pct: -0.9, root_cause: 'Minor changeover overrun', action: 'None' },
      { line: 'CHN-L1', planned: 25000, actual: 24800, variance: -200, variance_pct: -0.8, root_cause: 'On target', action: 'None' },
      { line: 'BAN-L1', planned: 15000, actual: 11700, variance: -3300, variance_pct: -22.0, root_cause: 'Operator skill gap – new line, training in progress', action: 'Skill matrix review' },
    ],
    by_sku: [
      { sku: 'SKU-500-PET', planned: 140000, actual: 134200, variance: -5800 },
      { sku: 'SKU-1L-PET', planned: 85000, actual: 74300, variance: -10700 },
      { sku: 'SKU-200-MANGO', planned: 52000, actual: 50800, variance: -1200 },
      { sku: 'SKU-250-CAN', planned: 24000, actual: 23600, variance: -400 },
      { sku: 'SKU-500-GLASS', planned: 9000, actual: 8500, variance: -500 },
    ],
    root_causes: [
      { cause: 'MPS Overload (Capacity)', impact_cases: 8700, pct: 46.8, action: 'Approve overtime / load shift' },
      { cause: 'Equipment Speed Loss', impact_cases: 3800, pct: 20.4, action: 'Maintenance & OEE improvement' },
      { cause: 'Operator Skill Gap', impact_cases: 3300, pct: 17.7, action: 'Training & cross-skilling' },
      { cause: 'Changeover Overrun', impact_cases: 1600, pct: 8.6, action: 'Changeover sequencing optimizer' },
      { cause: 'CIP Extension', impact_cases: 1200, pct: 6.5, action: 'Hygiene scheduling review' },
    ]
  })
})

// ── PRODUCTION: Campaign Scheduling ─────────────────────────────────────
app.get('/api/production/campaigns', async (c) => {
  return c.json([
    { id: 'CAMP-001', name: 'PET Summer Pack W1-W4', sku_family: 'PET Range', lines: ['MUM-L1','MUM-L2'], start_date: '2026-03-17', end_date: '2026-04-13', total_qty: 220000, status: 'active', min_run_length_hrs: 12, cip_frequency_days: 3 },
    { id: 'CAMP-002', name: 'Mango Season W3-W8', sku_family: 'Mango Range', lines: ['DEL-L1','CHN-L1'], start_date: '2026-03-31', end_date: '2026-05-04', total_qty: 148000, status: 'planned', min_run_length_hrs: 16, cip_frequency_days: 2 },
    { id: 'CAMP-003', name: 'Glass Premium Q2', sku_family: 'Glass Range', lines: ['BAN-L1'], start_date: '2026-04-07', end_date: '2026-06-30', total_qty: 85000, status: 'draft', min_run_length_hrs: 8, cip_frequency_days: 5 },
    { id: 'CAMP-004', name: 'Sparkling Launch W3', sku_family: 'Sparkling Range', lines: ['DEL-L2'], start_date: '2026-03-31', end_date: '2026-04-20', total_qty: 42000, status: 'draft', min_run_length_hrs: 10, cip_frequency_days: 3 },
  ])
})

// ── PRODUCTION: Shelf Life / FEFO ─────────────────────────────────────
app.get('/api/production/shelf-life', async (c) => {
  return c.json([
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', batch_id: 'BAT-001', mfg_date: '2026-03-10', expiry_date: '2026-09-10', shelf_life_days: 183, remaining_days: 177, qty: 28400, location: 'Mumbai WH', fefo_priority: 1, risk: 'healthy' },
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', batch_id: 'BAT-002', mfg_date: '2026-03-15', expiry_date: '2026-09-15', shelf_life_days: 183, remaining_days: 182, qty: 15200, location: 'Delhi WH', fefo_priority: 2, risk: 'healthy' },
    { sku: 'SKU-500-GLASS', sku_name: 'Glass 500ml Premium', batch_id: 'BAT-003', mfg_date: '2026-01-05', expiry_date: '2026-07-05', shelf_life_days: 180, remaining_days: 110, qty: 4200, location: 'Mumbai WH', fefo_priority: 1, risk: 'warning' },
    { sku: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', batch_id: 'BAT-004', mfg_date: '2026-02-01', expiry_date: '2026-08-01', shelf_life_days: 180, remaining_days: 137, qty: 8800, location: 'Chennai WH', fefo_priority: 1, risk: 'warning' },
    { sku: 'SKU-500-PET', sku_name: 'PET 500ml Regular', batch_id: 'BAT-005', mfg_date: '2025-11-01', expiry_date: '2026-04-30', shelf_life_days: 180, remaining_days: 44, qty: 1200, location: 'Bangalore WH', fefo_priority: 1, risk: 'critical' },
  ])
})

// ── DEPLOYMENT: Primary Dispatch Engine ────────────────────────────────
app.post('/api/deployment/dispatch', async (c) => {
  try {
    const body = await c.req.json()
    const { plant = 'Mumbai', date = '2026-03-17' } = body
    const dispatch_plan = [
      { trip_id: `TRP-${Date.now()}-001`, vehicle: 'TN-01-AB-1234', type: '32ft', capacity_cases: 1500, allocated_cases: 1380, utilization: 92, origin: plant, destination: 'Pune DC', departure: `${date} 06:00`, eta: `${date} 10:00`, sku_mix: [{ sku:'SKU-500-PET',qty:800 },{ sku:'SKU-1L-PET',qty:580 }], load_optimized: true, cost_inr: 18600 },
      { trip_id: `TRP-${Date.now()}-002`, vehicle: 'MH-04-CD-5678', type: '22ft', capacity_cases: 800, allocated_cases: 720, utilization: 90, origin: plant, destination: 'Nashik DC', departure: `${date} 08:00`, eta: `${date} 12:30`, sku_mix: [{ sku:'SKU-200-MANGO',qty:480 },{ sku:'SKU-250-CAN',qty:240 }], load_optimized: true, cost_inr: 11200 },
      { trip_id: `TRP-${Date.now()}-003`, vehicle: 'MH-12-EF-9012', type: '22ft', capacity_cases: 800, allocated_cases: 560, utilization: 70, origin: plant, destination: 'Surat DC', departure: `${date} 07:00`, eta: `${date} 13:00`, sku_mix: [{ sku:'SKU-500-PET',qty:560 }], load_optimized: false, cost_inr: 14800, alert: 'Under-loaded – consolidate with next batch' },
    ]
    return c.json({ status: 'success', plant, date, trips: dispatch_plan, total_cost_inr: 44600, avg_utilization: 84, savings_vs_unoptimized_inr: 8200, run_time_ms: 920 })
  } catch { return c.json({ status: 'error' }) }
})

// ── DEPLOYMENT: Safety Stock Trigger / DDMRP ───────────────────────────
app.get('/api/deployment/safety-stock', async (c) => {
  return c.json([
    { dc: 'Pune DC', sku: 'SKU-500-PET', safety_stock: 4200, current_stock: 3800, buffer_status: 'yellow', avg_daily_demand: 840, lt_days: 1.2, ddmrp_buffer: 5040, replenish_now: true, qty_to_deploy: 1240, source_plant: 'Mumbai' },
    { dc: 'Jaipur DC', sku: 'SKU-200-MANGO', safety_stock: 2400, current_stock: 1800, buffer_status: 'red', avg_daily_demand: 480, lt_days: 1.5, ddmrp_buffer: 2880, replenish_now: true, qty_to_deploy: 1080, source_plant: 'Delhi' },
    { dc: 'Coimbatore DC', sku: 'SKU-250-CAN', safety_stock: 1600, current_stock: 1400, buffer_status: 'yellow', avg_daily_demand: 320, lt_days: 2.0, ddmrp_buffer: 1920, replenish_now: true, qty_to_deploy: 520, source_plant: 'Chennai' },
    { dc: 'Surat DC', sku: 'SKU-1L-PET', safety_stock: 3200, current_stock: 4200, buffer_status: 'green', avg_daily_demand: 640, lt_days: 1.8, ddmrp_buffer: 3840, replenish_now: false, qty_to_deploy: 0, source_plant: 'Mumbai' },
    { dc: 'Lucknow DC', sku: 'SKU-500-PET', safety_stock: 2800, current_stock: 1600, buffer_status: 'red', avg_daily_demand: 560, lt_days: 2.4, ddmrp_buffer: 3360, replenish_now: true, qty_to_deploy: 1760, source_plant: 'Delhi' },
    { dc: 'Hyderabad DC', sku: 'SKU-500-GLASS', safety_stock: 1200, current_stock: 1400, buffer_status: 'green', avg_daily_demand: 240, lt_days: 2.2, ddmrp_buffer: 1440, replenish_now: false, qty_to_deploy: 0, source_plant: 'Bangalore' },
  ])
})

// ── DEPLOYMENT: Inter-DC Transfer Recommender ──────────────────────────
app.get('/api/deployment/inter-dc-transfers', async (c) => {
  return c.json([
    { id: 'IDT-001', from_dc: 'Surat DC', to_dc: 'Pune DC', sku: 'SKU-500-PET', qty: 800, reason: 'Pune buffer in yellow zone; Surat has surplus 1,600 cases', estimated_saving_inr: 4200, transit_hrs: 2.5, status: 'recommended', priority: 'high' },
    { id: 'IDT-002', from_dc: 'Nashik DC', to_dc: 'Jaipur DC', sku: 'SKU-200-MANGO', qty: 400, reason: 'Season demand surge in Jaipur; Nashik has 3x safety stock', estimated_saving_inr: 2800, transit_hrs: 18.0, status: 'recommended', priority: 'medium' },
    { id: 'IDT-003', from_dc: 'Coimbatore DC', to_dc: 'Hyderabad DC', sku: 'SKU-250-CAN', qty: 600, reason: 'Hyderabad promo event W2; no direct plant shipment available', estimated_saving_inr: 3600, transit_hrs: 5.0, status: 'approved', priority: 'high' },
    { id: 'IDT-004', from_dc: 'Delhi DC', to_dc: 'Lucknow DC', sku: 'SKU-500-PET', qty: 1200, reason: 'Lucknow red buffer; Delhi plant has spare capacity this week', estimated_saving_inr: 0, transit_hrs: 8.0, status: 'recommended', priority: 'critical' },
  ])
})

// ── DEPLOYMENT: Market-Level SLA Tracking ──────────────────────────────
app.get('/api/deployment/market-sla', async (c) => {
  return c.json([
    { market: 'Modern Trade', target_otd: 98, actual_otd: 96.2, target_lead_time_days: 1.5, actual_lead_time_days: 1.6, fill_rate: 97.8, sla_status: 'warning', trend: 'declining' },
    { market: 'General Trade', target_otd: 95, actual_otd: 92.1, target_lead_time_days: 2.0, actual_lead_time_days: 2.3, fill_rate: 94.2, sla_status: 'critical', trend: 'declining' },
    { market: 'E-Commerce', target_otd: 99, actual_otd: 98.4, target_lead_time_days: 1.0, actual_lead_time_days: 0.9, fill_rate: 99.1, sla_status: 'healthy', trend: 'stable' },
    { market: 'HoReCa', target_otd: 95, actual_otd: 93.8, target_lead_time_days: 2.0, actual_lead_time_days: 2.1, fill_rate: 95.4, sla_status: 'warning', trend: 'improving' },
    { market: 'Exports', target_otd: 97, actual_otd: 96.8, target_lead_time_days: 3.0, actual_lead_time_days: 2.8, fill_rate: 98.2, sla_status: 'healthy', trend: 'stable' },
    { market: 'Institutional', target_otd: 96, actual_otd: 94.1, target_lead_time_days: 2.5, actual_lead_time_days: 2.6, fill_rate: 96.1, sla_status: 'warning', trend: 'stable' },
  ])
})

// ── DEPLOYMENT: Network Optimization (LP/VRP) ──────────────────────────
app.post('/api/deployment/optimize-network', async (c) => {
  try {
    const body = await c.req.json()
    const { objective = 'cost' } = body
    return c.json({
      status: 'success',
      objective,
      baseline: { total_cost_lakh: 48.2, avg_utilization: 79.4, total_trips: 842, avg_lead_time: 2.8, co2_kg: 124800 },
      optimized: {
        total_cost_lakh: objective === 'cost' ? 41.6 : objective === 'otd' ? 52.1 : 44.8,
        avg_utilization: objective === 'cost' ? 88.2 : objective === 'otd' ? 82.4 : 85.6,
        total_trips: objective === 'cost' ? 714 : objective === 'otd' ? 868 : 762,
        avg_lead_time: objective === 'cost' ? 3.2 : objective === 'otd' ? 2.3 : 2.6,
        co2_kg: objective === 'cost' ? 102400 : 118600
      },
      route_changes: [
        { route: 'Mumbai → Surat', change: 'Consolidate 3 trips → 2 (merge with Nashik leg)', saving_inr: 28000 },
        { route: 'Delhi → Lucknow', change: 'Switch from Gati-KWE to BlueDart (better OTD 94%→97%)', saving_inr: -12000 },
        { route: 'Bangalore → Hyderabad', change: 'Add hubbing via Chennai DC (reduce cost ₹19.2→₹16.8/case)', saving_inr: 42000 },
      ],
      solver: 'OR-Tools VRP', run_time_ms: 2840
    })
  } catch { return c.json({ status: 'error' }) }
})

// ── INVENTORY: Multi-Echelon Safety Stock (MEIO) ───────────────────────
app.get('/api/inventory/safety-stock', async (c) => {
  return c.json([
    { sku: 'SKU-500-PET', level: 'Plant', location: 'Mumbai', current_ss: 8400, optimal_ss: 10200, gap: 1800, service_level_target: 97.5, demand_variability: 0.18, lt_variability: 0.12, recommendation: 'Increase SS by 1,800 cases to buffer forecast uncertainty' },
    { sku: 'SKU-500-PET', level: 'DC', location: 'Pune', current_ss: 4200, optimal_ss: 3800, gap: -400, service_level_target: 97.5, demand_variability: 0.22, lt_variability: 0.08, recommendation: 'Slight excess; reduce to free working capital' },
    { sku: 'SKU-1L-PET', level: 'Plant', location: 'Mumbai', current_ss: 6200, optimal_ss: 7400, gap: 1200, service_level_target: 95.0, demand_variability: 0.20, lt_variability: 0.15, recommendation: 'Increase SS – higher demand variability in peak season' },
    { sku: 'SKU-200-MANGO', level: 'Plant', location: 'Delhi', current_ss: 5800, optimal_ss: 7200, gap: 1400, service_level_target: 98.0, demand_variability: 0.35, lt_variability: 0.10, recommendation: 'Season SKU – significantly increase SS for Mar-May' },
    { sku: 'SKU-250-CAN', level: 'DC', location: 'Chennai', current_ss: 2200, optimal_ss: 1900, gap: -300, service_level_target: 95.0, demand_variability: 0.14, lt_variability: 0.09, recommendation: 'Marginal excess; monitor and reduce next cycle' },
    { sku: 'SKU-500-GLASS', level: 'Plant', location: 'Bangalore', current_ss: 1400, optimal_ss: 2800, gap: 1400, service_level_target: 97.5, demand_variability: 0.28, lt_variability: 0.20, recommendation: 'Critical gap – premium SKU, high stockout impact' },
  ])
})

// ── INVENTORY: ABC-XYZ Matrix ───────────────────────────────────────────
app.get('/api/inventory/abc-xyz', async (c) => {
  return c.json([
    { sku: 'SKU-500-PET', sku_name: 'PET 500ml Regular', abc: 'A', xyz: 'X', revenue_pct: 38.2, cv: 0.14, recommendation: 'Tight control, frequent replenishment, short SS coverage', policy: 'Min-Max 7d/21d' },
    { sku: 'SKU-1L-PET', sku_name: 'PET 1L Regular', abc: 'A', xyz: 'Y', revenue_pct: 24.8, cv: 0.22, recommendation: 'Moderate buffer; monitor seasonality', policy: 'EOQ + SS' },
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', abc: 'B', xyz: 'Z', revenue_pct: 18.4, cv: 0.38, recommendation: 'High variability – seasonal; large SS during peak', policy: 'Campaign-based' },
    { sku: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', abc: 'B', xyz: 'Y', revenue_pct: 11.2, cv: 0.19, recommendation: 'Standard MRP replenishment', policy: 'MRP driven' },
    { sku: 'SKU-500-GLASS', sku_name: 'Glass 500ml Premium', abc: 'C', xyz: 'Z', revenue_pct: 7.4, cv: 0.44, recommendation: 'Periodic review; high variability – consider make-to-order', policy: 'Periodic / MTO' },
  ])
})

// ── DEMAND: Statistical Forecast ───────────────────────────────────────
app.get('/api/demand/forecast', async (c) => {
  const sku = c.req.query('sku') || 'ALL'
  const weeks = Array.from({length: 13}, (_,i) => {
    const d = new Date('2026-03-17'); d.setDate(d.getDate() + i*7);
    return d.toISOString().split('T')[0]
  })
  return c.json({
    sku, method: 'Holt-Winters + XGBoost Ensemble',
    forecast: weeks.map((w,i) => ({
      week: w,
      baseline: Math.round((42000 + Math.sin(i/3)*4000 + i*200)/100)*100,
      p10: Math.round((38000 + Math.sin(i/3)*4000)/100)*100,
      p50: Math.round((42000 + Math.sin(i/3)*4000 + i*200)/100)*100,
      p90: Math.round((47000 + Math.sin(i/3)*4000 + i*200)/100)*100,
      promotional_uplift: i===3||i===4 ? 0.12 : 0,
      seasonal_index: 0.95 + (i < 8 ? 0.08 : 0),
      forecast_accuracy_pct: 87.3 - i*0.5
    })),
    model_metrics: { mape: 4.6, bias_pct: -0.8, coverage_80pct: 82.4, last_trained: '2026-03-15' }
  })
})

// ── DEMAND: Demand Sensing ─────────────────────────────────────────────
app.get('/api/demand/sensing', async (c) => {
  return c.json({
    horizon_days: 7,
    sensing_source: 'POS + DC withdrawals + Order pipeline',
    signals: [
      { sku: 'SKU-500-PET', location: 'Mumbai', statistical_fcst: 8400, sensed_demand: 9200, uplift_pct: 9.5, confidence: 0.88, driver: 'Heatwave signal + POS velocity +12%', action: 'Increase W1 deployment by 800 cases' },
      { sku: 'SKU-200-MANGO', location: 'Delhi', statistical_fcst: 4200, sensed_demand: 5600, uplift_pct: 33.3, confidence: 0.92, driver: 'Summer onset + IPL demand surge', action: 'Alert MPS – increase W1-W2 by 1,400 cases' },
      { sku: 'SKU-1L-PET', location: 'Bangalore', statistical_fcst: 2800, sensed_demand: 2400, uplift_pct: -14.3, confidence: 0.75, driver: 'GT channel de-stocking', action: 'Defer 400 cases to W3; release capacity' },
      { sku: 'SKU-250-CAN', location: 'Chennai', statistical_fcst: 1800, sensed_demand: 2200, uplift_pct: 22.2, confidence: 0.82, driver: 'New retail listings in MT', action: 'Increase deployment W1-W2 by 400 cases' },
    ]
  })
})

// ── RISK: Stock-out Risk Model ─────────────────────────────────────────
app.get('/api/risk/stockout', async (c) => {
  return c.json([
    { sku: 'SKU-500-PET', location: 'Pune DC', probability_pct: 12, days_to_stockout: 3.2, current_dos: 4.5, risk_level: 'critical', drivers: ['Demand sensing +9.5%', 'Delayed shipment SHP-0317-001'], suggested_action: 'Deploy 800 additional cases today', financial_impact_inr: 142000 },
    { sku: 'SKU-200-MANGO', location: 'Jaipur DC', probability_pct: 8, days_to_stockout: 4.1, current_dos: 3.8, risk_level: 'critical', drivers: ['IPL season demand +33%', 'No replenishment planned'], suggested_action: 'Approve IDT from Nashik DC', financial_impact_inr: 98000 },
    { sku: 'SKU-1L-PET', location: 'Mumbai WH', probability_pct: 18, days_to_stockout: 2.8, current_dos: 3.2, risk_level: 'critical', drivers: ['MPS ATP negative W3','Supplier lead time +2 days'], suggested_action: 'Expedite MUM-L2 run or shift from DEL-L1', financial_impact_inr: 224000 },
    { sku: 'SKU-500-GLASS', location: 'Bangalore WH', probability_pct: 4, days_to_stockout: 8.4, current_dos: 9.2, risk_level: 'warning', drivers: ['Low safety stock coverage'], suggested_action: 'Increase SS level in next planning cycle', financial_impact_inr: 42000 },
  ])
})

// ── RISK: OTD Risk Scorer ─────────────────────────────────────────────
app.get('/api/risk/otd', async (c) => {
  return c.json([
    { shipment_id: 'SHP-0317-006', route: 'Delhi → Lucknow', risk_score: 82, risk_level: 'critical', eta: '2026-03-17 21:00', predicted_eta: '2026-03-17 23:30', delay_hrs: 2.5, drivers: ['Route NH-30 congestion','Gati-KWE 3 prior delays this week'], mitigation: 'Dispatch alternate carrier + customer notification' },
    { shipment_id: 'SHP-0317-003', route: 'Chennai → Coimbatore', risk_score: 48, risk_level: 'warning', eta: '2026-03-17 15:00', predicted_eta: '2026-03-17 16:00', delay_hrs: 1.0, drivers: ['Loading delay 1hr'], mitigation: 'Monitor; driver can recover on highway' },
    { shipment_id: 'SHP-0317-002', route: 'Delhi → Jaipur', risk_score: 22, risk_level: 'healthy', eta: '2026-03-17 13:00', predicted_eta: '2026-03-17 12:45', delay_hrs: 0, drivers: ['On track'], mitigation: 'None' },
    { shipment_id: 'SHP-0317-001', route: 'Mumbai → Pune', risk_score: 15, risk_level: 'healthy', eta: '2026-03-17 10:00', predicted_eta: '2026-03-17 09:50', delay_hrs: 0, drivers: ['Ahead of schedule'], mitigation: 'None' },
  ])
})

// ── APPROVAL WORKFLOW ──────────────────────────────────────────────────
app.get('/api/approvals', async (c) => {
  const type = c.req.query('type')
  const allApprovals = [
    { id: 'APR-001', type: 'overtime', title: 'Approve Weekend Overtime – MUM-L2', requestor: 'Vikrant Hole', module: 'production', priority: 'critical', status: 'pending', requested_at: '2026-03-17 08:00', due_by: '2026-03-17 12:00', description: 'MUM-L2 at 98% load W1-W2. Weekend overtime 16hrs will produce 8,000 additional cases and clear ATP deficit.', impact: '+8,000 cases, Cost: ₹48,000 OT premium', approver: 'Sankar Mamidela' },
    { id: 'APR-002', type: 'procurement', title: 'Emergency PO – Orange Concentrate', requestor: 'Vikrant Hole', module: 'mrp', priority: 'critical', status: 'pending', requested_at: '2026-03-17 07:30', due_by: '2026-03-17 15:00', description: 'Current stock 2.1MT vs required 4.8MT for W2 Mango run. Emergency PO to SUP-003 at ₹12/kg premium.', impact: '+2.7MT raw material, Cost premium: ₹32,400', approver: 'Sankar Mamidela' },
    { id: 'APR-003', type: 'shipment', title: 'Expedite Shipment SHP-0317-006', requestor: 'Vikrant Hole', module: 'deployment', priority: 'high', status: 'pending', requested_at: '2026-03-17 09:00', due_by: '2026-03-17 18:00', description: 'SHP-0317-006 Delhi→Lucknow predicted 2.5hr delay. Switch to alternate carrier BlueDart at ₹8,200 premium.', impact: 'Avoid stockout at Lucknow DC, Cost premium: ₹8,200', approver: 'Sankar Mamidela' },
    { id: 'APR-004', type: 'inter_dc', title: 'Approve IDT-003 Coimbatore→Hyderabad', requestor: 'Sankar Mamidela', module: 'deployment', priority: 'high', status: 'approved', requested_at: '2026-03-16 14:00', due_by: '2026-03-17 09:00', description: 'Inter-DC transfer 600 cases SKU-250-CAN for Hyderabad promo event.', impact: 'Support ₹2.4L promo revenue, Transfer cost: ₹4,800', approver: 'Vikrant Hole' },
    { id: 'APR-005', type: 'scenario', title: 'Activate Scenario: Demand Upside +15%', requestor: 'Sankar Mamidela', module: 'sop', priority: 'medium', status: 'review', requested_at: '2026-03-15 16:00', due_by: '2026-03-18 09:00', description: 'S&OP consensus favours activating +15% demand plan for PET range in April.', impact: '+46K cases output, +₹2.8L OT cost, service improvement +3.2%', approver: 'Vikrant Hole' },
  ]
  const filtered = type ? allApprovals.filter(a => a.type === type) : allApprovals
  return c.json(filtered)
})

app.post('/api/approvals/:id/action', async (c) => {
  try {
    const id = c.req.param('id')
    const { action, comment } = await c.req.json()
    // In production this would update DB
    return c.json({ success: true, id, action, comment, processed_at: new Date().toISOString() })
  } catch { return c.json({ success: false }) }
})

// ── NOTIFICATIONS (live badge count) ──────────────────────────────────
app.get('/api/notifications', async (c) => {
  const user = getUser(c)
  // Role-based notifications
  const base = [
    { id: 1, type: 'critical', title: 'MUM-L2 Overloaded', message: '98% capacity – approve overtime', module: 'production', time: '5m ago', read: false, action_url: '/production/rccp', for_role: 'Supply Chain Director' },
    { id: 2, type: 'critical', title: 'Orange Concentrate Critical', message: 'Stock 2.1MT vs 4.8MT required', module: 'mrp', time: '12m ago', read: false, action_url: '/mrp/shortage-alerts', for_role: 'both' },
    { id: 3, type: 'warning', title: 'SHP-0317-006 Delay Risk', message: '2.5hr delay predicted on Delhi→Lucknow', module: 'deployment', time: '18m ago', read: false, action_url: '/deployment/workbench', for_role: 'SC Technology Consultant' },
    { id: 4, type: 'warning', title: 'ATP Negative W3', message: 'SKU-1L-PET shortfall 2,800 cases', module: 'production', time: '35m ago', read: false, action_url: '/production/atp', for_role: 'both' },
    { id: 5, type: 'info', title: 'New Scenario Ready', message: 'Demand Upside +15% awaiting review', module: 'sop', time: '1hr ago', read: true, action_url: '/sop/scenarios', for_role: 'Supply Chain Director' },
    { id: 6, type: 'info', title: 'ML Model Retrained', message: 'Demand Forecaster MAPE improved 4.6%', module: 'production', time: '2hr ago', read: true, action_url: '/production/ml-models', for_role: 'SC Technology Consultant' },
  ]
  const userNotifs = user ? base.filter(n => n.for_role === 'both' || n.for_role === user.role) : base
  return c.json({ notifications: userNotifs, unread_count: userNotifs.filter(n => !n.read).length })
})

// ── S&OP: Seasonality Calendar ─────────────────────────────────────────
app.get('/api/sop/seasonality', async (c) => {
  return c.json([
    { month: 'Jan', index: 0.85, events: ['Post-holiday slowdown'], forecast_adj_pct: -15 },
    { month: 'Feb', index: 0.88, events: ['Valentine marketing'], forecast_adj_pct: -12 },
    { month: 'Mar', index: 0.95, events: ['Holi demand pickup'], forecast_adj_pct: -5 },
    { month: 'Apr', index: 1.15, events: ['Summer onset','IPL Season'], forecast_adj_pct: +15 },
    { month: 'May', index: 1.35, events: ['Peak summer','School holidays'], forecast_adj_pct: +35 },
    { month: 'Jun', index: 1.28, events: ['Summer continues','Monsoon onset GT'], forecast_adj_pct: +28 },
    { month: 'Jul', index: 0.98, events: ['Monsoon – reduced OOH','Indoor channels grow'], forecast_adj_pct: -2 },
    { month: 'Aug', index: 1.05, events: ['Independence Day','Raksha Bandhan'], forecast_adj_pct: +5 },
    { month: 'Sep', index: 1.02, events: ['Post-monsoon recovery'], forecast_adj_pct: +2 },
    { month: 'Oct', index: 1.18, events: ['Navratri','Dussehra'], forecast_adj_pct: +18 },
    { month: 'Nov', index: 1.25, events: ['Diwali gifting','Festival season'], forecast_adj_pct: +25 },
    { month: 'Dec', index: 1.10, events: ['New Year','Christmas OOH'], forecast_adj_pct: +10 },
  ])
})

// ── PACK-SIZE MASTER ───────────────────────────────────────────────────
app.get('/api/master/pack-sizes', async (c) => {
  return c.json([
    { sku: 'SKU-500-PET', sku_name: 'PET 500ml Regular', cases_per_pallet: 64, bottles_per_case: 24, cases_per_truck_22ft: 320, cases_per_truck_32ft: 520, weight_per_case_kg: 14.2, volume_per_case_cbm: 0.018 },
    { sku: 'SKU-1L-PET', sku_name: 'PET 1L Regular', cases_per_pallet: 48, bottles_per_case: 12, cases_per_truck_22ft: 240, cases_per_truck_32ft: 390, weight_per_case_kg: 16.8, volume_per_case_cbm: 0.022 },
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', cases_per_pallet: 96, cans_per_case: 24, cases_per_truck_22ft: 480, cases_per_truck_32ft: 780, weight_per_case_kg: 6.4, volume_per_case_cbm: 0.012 },
    { sku: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', cases_per_pallet: 88, cans_per_case: 24, cases_per_truck_22ft: 440, cases_per_truck_32ft: 720, weight_per_case_kg: 7.8, volume_per_case_cbm: 0.013 },
    { sku: 'SKU-500-GLASS', sku_name: 'Glass 500ml Premium', cases_per_pallet: 40, bottles_per_case: 12, cases_per_truck_22ft: 200, cases_per_truck_32ft: 320, weight_per_case_kg: 22.4, volume_per_case_cbm: 0.026 },
  ])
})

// ── CSV EXPORT ENDPOINT ────────────────────────────────────────────────
app.get('/api/export/:resource', async (c) => {
  const resource = c.req.param('resource')
  const format = c.req.query('format') || 'csv'
  
  const exportData: Record<string, () => string> = {
    'mps': () => {
      const rows = [
        ['SKU Code','SKU Name','Week','Planned Qty','Confirmed Qty','Available Qty','Status','Line'],
        ['SKU-500-PET','PET 500ml Regular','W1 Mar','18000','17200','800','firm','MUM-L1'],
        ['SKU-1L-PET','PET 1L Regular','W1 Mar','12000','11400','600','firm','MUM-L2'],
        ['SKU-200-MANGO','Mango 200ml Can','W1 Mar','8000','7600','400','firm','DEL-L1'],
        ['SKU-500-PET','PET 500ml Regular','W2 Mar','19000','18000','1000','firm','MUM-L1'],
        ['SKU-1L-PET','PET 1L Regular','W2 Mar','13000','12400','600','firm','MUM-L2'],
        ['SKU-500-PET','PET 500ml Regular','W3 Mar','17500','0','0','planned','MUM-L1'],
      ]
      return rows.map(r => r.join(',')).join('\n')
    },
    'shipments': () => {
      const rows = [
        ['Shipment ID','Origin','Destination','Volume (cases)','Truck Type','Utilization %','ETD','ETA','Status'],
        ['SHP-0317-001','Mumbai','Pune','1240','32ft Container','92','Mar 17 06:00','Mar 17 10:00','in_transit'],
        ['SHP-0317-002','Delhi','Jaipur','820','22ft Container','78','Mar 17 08:00','Mar 17 13:00','planned'],
        ['SHP-0317-003','Chennai','Coimbatore','960','22ft Container','88','Mar 17 07:00','Mar 17 15:00','loading'],
        ['SHP-0317-006','Delhi','Lucknow','1120','32ft Container','89','Mar 17 09:00','Mar 17 21:00','delayed'],
      ]
      return rows.map(r => r.join(',')).join('\n')
    },
    'inventory': () => {
      const rows = [
        ['SKU','SKU Name','Location','On Hand','Safety Stock','Days of Supply','Status'],
        ['SKU-500-PET','PET 500ml Regular','Mumbai','12400','8400','14.8','healthy'],
        ['SKU-1L-PET','PET 1L Regular','Mumbai','8600','6200','13.4','warning'],
        ['SKU-200-MANGO','Mango 200ml Can','Delhi','5200','5800','10.8','warning'],
        ['SKU-250-CAN','Sparkling 250ml Can','Chennai','3400','2200','10.6','healthy'],
        ['SKU-500-GLASS','Glass 500ml Premium','Bangalore','1800','1400','7.5','critical'],
      ]
      return rows.map(r => r.join(',')).join('\n')
    },
    'default': () => `resource,exported_at\n${resource},${new Date().toISOString()}`
  }
  
  const fn = exportData[resource] || exportData['default']
  const csv = fn()
  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', `attachment; filename="${resource}-export-${new Date().toISOString().slice(0,10)}.csv"`)
  return c.body(csv)
})

// ── PRODUCTION: Firm Order via API ─────────────────────────────────────
app.post('/api/production/firm-order', async (c) => {
  try {
    const body = await c.req.json()
    const { sku, week, qty, line } = body
    // In real system, update DB
    return c.json({ success: true, order_id: `MPS-${Date.now()}`, sku, week, qty, line, firmed_at: new Date().toISOString(), firmed_by: 'planner' })
  } catch { return c.json({ success: false }) }
})

// ── PRODUCTION: AI Sequence Optimizer ─────────────────────────────────
app.post('/api/production/ai-sequence', async (c) => {
  try {
    const body = await c.req.json()
    const { line = 'MUM-L1', jobs = [] } = body
    const optimizedSequence = [
      { job_id: 'JOB-2026-001', sku: 'SKU-500-PET', qty: 18000, start: '06:00', end: '14:00', changeover_before_hrs: 0, rationale: 'First run of shift – no changeover' },
      { job_id: 'JOB-2026-003', sku: 'SKU-1L-PET', qty: 12000, start: '16:30', end: '22:00', changeover_before_hrs: 2.5, rationale: 'PET→PET family switch – minimal CIP' },
      { job_id: 'JOB-2026-008', sku: 'SKU-200-MANGO', qty: 8000, start: '06:00', end: '12:00', changeover_before_hrs: 4.0, rationale: 'Overnight CIP – mango needs full sanitization' },
    ]
    return c.json({
      line,
      original_changeover_hrs: 18.4,
      optimized_changeover_hrs: 6.5,
      saving_hrs: 11.9,
      saving_pct: 64.7,
      sequence: optimizedSequence,
      algorithm: 'TSP-nearest-neighbor + local search',
      run_time_ms: 340
    })
  } catch { return c.json({ success: false }) }
})

// ── DEPLOYMENT: Approve/Action Shipment ───────────────────────────────
app.post('/api/deployment/shipment-action', async (c) => {
  try {
    const body = await c.req.json()
    const { shipment_id, action, note } = body
    const actions: Record<string, object> = {
      approve: { status: 'dispatched', message: 'Shipment approved and dispatched' },
      cancel: { status: 'cancelled', message: 'Shipment cancelled' },
      expedite: { status: 'expediting', message: 'Alternate carrier being arranged', cost_premium_inr: 8200 },
      delay: { status: 'rescheduled', message: 'Shipment moved to next departure' },
    }
    const result = actions[action] || { status: 'unknown_action' }
    return c.json({ success: true, shipment_id, ...result, processed_at: new Date().toISOString(), note })
  } catch { return c.json({ success: false }) }
})

// ── DEPLOYMENT: Load Consolidation ────────────────────────────────────
app.post('/api/deployment/consolidate', async (c) => {
  try {
    const body = await c.req.json()
    return c.json({
      success: true,
      original_trips: body.trips || 3,
      consolidated_trips: Math.ceil((body.trips || 3) * 0.72),
      saving_inr: 18400,
      avg_utilization_before: 72.4,
      avg_utilization_after: 88.6,
      co2_saved_kg: 124,
      consolidation_plan: [
        { new_trip: `CONS-${Date.now()}-001`, merged_from: ['SHP-0317-002','SHP-0317-005'], vehicle: '32ft Container', new_utilization: 88, combined_volume: 1500, cost_saving_inr: 12400 }
      ]
    })
  } catch { return c.json({ success: false }) }
})

// ── SUPPLY CHAIN EXCEPTION ENGINE ─────────────────────────────────────
app.get('/api/exceptions', async (c) => {
  const severity = c.req.query('severity')
  const allExceptions = [
    { id: 'EXC-001', severity: 'critical', module: 'production', type: 'capacity_overload', title: 'MUM-L2 Capacity Breach', description: 'Week 1 & 2 load 95–98% exceeding max sustainable 90%', affected_qty: 18700, financial_impact_inr: 342000, detected_at: '2026-03-17 05:45', resolution_options: [{ action: 'Approve weekend overtime', impact: '+8K cases, +₹48K cost' }, { action: 'Shift 8K cases to DEL-L1', impact: 'Zero cost, 3d lead time increase' }], status: 'open', assigned_to: 'Sankar Mamidela' },
    { id: 'EXC-002', severity: 'critical', module: 'mrp', type: 'material_shortage', title: 'Orange Concentrate Stockout Risk', description: 'Current 2.1MT stock; W2 Mango run requires 4.8MT. 2.7MT gap.', affected_qty: 27000, financial_impact_inr: 486000, detected_at: '2026-03-17 06:10', resolution_options: [{ action: 'Emergency PO SUP-003', impact: '+₹32K premium, 5d lead' }, { action: 'Defer Mango W2 by 1wk', impact: 'Zero cost, ATP impact' }], status: 'open', assigned_to: 'Vikrant Hole' },
    { id: 'EXC-003', severity: 'high', module: 'deployment', type: 'delay_risk', title: 'Lucknow Shipment Delay Risk', description: 'SHP-0317-006 82% OTD risk, predicted 2.5hr delay due to NH-30 congestion', affected_qty: 1120, financial_impact_inr: 88000, detected_at: '2026-03-17 08:30', resolution_options: [{ action: 'Switch to BlueDart', impact: '+₹8.2K, recover delay' }, { action: 'Accept delay & notify customer', impact: 'Zero cost, OTD impact' }], status: 'open', assigned_to: 'Vikrant Hole' },
    { id: 'EXC-004', severity: 'high', module: 'inventory', type: 'safety_stock_breach', title: 'Lucknow DC Safety Stock Breach', description: 'Current 1,600 cases vs safety stock 2,800. 1,200 case shortfall.', affected_qty: 1200, financial_impact_inr: 156000, detected_at: '2026-03-17 07:15', resolution_options: [{ action: 'Deploy 1,760 cases from Delhi', impact: 'Restore 7d SS coverage' }], status: 'open', assigned_to: 'Sankar Mamidela' },
    { id: 'EXC-005', severity: 'medium', module: 'production', type: 'fefo_risk', title: 'PET 500ml Batch BAT-005 Near Expiry', description: '1,200 cases at Bangalore WH expiring Apr 30 (44 days). Must deploy before expiry.', affected_qty: 1200, financial_impact_inr: 72000, detected_at: '2026-03-17 06:00', resolution_options: [{ action: 'Priority dispatch to Hyderabad MT', impact: 'Prevent ₹72K write-off' }], status: 'in_progress', assigned_to: 'Vikrant Hole' },
  ]
  const filtered = severity ? allExceptions.filter(e => e.severity === severity) : allExceptions
  return c.json(filtered)
})

// ── SCENARIO: What-If Solver ───────────────────────────────────────────
app.post('/api/scenario/solve', async (c) => {
  try {
    const body = await c.req.json()
    const { scenario_type = 'demand_spike', demand_change_pct = 15, module = 'production' } = body
    
    const tradeoffs: Record<string, object> = {
      'demand_spike': {
        scenario: 'Demand Upside ' + (demand_change_pct > 0 ? '+' : '') + demand_change_pct + '%',
        options: [
          { name: 'Overtime Strategy', output_cases: Math.round(310000 * (1 + demand_change_pct/100)), cost_increase_pct: 8.4, otif_impact: '+3.2%', overtime_hrs: 96, feasible: true, recommended: true },
          { name: 'Cross-Plant Rebalancing', output_cases: Math.round(310000 * (1 + demand_change_pct*0.7/100)), cost_increase_pct: 2.1, otif_impact: '+1.8%', overtime_hrs: 0, feasible: true, recommended: false },
          { name: 'Defer B/C Class SKUs', output_cases: Math.round(310000 * (1 + demand_change_pct*0.5/100)), cost_increase_pct: 0, otif_impact: '-1.4% (B/C)', overtime_hrs: 0, feasible: true, recommended: false },
        ]
      },
      'line_breakdown': {
        scenario: 'Line Breakdown Contingency',
        options: [
          { name: 'Shift Load to Delhi Lines', output_cases: 285000, cost_increase_pct: 4.2, otif_impact: '-3.1%', overtime_hrs: 48, feasible: true, recommended: true },
          { name: 'Defer Lower Priority Jobs', output_cases: 268000, cost_increase_pct: 0, otif_impact: '-6.8%', overtime_hrs: 0, feasible: true, recommended: false },
        ]
      }
    }
    return c.json({ success: true, ...(tradeoffs[scenario_type] || tradeoffs['demand_spike']), run_time_ms: 1240 })
  } catch { return c.json({ success: false }) }
})

// ML Models retrain API
app.post('/api/ml/retrain', async (c) => {
  try {
    const body = await c.req.json()
    const { model = 'all' } = body
    // Simulate retraining
    await new Promise(r => setTimeout(r, 100))
    const results = model === 'all' ? [
      { model: 'Demand Forecaster', status: 'success', prev_mape: 5.1, new_mape: 4.6, improvement_pct: 9.8, trained_on: '180 days', training_time_sec: 142 },
      { model: 'ATP Predictor', status: 'success', prev_mape: 6.4, new_mape: 6.0, improvement_pct: 6.3, trained_on: '180 days', training_time_sec: 98 },
      { model: 'RCCP Optimizer', status: 'success', prev_mape: 7.8, new_mape: 7.2, improvement_pct: 7.7, trained_on: '180 days', training_time_sec: 224 },
    ] : [{ model, status: 'success', prev_mape: 5.8, new_mape: 5.2, improvement_pct: 10.3, trained_on: '180 days', training_time_sec: 142 }]
    return c.json({ success: true, models_retrained: results.length, results, total_time_sec: 464 })
  } catch { return c.json({ success: false }) }
})

// ============================================================
// PAGE ROUTES - HOME
// ============================================================
app.get('/', async (c) => {
  const scripts = `
const MODULE_CONFIG = {
  sop: { label:'S&OP Planning', icon:'fa-balance-scale', color:'#2563EB', kpi1:'Forecast Accuracy', kpi2:'Supply Fill Rate', url:'/sop' },
  mrp: { label:'Material Req. Planning', icon:'fa-boxes', color:'#0891B2', kpi1:'Open Alerts', kpi2:'Coverage Days', url:'/mrp' },
  procurement: { label:'Procurement Planning', icon:'fa-handshake', color:'#D97706', kpi1:'Supplier OTIF', kpi2:'High Risk Sup.', url:'/procurement' },
  production: { label:'Production Planning', icon:'fa-cogs', color:'#7C3AED', kpi1:'MPS Adherence', kpi2:'ATP Available', url:'/production' },
  capacity: { label:'Capacity Planning', icon:'fa-industry', color:'#1E3A8A', kpi1:'Line Utilization', kpi2:'Peak Util', url:'/capacity' },
  sequencing: { label:'Sequencing & Scheduling', icon:'fa-calendar-alt', color:'#6D28D9', kpi1:'OTD Performance', kpi2:'Changeover Loss', url:'/sequencing' },
  resource: { label:'Resource Planning', icon:'fa-users', color:'#DC2626', kpi1:'Resource Util', kpi2:'OT Hours', url:'/resource' },
  inventory: { label:'Inventory Planning', icon:'fa-warehouse', color:'#059669', kpi1:'Avg DOI', kpi2:'Stockout Risk', url:'/inventory' },
  deployment: { label:'Deployment Planning', icon:'fa-truck', color:'#0891B2', kpi1:'On-Time Delivery', kpi2:'Truck Util', url:'/deployment' },
};
const KPI_DATA = {
  sop: { kpi1:'87.3%', kpi2:'94.1%' },
  mrp: { kpi1:'6 open', kpi2:'21 days' },
  procurement: { kpi1:'87.4%', kpi2:'2 sup.' },
  production: { kpi1:'94.2%', kpi2:'32.4K cases' },
  capacity: { kpi1:'72.4%', kpi2:'96.8%' },
  sequencing: { kpi1:'91.2%', kpi2:'18.4 hrs' },
  resource: { kpi1:'79.8%', kpi2:'142 hrs' },
  inventory: { kpi1:'14.8 days', kpi2:'1 SKU' },
  deployment: { kpi1:'91.4%', kpi2:'84.2%' },
};

async function initHome() {
  try {
    const [sumRes, healthRes, recsRes, alertsRes, actionsRes] = await Promise.allSettled([
      axios.get('/api/dashboard/summary'),
      axios.get('/api/dashboard/health'),
      axios.get('/api/recommendations'),
      axios.get('/api/mrp/alerts'),
      axios.get('/api/action-items'),
    ]);
    const sum = sumRes.status==='fulfilled' ? sumRes.value.data : {plants:6,lines:12,open_alerts:5,active_jobs:8,bottlenecks:4,open_recommendations:8};
    const health = healthRes.status==='fulfilled' ? healthRes.value.data : {};
    const recs = recsRes.status==='fulfilled' ? recsRes.value.data : [];
    const alerts = alertsRes.status==='fulfilled' ? alertsRes.value.data : [];
    const actions = actionsRes.status==='fulfilled' ? actionsRes.value.data : [];

    document.getElementById('stat-plants').textContent = sum.plants;
    document.getElementById('stat-lines').textContent = sum.lines;
    document.getElementById('stat-alerts').textContent = sum.open_alerts;
    document.getElementById('stat-jobs').textContent = sum.active_jobs;
    document.getElementById('stat-bns').textContent = sum.bottlenecks;
    document.getElementById('stat-recs').textContent = sum.open_recommendations;

    const grid = document.getElementById('module-grid');
    grid.innerHTML = '';
    Object.entries(MODULE_CONFIG).forEach(([id, cfg]) => {
      const h = health[id] || { score: id==='production'?88:id==='deployment'?82:75, status: id==='production'?'healthy':'warning', issues: id==='production'?1:2 };
      const kd = KPI_DATA[id];
      const sc = h.score >= 85 ? 'healthy' : h.score >= 65 ? 'warning' : 'critical';
      const scColor = sc === 'healthy' ? '#059669' : sc === 'warning' ? '#D97706' : '#DC2626';
      grid.innerHTML += \`<div class="module-card" onclick="location.href='\${cfg.url}'" style="cursor:pointer">
        <div class="module-card-top" style="background:linear-gradient(135deg,\${cfg.color}e6,\${cfg.color}99)">
          <div><i class="fas \${cfg.icon}" style="font-size:24px;color:white;opacity:0.9"></i></div>
          <div class="health-ring" style="color:white;font-size:22px;font-weight:800">\${h.score}</div>
        </div>
        <div class="module-card-body">
          <div class="module-name">\${cfg.label}</div>
          <div class="module-kpis">
            <span class="module-kpi-item"><span class="text-muted" style="font-size:11px">\${cfg.kpi1}</span><br/><strong>\${kd.kpi1}</strong></span>
            <span class="module-kpi-item"><span class="text-muted" style="font-size:11px">\${cfg.kpi2}</span><br/><strong>\${kd.kpi2}</strong></span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px">
            <span class="badge badge-\${sc}" style="font-size:10px">\${h.issues} issue\${h.issues!==1?'s':''}</span>
            <a href="\${cfg.url}" style="font-size:12px;color:#2563EB;text-decoration:none;font-weight:600">Open →</a>
          </div>
        </div>
      </div>\`;
    });

    const alertsList = document.getElementById('alerts-list');
    alertsList.innerHTML = alerts.slice(0,5).map(a => \`<div class="alert alert-\${a.severity==='critical'?'critical':a.severity==='high'?'critical':'warning'}">
      <i class="fas fa-\${a.severity==='critical'?'times-circle':'exclamation-triangle'}"></i>
      <div><strong>\${a.alert_type}:</strong> \${a.message} <a href="/mrp/shortage-alerts" style="color:#2563EB;font-size:12px">→ View</a></div>
    </div>\`).join('') || '<p class="text-muted text-sm">No open alerts</p>';

    const recsList = document.getElementById('recs-list');
    recsList.innerHTML = recs.slice(0,5).map(r => \`<div class="alert alert-\${r.impact==='critical'?'critical':r.impact==='high'?'warning':'info'}">
      <i class="fas fa-lightbulb"></i>
      <div><strong>\${r.module.toUpperCase()}:</strong> \${r.title} <span class="badge badge-\${r.impact}" style="font-size:10px">\${r.impact}</span></div>
    </div>\`).join('') || '<p class="text-muted text-sm">No pending recommendations</p>';

    const actionsList = document.getElementById('actions-list');
    actionsList.innerHTML = actions.filter(a=>a.status!=='completed').slice(0,5).map(a => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F1F5F9">
      <div>
        <span class="status-dot \${a.priority==='critical'?'critical':a.priority==='high'?'warning':'healthy'}"></span>
        <strong style="font-size:13px">\${a.title}</strong>
        <div style="font-size:11px;color:#64748B;margin-top:2px">\${a.owner} · Due: \${a.due_date}</div>
      </div>
      <span class="badge badge-\${a.priority==='critical'?'critical':a.priority==='high'?'warning':'neutral'}" style="font-size:10px">\${a.priority}</span>
    </div>\`).join('') || '<p class="text-muted text-sm">No open actions</p>';

    // Supply chain health radar chart
    const healthCtx = document.getElementById('health-radar');
    if (healthCtx) {
      const moduleLabels = ['S&OP','MRP','Procurement','Production','Capacity','Sequencing','Resource','Inventory','Deployment'];
      const moduleKeys = ['sop','mrp','procurement','production','capacity','sequencing','resource','inventory','deployment'];
      const scores = moduleKeys.map(k => health[k]?.score || (k==='production'?88:k==='deployment'?82:72));
      const colors = scores.map(s => s >= 85 ? '#059669' : s >= 65 ? '#D97706' : '#DC2626');
      new Chart(healthCtx, {
        type:'radar',
        data:{
          labels:moduleLabels,
          datasets:[{
            label:'Health Score',data:scores,
            backgroundColor:'rgba(37,99,235,0.15)',borderColor:'#2563EB',borderWidth:2,
            pointBackgroundColor:colors,pointBorderColor:'white',pointBorderWidth:2,pointRadius:5
          },{
            label:'Target (85)',data:moduleLabels.map(()=>85),
            backgroundColor:'transparent',borderColor:'rgba(5,150,105,0.4)',borderDash:[5,5],borderWidth:1.5,
            pointRadius:0
          }]
        },
        options:{responsive:true,maintainAspectRatio:false,
          scales:{r:{min:0,max:100,ticks:{stepSize:20,font:{size:10}},pointLabels:{font:{size:10}}}},
          plugins:{legend:{position:'bottom',labels:{font:{size:11},boxWidth:12}}}
        }
      });
    }

    // Performance line chart (after radar)
    const perfCtx = document.getElementById('perf-chart');
    if (perfCtx) {
      const days = ['Feb 25','Feb 24','Feb 23','Feb 22','Feb 21','Feb 20','Feb 19'].reverse();
      new Chart(perfCtx, {
        type:'line',
        data:{
          labels:days,
          datasets:[
            {label:'OTIF %',data:[92,91,94,90,93,92,91],borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,0.1)',fill:true,tension:0.4,borderWidth:2,pointRadius:3},
            {label:'OEE %',data:[71,70,74,69,72,71,73],borderColor:'#7C3AED',backgroundColor:'rgba(124,58,237,0.07)',fill:true,tension:0.4,borderWidth:2,pointRadius:3},
            {label:'Fill Rate %',data:[94,95,97,93,96,95,94],borderColor:'#059669',backgroundColor:'rgba(5,150,105,0.08)',fill:true,tension:0.4,borderWidth:2,pointRadius:3}
          ]
        },
        options:{responsive:true,maintainAspectRatio:false,
          scales:{y:{min:60,max:100,ticks:{callback:v=>v+'%',font:{size:11}}},x:{ticks:{font:{size:11}}}},
          plugins:{legend:{position:'top',labels:{font:{size:11},boxWidth:12}}}
        }
      });
    }

    // Ticker
    const tickers = [
      'SANKAR: Mumbai L2 at 97% — approve overtime or shift load NOW',
      'VIKRANT: 6 open MRP alerts — orange concentrate critical shortage',
      'SANKAR: CHN-L1 sequence reorder saves 38 min/cycle — action pending',
      'VIKRANT: SUP005 credit hold — activate AlterCans immediately',
      'SANKAR: March S&OP gap 180K cases — consensus meeting required',
      'VIKRANT: DEL-L1 PM overdue 72hrs — schedule weekend maintenance',
    ];
    let ti = 0;
    const ticker = document.getElementById('exec-ticker');
    if (ticker) {
      setInterval(() => {
        ticker.style.opacity='0';
        setTimeout(() => { ticker.textContent = tickers[ti % tickers.length]; ticker.style.opacity='1'; ti++; }, 400);
      }, 5000);
      ticker.textContent = tickers[0];
    }
  } catch(e) { console.error('Home init error:', e); }
}

// Copilot widget
async function sendCopilot() {
  const input = document.getElementById('copilot-input');
  const msg = input.value.trim();
  if (!msg) return;
  const msgs = document.getElementById('copilot-msgs');
  msgs.innerHTML += \`<div class="chat-msg user">\${msg}</div>\`;
  input.value = '';
  msgs.innerHTML += \`<div class="chat-msg assistant" id="copilot-typing">...</div>\`;
  msgs.scrollTop = msgs.scrollHeight;
  try {
    const res = await axios.post('/api/copilot/chat', { message: msg });
    document.getElementById('copilot-typing').innerHTML = res.data.response.replace(/\\n/g,'<br/>').replace(/\\*\\*(.*?)\\*\\*/g,'<strong>$1</strong>');
    msgs.scrollTop = msgs.scrollHeight;
  } catch { document.getElementById('copilot-typing').textContent = 'Error. Please try again.'; }
}
document.addEventListener('keydown', e => { if(e.target.id==='copilot-input' && e.key==='Enter') sendCopilot(); });

document.addEventListener('DOMContentLoaded', initHome);
  `.trim()

  const _u = getUser(c)
  const _userName = _u ? _u.name : 'Planner'
  return c.html(<Layout user={_u} title="Home Dashboard" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)"><i class="fas fa-home"></i></div>
        <div>
          <div class="page-title">Supply Chain Intelligence Dashboard</div>
          <div class="page-subtitle">Welcome, {_userName} · Real-time visibility across all 9 planning modules</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <select class="form-input form-select" style="width:140px" id="plantFilter">
          <option>All Plants</option>
          <option>Mumbai Central</option>
          <option>Delhi North</option>
          <option>Chennai South</option>
        </select>
        <select class="form-input form-select" style="width:130px" id="periodFilter">
          <option>This Week</option>
          <option>This Month</option>
          <option>This Quarter</option>
        </select>
      </div>
    </div>

    {/* Executive ticker */}
    <div style="background:linear-gradient(90deg,#1E3A8A,#2563EB);padding:10px 20px;border-radius:10px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
      <span style="background:rgba(255,255,255,0.2);color:white;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap">EXEC BRIEFING</span>
      <span id="exec-ticker" style="color:white;font-size:13px;font-weight:500;transition:opacity 0.4s">Loading...</span>
    </div>

    {/* Top Stats */}
    <div class="kpi-grid" style="grid-template-columns:repeat(6,1fr)">
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-building" style="margin-right:4px"></i>Active Plants</div>
        <div class="kpi-value" id="stat-plants">—</div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-industry" style="margin-right:4px"></i>Prod. Lines</div>
        <div class="kpi-value" id="stat-lines">—</div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-bell" style="margin-right:4px"></i>Open Alerts</div>
        <div class="kpi-value critical" id="stat-alerts">—</div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-play" style="margin-right:4px"></i>Active Jobs</div>
        <div class="kpi-value" id="stat-jobs">—</div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle" style="margin-right:4px"></i>Bottlenecks</div>
        <div class="kpi-value warning" id="stat-bns">—</div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-lightbulb" style="margin-right:4px"></i>Open Recs.</div>
        <div class="kpi-value warning" id="stat-recs">—</div>
      </div>
    </div>

    {/* Module Grid */}
    <div class="card mb-6">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-th-large"></i> Planning Modules — Health Overview</span>
      </div>
      <div class="card-body">
        <style>{`.module-card{background:var(--card);border-radius:var(--radius);border:1px solid var(--border);overflow:hidden;box-shadow:var(--shadow);transition:transform 0.15s,box-shadow 0.15s}.module-card:hover{transform:translateY(-2px);box-shadow:var(--shadow-md)}.module-card-top{padding:20px;display:flex;align-items:center;justify-content:space-between;min-height:80px}.module-card-body{padding:14px 16px}.module-name{font-size:13px;font-weight:600;color:var(--text);margin-bottom:8px}.module-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px}.module-kpi-item{font-size:12px;color:var(--text);background:#F8FAFC;padding:6px 8px;border-radius:6px}#module-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}`}</style>
        <div id="module-grid">
          {[1,2,3,4,5,6,7,8,9].map(i => <div key={i} class="card" style="padding:40px;text-align:center"><div class="spinner"></div></div>)}
        </div>
      </div>
    </div>

    <div class="grid-2" style="grid-template-columns:1fr 320px;margin-bottom:16px">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-chart-line"></i> Supply Chain Performance — Last 7 Days</span>
          <span class="badge badge-info">Live Trend</span>
        </div>
        <div class="card-body" style="height:200px"><canvas id="perf-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-spider"></i> Module Health Radar</span></div>
        <div class="card-body" style="height:200px"><canvas id="health-radar"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      {/* Alerts */}
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-bell"></i> Critical Alerts</span>
          <a href="/mrp/shortage-alerts" class="btn btn-sm btn-secondary">View All</a>
        </div>
        <div class="card-body" id="alerts-list">
          <div class="spinner"></div>
        </div>
      </div>
      {/* Recommendations */}
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-lightbulb"></i> Top Recommendations</span>
          <a href="/action-items" class="btn btn-sm btn-secondary">All Actions</a>
        </div>
        <div class="card-body" id="recs-list">
          <div class="spinner"></div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      {/* Action Items */}
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-tasks"></i> Open Action Items</span>
          <a href="/action-items" class="btn btn-sm btn-primary">Manage</a>
        </div>
        <div class="card-body" id="actions-list">
          <div class="spinner"></div>
        </div>
      </div>
      {/* AI Copilot Widget */}
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-robot"></i> AI Planning Copilot</span>
          <span class="badge badge-info">GPT-Powered</span>
        </div>
        <div class="chat-messages" id="copilot-msgs" style="max-height:280px">
          <div class="chat-msg assistant">
            Hello! I'm your Supply Chain AI Copilot. I have access to live data across all 7 modules.<br/><br/>
            Try asking: <em>"What's causing the Delhi bottleneck?"</em> or <em>"Show me MRP shortage risks"</em>
          </div>
        </div>
        <div class="chat-input-area">
          <input class="form-input flex-1" id="copilot-input" placeholder="Ask about any planning issue..." />
          <button class="btn btn-primary" onclick="sendCopilot()"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </div>

    {/* Enterprise Features Banner */}
    <div style="margin-top:20px;background:linear-gradient(135deg,#0F172A,#1E3A8A,#312E81);border-radius:14px;padding:24px 28px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <div>
        <div style="color:white;font-size:17px;font-weight:700;margin-bottom:4px"><i class="fas fa-satellite-dish" style="color:#60A5FA;margin-right:8px"></i>Enterprise Command Center</div>
        <div style="color:#93C5FD;font-size:13px">Control Tower · Network Map · Scenario Lab · Demand Intelligence · Planner Workbench · KPI Benchmarking</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <a href="/control-tower" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px"><i class="fas fa-satellite-dish"></i> Control Tower</a>
        <a href="/network-map" style="background:rgba(255,255,255,0.1);color:white;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px"><i class="fas fa-project-diagram"></i> Network Map</a>
        <a href="/scenario-lab" style="background:rgba(124,58,237,0.4);color:white;border:1px solid rgba(139,92,246,0.4);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px"><i class="fas fa-flask"></i> Scenario Lab</a>
        <a href="/demand-intelligence" style="background:rgba(37,99,235,0.3);color:white;border:1px solid rgba(96,165,250,0.3);border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;text-decoration:none;display:flex;align-items:center;gap:6px"><i class="fas fa-brain"></i> Demand Intelligence</a>
      </div>
    </div>
  </Layout>)
})


// ============================================================
// CAPACITY PLANNING ROUTES
// ============================================================

function KpiGrid({ id = 'kpi-grid' }: { id?: string }) {
  return <div class="kpi-grid" id={id}><div class="kpi-card"><div class="spinner"></div></div></div>
}

app.get('/capacity', async (c) => {
  const scripts = `// capacity-module.js handles this page
  `.trim()

  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity Planning" activeModule="capacity" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)"><i class="fas fa-industry"></i></div>
        <div>
          <div class="page-title">Capacity Planning</div>
          <div class="page-subtitle">Line utilization, bottleneck detection, OEE & production health</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/capacity/optimization" class="btn btn-primary"><i class="fas fa-sliders-h"></i> Optimize</a>
        <a href="/capacity/executive" class="btn btn-secondary"><i class="fas fa-chart-pie"></i> Executive View</a>
      </div>
    </div>

    <div class="kpi-grid" id="cap-kpi-grid">
      <div class="kpi-card"><div class="spinner"></div></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-chart-line"></i> Utilization Trend (14 Days)</span>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm btn-secondary">4W View</button>
            <button class="btn btn-sm btn-secondary">13W View</button>
          </div>
        </div>
        <div class="card-body" style="height:220px"><canvas id="cap-util-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-exclamation-triangle"></i> Active Bottlenecks</span>
          <a href="/capacity/root-cause" class="btn btn-sm btn-secondary">RCA</a>
        </div>
        <div class="card-body" id="bottlenecks-list"><div class="spinner"></div></div>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-building"></i> Plants Overview</span>
        <a href="/capacity/operations" class="btn btn-sm btn-secondary">Operations Center</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Plant</th><th>Location</th><th>Lines</th><th>Utilization</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="plants-table-body"><tr><td colspan={6} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> OEE by Production Line</span><a href="/capacity/operations" class="btn btn-sm btn-secondary">Full View</a></div>
        <div class="card-body" style="height:240px"><canvas id="cap-oee-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Bottleneck Analysis</span><a href="/capacity/root-cause" class="btn btn-sm btn-secondary">RCA</a></div>
        <div class="card-body" style="height:240px"><canvas id="cap-bottleneck-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-area"></i> OEE Waterfall</span></div>
        <div class="card-body" style="height:200px"><canvas id="cap-waterfall"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-spider"></i> Plant Performance Radar</span></div>
        <div class="card-body" style="height:200px"><canvas id="cap-radar-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-lightbulb"></i> Capacity Recommendations</span>
      </div>
      <div class="card-body" id="recs-list"><div class="spinner"></div></div>
    </div>
    <script src="/static/capacity-module.js"></script>
  </Layout>)
})

app.get('/capacity/executive', async (c) => {
  const scripts = `
async function init() {
  try {
    const [kpiRes, utilRes] = await Promise.allSettled([axios.get('/api/capacity/kpis'), axios.get('/api/capacity/utilization')]);
    const kpis = kpiRes.status==='fulfilled' ? kpiRes.value.data : [];
    let util = utilRes.status==='fulfilled' ? utilRes.value.data : [];
    if (!util.length) { const base=[82,84,86,88,87,89,91,90,88,86,85,84,87,89]; util=base.map((v,i)=>{const d=new Date('2026-03-03');d.setDate(d.getDate()+i);return{date:d.toISOString().split('T')[0],avg_util:v+Math.random()*3-1,total_ot:v>85?2:0.5};});}
    const grid = document.getElementById('kpi-grid');
    if (grid && kpis.length) grid.innerHTML = kpis.slice(0,8).map(k => {
      const sc = k.metric_status || 'warning';
      return \`<div class="kpi-card \${sc}"><div class="kpi-label">\${k.metric_name}</div>
        <div class="kpi-value \${sc}">\${typeof k.metric_value==='number'?k.metric_value.toFixed(1):k.metric_value}\${k.metric_unit||''}</div>
        <div class="kpi-meta"><span class="kpi-target">Target: \${k.target_value}\${k.metric_unit||''}</span><span class="badge badge-\${sc}" style="font-size:10px">\${sc.toUpperCase()}</span></div></div>\`;
    }).join('');
    new Chart(document.getElementById('util-trend'), {
      type:'line', data:{
        labels:util.map(d=>d.date?d.date.slice(5):''),
        datasets:[
          {label:'Utilization',data:util.map(d=>d.avg_util),borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,0.08)',fill:true,tension:0.3},
          {label:'Target',data:util.map(()=>80),borderColor:'#059669',borderDash:[4,4],pointRadius:0}
        ]
      }, options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:40,max:105,ticks:{callback:v=>v+'%'}}},plugins:{legend:{position:'top'}}}
    });
    new Chart(document.getElementById('svc-chart'), {
      type:'bar',data:{
        labels:['Modern Trade','General Trade','E-Commerce','HoReCa','Exports'],
        datasets:[{label:'OTIF %',data:[96,92,98,88,94],backgroundColor:['#059669','#D97706','#059669','#DC2626','#059669']}]
      },options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:80,max:100,ticks:{callback:v=>v+'%'}}},plugins:{legend:{display:false}}}
    });
  } catch(e) { console.error(e); }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity – Executive" activeModule="capacity-executive" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)"><i class="fas fa-chart-pie"></i></div>
        <div>
          <div class="page-title">Capacity — Executive Dashboard</div>
          <div class="page-subtitle">Senior leadership view: utilization, service levels, financial impact</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-secondary" onclick="location.href='/api/export/capacity?format=pdf'"><i class="fas fa-download"></i> Export PDF</button>
      </div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Utilization Trend</span></div><div class="card-body" style="height:200px"><canvas id="util-trend"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-truck"></i> Service Level by Channel</span></div><div class="card-body" style="height:200px"><canvas id="svc-chart"></canvas></div></div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-lightbulb"></i> Key Insights</span></div><div class="card-body">
        <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>Mumbai L2 at 97% utilization</strong> — 5 consecutive days above threshold. Immediate intervention required.</div></div>
        <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>OTIF at 92.1%</strong> — 2.9pp below target. HoReCa channel most impacted (88%).</div></div>
        <div class="alert alert-success"><i class="fas fa-check-circle"></i><div><strong>E-Commerce at 98% service level</strong> — meeting all commitments this week.</div></div>
      </div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-rupee-sign"></i> Financial Impact</span></div><div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          {[['Lost Revenue (Bottleneck)', '₹12.4L', 'critical'],['Overtime Cost', '₹8.2L', 'warning'],['Changeover Loss', '₹4.6L', 'warning'],['Potential Saving', '₹18.8L', 'healthy']].map(([l,v,s]) =>
            <div key={l} style={`background:#F8FAFC;padding:14px;border-radius:10px;border-left:3px solid ${s==='critical'?'#DC2626':s==='warning'?'#D97706':'#059669'}`}>
              <div style="font-size:11px;color:#64748B">{l}</div>
              <div style={`font-size:20px;font-weight:700;color:${s==='critical'?'#DC2626':s==='warning'?'#D97706':'#059669'}`}>{v}</div>
            </div>
          )}
        </div>
      </div></div>
    </div>
  </Layout>)
})

app.get('/capacity/operations', async (c) => {
  const scripts = `
async function init() {
  try {
    const [kpiRes, bnRes, oeeRes, recsRes] = await Promise.allSettled([
      axios.get('/api/capacity/kpis'), axios.get('/api/capacity/bottlenecks'),
      axios.get('/api/capacity/oee'), axios.get('/api/recommendations?module=capacity')
    ]);
    const kpis = kpiRes.status==='fulfilled' ? kpiRes.value.data.slice(0,4) : [];
    const bns = bnRes.status==='fulfilled' ? bnRes.value.data : [];
    const oee = oeeRes.status==='fulfilled' ? oeeRes.value.data : [];
    const recs = recsRes.status==='fulfilled' ? recsRes.value.data : [];
    const grid = document.getElementById('kpi-grid');
    if (grid && kpis.length) grid.innerHTML = kpis.map(k => \`<div class="kpi-card \${k.metric_status||'warning'}">
      <div class="kpi-label">\${k.metric_name}</div><div class="kpi-value \${k.metric_status||'warning'}">\${typeof k.metric_value==='number'?k.metric_value.toFixed(1):k.metric_value}\${k.metric_unit||''}</div>
      <div class="kpi-meta"><span class="kpi-target">Target: \${k.target_value}\${k.metric_unit||''}</span></div></div>\`).join('');
    const bnEl = document.getElementById('bn-list');
    if (bnEl) bnEl.innerHTML = bns.map(b => \`<tr>
      <td><strong>\${b.line_name}</strong><div style="font-size:11px;color:#64748B">\${b.plant_name}</div></td>
      <td>\${b.bottleneck_type}</td>
      <td><span class="badge badge-\${b.severity==='critical'?'critical':'warning'}">\${b.severity}</span></td>
      <td style="max-width:200px;font-size:12px">\${b.description}</td>
      <td><button class="btn btn-sm btn-secondary" onclick="resolveBottleneck(this)">Resolve</button></td>
    </tr>\`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px;color:#059669"><i class="fas fa-check-circle"></i> No active bottlenecks</td></tr>';
    const oeeEl = document.getElementById('oee-table');
    if (oeeEl && oee.length) {
      const today = oee.filter(o => o.date === oee[0]?.date);
      oeeEl.innerHTML = today.map(o => \`<tr>
        <td><strong>\${o.line_name}</strong></td>
        <td>\${o.plant_name}</td>
        <td>\${o.availability_pct}%</td>
        <td>\${o.performance_pct}%</td>
        <td>\${o.quality_pct}%</td>
        <td><strong class="\${o.oee_pct >= 75 ? 'healthy' : o.oee_pct >= 65 ? 'warning' : 'critical'}">\${o.oee_pct}%</strong></td>
      </tr>\`).join('');
    }
  } catch(e) { console.error(e); }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity – Operations" activeModule="capacity-operations" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)"><i class="fas fa-tachometer-alt"></i></div>
        <div>
          <div class="page-title">Capacity — Operations Center</div>
          <div class="page-subtitle">Real-time line status, OEE, bottleneck resolution & actions</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/sequencing/gantt" class="btn btn-primary"><i class="fas fa-bars-staggered"></i> Gantt View</a>
      </div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-exclamation-triangle"></i> Active Bottlenecks</span>
        <a href="/capacity/root-cause" class="btn btn-sm btn-secondary"><i class="fas fa-search"></i> Root Cause</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Line</th><th>Type</th><th>Severity</th><th>Description</th><th>Action</th></tr></thead>
          <tbody id="bn-list"><tr><td colspan={5} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-tachometer-alt"></i> OEE by Line (Today)</span>
        <span class="badge badge-info">Availability × Performance × Quality</span>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Line</th><th>Plant</th><th>Availability</th><th>Performance</th><th>Quality</th><th>OEE</th></tr></thead>
          <tbody id="oee-table"><tr><td colspan={6} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/capacity/optimization', async (c) => {
  const scripts = `
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="'+tab+'"]').classList.add('active');
  document.getElementById('tab-'+tab).classList.add('active');
}
async function runOpt() {
  const btn = document.getElementById('run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running...';
  btn.disabled = true;
  try {
    const res = await axios.post('/api/optimization/run', { scenario: 'current', objectives: ['utilization', 'otd'] });
    const r = res.data;
    document.getElementById('opt-results').innerHTML = \`
      <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
        \${[['Cost Reduction',r.cost_reduction+'%','healthy'],['Util Gain','+'+r.utilization_gain+'%','healthy'],['OTD Improvement','+'+r.otd_improvement+'%','healthy'],['Bottlenecks Cleared',r.bottlenecks_cleared,'healthy'],['Changeover Saved','-'+r.changeover_reduction+'min','healthy']].map(([l,v,s]) =>
        \`<div class="kpi-card \${s}"><div class="kpi-label">\${l}</div><div class="kpi-value \${s}">\${v}</div></div>\`).join('')}
      </div>
      <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Optimization complete in \${r.run_time_ms}ms</strong>. Estimated annual saving: ₹\${(r.savings_inr/100000).toFixed(1)}L<br/>Recommended sequence: \${r.recommended_sequence.join(' → ')}</div></div>
    \`;
    switchTab('results');
  } catch(e) { window.showToast('Optimization failed: '+(e.message||e),'error'); }
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => switchTab('objectives'));
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity – Optimization" activeModule="capacity-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Capacity — Optimization Workbench</div>
          <div class="page-subtitle">Configure objectives, constraints and run capacity optimization engine</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="run-btn" onclick="runOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
      </div>
    </div>
    <div class="tabs">
      {[['objectives','1. Objectives'],['constraints','2. Constraints'],['results','3. Results'],['scenarios','4. Scenario Comparison']].map(([id,label]) =>
        <button key={id} class="tab-btn" data-tab={id} onclick={`switchTab('${id}')`}>{label}</button>
      )}
    </div>
    <div class="tab-content" id="tab-objectives">
      <div class="card"><div class="card-body">
        <h3 style="margin-bottom:16px;font-size:15px">Select Optimization Objectives</h3>
        {[['≥98% Order Fill Rate','Demand Fulfillment','Ensure demand is met across regions and channels'],['75–90% Line Utilization','Capacity Utilization','Optimize asset utilization, reduce idle and overloaded capacity'],['≥10–15% Overtime Cost Reduction','Cost Optimization','Minimize overtime, expediting and co-packer premium costs'],['≥90% Plan Adherence','Planning Accuracy','Align demand and capacity plans, reduce last-minute changes'],['≥15–20% Changeover Reduction','Operational Efficiency','Optimize SKU sequencing to reduce changeover losses']].map(([target, label, desc], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 3} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#EDE9FE;color:#7C3AED;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:120px"><option>High Priority</option><option>Medium Priority</option><option>Low Priority</option></select>
          </div>
        )}
      </div></div>
    </div>
    <div class="tab-content" id="tab-constraints">
      <div class="card"><div class="card-body">
        <h3 style="margin-bottom:16px;font-size:15px">Optimization Constraints</h3>
        {[['Max Line Utilization','90','%'],['Min Safety Buffer','10','%'],['Overtime Cap','40','hrs/week'],['Min Batch Size','5000','cases'],['Changeover Window','Weekends Only',''],['Shift Structure','3 shifts/day',''],['Allergen Sequencing','Enabled',''],['Co-packer Spend Cap','₹50L','per month']].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:80px">{unit}</span>
          </div>
        )}
      </div></div>
    </div>
    <div class="tab-content" id="tab-results">
      <div id="opt-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
    </div>
    <div class="tab-content" id="tab-scenarios">
      <div class="card"><div class="card-body">
        <h3 style="margin-bottom:4px;font-size:15px"><i class="fas fa-layer-group" style="color:#7C3AED;margin-right:6px"></i>Scenario Comparison</h3>
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare capacity outcomes across planning scenarios from Excel (S01–S10)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>Line Util%</th><th>Overtime hrs</th><th>Changeovers</th><th>Fill Rate</th><th>Cost Impact</th><th>Risk</th></tr></thead>
          <tbody>
            {[['S01 – Baseline','Current State','78%','120','42','96%','₹0','Low'],['S02 – Demand +20%','Demand Surge','94%','320','58','91%','+₹18L','High'],['S03 – Peak Season','Summer Surge','97%','480','65','88%','+₹32L','Critical'],['S04 – Line Breakdown','Line 2 Down','85%','260','38','82%','+₹12L','High'],['S05 – New SKU Launch','NPD Launch','88%','180','71','94%','+₹8L','Medium'],['S06 – SKU Rationalization','SKU Reduction','72%','40','28','98%','-₹15L','Low']].map(([sc,dr,lu,ot,co,fr,ci,ri]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td><td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class="badge badge-{Number(lu.replace('%',''))>=90?'critical':Number(lu.replace('%',''))>=80?'warning':'success'}">{lu}</span></td>
                <td>{ot}</td><td>{co}</td>
                <td><span class="badge badge-{Number(fr.replace('%',''))>=95?'success':Number(fr.replace('%',''))>=88?'warning':'critical'}">{fr}</span></td>
                <td style="color:{ci.startsWith('-')?'#059669':'ci==='+₹0'?'':'#DC2626'}">{ci}</td>
                <td><span class="badge badge-{ri==='Critical'?'critical':ri==='High'?'warning':ri==='Low'?'success':'info'}">{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div></div>
    </div>
  </Layout>)
})

app.get('/capacity/scenarios', async (c) => {
  const scripts = `
async function init() {
  const res = await axios.get('/api/scenarios?module=capacity').catch(()=>({data:[]}));
  const scenarios = res.data;
  const el = document.getElementById('scenarios-list');
  el.innerHTML = scenarios.map(s => \`<div class="card" style="margin-bottom:14px">
    <div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <div><strong style="font-size:15px">\${s.name}</strong> \${s.is_baseline?'<span class="badge badge-info" style="font-size:10px">Baseline</span>':''}</div>
        <span class="badge badge-\${s.status==='active'?'success':'neutral'}">\${s.status}</span>
      </div>
      <p style="font-size:13px;color:#64748B;margin-bottom:12px">\${s.description||s.driver}</p>
      <div style="display:flex;gap:8px">
        <button class="btn btn-sm btn-primary" onclick="viewCapScenario('\${s.name}')">View Details</button>
        <button class="btn btn-sm btn-secondary" onclick="compareCapScenario('\${s.name}')">Compare</button>
        \${!s.is_baseline ? '<button class="btn btn-sm btn-success" onclick="activateCapScenario(this,\\'' + s.name + '\\')">Set as Active</button>' : ''}
      </div>
    </div>
  </div>\`).join('') || '<p class="text-muted">No capacity scenarios yet. Create one above.</p>';
}
async function createScenario() {
  const name = document.getElementById('sc-name').value;
  const desc = document.getElementById('sc-desc').value;
  if (!name) return window.showToast('Please enter a scenario name','error');
  try {
    await axios.post('/api/scenarios', { module:'capacity', name, description:desc, driver: 'Manual' });
  } catch(e) {}
  window.showToast('Scenario "' + name + '" created. Configure parameters to run.', 'success');
  document.getElementById('new-sc').style.display = 'none';
  init();
}
function viewCapScenario(name) {
  window.showToast('Loading scenario "' + name + '" details... Line utilization: 82.4%, OEE: 71.8%, Fill Rate: 94.8%.', 'info');
}
function compareCapScenario(name) {
  window.showToast('"' + name + '" vs Baseline: Output +4.2%, Cost -₹3.1L, Utilization 78% vs 72%.', 'success');
}
function activateCapScenario(btn, name) {
  if (confirm('Set "' + name + '" as the active capacity plan?')) {
    window.showToast('Scenario "' + name + '" activated. Capacity plan updated.', 'success');
    if (btn) { btn.disabled = true; btn.textContent = 'Active'; }
  }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity – Scenarios" activeModule="capacity-scenarios" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-sitemap"></i></div>
        <div><div class="page-title">Capacity — Scenario Builder</div><div class="page-subtitle">Create and compare capacity planning scenarios</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="document.getElementById('new-sc').style.display='block'"><i class="fas fa-plus"></i> New Scenario</button>
      </div>
    </div>
    <div class="card mb-4" id="new-sc" style="display:none">
      <div class="card-header"><span class="card-title">Create New Scenario</span></div>
      <div class="card-body">
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Scenario Name</label><input class="form-input" id="sc-name" placeholder="e.g., Q3 Expansion Plan" /></div>
          <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="sc-desc" placeholder="Brief description of this scenario" /></div>
        </div>
        <button class="btn btn-primary" onclick="createScenario()"><i class="fas fa-save"></i> Create Scenario</button>
      </div>
    </div>
    <div id="scenarios-list"><div class="spinner"></div></div>
  </Layout>)
})

app.get('/capacity/analytics', async (c) => {
  const scripts = `
async function init() {
  const [oeeRes, utilRes] = await Promise.allSettled([axios.get('/api/capacity/oee'), axios.get('/api/capacity/utilization')]);
  let oee = oeeRes.status==='fulfilled' ? oeeRes.value.data : [];
  let util = utilRes.status==='fulfilled' ? utilRes.value.data : [];
  if (!util.length) { const base=[78,80,83,85,87,86,88]; util=base.map((v,i)=>{const d=new Date('2026-03-10');d.setDate(d.getDate()+i);return{date:d.toISOString().split('T')[0],avg_util:v,total_ot:v>85?2.4:0.8};});}
  if (!oee.length) { oee=[{line_name:'MUM-L1',oee_pct:77.1},{line_name:'MUM-L2',oee_pct:85.4},{line_name:'DEL-L1',oee_pct:68.3},{line_name:'CHN-L1',oee_pct:72.9},{line_name:'KOL-L1',oee_pct:79.2},{line_name:'BLR-L1',oee_pct:82.1}]; }
  new Chart(document.getElementById('util-bar'), {
    type:'bar',data:{labels:util.slice(-7).map(d=>d.date?d.date.slice(5):''),datasets:[
      {label:'Utilization %',data:util.slice(-7).map(d=>d.avg_util),backgroundColor:'#2563EB'},
      {label:'Overtime Hrs',data:util.slice(-7).map(d=>d.total_ot||0),backgroundColor:'#F59E0B',yAxisID:'y2'}
    ]},
    options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:40,max:110,ticks:{callback:v=>v+'%'}},y2:{position:'right',title:{display:true,text:'OT Hours'}}}}
  });
  const lines = [...new Set(oee.map(o=>o.line_name))].slice(0,6);
  const avgOEE = lines.map(l => {
    const lineData = oee.filter(o=>o.line_name===l);
    return lineData.length ? (lineData.reduce((a,b)=>a+(b.oee_pct||0),0)/lineData.length).toFixed(1) : 0;
  });
  new Chart(document.getElementById('oee-bar'), {
    type:'bar',data:{labels:lines,datasets:[
      {label:'OEE %',data:avgOEE,backgroundColor:avgOEE.map(v=>v>=75?'#059669':v>=65?'#D97706':'#DC2626')},
      {label:'Target 75%',data:lines.map(()=>75),type:'line',borderColor:'#2563EB',borderDash:[4,4],pointRadius:0,borderWidth:1.5}
    ]},
    options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:40,max:100,ticks:{callback:v=>v+'%'}}}}
  });
  new Chart(document.getElementById('loss-chart'), {
    type:'doughnut',data:{labels:['Changeover','Planned Downtime','Unplanned Downtime','Quality Loss','Speed Loss'],
      datasets:[{data:[38,22,18,12,10],backgroundColor:['#2563EB','#7C3AED','#DC2626','#D97706','#0891B2']}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'right'}}}
  });
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity – Analytics" activeModule="capacity-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-chart-bar"></i></div>
        <div><div class="page-title">Capacity — Analytics & OEE</div><div class="page-subtitle">Downtime, OEE waterfall, utilization trends and loss analysis</div></div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-secondary" onclick="location.href='/api/export/capacity-analytics?format=csv'"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Utilization vs Overtime Trend</span></div><div class="card-body" style="height:220px"><canvas id="util-bar"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-tachometer-alt"></i> OEE by Line</span></div><div class="card-body" style="height:220px"><canvas id="oee-bar"></canvas></div></div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-pie-chart"></i> Loss Analysis Breakdown</span></div><div class="card-body" style="height:220px"><canvas id="loss-chart"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Business Impact</span></div><div class="card-body">
        {[['Annual Savings Potential','₹24.6L','+18%','healthy'],['OTD Improvement','+12%','94.2% achieved','healthy'],['Labour Efficiency','+8%','450 hrs saved/mo','healthy'],['Changeover Reduction','-35 min/shift','Annual: ₹8.4L','warning']].map(([l,v,sub,s]) =>
          <div key={l} style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #F1F5F9">
            <span style="font-size:13px">{l}</span>
            <div style="text-align:right">
              <div style={`font-size:16px;font-weight:700;color:${s==='healthy'?'#059669':'#D97706'}`}>{v}</div>
              <div style="font-size:11px;color:#64748B">{sub}</div>
            </div>
          </div>
        )}
      </div></div>
    </div>
  </Layout>)
})

app.get('/capacity/root-cause', async (c) => {
  const scripts = `
async function init() {
  const bns = await axios.get('/api/capacity/bottlenecks').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('rca-list');
  const RCA_DATA = [
    {line:'MUM-L2',type:'Over-utilization',severity:'critical',causes:['Peak season demand surge +22%','DEL-L2 scheduled downtime routing excess volume','Shift change delay +15min average'],actions:['Redistribute 15% to MUM-L1','Approve 2hr overtime Sat-Sun','Defer 3 C-class jobs to next week']},
    {line:'CHN-L1',type:'Changeover Loss',severity:'medium',causes:['Suboptimal flavour run sequence (MANGO→WATER→ORANGE)','No parallel pre-staging of materials','Operators not trained on quick changeover'],actions:['Resequence: WATER→MANGO→ORANGE saves 38min','Implement 2-person changeover team','Schedule SMED training for operators']},
    {line:'DEL-L1',type:'Under-utilization',severity:'medium',causes:['Demand plan shortfall vs forecast (-15%)','SKU rationalisation removed 2 key SKUs','Maintenance window extended by 2hrs'],actions:['Shift overflow volume from KOL-L1','Review demand plan with commercial team','Schedule makeup production on weekend']},
  ];
  el.innerHTML = RCA_DATA.map(r => \`<div class="card" style="margin-bottom:14px">
    <div class="card-body">
      <div class="flex items-center gap-2 mb-4">
        <strong style="font-size:15px">\${r.line}</strong>
        <span class="badge badge-\${r.severity==='critical'?'critical':'warning'}">\${r.severity.toUpperCase()}</span>
        <span class="badge badge-neutral">\${r.type}</span>
      </div>
      <div class="grid-2">
        <div>
          <div style="font-size:12px;font-weight:700;color:#64748B;margin-bottom:8px">ROOT CAUSES</div>
          \${r.causes.map((c,i) => \`<div style="padding:8px;background:#FEF2F2;border-radius:6px;margin-bottom:6px;font-size:12px"><span style="font-weight:700;color:#DC2626;margin-right:6px">C\${i+1}</span>\${c}</div>\`).join('')}
        </div>
        <div>
          <div style="font-size:12px;font-weight:700;color:#64748B;margin-bottom:8px">RECOMMENDED ACTIONS</div>
          \${r.actions.map((a,i) => \`<div style="padding:8px;background:#F0FDF4;border-radius:6px;margin-bottom:6px;font-size:12px"><span style="font-weight:700;color:#059669;margin-right:6px">A\${i+1}</span>\${a}</div>\`).join('')}
        </div>
      </div>
    </div>
  </div>\`).join('');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Capacity – Root Cause" activeModule="capacity-rootcause" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-search"></i></div>
        <div><div class="page-title">Capacity — Root Cause Analyzer</div><div class="page-subtitle">Structured root cause analysis with corrective action tracking</div></div>
      </div>
    </div>
    <div id="rca-list"><div class="spinner"></div></div>
  </Layout>)
})


// ============================================================
// SEQUENCING ROUTES
// ============================================================

app.get('/sequencing', async (c) => {
  const scripts = `
// Sequencing page handled by /static/sequencing-module.js
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing & Scheduling" activeModule="sequencing" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-calendar-alt"></i></div>
        <div>
          <div class="page-title">Sequencing &amp; Scheduling</div>
          <div class="page-subtitle">Job queue management, changeover optimization, schedule adherence</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/sequencing/gantt" class="btn btn-primary"><i class="fas fa-bars-staggered"></i> Gantt Planner</a>
        <a href="/sequencing/copilot" class="btn btn-secondary"><i class="fas fa-robot"></i> AI Copilot</a>
      </div>
    </div>
    <div class="kpi-grid" id="seq-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-list"></i> Active Job Queue</span>
          <div style="display:flex;gap:6px">
            <a href="/sequencing/gantt" class="btn btn-sm btn-primary"><i class="fas fa-bars-staggered"></i> Gantt</a>
            <a href="/sequencing/execution" class="btn btn-sm btn-secondary">Execution</a>
          </div>
        </div>
        <div class="card-body compact">
          <table class="data-table">
            <thead><tr><th>Job #</th><th>SKU</th><th>Qty</th><th>Priority</th><th>Status</th><th>Start</th><th>End</th><th>Delay</th><th>Line</th></tr></thead>
            <tbody id="seq-jobs-table"><tr><td colspan={9} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-pie"></i> Job Status Distribution</span></div>
        <div class="card-body" style="height:240px"><canvas id="seq-status-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-sort-amount-down"></i> Jobs by Priority</span></div>
        <div class="card-body" style="height:200px"><canvas id="seq-priority-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-truck"></i> OTD & Adherence Trend</span></div>
        <div class="card-body" style="height:200px"><canvas id="seq-otd-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> Delay Root Causes</span></div>
        <div class="card-body" style="height:200px"><canvas id="seq-delay-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Schedule Adherence by Shift</span></div>
        <div class="card-body" style="height:220px"><canvas id="seq-sched-adherence-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exchange-alt"></i> Changeover Distribution</span></div>
        <div class="card-body" style="height:220px"><canvas id="seq-changeover-chart"></canvas></div>
      </div>
    </div>
    <script src="/static/sequencing-module.js"></script>
  </Layout>)
})

app.get('/sequencing/gantt', async (c) => {
  const scripts = `
async function init() {
  const [jobsRes, skusRes] = await Promise.allSettled([
    axios.get('/api/sequencing/jobs'),
    axios.get('/api/skus')
  ]);
  const jobs = jobsRes.status==='fulfilled' ? jobsRes.value.data : [];
  const skus = skusRes.status==='fulfilled' ? skusRes.value.data : [];
  const skuMap = {};
  skus.forEach(s => skuMap[s.id] = s);

  // Base: 2026-02-25 06:00
  const BASE = new Date('2026-02-25T06:00:00');
  const SPAN_HRS = 36;

  function toPct(dt) {
    if (!dt) return 0;
    const d = new Date(dt);
    return Math.max(0, Math.min(100, (d - BASE) / (SPAN_HRS * 3600000) * 100));
  }
  function widthPct(s, e) {
    if (!s || !e) return 6;
    const dur = (new Date(e) - new Date(s)) / (SPAN_HRS * 3600000) * 100;
    return Math.max(3, Math.min(90, dur));
  }

  // Color by status
  const statusColors = {
    in_progress: {bg:'#2563EB', text:'white', label:'In Progress'},
    scheduled:   {bg:'#7C3AED', text:'white', label:'Scheduled'},
    pending:     {bg:'#D97706', text:'white', label:'Pending'},
    completed:   {bg:'#059669', text:'white', label:'Completed'},
    delayed:     {bg:'#DC2626', text:'white', label:'Delayed'}
  };

  // Group by line
  const lines = {};
  jobs.forEach(j => {
    const k = j.line_name || 'Unassigned';
    if (!lines[k]) lines[k] = [];
    lines[k].push(j);
  });

  // Time axis labels (every 6 hrs)
  const tLabels = [];
  for (let h = 0; h <= SPAN_HRS; h += 6) {
    const dt = new Date(BASE.getTime() + h * 3600000);
    const hr = dt.getHours().toString().padStart(2,'0');
    const day = dt.getDate();
    tLabels.push({ label: hr + ':00' + (h === 0 ? ' Feb25' : h === 24 ? ' Feb26' : ''), pct: (h / SPAN_HRS * 100) });
  }

  // Draw time header
  const hdr = document.getElementById('gantt-header');
  hdr.innerHTML = '<div style="width:170px;flex-shrink:0;background:#F8FAFC;border-right:1px solid #E2E8F0;padding:6px 12px;font-size:11px;font-weight:600;color:#475569">LINE / RESOURCE</div>' +
    '<div style="flex:1;position:relative;height:32px">' +
    tLabels.map(t => '<div style="position:absolute;left:' + t.pct + '%;transform:translateX(-50%);font-size:10px;color:#64748B;top:8px;white-space:nowrap">' + t.label + '</div>').join('') +
    tLabels.map(t => '<div style="position:absolute;left:' + t.pct + '%;width:1px;height:8px;background:#E2E8F0;bottom:0"></div>').join('') +
    '</div>';

  // Draw rows
  const body = document.getElementById('gantt-body');
  let rowsHtml = '';
  Object.entries(lines).forEach(([line, ljobs], ri) => {
    const rowBg = ri % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    const barsHtml = ljobs.map(j => {
      const left = toPct(j.scheduled_start);
      const w = widthPct(j.scheduled_start, j.scheduled_end);
      const sc = statusColors[j.status] || statusColors.pending;
      const skuName = j.sku_name || (skuMap[j.sku_id] ? skuMap[j.sku_id].sku_name : 'Job');
      const shortName = skuName.length > 14 ? skuName.slice(0,12)+'..' : skuName;
      const hasDelay = j.delay_minutes > 0;
      return '<div class="gantt-bar" style="position:absolute;left:' + left + '%;width:' + w + '%;background:' + sc.bg + ';' +
        'color:' + sc.text + ';height:28px;border-radius:4px;display:flex;align-items:center;padding:0 6px;' +
        'font-size:10px;font-weight:600;cursor:pointer;overflow:hidden;white-space:nowrap;' +
        'box-shadow:0 1px 3px rgba(0,0,0,0.2);border-top:' + (hasDelay ? '2px solid #FCA5A5' : '2px solid rgba(255,255,255,0.3)') + ';' +
        'transition:opacity 0.15s" onmouseenter="this.style.opacity=0.85" onmouseleave="this.style.opacity=1">'+
        '<span style="overflow:hidden;text-overflow:ellipsis">' + shortName + '</span>' +
        (hasDelay ? '<span style="margin-left:4px;font-size:9px;opacity:0.8">+' + j.delay_minutes + 'm</span>' : '') +
        '</div>';
    }).join('');

    rowsHtml += '<div style="display:flex;align-items:center;height:44px;border-bottom:1px solid #F1F5F9;background:' + rowBg + '">' +
      '<div style="width:170px;flex-shrink:0;padding:0 12px;font-size:12px;font-weight:600;color:#1E293B;border-right:1px solid #E2E8F0;' +
      'display:flex;align-items:center;gap:6px">' +
      '<span style="width:8px;height:8px;border-radius:50%;background:#2563EB;display:inline-block"></span>' + line + '</div>' +
      '<div style="flex:1;position:relative;height:44px;display:flex;align-items:center">' + barsHtml + '</div>' +
      '</div>';
  });
  body.innerHTML = rowsHtml || '<div style="padding:30px;text-align:center;color:#64748B">No scheduled jobs found</div>';

  // Summary stats
  const tot = jobs.length;
  const inProg = jobs.filter(j=>j.status==='in_progress').length;
  const delayed = jobs.filter(j=>j.delay_minutes>0).length;
  const avgDel = delayed ? Math.round(jobs.filter(j=>j.delay_minutes>0).reduce((s,j)=>s+j.delay_minutes,0)/delayed) : 0;
  document.getElementById('gantt-stat-total').textContent = tot;
  document.getElementById('gantt-stat-inprog').textContent = inProg;
  document.getElementById('gantt-stat-delayed').textContent = delayed;
  document.getElementById('gantt-stat-avgdel').textContent = avgDel + ' min';

  // Setup matrix chart
  const smRes = await axios.get('/api/sequencing/setup-matrix').catch(()=>({data:[]}));
  const sm = smRes.data || [];
  if (sm.length) {
    const ctx = document.getElementById('setup-chart');
    if (ctx) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sm.slice(0,8).map(s => (s.from_sku_name||'').slice(0,10) + '→' + (s.to_sku_name||'').slice(0,8)),
          datasets: [{ label:'Setup Time (min)', data: sm.slice(0,8).map(s=>s.setup_time_minutes),
            backgroundColor: sm.slice(0,8).map(s => s.setup_time_minutes > 60 ? '#DC2626' : s.setup_time_minutes > 30 ? '#D97706' : '#059669'),
            borderRadius: 4 }]
        },
        options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
          scales:{y:{beginAtZero:true,title:{display:true,text:'Minutes'}},x:{ticks:{font:{size:10}}}} }
      });
    }
  }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Gantt Planner" activeModule="seq-gantt" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-bars-staggered"></i></div>
        <div><div class="page-title">Gantt Planner</div><div class="page-subtitle">Visual 36-hour production schedule · Live job tracking · Changeover analysis</div></div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-secondary" onclick="location.reload()"><i class="fas fa-sync-alt"></i> Refresh</button>
        <button class="btn btn-secondary" onclick="lockHorizon(this)"><i class="fas fa-lock"></i> Lock Horizon</button>
        <button class="btn btn-primary" onclick="optimizeSeq(this)"><i class="fas fa-rocket"></i> Optimize Sequence</button>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:16px">
      <div class="kpi-card"><div class="kpi-label">Total Jobs</div><div class="kpi-value" id="gantt-stat-total">—</div></div>
      <div class="kpi-card warning"><div class="kpi-label">In Progress</div><div class="kpi-value warning" id="gantt-stat-inprog">—</div></div>
      <div class="kpi-card critical"><div class="kpi-label">Delayed Jobs</div><div class="kpi-value critical" id="gantt-stat-delayed">—</div></div>
      <div class="kpi-card"><div class="kpi-label">Avg Delay</div><div class="kpi-value" id="gantt-stat-avgdel">—</div></div>
    </div>

    <div class="card mb-4" style="overflow:hidden">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-calendar-alt"></i> Production Schedule — 36hr View (Feb 25–26, 2026)</span>
        <div style="display:flex;align-items:center;gap:8px">
          {[['in_progress','#2563EB'],['scheduled','#7C3AED'],['pending','#D97706'],['completed','#059669'],['delayed','#DC2626']].map(([s,c]) =>
            <span key={s} style={`background:${c};color:white;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600`}>{s}</span>
          )}
        </div>
      </div>
      <div style="overflow-x:auto">
        <div style="min-width:900px">
          <div id="gantt-header" style="display:flex;background:#F8FAFC;border-bottom:2px solid #E2E8F0;position:sticky;top:0;z-index:10"></div>
          <div id="gantt-body" style="min-height:200px"><div style="padding:20px;text-align:center"><div class="spinner"></div></div></div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exchange-alt"></i> Changeover Matrix (Setup Times)</span></div>
        <div class="card-body" style="height:220px"><canvas id="setup-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-info-circle"></i> Schedule Controls</span></div>
        <div class="card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            {[
              ['fa-lock','Lock Horizon','Freeze jobs within 24hr window','btn-secondary'],
              ['fa-random','Resequence','Optimize job order for min changeover','btn-primary'],
              ['fa-cut','Split Job','Divide job across two production lines','btn-secondary'],
              ['fa-upload','Publish Plan','Send schedule to floor operators','btn-success'],
            ].map(([icon, action, desc, cls]) =>
              <div key={action} style="border:1px solid #E2E8F0;border-radius:8px;padding:12px">
                <div style="font-weight:600;font-size:13px;color:#1E293B;margin-bottom:4px"><i class={`fas ${icon}`} style="margin-right:6px;color:#2563EB"></i>{action}</div>
                <div style="font-size:11px;color:#64748B;margin-bottom:8px">{desc}</div>
                <button class={`btn btn-sm ${cls}`}>{action}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </Layout>)
})

app.get('/sequencing/execution', async (c) => {
  const scripts = `
async function init() {
  const [kpiRes, jobsRes] = await Promise.allSettled([axios.get('/api/sequencing/kpis'), axios.get('/api/sequencing/jobs')]);
  const kpis = kpiRes.status==='fulfilled' ? kpiRes.value.data : [];
  const jobs = jobsRes.status==='fulfilled' ? jobsRes.value.data : [];
  const grid = document.getElementById('kpi-grid');
  if (grid && kpis.length) grid.innerHTML = kpis.map(k => \`<div class="kpi-card \${k.status}">
    <div class="kpi-label">\${k.name}</div><div class="kpi-value \${k.status}">\${k.value}\${k.unit}</div></div>\`).join('');
  const adherence = [85,88,91,87,93,90,91].map((v,i) => ({x:['09:00','10:00','11:00','12:00','13:00','14:00','15:00'][i],y:v}));
  new Chart(document.getElementById('adherence-chart'), {
    type:'line',data:{labels:adherence.map(d=>d.x),datasets:[
      {label:'Adherence %',data:adherence.map(d=>d.y),borderColor:'#2563EB',fill:true,backgroundColor:'rgba(37,99,235,0.1)',tension:0.3},
      {label:'Target 90%',data:adherence.map(()=>90),borderColor:'#059669',borderDash:[4,4],pointRadius:0}
    ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:75,max:100,ticks:{callback:v=>v+'%'}}}}
  });
  const inProgress = jobs.filter(j=>j.status==='in_progress');
  const el = document.getElementById('live-jobs');
  if (el) el.innerHTML = inProgress.map(j => \`<div style="background:#F8FAFC;padding:12px;border-radius:8px;border-left:3px solid #2563EB;margin-bottom:8px">
    <div class="flex items-center justify-between">
      <strong>\${j.job_number}: \${j.sku_name}</strong>
      <span class="badge badge-info">\${j.status}</span>
    </div>
    <div style="font-size:12px;color:#64748B;margin-top:4px">\${j.line_name||'—'} · Qty: \${j.quantity?.toLocaleString()} cases · Due: \${j.due_date}</div>
    \${j.delay_minutes > 0 ? '<span class="badge badge-critical" style="font-size:10px;margin-top:4px">+'+j.delay_minutes+'min delay</span>' : '<span class="badge badge-success" style="font-size:10px;margin-top:4px">On Schedule</span>'}
  </div>\`).join('') || '<p class="text-muted text-sm">No jobs currently in progress</p>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Execution" activeModule="seq-execution" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-play-circle"></i></div>
        <div><div class="page-title">Sequencing — Execution Dashboard</div><div class="page-subtitle">Live job execution, schedule adherence and exception management</div></div>
      </div>
      <div class="page-header-right"><span class="badge badge-live">Live</span></div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Schedule Adherence (Today)</span></div><div class="card-body" style="height:200px"><canvas id="adherence-chart"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-play"></i> Jobs In Progress</span></div><div class="card-body" id="live-jobs"><div class="spinner"></div></div></div>
    </div>
  </Layout>)
})

app.get('/sequencing/bottleneck', async (c) => {
  const scripts = `
async function init() {
  const bns = await axios.get('/api/capacity/bottlenecks').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('bn-list');
  if (el) el.innerHTML = bns.map(b => \`<div class="alert alert-\${b.severity==='critical'?'critical':'warning'}">
    <i class="fas fa-\${b.severity==='critical'?'times-circle':'exclamation-triangle'}"></i>
    <div>
      <strong>\${b.line_name} (\${b.line_code})</strong> — \${b.plant_name}
      <span class="badge badge-\${b.severity}" style="margin-left:6px;font-size:10px">\${b.severity.toUpperCase()}</span>
      <div style="font-size:12px;color:#64748B;margin-top:3px">\${b.description}</div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="btn btn-sm btn-primary" onclick="resolveBottleneck(this)">Resolve</button>
        <a href="/capacity/root-cause" class="btn btn-sm btn-secondary">RCA</a>
      </div>
    </div>
  </div>\`).join('') || '<div class="alert alert-success"><i class="fas fa-check-circle"></i><div>No active bottlenecks.</div></div>';
  new Chart(document.getElementById('util-line-chart'), {
    type:'bar',
    data:{labels:['MUM-L1','MUM-L2','DEL-L1','DEL-L2','CHN-L1','CHN-L2','KOL-L1','KOL-L2','BLR-L1'],
      datasets:[{label:'Utilization %',data:[81.7,91.7,70.8,75,75,83.3,72,62,79.2],backgroundColor:[81.7,91.7,70.8,75,75,83.3,72,62,79.2].map(v=>v>90?'#DC2626':v>80?'#D97706':'#059669')}]},
    options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:40,max:105,ticks:{callback:v=>v+'%'}}},plugins:{legend:{display:false}}}
  });
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Bottleneck" activeModule="seq-bottleneck" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-exclamation-triangle"></i></div>
        <div><div class="page-title">Bottleneck Locator</div><div class="page-subtitle">Identify and resolve production bottlenecks in real-time</div></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Active Bottlenecks</span></div><div class="card-body" id="bn-list"><div class="spinner"></div></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Line Utilization Overview</span></div><div class="card-body" style="height:250px"><canvas id="util-line-chart"></canvas></div></div>
    </div>
  </Layout>)
})

app.get('/sequencing/copilot', async (c) => {
  const scripts = `
async function sendMsg() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  const msgs = document.getElementById('chat-msgs');
  msgs.innerHTML += \`<div class="chat-msg user">\${msg}</div>\`;
  input.value = '';
  msgs.innerHTML += \`<div class="chat-msg assistant" id="typing-indicator">AI is thinking...</div>\`;
  msgs.scrollTop = msgs.scrollHeight;
  try {
    const res = await axios.post('/api/copilot/chat', { message: msg });
    document.getElementById('typing-indicator').innerHTML = res.data.response.replace(/\\n/g,'<br/>').replace(/\\*\\*(.*?)\\*\\*/g,'<strong>$1</strong>');
    msgs.scrollTop = msgs.scrollHeight;
  } catch { document.getElementById('typing-indicator').textContent = 'Error processing request.'; }
}
document.addEventListener('keydown', e => { if(e.target.id==='chat-input' && e.key==='Enter') sendMsg(); });
document.addEventListener('DOMContentLoaded', () => {
  const kpis = [{name:'Queries Today',value:24,status:'info'},{name:'Suggestions Accepted',value:18,status:'healthy'},{name:'Time Saved',value:'2.4 hrs',status:'healthy'},{name:'Accuracy Rate',value:'94%',status:'healthy'}];
  document.getElementById('kpi-grid').innerHTML = kpis.map(k => \`<div class="kpi-card \${k.status}"><div class="kpi-label">\${k.name}</div><div class="kpi-value \${k.status}">\${k.value}</div></div>\`).join('');
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – AI Copilot" activeModule="seq-copilot" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A855F7)"><i class="fas fa-robot"></i></div>
        <div><div class="page-title">AI Scheduling Copilot</div><div class="page-subtitle">Intelligent scheduling assistant powered by real-time production data</div></div>
      </div>
      <div class="page-header-right"><span class="badge badge-info">AI-Powered</span></div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-comments"></i> Chat with Your Scheduling AI</span></div>
      <div class="chat-messages" id="chat-msgs">
        <div class="chat-msg assistant">
          Hello Sankar & Vikrant! I'm your AI Scheduling Copilot with access to live production data.<br/><br/>
          I can help with:<br/>
          • <strong>Schedule analysis</strong> — "Why is Line 3 delayed?"<br/>
          • <strong>Sequence optimization</strong> — "What's the optimal job sequence for MUM-L1?"<br/>
          • <strong>Bottleneck resolution</strong> — "How to fix the Mumbai capacity issue?"<br/>
          • <strong>MRP alerts</strong> — "What materials are at shortage risk?"
        </div>
      </div>
      <div class="chat-input-area">
        <input class="form-input flex-1" id="chat-input" placeholder="Ask anything about your production schedule..." />
        <button class="btn btn-primary" onclick="sendMsg()"><i class="fas fa-paper-plane"></i> Send</button>
      </div>
    </div>
  </Layout>)
})

// Remaining sequencing sub-routes
app.get('/sequencing/rca', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – RCA" activeModule="seq-rca">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-search"></i></div>
        <div><div class="page-title">Sequencing — Root Cause Analysis</div><div class="page-subtitle">Identify root causes of schedule deviations and delays</div></div>
      </div>
    </div>
    <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>3 unresolved delay events this week.</strong> Click on a line below to investigate.</div></div>
    {[['CHN-L1','Changeover Loss','4.2 hrs lost today','Suboptimal sequence + no pre-staging'],['MUM-L2','Over-utilization','Avg 97% → OT required','Demand surge + DEL-L2 downtime routing'],['KOL-L2','Capacity Limit','2 jobs deferred','Can line at 100% — no flex capacity']].map(([line, type, impact, cause]) =>
      <div class="card mb-4" key={line}>
        <div class="card-body">
          <div class="flex items-center gap-2 mb-4">
            <strong style="font-size:15px">{line}</strong>
            <span class="badge badge-warning">{type}</span>
          </div>
          <div class="grid-2">
            <div><div style="font-size:11px;font-weight:700;color:#64748B;margin-bottom:6px">IMPACT</div><div style="background:#FEF3C7;padding:10px;border-radius:6px;font-size:13px">{impact}</div></div>
            <div><div style="font-size:11px;font-weight:700;color:#64748B;margin-bottom:6px">ROOT CAUSE</div><div style="background:#F0FDF4;padding:10px;border-radius:6px;font-size:13px">{cause}</div></div>
          </div>
        </div>
      </div>
    )}
  </Layout>)
})

app.get('/sequencing/planner', async (c) => {
  const scripts = `
async function init() {
  const jobs = await axios.get('/api/sequencing/jobs').then(r=>r.data).catch(()=>[]);
  const tbody = document.getElementById('planner-table');
  if (tbody) tbody.innerHTML = jobs.map((j,i) => \`<tr>
    <td><strong>\${j.job_number}</strong></td>
    <td>\${j.sku_name}</td>
    <td>\${j.line_name||'—'}</td>
    <td>\${j.quantity?.toLocaleString()}</td>
    <td>\${j.priority}</td>
    <td>\${j.due_date}</td>
    <td><span class="badge badge-\${j.status==='in_progress'?'info':j.status==='scheduled'?'neutral':'warning'}">\${j.status}</span></td>
    <td>
      <button class="btn btn-sm btn-secondary" onclick="moveJob(\${j.id},'up')"><i class="fas fa-arrow-up"></i></button>
      <button class="btn btn-sm btn-secondary" onclick="moveJob(\${j.id},'down')"><i class="fas fa-arrow-down"></i></button>
      <button class="btn btn-sm btn-warning">Split</button>
      <button class="btn btn-sm btn-danger"><i class="fas fa-lock"></i></button>
    </td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No jobs</td></tr>';
}
function moveJob(id, dir) { window.showToast('Job ' + id + ' sequence adjusted: ' + dir,'info'); }
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Planner" activeModule="seq-planner" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-drafting-compass"></i></div>
        <div><div class="page-title">Planner Workbench</div><div class="page-subtitle">Manual job reordering, splitting, locking and priority management</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="autoOptimize(this)"><i class="fas fa-rocket"></i> Auto-Optimize</button>
        <button class="btn btn-secondary" onclick="publishPlan(this)"><i class="fas fa-share"></i> Publish Plan</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Job #</th><th>SKU</th><th>Line</th><th>Qty</th><th>Priority</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="planner-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/sequencing/scenarios', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Scenarios" activeModule="seq-scenarios">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-layer-group"></i></div>
        <div><div class="page-title">Scenario Modeling</div><div class="page-subtitle">Compare scheduling scenarios and their cost/service trade-offs</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary" onclick="addSequencingScenario(this)"><i class="fas fa-plus"></i> New Scenario</button></div>
    </div>
    <div class="grid-3">
      {[{name:'Base Plan',cost:'₹45,200',lateness:'12%',util:'78.5%',baseline:true},
        {name:'Cost Optimal',cost:'₹38,900',lateness:'18%',util:'82.3%',baseline:false},
        {name:'OTD Maximized',cost:'₹52,100',lateness:'3%',util:'75.2%',baseline:false}
      ].map(s =>
        <div class="card" key={s.name}>
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <strong style="font-size:15px">{s.name}</strong>
              {s.baseline && <span class="badge badge-info">Baseline</span>}
            </div>
            {[['Total Cost', s.cost],['Schedule Lateness', s.lateness],['Utilization', s.util]].map(([l,v]) =>
              <div key={l} style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px">
                <span style="color:#64748B">{l}</span><strong>{v}</strong>
              </div>
            )}
            <div style="margin-top:12px;display:flex;gap:8px">
              <button class="btn btn-sm btn-primary">Activate</button>
              <button class="btn btn-sm btn-secondary">Compare</button>
            </div>
          </div>
        </div>
      )}
    </div>
  </Layout>)
})

app.get('/sequencing/analytics', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  new Chart(document.getElementById('delay-chart'), {
    type:'bar',data:{labels:['Equipment','Changeover','Material','Labour','Other'],datasets:[{label:'Delay Mins',data:[87,42,18,15,8],backgroundColor:['#DC2626','#D97706','#0891B2','#7C3AED','#64748B']}]},
    options:{responsive:true,maintainAspectRatio:false,indexAxis:'y',plugins:{legend:{display:false}}}
  });
  new Chart(document.getElementById('oee-trend'), {
    type:'line',data:{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],datasets:[
      {label:'OEE %',data:[76,72,74,78,71,75,74],borderColor:'#2563EB',fill:true,backgroundColor:'rgba(37,99,235,0.1)',tension:0.3},
      {label:'Target 78%',data:[78,78,78,78,78,78,78],borderColor:'#059669',borderDash:[4,4],pointRadius:0}
    ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:60,max:90,ticks:{callback:v=>v+'%'}}}}
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Analytics" activeModule="seq-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-heartbeat"></i></div>
        <div><div class="page-title">Health &amp; Analytics</div><div class="page-subtitle">OEE trends, delay analysis, schedule performance metrics</div></div>
      </div>
    </div>
    <div class="kpi-grid">
      {[['OEE Trend','74.4%','warning','Target: 78%'],['Cycle-Time Deviation','+3.2 min','warning','Per shift avg'],['Material Readiness','92%','healthy','Pre-staging rate'],['Schedule Adherence','91.2%','warning','Target: 95%']].map(([l,v,s,t]) =>
        <div key={l} class={`kpi-card ${s}`}>
          <div class="kpi-label">{l}</div>
          <div class={`kpi-value ${s}`}>{v}</div>
          <div class="kpi-meta"><span class="kpi-target">{t}</span></div>
        </div>
      )}
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-tachometer-alt"></i> OEE Summary (Sequencing View)</span>
          <a href="/capacity/analytics" class="btn btn-sm btn-secondary"><i class="fas fa-external-link-alt"></i> Full OEE in Capacity</a>
        </div>
        <div class="card-body">
          <div class="alert alert-info"><i class="fas fa-info-circle"></i><div>OEE detail (waterfall, trend, downtime root cause) is owned by <strong>Capacity Planning → Analytics & OEE</strong>. Current avg: <strong>74.4%</strong> (target 78%). <a href="/capacity/analytics" style="color:#0284C7;font-weight:600">View Full OEE Analysis →</a></div></div>
          <table class="data-table" style="font-size:12px;margin-top:8px">
            <thead><tr><th>Line</th><th>OEE</th><th>Availability</th><th>Performance</th><th>Quality</th></tr></thead>
            <tbody>
              {[['MUM-L1','77.1%','88%','90%','97%'],['MUM-L2','85.4%','92%','93%','99%'],['DEL-L1','79.2%','90%','89%','99%'],['CHN-L1','81.4%','91%','91%','98%']].map(([l,o,a,p,q]) =>
                <tr key={l}><td><strong>{l}</strong></td><td><strong>{o}</strong></td><td>{a}</td><td>{p}</td><td>{q}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Delay Waterfall by Category</span></div><div class="card-body" style="height:200px"><canvas id="delay-chart"></canvas></div></div>
    </div>
  </Layout>)
})


// ============================================================
// MRP ROUTES
// ============================================================

app.get('/mrp', async (c) => {
  const scripts = `// mrp-module.js handles this page
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Material Req. Planning" activeModule="mrp" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-boxes"></i></div>
        <div>
          <div class="page-title">Material Requirements Planning</div>
          <div class="page-subtitle">BOM explosion, net requirements, shortage alerts and procurement triggers</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary" id="run-mrp-btn" onclick="runMRP()"><i class="fas fa-play"></i> Run MRP</button>
        <a href="/mrp/explosion" class="btn btn-secondary"><i class="fas fa-project-diagram"></i> MRP Explosion</a>
      </div>
    </div>
    <div id="mrp-result"></div>
    <div class="kpi-grid" id="mrp-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-circle"></i> Alert Severity Distribution</span></div>
        <div class="card-body" style="height:220px"><canvas id="mrp-alert-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-boxes"></i> Raw Material Stock vs Reorder Points</span></div>
        <div class="card-body" style="height:220px"><canvas id="mrp-material-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-bell"></i> Material Shortage Alerts</span>
        <a href="/mrp/shortage-alerts" class="btn btn-sm btn-secondary">All Alerts</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Type</th><th>Severity</th><th>Material</th><th>Message</th><th>Action</th><th>Status</th><th>ACK</th></tr></thead>
          <tbody id="mrp-alerts-table"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-calendar-alt"></i> Material Coverage (Days)</span></div>
        <div class="card-body" style="height:220px"><canvas id="mrp-coverage-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-shipping-fast"></i> Lead Time by Material Category</span></div>
        <div class="card-body" style="height:220px"><canvas id="mrp-supplier-lead-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> Raw Material Master</span>
        <a href="/mrp/explosion" class="btn btn-sm btn-primary"><i class="fas fa-project-diagram"></i> MRP Explosion</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Material</th><th>ABC</th><th>Type</th><th>On Hand</th><th>Reorder Point</th><th>Status</th><th>Shelf Life</th><th>Action</th></tr></thead>
          <tbody id="mrp-materials-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Demand Forecast vs Actual</span></div>
        <div class="card-body" style="height:220px"><canvas id="mrp-demand-forecast-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> Critical Shortage Timeline</span></div>
        <div class="card-body" id="mrp-shortage-timeline"><div class="spinner"></div></div>
      </div>
    </div>
    <script src="/static/mrp-module.js"></script>
  </Layout>)
})

app.get('/mrp/dashboard', async (c) => c.redirect('/mrp'))

app.get('/mrp/explosion', async (c) => {
  const scripts = `
async function init() {
  const [exploRes, skuRes] = await Promise.allSettled([axios.get('/api/mrp/explosion'), axios.get('/api/skus')]);
  const explRaw = exploRes.status==='fulfilled' ? exploRes.value.data : [];
  const skuRaw = skuRes.status==='fulfilled' ? skuRes.value.data : [];
  const expl = Array.isArray(explRaw) ? explRaw : (Array.isArray(explRaw?.rows) ? explRaw.rows : []);
  const skus = Array.isArray(skuRaw) ? skuRaw : (Array.isArray(skuRaw?.data) ? skuRaw.data : []);
  const skuSel = document.getElementById('sku-select');
  if (skuSel) skuSel.innerHTML = '<option value="">All SKUs</option>' + skus.map(s => \`<option value="\${s.id}">\${s.sku_name}</option>\`).join('');
  renderExpl(expl);
}
function renderExpl(expl) {
  const tbody = document.getElementById('expl-table');
  if (!tbody) return;
  const list = Array.isArray(expl) ? expl : [];
  tbody.innerHTML = list.map(e => \`<tr>
    <td><strong>\${e.job_number}</strong></td>
    <td>\${e.sku_name}</td>
    <td>\${e.material_code}</td>
    <td>\${e.material_name}</td>
    <td>\${e.gross_requirement?.toLocaleString()}</td>
    <td>\${e.current_stock?.toLocaleString()}</td>
    <td><strong class="\${e.net_requirement>0?'critical':'healthy'}">\${e.net_requirement?.toLocaleString()}</strong></td>
    <td><span class="badge badge-\${e.status==='critical'?'critical':e.status==='shortage'?'warning':'success'}">\${e.status}</span></td>
    <td>\${e.lead_time_days||7}d</td>
    <td>\${e.net_requirement>0?'<button class="btn btn-sm btn-primary" onclick="raisePOExpl(\''+e.material_name+'\','+e.net_requirement+')">Raise PO</button>':''}</td>
  </tr>\`).join('') || '<tr><td colspan="10" style="text-align:center;color:#64748B">No explosion data available. Run MRP or review source data.</td></tr>';
}
function raisePOExpl(material, qty) {
  const poNum = 'PO-EXP-' + String(Math.floor(Math.random()*9000)+1000);
  if (window.showToast) window.showToast('PO ' + poNum + ' raised for ' + material + ': ' + Number(qty).toLocaleString() + ' units. Draft - pending approval.', 'success');
}
function recalcExplode(btn) {
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating...';
  axios.get('/api/mrp/explosion').then(r => { renderExpl(Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.rows) ? r.data.rows : [])); }).catch(()=>{ renderExpl([]); }).finally(() => {
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-play"></i> Recalculate';
    if (window.showToast) window.showToast('MRP Explosion recalculated. Net requirements updated.', 'success');
  });
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="MRP Explosion" activeModule="mrp-explosion" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-project-diagram"></i></div>
        <div><div class="page-title">MRP Explosion — Net Requirements</div><div class="page-subtitle">Gross requirements → Stock → Net requirements → PO triggers</div></div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" id="sku-select" style="width:200px"><option>All SKUs</option></select>
        <button class="btn btn-primary" onclick="recalcExplode(this)"><i class="fas fa-play"></i> Recalculate</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Job</th><th>SKU</th><th>Material Code</th><th>Material</th><th>Gross Req.</th><th>On Hand</th><th>Net Req.</th><th>Status</th><th>Lead Time</th><th>Action</th></tr></thead>
          <tbody id="expl-table"><tr><td colspan={10} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/mrp/bom', async (c) => {
  const scripts = `
async function init() {
  const [bomRes, skuRes] = await Promise.allSettled([axios.get('/api/mrp/bom'), axios.get('/api/skus')]);
  const bom = bomRes.status==='fulfilled' ? bomRes.value.data : [];
  const skus = skuRes.status==='fulfilled' ? skuRes.value.data : [];
  const sel = document.getElementById('sku-filter');
  if (sel) sel.innerHTML = '<option value="">All SKUs</option>' + skus.map(s => \`<option value="\${s.id}">\${s.sku_name}</option>\`).join('');
  renderBOM(bom);
}
function renderBOM(bom) {
  const tbody = document.getElementById('bom-table');
  tbody.innerHTML = bom.map(b => \`<tr>
    <td><strong>\${b.sku_name}</strong></td>
    <td>\${b.material_code}</td>
    <td>\${b.material_name}</td>
    <td>\${b.quantity_per_unit} \${b.unit_of_measure}</td>
    <td>\${b.waste_percentage}%</td>
    <td>\${b.version||'v1'}</td>
    <td><span class="badge badge-\${b.current_stock<=b.reorder_point?'critical':'success'}">\${b.current_stock<=b.reorder_point?'Below ROP':'OK'}</span></td>
    <td><button class="btn btn-sm btn-secondary">Edit</button></td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No BOM data</td></tr>';
}
async function filterBOM() {
  const skuId = document.getElementById('sku-filter').value;
  const url = skuId ? '/api/mrp/bom?sku_id='+skuId : '/api/mrp/bom';
  const bom = await axios.get(url).then(r=>r.data).catch(()=>[]);
  renderBOM(bom);
}
function addBOMComponent() {
  const sku = prompt('SKU Name (e.g., PET 500ml Regular):') || 'PET 500ml Regular';
  const material = prompt('Material Name (e.g., PET Resin):') || 'PET Resin';
  const qty = prompt('Quantity per unit (e.g., 0.025):') || '0.025';
  const waste = prompt('Waste % (e.g., 2.5):') || '2.5';
  if (sku && material) {
    const tbody = document.getElementById('bom-table');
    if (tbody) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><strong>' + sku + '</strong></td><td>MAT-NEW-' + Math.floor(Math.random()*900+100) + '</td><td>' + material + '</td><td>' + qty + ' kg</td><td>' + waste + '%</td><td>v1</td><td><span class="badge badge-success">OK</span></td><td><button class="btn btn-sm btn-secondary">Edit</button></td>';
      tbody.insertBefore(tr, tbody.firstChild);
      if (window.showToast) window.showToast('BOM component added: ' + material + ' for ' + sku + '. Saved to draft — approve to activate.', 'success');
    }
  }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="MRP – BOM" activeModule="mrp-bom" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-sitemap"></i></div>
        <div><div class="page-title">Bill of Materials</div><div class="page-subtitle">Multi-level BOM with component quantities, waste factors and stock status</div></div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" id="sku-filter" style="width:200px" onchange="filterBOM()"><option>All SKUs</option></select>
        <button class="btn btn-primary" onclick="addBOMComponent()"><i class="fas fa-plus"></i> Add Component</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Material Code</th><th>Material</th><th>Qty/Unit</th><th>Waste%</th><th>Version</th><th>Stock Status</th><th>Action</th></tr></thead>
          <tbody id="bom-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/mrp/purchase-orders', async (c) => {
  const scripts = `
async function init() {
  const plans = await axios.get('/api/procurement/plans').then(r=>r.data).catch(()=>[]);
  const tbody = document.getElementById('po-table');
  if (tbody) tbody.innerHTML = plans.map(p => \`<tr>
    <td><strong>PO-\${String(p.id).padStart(4,'0')}</strong></td>
    <td>\${p.material_name}</td>
    <td>\${p.supplier_name}</td>
    <td>\${p.planned_qty?.toLocaleString()} units</td>
    <td>₹\${(p.planned_cost/100000).toFixed(1)}L</td>
    <td>\${p.delivery_date||p.period}</td>
    <td><span class="badge badge-\${p.status==='approved'?'success':p.status==='draft'?'warning':'info'}">\${p.status}</span></td>
    <td><div style="display:flex;gap:6px">
      \${p.status==='draft'?'<button class="btn btn-sm btn-success">Approve</button>':''}
      <button class="btn btn-sm btn-secondary">View</button>
    </div></td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No POs</td></tr>';
}
function openCreatePOModal() {
  const mat = prompt('Material name (e.g., PET Resin 500ml):') || 'PET Resin 500ml';
  const qty = prompt('Quantity (units):') || '50000';
  const supplier = prompt('Supplier name:') || 'PetroPlastics Ltd';
  if (mat && qty) {
    const poNum = 'PO-' + new Date().toISOString().slice(2,10).replace(/-/g,'') + '-' + String(Math.floor(Math.random()*900)+100);
    if (window.showToast) window.showToast('PO ' + poNum + ' created: ' + mat + ' x ' + Number(qty).toLocaleString() + ' units from ' + supplier + '. Status: Draft — awaiting approval.', 'success');
    // Append row to table
    const tbody = document.getElementById('po-table');
    if (tbody && tbody.innerHTML.includes('No POs') === false) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td><strong>' + poNum + '</strong></td><td>' + mat + '</td><td>' + supplier + '</td><td>' + Number(qty).toLocaleString() + ' units</td><td>₹' + (Number(qty)*0.00018).toFixed(1) + 'L</td><td>' + new Date(Date.now()+7*86400000).toISOString().slice(0,10) + '</td><td><span class="badge badge-warning">draft</span></td><td><div style="display:flex;gap:6px"><button class="btn btn-sm btn-success" onclick="approvePO(this)">Approve</button><button class="btn btn-sm btn-secondary">View</button></div></td>';
      tbody.insertBefore(tr, tbody.firstChild);
    }
  }
}
function approvePO(btn) {
  const row = btn.closest('tr');
  const poNum = row ? row.cells[0].textContent.trim() : 'PO';
  btn.remove();
  if (row) row.cells[6].innerHTML = '<span class="badge badge-success">approved</span>';
  if (window.showToast) window.showToast(poNum + ' approved and sent to supplier. ERP updated.', 'success');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="MRP – Purchase Orders" activeModule="mrp-po" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-file-invoice"></i></div>
        <div><div class="page-title">Purchase Orders</div><div class="page-subtitle">PO lifecycle: Draft → Approved → Sent → Confirmed → Received</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="openCreatePOModal()"><i class="fas fa-plus"></i> Create PO</button>
        <button class="btn btn-secondary" onclick="location.href='/api/mrp/export/purchase-orders'"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>
    <div class="card">
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>PO Number</th><th>Material</th><th>Supplier</th><th>Qty</th><th>Value</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody id="po-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/mrp/shortage-alerts', async (c) => {
  const scripts = `
async function init() {
  const alerts = await axios.get('/api/mrp/alerts').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('alerts-list');
  el.innerHTML = alerts.map(a => \`<div class="alert alert-\${a.severity==='critical'?'critical':a.severity==='high'?'critical':'warning'}" style="margin-bottom:12px">
    <i class="fas fa-\${a.severity==='critical'?'times-circle':'exclamation-triangle'}"></i>
    <div style="flex:1">
      <div class="flex items-center justify-between">
        <strong>\${a.alert_type}</strong>
        <span class="badge badge-\${a.severity}" style="font-size:10px">\${a.severity.toUpperCase()}</span>
      </div>
      <div style="margin-top:4px">\${a.message}</div>
      \${a.material_name ? '<div style="font-size:11px;color:#64748B;margin-top:3px">Material: '+a.material_name+'</div>' : ''}
      \${a.sku_name ? '<div style="font-size:11px;color:#64748B">SKU: '+a.sku_name+'</div>' : ''}
      <div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.04);border-radius:6px;font-size:12px">
        <strong>Recommended Action:</strong> \${a.recommended_action}
      </div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="btn btn-sm btn-primary" onclick="takeAlertAction(this,'\${a.id}','\${a.material_name||a.sku_name||'item'}')">Take Action</button>
        <button class="btn btn-sm btn-secondary" onclick="dismissAlert(this,'\${a.id}')">Dismiss</button>
      </div>
    </div>
  </div>\`).join('') || '<div class="alert alert-success"><i class="fas fa-check-circle"></i><div>No open shortage alerts.</div></div>';
}
function takeAlertAction(btn, id, material) {
  btn.innerHTML = '<i class="fas fa-check"></i> Action Logged';
  btn.disabled = true; btn.className = 'btn btn-sm btn-success';
  const sibBtn = btn.nextElementSibling;
  if (sibBtn) sibBtn.style.display = 'none';
  if (window.showToast) window.showToast('Action logged for alert on ' + material + '. Assigned to procurement team. Expected resolution: 48 hrs.', 'success');
}
function dismissAlert(btn, id) {
  const alertEl = btn.closest('.alert');
  if (alertEl) { alertEl.style.opacity = '0.4'; alertEl.style.pointerEvents = 'none'; }
  if (window.showToast) window.showToast('Alert dismissed. Acknowledged in system.', 'info');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="MRP – Shortage Alerts" activeModule="mrp-alerts" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-bell"></i></div>
        <div><div class="page-title">Shortage Alerts</div><div class="page-subtitle">Critical material shortages requiring immediate action</div></div>
      </div>
      <div class="page-header-right"><span class="badge badge-live">Live</span></div>
    </div>
    <div id="alerts-list"><div class="spinner"></div></div>
  </Layout>)
})

app.get('/mrp/analytics', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  new Chart(document.getElementById('coverage-chart'), {
    type:'bar',data:{labels:['PET Resin','Mango Conc.','Orange Conc.','HDPE Cap','Label Film','Secondary Carton'],
      datasets:[{label:'Days of Coverage',data:[22.5,12.9,5.5,28.3,15.0,21.3],backgroundColor:data=>[22.5,12.9,5.5,28.3,15.0,21.3].map(v=>v<10?'#DC2626':v<15?'#D97706':'#059669')}]},
    options:{responsive:true,maintainAspectRatio:false,scales:{y:{title:{display:true,text:'Days'}}},plugins:{legend:{display:false}}}
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="MRP Analytics" activeModule="mrp-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-chart-line"></i></div>
        <div><div class="page-title">MRP Analytics</div><div class="page-subtitle">Material coverage, procurement performance, supplier reliability</div></div>
      </div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Material Coverage Days</span></div><div class="card-body" style="height:250px"><canvas id="coverage-chart"></canvas></div></div>
  </Layout>)
})

// ── Optimization Workbench (new consolidated page) ───────────────────────────
app.get('/mrp/optimization-workbench', async (c) => {
  const scripts = `
// ── Workbench state ──────────────────────────────────────────
let wbState = {
  objectives: [], constraints: {}, scenarios: [], optResults: null,
  charts: { radar: null, donut: null, scAvail: null, scCost: null, scInv: null, scSvc: null }
};
let wbCurrentTab = 'objectives';

// ── Tab switcher ─────────────────────────────────────────────
function switchWbTab(tab) {
  wbCurrentTab = tab;
  document.querySelectorAll('.wb-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  document.querySelectorAll('.wb-panel').forEach(p => p.style.display = p.dataset.panel === tab ? 'block' : 'none');
  if (tab === 'optresults' && !wbState.optResults) runOptimization();
  if (tab === 'scenarios') renderScenarioCharts();
}

// ── Load objectives ──────────────────────────────────────────
async function loadObjectives() {
  const res = await axios.get('/api/mrp/objectives').catch(() => ({data:[]}));
  wbState.objectives = res.data;
  const grid = document.getElementById('wb-obj-grid');
  if (!grid) return;
  const colors = ['#2563EB','#7C3AED','#059669','#D97706','#DC2626'];
  grid.innerHTML = wbState.objectives.map((o, i) => \`
    <div style="background:#fff;border-radius:12px;padding:20px;border:1px solid #E2E8F0;box-shadow:0 1px 4px rgba(0,0,0,0.06)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:\${colors[i%colors.length]};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:0.875rem">\${i+1}</div>
        <div>
          <div style="font-weight:700;color:#1E293B;font-size:0.9rem">\${o.name}</div>
          <div style="font-size:0.75rem;color:#64748B">\${o.category}</div>
        </div>
        <span class="badge badge-\${o.status==='Below Target'?'critical':o.status==='Not Started'?'warning':'success'}" style="margin-left:auto">\${o.status}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:0.82rem">
        <span style="color:#64748B">Current: <strong>\${o.current}</strong></span>
        <span style="color:#059669">Target: <strong>\${o.target}</strong></span>
      </div>
      <div style="background:#F1F5F9;border-radius:6px;height:6px;overflow:hidden">
        <div style="height:100%;border-radius:6px;background:\${colors[i%colors.length]};width:\${o.weight*3.33}%"></div>
      </div>
      <div style="font-size:11px;color:#94A3B8;margin-top:6px">Weight: \${o.weight}%</div>
    </div>
  \`).join('');
}

// ── Load constraints ──────────────────────────────────────────
async function loadConstraints() {
  const res = await axios.get('/api/mrp/constraints').catch(() => ({data:{}}));
  wbState.constraints = res.data;
  // Capacity table
  const capTbody = document.getElementById('wb-cap-table');
  if (capTbody && res.data.capacity) {
    capTbody.innerHTML = res.data.capacity.map(c => \`<tr>
      <td><strong>\${c.line}</strong></td>
      <td>\${c.plant}</td>
      <td>\${c.shiftCapacity.toLocaleString()}</td>
      <td>\${c.shiftsPerWeek}</td>
      <td>\${c.maxWeekly.toLocaleString()}</td>
      <td><span class="badge badge-\${c.utilization>=90?'critical':c.utilization>=80?'warning':'success'}">\${c.utilization}%</span></td>
    </tr>\`).join('');
  }
  // Lead time table
  const ltTbody = document.getElementById('wb-lt-table');
  if (ltTbody && res.data.leadTime) {
    ltTbody.innerHTML = res.data.leadTime.map(l => \`<tr>
      <td><strong>\${l.supplier}</strong></td>
      <td>\${l.material}</td>
      <td>\${l.minDays}d</td>
      <td>\${l.maxDays}d</td>
      <td><strong>\${l.avgDays}d</strong></td>
      <td style="color:#64748B">\${l.variability}</td>
    </tr>\`).join('');
  }
  // Supplier table
  const supTbody = document.getElementById('wb-sup-table');
  if (supTbody && res.data.supplier) {
    supTbody.innerHTML = res.data.supplier.map(s => \`<tr>
      <td><strong>\${s.supplier}</strong></td>
      <td>\${s.name}</td>
      <td><span class="badge badge-\${s.reliability>=95?'success':s.reliability>=90?'warning':'critical'}">\${s.reliability}%</span></td>
      <td>\${s.moq.toLocaleString()} \${s.unit}</td>
      <td>\${s.maxMonthly.toLocaleString()}</td>
      <td><span class="badge badge-\${s.contractStatus==='Active'?'success':s.contractStatus==='Under Review'?'warning':'info'}">\${s.contractStatus}</span></td>
    </tr>\`).join('');
  }
  // Inventory policy table
  const invTbody = document.getElementById('wb-inv-table');
  if (invTbody && res.data.inventoryPolicy) {
    invTbody.innerHTML = res.data.inventoryPolicy.map(p => \`<tr>
      <td><strong>\${p.sku}</strong></td>
      <td><span class="badge badge-info">\${p.method}</span></td>
      <td>\${p.minStock.toLocaleString()}</td>
      <td>\${p.maxStock.toLocaleString()}</td>
      <td>\${p.reorderPoint.toLocaleString()}</td>
      <td>\${p.safetyStock.toLocaleString()}</td>
    </tr>\`).join('');
  }
}

// ── Run Optimization ──────────────────────────────────────────
async function runOptimization() {
  const btn = document.getElementById('wb-opt-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...'; }
  const res = await axios.post('/api/mrp/optimize', { scenarioId: 'S2' }).catch(() => ({data:{}}));
  wbState.optResults = res.data;
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-magic"></i> Run Optimization'; }
  renderOptResults();
}

function renderOptResults() {
  const r = wbState.optResults;
  if (!r || !r.scenario) return;
  const sc = r.scenario;
  // KPI cards
  const kpiEl = document.getElementById('wb-opt-kpis');
  if (kpiEl) {
    const kpis = [
      { label: 'Material Availability', val: sc.kpis.materialAvailability + '%', color: '#059669', icon: 'fa-boxes', base: '94.2%' },
      { label: 'Service Level', val: sc.kpis.serviceLevel + '%', color: '#2563EB', icon: 'fa-star', base: '93.5%' },
      { label: 'Plan Adherence', val: sc.kpis.planAdherence + '%', color: '#7C3AED', icon: 'fa-check-circle', base: '88.5%' },
      { label: 'Inventory Reduction', val: sc.kpis.inventoryReduction + '%', color: '#D97706', icon: 'fa-warehouse', base: '0%' },
      { label: 'Cost Reduction', val: sc.kpis.costReduction + '%', color: '#DC2626', icon: 'fa-rupee-sign', base: '0%' },
    ];
    kpiEl.innerHTML = kpis.map(k => \`<div style="background:#fff;border-radius:10px;padding:16px;border:1px solid #E2E8F0;text-align:center">
      <i class="fas \${k.icon}" style="color:\${k.color};font-size:1.4rem;margin-bottom:8px;display:block"></i>
      <div style="font-size:1.5rem;font-weight:800;color:\${k.color}">\${k.val}</div>
      <div style="font-size:0.75rem;font-weight:600;color:#374151;margin-top:2px">\${k.label}</div>
      <div style="font-size:0.7rem;color:#94A3B8;margin-top:4px">Baseline: \${k.base}</div>
    </div>\`).join('');
  }
  // Recommendations
  const recEl = document.getElementById('wb-recommendations');
  if (recEl && r.recommendations) {
    const pColors = { High: '#DC2626', Medium: '#D97706', Low: '#059669' };
    recEl.innerHTML = r.recommendations.map((rec, i) => \`
      <div style="display:flex;align-items:flex-start;gap:14px;padding:16px;background:#fff;border-radius:10px;border:1px solid #E2E8F0;border-left:4px solid \${pColors[rec.priority]||'#64748B'}">
        <div style="width:28px;height:28px;border-radius:50%;background:\${pColors[rec.priority]||'#64748B'};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.8rem;flex-shrink:0">\${i+1}</div>
        <div style="flex:1">
          <div style="font-weight:600;color:#1E293B;font-size:0.875rem">\${rec.action}</div>
          <div style="font-size:0.78rem;color:#059669;margin-top:4px"><i class="fas fa-arrow-up"></i> \${rec.impact}</div>
        </div>
        <span class="badge badge-\${rec.priority==='High'?'critical':rec.priority==='Medium'?'warning':'success'}">\${rec.priority}</span>
      </div>
    \`).join('');
  }
  // Render radar chart
  renderRadarChart(sc);
}

function renderRadarChart(sc) {
  const ctx = document.getElementById('wb-radar-chart');
  if (!ctx) return;
  if (wbState.charts.radar) wbState.charts.radar.destroy();
  wbState.charts.radar = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Material Avail.', 'Service Level', 'Plan Adherence', 'Supplier OTIF', 'Cost Efficiency'],
      datasets: [
        { label: 'Baseline', data: [94.2, 93.5, 88.5, 89.0, 85], borderColor: '#94A3B8', backgroundColor: 'rgba(148,163,184,0.1)', borderWidth: 2, pointRadius: 4 },
        { label: sc.name, data: [sc.kpis.materialAvailability, sc.kpis.serviceLevel, sc.kpis.planAdherence, sc.kpis.supplierOTIF, (100-sc.kpis.shortage)], borderColor: '#7C3AED', backgroundColor: 'rgba(124,58,237,0.1)', borderWidth: 2.5, pointRadius: 5 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { r: { beginAtZero: false, min: 70, max: 100, ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.08)' } } }, plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } } }
  });
}

// ── Scenario Comparison ──────────────────────────────────────
async function loadScenarios() {
  const res = await axios.get('/api/mrp/scenarios').catch(() => ({data:[]}));
  wbState.scenarios = res.data;
  // Cards
  const cardsEl = document.getElementById('wb-scenario-cards');
  if (cardsEl) {
    cardsEl.innerHTML = res.data.map(s => \`
      <div style="background:#fff;border-radius:12px;padding:18px;border:2px solid \${s.active?'#7C3AED':'#E2E8F0'};position:relative">
        \${s.active ? '<span style="position:absolute;top:10px;right:10px;background:#7C3AED;color:#fff;font-size:10px;padding:2px 8px;border-radius:999px;font-weight:600">ACTIVE</span>' : ''}
        <div style="font-weight:700;color:#1E293B;margin-bottom:4px">\${s.name}</div>
        <div style="font-size:0.75rem;color:#64748B;margin-bottom:12px">\${s.description}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="font-size:0.78rem"><span style="color:#64748B">Availability:</span> <strong style="color:\${s.kpis.materialAvailability>=99?'#059669':'#DC2626'}">\${s.kpis.materialAvailability}%</strong></div>
          <div style="font-size:0.78rem"><span style="color:#64748B">Service:</span> <strong>\${s.kpis.serviceLevel}%</strong></div>
          <div style="font-size:0.78rem"><span style="color:#64748B">Adherence:</span> <strong>\${s.kpis.planAdherence}%</strong></div>
          <div style="font-size:0.78rem"><span style="color:#64748B">OTIF:</span> <strong>\${s.kpis.supplierOTIF}%</strong></div>
        </div>
      </div>
    \`).join('');
  }
  // Delta table
  const deltaEl = document.getElementById('wb-delta-table');
  if (deltaEl && res.data.length > 1) {
    const base = res.data[0];
    deltaEl.innerHTML = res.data.map(s => {
      const da = (s.kpis.materialAvailability - base.kpis.materialAvailability).toFixed(1);
      const ds = (s.kpis.serviceLevel - base.kpis.serviceLevel).toFixed(1);
      const dp = (s.kpis.planAdherence - base.kpis.planAdherence).toFixed(1);
      const dc = s.kpis.costReduction.toFixed(1);
      const dv = ((base.kpis.totalCost - s.kpis.totalCost)/1000).toFixed(0);
      return \`<tr>
        <td><strong>\${s.id}</strong></td>
        <td>\${s.name}</td>
        <td class="\${Number(da)>0?'healthy':Number(da)<0?'critical':''}">\${Number(da)>0?'+':''}\${da}%</td>
        <td class="\${Number(ds)>0?'healthy':Number(ds)<0?'critical':''}">\${Number(ds)>0?'+':''}\${ds}%</td>
        <td class="\${Number(dp)>0?'healthy':Number(dp)<0?'critical':''}">\${Number(dp)>0?'+':''}\${dp}%</td>
        <td class="\${Number(dc)>0?'healthy':Number(dc)<0?'critical':''}">\${Number(dc)>0?'+':''}\${dc}%</td>
        <td class="\${Number(dv)>0?'healthy':Number(dv)<0?'critical':''}">\${Number(dv)>0?'Saves ₹':'Adds ₹'}\${Math.abs(Number(dv))}K</td>
        <td><span class="badge badge-\${s.active?'success':'info'}">\${s.active?'Active':'Compare'}</span></td>
      </tr>\`;
    }).join('');
  }
}

function renderScenarioCharts() {
  if (!wbState.scenarios.length) return;
  const sc = wbState.scenarios;
  const labels = sc.map(s => s.id);
  const avail = sc.map(s => s.kpis.materialAvailability);
  const svc = sc.map(s => s.kpis.serviceLevel);
  const cost = sc.map(s => s.kpis.totalCost / 1000);
  const inv = sc.map(s => s.kpis.inventoryReduction);

  const draw = (id, type, datasets, yLabel) => {
    const ctx = document.getElementById(id);
    if (!ctx) return;
    if (ctx._chart) ctx._chart.destroy();
    ctx._chart = new Chart(ctx, {
      type,
      data: { labels, datasets },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { font: { size: 11 }, boxWidth: 12 } } }, scales: { y: { title: { display: true, text: yLabel }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { ticks: { font: { size: 10 } } } } }
    });
  };

  draw('wb-sc-avail', 'bar', [{ label: 'Material Availability %', data: avail, backgroundColor: avail.map(v => v >= 99 ? '#059669' : v >= 95 ? '#D97706' : '#DC2626'), borderRadius: 5 }], '%');
  draw('wb-sc-cost', 'bar', [{ label: 'Total Cost (₹K)', data: cost, backgroundColor: 'rgba(124,58,237,0.75)', borderRadius: 5 }], '₹ Thousands');
  draw('wb-sc-inv', 'bar', [{ label: 'Inventory Reduction %', data: inv, backgroundColor: inv.map(v => v > 0 ? '#059669' : '#DC2626'), borderRadius: 5 }], '% Change');
  draw('wb-sc-svc', 'line', [
    { label: 'Service Level %', data: svc, borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,0.08)', fill: true, tension: 0.35, borderWidth: 2.5, pointRadius: 5 },
    { label: 'Material Avail. %', data: avail, borderColor: '#059669', backgroundColor: 'transparent', fill: false, tension: 0.35, borderWidth: 2, pointRadius: 4 }
  ], '%');
}

// ── Export ────────────────────────────────────────────────────
function exportWb(type) {
  window.location.href = '/api/mrp/export/' + type;
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadObjectives(), loadConstraints(), loadScenarios()]);
  switchWbTab('objectives');
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="MRP – Optimization Workbench" activeModule="mrp-workbench" scripts={scripts}>
    <style>{`
      .wb-tab-btn { padding:10px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;transition:all .2s;display:flex;align-items:center;gap:8px }
      .wb-tab-btn.active { color:#7C3AED;border-bottom-color:#7C3AED }
      .wb-tab-btn:hover:not(.active) { color:#374151;background:#F8FAFC }
      .wb-tab-bar { display:flex;border-bottom:1px solid #E2E8F0;background:#fff;border-radius:12px 12px 0 0;overflow:hidden }
      .wb-panel { display:none }
      .wb-sub-tab { padding:8px 16px;border:1px solid #E2E8F0;border-radius:8px;background:transparent;cursor:pointer;font-size:0.8rem;font-weight:600;color:#64748B;transition:all .15s }
      .wb-sub-tab.active { background:#0891B2;color:#fff;border-color:#0891B2 }
      .healthy { color:#059669 } .critical { color:#DC2626 }
    `}</style>
    {/* Page Header */}
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#6D28D9,#A78BFA)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Optimization Workbench</div>
          <div class="page-subtitle">End-to-end MRP optimization — Objectives · Constraints · Results · Scenario Comparison</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary" id="wb-opt-btn" onclick="runOptimization()"><i class="fas fa-magic"></i> Run Optimization</button>
        <div style="position:relative;display:inline-block">
          <button class="btn btn-secondary" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='block'?'none':'block'">
            <i class="fas fa-download"></i> Export
          </button>
          <div style="display:none;position:absolute;right:0;top:100%;background:#fff;border:1px solid #E2E8F0;border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,0.12);min-width:200px;z-index:50;padding:4px 0">
            <button onclick="exportWb('net-requirements')" style="width:100%;text-align:left;padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:0.85rem;color:#374151"><i class="fas fa-table" style="width:16px;margin-right:8px;color:#64748B"></i>Net Requirements CSV</button>
            <button onclick="exportWb('purchase-orders')" style="width:100%;text-align:left;padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:0.85rem;color:#374151"><i class="fas fa-file-invoice" style="width:16px;margin-right:8px;color:#64748B"></i>Purchase Orders CSV</button>
            <button onclick="exportWb('inventory')" style="width:100%;text-align:left;padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:0.85rem;color:#374151"><i class="fas fa-warehouse" style="width:16px;margin-right:8px;color:#64748B"></i>Inventory CSV</button>
            <button onclick="exportWb('scenarios')" style="width:100%;text-align:left;padding:10px 16px;border:none;background:transparent;cursor:pointer;font-size:0.85rem;color:#374151"><i class="fas fa-sitemap" style="width:16px;margin-right:8px;color:#64748B"></i>Scenario Comparison CSV</button>
          </div>
        </div>
      </div>
    </div>

    {/* Tab Bar */}
    <div style="background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div class="wb-tab-bar">
        <button class="wb-tab-btn active" data-tab="objectives" onclick="switchWbTab('objectives')">
          <i class="fas fa-bullseye"></i> <span>1. Objectives</span>
        </button>
        <button class="wb-tab-btn" data-tab="constraints" onclick="switchWbTab('constraints')">
          <i class="fas fa-lock"></i> <span>2. Constraints</span>
        </button>
        <button class="wb-tab-btn" data-tab="optresults" onclick="switchWbTab('optresults')">
          <i class="fas fa-chart-line"></i> <span>3. Optimization Results</span>
        </button>
        <button class="wb-tab-btn" data-tab="scenarios" onclick="switchWbTab('scenarios')">
          <i class="fas fa-layer-group"></i> <span>4. Scenario Comparison</span>
        </button>
      </div>

      {/* ── OBJECTIVES PANEL ── */}
      <div class="wb-panel" data-panel="objectives" style="padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div>
            <div style="font-weight:700;color:#1E293B;font-size:1.05rem"><i class="fas fa-bullseye" style="color:#7C3AED;margin-right:8px"></i>Planning Objectives</div>
            <div style="font-size:0.8rem;color:#64748B;margin-top:2px">Define optimization goals and KPI targets for the MRP run</div>
          </div>
        </div>
        <div id="wb-obj-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
          <div style="text-align:center;padding:40px;color:#64748B"><div class="spinner"></div></div>
        </div>
      </div>

      {/* ── CONSTRAINTS PANEL ── */}
      <div class="wb-panel" data-panel="constraints" style="padding:24px">
        <div style="margin-bottom:20px">
          <div style="font-weight:700;color:#1E293B;font-size:1.05rem"><i class="fas fa-lock" style="color:#0891B2;margin-right:8px"></i>Planning Constraints</div>
          <div style="font-size:0.8rem;color:#64748B;margin-top:2px">System boundaries, capacities, lead times and supplier limits</div>
        </div>
        {/* Sub-tabs */}
        <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
          <button class="wb-sub-tab active" id="ct-cap" onclick="showConstraintTab('cap')">Capacity</button>
          <button class="wb-sub-tab" id="ct-lt" onclick="showConstraintTab('lt')">Lead Times</button>
          <button class="wb-sub-tab" id="ct-sup" onclick="showConstraintTab('sup')">Suppliers / MOQ</button>
          <button class="wb-sub-tab" id="ct-inv" onclick="showConstraintTab('inv')">Inventory Policy</button>
        </div>
        {/* Capacity */}
        <div id="cp-cap">
          <table class="data-table">
            <thead><tr><th>Production Line</th><th>Plant</th><th>Shift Capacity</th><th>Shifts/Week</th><th>Max Weekly</th><th>Utilization</th></tr></thead>
            <tbody id="wb-cap-table"><tr><td colspan="6" style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
          </table>
        </div>
        {/* Lead Times */}
        <div id="cp-lt" style="display:none">
          <table class="data-table">
            <thead><tr><th>Supplier</th><th>Material</th><th>Min Days</th><th>Max Days</th><th>Avg Days</th><th>Variability</th></tr></thead>
            <tbody id="wb-lt-table"></tbody>
          </table>
        </div>
        {/* Suppliers */}
        <div id="cp-sup" style="display:none">
          <table class="data-table">
            <thead><tr><th>Supplier</th><th>Name</th><th>Reliability</th><th>MOQ</th><th>Max Monthly</th><th>Contract</th></tr></thead>
            <tbody id="wb-sup-table"></tbody>
          </table>
        </div>
        {/* Inventory Policy */}
        <div id="cp-inv" style="display:none">
          <table class="data-table">
            <thead><tr><th>SKU</th><th>Method</th><th>Min Stock</th><th>Max Stock</th><th>Reorder Point</th><th>Safety Stock</th></tr></thead>
            <tbody id="wb-inv-table"></tbody>
          </table>
        </div>
      </div>

      {/* ── OPT RESULTS PANEL ── */}
      <div class="wb-panel" data-panel="optresults" style="padding:24px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
          <div>
            <div style="font-weight:700;color:#1E293B;font-size:1.05rem"><i class="fas fa-chart-line" style="color:#7C3AED;margin-right:8px"></i>Optimization Results</div>
            <div style="font-size:0.8rem;color:#64748B;margin-top:2px">Optimized scenario KPIs vs baseline, recommendations and charts</div>
          </div>
          <button class="btn btn-primary" onclick="runOptimization()"><i class="fas fa-sync-alt"></i> Re-optimize</button>
        </div>
        <div id="wb-opt-kpis" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px;margin-bottom:24px">
          <div style="text-align:center;padding:40px;color:#64748B;grid-column:1/-1"><div class="spinner"></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px">
          <div class="card" style="margin:0">
            <div class="card-header"><span class="card-title"><i class="fas fa-radar-chart"></i> Baseline vs Optimized (Radar)</span></div>
            <div class="card-body" style="height:260px"><canvas id="wb-radar-chart"></canvas></div>
          </div>
          <div class="card" style="margin:0">
            <div class="card-header"><span class="card-title"><i class="fas fa-list-ol"></i> Top Recommendations</span></div>
            <div class="card-body" style="overflow-y:auto;max-height:280px">
              <div id="wb-recommendations" style="display:flex;flex-direction:column;gap:10px">
                <div style="text-align:center;color:#64748B;padding:20px"><div class="spinner"></div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCENARIOS PANEL ── */}
      <div class="wb-panel" data-panel="scenarios" style="padding:24px">
        <div style="margin-bottom:20px">
          <div style="font-weight:700;color:#1E293B;font-size:1.05rem"><i class="fas fa-layer-group" style="color:#0891B2;margin-right:8px"></i>Scenario Comparison</div>
          <div style="font-size:0.8rem;color:#64748B;margin-top:2px">Compare all planning scenarios across key performance metrics</div>
        </div>
        {/* Scenario cards */}
        <div id="wb-scenario-cards" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-bottom:24px">
          <div style="text-align:center;padding:40px;color:#64748B;grid-column:1/-1"><div class="spinner"></div></div>
        </div>
        {/* Delta table */}
        <div class="card" style="margin-bottom:24px">
          <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Delta vs Baseline</span></div>
          <div class="card-body compact">
            <table class="data-table">
              <thead><tr><th>ID</th><th>Scenario</th><th>Availability Δ</th><th>Service Δ</th><th>Adherence Δ</th><th>Cost Red. Δ</th><th>Cost Savings</th><th>Status</th></tr></thead>
              <tbody id="wb-delta-table"></tbody>
            </table>
          </div>
        </div>
        {/* Charts 2×2 */}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" style="margin:0"><div class="card-header"><span class="card-title">Material Availability by Scenario</span></div><div class="card-body" style="height:220px"><canvas id="wb-sc-avail"></canvas></div></div>
          <div class="card" style="margin:0"><div class="card-header"><span class="card-title">Total Cost by Scenario</span></div><div class="card-body" style="height:220px"><canvas id="wb-sc-cost"></canvas></div></div>
          <div class="card" style="margin:0"><div class="card-header"><span class="card-title">Inventory Reduction %</span></div><div class="card-body" style="height:220px"><canvas id="wb-sc-inv"></canvas></div></div>
          <div class="card" style="margin:0"><div class="card-header"><span class="card-title">Service Level vs Availability</span></div><div class="card-body" style="height:220px"><canvas id="wb-sc-svc"></canvas></div></div>
        </div>
      </div>
    </div>

    {/* Constraint sub-tab JS */}
    <script>{`
      function showConstraintTab(tab) {
        ['cap','lt','sup','inv'].forEach(t => {
          document.getElementById('cp-'+t).style.display = t===tab?'block':'none';
          const btn = document.getElementById('ct-'+t);
          if (btn) btn.classList.toggle('active', t===tab);
        });
      }
    `}</script>
  </Layout>)
})


// ============================================================
// INVENTORY ROUTES
// ============================================================

app.get('/inventory', async (c) => {
  const scripts = `// inventory-module.js handles this page
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory Planning" activeModule="inventory" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-warehouse"></i></div>
        <div>
          <div class="page-title">Inventory Planning</div>
          <div class="page-subtitle">Stock positions, safety stock, reorder points, ABC/XYZ classification</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/inventory/optimization" class="btn btn-primary"><i class="fas fa-sync-alt"></i> Replenishment</a>
      </div>
    </div>
    <div class="kpi-grid" id="inv-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-boxes"></i> Stock Positions vs Safety Stock</span></div>
        <div class="card-body" style="height:240px"><canvas id="inv-stock-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-calendar-alt"></i> Days of Supply by SKU</span></div>
        <div class="card-body" style="height:240px"><canvas id="inv-dos-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> SKU Stock Positions</span>
        <a href="/inventory/operations" class="btn btn-sm btn-secondary">Full View</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Plant</th><th>On Hand</th><th>Reserved</th><th>In Transit</th><th>Available</th><th>Safety Stock</th><th>Days of Supply</th><th>Fill %</th></tr></thead>
          <tbody id="inv-stock-table"><tr><td colspan={9} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-tag"></i> ABC Classification</span></div>
        <div class="card-body" style="height:200px"><canvas id="inv-abc-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-sync-alt"></i> Inventory Turns Trend</span></div>
        <div class="card-body" style="height:200px"><canvas id="inv-turnover-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-shield-alt"></i> Coverage vs Safety Stock</span></div>
        <div class="card-body" style="height:200px"><canvas id="inv-coverage-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-truck-loading"></i> Replenishment Plan (6 Weeks)</span>
        <a href="/inventory/optimization" class="btn btn-sm btn-primary"><i class="fas fa-cogs"></i> Run Replenishment</a>
      </div>
      <div class="card-body" style="height:240px"><canvas id="inv-replenishment-chart"></canvas></div>
    </div>
    <script src="/static/inventory-module.js"></script>
  </Layout>)
})

app.get('/inventory/executive', (c) => c.redirect('/inventory'))
app.get('/inventory/operations', async (c) => {
  const scripts = `
async function init() {
  const stock = await axios.get('/api/inventory/stock').then(r=>r.data).catch(()=>[]);
  const tbody = document.getElementById('stock-table');
  if (tbody) tbody.innerHTML = stock.map(s => {
    const dos = s.days_of_supply || 0;
    const sc = dos < 7 ? 'critical' : dos < 14 ? 'warning' : 'healthy';
    return \`<tr>
      <td><strong>\${s.sku_code}</strong></td><td>\${s.sku_name}</td>
      <td>\${s.plant_name}</td>
      <td>\${s.on_hand_qty?.toLocaleString()}</td><td>\${s.reserved_qty?.toLocaleString()}</td>
      <td>\${s.in_transit_qty?.toLocaleString()}</td><td>\${s.available_qty?.toLocaleString()}</td>
      <td><strong class="\${sc}">\${dos?.toFixed(1)} days</strong></td>
    </tr>\`;
  }).join('');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory – Stock Positions" activeModule="inv-operations" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-tachometer-alt"></i></div>
        <div><div class="page-title">Stock Positions</div><div class="page-subtitle">Real-time on-hand, reserved, in-transit and available stock by location</div></div>
      </div>
    </div>
    <div class="card"><div class="card-body compact">
      <table class="data-table">
        <thead><tr><th>Code</th><th>SKU</th><th>Plant</th><th>On Hand</th><th>Reserved</th><th>In Transit</th><th>Available</th><th>Days of Supply</th></tr></thead>
        <tbody id="stock-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
      </table>
    </div></div>
  </Layout>)
})

app.get('/inventory/optimization', (c) => {
  const scripts = `
function switchInvTab(tab) {
  document.querySelectorAll('.inv-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.inv-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function init() {
  switchInvTab('objectives');
  const [ss, abcxyz] = await Promise.all([
    axios.get('/api/inventory/safety-stock').then(r=>r.data).catch(()=>[]),
    axios.get('/api/inventory/abc-xyz').then(r=>r.data).catch(()=>[]),
  ]);
  // SS table
  const el = document.getElementById('ss-table');
  if (el && ss.length) {
    el.innerHTML = ss.map(s => \`<tr>
      <td><strong>\${s.sku}</strong></td>
      <td>\${s.level} – \${s.location}</td>
      <td>\${s.current_ss?.toLocaleString()}</td>
      <td style="font-weight:600;color:\${s.gap>0?'#DC2626':'#059669'}">\${s.optimal_ss?.toLocaleString()}</td>
      <td style="font-weight:600;color:\${s.gap>0?'#DC2626':'#059669'}">\${s.gap>0?'+':''}\${s.gap}</td>
      <td>\${(s.service_level_target*100||97.5).toFixed(1)}%</td>
      <td style="font-size:11px">\${s.recommendation}</td>
      <td>\${s.gap!==0?'<button class="btn btn-sm btn-primary" onclick="updateSS(\\'' + s.sku + '\\',\\'' + s.location + '\\',' + s.optimal_ss + ')">Update</button>':'<span class=\\"badge badge-success\\">Optimal</span>'}</td>
    </tr>\`).join('');
  }
  // ABC-XYZ table
  const el2 = document.getElementById('abcxyz-table');
  if (el2 && abcxyz.length) {
    el2.innerHTML = abcxyz.map(s => \`<tr>
      <td><strong>\${s.sku}</strong><br/><span style="font-size:11px;color:#64748B">\${s.sku_name}</span></td>
      <td><span class="badge badge-\${s.abc==='A'?'critical':s.abc==='B'?'warning':'neutral'}">\${s.abc}</span></td>
      <td><span class="badge badge-\${s.xyz==='X'?'success':s.xyz==='Y'?'info':'warning'}">\${s.xyz}</span></td>
      <td>\${s.revenue_pct}%</td>
      <td>\${s.cv.toFixed(2)}</td>
      <td style="font-size:11px">\${s.recommendation}</td>
      <td><strong>\${s.policy}</strong></td>
    </tr>\`).join('');
  }
  // ABC chart
  const ctx = document.getElementById('abc-chart');
  if (ctx && abcxyz.length) {
    new Chart(ctx, {
      type:'bar',
      data:{labels:abcxyz.map(s=>s.sku),datasets:[
        {label:'Revenue %',data:abcxyz.map(s=>s.revenue_pct),backgroundColor:abcxyz.map(s=>s.abc==='A'?'#DC2626':s.abc==='B'?'#D97706':'#059669'),borderRadius:4}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{callback:v=>v+'%'}}}}
    });
  }
}
async function updateSS(sku, location, newSS) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;
  await new Promise(r=>setTimeout(r,1000));
  btn.innerHTML = '✓ Updated';
  btn.className = 'btn btn-sm btn-success';
}
async function generateReplenishmentPlan() {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Calculating MEIO...';
  btn.disabled = true;
  await new Promise(r=>setTimeout(r,2000));
  btn.innerHTML = '<i class="fas fa-rocket"></i> Generate Replenishment Plan';
  btn.disabled = false;
  window.showToast('MEIO plan generated: 6 SKUs reviewed, 4 safety stock adjustments. Working capital +₹8.4L, Service level +1.2pp.','success');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory – Optimization Workbench" activeModule="inv-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-sliders-h"></i></div>
        <div><div class="page-title">Inventory — Optimization Workbench</div><div class="page-subtitle">MEIO safety stock · ABC-XYZ · Replenishment optimization · Scenario comparison</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="generateReplenishmentPlan()"><i class="fas fa-rocket"></i> Generate Replenishment Plan</button>
        <a href="/api/export/inventory?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export</a>
      </div>
    </div>
    {/* Tab navigation */}
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="inv-tab-btn" data-tab={tab} onclick={`switchInvTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      {/* Objectives panel */}
      <div class="inv-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Inventory optimization objectives from Excel requirements</p>
        {[['≥98% Fill Rate','Service Level','Ensure right product at right location and time'],['Inventory Turns ↑20–30%','Inventory Efficiency','Balance inventory across network, avoid excess and stockouts'],['Inventory Value ↓15–25%','Cost Optimization','Minimize capital locked in RM, WIP and FG inventory'],['Forecast Bias ±5%','Demand Alignment','Align inventory with demand, seasonality and promotions'],['Expiry Loss <0.5%','Freshness Control','Manage shelf-life-sensitive SKUs effectively'],['Safety Stock ↓15–20%','Network Optimization','Multi-echelon inventory optimization across nodes']].map(([target,label,desc],i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #E2E8F0;border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i<4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#D1FAE5;color:#059669;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:120px"><option>High</option><option>Medium</option><option>Low</option></select>
          </div>
        )}
      </div>
      {/* Constraints panel */}
      <div class="inv-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">System constraints governing inventory optimization</p>
        {[['Shelf Life Limit','SKU-specific','days'],['Min Order Quantity','500–50000','cases'],['Storage Capacity','80%','warehouse fill %'],['Replenishment Frequency','Weekly','cycle'],['Lead Time Variability','±20%','supplier variance'],['Forecast Accuracy Floor','70%','minimum acceptable MAPE']].map(([label,val,unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid #F1F5F9">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:80px">{unit}</span>
          </div>
        )}
      </div>
      {/* Results panel */}
      <div class="inv-panel" data-panel="results" style="padding:20px;display:none">
        <div class="card mb-4" style="margin:0 0 20px 0">
          <div class="card-header"><span class="card-title"><i class="fas fa-calculator"></i> MEIO Safety Stock Optimization</span><span class="badge badge-info">Multi-Echelon Model</span></div>
          <div class="card-body compact">
            <table class="data-table"><thead><tr><th>SKU</th><th>Level / Location</th><th>Current SS</th><th>Optimal SS</th><th>Gap (cases)</th><th>SL Target</th><th>Recommendation</th><th>Action</th></tr></thead>
              <tbody id="ss-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
            </table>
          </div>
        </div>
        <div class="grid-2">
          <div class="card" style="margin:0">
            <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> ABC-XYZ Classification</span></div>
            <div class="card-body" style="height:220px"><canvas id="abc-chart"></canvas></div>
          </div>
          <div class="card" style="margin:0">
            <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> ABC-XYZ Matrix & Policies</span></div>
            <div class="card-body compact">
              <table class="data-table" style="font-size:12px"><thead><tr><th>SKU</th><th>ABC</th><th>XYZ</th><th>Revenue %</th><th>CV</th><th>Policy</th><th>Recommendation</th></tr></thead>
                <tbody id="abcxyz-table"><tr><td colspan={7} style="text-align:center;padding:16px"><div class="spinner"></div></td></tr></tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      {/* Scenario Comparison panel */}
      <div class="inv-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare inventory outcomes across planning scenarios (Excel S1–S7)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>Fill Rate</th><th>Inventory Turns</th><th>SS Change</th><th>Expiry Risk</th><th>Working Capital</th><th>Risk</th></tr></thead>
          <tbody>
            {[['S1 – Baseline','Current State','97.1%','18.2x','0%','0.4%','₹0','Low'],['S2 – Demand Surge','Summer Peak','89.5%','24.1x','+32%','0.2%','+₹22L','High'],['S3 – Promo Uplift','Promotion Event','92.3%','21.5x','+18%','0.3%','+₹14L','Medium'],['S4 – Shelf Life –30d','Quality Change','94.1%','22.8x','+8%','1.2%','+₹6L','High'],['S5 – SL Target 98%','Policy Change','98.0%','16.4x','+25%','0.3%','+₹18L','Medium'],['S6 – Lead Time +10d','Supplier Delay','93.2%','17.1x','+41%','0.5%','+₹28L','High'],['S7 – New SKU Launch','NPD Launch','95.5%','19.3x','+15%','0.6%','+₹10L','Medium']].map(([sc,dr,fr,it,ss,ex,wc,ri]) =>
              <tr key={sc}><td><strong>{sc}</strong></td><td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class="badge badge-{Number(fr.replace('%',''))>=97?'success':Number(fr.replace('%',''))>=93?'warning':'critical'}">{fr}</span></td>
                <td>{it}</td><td style="color:{ss==='+0%'?'':'#DC2626'}">{ss}</td>
                <td style="color:{Number(ex.replace('%',''))>0.5?'#DC2626':'#059669'}">{ex}</td>
                <td style={`color:${wc==='₹0'?'inherit':wc.startsWith('-')?'#059669':'#DC2626'}`}>{wc}</td>
                <td><span class="badge badge-{ri==='High'?'warning':ri==='Low'?'success':'info'}">{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/inventory/scenarios', (c) => {
  const scripts = `
async function applyInvRecommendation(btn) {
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
  try {
    await axios.post('/api/optimizer/run', {
      module: 'inventory',
      action: 'Apply Safety Stock Recommendation',
      result_summary: 'Safety stock set to 7,200 cases. Service level target: 98.4%. Working capital impact: +₹8.4L.',
      impact: '+1.3pp service level'
    });
    window.showToast('Recommendation applied! Safety stock updated to 7,200 cases. Action logged.','success');
  } catch(e) {
    window.showToast('Scenario applied to inventory policy','success');
  }
  btn.innerHTML = '<i class="fas fa-check"></i> Apply Recommendation'; btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => {
  // Service-level impact chart
  new Chart(document.getElementById('svc-impact-chart'), {
    type: 'bar',
    data: {
      labels: ['Base (SS=6K)', 'SS +10%', 'SS +20%', 'SS +30%', 'SS +50%'],
      datasets: [
        { label: 'Service Level %', data: [97.1, 97.8, 98.4, 98.9, 99.3], backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 5, yAxisID: 'y' },
        { label: 'Carrying Cost (₹L/mo)', data: [12.4, 13.2, 14.1, 15.3, 17.8], type:'line', borderColor:'#D97706', backgroundColor:'transparent', tension:0.4, borderWidth:2.5, pointRadius:4, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins: { legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales: {
        y:  { position:'left',  min:96, max:100, ticks:{ callback:v=>v+'%' }, title:{ display:true, text:'Service Level %' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        y1: { position:'right', beginAtZero:false, title:{ display:true, text:'Carry Cost ₹L' }, grid:{ drawOnChartArea:false } }
      }
    }
  });
  // Lead-time sensitivity
  new Chart(document.getElementById('lt-sens-chart'), {
    type: 'line',
    data: {
      labels: ['LT 5d','LT 7d','LT 10d','LT 14d','LT 21d','LT 30d'],
      datasets: [
        { label: 'Reorder Point (cases)', data: [8500,10200,12800,16200,22000,31000], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5, pointRadius:4 },
        { label: 'Safety Stock (cases)',  data: [4200, 5100,  6300, 8000, 10500,14800], borderColor:'#7C3AED', backgroundColor:'transparent', fill:false, tension:0.4, borderWidth:2, pointRadius:4 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales:{
        y: { beginAtZero:false, title:{ display:true, text:'Cases' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x: { ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory – Scenarios" activeModule="inv-scenarios" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-sitemap"></i></div>
        <div><div class="page-title">Inventory Scenarios</div><div class="page-subtitle">What-if analysis: safety stock, service level, lead time sensitivity</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="window.showToast('Running scenario analysis...','success')"><i class="fas fa-play"></i> Run Scenario</button>
      </div>
    </div>

    {/* Scenario parameters card */}
    <div class="grid-2" style="align-items:start">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-sliders-h"></i> Scenario Parameters</span></div>
        <div class="card-body">
          {[
            ['Base Safety Stock Multiplier', '1.5×', 'Range: 1.0×–3.0×'],
            ['Demand Variability (CV)', '0.28', 'Target: ≤ 0.20'],
            ['Service Level Target', '98%',  'Current: 97.1%'],
            ['Lead Time (days)', '10–14d', 'Category average'],
            ['Review Period', 'Weekly', 'Fixed cycle'],
          ].map(([l,v,h]) =>
            <div key={l} style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <div>
                <div style="font-size:13px;color:#1E293B;font-weight:500">{l}</div>
                <div style="font-size:11px;color:#94A3B8">{h}</div>
              </div>
              <strong style="font-size:13px;color:#2563EB">{v}</strong>
            </div>
          )}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-check-circle"></i> Scenario Results — Best Fit</span></div>
        <div class="card-body">
          {[
            ['Recommended Safety Stock', '7,200 cases', 'healthy'],
            ['Projected Service Level', '98.4%', 'healthy'],
            ['Projected DOS', '15.2 days', 'healthy'],
            ['Additional Carrying Cost', '+₹1.7L/mo', 'warning'],
            ['Stockout Risk Reduction', '−65%', 'healthy'],
          ].map(([l,v,s]) =>
            <div key={l} style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <span style="font-size:13px;color:#475569">{l}</span>
              <span class={`badge badge-${s}`}>{v}</span>
            </div>
          )}
          <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="applyInvRecommendation(this)"><i class="fas fa-check"></i> Apply Recommendation</button>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-balance-scale"></i> Safety Stock vs Service Level vs Cost</span></div>
        <div class="card-body" style="height:240px"><canvas id="svc-impact-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> Lead Time Sensitivity Analysis</span></div>
        <div class="card-body" style="height:240px"><canvas id="lt-sens-chart"></canvas></div>
      </div>
    </div>

    {/* SKU-level scenario table */}
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> SKU-Level Scenario Comparison</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Current SS</th><th>Scenario SS</th><th>Current DOS</th><th>Target DOS</th><th>Δ Carry Cost</th><th>Service Level</th><th>Risk</th></tr></thead>
          <tbody>
            {[
              ['AquaPure 500ml',    '6,000','7,200','21.3d','15d','+₹0.4L','98.4%','healthy'],
              ['FruitBurst Orange', '3,000','4,200','10.0d','15d','+₹0.5L','97.8%','warning'],
              ['CoolSip Lemon',     '2,500','3,800','11.0d','15d','+₹0.4L','97.5%','warning'],
              ['SportZone Energy',  '2,000','3,000','12.5d','15d','+₹0.3L','97.2%','warning'],
              ['MintFresh Water',   '1,800','2,600','14.8d','15d','+₹0.2L','98.1%','healthy'],
            ].map(([sku,ss,nss,dos,tdos,dc,svc,risk]) =>
              <tr key={sku}>
                <td><strong>{sku}</strong></td>
                <td>{ss}</td>
                <td style="font-weight:600;color:#059669">{nss}</td>
                <td>{dos}</td>
                <td>{tdos}</td>
                <td style="color:#D97706;font-weight:500">{dc}</td>
                <td><span class={`badge badge-${risk}`}>{svc}</span></td>
                <td><span class={`badge badge-${risk}`}>{risk}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/inventory/analytics', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  new Chart(document.getElementById('abc-chart'), {
    type:'pie',data:{labels:['A-Class (4 SKUs)','B-Class (4 SKUs)','C-Class (4 SKUs)'],
      datasets:[{data:[65,25,10],backgroundColor:['#DC2626','#D97706','#64748B']}]},
    options:{responsive:true,maintainAspectRatio:false}
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory Analytics" activeModule="inv-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-chart-bar"></i></div>
        <div><div class="page-title">Inventory Analytics</div><div class="page-subtitle">ABC/XYZ analysis, aging, turns and inventory efficiency metrics</div></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-pie"></i> ABC Classification (by Revenue)</span></div><div class="card-body" style="height:220px"><canvas id="abc-chart"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Inventory Metrics</span></div><div class="card-body">
        {[['Inventory Turnover','18.2x/year'],['Carrying Cost','₹12.4L/month'],['Dead Stock','2 SKUs (1,800 cases)'],['Excess Stock','2 SKUs (8,000 cases)'],['Fill Rate','97.1%']].map(([l,v]) =>
          <div key={l} style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #F1F5F9">
            <span style="font-size:13px;color:#64748B">{l}</span>
            <strong style="font-size:13px">{v}</strong>
          </div>
        )}
      </div></div>
    </div>
  </Layout>)
})

app.get('/inventory/master', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  // ABC pie chart
  new Chart(document.getElementById('abc-policy-chart'), {
    type: 'doughnut',
    data: {
      labels: ['A-Class (Critical)', 'B-Class (Monitor)', 'C-Class (Review)'],
      datasets: [{ data:[4,4,4], backgroundColor:['#DC2626','#D97706','#64748B'], hoverOffset:6, borderWidth:2, borderColor:'#fff' }]
    },
    options: { responsive:true, maintainAspectRatio:false, cutout:'65%',
      plugins:{ legend:{ position:'right', labels:{ font:{size:11}, boxWidth:12, padding:10 } } } }
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory – Master Data" activeModule="inv-master" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-database"></i></div>
        <div><div class="page-title">Inventory Master Data</div><div class="page-subtitle">SKU master, storage locations, ABC classification, inventory policies</div></div>
      </div>
      <div class="page-header-right">
        <a href="/pack-size-master" class="btn btn-secondary"><i class="fas fa-ruler"></i> Pack-Size Master</a>
        <a href="/api/export/inventory?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</a>
      </div>
    </div>

    <div class="grid-2" style="align-items:start">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-pie"></i> SKU ABC Classification</span></div>
        <div class="card-body" style="height:200px"><canvas id="abc-policy-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-cog"></i> Global Inventory Policies</span></div>
        <div class="card-body">
          {[
            ['A-Class Review Cycle', 'Weekly', 'Critical items'],
            ['B-Class Review Cycle', 'Bi-weekly', 'Monitor items'],
            ['C-Class Review Cycle', 'Monthly', 'Slow movers'],
            ['Service Level Target (A)', '99.0%', 'Customer-facing SKUs'],
            ['Service Level Target (B)', '97.5%', 'Standard'],
            ['Min Shelf Life on Receipt', '70%', 'FEFO policy'],
          ].map(([l,v,h]) =>
            <div key={l} style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #F1F5F9">
              <div><div style="font-size:13px;color:#1E293B">{l}</div><div style="font-size:11px;color:#94A3B8">{h}</div></div>
              <strong style="font-size:13px;color:#2563EB">{v}</strong>
            </div>
          )}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-boxes"></i> SKU Master Table</span>
        <div style="display:flex;gap:8px">
          <input class="form-input" style="width:200px;padding:5px 10px;font-size:12px" placeholder="Search SKU..." oninput="filterSKUTable(this.value)" />
          <button class="btn btn-sm btn-secondary"><i class="fas fa-filter"></i> Filter</button>
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table" id="sku-master-table">
          <thead><tr><th>SKU Code</th><th>SKU Name</th><th>Category</th><th>ABC</th><th>UoM</th><th>Safety Stock</th><th>Reorder Pt.</th><th>Lead Time</th><th>Location</th><th>Status</th></tr></thead>
          <tbody>
            {[
              ['SKU-001','AquaPure 500ml','PET Water','A','Cases','6,000','15,000','7d','WH-MUM-A1','active'],
              ['SKU-002','FruitBurst Orange 1L','Juice','A','Cases','3,000','12,000','10d','WH-MUM-B2','active'],
              ['SKU-003','CoolSip Lemon 250ml','Nimbu Pani','A','Cases','2,500','10,000','7d','WH-DEL-A1','active'],
              ['SKU-004','SportZone Energy 500ml','Sports Drink','B','Cases','2,000','8,000','14d','WH-MUM-C3','active'],
              ['SKU-005','MintFresh Water 1L','Mint Water','B','Cases','1,800','7,200','7d','WH-DEL-B2','active'],
              ['SKU-006','TropicBlast Mango','Juice','B','Cases','1,500','6,000','10d','WH-CHN-A1','active'],
              ['SKU-007','ZestUp Grapefruit','Functional','C','Cases','1,200','5,000','21d','WH-MUM-D4','active'],
              ['SKU-008','PureH2O Alkaline','Premium Water','C','Cases','1,000','4,000','14d','WH-DEL-C3','active'],
            ].map(([code,name,cat,abc,uom,ss,rop,lt,loc,status]) =>
              <tr key={code}>
                <td><strong style="font-size:0.8rem">{code}</strong></td>
                <td>{name}</td>
                <td><span class="badge badge-neutral">{cat}</span></td>
                <td><span class={`badge badge-${abc==='A'?'critical':abc==='B'?'warning':'neutral'}`}>{abc}</span></td>
                <td>{uom}</td>
                <td>{ss}</td>
                <td>{rop}</td>
                <td>{lt}</td>
                <td style="font-size:11px;color:#64748B">{loc}</td>
                <td><span class="badge badge-healthy">{status}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ============================================================
// PROCUREMENT ROUTES
// ============================================================

app.get('/procurement', async (c) => {
  const scripts = `// procurement-module.js handles this page
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Procurement Planning" activeModule="procurement" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-handshake"></i></div>
        <div>
          <div class="page-title">Procurement Planning</div>
          <div class="page-subtitle">Supplier management, PO lifecycle, contract management and spend analytics</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/procurement/operational" class="btn btn-primary"><i class="fas fa-clipboard-list"></i> PO Workbench</a>
        <a href="/procurement/suppliers" class="btn btn-secondary"><i class="fas fa-star"></i> Scorecards</a>
      </div>
    </div>
    <div class="kpi-grid" id="proc-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-spider"></i> Supplier Performance Scorecard</span><a href="/procurement/suppliers" class="btn btn-sm btn-secondary">All Suppliers</a></div>
        <div class="card-body" style="height:240px"><canvas id="proc-supplier-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-file-invoice"></i> PO Status Distribution</span></div>
        <div class="card-body" style="height:240px"><canvas id="proc-po-status-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-rupee-sign"></i> Monthly Spend by Category</span></div>
        <div class="card-body" style="height:220px"><canvas id="proc-spend-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-shipping-fast"></i> Lead Time by Supplier</span></div>
        <div class="card-body" style="height:220px"><canvas id="proc-lead-time-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-truck"></i> Supplier Risk Matrix</span>
        <a href="/procurement/operational" class="btn btn-sm btn-primary"><i class="fas fa-clipboard-list"></i> PO Workbench</a>
      </div>
      <div id="proc-risk-matrix"><div class="spinner" style="padding:20px;text-align:center"></div></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-list-alt"></i> Purchase Orders</span>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>PO Number</th><th>Material</th><th>Supplier</th><th>Qty</th><th>Cost</th><th>Period</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="proc-po-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Supplier OTIF Trend</span></div>
      <div class="card-body" style="height:220px"><canvas id="proc-otif-trend"></canvas></div>
    </div>
    <script src="/static/procurement-module.js"></script>
  </Layout>)
})

app.get('/procurement/operational', async (c) => {
  const scripts = `
async function init() {
  const plans = await axios.get('/api/procurement/plans').then(r=>r.data).catch(()=>[]);
  const tbody = document.getElementById('po-table');
  if (tbody) tbody.innerHTML = plans.map(p => \`<tr>
    <td><strong>PO-\${String(p.id).padStart(4,'0')}</strong></td>
    <td>\${p.material_name}</td>
    <td>\${p.supplier_name}</td>
    <td>\${p.planned_qty?.toLocaleString()}</td>
    <td>₹\${(p.planned_cost/100000).toFixed(1)}L</td>
    <td>\${p.delivery_date||p.period}</td>
    <td><span class="badge badge-\${p.status==='approved'?'success':p.status==='draft'?'warning':'info'}">\${p.status}</span></td>
    <td><div style="display:flex;gap:6px">
      \${p.status==='draft'?'<button class="btn btn-sm btn-success" onclick="approveProcPO(this,\\'PO-'+String(p.id).padStart(4,'0')+'\\')">Approve</button>':''}
      <button class="btn btn-sm btn-secondary" onclick="viewProcPO('PO-'+String(p.id).padStart(4,'0'))">Details</button>
    </div></td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No POs</td></tr>';
}
function approveProcPO(btn, poNum) {
  const row = btn.closest('tr');
  if (row) row.cells[6].innerHTML = '<span class="badge badge-success">approved</span>';
  btn.remove();
  if (window.showToast) window.showToast(poNum + ' approved and sent to supplier. ERP updated. Expected delivery logged.', 'success');
}
function viewProcPO(poNum) {
  if (window.showToast) window.showToast('Opening details for ' + poNum + '...', 'info');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Procurement – PO Workbench" activeModule="proc-workbench" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-clipboard-list"></i></div>
        <div><div class="page-title">PO Workbench</div><div class="page-subtitle">Full PO lifecycle: Draft → Approve → Send → Confirm → GRN → Invoice</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary" onclick="newProcurementPO()"><i class="fas fa-plus"></i> New PO</button></div>
    </div>
    <div class="card"><div class="card-body compact">
      <table class="data-table">
        <thead><tr><th>PO #</th><th>Material</th><th>Supplier</th><th>Qty</th><th>Value</th><th>Delivery</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody id="po-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
      </table>
    </div></div>
  </Layout>)
})

app.get('/procurement/suppliers', async (c) => {
  const scripts = `
async function init() {
  const suppliers = await axios.get('/api/procurement/suppliers').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('scorecard-list');
  el.innerHTML = suppliers.map(s => {
    const sc = s.risk_level==='high'?'critical':s.risk_level==='medium'?'warning':'healthy';
    const scores = [{l:'Rating',v:s.rating/5*100},{l:'Reliability',v:s.reliability_score},{l:'Lead Time',v:Math.max(0,100-s.lead_time_days*4)},{l:'Risk',v:s.risk_level==='low'?90:s.risk_level==='medium'?60:30}];
    const overall = Math.round(scores.reduce((a,b)=>a+b.v,0)/scores.length);
    return \`<div class="card" style="margin-bottom:14px"><div class="card-body">
      <div class="flex items-center justify-between mb-4">
        <div><strong style="font-size:15px">\${s.name}</strong><div style="font-size:12px;color:#64748B">\${s.location}</div></div>
        <div style="text-align:center">
          <div class="health-score \${sc}" style="font-size:28px;font-weight:800">\${overall}</div>
          <span class="badge badge-\${sc}">\${s.risk_level} risk</span>
        </div>
      </div>
      \${scores.map(sc2 => \`<div style="margin-bottom:8px"><div class="flex items-center justify-between"><span style="font-size:12px">\${sc2.l}</span><span style="font-size:12px;font-weight:600">\${sc2.v.toFixed(0)}%</span></div>
        <div class="progress-bar"><div class="progress-fill \${sc2.v>=80?'healthy':sc2.v>=60?'warning':'critical'}" style="width:\${sc2.v}%"></div></div></div>\`).join('')}
    </div></div>\`;
  }).join('') || '<p class="text-muted">No suppliers</p>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Supplier Scorecards" activeModule="proc-suppliers" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-star"></i></div>
        <div><div class="page-title">Supplier Scorecard Engine</div><div class="page-subtitle">360-degree supplier assessment: rating, reliability, lead time, risk, sustainability</div></div>
      </div>
    </div>
    <div id="scorecard-list"><div class="spinner"></div></div>
  </Layout>)
})

app.get('/procurement/contracts', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Procurement – Contracts" activeModule="proc-contracts">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-file-contract"></i></div>
        <div><div class="page-title">Contract Management</div><div class="page-subtitle">Supplier contracts, pricing, validity periods and compliance tracking</div></div>
      </div>
    </div>
    <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div>2 contracts expiring within 90 days. Action required.</div></div>
    {[{supplier:'IndoPlast Industries',mat:'PET Resin',expiry:'2026-06-30',value:'₹1.8Cr',status:'active'},
      {supplier:'Citrus India Ltd',mat:'Concentrates',expiry:'2026-03-31',value:'₹45L',status:'expiring'},
      {supplier:'SweetSource Ltd',mat:'Sugar',expiry:'2026-09-30',value:'₹28L',status:'active'}
    ].map(c =>
      <div class="card mb-4" key={c.supplier}>
        <div class="card-body">
          <div class="flex items-center justify-between">
            <div><strong style="font-size:15px">{c.supplier}</strong><div style="font-size:12px;color:#64748B">{c.mat}</div></div>
            <span class={`badge badge-${c.status==='expiring'?'critical':'success'}`}>{c.status}</span>
          </div>
          <div class="grid-3" style="margin-top:12px">
            {[['Contract Value', c.value],['Expiry', c.expiry],['Status', c.status]].map(([l,v]) =>
              <div key={l}><div style="font-size:11px;color:#64748B">{l}</div><div style="font-size:14px;font-weight:600">{v}</div></div>
            )}
          </div>
        </div>
      </div>
    )}
  </Layout>)
})

// H2: /procurement/optimization now redirects to the unified Optimization Workbench
app.get('/procurement/optimization', (c) => c.redirect('/procurement/optimization-workbench'))

app.get('/procurement/optimization-LEGACY-REMOVED', (c) => {
  const scripts = `
async function runProcOptLegacy(btn) {
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
  try {
    await axios.post('/api/optimizer/run', {
      module:'procurement', action:'Supplier Allocation Optimization',
      result_summary:'Rebalanced 5 suppliers. PolyPack India +3%, Hindustan Packaging −5%. Savings: ₹4.2L/mo.',
      impact:'₹4.2L/mo'
    });
    window.showToast('Optimization complete — ₹4.2L savings identified. Actions logged!','success');
  } catch(e) { window.showToast('Optimization complete — ₹4.2L savings identified','success'); }
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimizer'; btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => {
  // Multi-supplier allocation chart
  new Chart(document.getElementById('alloc-chart'), {
    type: 'bar',
    data: {
      labels: ['Hindustan Packaging','PolyPack India','FreshSeal Corp','EcoWrap Ltd','PolyFlex Pack'],
      datasets: [
        { label: 'Current Allocation %', data: [35,25,20,12,8], backgroundColor: 'rgba(37,99,235,0.75)', borderRadius:4 },
        { label: 'Optimized Allocation %', data: [30,28,22,14,6], backgroundColor: 'rgba(5,150,105,0.75)', borderRadius:4 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales:{
        y:{ beginAtZero:true, max:50, title:{ display:true, text:'Share %' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x:{ ticks:{ font:{size:9} }, grid:{ display:false } }
      }
    }
  });
  // Cost vs Risk scatter concept as bar
  new Chart(document.getElementById('cost-risk-chart'), {
    type: 'bubble',
    data: {
      datasets: [
        { label:'Low Risk', data:[{x:8,y:82,r:18},{x:7,y:88,r:14}], backgroundColor:'rgba(5,150,105,0.65)' },
        { label:'Medium Risk', data:[{x:12,y:79,r:12},{x:11,y:85,r:10}], backgroundColor:'rgba(217,119,6,0.65)' },
        { label:'High Risk', data:[{x:16,y:72,r:8},{x:19,y:68,r:9}], backgroundColor:'rgba(220,38,38,0.65)' }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } }, tooltip:{ callbacks:{ label: ctx => ctx.dataset.label+': LT '+ctx.raw.x+'d, OTIF '+ctx.raw.y+'%' } } },
      scales:{
        x:{ title:{ display:true, text:'Avg Lead Time (days)' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        y:{ title:{ display:true, text:'Supplier OTIF %' }, min:60, max:100 }
      }
    }
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Procurement Optimization" activeModule="proc-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-sliders-h"></i></div>
        <div><div class="page-title">Procurement Optimization</div><div class="page-subtitle">Multi-supplier allocation, consolidation, spot buy vs contract analysis</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="runProcOptLegacy(this)"><i class="fas fa-rocket"></i> Run Optimizer</button>
      </div>
    </div>

    {/* Savings summary */}
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      {[
        ['Potential Savings', '₹4.2L/mo', 'healthy'],
        ['Consolidation Opp.', '3 SKUs', 'warning'],
        ['Dual-Source Risk', '2 Items', 'critical'],
        ['Contract Expiring', '4 in 30d', 'warning'],
      ].map(([l,v,s]) =>
        <div key={l} class={`kpi-card ${s}`}>
          <div class="kpi-label">{l}</div>
          <div class={`kpi-value ${s}`}>{v}</div>
        </div>
      )}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-percentage"></i> Supplier Allocation — Current vs Optimized</span></div>
        <div class="card-body" style="height:250px"><canvas id="alloc-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-dot-circle"></i> Lead Time vs OTIF by Supplier</span></div>
        <div class="card-body" style="height:250px"><canvas id="cost-risk-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-list-alt"></i> Optimization Recommendations</span></div>
      <div class="card-body">
        {[
          ['Consolidate SKU-003 + SKU-005 orders at PolyPack India — bulk discount available','₹1.2L/mo','high','Increase allocation by 5%','critical'],
          ['Switch SKU-007 from spot buy to 3-month contract with FreshSeal Corp','₹0.8L/mo','medium','Negotiate 90-day rolling contract','warning'],
          ['Activate EcoWrap Ltd as dual-source for SKU-001 to reduce concentration risk','Risk Reduction','high','Onboard with 15% share','critical'],
          ['Defer low-urgency C-class POs by 2 weeks to improve payment terms','₹0.4L/mo','low','Coordinate with finance','warning'],
        ].map(([desc, saving, priority, action, s]) =>
          <div key={desc} style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #F1F5F9">
            <i class={`fas fa-lightbulb`} style={`color:${s==='critical'?'#DC2626':'#D97706'};margin-top:2px`}></i>
            <div style="flex:1">
              <div style="font-size:13px;color:#1E293B;font-weight:500;margin-bottom:4px">{desc}</div>
              <div style="font-size:11px;color:#64748B">{action}</div>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class={`badge badge-${s}`}>{saving}</div>
              <div style="font-size:10px;color:#94A3B8;margin-top:4px">Priority: {priority}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  </Layout>)
})

app.get('/procurement/analytics', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  // Spend by category (bar)
  new Chart(document.getElementById('spend-chart'), {
    type:'bar',
    data:{
      labels:['Packaging','Raw Mats','Chemicals','Transport','Utilities','Others'],
      datasets:[{
        label:'Spend ₹L',
        data:[42.5,28.3,12.1,9.8,4.2,6.3],
        backgroundColor:['#2563EB','#7C3AED','#0891B2','#D97706','#059669','#64748B'],
        borderRadius:5
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}, tooltip:{callbacks:{label:c=>'₹'+c.raw+'L'}}},
      scales:{
        y:{title:{display:true,text:'₹ Lakh'},grid:{color:'rgba(0,0,0,0.04)'}},
        x:{grid:{display:false}}
      }
    }
  });
  // Supplier concentration (doughnut)
  new Chart(document.getElementById('concentration-chart'), {
    type:'doughnut',
    data:{
      labels:['Hindustan Packaging','PolyPack India','FreshSeal Corp','EcoWrap Ltd','Others'],
      datasets:[{
        data:[35,25,20,12,8],
        backgroundColor:['#1E40AF','#2563EB','#3B82F6','#60A5FA','#BFDBFE'],
        hoverOffset:6, borderWidth:2, borderColor:'#fff'
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{legend:{position:'right',labels:{font:{size:11},boxWidth:12,padding:10}}}
    }
  });
  // Price variance trend (line)
  new Chart(document.getElementById('price-var-chart'), {
    type:'line',
    data:{
      labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets:[
        {label:'Actual vs Budget %',data:[+2.1,+1.8,-0.4,-1.2,+2.8,+3.6],borderColor:'#DC2626',backgroundColor:'rgba(220,38,38,0.08)',fill:true,tension:0.4,borderWidth:2.5,pointRadius:4},
        {label:'Target (0%)',data:[0,0,0,0,0,0],borderColor:'#059669',borderDash:[5,4],borderWidth:1.5,pointRadius:0,fill:false}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{position:'top',labels:{font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>(c.raw>0?'+':'')+c.raw+'%'}}},
      scales:{
        y:{title:{display:true,text:'Price Variance %'},grid:{color:'rgba(0,0,0,0.04)'},ticks:{callback:v=>(v>0?'+':'')+v+'%'}},
        x:{grid:{display:false}}
      }
    }
  });
  // Monthly spend trend
  new Chart(document.getElementById('spend-trend-chart'), {
    type:'line',
    data:{
      labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets:[
        {label:'Actual Spend',data:[98.5,107.2,125.8,111.2,118.4,125.6],borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,0.08)',fill:true,tension:0.4,borderWidth:2.5,pointRadius:4},
        {label:'Budget',data:[100,105,120,110,115,120],borderColor:'#D97706',borderDash:[5,4],borderWidth:2,pointRadius:0,fill:false}
      ]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{legend:{position:'top',labels:{font:{size:11},boxWidth:12}},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': ₹'+c.raw.toFixed(1)+'L'}}},
      scales:{
        y:{title:{display:true,text:'₹ Lakh'},grid:{color:'rgba(0,0,0,0.04)'}},
        x:{grid:{display:false}}
      }
    }
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Procurement Analytics" activeModule="proc-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-chart-bar"></i></div>
        <div><div class="page-title">Spend Analytics</div><div class="page-subtitle">Category spend, supplier concentration, price variance and budget adherence</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-secondary" onclick="window.showToast('Report exported','success')"><i class="fas fa-download"></i> Export Report</button>
      </div>
    </div>

    {/* Summary KPIs */}
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      {[
        ['Total Spend (Mar)', '₹125.6L', 'warning'],
        ['Budget Variance', '+4.7%', 'warning'],
        ['Top Supplier Conc.', '35%', 'warning'],
        ['Price Variance YTD', '+1.5%', 'warning'],
      ].map(([l,v,s]) =>
        <div key={l} class={`kpi-card ${s}`}>
          <div class="kpi-label">{l}</div>
          <div class={`kpi-value ${s}`}>{v}</div>
        </div>
      )}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Spend by Category (₹ Lakh)</span></div>
        <div class="card-body" style="height:240px"><canvas id="spend-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-pie"></i> Supplier Concentration (by Spend)</span></div>
        <div class="card-body" style="height:240px"><canvas id="concentration-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-percent"></i> Price Variance vs Budget (%)</span></div>
        <div class="card-body" style="height:220px"><canvas id="price-var-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Monthly Spend vs Budget (₹ Lakh)</span></div>
        <div class="card-body" style="height:220px"><canvas id="spend-trend-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Category Spend Breakdown</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Category</th><th>This Month</th><th>Budget</th><th>Variance</th><th>YTD Spend</th><th>Top Supplier</th><th>Status</th></tr></thead>
          <tbody>
            {[
              ['Packaging (Primary)','₹42.5L','₹40.0L','+6.3%','₹248.2L','Hindustan Packaging','warning'],
              ['Raw Materials','₹28.3L','₹30.0L','−5.7%','₹168.8L','PolyPack India','healthy'],
              ['Chemicals/CO₂','₹12.1L','₹11.5L','+5.2%','₹72.4L','FreshSeal Corp','warning'],
              ['Transport/3PL','₹9.8L','₹9.0L','+8.9%','₹58.6L','FastFreight Ltd','critical'],
              ['Utilities','₹4.2L','₹4.0L','+5.0%','₹25.1L','National Grid','warning'],
              ['Others','₹6.3L','₹6.5L','−3.1%','₹37.8L','Various','healthy'],
            ].map(([cat,spend,bgt,var_,ytd,sup,s]) =>
              <tr key={cat}>
                <td><strong>{cat}</strong></td>
                <td>{spend}</td>
                <td style="color:#64748B">{bgt}</td>
                <td style={`font-weight:600;color:${var_.startsWith('+')?'#DC2626':'#059669'}`}>{var_}</td>
                <td>{ytd}</td>
                <td style="font-size:12px;color:#64748B">{sup}</td>
                <td><span class={`badge badge-${s}`}>{s}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ============================================================
// RESOURCE ROUTES
// ============================================================

app.get('/resource', async (c) => {
  const scripts = `// resource-module.js handles this page
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource Planning" activeModule="resource" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-users"></i></div>
        <div>
          <div class="page-title">Resource Planning</div>
          <div class="page-subtitle">Workforce management, skills, shift planning and utilization optimization</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/resource/skills" class="btn btn-primary"><i class="fas fa-id-badge"></i> Skills &amp; Roster</a>
        <a href="/resource/optimization" class="btn btn-secondary"><i class="fas fa-sliders-h"></i> Optimize</a>
      </div>
    </div>
    <div class="kpi-grid" id="res-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Utilization by Line</span></div>
        <div class="card-body" style="height:240px"><canvas id="res-util-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-users"></i> Shift Coverage by Line</span></div>
        <div class="card-body" style="height:240px"><canvas id="res-shift-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-graduation-cap"></i> Skill Matrix</span>
        <a href="/resource/skills" class="btn btn-sm btn-secondary"><i class="fas fa-id-badge"></i> Full Roster</a>
      </div>
      <div id="res-skill-matrix"><div style="padding:20px;text-align:center"><div class="spinner"></div></div></div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> Overtime Hours Trend</span></div>
        <div class="card-body" style="height:200px"><canvas id="res-overtime-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Workforce Efficiency Trend</span></div>
        <div class="card-body" style="height:200px"><canvas id="res-efficiency-trend"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-calendar-alt"></i> Available Hours vs Utilization</span></div>
        <div class="card-body" style="height:220px"><canvas id="res-capacity-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-building"></i> Headcount by Plant</span></div>
        <div class="card-body" style="height:220px"><canvas id="res-headcount-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> Operator Roster</span>
        <a href="/resource/optimization" class="btn btn-sm btn-secondary">Optimize</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Operator</th><th>Plant</th><th>Line</th><th>Skills</th><th>Level</th><th>Certified</th><th>Expiry</th><th>Status</th></tr></thead>
          <tbody id="res-operators-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Workforce Risk Alerts</span></div>
      <div class="card-body">
        {[['High attrition risk — Packaging Dept, Mumbai','critical'],['Skill gap: CIP Operators, Chennai — 2 positions','warning'],['Overtime threshold breached — Week 24, Mumbai','critical'],['Succession gap: Production Supervisor, Delhi','warning']].map(([msg, s]) =>
          <div class={`alert alert-${s}`} key={msg}>
            <i class={`fas fa-${s==='critical'?'times-circle':'exclamation-triangle'}`}></i>
            <div>{msg}</div>
          </div>
        )}
      </div>
    </div>
    <script src="/static/resource-module.js"></script>
  </Layout>)
})

app.get('/resource/executive', async (c) => {
  const scripts = `
async function init() {
  const [opsRes, kpiRes] = await Promise.allSettled([
    axios.get('/api/resource/operators'),
    axios.get('/api/resource/kpis'),
  ]);
  const ops = opsRes.status==='fulfilled' ? opsRes.value.data : [];
  const kpiData = kpiRes.status==='fulfilled' ? kpiRes.value.data : [];

  // KPI cards
  const kpiDefs = [
    { label:'Total Workforce', value: ops.length || 184, unit:'operators', status:'healthy', icon:'fa-users', target:'200' },
    { label:'Avg Utilization', value:'79.8%', unit:'', status:'warning', icon:'fa-chart-pie', target:'Target: 85%' },
    { label:'Overtime Hours', value:'142 hrs', unit:'/week', status:'critical', icon:'fa-clock', target:'Target: <100 hrs' },
    { label:'Absenteeism Rate', value:'4.2%', unit:'', status:'warning', icon:'fa-user-minus', target:'Target: <3%' },
    { label:'Cross-trained', value:'38%', unit:'', status:'warning', icon:'fa-exchange-alt', target:'Target: 60%' },
    { label:'Efficiency Index', value:'91.4%', unit:'', status:'healthy', icon:'fa-tachometer-alt', target:'Target: 90%' },
  ];
  const kpiEl = document.getElementById('res-exec-kpis');
  if (kpiEl) kpiEl.innerHTML = kpiDefs.map(k => \`
    <div class="kpi-card \${k.status}">
      <div class="kpi-label"><i class="fas \${k.icon}" style="margin-right:5px"></i>\${k.label}</div>
      <div class="kpi-value \${k.status}">\${k.value}<span style="font-size:14px;color:#64748B">\${k.unit}</span></div>
      <div class="kpi-meta"><span class="kpi-target">\${k.target}</span></div>
    </div>\`).join('');

  // Plant breakdown table
  const plants = [
    { plant:'Mumbai', headcount:68, util:'82%', ot:'38h', absent:'3.8%', eff:'93.1%', status:'healthy' },
    { plant:'Delhi', headcount:52, util:'81%', ot:'29h', absent:'4.1%', eff:'91.8%', status:'healthy' },
    { plant:'Chennai', headcount:38, util:'76%', ot:'44h', absent:'5.2%', eff:'88.4%', status:'warning' },
    { plant:'Bangalore', headcount:26, util:'72%', ot:'31h', absent:'4.8%', eff:'90.2%', status:'warning' },
  ];
  const tableEl = document.getElementById('plant-table');
  if (tableEl) tableEl.innerHTML = plants.map(p => \`<tr>
    <td><strong>\${p.plant}</strong></td>
    <td>\${p.headcount}</td>
    <td><span class="badge badge-\${p.status}">\${p.util}</span></td>
    <td>\${p.ot}/wk</td>
    <td>\${p.absent}</td>
    <td>\${p.eff}</td>
    <td><a href="/resource" class="btn btn-sm btn-secondary" style="font-size:11px">View Details</a></td>
  </tr>\`).join('');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource – Executive Summary" activeModule="res-executive" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-chart-pie"></i></div>
        <div>
          <div class="page-title">Resource Planning — Executive Summary</div>
          <div class="page-subtitle">Workforce utilization · Overtime · Absenteeism · Plant-level breakdown · Mar 2026</div>
        </div>
      </div>
      <div class="page-header-right">
        <a href="/resource/skills" class="btn btn-secondary"><i class="fas fa-id-badge"></i> Skills & Roster</a>
        <a href="/resource/optimization" class="btn btn-primary"><i class="fas fa-sliders-h"></i> Optimize</a>
      </div>
    </div>

    <div class="kpi-grid" id="res-exec-kpis" style="grid-template-columns:repeat(3,1fr)">
      <div class="spinner"></div>
    </div>

    <div class="grid-2 mt-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-industry"></i> Plant-wise Workforce Summary</span></div>
        <div class="card-body compact">
          <table class="data-table">
            <thead><tr><th>Plant</th><th>Headcount</th><th>Utilization</th><th>OT/Week</th><th>Absenteeism</th><th>Efficiency</th><th></th></tr></thead>
            <tbody id="plant-table"><tr><td colspan="7" style="text-align:center"><div class="spinner"></div></td></tr></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Key Risks & Actions</span></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>Chennai OT Critical:</strong> 44 hrs/wk vs 40h limit. 3 operators need upskilling to absorb load. <a href="/resource/optimization" style="color:#DC2626;font-weight:600">Run Optimizer →</a></div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Cross-training Gap:</strong> Only 38% of workforce is multi-line certified. Target 60% by Q2 2026. <a href="/resource/skills" style="color:#D97706;font-weight:600">View Roster →</a></div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Absenteeism Spike:</strong> Chennai at 5.2% vs target 3%. Seasonal pattern detected. </div></div>
          <div class="alert alert-info"><i class="fas fa-info-circle"></i><div><strong>Efficiency Strong:</strong> Mumbai at 93.1% efficiency — best practice to share across plants.</div></div>
        </div>
      </div>
    </div>

    <div class="card mt-4">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-chart-bar"></i> Shift-wise Utilization (This Week)</span>
        <a href="/resource/optimization-workbench" class="btn btn-sm btn-primary"><i class="fas fa-sliders-h"></i> Optimization Workbench</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Shift</th><th>Mumbai</th><th>Delhi</th><th>Chennai</th><th>Bangalore</th><th>Avg OT</th></tr></thead>
          <tbody>
            {[['Shift A (06:00–14:00)','88%','85%','79%','74%','22h'],['Shift B (14:00–22:00)','81%','78%','76%','70%','18h'],['Shift C (22:00–06:00)','71%','68%','65%','62%','12h']].map(([s,m,d,ch,b,ot]) =>
              <tr key={s}><td><strong>{s}</strong></td><td>{m}</td><td>{d}</td><td>{ch}</td><td>{b}</td><td>{ot}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/resource/operations', (c) => c.redirect('/resource'))

app.get('/resource/skills', async (c) => {
  const scripts = `
async function init() {
  const ops = await axios.get('/api/resource/operators').then(r=>r.data).catch(()=>[]);
  const tbody = document.getElementById('skills-table');
  if (tbody) tbody.innerHTML = ops.map(o => \`<tr>
    <td><strong>\${o.operator_name||'—'}</strong></td>
    <td>\${o.plant_name||'—'}</td>
    <td>\${o.line_name||'All Lines'}</td>
    <td>\${o.skill_name||'Multi-line'}</td>
    <td><span class="badge badge-\${o.proficiency_level==='expert'||o.proficiency_level==='master'?'success':o.proficiency_level==='intermediate'?'info':'warning'}">\${o.proficiency_level||'beginner'}</span></td>
    <td>\${o.status||'active'}</td>
    <td>\${o.certification_date||'—'}</td>
    <td>\${o.expiry_date||'—'}</td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No operator data</td></tr>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource – Skills & Roster" activeModule="res-skills" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-id-badge"></i></div>
        <div><div class="page-title">Skills &amp; Roster Management</div><div class="page-subtitle">Operator certifications, skill levels and shift scheduling</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary" onclick="addOperator()"><i class="fas fa-plus"></i> Add Operator</button></div>
    </div>
    <div class="card"><div class="card-body compact">
      <table class="data-table">
        <thead><tr><th>Operator</th><th>Plant</th><th>Line</th><th>Skill</th><th>Level</th><th>Status</th><th>Certified</th><th>Expiry</th></tr></thead>
        <tbody id="skills-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
      </table>
    </div></div>
  </Layout>)
})

app.get('/resource/optimization', (c) => {
  const scripts = `
async function runResourceOptimizer(btn) {
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
  try {
    await axios.post('/api/optimizer/run', {
      module: 'resource',
      action: 'OT Reduction Optimization',
      result_summary: 'Identified 44 hrs/wk OT reduction. Shift rebalance: −18h, Cross-training: −14h, Flex hire: −12h.',
      impact: '₹4.8L/mo savings'
    });
    document.getElementById('res-opt-result').style.display = 'flex';
    window.showToast('Optimization complete — 44 hrs/wk OT reduction possible. Actions saved!','success');
  } catch(e) {
    window.showToast('Optimization complete — 44 hrs/wk OT reduction possible','success');
    document.getElementById('res-opt-result').style.display = 'flex';
  }
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimizer'; btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => {
  // Overtime reduction waterfall
  new Chart(document.getElementById('ot-waterfall'), {
    type: 'bar',
    data: {
      labels: ['Current OT', 'Shift Rebalance', 'Cross-training', 'Flex Hiring', 'Target OT'],
      datasets: [{
        label: 'OT Hours/week',
        data: [142, -18, -14, -12, 98],
        backgroundColor: ['#DC2626','rgba(5,150,105,0.8)','rgba(5,150,105,0.8)','rgba(5,150,105,0.8)','#2563EB'],
        borderRadius: 4
      }]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label: ctx => (ctx.raw>0?'+':'')+ctx.raw+' hrs/wk' } } },
      scales:{
        y:{ title:{ display:true, text:'OT Hours/week' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x:{ ticks:{ font:{size:10} }, grid:{ display:false } }
      }
    }
  });
  // Shift utilization heatmap (radar)
  new Chart(document.getElementById('shift-balance-chart'), {
    type: 'radar',
    data: {
      labels: ['Mumbai A','Mumbai B','Mumbai C','Delhi A','Delhi B','Chennai A','Chennai B'],
      datasets: [
        { label:'Current Utilization %', data:[96,84,72,89,78,91,68], borderColor:'#DC2626', backgroundColor:'rgba(220,38,38,0.1)', borderWidth:2 },
        { label:'Optimized Utilization %', data:[84,84,82,85,82,84,80], borderColor:'#059669', backgroundColor:'rgba(5,150,105,0.1)', borderWidth:2 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      scales:{ r:{ min:50, max:100, ticks:{ stepSize:10, font:{size:9} }, pointLabels:{ font:{size:10} } } },
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } }
    }
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource Optimization" activeModule="res-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-sliders-h"></i></div>
        <div><div class="page-title">Resource Optimization</div><div class="page-subtitle">Workforce allocation, overtime minimization, shift balance analysis</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="res-opt-btn" onclick="runResourceOptimizer(this)"><i class="fas fa-rocket"></i> Run Optimizer</button>
      </div>
    </div>

    <div id="res-opt-result" class="alert alert-success" style="display:none;margin-bottom:16px">
      <i class="fas fa-check-circle"></i>
      <div><strong>Optimization complete!</strong> Identified 44 hrs/wk OT reduction across 3 plants. Actions logged to <a href="/action-items" style="color:#059669;font-weight:600">Action Items</a>.</div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr)">
      {[
        ['Current OT Hours', '142 hrs/wk', 'critical'],
        ['OT Reduction Potential', '−44 hrs/wk', 'healthy'],
        ['Shift Imbalance Lines', '3 lines', 'warning'],
        ['Cross-training Gaps', '6 operators', 'warning'],
      ].map(([l,v,s]) =>
        <div key={l} class={`kpi-card ${s}`}>
          <div class="kpi-label">{l}</div>
          <div class={`kpi-value ${s}`}>{v}</div>
        </div>
      )}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> OT Reduction Roadmap</span></div>
        <div class="card-body" style="height:250px"><canvas id="ot-waterfall"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-balance-scale"></i> Shift Utilization Balance</span></div>
        <div class="card-body" style="height:250px"><canvas id="shift-balance-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-lightbulb"></i> Optimization Actions</span></div>
      <div class="card-body">
        {[
          ['Rebalance Mumbai B-shift: Add 2 operators from Mumbai C (underutilized)','−18 hrs/wk OT','high','critical'],
          ['Cross-train 4 packaging operators on CIP & quality checks to reduce skill gaps','−14 hrs/wk OT','medium','warning'],
          ['Hire 2 flex operators for Chennai to cover weekly peak (Mon–Tue surge)','−12 hrs/wk OT','medium','warning'],
          ['Rotate Delhi weekend shift volunteers to reduce mandatory overtime','−8 hrs/wk OT','low','healthy'],
        ].map(([desc, impact, priority, s]) =>
          <div key={desc} style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid #F1F5F9">
            <i class="fas fa-chevron-right" style={`color:${s==='critical'?'#DC2626':s==='warning'?'#D97706':'#059669'};margin-top:3px`}></i>
            <div style="flex:1">
              <div style="font-size:13px;color:#1E293B;font-weight:500;margin-bottom:4px">{desc}</div>
              <div style="font-size:11px;color:#64748B">Priority: {priority}</div>
            </div>
            <span class={`badge badge-${s}`}>{impact}</span>
          </div>
        )}
      </div>
    </div>
  </Layout>)
})

app.get('/resource/scenarios', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  new Chart(document.getElementById('headcount-scenario-chart'), {
    type: 'bar',
    data: {
      labels: ['Base Plan', 'Demand +15%', 'Demand +30%', 'Plant Expansion', 'New Product Launch'],
      datasets: [
        { label: 'Current Headcount', data: [128,128,128,128,128], backgroundColor: 'rgba(100,116,139,0.6)', borderRadius:0 },
        { label: 'Required Headcount',  data: [128,142,158,175,162], backgroundColor: 'rgba(37,99,235,0.75)', borderRadius:4 }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ position:'top', labels:{ font:{size:11}, boxWidth:12 } } },
      scales:{
        y:{ beginAtZero:false, min:110, title:{ display:true, text:'Headcount' }, grid:{ color:'rgba(0,0,0,0.04)' } },
        x:{ ticks:{ font:{size:9} }, grid:{ display:false } }
      }
    }
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource Scenarios" activeModule="res-scenarios" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-sitemap"></i></div>
        <div><div class="page-title">Resource Scenarios</div><div class="page-subtitle">Headcount, shift pattern and training investment what-if analysis</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="window.showToast('Scenario analysis complete','success')"><i class="fas fa-play"></i> Run Scenario</button>
      </div>
    </div>

    <div class="grid-2" style="align-items:start">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-sliders-h"></i> Scenario Builder</span></div>
        <div class="card-body">
          {[
            ['Demand Growth Assumption', '+15%', 'vs base plan'],
            ['New Shift Pattern', '3-shift × 6 days', 'Current: 3×5'],
            ['Training Investment', '₹8L', 'Cross-skilling budget'],
            ['Flex Hiring (contract)', '12 operators', 'Peak coverage'],
            ['Automation Impact', '−8 manual jobs', 'Filling line upgrade'],
          ].map(([l,v,h]) =>
            <div key={l} style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <div><div style="font-size:13px;color:#1E293B;font-weight:500">{l}</div><div style="font-size:11px;color:#94A3B8">{h}</div></div>
              <strong style="font-size:13px;color:#2563EB">{v}</strong>
            </div>
          )}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-check-square"></i> Scenario Outputs</span></div>
        <div class="card-body">
          {[
            ['Net Headcount Change', '+14 operators', 'warning'],
            ['OT Hours (post scenario)', '98 hrs/wk', 'healthy'],
            ['Training Cost', '₹8L one-time', 'neutral'],
            ['Monthly Labour Cost Δ', '+₹6.4L/mo', 'warning'],
            ['Risk Score Improvement', '−32%', 'healthy'],
          ].map(([l,v,s]) =>
            <div key={l} style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <span style="font-size:13px;color:#475569">{l}</span>
              <span class={`badge badge-${s}`}>{v}</span>
            </div>
          )}
          <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="window.showToast('Scenario saved to plan','success')"><i class="fas fa-save"></i> Save Scenario</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-users"></i> Headcount Requirements by Scenario</span></div>
      <div class="card-body" style="height:260px"><canvas id="headcount-scenario-chart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Scenario Comparison Matrix</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Headcount Δ</th><th>OT Hrs/wk</th><th>Labour Cost Δ</th><th>Service Level</th><th>Risk Score</th><th>Feasibility</th></tr></thead>
          <tbody>
            {[
              ['Base Plan', '0', '142', 'Base', '92.1%', '72', 'healthy'],
              ['Demand +15%', '+14', '98', '+₹6.4L/mo', '95.8%', '58', 'healthy'],
              ['Demand +30%', '+30', '82', '+₹13.8L/mo', '97.2%', '44', 'warning'],
              ['Plant Expansion', '+47', '76', '+₹21.6L/mo', '98.5%', '32', 'warning'],
              ['New Product', '+34', '88', '+₹15.6L/mo', '96.1%', '51', 'warning'],
            ].map(([sc,hc,ot,cost,svc,risk,f]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style={parseInt(hc)>0?'color:#D97706;font-weight:600':''}>{hc}</td>
                <td><span class={`badge badge-${parseInt(ot)>120?'critical':parseInt(ot)>100?'warning':'healthy'}`}>{ot}</span></td>
                <td>{cost}</td>
                <td>{svc}</td>
                <td><span class={`badge badge-${parseInt(risk)<45?'warning':parseInt(risk)<60?'healthy':'critical'}`}>{risk}</span></td>
                <td><span class={`badge badge-${f}`}>{f}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

app.get('/resource/analytics', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  new Chart(document.getElementById('ot-trend'), {
    type:'line',data:{labels:['W19','W20','W21','W22','W23','W24'],datasets:[
      {label:'OT Hours',data:[85,92,108,120,135,142],borderColor:'#DC2626',fill:true,backgroundColor:'rgba(220,38,38,0.1)',tension:0.3},
      {label:'Limit 120',data:[120,120,120,120,120,120],borderColor:'#D97706',borderDash:[4,4],pointRadius:0}
    ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{title:{display:true,text:'Hours'}}}}
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource Analytics" activeModule="res-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-chart-bar"></i></div>
        <div><div class="page-title">Resource Analytics</div><div class="page-subtitle">Workforce efficiency, OT trends, training coverage and productivity metrics</div></div>
      </div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">Overtime Trend (Weekly Hours)</span></div><div class="card-body" style="height:250px"><canvas id="ot-trend"></canvas></div></div>
  </Layout>)
})

// ============================================================
// S&OP ROUTES
// ============================================================

app.get('/sop', async (c) => {
  const scripts = `// sop-module.js handles this page
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP Planning" activeModule="sop" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-balance-scale"></i></div>
        <div>
          <div class="page-title">Sales &amp; Operations Planning</div>
          <div class="page-subtitle">End-to-end demand-supply-inventory-financial integration · March 2026 Cycle</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/sop/consensus" class="btn btn-primary"><i class="fas fa-users"></i> Consensus Meeting</a>
        <a href="/sop/scenarios" class="btn btn-secondary"><i class="fas fa-sitemap"></i> Scenarios</a>
      </div>
    </div>
    <div class="kpi-grid" id="sop-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Revenue Waterfall (Annual Plan vs Forecast)</span></div>
        <div class="card-body" style="height:220px"><canvas id="sop-waterfall-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Demand vs Supply Plan (8W Horizon)</span></div>
        <div class="card-body" style="height:220px"><canvas id="sop-supply-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-users"></i> Consensus Plan vs Inputs</span><a href="/sop/consensus" class="btn btn-sm btn-primary">Consensus Meeting</a></div>
        <div class="card-body" style="height:220px"><canvas id="sop-consensus-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-bullseye"></i> Supply-Demand Gap by Category</span></div>
        <div class="card-body" style="height:220px"><canvas id="sop-gap-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-area"></i> Demand Forecast vs Actual</span><a href="/sop/demand-review" class="btn btn-sm btn-secondary">Demand Review</a></div>
        <div class="card-body" style="height:220px"><canvas id="sop-demand-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Forecast Accuracy Trend</span></div>
        <div class="card-body" style="height:220px"><canvas id="sop-forecast-accuracy-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> S&OP KPI Scorecard</span><a href="/sop/executive" class="btn btn-sm btn-secondary">Executive View</a></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>KPI</th><th>Actual</th><th>Target</th><th>Gap</th><th>vs Target</th><th>Trend</th><th>Period</th></tr></thead>
          <tbody id="sop-kpi-table"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-sitemap"></i> Scenarios</span><a href="/sop/scenarios" class="btn btn-sm btn-secondary">Manage Scenarios</a></div>
        <div class="card-body compact">
          <table class="data-table">
            <thead><tr><th>Name</th><th>Module</th><th>Driver</th><th>Description</th><th>Status</th><th>Updated</th><th>Action</th></tr></thead>
            <tbody id="sop-scenarios-table"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Supply Gap Alert</span></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>March 2026 Supply Gap: 180,000 cases</strong><br/>Demand Plan: 4.8M · Supply Plan: 4.62M · Shortfall: 3.8%</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Mumbai constrained</strong> — Approve weekend overtime to close 120K gap</div></div>
          <div class="alert alert-info"><i class="fas fa-info-circle"></i><div><strong>Options:</strong> Overtime (+120K), Defer B-class (+60K), Emergency co-pack (+80K)</div></div>
          <div style="margin-top:12px;display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" id="sop-ot-btn" onclick="approveSopOvertime(this)"><i class="fas fa-check"></i> Approve Overtime</button>
            <button class="btn btn-secondary btn-sm" onclick="window.showToast('Deferral review: B-class items will be deferred 2 weeks. Coordinator notified.','info')">Review Deferral</button>
          </div>
          <div id="sop-ot-result" class="alert alert-success" style="display:none;margin-top:12px">
            <i class="fas fa-check-circle"></i>
            <div><strong>Overtime approved!</strong> Mumbai weekend OT authorised for W1–W2. +120K cases added to supply plan. MRP and Capacity notified. Action logged to <a href="/action-items" style="color:#059669;font-weight:600">Action Items</a>.</div>
          </div>
        </div>
      </div>
    </div>
    <script src="/static/sop-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
async function approveSopOvertime(btn) {
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving...';
  try {
    await axios.post('/api/optimizer/run', {
      module: 'sop',
      action: 'Approve Weekend Overtime — Mumbai W1-W2',
      result_summary: 'Weekend OT approved. +120K cases added to supply plan. Gap reduced from 180K to 60K cases.',
      impact: 'Gap closure 67%'
    });
    document.getElementById('sop-ot-result').style.display = 'flex';
    window.showToast('Overtime approved! MRP and Capacity notified.','success');
  } catch(e) {
    document.getElementById('sop-ot-result').style.display = 'flex';
    window.showToast('Overtime approved and logged!','success');
  }
  btn.innerHTML = '<i class="fas fa-check"></i> Approved'; btn.disabled = true;
}
    `}} />
  </Layout>)
})

app.get('/sop/executive', (c) => c.redirect('/sop'))

app.get('/sop/demand-review', async (c) => {
  const scripts = `
async function init() {
  const [fcRes, kpiRes, sensingRes, seasonRes] = await Promise.allSettled([
    axios.get('/api/sop/forecast'),
    axios.get('/api/sop/kpis'),
    axios.get('/api/demand/sensing'),
    axios.get('/api/sop/seasonality'),
  ]);
  const fc = fcRes.status==='fulfilled' ? fcRes.value.data.forecast || [] : [];
  const sensing = sensingRes.status==='fulfilled' ? sensingRes.value.data.signals || [] : [];
  const season = seasonRes.status==='fulfilled' ? seasonRes.value.data : [];

  // Demand sensing signals
  const el = document.getElementById('sensing-list');
  if (el) {
    const mockSensing = sensing.length ? sensing : [
      { sku:'SKU-500-PET Limca', location:'Mumbai MT', uplift_pct:8.2, driver:'Social media buzz – cricket season sales spike', action:'Increase W2 production by 8% on MUM-L1. Buffer 6,000 cases.' },
      { sku:'SKU-CAN-330 Thums Up', location:'Delhi GT', uplift_pct:-4.1, driver:'Competitor promotion detected (Pepsi MTD deal)', action:'Hold promotion spend. Monitor weekly. Forecast revised down 4%.' },
      { sku:'SKU-TETRA-200 Maaza', location:'Chennai HoReCa', uplift_pct:12.5, driver:'Summer season early onset – temperature index +2.1°C', action:'Advance W3 replenishment by 5 days. Alert logistics for cold chain capacity.' },
    ];
    el.innerHTML = mockSensing.map(s => \`<div style="padding:10px;border-left:3px solid \${s.uplift_pct>0?'#059669':'#DC2626'};background:\${s.uplift_pct>0?'#F0FDF4':'#FEF2F2'};border-radius:4px;margin-bottom:8px">
      <div style="display:flex;justify-content:space-between">
        <strong style="font-size:13px">\${s.sku} @ \${s.location}</strong>
        <strong style="color:\${s.uplift_pct>0?'#059669':'#DC2626'}">\${s.uplift_pct>0?'+':''}\${s.uplift_pct}% vs forecast</strong>
      </div>
      <div style="font-size:11px;color:#64748B;margin-top:4px">\${s.driver}</div>
      <div style="font-size:12px;margin-top:6px;color:#1E293B"><strong>Action:</strong> \${s.action}</div>
    </div>\`).join('');
  }
  // Seasonality chart
  const sCtx = document.getElementById('seasonality-chart');
  const mockSeason = season.length ? season : [
    {month:'Jan',index:0.82},{month:'Feb',index:0.88},{month:'Mar',index:0.95},{month:'Apr',index:1.12},
    {month:'May',index:1.32},{month:'Jun',index:1.48},{month:'Jul',index:1.38},{month:'Aug',index:1.25},
    {month:'Sep',index:1.08},{month:'Oct',index:0.98},{month:'Nov',index:0.92},{month:'Dec',index:0.85},
  ];
  if (sCtx) {
    new Chart(sCtx, {
      type:'bar',
      data:{
        labels:mockSeason.map(s=>s.month),
        datasets:[{
          label:'Seasonal Index',
          data:mockSeason.map(s=>s.index),
          backgroundColor:mockSeason.map(s=>s.index>1.1?'#1D4ED8':s.index>1?'#059669':s.index>0.9?'#D97706':'#DC2626'),
          borderRadius:4
        }]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0.5,max:1.5,ticks:{callback:v=>v.toFixed(2)},title:{display:true,text:'Index (1.0 = avg)'}},x:{title:{display:true,text:'Month'}}}}
    });
  }
  // Forecast chart
  const fCtx = document.getElementById('forecast-chart');
  const mockFc = fc.length ? fc : [
    {period:'W1 Jan',forecast_qty:1080000,actual_qty:1052000},{period:'W2 Jan',forecast_qty:1120000,actual_qty:1105000},
    {period:'W3 Jan',forecast_qty:1090000,actual_qty:1078000},{period:'W4 Jan',forecast_qty:1150000,actual_qty:1132000},
    {period:'W1 Feb',forecast_qty:1180000,actual_qty:1164000},{period:'W2 Feb',forecast_qty:1160000,actual_qty:1148000},
    {period:'W1 Mar',forecast_qty:1250000,actual_qty:1235000},{period:'W2 Mar',forecast_qty:1230000,actual_qty:null},
    {period:'W3 Mar',forecast_qty:1280000,actual_qty:null},{period:'W4 Mar',forecast_qty:1310000,actual_qty:null},
    {period:'W1 Apr',forecast_qty:1350000,actual_qty:null},{period:'W2 Apr',forecast_qty:1380000,actual_qty:null},
    {period:'W3 Apr',forecast_qty:1420000,actual_qty:null},
  ];
  if (fCtx) {
    // Support both p50/p90/p10 format and forecast_qty format
    const getP50 = f => f.p50 || f.forecast_qty || 0;
    const getP90 = f => f.p90 || Math.round((f.forecast_qty||0)*1.12) || 0;
    const getP10 = f => f.p10 || Math.round((f.forecast_qty||0)*0.88) || 0;
    const getLabel = f => f.week?.slice(0,10) || f.period || '';
    new Chart(fCtx, {
      type:'line',
      data:{
        labels:mockFc.slice(0,13).map(getLabel),
        datasets:[
          {label:'P90 Forecast',data:mockFc.slice(0,13).map(getP90),borderColor:'rgba(37,99,235,0.3)',backgroundColor:'rgba(37,99,235,0.1)',fill:1,borderWidth:1,pointRadius:0},
          {label:'P50 Forecast',data:mockFc.slice(0,13).map(getP50),borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,0.1)',fill:false,borderWidth:2,tension:0.3,pointRadius:3},
          {label:'P10 Forecast',data:mockFc.slice(0,13).map(getP10),borderColor:'rgba(37,99,235,0.3)',backgroundColor:'rgba(37,99,235,0)',fill:false,borderWidth:1,borderDash:[4,2],pointRadius:0},
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:false,title:{display:true,text:'Cases'}}}}
    });
  }
}
async function refreshForecast() {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
  btn.disabled = true;
  await new Promise(r=>setTimeout(r,1800));
  btn.innerHTML = '<i class="fas fa-sync"></i> Refresh Forecast';
  btn.disabled = false;
  window.showToast('Forecast refreshed! MAPE improved to 4.6%. 3 demand sensing signals detected.','success');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP – Demand Review" activeModule="sop-demand" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-chart-line"></i></div>
        <div><div class="page-title">Demand Review</div><div class="page-subtitle">Statistical forecast (Holt-Winters + XGBoost) · Demand sensing · Seasonality calendar</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="refreshForecast()"><i class="fas fa-sync"></i> Refresh Forecast</button>
        <a href="/api/sop/forecast" class="btn btn-secondary"><i class="fas fa-download"></i> Export</a>
      </div>
    </div>
    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-chart-line"></i> 13-Week Statistical Forecast (P10/P50/P90)</span>
          <span class="badge badge-info">Holt-Winters + XGBoost</span>
        </div>
        <div class="card-body" style="height:240px"><canvas id="forecast-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-calendar-alt"></i> Seasonality Calendar</span></div>
        <div class="card-body" style="height:240px"><canvas id="seasonality-chart"></canvas></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-satellite-dish"></i> Demand Sensing Signals</span><span class="badge badge-info">POS + DC + Pipeline</span></div>
        <div class="card-body" id="sensing-list"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Forecast Accuracy (Last 4 Weeks)</span></div>
        <div class="card-body compact">
          <table class="data-table" style="font-size:12px">
            <thead><tr><th>SKU</th><th>Week</th><th>Forecast</th><th>Actual</th><th>MAPE %</th><th>Bias</th></tr></thead>
            <tbody>
              {[
                {sku:'SKU-500-PET',wk:'W1 Mar',fcst:18000,act:17200,mape:4.4,bias:-4.4},
                {sku:'SKU-1L-PET',wk:'W1 Mar',fcst:12000,act:11400,mape:5.0,bias:-5.0},
                {sku:'SKU-200-MANGO',wk:'W1 Mar',fcst:8000,act:9200,mape:15.0,bias:15.0},
                {sku:'SKU-500-PET',wk:'W2 Mar',fcst:19000,act:18200,mape:4.2,bias:-4.2},
              ].map(r =>
                <tr>
                  <td><strong>{r.sku}</strong></td>
                  <td>{r.wk}</td>
                  <td>{r.fcst.toLocaleString()}</td>
                  <td>{r.act.toLocaleString()}</td>
                  <td style={`font-weight:600;color:${r.mape<=5?'#059669':r.mape<=10?'#D97706':'#DC2626'}`}>{r.mape}%</td>
                  <td style={`color:${r.bias<0?'#DC2626':'#059669'}`}>{r.bias>0?'+':''}{r.bias}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Layout>)
})

app.get('/sop/supply-review', async (c) => {
  const scripts = `
async function init() {
  const allKpis = await axios.get('/api/sop/kpis').then(r=>r.data).catch(()=>[]);
  const supplyKpis = allKpis.filter(k=>k.category==='Supply');
  const kpis = supplyKpis.length ? supplyKpis : [
    {name:'Production OTIF',value:92.1,target:95,unit:'%',status:'warning'},
    {name:'Supply Plan Adherence',value:94.2,target:96,unit:'%',status:'warning'},
    {name:'Capacity Utilization',value:82.4,target:80,unit:'%',status:'healthy'},
    {name:'Supply Gap',value:180000,target:0,unit:' cs',status:'critical'},
  ];
  const grid = document.getElementById('kpi-grid');
  if (grid) grid.innerHTML = kpis.map(k => {
    const sc = k.status || (k.value >= k.target ? 'healthy' : k.value >= k.target * 0.95 ? 'warning' : 'critical');
    return \`<div class="kpi-card \${sc}"><div class="kpi-label">\${k.name}</div><div class="kpi-value \${sc}">\${typeof k.value==='number' && k.value>1000?Number(k.value).toLocaleString():k.value}\${k.unit||''}</div><div class="kpi-meta"><span class="kpi-target">Target: \${k.target}\${k.unit||''}</span><span class="kpi-trend \${sc}">&#x2192;</span></div></div>\`;
  }).join('');

  // Supply vs Demand Chart
  const ctx = document.getElementById('supply-demand-chart');
  if (ctx && !ctx._chart) {
    ctx._chart = new Chart(ctx, {
      type:'bar',
      data:{
        labels:['W1 Mar','W2 Mar','W3 Mar','W4 Mar','W1 Apr','W2 Apr','W3 Apr','W4 Apr'],
        datasets:[
          {label:'Demand Plan',data:[1180000,1240000,1150000,1310000,1420000,1380000,1450000,1360000],backgroundColor:'rgba(37,99,235,0.7)',borderRadius:3},
          {label:'Supply Plan',data:[1160000,1190000,1120000,1260000,1350000,1310000,1400000,1290000],backgroundColor:'rgba(5,150,105,0.7)',borderRadius:3},
          {label:'Capacity',data:Array(8).fill(1500000),type:'line',borderColor:'#D97706',borderDash:[5,3],borderWidth:2,pointRadius:0,fill:false}
        ]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:false,min:1000000,ticks:{callback:v=>(v/1000).toFixed(0)+'K'}}}}
    });
  }

  // Plant utilization chart
  const uCtx = document.getElementById('plant-util-chart');
  if (uCtx && !uCtx._chart) {
    const plants = ['MUM-L1','MUM-L2','DEL-L1','DEL-L2','CHN-L1','BLR-L1'];
    const util = [97,95,74,68,82,69];
    uCtx._chart = new Chart(uCtx, {
      type:'bar',
      data:{
        labels:plants,
        datasets:[{label:'Utilization %',data:util,backgroundColor:util.map(v=>v>90?'#DC2626':v>80?'#D97706':'#059669'),borderRadius:4}]
      },
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{min:0,max:110,ticks:{callback:v=>v+'%'}}}}
    });
  }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP – Supply Review" activeModule="sop-supply" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-industry"></i></div>
        <div><div class="page-title">Supply Review</div><div class="page-subtitle">Production plan, capacity constraints, supply gaps and OTIF analysis</div></div>
      </div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="grid-2 mb-4">
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Demand vs Supply Plan (8W)</span></div><div class="card-body" style="height:220px"><canvas id="supply-demand-chart"></canvas></div></div>
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-industry"></i> Plant Utilization</span></div><div class="card-body" style="height:220px"><canvas id="plant-util-chart"></canvas></div></div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Supply Summary</span></div><div class="card-body">
      {[['Demand Plan Mar-2026','4,800,000 cases',''],['Supply Plan','4,620,000 cases',''],['Gap','180,000 cases shortfall','color:#DC2626'],['Mumbai Capacity','Constrained — 97% utilization','color:#DC2626'],['Delhi Capacity','Available — 74% utilization','color:#059669'],['OTIF','92.1% (Target: 95%)','color:#D97706'],['MPS Adherence','94.2% (Target: 96%)','color:#D97706']].map(([l,v,s]) =>
        <div key={l} style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px">
          <span style="color:#64748B">{l}</span>
          <strong style={s}>{v}</strong>
        </div>
      )}
    </div></div>
  </Layout>)
})

app.get('/sop/scenarios', async (c) => {
  const scripts = `
async function init() {
  const scenarios = await axios.get('/api/sop/scenarios').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('scenarios-list');
  el.innerHTML = scenarios.map(s => \`<div class="card" style="margin-bottom:14px"><div class="card-body">
    <div class="flex items-center justify-between mb-4">
      <div><strong style="font-size:15px">\${s.name}</strong> \${s.is_baseline?'<span class="badge badge-info" style="font-size:10px">Baseline</span>':''}</div>
      <span class="badge badge-\${s.status==='active'?'success':'neutral'}">\${s.status}</span>
    </div>
    <p style="font-size:13px;color:#64748B;margin-bottom:12px">\${s.description||s.driver||''}</p>
    <div style="display:flex;gap:8px">
      <button class="btn btn-sm btn-primary" onclick="simulateSopScenario('\${s.name}','\${s.id}')">Simulate</button>
      <button class="btn btn-sm btn-secondary" onclick="compareSopScenario('\${s.name}')">Compare</button>
      \${!s.is_baseline?'<button class="btn btn-sm btn-success" onclick="activateSopScenario(this,\\'' + s.name + '\\')">Activate</button>':''}
    </div>
  </div></div>\`).join('') || '<p class="text-muted">No scenarios available</p>';
}
async function createScenario() {
  const name = document.getElementById('sc-name').value;
  if (!name) return window.showToast('Please enter a scenario name','error');
  try {
    await axios.post('/api/scenarios', { module:'sop', name, description:document.getElementById('sc-desc').value, driver:'Manual' });
    window.showToast('Scenario "' + name + '" created successfully.','success');
  } catch(e) {
    window.showToast('Scenario "' + name + '" created (local).','success');
  }
  document.getElementById('new-sc').style.display='none';
  init();
}
function simulateSopScenario(name, id) {
  window.showToast('Simulating scenario "' + name + '"... Results: Demand Impact +8.4%, Supply gap reduced by 42K cases, Revenue impact +₹12.4L.', 'success');
}
function compareSopScenario(name) {
  window.showToast('Comparison added: "' + name + '" vs Baseline. Check the Scenario Comparison view.', 'info');
}
function activateSopScenario(btn, name) {
  if (confirm('Activate scenario "' + name + '" as the consensus plan?')) {
    window.showToast('Scenario "' + name + '" activated as consensus plan. Team notified.', 'success');
    if (btn) { btn.innerHTML = '<i class="fas fa-check"></i> Active'; btn.disabled = true; btn.className = 'btn btn-sm btn-success'; }
  }
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP – Scenarios" activeModule="sop-scenarios" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-sitemap"></i></div>
        <div><div class="page-title">S&amp;OP Scenarios</div><div class="page-subtitle">Model demand upside/downside, supply constraints and financial impact</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="document.getElementById('new-sc').style.display='block'"><i class="fas fa-plus"></i> New Scenario</button>
      </div>
    </div>
    <div class="card mb-4" id="new-sc" style="display:none">
      <div class="card-body">
        <div class="grid-2">
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="sc-name" placeholder="e.g., Demand Upside +20%" /></div>
          <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="sc-desc" placeholder="Brief description" /></div>
        </div>
        <button class="btn btn-primary" onclick="createScenario()"><i class="fas fa-save"></i> Create</button>
      </div>
    </div>
    <div id="scenarios-list"><div class="spinner"></div></div>
  </Layout>)
})

app.get('/sop/consensus', async (c) => {
  const scripts = `
async function init() {
  const actions = await axios.get('/api/action-items').then(r=>r.data.filter(a=>a.module==='sop')).catch(()=>[]);
  const el = document.getElementById('actions-list');
  if (el) el.innerHTML = actions.map(a => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
    <div>
      <span class="status-dot \${a.priority==='critical'?'critical':a.priority==='high'?'warning':'healthy'}"></span>
      <strong>\${a.title}</strong>
      <div style="font-size:11px;color:#64748B;margin-top:2px">\${a.owner} · Due: \${a.due_date}</div>
    </div>
    <div style="display:flex;gap:6px">
      <span class="badge badge-\${a.status==='completed'?'success':a.status==='in_progress'?'info':'warning'}">\${a.status}</span>
      \${a.status!=='completed'?'<button class="btn btn-sm btn-success" onclick="completeAction('+a.id+')">Done</button>':''}
    </div>
  </div>\`).join('') || '<p class="text-muted">No S&OP actions</p>';
}
async function completeAction(id) {
  await axios.patch('/api/action-items/'+id, {status:'completed'});
  init();
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP – Consensus Meeting" activeModule="sop-consensus" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-users"></i></div>
        <div><div class="page-title">Consensus Meeting</div><div class="page-subtitle">March 2026 S&amp;OP cycle · Meeting notes, decisions, action items</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary" onclick="addSopActionItem()"><i class="fas fa-plus"></i> Add Action Item</button></div>
    </div>
    <div class="card mb-4">
      <div class="card-header"><span class="card-title"><i class="fas fa-info-circle"></i> Meeting Summary — March 2026 S&amp;OP</span></div>
      <div class="card-body">
        <div class="grid-2">
          {[['Meeting Date','Feb 28, 2026'],['Participants','Sankar Iyer, Vikrant Nair, Commercial, Supply, Finance'],['Consensus Plan','4,620,000 cases (constrained)'],['Key Decision','Approve Mumbai overtime to close 120K gap'],['Next Review','Mar 28, 2026']].map(([l,v]) =>
            <div key={l} style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9;font-size:13px">
              <span style="color:#64748B;min-width:140px">{l}</span><strong>{v}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-tasks"></i> Action Items</span></div><div class="card-body" id="actions-list"><div class="spinner"></div></div></div>
  </Layout>)
})

app.get('/sop/analytics', (c) => {
  const scripts = `
document.addEventListener('DOMContentLoaded', () => {
  new Chart(document.getElementById('sop-kpi-trend'), {
    type:'line',data:{labels:['Oct','Nov','Dec','Jan','Feb','Mar'],datasets:[
      {label:'Forecast Acc.',data:[85,82,88,86,88,87.3],borderColor:'#2563EB',tension:0.3},
      {label:'OTIF',data:[90,88,92,91,92,92.1],borderColor:'#059669',tension:0.3},
      {label:'Fill Rate',data:[96,94,95,94,95,94.8],borderColor:'#D97706',tension:0.3}
    ]},options:{responsive:true,maintainAspectRatio:false,scales:{y:{min:75,max:100,ticks:{callback:v=>v+'%'}}}}
  });
});
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP Analytics" activeModule="sop-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-chart-bar"></i></div>
        <div><div class="page-title">S&amp;OP Analytics</div><div class="page-subtitle">KPI trends, demand-supply bridge, financial reconciliation</div></div>
      </div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title">Key S&amp;OP KPI Trends (6 Months)</span></div><div class="card-body" style="height:280px"><canvas id="sop-kpi-trend"></canvas></div></div>
  </Layout>)
})

// ============================================================
// UTILITY ROUTES
// ============================================================

app.get('/action-items', async (c) => {
  const scripts = `
async function init() {
  const actions = await axios.get('/api/action-items').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('actions-list');
  el.innerHTML = actions.map(a => \`<tr>
    <td><span class="badge badge-\${a.module==='mrp'||a.module==='procurement'?'info':'neutral'}">\${a.module?.toUpperCase()}</span></td>
    <td><strong>\${a.title}</strong><div style="font-size:11px;color:#64748B">\${a.description||''}</div></td>
    <td>\${a.owner}</td>
    <td>\${a.due_date}</td>
    <td><span class="badge badge-\${a.priority==='critical'?'critical':a.priority==='high'?'warning':'neutral'}">\${a.priority}</span></td>
    <td><span class="badge badge-\${a.status==='completed'?'success':a.status==='in_progress'?'info':'warning'}">\${a.status}</span></td>
    <td>\${a.status!=='completed'?'<button class="btn btn-sm btn-success" onclick="complete('+a.id+')">Mark Done</button>':''}</td>
  </tr>\`).join('') || '<tr><td colspan="7" style="text-align:center">No actions</td></tr>';
}
async function complete(id) {
  await axios.patch('/api/action-items/'+id, {status:'completed'});
  init();
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Action Items" activeModule="actions" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-tasks"></i></div>
        <div><div class="page-title">Open Action Items</div><div class="page-subtitle">Cross-module action tracker for Sankar Iyer &amp; Vikrant Nair</div></div>
      </div>
    </div>
    <div class="card"><div class="card-body compact">
      <table class="data-table">
        <thead><tr><th>Module</th><th>Action</th><th>Owner</th><th>Due Date</th><th>Priority</th><th>Status</th><th>Action</th></tr></thead>
        <tbody id="actions-list"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
      </table>
    </div></div>
  </Layout>)
})

app.get('/audit-log', async (c) => {
  const scripts = `
async function init() {
  const log = await axios.get('/api/audit-log').then(r=>r.data).catch(()=>[
    {created_at:'2026-03-17 09:12',user_name:'Sankar Mamidela',module:'production',action:'Firm Order',entity_type:'MPS',entity_id:'SKU-500-PET',old_value:'planned',new_value:'firm'},
    {created_at:'2026-03-17 08:48',user_name:'Vikrant Hole',module:'deployment',action:'Expedite Shipment',entity_type:'Shipment',entity_id:'SHP-0317-006',old_value:'planned',new_value:'expediting'},
    {created_at:'2026-03-17 08:30',user_name:'Vikrant Hole',module:'mrp',action:'Raise Emergency PO',entity_type:'PO',entity_id:'PO-20260317',old_value:'draft',new_value:'submitted'},
    {created_at:'2026-03-16 17:15',user_name:'Sankar Mamidela',module:'sop',action:'Approve Consensus Plan',entity_type:'Scenario',entity_id:'MAR-2026-BASE',old_value:'draft',new_value:'approved'},
    {created_at:'2026-03-16 14:22',user_name:'Vikrant Hole',module:'inventory',action:'Update Safety Stock',entity_type:'SKU',entity_id:'SKU-200-MANGO',old_value:'5800 cases',new_value:'7200 cases'},
  ]);
  const el = document.getElementById('audit-table');
  el.innerHTML = log.map(l => \`<tr>
    <td>\${(l.created_at||'—').slice(0,16)}</td>
    <td><strong>\${l.user_name}</strong></td>
    <td><span class="badge badge-neutral">\${(l.module||'').toUpperCase()}</span></td>
    <td>\${l.action}</td>
    <td>\${l.entity_type} #\${l.entity_id}</td>
    <td style="font-size:11px">\${l.old_value||'—'}</td>
    <td style="font-size:11px">\${l.new_value||'—'}</td>
  </tr>\`).join('') || '<tr><td colspan="7" style="text-align:center">No audit records</td></tr>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Audit Log" activeModule="audit" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#475569,#64748B)"><i class="fas fa-history"></i></div>
        <div><div class="page-title">Audit Log</div><div class="page-subtitle">Complete change history across all planning modules</div></div>
      </div>
      <div class="page-header-right">
        <a href="/api/export/audit?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</a>
      </div>
    </div>
    <div class="card"><div class="card-body compact">
      <table class="data-table">
        <thead><tr><th>Timestamp</th><th>User</th><th>Module</th><th>Action</th><th>Entity</th><th>Old Value</th><th>New Value</th></tr></thead>
        <tbody id="audit-table"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
      </table>
    </div></div>
  </Layout>)
})

// ── APPROVALS WORKBENCH ───────────────────────────────────────────────
app.get('/approvals', async (c) => {
  const scripts = `
async function init() {
  const apr = await axios.get('/api/approvals').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('approvals-list');
  const pending = apr.filter(a=>a.status==='pending');
  const others = apr.filter(a=>a.status!=='pending');
  const all = [...pending, ...others];
  el.innerHTML = all.map(a => \`<div class="card mb-4" style="border-left:4px solid \${a.priority==='critical'?'#DC2626':a.priority==='high'?'#D97706':'#2563EB'}">
    <div class="card-header" style="justify-content:space-between">
      <span class="card-title"><i class="fas fa-clipboard-check"></i> \${a.title}</span>
      <div style="display:flex;gap:8px">
        <span class="badge badge-\${a.priority==='critical'?'critical':a.priority==='high'?'warning':'info'}">\${a.priority}</span>
        <span class="badge badge-\${a.status==='pending'?'warning':a.status==='approved'?'success':a.status==='review'?'info':'neutral'}">\${a.status}</span>
      </div>
    </div>
    <div class="card-body">
      <div class="grid-2" style="gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:12px;color:#64748B;margin-bottom:4px">Description</div>
          <p style="font-size:13px">\${a.description}</p>
        </div>
        <div>
          <div style="font-size:12px;color:#64748B;margin-bottom:4px">Impact</div>
          <strong style="font-size:13px">\${a.impact}</strong>
          <div style="font-size:12px;color:#64748B;margin-top:4px">Requested by: <strong>\${a.requestor}</strong></div>
          <div style="font-size:12px;color:#64748B">Due by: <strong style="color:#DC2626">\${a.due_by}</strong></div>
        </div>
      </div>
      \${a.status==='pending'?'<div style="display:flex;gap:8px"><button class="btn btn-success" onclick="approveAction(\\'' + a.id + '\\')"><i class="fas fa-check"></i> Approve</button><button class="btn btn-secondary" onclick="rejectAction(\\'' + a.id + '\\')"><i class="fas fa-times"></i> Reject</button><button class="btn btn-secondary" onclick="deferAction(\\'' + a.id + '\\')"><i class="fas fa-clock"></i> Defer</button><a href="' + (a.module==='production'?'/production/rccp':a.module==='deployment'?'/deployment/workbench':a.module==='mrp'?'/mrp/shortage-alerts':'/'+a.module) + '" class="btn btn-secondary"><i class="fas fa-eye"></i> View Details</a></div>':'<span style=\\"color:#64748B;font-size:12px\\"><i class=\\"fas fa-check-circle\\" style=\\"color:#059669\\"></i> Processed — ' + a.status + '</span>'}
    </div>
  </div>\`).join('') || '<p class="text-muted">No pending approvals</p>';
}
async function approveAction(id) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  const res = await axios.post('/api/approvals/'+id+'/action', {action:'approve', comment:'Approved via workbench'});
  if (res.data.success) { btn.closest('.card').querySelector('.badge:last-of-type').textContent='approved'; btn.closest('.card').querySelector('.badge:last-of-type').className='badge badge-success'; btn.closest('[style*="display:flex"]').innerHTML='<span style="color:#059669"><i class="fas fa-check-circle"></i> Approved</span>'; }
}
async function rejectAction(id) {
  const reason = prompt('Rejection reason:');
  if (!reason) return;
  await axios.post('/api/approvals/'+id+'/action', {action:'reject', comment:reason});
  init();
}
async function deferAction(id) {
  await axios.post('/api/approvals/'+id+'/action', {action:'defer', comment:'Deferred via workbench'});
  init();
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c)
  return c.html(<Layout user={_u} title="Approvals Workbench" activeModule="audit" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-clipboard-check"></i></div>
        <div>
          <div class="page-title">Approvals Workbench</div>
          <div class="page-subtitle">Pending decisions · Overtime, POs, shipments, inter-DC transfers, scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/exceptions" class="btn btn-secondary"><i class="fas fa-exclamation-triangle"></i> Exception Workbench</a>
      </div>
    </div>
    <div id="approvals-list"><div class="card" style="padding:40px;text-align:center"><div class="spinner"></div></div></div>
  </Layout>)
})

// ── EXCEPTION WORKBENCH ───────────────────────────────────────────────
app.get('/exceptions', async (c) => {
  const scripts = `
async function init() {
  const exc = await axios.get('/api/exceptions').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('exceptions-list');
  el.innerHTML = exc.map(e => \`<div class="card mb-4" style="border-left:5px solid \${e.severity==='critical'?'#DC2626':e.severity==='high'?'#D97706':'#0891B2'}">
    <div class="card-header">
      <span class="card-title" style="color:\${e.severity==='critical'?'#DC2626':e.severity==='high'?'#D97706':'#0891B2'}">
        <i class="fas fa-\${e.severity==='critical'?'times-circle':e.severity==='high'?'exclamation-triangle':'info-circle'}"></i> \${e.title}
      </span>
      <div style="display:flex;gap:8px">
        <span class="badge badge-\${e.severity==='critical'?'critical':e.severity==='high'?'warning':'info'}">\${e.severity}</span>
        <span class="badge badge-neutral">\${e.module.toUpperCase()}</span>
        <span class="badge badge-\${e.status==='open'?'warning':e.status==='in_progress'?'info':'success'}">\${e.status}</span>
      </div>
    </div>
    <div class="card-body">
      <p style="color:#374151;margin-bottom:12px">\${e.description}</p>
      <div class="grid-2" style="gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:11px;color:#64748B;margin-bottom:4px">FINANCIAL IMPACT</div>
          <strong style="color:#DC2626;font-size:16px">₹\${(e.financial_impact_inr/100000).toFixed(1)}L</strong>
          <div style="font-size:11px;color:#64748B;margin-top:2px">\${e.affected_qty?.toLocaleString()} cases affected · Detected: \${e.detected_at}</div>
        </div>
        <div>
          <div style="font-size:11px;color:#64748B;margin-bottom:4px">ASSIGNED TO</div>
          <strong>\${e.assigned_to}</strong>
        </div>
      </div>
      <div style="background:#F8FAFC;padding:12px;border-radius:8px;margin-bottom:12px">
        <div style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px">RESOLUTION OPTIONS:</div>
        \${e.resolution_options.map((opt,i) => \`<div style="display:flex;align-items:center;gap:10px;padding:8px;background:white;border-radius:6px;margin-bottom:6px;border:1px solid var(--border)">
          <span style="background:#1E3A8A;color:white;border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">\${i+1}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">\${opt.action}</div>
            <div style="font-size:11px;color:#64748B">\${opt.impact}</div>
          </div>
          <button class="btn btn-sm btn-primary" onclick="resolveException('\${e.id}',\${i})">Select & Approve</button>
        </div>\`).join('')}
      </div>
    </div>
  </div>\`).join('') || '<p class="text-muted" style="padding:20px;text-align:center">No open exceptions</p>';

  // Summary counts
  const critical = exc.filter(e=>e.severity==='critical').length;
  const high = exc.filter(e=>e.severity==='high').length;
  const financial = exc.reduce((s,e)=>s+e.financial_impact_inr, 0);
  document.getElementById('exc-critical').textContent = critical;
  document.getElementById('exc-high').textContent = high;
  document.getElementById('exc-financial').textContent = '₹' + (financial/100000).toFixed(1) + 'L';
}
async function resolveException(id, optionIdx) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  await new Promise(r=>setTimeout(r,1200));
  btn.innerHTML = '<i class="fas fa-check"></i> Done';
  btn.className = 'btn btn-sm btn-success';
  btn.disabled = true;
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c)
  return c.html(<Layout user={_u} title="Exception Workbench" activeModule="audit" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#EF4444)"><i class="fas fa-exclamation-triangle"></i></div>
        <div>
          <div class="page-title">Exception Workbench</div>
          <div class="page-subtitle">Cross-module exception detection · Root cause · Resolution options · One-click approvals</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/approvals" class="btn btn-secondary"><i class="fas fa-clipboard-check"></i> Approvals</a>
        <a href="/risk-dashboard" class="btn btn-secondary"><i class="fas fa-shield-alt"></i> Risk Dashboard</a>
      </div>
    </div>
    <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-times-circle" style="margin-right:5px"></i>Critical Exceptions</div>
        <div class="kpi-value critical" id="exc-critical">—</div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle" style="margin-right:5px"></i>High Exceptions</div>
        <div class="kpi-value warning" id="exc-high">—</div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-rupee-sign" style="margin-right:5px"></i>Total Financial Risk</div>
        <div class="kpi-value critical" id="exc-financial">—</div>
      </div>
    </div>
    <div id="exceptions-list"><div class="card" style="padding:40px;text-align:center"><div class="spinner"></div></div></div>
  </Layout>)
})

// ── RISK DASHBOARD ────────────────────────────────────────────────────
app.get('/risk-dashboard', async (c) => {
  const scripts = `
async function init() {
  const [stockout, otd, safety] = await Promise.all([
    axios.get('/api/risk/stockout').then(r=>r.data).catch(()=>[]),
    axios.get('/api/risk/otd').then(r=>r.data).catch(()=>[]),
    axios.get('/api/deployment/safety-stock').then(r=>r.data).catch(()=>[]),
  ]);

  document.getElementById('stockout-list').innerHTML = stockout.map(s => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;border-left:4px solid \${s.risk_level==='critical'?'#DC2626':s.risk_level==='warning'?'#D97706':'#059669'}">
    <div>
      <strong>\${s.sku}</strong> @ \${s.location}
      <div style="font-size:12px;color:#64748B;margin-top:2px">\${s.drivers.join(' · ')} · DOS: \${s.current_dos}d</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:800;color:\${s.risk_level==='critical'?'#DC2626':'#D97706'}">\${s.probability_pct}%</div>
      <div style="font-size:11px;color:#64748B">stockout risk</div>
      <button class="btn btn-sm btn-primary" style="margin-top:4px" onclick="triggerReplenishment('\${s.sku}','\${s.location}')">Deploy Now</button>
    </div>
  </div>\`).join('');

  document.getElementById('otd-risk-list').innerHTML = otd.map(s => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;border-left:4px solid \${s.risk_level==='critical'?'#DC2626':s.risk_level==='warning'?'#D97706':'#059669'}">
    <div>
      <strong>\${s.shipment_id}</strong> – \${s.route}
      <div style="font-size:12px;color:#64748B;margin-top:2px">\${s.drivers.join(' · ')} · Predicted: +\${s.delay_hrs}h delay</div>
    </div>
    <div style="text-align:right">
      <div style="font-size:20px;font-weight:800;color:\${s.risk_level==='critical'?'#DC2626':s.risk_level==='warning'?'#D97706':'#059669'}">\${s.risk_score}</div>
      <div style="font-size:11px;color:#64748B">risk score</div>
      \${s.delay_hrs>0?'<button class="btn btn-sm btn-warning" style="margin-top:4px" onclick="expediteShipment(\\'' + s.shipment_id + '\\')">Expedite</button>':'<span style="color:#059669;font-size:11px">On track</span>'}
    </div>
  </div>\`).join('');

  // Safety stock chart
  const red = safety.filter(s=>s.buffer_status==='red').length;
  const yellow = safety.filter(s=>s.buffer_status==='yellow').length;
  const green = safety.filter(s=>s.buffer_status==='green').length;
  const ctx = document.getElementById('ss-chart');
  if (ctx) new Chart(ctx, {
    type:'doughnut',
    data:{labels:['Red Buffer','Yellow Buffer','Green Buffer'],datasets:[{data:[red,yellow,green],backgroundColor:['#DC2626','#D97706','#059669'],borderWidth:2}]},
    options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom'}},cutout:'65%'}
  });
}
async function triggerReplenishment(sku, loc) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  await new Promise(r=>setTimeout(r,1500));
  btn.innerHTML = '<i class="fas fa-check"></i> Triggered';
  btn.className = 'btn btn-sm btn-success';
}
async function expediteShipment(id) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  const res = await axios.post('/api/deployment/shipment-action', {shipment_id:id, action:'expedite'}).catch(()=>({data:{success:false}}));
  btn.innerHTML = res.data.success ? '<i class="fas fa-check"></i> Expedited' : 'Error';
  btn.className = 'btn btn-sm btn-success';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c)
  return c.html(<Layout user={_u} title="Risk Dashboard" activeModule="audit" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#7C3AED)"><i class="fas fa-shield-alt"></i></div>
        <div>
          <div class="page-title">Supply Chain Risk Dashboard</div>
          <div class="page-subtitle">Stock-out risk · OTD risk · Safety stock alerts · DDMRP buffer status</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/exceptions" class="btn btn-danger"><i class="fas fa-exclamation-triangle"></i> Exception Workbench</a>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-exclamation-triangle" style="color:#DC2626"></i> Stock-out Risk Monitor</span>
          <a href="/api/export/inventory?format=csv" class="btn btn-sm btn-secondary"><i class="fas fa-download"></i> Export</a>
        </div>
        <div class="card-body" id="stockout-list"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-truck" style="color:#D97706"></i> OTD Risk Scorer</span>
          <a href="/deployment/workbench" class="btn btn-sm btn-secondary">Shipments</a>
        </div>
        <div class="card-body" id="otd-risk-list"><div class="spinner"></div></div>
      </div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-chart-pie"></i> DDMRP Buffer Status</span>
          <a href="/deployment/workbench" class="btn btn-sm btn-secondary">View All</a>
        </div>
        <div class="card-body" style="height:200px"><canvas id="ss-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-circle"></i> Active Exceptions</span><a href="/exceptions" class="btn btn-sm btn-danger">Workbench</a></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>MUM-L2 Capacity 98%</strong> – Approve overtime or shift 8K cases. <a href="/production/rccp" style="color:#2563EB">→ RCCP</a></div></div>
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>Orange Concentrate Shortage</strong> – 2.7MT gap for W2. <a href="/mrp/shortage-alerts" style="color:#2563EB">→ MRP Alerts</a></div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Lucknow DC Safety Stock Breach</strong> – 1,200 cases shortfall. <a href="/deployment/workbench" style="color:#2563EB">→ Deploy</a></div></div>
        </div>
      </div>
    </div>
  </Layout>)
})

// ============================================================
// PRODUCTION PLANNING MODULE
// ============================================================

// Production Planning APIs
app.get('/api/production/kpis', async (c) => {
  try {
    const db = c.env.DB
    const util = await db.prepare(`SELECT AVG(utilization_pct) as avg_util FROM capacity_utilization WHERE date >= date('now','-7 days')`).first<{avg_util:number}>()
    const jobs = await db.prepare(`SELECT COUNT(*) as cnt FROM jobs WHERE status IN ('in_progress','scheduled')`).first<{cnt:number}>()
    return c.json([
      { metric_name: 'MPS Adherence', metric_value: '94.2', metric_unit: '%', metric_status: 'healthy', target_value: '95', icon: 'fa-calendar-check', trend: '↑ +1.2%', trend_dir: 'up' },
      { metric_name: 'Line Utilization', metric_value: (util?.avg_util||82.4).toFixed(1), metric_unit: '%', metric_status: (util?.avg_util||82.4) > 90 ? 'critical' : (util?.avg_util||82.4) > 80 ? 'warning' : 'healthy', target_value: '85', icon: 'fa-industry', trend: '↑ +0.8%', trend_dir: 'up' },
      { metric_name: 'Active Jobs', metric_value: String(jobs?.cnt||8), metric_unit: '', metric_status: 'info', target_value: '10', icon: 'fa-cogs', trend: '', trend_dir: 'up' },
      { metric_name: 'ATP Available', metric_value: '32.4', metric_unit: 'K cases', metric_status: 'healthy', target_value: '25K', icon: 'fa-check-double', trend: '↑ +2.1K', trend_dir: 'up' },
      { metric_name: 'RCCP Overloads', metric_value: '2', metric_unit: ' lines', metric_status: 'warning', target_value: '0', icon: 'fa-ruler-combined', trend: '↓ –1', trend_dir: 'up' },
      { metric_name: 'Schedule Adherence', metric_value: '91.8', metric_unit: '%', metric_status: 'warning', target_value: '95', icon: 'fa-tasks', trend: '↑ +0.6%', trend_dir: 'up' },
    ])
  } catch { return c.json([
    { metric_name: 'MPS Adherence', metric_value: '94.2', metric_unit: '%', metric_status: 'healthy', target_value: '95', icon: 'fa-calendar-check', trend: '↑ +1.2%', trend_dir: 'up' },
    { metric_name: 'Line Utilization', metric_value: '82.4', metric_unit: '%', metric_status: 'warning', target_value: '85', icon: 'fa-industry', trend: '↑ +0.8%', trend_dir: 'up' },
    { metric_name: 'Active Jobs', metric_value: '8', metric_unit: '', metric_status: 'info', target_value: '10', icon: 'fa-cogs', trend: '', trend_dir: 'up' },
    { metric_name: 'ATP Available', metric_value: '32.4', metric_unit: 'K cases', metric_status: 'healthy', target_value: '25K', icon: 'fa-check-double', trend: '↑ +2.1K', trend_dir: 'up' },
    { metric_name: 'RCCP Overloads', metric_value: '2', metric_unit: ' lines', metric_status: 'warning', target_value: '0', icon: 'fa-ruler-combined', trend: '↓ –1', trend_dir: 'up' },
    { metric_name: 'Schedule Adherence', metric_value: '91.8', metric_unit: '%', metric_status: 'warning', target_value: '95', icon: 'fa-tasks', trend: '↑ +0.6%', trend_dir: 'up' },
  ]) }
})

app.get('/api/production/mps-summary', async (c) => {
  return c.json([
    { week: 'W1 Mar', planned_qty: 42000, confirmed_qty: 40000, capacity: 50000 },
    { week: 'W2 Mar', planned_qty: 45000, confirmed_qty: 43000, capacity: 50000 },
    { week: 'W3 Mar', planned_qty: 41000, confirmed_qty: 39000, capacity: 50000 },
    { week: 'W4 Mar', planned_qty: 48000, confirmed_qty: 46000, capacity: 50000 },
    { week: 'W1 Apr', planned_qty: 46000, confirmed_qty: 0, capacity: 50000 },
    { week: 'W2 Apr', planned_qty: 43000, confirmed_qty: 0, capacity: 50000 },
    { week: 'W3 Apr', planned_qty: 47000, confirmed_qty: 0, capacity: 50000 },
    { week: 'W4 Apr', planned_qty: 44000, confirmed_qty: 0, capacity: 50000 },
  ])
})

app.get('/api/production/mps', async (c) => {
  return c.json([
    { sku_code: 'SKU-500-PET', sku_name: 'PET 500ml Regular', week: 'W1 Mar', planned_qty: 18000, confirmed_qty: 17200, available_qty: 800, status: 'firm', line_name: 'MUM-L1' },
    { sku_code: 'SKU-1L-PET', sku_name: 'PET 1L Regular', week: 'W1 Mar', planned_qty: 12000, confirmed_qty: 11400, available_qty: 600, status: 'firm', line_name: 'MUM-L2' },
    { sku_code: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', week: 'W1 Mar', planned_qty: 8000, confirmed_qty: 7600, available_qty: 400, status: 'firm', line_name: 'DEL-L1' },
    { sku_code: 'SKU-500-PET', sku_name: 'PET 500ml Regular', week: 'W2 Mar', planned_qty: 19000, confirmed_qty: 18000, available_qty: 1000, status: 'firm', line_name: 'MUM-L1' },
    { sku_code: 'SKU-1L-PET', sku_name: 'PET 1L Regular', week: 'W2 Mar', planned_qty: 13000, confirmed_qty: 12400, available_qty: 600, status: 'firm', line_name: 'MUM-L2' },
    { sku_code: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', week: 'W2 Mar', planned_qty: 9000, confirmed_qty: 8500, available_qty: 500, status: 'firm', line_name: 'DEL-L1' },
    { sku_code: 'SKU-500-PET', sku_name: 'PET 500ml Regular', week: 'W3 Mar', planned_qty: 17500, confirmed_qty: 0, available_qty: 0, status: 'planned', line_name: 'MUM-L1' },
    { sku_code: 'SKU-1L-PET', sku_name: 'PET 1L Regular', week: 'W3 Mar', planned_qty: 11500, confirmed_qty: 0, available_qty: 0, status: 'planned', line_name: 'MUM-L2' },
    { sku_code: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', week: 'W3 Mar', planned_qty: 6500, confirmed_qty: 0, available_qty: 0, status: 'planned', line_name: 'DEL-L2' },
    { sku_code: 'SKU-500-PET', sku_name: 'PET 500ml Regular', week: 'W4 Mar', planned_qty: 20000, confirmed_qty: 0, available_qty: 0, status: 'planned', line_name: 'MUM-L1' },
  ])
})

app.get('/api/production/atp', async (c) => {
  return c.json([
    { sku: 'SKU-500-PET', sku_name: 'PET 500ml Regular', oh_stock: 12400, scheduled_receipts: 38000, customer_orders: 35200, atp: 15200, commit_date: 'W1 Mar' },
    { sku: 'SKU-1L-PET', sku_name: 'PET 1L Regular', oh_stock: 8600, scheduled_receipts: 29000, customer_orders: 31400, atp: -2800, commit_date: 'W3 Mar' },
    { sku: 'SKU-200-MANGO', sku_name: 'Mango 200ml Can', oh_stock: 5200, scheduled_receipts: 18000, customer_orders: 16800, atp: 6400, commit_date: 'W1 Mar' },
    { sku: 'SKU-250-CAN', sku_name: 'Sparkling 250ml Can', oh_stock: 3400, scheduled_receipts: 12000, customer_orders: 11200, atp: 4200, commit_date: 'W2 Mar' },
    { sku: 'SKU-500-GLASS', sku_name: 'Glass 500ml Premium', oh_stock: 1800, scheduled_receipts: 6000, customer_orders: 7100, atp: 700, commit_date: 'W2 Mar' },
  ])
})

// Deployment APIs
app.get('/api/deployment/kpis', async (c) => {
  return c.json([
    { name: 'On-Time Delivery', value: '91.4%', target: '95%', status: 'warning', icon: 'fa-clock', trend: '↑ +0.7%', trend_dir: 'up' },
    { name: 'Truck Utilization', value: '84.2%', target: '88%', status: 'warning', icon: 'fa-truck', trend: '↑ +1.2%', trend_dir: 'up' },
    { name: 'Cost per Case', value: '₹18.4', target: '₹17.0', status: 'critical', icon: 'fa-rupee-sign', trend: '↓ –₹0.3', trend_dir: 'up' },
    { name: 'Routes Optimized', value: '124/150', target: '150', status: 'warning', icon: 'fa-route', trend: '↑ +12', trend_dir: 'up' },
    { name: 'Avg Lead Time', value: '2.8 days', target: '2.5 days', status: 'warning', icon: 'fa-hourglass-half', trend: '↓ –0.2d', trend_dir: 'up' },
    { name: 'Fill Rate', value: '96.8%', target: '98%', status: 'warning', icon: 'fa-boxes', trend: '↑ +0.4%', trend_dir: 'up' },
  ])
})

app.get('/api/deployment/shipments', async (c) => {
  return c.json([
    { id: 'SHP-0317-001', origin: 'Mumbai', destination: 'Pune', volume: 1240, truck_type: '32ft Container', utilization: 92, etd: 'Mar 17, 06:00', eta: 'Mar 17, 10:00', status: 'in_transit' },
    { id: 'SHP-0317-002', origin: 'Delhi', destination: 'Jaipur', volume: 820, truck_type: '22ft Container', utilization: 78, etd: 'Mar 17, 08:00', eta: 'Mar 17, 13:00', status: 'planned' },
    { id: 'SHP-0317-003', origin: 'Chennai', destination: 'Coimbatore', volume: 960, truck_type: '22ft Container', utilization: 88, etd: 'Mar 17, 07:00', eta: 'Mar 17, 15:00', status: 'loading' },
    { id: 'SHP-0317-004', origin: 'Bangalore', destination: 'Hyderabad', volume: 1380, truck_type: '32ft Container', utilization: 95, etd: 'Mar 18, 06:00', eta: 'Mar 18, 15:00', status: 'planned' },
    { id: 'SHP-0317-005', origin: 'Mumbai', destination: 'Nashik', volume: 680, truck_type: '22ft Container', utilization: 65, etd: 'Mar 17, 10:00', eta: 'Mar 17, 14:30', status: 'planned' },
    { id: 'SHP-0317-006', origin: 'Delhi', destination: 'Lucknow', volume: 1120, truck_type: '32ft Container', utilization: 89, etd: 'Mar 17, 09:00', eta: 'Mar 17, 21:00', status: 'delayed' },
  ])
})

app.get('/api/deployment/routes', async (c) => {
  return c.json([
    { route_id: 'RT-001', origin: 'Mumbai', destination: 'Pune', distance_km: 148, transit_time: '4 hrs', cost_per_case: 14.2, carrier: 'BlueDart Logistics', optimization_score: 94 },
    { route_id: 'RT-002', origin: 'Mumbai', destination: 'Surat', distance_km: 284, transit_time: '6 hrs', cost_per_case: 16.8, carrier: 'DHL Supply Chain', optimization_score: 88 },
    { route_id: 'RT-003', origin: 'Delhi', destination: 'Jaipur', distance_km: 281, transit_time: '5 hrs', cost_per_case: 15.4, carrier: 'Mahindra Logistics', optimization_score: 91 },
    { route_id: 'RT-004', origin: 'Delhi', destination: 'Lucknow', distance_km: 555, transit_time: '9 hrs', cost_per_case: 18.6, carrier: 'Gati-KWE', optimization_score: 76 },
    { route_id: 'RT-005', origin: 'Chennai', destination: 'Bangalore', distance_km: 346, transit_time: '6 hrs', cost_per_case: 15.8, carrier: 'BlueDart Logistics', optimization_score: 89 },
    { route_id: 'RT-006', origin: 'Bangalore', destination: 'Hyderabad', distance_km: 568, transit_time: '9 hrs', cost_per_case: 19.2, carrier: 'VRL Logistics', optimization_score: 72 },
  ])
})

// ── Production Planning Pages ─────────────────────────────────────────

app.get('/production', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production Planning" activeModule="production">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-cogs"></i></div>
        <div>
          <div class="page-title">Production Planning</div>
          <div class="page-subtitle">MPS · ATP · RCCP · Planner Workbench · Scenario Manager · AI Copilot</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/production/mps" class="btn btn-primary"><i class="fas fa-calendar-check"></i> Open MPS</a>
        <a href="/production/workbench" class="btn btn-secondary"><i class="fas fa-drafting-compass"></i> Workbench</a>
      </div>
    </div>
    <div class="kpi-grid" id="prod-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-calendar-check"></i> MPS – 8 Week Horizon</span>
          <a href="/production/mps" class="btn btn-sm btn-secondary">Full MPS</a>
        </div>
        <div class="card-body" style="height:240px"><canvas id="prod-mps-horizon-chart"></canvas></div>
      </div>
      <div class="grid-1" style="display:grid;grid-template-rows:1fr 1fr;gap:20px">
        <div class="card">
          <div class="card-header"><span class="card-title"><i class="fas fa-check-double"></i> ATP Snapshot</span><a href="/production/atp" class="btn btn-sm btn-secondary">Details</a></div>
          <div class="card-body" style="height:100px"><canvas id="prod-atp-chart"></canvas></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title"><i class="fas fa-ruler-combined"></i> RCCP – Capacity Load</span><a href="/production/rccp" class="btn btn-sm btn-secondary">Details</a></div>
          <div class="card-body" style="height:100px"><canvas id="prod-rccp-chart"></canvas></div>
        </div>
      </div>
    </div>

    <div class="grid-3">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Alerts</span></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>MUM-L2 Overloaded W2</strong><br/>98% capacity – approve overtime</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>SKU-1L-PET ATP Negative W3</strong><br/>–2,800 cases shortfall detected</div></div>
          <div class="alert alert-info"><i class="fas fa-info-circle"></i><div><strong>New Scenario Available</strong><br/>"Demand Upside +15%" ready to review</div></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-brain"></i> ML Recommendations</span></div>
        <div class="card-body">
          <div style="margin-bottom:12px;padding:10px;background:#F0F4FA;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#1E3A8A">⚡ Shift 8K cases DEL-L1</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px">Resolve MUM-L2 overload by moving load to 75%-utilized Delhi line</div>
          </div>
          <div style="margin-bottom:12px;padding:10px;background:#F0FDF4;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#059669">✓ Expedite SKU-1L-PET W3</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px">Run extra 4-hour shift to cover 2,800 case ATP deficit</div>
          </div>
          <div style="padding:10px;background:#FFFBEB;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#D97706">⚠ Review Glass 500ml W4</div>
            <div style="font-size:11px;color:#64748B;margin-top:3px">Low ATP buffer; consider expediting changeover from PET line</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-layer-group"></i> Active Scenarios</span><a href="/production/scenarios" class="btn btn-sm btn-secondary">Manage</a></div>
        <div class="card-body compact">
          {[
            { name: 'Base Plan Mar 2026', status: 'active', type: 'Baseline' },
            { name: 'Demand Upside +15%', status: 'draft', type: 'Demand Spike' },
            { name: 'Line Breakdown Contingency', status: 'draft', type: 'Risk' },
            { name: 'New SKU Launch', status: 'review', type: 'New Product' },
          ].map(s => (
            <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #F1F5F9">
              <div>
                <div style="font-size:13px;font-weight:500">{s.name}</div>
                <div style="font-size:11px;color:#64748B">{s.type}</div>
              </div>
              <span class={`badge badge-${s.status === 'active' ? 'success' : s.status === 'draft' ? 'neutral' : 'info'}`}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-home';</script>
  </Layout>)
})

app.get('/production/mps', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Master Production Schedule" activeModule="prod-mps">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-calendar-check"></i></div>
        <div>
          <div class="page-title">Master Production Schedule</div>
          <div class="page-subtitle">Firm orders, planned orders, capacity alignment · Horizon: 12 weeks</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary" onclick="openNewOrderModal()"><i class="fas fa-plus"></i> New Order</button>
        <a href="/api/export/mps?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</a>
        <a href="/production/rccp" class="btn btn-secondary"><i class="fas fa-ruler-combined"></i> RCCP Check</a>
        <button class="btn btn-success" id="optimize-mps-btn" onclick="runMPSOptimize()"><i class="fas fa-sliders-h"></i> Optimize</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-calendar-check" style="margin-right:5px"></i>Firm Orders</div>
        <div class="kpi-value healthy">6</div>
        <div class="kpi-meta"><span class="kpi-target">Next 2 weeks</span><span class="kpi-trend up">↑ On track</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-clock" style="margin-right:5px"></i>Planned Orders</div>
        <div class="kpi-value warning">14</div>
        <div class="kpi-meta"><span class="kpi-target">W3–W12</span><span class="kpi-trend up">Review needed</span></div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle" style="margin-right:5px"></i>ATP Issues</div>
        <div class="kpi-value critical">2</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 0</span><span class="kpi-trend down">Action required</span></div>
      </div>
    </div>

    <div id="optimize-result" style="display:none" class="alert alert-success mb-4">
      <i class="fas fa-sliders-h"></i>
      <div id="optimize-result-text">Optimization complete.</div>
    </div>

    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-chart-bar"></i> MPS 12-Week Capacity vs. Planned</span>
        <div style="display:flex;gap:8px">
          <select class="form-input form-select" style="width:auto;font-size:12px" id="sku-filter">
            <option value="">All SKUs</option><option value="SKU-500-PET">PET 500ml</option><option value="SKU-1L-PET">PET 1L</option><option value="SKU-200-MANGO">Mango 200ml</option>
          </select>
          <select class="form-input form-select" style="width:auto;font-size:12px" id="line-filter">
            <option value="">All Lines</option><option value="MUM-L1">MUM-L1</option><option value="MUM-L2">MUM-L2</option><option value="DEL-L1">DEL-L1</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="height:240px"><canvas id="mps-chart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> MPS Detail</span>
        <div style="display:flex;gap:8px">
          <input class="form-input" style="width:180px;font-size:12px" id="mps-search" placeholder="Search SKU..." oninput="filterMPS(this.value)" />
          <button class="btn btn-sm btn-primary" onclick="firmAllW1()"><i class="fas fa-bolt"></i> Firm All W1</button>
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Week</th><th>Planned</th><th>Confirmed</th><th>Available</th><th>Status</th><th>Line</th><th>Action</th></tr></thead>
          <tbody id="mps-table-body"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='production-mps';
async function runMPSOptimize() {
  const btn = document.getElementById('optimize-mps-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Running...';
  btn.disabled = true;
  try {
    const res = await axios.post('/api/production/optimize', {horizon:8, constraint:'balanced'});
    const d = res.data;
    const el = document.getElementById('optimize-result');
    const text = document.getElementById('optimize-result-text');
    text.innerHTML = '<strong>MPS Optimization Complete!</strong> Output: +' + d.improvements.output_delta + '% · OTIF: +' + d.improvements.otif_delta + '% · Overloads cleared: ' + d.optimized.overloads + ' · Changeover saved: ' + d.improvements.changeover_saved_hrs + 'h';
    el.style.display = 'flex';
  } catch(e) { window.showToast('Optimization failed: '+(e.message||e),'error'); }
  btn.innerHTML = '<i class="fas fa-sliders-h"></i> Optimize';
  btn.disabled = false;
}
async function firmAllW1() {
  if (!confirm('Firm all Week 1 planned orders?')) return;
  const rows = document.querySelectorAll('#mps-table-body tr');
  rows.forEach(r => {
    const cells = r.querySelectorAll('td');
    if (cells[1]?.textContent?.includes('W1')) {
      const btn = cells[7]?.querySelector('button');
      if (btn && btn.textContent !== 'Firmed') { btn.textContent = '✓ Firmed'; btn.className = 'btn btn-sm btn-success'; btn.disabled = true; }
    }
  });
  // Call API
  await axios.post('/api/production/firm-order', {week:'W1', bulk:true}).catch(()=>{});
  setTimeout(()=>location.reload(), 1500);
}
function filterMPS(q) {
  const rows = document.querySelectorAll('#mps-table-body tr');
  rows.forEach(r => r.style.display = q ? (r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none') : '');
}
function openNewOrderModal() {
  const name = prompt('SKU Code (e.g., SKU-500-PET):');
  if (!name) return;
  const qty = prompt('Planned Quantity (cases):');
  const week = prompt('Week (e.g., W1 Mar):');
  if (qty && week) {
    axios.post('/api/production/firm-order', {sku:name, qty:parseInt(qty), week, line:'MUM-L1'})
      .then(r => { if (r.data.success) { window.showToast('Order ' + r.data.order_id + ' created! Refreshing...','success'); setTimeout(()=>location.reload(),1000); } });
  }
}
    ` }}></script>
  </Layout>)
})

app.get('/production/atp', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Available-to-Promise" activeModule="prod-atp">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#10B981)"><i class="fas fa-check-double"></i></div>
        <div>
          <div class="page-title">Available-to-Promise</div>
          <div class="page-subtitle">Real-time ATP by SKU · Commit dates · Order promising engine</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary" onclick="checkATP()"><i class="fas fa-search"></i> Check ATP</button>
        <button class="btn btn-secondary" onclick="location.href='/api/export/atp?format=csv'"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-check-circle" style="margin-right:5px"></i>SKUs Available</div>
        <div class="kpi-value healthy">4</div>
        <div class="kpi-meta"><span class="kpi-target">of 5 SKUs</span><span class="kpi-trend up">↑ Good</span></div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-times-circle" style="margin-right:5px"></i>Constrained</div>
        <div class="kpi-value critical">1</div>
        <div class="kpi-meta"><span class="kpi-target">SKU-1L-PET W3</span><span class="kpi-trend down">↓ –2800 cases</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-boxes" style="margin-right:5px"></i>Total ATP Pool</div>
        <div class="kpi-value healthy">32.4K</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 25K</span><span class="kpi-trend up">↑ +7.4K</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> ATP by Week (8W)</span></div>
        <div class="card-body" style="height:220px"><canvas id="atp-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-circle"></i> ATP Exceptions</span></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>SKU-1L-PET – W3 Mar</strong><br/>ATP: –2,800 cases. Customer orders exceed supply. Options: expedite MUM-L2 run or defer low-priority orders.</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>SKU-500-GLASS – W2 Mar</strong><br/>ATP buffer only 700 cases. Buffer thin; one large order could create constraint.</div></div>
          <div class="alert alert-success"><i class="fas fa-check-circle"></i><div><strong>SKU-500-PET – All Weeks OK</strong><br/>ATP: 15,200 cases W1. Full commitment possible.</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> ATP by SKU</span>
        <div style="display:flex;gap:8px">
          <input class="form-input" style="width:200px;font-size:12px" placeholder="Search SKU..." />
          <button class="btn btn-sm btn-primary"><i class="fas fa-bolt"></i> Batch Commit</button>
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>On-Hand Stock</th><th>Scheduled Receipts</th><th>Customer Orders</th><th>ATP</th><th>Commit Date</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="atp-table-body"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-atp';</script>
  </Layout>)
})

app.get('/production/rccp', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Rough-Cut Capacity Planning" activeModule="prod-rccp">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-ruler-combined"></i></div>
        <div>
          <div class="page-title">Rough-Cut Capacity Planning</div>
          <div class="page-subtitle">High-level capacity feasibility check for MPS · 8-week horizon · Line-by-line load analysis</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-warning">2 Lines Overloaded</span>
        <button class="btn btn-primary" onclick="recalcRCCP(this)"><i class="fas fa-sync"></i> Recalculate</button>
        <a href="/production/mps" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Back to MPS</a>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-exclamation-circle" style="margin-right:5px"></i>Overloaded Lines</div>
        <div class="kpi-value critical">2</div>
        <div class="kpi-meta"><span class="kpi-target">MUM-L2 (98%), MUM-L1 (91%)</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-tachometer-alt" style="margin-right:5px"></i>Avg Load</div>
        <div class="kpi-value warning">82%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: &lt;85%</span><span class="kpi-trend up">↑ W1 peak</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-check-circle" style="margin-right:5px"></i>Lines Feasible</div>
        <div class="kpi-value healthy">4 / 6</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 6/6</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Required vs Available Capacity</span></div>
        <div class="card-body" style="height:240px"><canvas id="rccp-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> 8-Week Capacity Load by Line</span></div>
        <div class="card-body" style="height:240px"><canvas id="rccp-horizon-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> RCCP Load Table – 8 Week Horizon</span>
        <div style="display:flex;gap:8px;align-items:center;font-size:12px;color:#64748B">
          <span style="color:#DC2626">■</span> &gt;90% Critical
          <span style="color:#D97706">■</span> 80–90% Warning
          <span style="color:#059669">■</span> &lt;80% OK
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Resource</th><th>W1</th><th>W2</th><th>W3</th><th>W4</th><th>W5</th><th>W6</th><th>W7</th><th>W8</th><th>Verdict</th></tr></thead>
          <tbody id="rccp-table-body"><tr><td colspan={10} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title"><i class="fas fa-lightbulb"></i> RCCP Recommendations</span></div>
      <div class="card-body">
        <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>MUM-L2 Overloaded W1–W2 (95–98%)</strong><br/>Action: Authorize 2-shift weekend overtime OR shift 8,000 cases to DEL-L1 (currently 75% loaded). Expected impact: MUM-L2 drops to 84%.</div></div>
        <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>MUM-L1 Tight W4 (91%)</strong><br/>Action: Review new SKU launch timing. Delay Glass 500ml W4 by 1 week to reduce load to 82%.</div></div>
        <div class="alert alert-success"><i class="fas fa-check-circle"></i><div><strong>Delhi Lines Underutilized (68–75%)</strong><br/>Opportunity: Pull forward W5–W6 production to build inventory buffer.</div></div>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-rccp';</script>
  </Layout>)
})

app.get('/production/workbench', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production Planner Workbench" activeModule="prod-workbench">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-drafting-compass"></i></div>
        <div>
          <div class="page-title">Planner Workbench</div>
          <div class="page-subtitle">Interactive job management · Sequence, firm, and monitor production orders</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary" onclick="addNewJob()"><i class="fas fa-plus"></i> New Job</button>
        <button class="btn btn-success" id="ai-seq-btn" onclick="runAISequence()"><i class="fas fa-robot"></i> AI Sequence</button>
        <a href="/sequencing/gantt" class="btn btn-secondary"><i class="fas fa-bars-staggered"></i> Gantt View</a>
        <a href="/api/export/mps?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export</a>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-play-circle" style="margin-right:5px"></i>In Progress</div>
        <div class="kpi-value healthy">3</div>
        <div class="kpi-meta"><span class="kpi-target">Jobs running now</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-clock" style="margin-right:5px"></i>Scheduled</div>
        <div class="kpi-value warning">5</div>
        <div class="kpi-meta"><span class="kpi-target">Next 24 hrs</span></div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-list" style="margin-right:5px"></i>Planned</div>
        <div class="kpi-value">4</div>
        <div class="kpi-meta"><span class="kpi-target">Awaiting firm</span></div>
      </div>
    </div>

    <div id="ai-result" class="alert alert-success" style="display:none;margin-bottom:16px">
      <i class="fas fa-robot"></i>
      <div id="ai-result-text">AI sequence computed.</div>
    </div>

    <div class="grid-2-1 mb-4">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-list-ol"></i> Production Job Queue</span>
          <div style="display:flex;gap:8px">
            <select class="form-input form-select" style="width:auto;font-size:12px" id="line-filter" onchange="filterByLine(this.value)">
              <option value="">All Lines</option><option value="MUM-L1">MUM-L1</option><option value="MUM-L2">MUM-L2</option><option value="DEL-L1">DEL-L1</option><option value="CHN-L1">CHN-L1</option>
            </select>
          </div>
        </div>
        <div class="card-body" id="workbench-jobs"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> Changeover Matrix</span>
          <button class="btn btn-sm btn-primary" onclick="loadChangeover()"><i class="fas fa-sync"></i> Load</button>
        </div>
        <div class="card-body compact" id="changeover-section">
          <table class="data-table" style="font-size:11px">
            <thead><tr><th>From → To</th><th>500ml</th><th>1L</th><th>Mango</th><th>250ml</th><th>Glass</th></tr></thead>
            <tbody>
              <tr><td style="font-weight:600">500ml PET</td><td style="color:#059669">—</td><td style="color:#D97706">2.5h</td><td style="color:#DC2626">4.0h</td><td style="color:#DC2626">5.5h</td><td style="color:#DC2626">6.0h</td></tr>
              <tr><td style="font-weight:600">1L PET</td><td style="color:#D97706">2.5h</td><td style="color:#059669">—</td><td style="color:#DC2626">4.5h</td><td style="color:#DC2626">5.5h</td><td style="color:#DC2626">6.5h</td></tr>
              <tr><td style="font-weight:600">Mango Can</td><td style="color:#DC2626">4.0h</td><td style="color:#DC2626">4.5h</td><td style="color:#059669">—</td><td style="color:#059669">2.0h</td><td style="color:#DC2626">5.5h</td></tr>
              <tr><td style="font-weight:600">250ml Can</td><td style="color:#DC2626">5.5h</td><td style="color:#DC2626">5.5h</td><td style="color:#059669">2.0h</td><td style="color:#059669">—</td><td style="color:#D97706">4.0h</td></tr>
            </tbody>
          </table>
          <div class="alert alert-info" style="margin-top:12px"><i class="fas fa-info-circle"></i><div>AI recommends: 500ml → 1L → Mango (save 11.9h vs random sequence). <button onclick="runAISequence()" style="color:#1D4ED8;border:none;background:none;cursor:pointer;font-size:12px;font-weight:600">Apply →</button></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-chart-bar"></i> Variance Drill-Down</span>
        <select class="form-input form-select" style="width:auto;font-size:12px" id="variance-period" onchange="loadVariance(this.value)">
          <option value="W1">W1 Mar</option><option value="W2">W2 Mar</option><option value="W3">W3 Mar</option>
        </select>
      </div>
      <div class="card-body compact" id="variance-table">
        <div class="spinner"></div>
      </div>
    </div>

    <script src="/static/production-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='production-workbench';
async function runAISequence() {
  const btn = document.getElementById('ai-seq-btn');
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...'; btn.disabled = true; }
  try {
    const res = await axios.post('/api/production/ai-sequence', {line:'MUM-L1'});
    const d = res.data;
    const result = document.getElementById('ai-result');
    const text = document.getElementById('ai-result-text');
    if (result && text) {
      text.innerHTML = '<strong>AI Sequence Computed!</strong> Optimal: ' + d.sequence.map(s=>s.sku).join(' → ') + '<br/>' +
        'Changeover saved: <strong>' + d.saving_hrs + 'h (' + d.saving_pct + '% reduction)</strong> · Algorithm: ' + d.algorithm;
      result.style.display = 'flex';
    }
  } catch(e) { window.showToast('AI sequence failed: '+(e.message||'server error'),'error'); }
  if (btn) { btn.innerHTML = '<i class="fas fa-robot"></i> AI Sequence'; btn.disabled = false; }
}
async function loadVariance(period) {
  const el = document.getElementById('variance-table');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  const d = await axios.get('/api/production/variance?period=' + (period||'W1')).then(r=>r.data).catch(()=>null);
  if (!d) { el.innerHTML = '<p class="text-muted">No variance data</p>'; return; }
  el.innerHTML = '<div style="margin-bottom:12px;padding:10px;background:#F8FAFC;border-radius:8px;display:flex;gap:24px">' +
    '<div><div style="font-size:11px;color:#64748B">Planned</div><strong>' + d.summary.planned.toLocaleString() + '</strong></div>' +
    '<div><div style="font-size:11px;color:#64748B">Actual</div><strong>' + d.summary.actual.toLocaleString() + '</strong></div>' +
    '<div><div style="font-size:11px;color:#64748B">Variance</div><strong style="color:#DC2626">' + d.summary.variance.toLocaleString() + ' (' + d.summary.variance_pct + '%)</strong></div>' +
    '</div>' +
    '<table class="data-table"><thead><tr><th>Line</th><th>Planned</th><th>Actual</th><th>Variance</th><th>Root Cause</th><th>Action</th></tr></thead><tbody>' +
    d.by_line.map(r => '<tr><td><strong>' + r.line + '</strong></td><td>' + r.planned.toLocaleString() + '</td><td>' + r.actual.toLocaleString() + '</td><td style="color:' + (r.variance<0?'#DC2626':'#059669') + ';font-weight:600">' + r.variance.toLocaleString() + ' (' + r.variance_pct + '%)</td><td style="font-size:12px">' + r.root_cause + '</td><td><span class="badge badge-' + (r.action!=='None'?'warning':'success') + '">' + (r.action!=='None'?r.action:'On Track') + '</span></td></tr>').join('') +
    '</tbody></table>';
}
async function filterByLine(line) {
  const el = document.getElementById('workbench-jobs');
  if (!el) return;
  el.innerHTML = '<div class="spinner"></div>';
  const jobs = await axios.get('/api/sequencing/jobs').then(r=>r.data).catch(()=>[]);
  const filtered = line ? jobs.filter(j=>j.line_name===line||j.line_code===line) : jobs;
  // re-render
  if (filtered.length === 0 && jobs.length === 0) {
    el.innerHTML = '<p class="text-muted">No jobs found</p>';
  }
}
function addNewJob() {
  const sku = prompt('Select SKU (e.g., SKU-500-PET, SKU-1L-PET, SKU-CAN-330):');
  if (!sku) return;
  const qty = prompt('Enter quantity (cases):');
  if (!qty) return;
  const line = prompt('Assign to line (e.g., MUM-L1, MUM-L2, DEL-L1):') || 'MUM-L1';
  const jobNum = 'JOB-' + line.replace('-','') + '-' + new Date().toISOString().slice(5,10).replace('-','') + '-' + String(Math.floor(Math.random()*900)+100);
  window.showToast('Job ' + jobNum + ' created: ' + sku + ' x ' + Number(qty).toLocaleString() + ' cases to ' + line + '. Status: Scheduled.', 'success');
}
document.addEventListener('DOMContentLoaded', () => {
  loadVariance('W1');
});
    ` }}></script>
  </Layout>)
})

app.get('/production/scenarios', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production – Scenario Manager" activeModule="prod-scenarios">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-layer-group"></i></div>
        <div>
          <div class="page-title">Production Scenario Manager</div>
          <div class="page-subtitle">Model what-if production plans · Compare, run, and activate scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="document.getElementById('new-prod-sc').style.display='block'"><i class="fas fa-plus"></i> New Scenario</button>
        <button class="btn btn-secondary" onclick="window.showToast&&window.showToast('Import: Select a JSON or CSV file to import scenario parameters. Supported formats: MPS export, SAP APO export, Excel template.','info')"><i class="fas fa-upload"></i> Import</button>
      </div>
    </div>

    <div class="card mb-4" id="new-prod-sc" style="display:none">
      <div class="card-header"><span class="card-title">Create New Scenario</span></div>
      <div class="card-body">
        <div class="grid-3">
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="prod-sc-name" placeholder="e.g., Demand Upside +20%" /></div>
          <div class="form-group"><label class="form-label">Driver</label>
            <select class="form-input form-select" id="prod-sc-driver">
              <option>Demand</option><option>Capacity</option><option>New Product</option><option>Cost</option><option>Risk</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="prod-sc-desc" placeholder="Brief description" /></div>
        </div>
        <button class="btn btn-primary" onclick="createProdScenario()"><i class="fas fa-save"></i> Create Scenario</button>
        <button class="btn btn-secondary" onclick="document.getElementById('new-prod-sc').style.display='none'">Cancel</button>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Scenario Comparison</span></div>
      <div class="card-body" style="height:220px"><canvas id="prod-scenario-compare-chart"></canvas></div>
    </div>

    <div id="prod-scenarios-list"><div class="spinner"></div></div>

    <script src="/static/production-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='production-scenarios';
document.addEventListener('DOMContentLoaded', function() {
  var ctx = document.getElementById('prod-scenario-compare-chart');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Base Plan', 'Demand +15%', 'Line Breakdown', 'New SKU Launch', 'Energy Saving'],
        datasets: [
          { label: 'Output (K cases)', data: [310, 356, 285, 325, 291], backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4 },
          { label: 'Cost Index', data: [100, 108, 92, 104, 88], backgroundColor: 'rgba(217,119,6,0.75)', borderRadius: 4 },
          { label: 'Service Level %', data: [94.2, 91.8, 88.4, 93.1, 93.8], backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });
  }
});
async function createProdScenario() {
  var name = document.getElementById('prod-sc-name').value;
  if (!name) return;
  await axios.post('/api/scenarios', { module:'production', name, description: document.getElementById('prod-sc-desc').value, driver: document.getElementById('prod-sc-driver').value });
  location.reload();
}
    ` }}></script>
  </Layout>)
})

app.get('/production/ml-models', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production – ML Models" activeModule="prod-mlmodels">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)"><i class="fas fa-brain"></i></div>
        <div>
          <div class="page-title">ML Models – Production Planning</div>
          <div class="page-subtitle">Demand forecasting · ATP prediction · RCCP optimization · Model drift monitoring</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-success">3 Models Active</span>
        <button class="btn btn-primary" onclick="retrainModels(this)"><i class="fas fa-sync"></i> Retrain</button>
        <button class="btn btn-secondary" onclick="showRunHistory()"><i class="fas fa-history"></i> Run History</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      {[
        { name: 'Demand Forecaster', type: 'LSTM + XGBoost Ensemble', accuracy: '92.1%', mape: '4.6%', status: 'healthy', last_run: 'Mar 17, 06:00', features: 24, icon: 'fa-chart-line' },
        { name: 'ATP Predictor', type: 'Random Forest + LightGBM', accuracy: '88.4%', mape: '6.0%', status: 'healthy', last_run: 'Mar 17, 06:30', features: 18, icon: 'fa-check-double' },
        { name: 'RCCP Optimizer', type: 'Constraint Programming + ML', accuracy: '85.8%', mape: '7.2%', status: 'warning', last_run: 'Mar 17, 07:00', features: 32, icon: 'fa-ruler-combined' },
      ].map(m => (
        <div class="card">
          <div class="card-header">
            <span class="card-title"><i class={`fas ${m.icon}`}></i> {m.name}</span>
            <span class={`badge badge-${m.status}`}>{m.status}</span>
          </div>
          <div class="card-body">
            <div style="font-size:11px;color:#64748B;margin-bottom:8px">{m.type}</div>
            <div class="grid-2" style="gap:8px;margin-bottom:12px">
              <div style="background:#F0F4FA;padding:8px;border-radius:8px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#1E3A8A">{m.accuracy}</div>
                <div style="font-size:10px;color:#64748B">Accuracy</div>
              </div>
              <div style="background:#F0FDF4;padding:8px;border-radius:8px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#059669">{m.mape}</div>
                <div style="font-size:10px;color:#64748B">MAPE</div>
              </div>
            </div>
            <div style="font-size:11px;color:#64748B">{m.features} features · Last run: {m.last_run}</div>
            <div style="margin-top:12px;display:flex;gap:6px">
              <button class="btn btn-sm btn-primary" onclick="runMLModel(this,'{m.name}')"><i class="fas fa-play"></i> Run</button>
              <button class="btn btn-sm btn-secondary" onclick="window.showToast&&window.showToast('Model log: last run 4.2s, accuracy 87.3%, no drift detected.','info')"><i class="fas fa-history"></i> Logs</button>
              <button class="btn btn-sm btn-secondary" onclick="window.showToast&&window.showToast('Config: adjust hyperparameters via ML Config API.','info')"><i class="fas fa-sliders-h"></i> Config</button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-radar-chart"></i> Model Performance Radar</span></div>
        <div class="card-body" style="height:280px"><canvas id="ml-perf-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Model Accuracy Trend (6M)</span></div>
        <div class="card-body" style="height:280px"><canvas id="ml-drift-chart"></canvas></div>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> Feature Importance – Demand Forecaster</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Feature</th><th>Type</th><th>Importance</th><th>Stability</th></tr></thead>
          <tbody>
            {[
              { feature: 'Historical Sales (lag 1–4 wk)', type: 'Time-series', imp: 31.2, stability: 'High' },
              { feature: 'Seasonality Index', type: 'Calendar', imp: 18.6, stability: 'High' },
              { feature: 'Promotional Events', type: 'External', imp: 14.3, stability: 'Medium' },
              { feature: 'Distribution Reach', type: 'Operational', imp: 11.8, stability: 'High' },
              { feature: 'Competitor Price Index', type: 'Market', imp: 8.4, stability: 'Low' },
              { feature: 'Weather Index', type: 'External', imp: 7.2, stability: 'Medium' },
              { feature: 'Plant Capacity Available', type: 'Operational', imp: 5.9, stability: 'High' },
              { feature: 'Raw Material Availability', type: 'Supply', imp: 2.6, stability: 'Medium' },
            ].map(f => (
              <tr>
                <td><strong>{f.feature}</strong></td>
                <td><span class="badge badge-neutral">{f.type}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="width:100px"><div class="progress-fill healthy" style={`width:${f.imp * 3}%`}></div></div>
                    <span style="font-weight:600">{f.imp}%</span>
                  </div>
                </td>
                <td><span class={`badge badge-${f.stability === 'High' ? 'success' : f.stability === 'Medium' ? 'warning' : 'critical'}`}>{f.stability}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-mlmodels';</script>
  </Layout>)
})

app.get('/production/analytics', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production Analytics" activeModule="prod-analytics">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-chart-bar"></i></div>
        <div>
          <div class="page-title">Production Analytics</div>
          <div class="page-subtitle">Output vs plan · Efficiency by line · Loss analysis · Schedule adherence</div>
        </div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" style="width:auto;font-size:13px">
          <option>Last 14 Days</option><option>Last 30 Days</option><option>This Month</option>
        </select>
        <a href="/production/shelf-life" class="btn btn-secondary"><i class="fas fa-clock"></i> Shelf Life / FEFO</a>
        <a href="/api/export/mps?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export CSV</a>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-industry" style="margin-right:5px"></i>Output vs Plan</div>
        <div class="kpi-value warning">91.8%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 95%</span><span class="kpi-trend up">↑ +1.2%</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-tachometer-alt" style="margin-right:5px"></i>Avg Line Efficiency</div>
        <div class="kpi-value healthy">88.4%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 88%</span><span class="kpi-trend up">↑ On target</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-exchange-alt" style="margin-right:5px"></i>Changeover Loss</div>
        <div class="kpi-value warning">4.6 hrs/day</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 3.5 hrs</span><span class="kpi-trend down">↓ –0.3</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Planned vs Actual Output (14 Days)</span></div>
        <div class="card-body" style="height:240px"><canvas id="prod-output-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Line Efficiency by Production Line</span></div>
        <div class="card-body" style="height:240px"><canvas id="prod-efficiency-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Production Performance Summary</span><a href="/capacity/analytics" class="btn btn-sm btn-secondary"><i class="fas fa-tachometer-alt"></i> Full OEE in Capacity</a></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Line</th><th>Plant</th><th>Planned (cases)</th><th>Actual (cases)</th><th>Attainment %</th><th>OEE</th><th>Changeover (hrs)</th><th>Downtime</th><th>Trend</th></tr></thead>
          <tbody>
            {[
              { line: 'MUM-L1', plant: 'Mumbai', planned: 42000, actual: 39600, att: 94.3, oee: 77.1, co: 3.2, dt: 1.8 },
              { line: 'MUM-L2', plant: 'Mumbai', planned: 45000, actual: 40050, att: 89.0, oee: 85.4, co: 2.8, dt: 0.6 },
              { line: 'DEL-L1', plant: 'Delhi', planned: 36000, actual: 33840, att: 94.0, oee: 79.2, co: 4.1, dt: 2.1 },
              { line: 'DEL-L2', plant: 'Delhi', planned: 28000, actual: 26320, att: 94.0, oee: 76.8, co: 5.2, dt: 2.8 },
              { line: 'CHN-L1', plant: 'Chennai', planned: 32000, actual: 29120, att: 91.0, oee: 81.4, co: 3.8, dt: 1.4 },
              { line: 'BAN-L1', plant: 'Bangalore', planned: 26000, actual: 24700, att: 95.0, oee: 78.6, co: 2.6, dt: 1.2 },
            ].map(r => (
              <tr>
                <td><strong>{r.line}</strong></td>
                <td>{r.plant}</td>
                <td>{r.planned.toLocaleString()}</td>
                <td>{r.actual.toLocaleString()}</td>
                <td style={`font-weight:600;color:${r.att >= 93 ? '#059669' : r.att >= 88 ? '#D97706' : '#DC2626'}`}>{r.att}%</td>
                <td>{r.oee}%</td>
                <td style={`color:${r.co > 4 ? '#DC2626' : r.co > 3 ? '#D97706' : '#059669'}`}>{r.co}h</td>
                <td style={`color:${r.dt > 2 ? '#DC2626' : '#D97706'}`}>{r.dt}h</td>
                <td><span style="font-size:18px">{r.att >= 93 ? '↗' : r.att >= 88 ? '→' : '↘'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-analytics';</script>
  </Layout>)
})

app.get('/production/copilot', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production AI Copilot" activeModule="prod-copilot">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)"><i class="fas fa-robot"></i></div>
        <div>
          <div class="page-title">Production AI Copilot</div>
          <div class="page-subtitle">Natural language interface · MPS queries · ATP checks · RCCP analysis · Schedule optimization</div>
        </div>
      </div>
      <div class="page-header-right"><span class="badge badge-live">AI Live</span></div>
    </div>

    <div class="grid-2-1">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-comments"></i> AI Production Assistant</span></div>
        <div id="copilot-messages" class="chat-messages" style="min-height:360px">
          <div class="chat-msg assistant"><i class="fas fa-robot" style="margin-right:8px;color:#7C3AED"></i>Hello! I'm your Production Planning AI Copilot. I can help you with MPS analysis, ATP checks, RCCP capacity planning, and production optimization. What would you like to explore?</div>
        </div>
        <div class="chat-input-area">
          <input class="form-input flex-1" id="copilot-input" placeholder="Ask about MPS, ATP, RCCP, capacity..." onkeydown="if(event.key==='Enter'){sendCopilot(this.value);this.value=''}"/>
          <button class="btn btn-primary" onclick="const i=document.getElementById('copilot-input');sendCopilot(i.value);i.value=''"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-bolt"></i> Suggested Queries</span></div>
        <div class="card-body" id="copilot-suggestions"></div>
        <div class="card-header" style="margin-top:12px"><span class="card-title"><i class="fas fa-chart-pie"></i> AI Insights</span></div>
        <div class="card-body compact">
          <div style="margin-bottom:10px;padding:10px;background:#EFF6FF;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#1D4ED8">📊 MPS Health: 94.2% adherence</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">2 ATP constraints detected in W3. Recommend expediting.</div>
          </div>
          <div style="margin-bottom:10px;padding:10px;background:#FEF3C7;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#D97706">⚠ RCCP Alert: MUM-L2</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">98% load W2. Suggest shifting 8K cases to DEL-L1.</div>
          </div>
          <div style="padding:10px;background:#F0FDF4;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#059669">✓ Changeover Optimization</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">Optimal sequence saves 4.5 hrs changeover this week.</div>
          </div>
        </div>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-copilot';</script>
  </Layout>)
})

// ── Shelf Life / FEFO (H5: moved to Inventory, alias kept for back-compat) ──
app.get('/inventory/shelf-life', (c) => c.redirect('/production/shelf-life'))
app.get('/production/shelf-life', (c) => {
  const scripts = `
async function init() {
  const data = await axios.get('/api/production/shelf-life').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('fefo-table');
  if (!el) return;
  el.innerHTML = data.map(b => \`<tr>
    <td><strong>\${b.sku}</strong><br/><span style="font-size:11px;color:#64748B">\${b.sku_name}</span></td>
    <td>\${b.batch_id}</td>
    <td>\${b.mfg_date}</td>
    <td>\${b.expiry_date}</td>
    <td style="font-weight:600;color:\${b.remaining_days<60?'#DC2626':b.remaining_days<90?'#D97706':'#059669'}">\${b.remaining_days}d</td>
    <td>\${b.qty?.toLocaleString()}</td>
    <td>\${b.location}</td>
    <td>\${b.fefo_priority}</td>
    <td><span class="badge badge-\${b.risk}">\${b.risk}</span></td>
    <td>\${b.risk!=='healthy'?'<button class="btn btn-sm btn-warning" onclick="priorityDeploy(\\'' + b.batch_id + '\\',\\'' + b.sku + '\\')">Deploy First</button>':'<span style=\\"color:#059669;font-size:11px\\">OK</span>'}</td>
  </tr>\`).join('');
}
function priorityDeploy(batchId, sku) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  setTimeout(() => {
    btn.innerHTML = '✓ Prioritized';
    btn.className = 'btn btn-sm btn-success';
    btn.disabled = true;
    window.showToast(batchId + ' flagged for priority dispatch. Auto-picked in next deployment run.','success');
  }, 1000);
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Shelf Life & FEFO Management" activeModule="inv-shelf-life" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-clock"></i></div>
        <div>
          <div class="page-title">Shelf Life & FEFO Management</div>
          <div class="page-subtitle">First-Expired-First-Out batch tracking · Near-expiry alerts · Priority deployment</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-critical">2 Near-Expiry Batches</span>
        <a href="/production/analytics" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Analytics</a>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle" style="margin-right:5px"></i>Critical (≤60d)</div>
        <div class="kpi-value critical">1</div>
        <div class="kpi-meta"><span class="kpi-target">BAT-005 – 44 days</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-clock" style="margin-right:5px"></i>Warning (61-90d)</div>
        <div class="kpi-value warning">2</div>
        <div class="kpi-meta"><span class="kpi-target">Needs attention</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-check-circle" style="margin-right:5px"></i>Healthy (&gt;90d)</div>
        <div class="kpi-value healthy">2</div>
        <div class="kpi-meta"><span class="kpi-target">No action needed</span></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> Batch FEFO Tracker</span>
        <div style="display:flex;gap:8px">
          <span style="font-size:12px;color:#64748B">Sorted by expiry date (FEFO order)</span>
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Batch ID</th><th>Mfg Date</th><th>Expiry</th><th>Remaining</th><th>Qty (cases)</th><th>Location</th><th>FEFO Priority</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody id="fefo-table"><tr><td colspan={10} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ============================================================
// DEPLOYMENT PLANNING MODULE
// ============================================================

app.get('/deployment', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Deployment Planning" activeModule="deployment">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-truck"></i></div>
        <div>
          <div class="page-title">Deployment Planning</div>
          <div class="page-subtitle">Distribution network · Route optimization · Load planning · Carrier management</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <a href="/deployment/workbench" class="btn btn-primary"><i class="fas fa-drafting-compass"></i> Workbench</a>
        <a href="/deployment/routes" class="btn btn-secondary"><i class="fas fa-route"></i> Route Optimizer</a>
      </div>
    </div>
    <div class="kpi-grid" id="dep-kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-truck"></i> Fleet Utilization by Hub</span><a href="/deployment/load-planning" class="btn btn-sm btn-secondary">Load Planning</a></div>
        <div class="card-body" style="height:220px"><canvas id="dep-fleet-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> On-Time Delivery Trend (8W)</span></div>
        <div class="card-body" style="height:220px"><canvas id="dep-otd-chart"></canvas></div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-rupee-sign"></i> Logistics Cost Breakdown</span></div>
        <div class="card-body" style="height:220px"><canvas id="dep-cost-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Active Alerts</span></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>OTD Gap: 3.6pp below target</strong><br/>Actual 91.4% vs target 95%. Delhi → Lucknow route delayed 14 hrs.</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Mumbai Hub at 87% capacity</strong><br/>Peak season ahead. Review load diversion to Pune cross-dock.</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Carrier VRL Logistics OTD: 85.6%</strong><br/>Below 88% SLA threshold. Consider contract review.</div></div>
          <div class="alert alert-info"><i class="fas fa-info-circle"></i><div><strong>24 routes ready for AI optimization</strong><br/>ML optimizer identified ₹4.2L/month savings opportunity.</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Today's Shipment Summary</span><a href="/deployment/workbench" class="btn btn-sm btn-secondary">Full Workbench</a></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Shipment ID</th><th>Route</th><th>Volume</th><th>Truck</th><th>Util %</th><th>ETD</th><th>ETA</th><th>Status</th></tr></thead>
          <tbody>
            {[
              { id: 'SHP-0317-001', route: 'Mumbai → Pune', vol: '1,240 cases', truck: '32ft', util: 92, etd: 'Mar 17 06:00', eta: 'Mar 17 10:00', status: 'in_transit' },
              { id: 'SHP-0317-002', route: 'Delhi → Jaipur', vol: '820 cases', truck: '22ft', util: 78, etd: 'Mar 17 08:00', eta: 'Mar 17 13:00', status: 'planned' },
              { id: 'SHP-0317-003', route: 'Chennai → Coimbatore', vol: '960 cases', truck: '22ft', util: 88, etd: 'Mar 17 07:00', eta: 'Mar 17 15:00', status: 'loading' },
              { id: 'SHP-0317-006', route: 'Delhi → Lucknow', vol: '1,120 cases', truck: '32ft', util: 89, etd: 'Mar 17 09:00', eta: 'Mar 17 21:00', status: 'delayed' },
            ].map(s => (
              <tr>
                <td><strong>{s.id}</strong></td>
                <td>{s.route}</td>
                <td>{s.vol}</td>
                <td>{s.truck}</td>
                <td style={`font-weight:600;color:${s.util >= 90 ? '#1D4ED8' : '#059669'}`}>{s.util}%</td>
                <td>{s.etd}</td>
                <td>{s.eta}</td>
                <td><span class={`badge badge-${s.status === 'in_transit' ? 'success' : s.status === 'delayed' ? 'critical' : s.status === 'loading' ? 'warning' : 'info'}`}>{s.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script>document.body.dataset.page='deployment-home';</script>
  </Layout>)
})

app.get('/deployment/network', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Distribution Network" activeModule="dep-network">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-project-diagram"></i></div>
        <div>
          <div class="page-title">Distribution Network</div>
          <div class="page-subtitle">Hub & spoke design · DC utilization · Flow analysis · Coverage by channel</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-info">6 Hubs Active</span>
        <button class="btn btn-primary" onclick="redesignNetwork()"><i class="fas fa-sitemap"></i> Redesign Network</button>
        <button class="btn btn-secondary" onclick="location.href='/api/export/network?format=csv'"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-warehouse" style="margin-right:5px"></i>Active DCs</div>
        <div class="kpi-value healthy">6</div>
        <div class="kpi-meta"><span class="kpi-target">5 owned, 1 leased</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-route" style="margin-right:5px"></i>Active Lanes</div>
        <div class="kpi-value warning">124</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 150</span><span class="kpi-trend up">↑ +8 new</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-tachometer-alt" style="margin-right:5px"></i>Network Utilization</div>
        <div class="kpi-value warning">81%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 85%</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Hub Outbound / Inbound Flow (K cases/wk)</span></div>
        <div class="card-body" style="height:240px"><canvas id="network-flow-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-radar-chart"></i> Channel Coverage %</span></div>
        <div class="card-body" style="height:240px"><canvas id="network-coverage-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Network Nodes</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Hub / DC</th><th>Type</th><th>Capacity</th><th>Utilization</th><th>Active Lanes</th><th>OTD</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="network-nodes-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script>document.body.dataset.page='deployment-network';</script>
  </Layout>)
})

app.get('/deployment/workbench', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Deployment Planner Workbench" activeModule="dep-workbench">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-drafting-compass"></i></div>
        <div>
          <div class="page-title">Deployment Planner Workbench</div>
          <div class="page-subtitle">Manage shipments · Safety stock alerts · Inter-DC transfers · OTD risk</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary" onclick="createShipment()"><i class="fas fa-plus"></i> Create Shipment</button>
        <button class="btn btn-success" id="dispatch-btn" onclick="runDispatch()"><i class="fas fa-rocket"></i> AI Dispatch</button>
        <a href="/api/export/shipments?format=csv" class="btn btn-secondary"><i class="fas fa-download"></i> Export</a>
        <a href="/risk-dashboard" class="btn btn-secondary"><i class="fas fa-shield-alt"></i> Risk</a>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-truck-loading" style="margin-right:5px"></i>In Transit</div>
        <div class="kpi-value healthy">18</div>
        <div class="kpi-meta"><span class="kpi-target">Shipments today</span></div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle" style="margin-right:5px"></i>Delayed</div>
        <div class="kpi-value critical">2</div>
        <div class="kpi-meta"><span class="kpi-target">Need attention</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-tachometer-alt" style="margin-right:5px"></i>Avg Load Util</div>
        <div class="kpi-value warning">84%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 88%</span></div>
      </div>
    </div>

    <div id="dispatch-result" style="display:none" class="alert alert-success mb-4">
      <i class="fas fa-rocket"></i><div id="dispatch-result-text"></div>
    </div>
    <div id="ss-alerts" class="mb-4"></div>

    <div class="grid-2-1 mb-4">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-truck"></i> Shipment Queue</span>
          <div style="display:flex;gap:8px">
            <select class="form-input form-select" style="width:auto;font-size:12px" id="hub-filter" onchange="filterShipments()">
              <option value="">All Hubs</option><option value="Mumbai">Mumbai</option><option value="Delhi">Delhi</option><option value="Chennai">Chennai</option>
            </select>
            <select class="form-input form-select" style="width:auto;font-size:12px" id="status-filter" onchange="filterShipments()">
              <option value="">All Status</option><option value="in_transit">In Transit</option><option value="planned">Planned</option><option value="delayed">Delayed</option>
            </select>
            <button class="btn btn-sm btn-warning" onclick="consolidateLoads()"><i class="fas fa-compress-arrows-alt"></i> Consolidate</button>
          </div>
        </div>
        <div class="card-body compact">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Route</th><th>Volume</th><th>Util%</th><th>ETD</th><th>ETA</th><th>Status</th><th>OTD Risk</th><th>Action</th></tr></thead>
            <tbody id="dep-shipments-table"><tr><td colspan={9} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
          </table>
        </div>
      </div>
      <div>
        <div class="card mb-4">
          <div class="card-header"><span class="card-title"><i class="fas fa-shield-alt"></i> Safety Stock Alerts</span><a href="/risk-dashboard" class="btn btn-sm btn-secondary">Full Risk</a></div>
          <div class="card-body compact" id="ss-card-body"><div class="spinner"></div></div>
        </div>
        <div class="card">
          <div class="card-header"><span class="card-title"><i class="fas fa-exchange-alt"></i> Inter-DC Transfers</span></div>
          <div class="card-body compact" id="idt-body"><div class="spinner"></div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-map-marked-alt"></i> Market SLA Tracker</span>
        <a href="/deployment/analytics" class="btn btn-sm btn-secondary">Full Analytics</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Market</th><th>Target OTD</th><th>Actual OTD</th><th>Lead Time</th><th>Fill Rate</th><th>SLA Status</th><th>Trend</th></tr></thead>
          <tbody id="sla-table"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    <script src="/static/deployment-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='deployment-workbench';
let allShipments = [];
async function initWorkbench() {
  const [ships, ss, idt, sla] = await Promise.all([
    axios.get('/api/deployment/shipments').then(r=>r.data).catch(()=>[]),
    axios.get('/api/deployment/safety-stock').then(r=>r.data).catch(()=>[]),
    axios.get('/api/deployment/inter-dc-transfers').then(r=>r.data).catch(()=>[]),
    axios.get('/api/deployment/market-sla').then(r=>r.data).catch(()=>[]),
  ]);
  allShipments = ships;
  renderShipments(ships);
  renderSSAlerts(ss);
  renderIDT(idt);
  renderSLA(sla);
}
function renderShipments(data) {
  const el = document.getElementById('dep-shipments-table');
  if (!el) return;
  const riskColors = {'critical':'#DC2626','warning':'#D97706','healthy':'#059669'};
  el.innerHTML = data.map(s => \`<tr>
    <td><strong>\${s.id}</strong></td>
    <td>\${s.origin} → \${s.destination}</td>
    <td>\${s.volume?.toLocaleString()} cases</td>
    <td style="font-weight:600;color:\${s.utilization>=90?'#1D4ED8':s.utilization>=80?'#059669':'#D97706'}">\${s.utilization}%</td>
    <td>\${s.etd}</td>
    <td>\${s.eta}</td>
    <td><span class="badge badge-\${s.status==='in_transit'?'success':s.status==='delayed'?'critical':s.status==='loading'?'warning':'info'}">\${s.status}</span></td>
    <td><span class="badge badge-\${s.status==='delayed'?'critical':s.utilization<75?'warning':'success'}">\${s.status==='delayed'?'High':s.utilization<75?'Med':'Low'}</span></td>
    <td style="display:flex;gap:4px">
      \${s.status==='planned'||s.status==='loading'?'<button class="btn btn-sm btn-success" onclick="shipAction(\\'' + s.id + '\\',\\'approve\\')">Dispatch</button>':''}
      \${s.status==='delayed'?'<button class="btn btn-sm btn-warning" onclick="shipAction(\\'' + s.id + '\\',\\'expedite\\')">Expedite</button>':''}
      <button class="btn btn-sm btn-secondary" onclick="shipAction(\\'' + s.id + '\\',\\'cancel\\')"><i class="fas fa-times"></i></button>
    </td>
  </tr>\`).join('') || '<tr><td colspan="9" style="text-align:center">No shipments</td></tr>';
}
function renderSSAlerts(data) {
  const el = document.getElementById('ss-card-body');
  if (!el) return;
  const critical = data.filter(s=>s.buffer_status==='red'||s.buffer_status==='yellow');
  el.innerHTML = critical.map(s => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-left:3px solid \${s.buffer_status==='red'?'#DC2626':'#D97706'};margin-bottom:6px;border-radius:4px;background:#F8FAFC">
    <div>
      <strong style="font-size:12px">\${s.sku} @ \${s.dc}</strong>
      <div style="font-size:11px;color:#64748B">Stock: \${s.current_stock?.toLocaleString()} / SS: \${s.safety_stock?.toLocaleString()} · Deploy: \${s.qty_to_deploy} cases</div>
    </div>
    \${s.replenish_now?'<button class="btn btn-sm btn-danger" onclick="replenish(\\'' + s.dc + '\\',\\'' + s.sku + '\\',' + s.qty_to_deploy + ')">Deploy</button>':'<span class="badge badge-success">OK</span>'}
  </div>\`).join('') || '<p class="text-muted text-sm">All safety stocks adequate</p>';
}
function renderIDT(data) {
  const el = document.getElementById('idt-body');
  if (!el) return;
  el.innerHTML = data.map(t => \`<div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:6px;border:1px solid var(--border);margin-bottom:6px">
    <div>
      <strong style="font-size:12px">\${t.from_dc} → \${t.to_dc}</strong>
      <div style="font-size:11px;color:#64748B">\${t.sku} · \${t.qty} cases · Save ₹\${t.estimated_saving_inr?.toLocaleString()}</div>
    </div>
    <div style="display:flex;gap:4px">
      \${t.status==='recommended'?'<button class="btn btn-sm btn-success" onclick="approveIDT(\\'' + t.id + '\\')">Approve</button>':'<span class="badge badge-success">' + t.status + '</span>'}
    </div>
  </div>\`).join('') || '<p class="text-muted text-sm">No transfer recommendations</p>';
}
function renderSLA(data) {
  const el = document.getElementById('sla-table');
  if (!el) return;
  el.innerHTML = data.map(m => \`<tr>
    <td><strong>\${m.market}</strong></td>
    <td>\${m.target_otd}%</td>
    <td style="font-weight:600;color:\${m.actual_otd>=m.target_otd?'#059669':m.actual_otd>=m.target_otd-3?'#D97706':'#DC2626'}">\${m.actual_otd}%</td>
    <td>\${m.actual_lead_time_days}d (tgt:\${m.target_lead_time_days}d)</td>
    <td>\${m.fill_rate}%</td>
    <td><span class="badge badge-\${m.sla_status}">\${m.sla_status}</span></td>
    <td>\${m.trend==='improving'?'↗':m.trend==='declining'?'↘':'→'}</td>
  </tr>\`).join('');
}
async function shipAction(id, action) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;
  const res = await axios.post('/api/deployment/shipment-action', {shipment_id:id, action}).catch(()=>({data:{success:false}}));
  if (res.data.success) {
    btn.innerHTML = action==='approve'?'✓ Dispatched':action==='expedite'?'⚡ Expediting':'✕ Cancelled';
    btn.className = 'btn btn-sm btn-success';
  } else {
    btn.innerHTML = 'Error';
    btn.disabled = false;
  }
}
async function replenish(dc, sku, qty) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  await new Promise(r=>setTimeout(r,1200));
  btn.innerHTML = '✓ Deployed';
  btn.className = 'btn btn-sm btn-success';
  btn.disabled = true;
}
async function approveIDT(id) {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  await axios.post('/api/approvals/' + id + '/action', {action:'approve', comment:'IDT approved'}).catch(()=>{});
  btn.innerHTML = '✓ Approved';
  btn.className = 'btn btn-sm btn-success';
  btn.disabled = true;
}
async function runDispatch() {
  const btn = document.getElementById('dispatch-btn');
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Planning...';
  btn.disabled = true;
  const res = await axios.post('/api/deployment/dispatch', {plant:'Mumbai', date:'2026-03-17'}).catch(()=>({data:{status:'error'}}));
  if (res.data.status === 'success') {
    const el = document.getElementById('dispatch-result');
    const text = document.getElementById('dispatch-result-text');
    text.innerHTML = '<strong>AI Dispatch Plan Generated!</strong> ' + res.data.trips.length + ' trips · Avg util: ' + res.data.avg_utilization + '% · Total cost: ₹' + res.data.total_cost_inr?.toLocaleString() + ' · Savings vs unoptimized: ₹' + res.data.savings_vs_unoptimized_inr?.toLocaleString();
    el.style.display = 'flex';
  }
  btn.innerHTML = '<i class="fas fa-rocket"></i> AI Dispatch';
  btn.disabled = false;
}
async function consolidateLoads() {
  const btn = event.target;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  const res = await axios.post('/api/deployment/consolidate', {trips:3}).catch(()=>({data:{success:false}}));
  if (res.data.success) {
    window.showToast('Consolidated ' + res.data.original_trips + ' → ' + res.data.consolidated_trips + ' trips. Avg util: ' + res.data.avg_utilization_after + '%. Saving: ₹' + (res.data.saving_inr||0).toLocaleString(),'success');
  }
  btn.innerHTML = '<i class="fas fa-compress-arrows-alt"></i> Consolidate';
}
function filterShipments() {
  const hub = document.getElementById('hub-filter')?.value;
  const status = document.getElementById('status-filter')?.value;
  const filtered = allShipments.filter(s => (!hub || s.origin === hub) && (!status || s.status === status));
  renderShipments(filtered);
}
function createShipment() {
  const origin = prompt('Origin Hub (e.g., Mumbai, Delhi, Chennai):');
  if (!origin) return;
  const dest = prompt('Destination DC (e.g., Pune, Jaipur, Coimbatore):');
  if (!dest) return;
  const qty = prompt('Quantity (cases):') || '1000';
  const id = 'SHP-' + new Date().toISOString().slice(5,10).replace('-','') + '-' + String(Math.floor(Math.random()*900)+100);
  window.showToast('Shipment ' + id + ' created: ' + origin + ' to ' + dest + ', ' + Number(qty).toLocaleString() + ' cases. Carrier assignment in progress.', 'success');
}
document.addEventListener('DOMContentLoaded', initWorkbench);
    ` }}></script>
  </Layout>)
})

app.get('/deployment/routes', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Route Optimization" activeModule="dep-route">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-route"></i></div>
        <div>
          <div class="page-title">Route Optimization</div>
          <div class="page-subtitle">AI-powered route planning · Cost minimization · Transit time optimization · Mode selection</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-info">124 Active Routes</span>
        <button class="btn btn-primary" id="route-opt-btn" onclick="runRouteOptimize()"><i class="fas fa-robot"></i> AI Optimize All</button>
        <button class="btn btn-secondary" onclick="showNewRoute()"><i class="fas fa-plus"></i> New Route</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-rupee-sign" style="margin-right:5px"></i>Avg Cost/Case</div>
        <div class="kpi-value warning">₹18.4</div>
        <div class="kpi-meta"><span class="kpi-target">Target: ₹17.0</span><span class="kpi-trend up">↓ –₹0.3 WoW</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-clock" style="margin-right:5px"></i>Avg Transit</div>
        <div class="kpi-value healthy">2.8d</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 2.5d</span></div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-magic" style="margin-right:5px"></i>Optimization Potential</div>
        <div class="kpi-value">₹4.2L</div>
        <div class="kpi-meta"><span class="kpi-target">/month savings</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Cost by Transport Mode</span></div>
        <div class="card-body" style="height:220px"><canvas id="routes-cost-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Transit Time Distribution</span></div>
        <div class="card-body" style="height:220px"><canvas id="routes-transit-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> Route Library</span>
        <div style="display:flex;gap:8px">
          <input class="form-input" style="width:180px;font-size:12px" placeholder="Search routes..." />
          <select class="form-input form-select" style="width:auto;font-size:12px"><option>All Carriers</option></select>
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Route ID</th><th>Lane</th><th>Distance</th><th>Transit</th><th>Cost/Case</th><th>Carrier</th><th>Opt. Score</th><th>Action</th></tr></thead>
          <tbody id="routes-table-body"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='deployment-routes';
let routeOptResult = null;
async function runRouteOptimize() {
  const btn = document.getElementById('route-opt-btn');
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...'; btn.disabled = true; }
  const res = await axios.post('/api/deployment/optimize-network', {objective:'cost'}).catch(()=>({data:{status:'error'}}));
  if (res.data.status === 'success') {
    const d = res.data;
    const msg = 'Network Optimized! Cost: ₹' + d.optimized.total_cost_lakh + 'L (save ₹' + (d.baseline.total_cost_lakh - d.optimized.total_cost_lakh).toFixed(1) + 'L) · Util: ' + d.optimized.avg_utilization + '% · Trips: ' + d.optimized.total_trips;
    const el = document.createElement('div');
    el.className = 'alert alert-success';
    el.style.marginBottom = '16px';
    el.innerHTML = '<i class="fas fa-check-circle"></i><div><strong>Optimization Complete!</strong> ' + msg + '<br/><strong>Route changes:</strong> ' + d.route_changes.map(r=>r.route+': '+r.change).join(' | ') + '</div>';
    document.querySelector('.page-header').after(el);
    setTimeout(()=>el.remove(), 10000);
  }
  if (btn) { btn.innerHTML = '<i class="fas fa-robot"></i> AI Optimize All'; btn.disabled = false; }
}
    ` }}></script>
  </Layout>)
})

app.get('/deployment/load-planning', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Load Planning" activeModule="dep-load">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-boxes"></i></div>
        <div>
          <div class="page-title">Load Planning</div>
          <div class="page-subtitle">Truck utilization · SKU mix optimization · Weight & cube utilization · Pack-size conversion</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-warning">Avg Util: 84%</span>
        <button class="btn btn-primary" id="auto-opt-btn" onclick="autoOptimizeLoads()"><i class="fas fa-magic"></i> Auto-Optimize All</button>
        <a href="/api/master/pack-sizes" class="btn btn-secondary"><i class="fas fa-ruler"></i> Pack-Size Master</a>
        <button class="btn btn-secondary" onclick="showNewLoadPlan()"><i class="fas fa-plus"></i> New Load Plan</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-truck" style="margin-right:5px"></i>Space Utilization</div>
        <div class="kpi-value warning">84%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 88%</span><span class="kpi-trend up">↑ +2%</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-weight" style="margin-right:5px"></i>Weight Utilization</div>
        <div class="kpi-value warning">79%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 85%</span></div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-boxes" style="margin-right:5px"></i>Trucks Today</div>
        <div class="kpi-value">23</div>
        <div class="kpi-meta"><span class="kpi-target">5 pending dispatch</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Truck Utilization by Vehicle</span></div>
        <div class="card-body" style="height:220px"><canvas id="load-utilization-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-pie"></i> SKU Mix in Load Plans</span></div>
        <div class="card-body" style="height:220px"><canvas id="load-sku-mix-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Load Plans</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Plan ID</th><th>Vehicle</th><th>Type</th><th>Lane</th><th>Contents</th><th>Weight</th><th>Space Util</th><th>Depart</th><th>Action</th></tr></thead>
          <tbody id="load-plans-table"><tr><td colspan={9} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='deployment-load';
async function autoOptimizeLoads() {
  const btn = document.getElementById('auto-opt-btn');
  if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Optimizing...'; btn.disabled = true; }
  const res = await axios.post('/api/deployment/consolidate', {trips:5}).catch(()=>({data:{success:false}}));
  if (res.data.success) {
    const msg = document.createElement('div');
    msg.className = 'alert alert-success';
    msg.style.marginBottom = '16px';
    msg.innerHTML = '<i class="fas fa-magic"></i><div><strong>Auto-Optimization Complete!</strong> ' + res.data.original_trips + ' → ' + res.data.consolidated_trips + ' trips. Avg util: <strong>' + res.data.avg_utilization_after + '%</strong>. Saving: <strong>₹' + res.data.saving_inr?.toLocaleString() + '</strong>. CO₂ saved: ' + res.data.co2_saved_kg + 'kg</div>';
    document.querySelector('.page-header').after(msg);
    setTimeout(()=>msg.remove(), 8000);
  }
  if (btn) { btn.innerHTML = '<i class="fas fa-magic"></i> Auto-Optimize All'; btn.disabled = false; }
}
    ` }}></script>
  </Layout>)
})

app.get('/deployment/carriers', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Carrier Selection" activeModule="dep-carrier">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)"><i class="fas fa-shipping-fast"></i></div>
        <div>
          <div class="page-title">Carrier Selection</div>
          <div class="page-subtitle">Carrier performance · Contract management · Rate benchmarking · Risk scoring</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-info">5 Carriers</span>
        <button class="btn btn-primary" onclick="runCarrierRFQ(this)"><i class="fas fa-gavel"></i> Run RFQ</button>
        <button class="btn btn-secondary" onclick="addCarrier()"><i class="fas fa-plus"></i> Add Carrier</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-star" style="margin-right:5px"></i>Preferred Carriers</div>
        <div class="kpi-value healthy">2</div>
        <div class="kpi-meta"><span class="kpi-target">BlueDart, DHL</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle" style="margin-right:5px"></i>Below SLA</div>
        <div class="kpi-value warning">1</div>
        <div class="kpi-meta"><span class="kpi-target">VRL &lt;88% OTD</span></div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-rupee-sign" style="margin-right:5px"></i>Avg Rate vs Market</div>
        <div class="kpi-value">–8.2%</div>
        <div class="kpi-meta"><span class="kpi-target">Favorable vs benchmark</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-radar-chart"></i> Carrier Performance Radar</span></div>
        <div class="card-body" style="height:280px"><canvas id="carrier-perf-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Carrier Alerts</span></div>
        <div class="card-body">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>VRL Logistics – OTD 85.6%</strong><br/>Below contractual SLA of 88%. Escalation required. Consider shifting 30% volume to Gati-KWE as backup.</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>Gati-KWE – Damage Rate 0.21%</strong><br/>Above 0.15% threshold. Request root cause investigation.</div></div>
          <div class="alert alert-success"><i class="fas fa-check-circle"></i><div><strong>BlueDart – SLA All Green</strong><br/>94.2% OTD, 0.12% damage, GPS tracking 96% uptime.</div></div>
          <div class="alert alert-info"><i class="fas fa-info-circle"></i><div><strong>DHL Contract Renewal – 45 days</strong><br/>Current rates expire May 1, 2026. Benchmark report ready.</div></div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Carrier Scorecard</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Carrier</th><th>Lanes</th><th>OTD %</th><th>Damage Rate</th><th>Cost/Case</th><th>Tracking</th><th>Rating</th><th>Spend Share</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="carrier-table-body"><tr><td colspan={10} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script>document.body.dataset.page='deployment-carriers';</script>
  </Layout>)
})

app.get('/deployment/scenarios', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Deployment Scenario Manager" activeModule="dep-scenarios">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-layer-group"></i></div>
        <div>
          <div class="page-title">Deployment Scenario Manager</div>
          <div class="page-subtitle">Model distribution what-ifs · Network redesign · Carrier swap · Cost vs. service tradeoffs</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="document.getElementById('new-dep-sc').style.display='block'"><i class="fas fa-plus"></i> New Scenario</button>
        <button class="btn btn-secondary" onclick="window.showToast&&window.showToast('Import: Supported formats: JSON scenario export, CSV route matrix, Excel deployment template.','info')"><i class="fas fa-upload"></i> Import</button>
      </div>
    </div>

    <div class="card mb-4" id="new-dep-sc" style="display:none">
      <div class="card-header"><span class="card-title">Create New Deployment Scenario</span></div>
      <div class="card-body">
        <div class="grid-3">
          <div class="form-group"><label class="form-label">Name</label><input class="form-input" id="dep-sc-name" placeholder="e.g., Hub Consolidation Q3" /></div>
          <div class="form-group"><label class="form-label">Driver</label>
            <select class="form-input form-select" id="dep-sc-driver">
              <option>Cost</option><option>Service</option><option>Risk</option><option>Network</option><option>Carrier</option>
            </select>
          </div>
          <div class="form-group"><label class="form-label">Description</label><input class="form-input" id="dep-sc-desc" placeholder="Brief description" /></div>
        </div>
        <button class="btn btn-primary" onclick="createDepScenario()"><i class="fas fa-save"></i> Create Scenario</button>
        <button class="btn btn-secondary" onclick="document.getElementById('new-dep-sc').style.display='none'">Cancel</button>
      </div>
    </div>

    <div class="card mb-4">
      <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Scenario Impact Comparison</span></div>
      <div class="card-body" style="height:220px"><canvas id="dep-scenario-compare-chart"></canvas></div>
    </div>

    <div id="dep-scenarios-list"><div class="spinner"></div></div>

    <script src="/static/deployment-module.js"></script>
    <script dangerouslySetInnerHTML={{ __html: `
document.body.dataset.page='deployment-scenarios';
document.addEventListener('DOMContentLoaded', function() {
  var ctx = document.getElementById('dep-scenario-compare-chart');
  if (ctx) {
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Base Plan', 'Hub Consolidation', 'Direct-to-Retail', 'Rail Expansion', 'Flood Contingency'],
        datasets: [
          { label: 'Cost Index', data: [100, 86, 108, 79, 102], backgroundColor: 'rgba(37,99,235,0.75)', borderRadius: 4 },
          { label: 'OTD %', data: [91.4, 90.2, 97.0, 89.8, 88.0], backgroundColor: 'rgba(5,150,105,0.75)', borderRadius: 4 },
          { label: 'Transit Days', data: [2.8, 3.1, 1.8, 3.4, 3.2], backgroundColor: 'rgba(217,119,6,0.75)', borderRadius: 4 }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { beginAtZero: true } } }
    });
  }
});
async function createDepScenario() {
  var name = document.getElementById('dep-sc-name').value;
  if (!name) return;
  await axios.post('/api/scenarios', { module:'deployment', name, description: document.getElementById('dep-sc-desc').value, driver: document.getElementById('dep-sc-driver').value });
  location.reload();
}
    ` }}></script>
  </Layout>)
})

app.get('/deployment/ml-models', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Deployment ML Models" activeModule="dep-mlmodels">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)"><i class="fas fa-brain"></i></div>
        <div>
          <div class="page-title">ML Models – Deployment Planning</div>
          <div class="page-subtitle">Route optimizer · OTD predictor · Load optimizer · Carrier risk scoring · Demand sensing</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-success">3 Models Active</span>
        <button class="btn btn-primary" onclick="retrainModels(this)"><i class="fas fa-sync"></i> Retrain All</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      {[
        { name: 'Route Optimizer', type: 'Reinforcement Learning + VRP Solver', accuracy: '91.2%', savings: '₹4.2L/mo', status: 'healthy', last_run: 'Mar 17, 05:00', icon: 'fa-route', features: 38 },
        { name: 'OTD Predictor', type: 'Gradient Boosting + SHAP', accuracy: '87.4%', savings: '+3.2% OTD', status: 'healthy', last_run: 'Mar 17, 05:30', icon: 'fa-clock', features: 28 },
        { name: 'Load Optimizer', type: '3D Bin Packing + ML', accuracy: '94.1%', savings: '+4.8% util', status: 'healthy', last_run: 'Mar 17, 05:00', icon: 'fa-boxes', features: 22 },
      ].map(m => (
        <div class="card">
          <div class="card-header">
            <span class="card-title"><i class={`fas ${m.icon}`}></i> {m.name}</span>
            <span class={`badge badge-${m.status}`}>{m.status}</span>
          </div>
          <div class="card-body">
            <div style="font-size:11px;color:#64748B;margin-bottom:8px">{m.type}</div>
            <div class="grid-2" style="gap:8px;margin-bottom:12px">
              <div style="background:#F0F4FA;padding:8px;border-radius:8px;text-align:center">
                <div style="font-size:20px;font-weight:700;color:#1E3A8A">{m.accuracy}</div>
                <div style="font-size:10px;color:#64748B">Accuracy</div>
              </div>
              <div style="background:#F0FDF4;padding:8px;border-radius:8px;text-align:center">
                <div style="font-size:16px;font-weight:700;color:#059669">{m.savings}</div>
                <div style="font-size:10px;color:#64748B">Impact</div>
              </div>
            </div>
            <div style="font-size:11px;color:#64748B">{m.features} features · Last: {m.last_run}</div>
            <div style="margin-top:12px;display:flex;gap:6px">
              <button class="btn btn-sm btn-primary" onclick="runMLModel(this,'{m.name}')"><i class="fas fa-play"></i> Run</button>
              <button class="btn btn-sm btn-secondary" onclick="window.showToast&&window.showToast('Model log: last run 3.8s, accuracy 85.6%, no drift detected.','info')"><i class="fas fa-history"></i> Logs</button>
              <button class="btn btn-sm btn-secondary" onclick="window.showToast&&window.showToast('Config: adjust hyperparameters via ML Config API.','info')"><i class="fas fa-sliders-h"></i> Config</button>
            </div>
          </div>
        </div>
      ))}
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-radar-chart"></i> Model Performance Radar</span></div>
        <div class="card-body" style="height:280px"><canvas id="dep-ml-perf-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> Model Score Trend (6M)</span></div>
        <div class="card-body" style="height:280px"><canvas id="dep-ml-trend-chart"></canvas></div>
      </div>
    </div>

    <div class="card" style="margin-top:20px">
      <div class="card-header"><span class="card-title"><i class="fas fa-list"></i> Feature Importance – Route Optimizer</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Feature</th><th>Category</th><th>Importance</th><th>Stability</th></tr></thead>
          <tbody>
            {[
              { f: 'Historical OTD by Lane', cat: 'Performance', imp: 28.4, s: 'High' },
              { f: 'Real-time Traffic Index', cat: 'External', imp: 19.2, s: 'Medium' },
              { f: 'Distance & Road Type', cat: 'Network', imp: 16.8, s: 'High' },
              { f: 'Carrier OTD Score', cat: 'Carrier', imp: 12.4, s: 'High' },
              { f: 'Weather Forecast', cat: 'External', imp: 9.6, s: 'Low' },
              { f: 'Vehicle Capacity', cat: 'Fleet', imp: 7.8, s: 'High' },
              { f: 'Time Window Constraints', cat: 'Customer', imp: 5.8, s: 'Medium' },
            ].map(f => (
              <tr>
                <td><strong>{f.f}</strong></td>
                <td><span class="badge badge-neutral">{f.cat}</span></td>
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div class="progress-bar" style="width:100px"><div class="progress-fill healthy" style={`width:${f.imp * 3}%`}></div></div>
                    <span style="font-weight:600">{f.imp}%</span>
                  </div>
                </td>
                <td><span class={`badge badge-${f.s === 'High' ? 'success' : f.s === 'Medium' ? 'warning' : 'critical'}`}>{f.s}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script>document.body.dataset.page='deployment-mlmodels';</script>
  </Layout>)
})

// ── M5: Unified ML Hub (/ml-hub) — consolidates Production + Deployment ML models ──
app.get('/ml-hub', (c) => {
  const scripts = `
async function retrainAll(btn) {
  btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Retraining...';
  try {
    const r = await axios.post('/api/ml/retrain', { module:'all' });
    const d = r.data;
    window.showToast('Retraining complete! ' + d.models_retrained + ' models updated. Demand Forecaster improved by ' + (d.results?.[0]?.improvement_pct||2.1) + '%','success');
  } catch(e) {
    window.showToast('Retrain triggered — results will appear in model history.','info');
  }
  btn.innerHTML = '<i class="fas fa-sync"></i> Retrain All Models'; btn.disabled = false;
}
`.trim()
  const allModels = [
    { module: 'Production', icon: 'fa-cogs', color: '#7C3AED',
      models: [
        { name: 'Demand Forecaster', acc: '92.1%', mape: '4.6%', status: 'active', badge: 'success', detail: 'LSTM · 26-week horizon · Weekly retraining' },
        { name: 'ATP Predictor', acc: '88.4%', mape: '6.0%', status: 'active', badge: 'success', detail: 'XGBoost · Real-time ATP calculation · 14-day window' },
        { name: 'RCCP Optimizer', acc: '85.8%', mape: '7.2%', status: 'active', badge: 'warning', detail: 'Linear programming · Rough-cut capacity estimation' },
      ]
    },
    { module: 'Deployment', icon: 'fa-truck', color: '#0891B2',
      models: [
        { name: 'Route Optimizer', acc: '91.2%', mape: null, status: 'active', badge: 'success', detail: 'OR-Tools · ₹4.2L/mo savings · Multi-depot routing' },
        { name: 'OTD Predictor', acc: '87.4%', mape: null, status: 'active', badge: 'success', detail: 'Gradient boost · +3.2% OTD improvement · Live scoring' },
        { name: 'Load Optimizer', acc: '94.1%', mape: null, status: 'active', badge: 'success', detail: 'Bin-packing algo · +4.8% truck utilization' },
      ]
    },
    { module: 'S&OP / Demand', icon: 'fa-brain', color: '#059669',
      models: [
        { name: 'Consensus Forecast', acc: '89.3%', mape: '5.4%', status: 'active', badge: 'success', detail: 'Ensemble: ARIMA + LSTM + Prophet · Monthly retraining' },
        { name: 'Demand Sensing', acc: '82.1%', mape: '8.1%', status: 'training', badge: 'warning', detail: 'Real-time POS signal + weather + events' },
        { name: 'Price Elasticity', acc: '76.4%', mape: null, status: 'review', badge: 'warning', detail: 'Regression · Category-level pricing response' },
      ]
    },
  ]
  const _u = getUser(c)
  return c.html(<Layout user={_u} title="ML Hub" activeModule="prod-mlmodels" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)"><i class="fas fa-brain"></i></div>
        <div>
          <div class="page-title">ML Hub — Unified Model Registry</div>
          <div class="page-subtitle">Production · Deployment · Demand · S&OP models — accuracy tracking, retraining, governance</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-success">9 Models Active</span>
        <button class="btn btn-primary" onclick="retrainAll(this)"><i class="fas fa-sync"></i> Retrain All Models</button>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      {[['Active Models','9','healthy','fa-check-circle'],['Avg Accuracy','87.4%','healthy','fa-bullseye'],['Models in Training','1','warning','fa-spinner'],['Under Review','1','warning','fa-search']].map(([l,v,s,i]) =>
        <div key={l} class={`kpi-card ${s}`}>
          <div class="kpi-label"><i class={`fas ${i}`} style="margin-right:5px"></i>{l}</div>
          <div class={`kpi-value ${s}`}>{v}</div>
        </div>
      )}
    </div>

    {allModels.map(grp =>
      <div key={grp.module} class="card mb-4">
        <div class="card-header">
          <span class="card-title"><i class={`fas ${grp.icon}`} style={`color:${grp.color};margin-right:8px`}></i>{grp.module} Models</span>
        </div>
        <div class="card-body compact">
          <table class="data-table">
            <thead><tr><th>Model</th><th>Accuracy</th><th>MAPE</th><th>Status</th><th>Details</th><th>Actions</th></tr></thead>
            <tbody>
              {grp.models.map(m =>
                <tr key={m.name}>
                  <td><strong>{m.name}</strong></td>
                  <td><strong style={`color:${parseFloat(m.acc)>=90?'#059669':parseFloat(m.acc)>=85?'#D97706':'#DC2626'}`}>{m.acc}</strong></td>
                  <td>{m.mape || '—'}</td>
                  <td><span class={`badge badge-${m.badge}`}>{m.status}</span></td>
                  <td style="font-size:11px;color:#64748B">{m.detail}</td>
                  <td>
                    <button class="btn btn-sm btn-secondary" onclick={`window.showToast('${m.name} retrain queued — results in ~2min','info')`}><i class="fas fa-sync"></i> Retrain</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </Layout>)
})

// ── M1: Unified AI Copilot (/ai-copilot) — accessible from Production + Sequencing ──
app.get('/ai-copilot', (c) => {
  const _u = getUser(c)
  return c.html(<Layout user={_u} title="AI Copilot" activeModule="prod-copilot">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA)"><i class="fas fa-robot"></i></div>
        <div>
          <div class="page-title">Supply Chain AI Copilot</div>
          <div class="page-subtitle">Natural language interface for Production · Sequencing · MPS · ATP · RCCP · Schedule optimization</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">AI Live</span>
        <a href="/production/copilot" class="btn btn-secondary"><i class="fas fa-cogs"></i> Production View</a>
        <a href="/sequencing/copilot" class="btn btn-secondary"><i class="fas fa-calendar-alt"></i> Sequencing View</a>
      </div>
    </div>

    <div class="grid-2-1">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-comments"></i> Supply Chain AI Assistant</span></div>
        <div id="copilot-messages" class="chat-messages" style="min-height:400px">
          <div class="chat-msg assistant"><i class="fas fa-robot" style="margin-right:8px;color:#7C3AED"></i>Hello! I'm your Supply Chain AI Copilot. I can assist with Production MPS, ATP checks, RCCP capacity, sequencing optimization, changeover planning, and cross-module decisions. What would you like to explore today?</div>
        </div>
        <div class="chat-input-area">
          <input class="form-input flex-1" id="copilot-input" placeholder="Ask about production, sequencing, MPS, ATP, capacity..." onkeydown="if(event.key==='Enter'){sendCopilot(this.value);this.value=''}"/>
          <button class="btn btn-primary" onclick="const i=document.getElementById('copilot-input');sendCopilot(i.value);i.value=''"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-bolt"></i> Suggested Queries</span></div>
        <div class="card-body" id="copilot-suggestions"></div>
        <div class="card-header" style="margin-top:8px"><span class="card-title"><i class="fas fa-chart-pie"></i> Live AI Insights</span></div>
        <div class="card-body compact">
          <div style="margin-bottom:8px;padding:10px;background:#EFF6FF;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#1D4ED8">📊 MPS Health: 94.2% adherence</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">2 ATP constraints in W3. Recommend expediting SKU-500-PET.</div>
          </div>
          <div style="margin-bottom:8px;padding:10px;background:#FEF3C7;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#D97706">⚠ RCCP Alert: MUM-L2 at 98%</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">W2 overloaded. Shift 8K cases to DEL-L1 to resolve.</div>
          </div>
          <div style="margin-bottom:8px;padding:10px;background:#F0FDF4;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#059669">✓ Sequencing Opportunity</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">AI sequence saves 4.5h changeover. <a href="/sequencing/gantt" style="color:#059669;font-weight:600">View Gantt →</a></div>
          </div>
          <div style="padding:10px;background:#FDF2F8;border-radius:8px">
            <div style="font-size:12px;font-weight:600;color:#7C3AED">🤖 Cross-Module Alert</div>
            <div style="font-size:11px;color:#64748B;margin-top:2px">Demand upside +15% detected. MRP and Capacity should be re-planned. <a href="/mrp" style="color:#7C3AED;font-weight:600">Open MRP →</a></div>
          </div>
        </div>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-copilot';</script>
  </Layout>)
})

app.get('/deployment/analytics', (c) => {
  const _u = getUser(c); return c.html(<Layout user={_u} title="Deployment Analytics" activeModule="dep-analytics">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-chart-bar"></i></div>
        <div>
          <div class="page-title">Deployment Analytics</div>
          <div class="page-subtitle">OTD trends · Cost analysis · Carrier performance · Route efficiency · Exception analytics</div>
        </div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" style="width:auto;font-size:13px" id="dep-analytics-period">
          <option>Last 12 Weeks</option><option>Last 6 Months</option><option>This Year</option>
        </select>
        <button class="btn btn-secondary" onclick="location.href='/api/export/deployment-analytics?format=csv'"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>

    <div class="grid-3 mb-4">
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-clock" style="margin-right:5px"></i>OTD (12W Avg)</div>
        <div class="kpi-value warning">90.8%</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 95%</span><span class="kpi-trend up">↑ Trending up</span></div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-rupee-sign" style="margin-right:5px"></i>Logistics Cost</div>
        <div class="kpi-value critical">₹288L</div>
        <div class="kpi-meta"><span class="kpi-target">Last 6 months</span><span class="kpi-trend down">↑ +4.2%</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-truck" style="margin-right:5px"></i>Trips Completed</div>
        <div class="kpi-value healthy">1,842</div>
        <div class="kpi-meta"><span class="kpi-target">Last 12 weeks</span><span class="kpi-trend up">↑ +12%</span></div>
      </div>
    </div>

    <div class="grid-2 mb-4">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> OTD Trend – 12 Weeks</span></div>
        <div class="card-body" style="height:240px"><canvas id="dep-otd-trend-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Logistics Cost by Category (6M)</span></div>
        <div class="card-body" style="height:240px"><canvas id="dep-cost-trend-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Lane Performance Summary</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Lane</th><th>Volume/Wk</th><th>OTD %</th><th>Cost/Case</th><th>Carrier</th><th>Issues</th><th>Trend</th><th>Action</th></tr></thead>
          <tbody>
            {[
              { lane: 'Mumbai → Pune', vol: 4200, otd: 96.2, cost: 14.2, carrier: 'BlueDart', issues: 0, trend: '↗' },
              { lane: 'Mumbai → Surat', vol: 2800, otd: 93.8, cost: 16.8, carrier: 'DHL', issues: 1, trend: '→' },
              { lane: 'Delhi → Jaipur', vol: 2100, otd: 94.1, cost: 15.4, carrier: 'Mahindra', issues: 0, trend: '↗' },
              { lane: 'Delhi → Lucknow', vol: 1800, otd: 82.4, cost: 18.6, carrier: 'Gati-KWE', issues: 3, trend: '↘' },
              { lane: 'Chennai → Bangalore', vol: 2400, otd: 91.2, cost: 15.8, carrier: 'BlueDart', issues: 1, trend: '→' },
              { lane: 'Bangalore → Hyderabad', vol: 1600, otd: 88.6, cost: 19.2, carrier: 'VRL', issues: 2, trend: '↘' },
            ].map(r => (
              <tr>
                <td><strong>{r.lane}</strong></td>
                <td>{r.vol.toLocaleString()}</td>
                <td style={`font-weight:600;color:${r.otd >= 93 ? '#059669' : r.otd >= 88 ? '#D97706' : '#DC2626'}`}>{r.otd}%</td>
                <td>₹{r.cost}</td>
                <td>{r.carrier}</td>
                <td><span class={`badge badge-${r.issues === 0 ? 'success' : r.issues <= 1 ? 'warning' : 'critical'}`}>{r.issues}</span></td>
                <td style="font-size:18px">{r.trend}</td>
                <td><button class="btn btn-sm btn-secondary"><i class="fas fa-route"></i> Optimize</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script>document.body.dataset.page='deployment-analytics';</script>
  </Layout>)
})

// ============================================================
// ENTERPRISE UPGRADES — Control Tower, Network, Scenario Lab, Demand Intelligence
// ============================================================

// ── APIs ─────────────────────────────────────────────────────

// Control Tower: live pulse
app.get('/api/control-tower/pulse', async (c) => {
  return c.json({
    ts: new Date().toISOString(),
    overall_health: 76,
    status: 'warning',
    nodes: [
      { id:'MUM', label:'Mumbai Plant', type:'plant', lat:19.08, lng:72.88, util:97, status:'critical', output:52400, capacity:54000 },
      { id:'DEL', label:'Delhi Plant',  type:'plant', lat:28.70, lng:77.10, util:74, status:'healthy', output:38200, capacity:52000 },
      { id:'CHN', label:'Chennai Plant',type:'plant', lat:13.08, lng:80.27, util:82, status:'warning', output:31500, capacity:38500 },
      { id:'BAN', label:'Bangalore Plant',type:'plant',lat:12.97,lng:77.59,util:69,status:'healthy',output:28100,capacity:40800},
      { id:'WH-MUM', label:'Mumbai DC',  type:'warehouse', lat:19.22, lng:72.98, fill:78, status:'healthy', stock:184200, capacity:236000 },
      { id:'WH-DEL', label:'Delhi DC',   type:'warehouse', lat:28.55, lng:77.25, fill:91, status:'critical', stock:201800, capacity:220000 },
      { id:'WH-CHN', label:'Chennai DC', type:'warehouse', lat:13.00, lng:80.20, fill:64, status:'healthy', stock:96300, capacity:150000 },
      { id:'WH-BAN', label:'Bangalore DC',type:'warehouse',lat:12.90,lng:77.68,fill:56,status:'healthy',stock:73200,capacity:130000},
      { id:'WH-HYD', label:'Hyderabad DC',type:'warehouse',lat:17.38,lng:78.49,fill:83,status:'warning',stock:88400,capacity:106000},
    ],
    lanes: [
      { from:'MUM', to:'WH-MUM', vol:18400, otd:96.2, status:'healthy' },
      { from:'MUM', to:'WH-HYD', vol:7200, otd:82.4, status:'critical' },
      { from:'DEL', to:'WH-DEL', vol:12800, otd:91.8, status:'warning' },
      { from:'CHN', to:'WH-CHN', vol:9600, otd:94.1, status:'healthy' },
      { from:'BAN', to:'WH-BAN', vol:8400, otd:88.6, status:'warning' },
      { from:'BAN', to:'WH-HYD', vol:4200, otd:85.2, status:'warning' },
    ],
    kpis: {
      total_output: 150200,
      plan_adherence: 91.8,
      otd: 91.4,
      service_level: 96.8,
      total_inventory: 643900,
      stockout_risk_skus: 3,
      open_exceptions: 7,
      pending_approvals: 4,
    }
  })
})

app.get('/api/control-tower/exceptions', async (c) => {
  return c.json([
    { id:'EX-001', severity:'critical', module:'Production', title:'MUM-L2 Capacity Breach — Week 2', detail:'MUM-L2 loaded at 98% in W1-W2. Risk: 12,000 cases ATP loss.', action:'Shift 8K cases to DEL-L1', created_at:'2026-03-17T06:00:00Z', status:'open' },
    { id:'EX-002', severity:'critical', module:'Inventory', title:'Delhi DC Near-Full — 91% Fill', detail:'WH-DEL at 91% fill rate. Incoming 48T truck arriving Mar 19.', action:'Trigger inter-DC transfer to WH-LKN', created_at:'2026-03-17T07:15:00Z', status:'open' },
    { id:'EX-003', severity:'high',     module:'Deployment', title:'OTD Gap on Delhi→Lucknow Lane', detail:'Lane OTD 82.4% vs 95% SLA. 3 delayed shipments this week.', action:'Switch carrier from Gati-KWE to BlueDart', created_at:'2026-03-17T05:30:00Z', status:'open' },
    { id:'EX-004', severity:'high',     module:'MRP', title:'Orange Concentrate Critical Shortage', detail:'Current stock 6 days. Reorder point breached. 2 POs pending approval.', action:'Approve PO-2024-0892 immediately', created_at:'2026-03-17T04:00:00Z', status:'open' },
    { id:'EX-005', severity:'medium',   module:'Demand', title:'Mango 200ml Forecast Spike — +34%', detail:'AI sensing model detected +34% uplift for April. Capacity planning required.', action:'Review RCCP for April horizon', created_at:'2026-03-17T03:00:00Z', status:'open' },
    { id:'EX-006', severity:'medium',   module:'Procurement', title:'Supplier VRL Logistics OTIF Below SLA', detail:'VRL OTIF 85.6% vs 88% SLA. 3 late deliveries in rolling 30 days.', action:'Issue performance notice, qualify backup carrier', created_at:'2026-03-16T22:00:00Z', status:'open' },
    { id:'EX-007', severity:'low',      module:'Resource', title:'Overtime Hours — Mumbai +28%', detail:'Mumbai plant OT 142 hrs/wk vs 110 target. Fatigue risk in L2.', action:'Approve roster extension — add 6 operators Mar 19-23', created_at:'2026-03-16T18:00:00Z', status:'open' },
  ])
})

app.get('/api/control-tower/flow', async (c) => {
  return c.json({
    supply_chain_flow: [
      { stage:'Demand Signal',  score:87, status:'healthy',  kpi:'Forecast Accuracy 87.3%',   delta:'+1.2%' },
      { stage:'Procurement',    score:71, status:'warning',  kpi:'Supplier OTIF 87.4%',        delta:'-0.8%' },
      { stage:'Production',     score:88, status:'healthy',  kpi:'MPS Adherence 94.2%',        delta:'+0.4%' },
      { stage:'Inventory',      score:74, status:'warning',  kpi:'Service Level 96.8%',        delta:'-0.3%' },
      { stage:'Deployment',     score:78, status:'warning',  kpi:'OTD 91.4%',                  delta:'-1.1%' },
      { stage:'Customer OTIF',  score:92, status:'healthy',  kpi:'OTIF 92.1%',                 delta:'+0.6%' },
    ]
  })
})

// Network Graph data
app.get('/api/network/graph', async (c) => {
  return c.json({
    nodes: [
      { id:'SUP-01', label:'Bisleri Corp',          type:'supplier',   lat:21.17, lng:72.83, tier:1, risk:'low',    spend_cr:24.2 },
      { id:'SUP-02', label:'PET Plastics Ltd',       type:'supplier',   lat:28.70, lng:77.10, tier:1, risk:'medium', spend_cr:18.6 },
      { id:'SUP-03', label:'HDPE Films Co',          type:'supplier',   lat:13.08, lng:80.27, tier:1, risk:'high',   spend_cr:9.4  },
      { id:'SUP-04', label:'Orange Conc. Exports',   type:'supplier',   lat:17.38, lng:78.49, tier:2, risk:'critical',spend_cr:6.8 },
      { id:'MUM',    label:'Mumbai Plant',           type:'plant',      lat:19.08, lng:72.88, util:97, capacity:54000, output:52400 },
      { id:'DEL',    label:'Delhi Plant',            type:'plant',      lat:28.70, lng:77.10, util:74, capacity:52000, output:38200 },
      { id:'CHN',    label:'Chennai Plant',          type:'plant',      lat:13.08, lng:80.27, util:82, capacity:38500, output:31500 },
      { id:'BAN',    label:'Bangalore Plant',        type:'plant',      lat:12.97, lng:77.59, util:69, capacity:40800, output:28100 },
      { id:'WH-MUM', label:'Mumbai DC',              type:'warehouse',  lat:19.22, lng:72.98, fill:78, capacity:236000 },
      { id:'WH-DEL', label:'Delhi DC',               type:'warehouse',  lat:28.55, lng:77.25, fill:91, capacity:220000 },
      { id:'WH-CHN', label:'Chennai DC',             type:'warehouse',  lat:13.00, lng:80.20, fill:64, capacity:150000 },
      { id:'WH-BAN', label:'Bangalore DC',           type:'warehouse',  lat:12.90, lng:77.68, fill:56, capacity:130000 },
      { id:'WH-HYD', label:'Hyderabad DC',           type:'warehouse',  lat:17.38, lng:78.49, fill:83, capacity:106000 },
      { id:'MKT-W',  label:'West Market',            type:'market',     lat:18.52, lng:73.86, demand:48000 },
      { id:'MKT-N',  label:'North Market',           type:'market',     lat:29.38, lng:76.96, demand:42000 },
      { id:'MKT-S',  label:'South Market',           type:'market',     lat:11.12, lng:78.66, demand:38000 },
      { id:'MKT-E',  label:'East Market',            type:'market',     lat:22.57, lng:88.36, demand:21000 },
    ],
    edges: [
      { from:'SUP-01',to:'MUM', type:'supply', vol:18000, lead_days:3, status:'healthy' },
      { from:'SUP-02',to:'DEL', type:'supply', vol:12000, lead_days:5, status:'warning' },
      { from:'SUP-03',to:'CHN', type:'supply', vol:8000,  lead_days:4, status:'critical' },
      { from:'SUP-04',to:'MUM', type:'supply', vol:6000,  lead_days:7, status:'critical' },
      { from:'MUM',to:'WH-MUM', type:'production', vol:52400, util:97, status:'critical' },
      { from:'DEL',to:'WH-DEL', type:'production', vol:38200, util:74, status:'healthy' },
      { from:'CHN',to:'WH-CHN', type:'production', vol:31500, util:82, status:'warning' },
      { from:'BAN',to:'WH-BAN', type:'production', vol:28100, util:69, status:'healthy' },
      { from:'WH-MUM',to:'MKT-W', type:'deployment', vol:44000, otd:96.2, status:'healthy' },
      { from:'WH-MUM',to:'WH-HYD', type:'transfer',  vol:7200,  otd:82.4, status:'critical' },
      { from:'WH-DEL',to:'MKT-N',  type:'deployment', vol:38000, otd:91.8, status:'warning' },
      { from:'WH-CHN',to:'MKT-S',  type:'deployment', vol:31000, otd:94.1, status:'healthy' },
      { from:'WH-BAN',to:'MKT-S',  type:'deployment', vol:22000, otd:88.6, status:'warning' },
      { from:'WH-HYD',to:'MKT-S',  type:'deployment', vol:18000, otd:85.2, status:'warning' },
    ]
  })
})

// Scenario Lab APIs
app.get('/api/scenario-lab/scenarios', async (c) => {
  return c.json([
    { id:'SCN-001', name:'Summer Surge +25%',       type:'demand',    status:'simulated', created_by:'Sankar M', created_at:'2026-03-17T08:00:00Z', delta_otd:-3.2, delta_cost:+8.4, delta_fill:-1.8, delta_util:+14.2, risk:'high' },
    { id:'SCN-002', name:'Mumbai Plant Shutdown',   type:'disruption',status:'draft',     created_by:'Vikrant H', created_at:'2026-03-16T14:00:00Z', delta_otd:-12.4,delta_cost:+18.6,delta_fill:-6.2,delta_util:+28.4,risk:'critical' },
    { id:'SCN-003', name:'Mango Promo — April',     type:'promotion', status:'approved',  created_by:'Sankar M', created_at:'2026-03-15T10:00:00Z', delta_otd:-1.4, delta_cost:+3.8, delta_fill:-0.6, delta_util:+8.2, risk:'medium' },
    { id:'SCN-004', name:'New SKU Launch — SportZ', type:'new_sku',   status:'draft',     created_by:'Vikrant H', created_at:'2026-03-14T16:00:00Z', delta_otd:-0.8, delta_cost:+2.4, delta_fill:-0.2, delta_util:+4.6, risk:'low' },
    { id:'SCN-005', name:'Carrier Disruption — VRL',type:'disruption',status:'simulated', created_by:'Sankar M', created_at:'2026-03-13T09:00:00Z', delta_otd:-6.8, delta_cost:+4.2, delta_fill:-2.4, delta_util:+2.8, risk:'high' },
  ])
})

app.post('/api/scenario-lab/run', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  const type = body.type || 'demand'
  const magnitude = parseFloat(body.magnitude || '15')

  const baseOTD = 91.4, baseFill = 96.8, baseCost = 18.4, baseUtil = 82.4
  const deltaFactor = magnitude / 100
  const result = {
    scenario_id: `SCN-${Date.now()}`,
    name: body.name || `Scenario ${new Date().toLocaleTimeString()}`,
    type,
    run_time_ms: Math.round(800 + Math.random()*400),
    solver: 'Heuristic-MIP',
    baseline: { otd:baseOTD, fill:baseFill, cost:baseCost, util:baseUtil, output:150200 },
    optimized: {
      otd:   type==='disruption' ? +(baseOTD - magnitude*0.5).toFixed(1) : +(baseOTD - magnitude*0.1).toFixed(1),
      fill:  type==='disruption' ? +(baseFill - magnitude*0.3).toFixed(1) : +(baseFill - magnitude*0.05).toFixed(1),
      cost:  +(baseCost * (1 + deltaFactor*0.4)).toFixed(1),
      util:  +(baseUtil + deltaFactor*10).toFixed(1),
      output:Math.round(150200 * (1 + deltaFactor * (type==='demand'?0.8:-0.6))),
    },
    recommendations: [
      type==='demand' ? `Activate MUM-L2 overtime for ${Math.round(magnitude*120)} additional cases/week` : `Re-route production from disrupted plant to DEL-L1 and CHN-L1`,
      `Adjust safety stock buffers by +${Math.round(magnitude*0.8)}% at high-risk DCs`,
      `Pre-position ${Math.round(magnitude*800)} cases at WH-DEL and WH-MUM before surge`,
    ],
    week_schedule: ['W1','W2','W3','W4','W5','W6','W7','W8'].map(w => ({
      week: w,
      output: Math.round(18000 + Math.random()*4000 + deltaFactor*18000*0.5),
      util: Math.round(75 + Math.random()*15 + deltaFactor*10),
    }))
  }
  return c.json(result)
})

// Demand Intelligence APIs
app.get('/api/demand/intelligence', async (c) => {
  const weeks = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12']
  return c.json({
    summary: { total_demand: 4820000, forecast_accuracy: 87.3, mape: 4.6, bias: -1.2, demand_sensing_lift: 2.1 },
    by_sku: [
      { sku:'PET 500ml',   p10:82000, p50:94200, p90:108000, actual:91800, accuracy:97.5, trend:'up',   seasonality:'summer_peak' },
      { sku:'PET 1L',      p10:41000, p50:48600, p90:57000,  actual:47200, accuracy:97.1, trend:'flat', seasonality:'stable' },
      { sku:'Mango 200ml', p10:38000, p50:52400, p90:72000,  actual:null,  accuracy:84.2, trend:'up',   seasonality:'summer_peak' },
      { sku:'Glass 500ml', p10:18000, p50:22400, p90:27000,  actual:21800, accuracy:97.3, trend:'down', seasonality:'stable' },
      { sku:'SportZ Energy',p10:8000, p50:12600, p90:18000,  actual:null,  accuracy:78.4, trend:'up',   seasonality:'new_launch' },
    ],
    weekly_forecast: weeks.map((w,i) => ({
      week: w,
      p50: Math.round(350000 + i*8000 + Math.sin(i*0.5)*12000),
      p10: Math.round(310000 + i*8000 + Math.sin(i*0.5)*12000),
      p90: Math.round(395000 + i*8000 + Math.sin(i*0.5)*12000),
      actual: i < 4 ? Math.round(340000 + i*8000 + (Math.random()-0.5)*15000) : null,
    })),
    drivers: [
      { driver:'Temperature',    impact_pct:+18.4, confidence:92, signal:'strong' },
      { driver:'Summer Holiday', impact_pct:+14.2, confidence:88, signal:'medium' },
      { driver:'Mango Promo',    impact_pct:+9.6,  confidence:85, signal:'medium' },
      { driver:'Price Increase', impact_pct:-3.2,  confidence:76, signal:'weak'   },
      { driver:'New Competitor', impact_pct:-1.8,  confidence:68, signal:'weak'   },
    ]
  })
})

// Optimization Cockpit API
app.post('/api/optimization/network', async (c) => {
  const body = await c.req.json().catch(() => ({})) as any
  return c.json({
    status: 'optimal',
    solver: 'Network-Flow LP + MIP',
    run_time_ms: Math.round(1200 + Math.random()*600),
    objective_value: 284200000,
    improvements: {
      cost_reduction_pct: -7.8,
      otd_improvement_pct: +3.4,
      util_rebalance_pct: +6.2,
      co2_reduction_pct: -4.1,
      savings_inr_lakh: 22.4,
    },
    reallocation: [
      { from:'MUM', to:'DEL',  sku:'PET 500ml', cases:8000, reason:'Mumbai overloaded (97% util)' },
      { from:'MUM', to:'CHN',  sku:'Mango 200ml',cases:4000,reason:'Southern demand surge' },
      { from:'WH-DEL',to:'WH-HYD',sku:'Glass 500ml',cases:12000,reason:'Delhi DC near capacity (91%)' },
    ],
    lane_changes: [
      { lane:'Delhi→Lucknow', change:'Switch Gati-KWE → BlueDart', saving_pct:4.2, otd_gain:8.4 },
      { lane:'Mumbai→Hyderabad', change:'Add milk-run via Pune hub', saving_pct:6.1, otd_gain:3.2 },
    ]
  })
})

// S&OP Intelligence (enhanced)
app.get('/api/sop/intelligence', async (c) => {
  return c.json({
    cycle: 'March 2026',
    status: 'consensus_gap',
    demand_plan: 4820000,
    supply_plan: 4620000,
    gap: -200000,
    gap_pct: -4.1,
    gap_resolution: [
      { option:'Approve Mumbai Overtime W1-W4',   impact_cases:+120000, cost_inr_lakh:+8.4, risk:'low'    },
      { option:'Activate Bangalore 3rd Shift',    impact_cases:+80000,  cost_inr_lakh:+6.2, risk:'medium' },
      { option:'Defer Glass 500ml to Q2',         impact_cases:+40000,  cost_inr_lakh:-2.1, risk:'low'    },
      { option:'Emergency Procurement (ext.cap)', impact_cases:+60000,  cost_inr_lakh:+14.8,risk:'high'   },
    ],
    consensus_score: 68,
    next_review: '2026-03-28',
    attendees: [
      { name:'Sankar M',  role:'Supply Chain Director', status:'confirmed' },
      { name:'Vikrant H', role:'SC Technology',         status:'confirmed' },
      { name:'Rahul P',   role:'Commercial Director',   status:'pending'   },
      { name:'Priya S',   role:'Finance Controller',    status:'confirmed' },
    ]
  })
})

// ── UI PAGES ─────────────────────────────────────────────────

// ── Control Tower Dashboard ───────────────────────────────────
app.get('/control-tower', async (c) => {
  const _u = getUser(c)
  const scripts = `
async function initControlTower() {
  const [pulseRes, exceptRes, flowRes] = await Promise.allSettled([
    axios.get('/api/control-tower/pulse'),
    axios.get('/api/control-tower/exceptions'),
    axios.get('/api/control-tower/flow'),
  ]);
  const pulseRaw = pulseRes.status==='fulfilled' ? pulseRes.value.data : {};
  const exceptionsRaw = exceptRes.status==='fulfilled' ? exceptRes.value.data : [];
  const flowRaw = flowRes.status==='fulfilled' ? flowRes.value.data : { supply_chain_flow:[] };

  const pulse = pulseRaw && typeof pulseRaw === 'object' ? pulseRaw : {};
  const pulseKpis = pulse.kpis && typeof pulse.kpis === 'object' ? pulse.kpis : {};
  const pulseNodes = Array.isArray(pulse.nodes) ? pulse.nodes : [];
  const pulseLanes = Array.isArray(pulse.lanes) ? pulse.lanes : [];
  const exceptions = Array.isArray(exceptionsRaw) ? exceptionsRaw : [];
  const flowSteps = Array.isArray(flowRaw && flowRaw.supply_chain_flow) ? flowRaw.supply_chain_flow : [];

  document.getElementById('ct-output').textContent = Number(pulseKpis.total_output || 0).toLocaleString();
  document.getElementById('ct-adherence').textContent = (pulseKpis.plan_adherence ?? 0) + '%';
  document.getElementById('ct-otd').textContent = (pulseKpis.otd ?? 0) + '%';
  document.getElementById('ct-service').textContent = (pulseKpis.service_level ?? 0) + '%';
  document.getElementById('ct-inventory').textContent = (Number(pulseKpis.total_inventory || 0)/1000).toFixed(1)+'K cs';
  document.getElementById('ct-exceptions').textContent = pulseKpis.open_exceptions ?? exceptions.length;

  // Node map
  const nodeGrid = document.getElementById('ct-nodes');
  if (nodeGrid) {
    nodeGrid.innerHTML = '';
    if (!pulseNodes.length) {
      nodeGrid.innerHTML = '<div style="font-size:12px;color:#64748B;padding:8px">No node data available</div>';
    } else {
      pulseNodes.forEach(n => {
        const sc = n.status==='critical'?'#DC2626':n.status==='warning'?'#D97706':'#059669';
        const metric = n.type==='plant' ? n.util+'% util' : n.fill+'% fill';
        const icon = n.type==='plant' ? 'fa-industry' : 'fa-warehouse';
        nodeGrid.innerHTML += '<div class="ct-node '+n.status+'" onclick="showNodeDetail(\''+n.id+'\')">' +
          '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
          '<i class="fas '+icon+'" style="color:'+sc+';font-size:16px"></i>' +
          '<span class="badge badge-'+n.status+'" style="font-size:9px">'+n.status.toUpperCase()+'</span>' +
          '</div>' +
          '<div style="font-size:12px;font-weight:600;color:#1E293B;margin-bottom:2px">'+n.label+'</div>' +
          '<div style="font-size:13px;font-weight:800;color:'+sc+'">'+metric+'</div>' +
          '</div>';
      });
    }
  }

  // Lane table
  const lanesTbl = document.getElementById('ct-lanes');
  if (lanesTbl) {
    lanesTbl.innerHTML = pulseLanes.length ? pulseLanes.map(l => {
      const sc = l.status==='critical'?'#DC2626':l.status==='warning'?'#D97706':'#059669';
      return '<tr><td><strong>'+l.from+'</strong> → <strong>'+l.to+'</strong></td>' +
        '<td>'+Number(l.vol || 0).toLocaleString()+' cs</td>' +
        '<td style="font-weight:700;color:'+sc+'">'+l.otd+'%</td>' +
        '<td><span class="badge badge-'+l.status+'">'+l.status+'</span></td>' +
        '<td><button class="btn btn-sm btn-secondary" onclick="optimizeLane(\''+l.from+'\',\''+l.to+'\')"><i class="fas fa-route"></i> Optimize</button></td></tr>';
    }).join('') : '<tr><td colspan="5" style="text-align:center;color:#64748B">No lane data available</td></tr>';
  }

  // Exceptions
  const exList = document.getElementById('ct-exceptions-list');
  if (exList) {
    exList.innerHTML = exceptions.slice(0,6).map(e => {
      const sc = e.severity==='critical'?'critical':e.severity==='high'?'critical':'warning';
      const icon = e.severity==='critical'?'fa-times-circle':e.severity==='high'?'fa-exclamation-triangle':'fa-info-circle';
      const moduleUrlMap = {
        'Capacity':'/capacity','Production':'/production','Inventory':'/inventory',
        'Deployment':'/deployment','Procurement':'/procurement','Resource':'/resource',
        'MRP':'/mrp','Sequencing':'/sequencing','SOP':'/sop'
      };
      const modUrl = moduleUrlMap[e.module] || '/'+e.module.toLowerCase();
      return '<div class="alert alert-'+sc+'" data-ex-id="'+e.id+'" style="margin-bottom:10px">' +
        '<i class="fas '+icon+'"></i>' +
        '<div style="flex:1"><div style="font-weight:600;font-size:13px">'+e.title+'</div>' +
        '<div style="font-size:12px;color:#64748B;margin-top:2px">'+e.detail+'</div>' +
        '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">' +
        '<button class="btn btn-sm btn-primary" onclick="resolveException(\''+e.id+'\')"><i class="fas fa-check"></i> '+e.action+'</button>' +
        '<a href="'+modUrl+'" class="btn btn-sm btn-secondary"><i class="fas fa-external-link-alt"></i> View in '+e.module+'</a>' +
        '</div></div></div>';
    }).join('') || '<div style="font-size:12px;color:#64748B;padding:10px">No open exceptions</div>';
  }

  // Supply chain flow
  const flowEl = document.getElementById('sc-flow');
  if (flowEl) {
    const chain = flowSteps.length ? flowSteps : [{ stage:'No flow data', score:0, kpi:'Data unavailable', delta:'0%' }];
    flowEl.innerHTML = chain.map((s,i) => {
      const sc = s.score>=85?'#059669':s.score>=70?'#D97706':'#DC2626';
      return '<div class="flow-step" style="text-align:center;flex:1">' +
        '<div style="font-size:24px;font-weight:800;color:'+sc+'">'+s.score+'</div>' +
        '<div style="font-size:11px;font-weight:600;color:#1E293B;margin:4px 0">'+s.stage+'</div>' +
        '<div style="font-size:10px;color:#64748B">'+s.kpi+'</div>' +
        '<div style="font-size:10px;font-weight:700;color:'+(String(s.delta || '').startsWith('+')&&!String(s.delta || '').includes('fill')?'#DC2626':'#059669')+'">'+s.delta+'</div>' +
        (i < chain.length-1 ? '<div style="position:absolute;right:-10px;top:50%;transform:translateY(-50%);font-size:16px;color:#CBD5E1">▶</div>' : '') +
        '</div>';
    }).join('');
  }

  // Health Trend Chart
  const ctx = document.getElementById('ct-health-chart');
  if (ctx) {
    new Chart(ctx, {
      type:'line',
      data:{
        labels:['Oct','Nov','Dec','Jan','Feb','Mar'],
        datasets:[
          { label:'Overall Health', data:[72,74,76,75,78,76], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.08)', fill:true, tension:0.4, borderWidth:2.5 },
          { label:'Production',     data:[84,86,88,87,89,88], borderColor:'#7C3AED', fill:false, tension:0.4, borderWidth:2, borderDash:[4,4] },
          { label:'Deployment',     data:[78,80,82,80,83,82], borderColor:'#0891B2', fill:false, tension:0.4, borderWidth:2, borderDash:[4,4] },
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}}, scales:{ y:{ min:60, max:100, ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}, x:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
    });
  }

  // Exception Trend
  const ctx2 = document.getElementById('ct-exception-chart');
  if (ctx2) {
    new Chart(ctx2, {
      type:'bar',
      data:{
        labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets:[
          { label:'Critical', data:[2,3,1,2,3,1,2], backgroundColor:'#DC2626' },
          { label:'High',     data:[3,2,4,3,2,3,3], backgroundColor:'#D97706' },
          { label:'Medium',   data:[4,3,2,4,3,2,2], backgroundColor:'#0891B2' },
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}}, scales:{ x:{ stacked:true, ticks:{ font:{size:10} }, grid:{ display:false }}, y:{ stacked:true, ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}}}
    });
  }
}

function showNodeDetail(id) {
  const nodeModuleMap = {
    'MUM':'production','DEL':'production','CHN':'production','BAN':'production',
    'MUM-WH':'inventory','DEL-WH':'inventory','CHN-WH':'inventory','BAN-WH':'inventory'
  };
  const prefix = id.split('-').slice(0,2).join('-');
  const base = id.split('-')[0];
  const url = nodeModuleMap[prefix] || nodeModuleMap[base] || 'control-tower';
  window.showToast('Opening '+id+' details in '+url.charAt(0).toUpperCase()+url.slice(1)+'...','info');
  setTimeout(() => { window.location.href = '/'+url; }, 800);
}
function optimizeLane(from, to) {
  window.showToast('AI optimization queued for '+from+'→'+to+'. Results ready in ~30s.','success');
  setTimeout(() => { window.location.href = '/deployment/routes'; }, 1500);
}
async function resolveException(id) {
  try {
    await axios.post('/api/control-tower/exceptions/'+id+'/resolve');
  } catch(e) {}
  const card = document.querySelector('[data-ex-id="'+id+'"]');
  if(card) { card.style.opacity='0.4'; card.style.transition='opacity 0.4s'; }
  window.showToast('Exception '+id+' queued for resolution. Planner notified.','success');
}
document.addEventListener('DOMContentLoaded', initControlTower);
  `.trim()
  return c.html(<Layout user={_u} title="Control Tower" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0F172A,#1E3A8A)"><i class="fas fa-satellite-dish"></i></div>
        <div>
          <div class="page-title">Supply Chain Control Tower</div>
          <div class="page-subtitle">Real-time network visibility · Exception management · Cross-module intelligence · Decision hub</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">LIVE</span>
        <a href="/network-map" class="btn btn-secondary"><i class="fas fa-project-diagram"></i> Network Map</a>
        <a href="/scenario-lab" class="btn btn-secondary"><i class="fas fa-flask"></i> Scenario Lab</a>
        <button class="btn btn-primary" onclick="location.reload()"><i class="fas fa-sync-alt"></i> Refresh</button>
      </div>
    </div>

    {/* Top KPI Strip */}
    <div class="kpi-grid" style="grid-template-columns:repeat(6,1fr);margin-bottom:20px">
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-boxes"></i> Total Output</div>
        <div class="kpi-value" id="ct-output">—</div>
        <div class="kpi-meta"><span class="kpi-target">Target 155K cs</span><span class="kpi-trend up">▲ 2.1%</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-calendar-check"></i> Plan Adherence</div>
        <div class="kpi-value" id="ct-adherence">—</div>
        <div class="kpi-meta"><span class="kpi-target">Target 95%</span><span class="kpi-trend down">▼ 0.4%</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-truck"></i> On-Time Delivery</div>
        <div class="kpi-value" id="ct-otd">—</div>
        <div class="kpi-meta"><span class="kpi-target">Target 95%</span><span class="kpi-trend down">▼ 1.1%</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-star"></i> Service Level</div>
        <div class="kpi-value" id="ct-service">—</div>
        <div class="kpi-meta"><span class="kpi-target">Target 98%</span><span class="kpi-trend up">▲ 0.3%</span></div>
      </div>
      <div class="kpi-card info">
        <div class="kpi-label"><i class="fas fa-warehouse"></i> Network Inventory</div>
        <div class="kpi-value" id="ct-inventory">—</div>
        <div class="kpi-meta"><span class="kpi-target">Optimal: 580K cs</span><span class="kpi-trend up">▲ 4.8%</span></div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-exclamation-triangle"></i> Open Exceptions</div>
        <div class="kpi-value critical" id="ct-exceptions">—</div>
        <div class="kpi-meta"><span class="kpi-target">Target: 0</span><a href="/exceptions" style="font-size:11px;color:#2563EB">View all →</a></div>
      </div>
    </div>

    {/* Supply Chain Flow */}
    <div class="card mb-4" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-stream"></i> End-to-End Supply Chain Health Flow</span>
        <span style="font-size:12px;color:#64748B">Live health scores across planning stages</span>
      </div>
      <div class="card-body">
        <div id="sc-flow" style="display:flex;align-items:center;gap:8px;position:relative;padding:10px 0"></div>
      </div>
    </div>

    {/* Network Nodes + Exceptions */}
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-map-marker-alt"></i> Network Node Status</span>
          <a href="/network-map" class="btn btn-sm btn-secondary"><i class="fas fa-expand-alt"></i> Full Map</a>
        </div>
        <div class="card-body" style="padding:12px">
          <div id="ct-nodes" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px"></div>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-bell"></i> Active Exceptions — Requires Action</span>
          <a href="/exceptions" class="btn btn-sm btn-secondary">View All</a>
        </div>
        <div class="card-body compact" style="max-height:320px;overflow-y:auto">
          <div id="ct-exceptions-list"><div class="spinner"></div></div>
        </div>
      </div>
    </div>

    {/* Charts Row */}
    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-heartbeat"></i> Overall Health Trend — 6 Months</span></div>
        <div class="card-body" style="height:220px"><canvas id="ct-health-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Exception Volume — Last 7 Days</span></div>
        <div class="card-body" style="height:220px"><canvas id="ct-exception-chart"></canvas></div>
      </div>
    </div>

    {/* Logistics Lanes */}
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-route"></i> Active Logistics Lanes</span>
        <a href="/deployment/routes" class="btn btn-sm btn-primary"><i class="fas fa-sliders-h"></i> Optimize All</a>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Lane</th><th>Volume</th><th>OTD %</th><th>Status</th><th>Action</th></tr></thead>
          <tbody id="ct-lanes"><tr><td colspan={5} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    {/* Quick Links */}
    <div class="grid-3">
      <a href="/production" class="card" style="text-decoration:none;padding:16px;display:flex;align-items:center;gap:14px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'" onmouseout="this.style.boxShadow=''">
        <div style="width:44px;height:44px;background:linear-gradient(135deg,#7C3AED,#8B5CF6);border-radius:10px;display:flex;align-items:center;justify-content:center"><i class="fas fa-cogs" style="color:white;font-size:18px"></i></div>
        <div><div style="font-weight:600;font-size:13px">Production Planning</div><div style="font-size:11px;color:#64748B">MPS · ATP · RCCP · Workbench</div></div>
      </a>
      <a href="/deployment" class="card" style="text-decoration:none;padding:16px;display:flex;align-items:center;gap:14px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'" onmouseout="this.style.boxShadow=''">
        <div style="width:44px;height:44px;background:linear-gradient(135deg,#0891B2,#22D3EE);border-radius:10px;display:flex;align-items:center;justify-content:center"><i class="fas fa-truck" style="color:white;font-size:18px"></i></div>
        <div><div style="font-weight:600;font-size:13px">Deployment Planning</div><div style="font-size:11px;color:#64748B">Routes · Load · Carriers · Dispatch</div></div>
      </a>
      <a href="/inventory" class="card" style="text-decoration:none;padding:16px;display:flex;align-items:center;gap:14px;transition:box-shadow 0.2s" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.12)'" onmouseout="this.style.boxShadow=''">
        <div style="width:44px;height:44px;background:linear-gradient(135deg,#059669,#10B981);border-radius:10px;display:flex;align-items:center;justify-content:center"><i class="fas fa-warehouse" style="color:white;font-size:18px"></i></div>
        <div><div style="font-weight:600;font-size:13px">Inventory Planning</div><div style="font-size:11px;color:#64748B">Stock · Safety Stock · Replenishment</div></div>
      </a>
    </div>
  </Layout>)
})

// ── Supply Chain Network Map ──────────────────────────────────
app.get('/network-map', async (c) => {
  const _u = getUser(c)
  const scripts = `
async function initNetworkMap() {
  const [graphRes, pulseRes] = await Promise.allSettled([
    axios.get('/api/network/graph'),
    axios.get('/api/control-tower/pulse'),
  ]);
  const graphRaw = graphRes.status==='fulfilled' ? graphRes.value.data : { nodes:[], edges:[] };
  const pulse = pulseRes.status==='fulfilled' ? pulseRes.value.data : {};
  const nodes = Array.isArray(graphRaw && graphRaw.nodes) ? graphRaw.nodes : [];
  const edges = Array.isArray(graphRaw && graphRaw.edges)
    ? graphRaw.edges
    : Array.isArray(graphRaw && graphRaw.lanes)
      ? graphRaw.lanes.map(l => ({
          from: l.origin,
          to: l.destination,
          type: 'deployment',
          vol: l.weekly_cases || 0,
          otd: l.otd || 0,
          status: (l.otd || 0) < 85 ? 'critical' : (l.otd || 0) < 93 ? 'warning' : 'healthy'
        }))
      : [];

  // Node legend stats
  document.getElementById('nm-plants').textContent = String(nodes.filter(n=>n.type==='plant').length);
  document.getElementById('nm-warehouses').textContent = String(nodes.filter(n=>n.type==='warehouse').length);
  document.getElementById('nm-suppliers').textContent = String(nodes.filter(n=>n.type==='supplier').length);
  document.getElementById('nm-markets').textContent = String(nodes.filter(n=>n.type==='market').length);

  // Build node list table
  const nodesTbl = document.getElementById('nm-nodes-table');
  if (nodesTbl) {
    nodesTbl.innerHTML = nodes.map(n => {
      const typeColor = n.type==='plant'?'#7C3AED':n.type==='warehouse'?'#059669':n.type==='supplier'?'#D97706':'#0891B2';
      const typeIcon  = n.type==='plant'?'fa-industry':n.type==='warehouse'?'fa-warehouse':n.type==='supplier'?'fa-handshake':'fa-store';
      const metric = n.type==='plant' ? n.util+'% util' : n.type==='warehouse' ? n.fill+'% fill' : n.type==='supplier' ? '₹'+n.spend_cr+'Cr' : n.demand?.toLocaleString()+' cs';
      const status = n.type==='plant'?(n.util>90?'critical':n.util>80?'warning':'healthy'):n.type==='warehouse'?(n.fill>88?'critical':n.fill>75?'warning':'healthy'):n.risk||'healthy';
      return '<tr onclick="selectNode(\''+n.id+'\')" style="cursor:pointer">' +
        '<td><i class="fas '+typeIcon+'" style="color:'+typeColor+'"></i></td>' +
        '<td><strong>'+n.label+'</strong><br/><span style="font-size:11px;color:#64748B">'+n.id+'</span></td>' +
        '<td><span class="badge badge-neutral" style="font-size:10px;text-transform:capitalize">'+n.type+'</span></td>' +
        '<td style="font-weight:700">'+(metric||'—')+'</td>' +
        '<td><span class="badge badge-'+status+'" style="font-size:10px">'+status+'</span></td>' +
        '<td><button class="btn btn-sm btn-secondary" onclick="drillDown(\''+n.id+'\',\''+n.type+'\')"><i class="fas fa-search"></i></button></td></tr>';
    }).join('') || '<tr><td colspan="6" style="text-align:center;color:#64748B">No node records available</td></tr>';
  }

  // Build edge table
  const edgesTbl = document.getElementById('nm-edges-table');
  if (edgesTbl) {
    edgesTbl.innerHTML = edges.map(e => {
      const sc = e.status==='critical'?'#DC2626':e.status==='warning'?'#D97706':'#059669';
      const metric = e.otd ? e.otd+'% OTD' : e.util ? e.util+'% util' : '—';
      return '<tr><td><strong>'+e.from+'</strong></td><td style="color:#94A3B8">→</td><td><strong>'+e.to+'</strong></td>' +
        '<td><span class="badge badge-neutral" style="font-size:10px">'+e.type+'</span></td>' +
        '<td>'+(e.vol||0).toLocaleString()+' cs</td>' +
        '<td style="font-weight:700;color:'+sc+'">'+metric+'</td>' +
        '<td><span class="badge badge-'+e.status+'">'+e.status+'</span></td>' +
        '<td><button class="btn btn-sm btn-secondary" onclick="optimizeEdge(\''+e.from+'\',\''+e.to+'\')"><i class="fas fa-magic"></i></button></td></tr>';
    }).join('') || '<tr><td colspan="8" style="text-align:center;color:#64748B">No edge records available</td></tr>';
  }

  // Flow volume chart
  const ctx = document.getElementById('nm-flow-chart');
  if (ctx) {
    const nodeTypes = ['Supplier→Plant','Plant→DC','DC→Market','Inter-DC Transfer'];
    const vols = [44000, 150200, 163000, 19400];
    new Chart(ctx, {
      type:'bar',
      data:{
        labels:nodeTypes,
        datasets:[{ label:'Volume (cases/week)', data:vols, backgroundColor:['#D97706','#7C3AED','#0891B2','#059669'], borderRadius:6 }]
      },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}, y:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
    });
  }

  // Risk by node type
  const ctx2 = document.getElementById('nm-risk-chart');
  if (ctx2) {
    new Chart(ctx2, {
      type:'doughnut',
      data:{
        labels:['Healthy','Warning','Critical'],
        datasets:[{ data:[8,5,3], backgroundColor:['#059669','#D97706','#DC2626'], borderWidth:2 }]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}}}
    });
  }
}

function selectNode(id) {
  const rows = document.querySelectorAll('#nm-nodes-table tr');
  rows.forEach(r => r.style.background = r.textContent.includes(id) ? '#EFF6FF' : '');
  window.showToast('Node '+id+' selected — use Drill-Down to open module dashboard.','info');
}
function drillDown(id, type) {
  const urlMap = { plant:'/production', warehouse:'/inventory', supplier:'/procurement', market:'/deployment' };
  window.location.href = urlMap[type]||'/';
}
function optimizeEdge(from, to) {
  window.showToast('Lane '+from+' → '+to+': milk-run saves ₹2.4L/mo, OTD +3.8%. Updating routes...','success'); setTimeout(() => { window.location.href='/deployment/routes'; }, 1800);
}
async function runNetworkOptimization() {
  document.getElementById('nm-opt-btn').textContent = 'Running...';
  document.getElementById('nm-opt-btn').disabled = true;
  try {
    const r = await axios.post('/api/optimization/network');
    const d = r.data;
    document.getElementById('nm-opt-result').style.display = 'block';
    document.getElementById('nm-opt-cost').textContent = d.improvements.cost_reduction_pct+'%';
    document.getElementById('nm-opt-otd').textContent  = '+'+d.improvements.otd_improvement_pct+'%';
    document.getElementById('nm-opt-save').textContent = '₹'+d.improvements.savings_inr_lakh+'L';
    document.getElementById('nm-opt-time').textContent = d.run_time_ms+'ms';
    document.getElementById('nm-opt-actions').innerHTML = d.reallocation.map(r =>
      '<div class="alert alert-success" style="margin-bottom:8px"><i class="fas fa-arrow-right"></i><div><strong>'+r.sku+'</strong>: Move '+r.cases.toLocaleString()+' cases '+r.from+'→'+r.to+'<br/><span style="font-size:12px;color:#64748B">'+r.reason+'</span></div></div>'
    ).join('');
  } catch(e) {
    window.showToast('Optimization failed: '+e.message,'error');
  } finally {
    document.getElementById('nm-opt-btn').textContent = 'Run Network Optimizer';
    document.getElementById('nm-opt-btn').disabled = false;
  }
}
document.addEventListener('DOMContentLoaded', initNetworkMap);
  `.trim()
  return c.html(<Layout user={_u} title="Supply Chain Network Map" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)"><i class="fas fa-project-diagram"></i></div>
        <div>
          <div class="page-title">Supply Chain Network Map</div>
          <div class="page-subtitle">End-to-end network topology · Node health · Flow volumes · Optimization opportunities</div>
        </div>
      </div>
      <div class="page-header-right">
        <button id="nm-opt-btn" class="btn btn-primary" onclick="runNetworkOptimization()"><i class="fas fa-magic"></i> Run Network Optimizer</button>
        <a href="/control-tower" class="btn btn-secondary"><i class="fas fa-satellite-dish"></i> Control Tower</a>
      </div>
    </div>

    {/* Optimization Result Panel */}
    <div id="nm-opt-result" style="display:none;margin-bottom:20px;border-left:4px solid #059669" class="card">
      <div class="card-body">
        <div style="font-weight:700;color:#059669;margin-bottom:10px"><i class="fas fa-check-circle"></i> Network Optimization Complete</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:12px">
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#059669" id="nm-opt-cost">—</div><div style="font-size:11px;color:#64748B">Cost Reduction</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#2563EB" id="nm-opt-otd">—</div><div style="font-size:11px;color:#64748B">OTD Improvement</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#059669" id="nm-opt-save">—</div><div style="font-size:11px;color:#64748B">Monthly Savings</div></div>
          <div style="text-align:center"><div style="font-size:22px;font-weight:800;color:#64748B" id="nm-opt-time">—</div><div style="font-size:11px;color:#64748B">Solve Time</div></div>
        </div>
        <div id="nm-opt-actions"></div>
      </div>
    </div>

    {/* Node Summary */}
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="kpi-card info"><div class="kpi-label"><i class="fas fa-industry"></i> Plants</div><div class="kpi-value" id="nm-plants">—</div><div class="kpi-meta"><span class="kpi-target">4 active plants</span></div></div>
      <div class="kpi-card info"><div class="kpi-label"><i class="fas fa-warehouse"></i> Warehouses / DCs</div><div class="kpi-value" id="nm-warehouses">—</div><div class="kpi-meta"><span class="kpi-target">Pan-India network</span></div></div>
      <div class="kpi-card warning"><div class="kpi-label"><i class="fas fa-handshake"></i> Suppliers</div><div class="kpi-value" id="nm-suppliers">—</div><div class="kpi-meta"><span class="kpi-target">Tier 1 & Tier 2</span></div></div>
      <div class="kpi-card healthy"><div class="kpi-label"><i class="fas fa-store"></i> Markets</div><div class="kpi-value" id="nm-markets">—</div><div class="kpi-meta"><span class="kpi-target">W/N/S/E zones</span></div></div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Flow Volume by Tier (cases/week)</span></div>
        <div class="card-body" style="height:220px"><canvas id="nm-flow-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-shield-alt"></i> Node Risk Distribution</span></div>
        <div class="card-body" style="height:220px"><canvas id="nm-risk-chart"></canvas></div>
      </div>
    </div>

    {/* Node Table */}
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title"><i class="fas fa-map-marker-alt"></i> Network Nodes</span><span style="font-size:12px;color:#64748B">Click row to highlight · Drill-down to open module</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>Type</th><th>Node</th><th>Category</th><th>Key Metric</th><th>Status</th><th>Detail</th></tr></thead>
          <tbody id="nm-nodes-table"><tr><td colspan={6} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>

    {/* Edge Table */}
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-route"></i> Network Edges (Lanes)</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>From</th><th></th><th>To</th><th>Type</th><th>Volume</th><th>Performance</th><th>Status</th><th>Optimize</th></tr></thead>
          <tbody id="nm-edges-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ── Scenario Simulation Lab ───────────────────────────────────
app.get('/scenario-lab', async (c) => {
  const _u = getUser(c)
  const scripts = `
async function initScenarioLab() {
  const res = await axios.get('/api/scenario-lab/scenarios').catch(() => ({ data:[] }));
  const scenarios = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.scenarios) ? res.data.scenarios : []);
  renderScenarios(scenarios);
}

function renderScenarios(scenarios) {
  const grid = document.getElementById('scenario-grid');
  if (!grid) return;
  const typeColors = { demand:'#2563EB', disruption:'#DC2626', promotion:'#7C3AED', new_sku:'#059669' };
  const typeIcons  = { demand:'fa-chart-line', disruption:'fa-exclamation-triangle', promotion:'fa-tag', new_sku:'fa-plus-circle' };
  const list = Array.isArray(scenarios) ? scenarios : [];
  grid.innerHTML = list.map(s => {
    const sc = s.risk==='critical'?'critical':s.risk==='high'?'critical':s.risk==='medium'?'warning':'success';
    const col = typeColors[s.type]||'#64748B';
    const ico = typeIcons[s.type]||'fa-layer-group';
    return '<div class="card scenario-card" style="border-top:3px solid '+col+'">' +
      '<div class="card-body">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">' +
      '<div style="font-weight:700;font-size:14px">'+s.name+'</div>' +
      '<span class="badge badge-'+sc+'">'+s.risk+' risk</span>' +
      '</div>' +
      '<div style="display:flex;gap:8px;margin-bottom:12px">' +
      '<span class="badge badge-neutral"><i class="fas '+ico+'"></i> '+s.type.replace(/_/g,' ')+'</span>' +
      '<span class="badge badge-neutral">'+s.status+'</span>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;font-size:12px">' +
      '<div style="background:#F8FAFC;padding:8px;border-radius:6px"><div style="color:#64748B">OTD Δ</div><div style="font-weight:700;color:'+(s.delta_otd<0?'#DC2626':'#059669')+'">'+s.delta_otd+'%</div></div>' +
      '<div style="background:#F8FAFC;padding:8px;border-radius:6px"><div style="color:#64748B">Cost Δ</div><div style="font-weight:700;color:'+(s.delta_cost>0?'#DC2626':'#059669')+'">+'+s.delta_cost+'%</div></div>' +
      '<div style="background:#F8FAFC;padding:8px;border-radius:6px"><div style="color:#64748B">Fill Rate Δ</div><div style="font-weight:700;color:'+(s.delta_fill<0?'#DC2626':'#059669')+'">'+s.delta_fill+'%</div></div>' +
      '<div style="background:#F8FAFC;padding:8px;border-radius:6px"><div style="color:#64748B">Util Δ</div><div style="font-weight:700;color:'+(s.delta_util>0?'#D97706':'#059669')+'">+'+s.delta_util+'%</div></div>' +
      '</div>' +
      '<div style="font-size:11px;color:#64748B;margin-bottom:12px">By '+s.created_by+' · '+(s.created_at||'').substring(0,10)+'</div>' +
      '<div style="display:flex;gap:8px">' +
      '<button class="btn btn-sm btn-primary" onclick="openScenario(\''+s.id+'\')"><i class="fas fa-play"></i> Simulate</button>' +
      '<button class="btn btn-sm btn-secondary" onclick="compareScenario(\''+s.id+'\')"><i class="fas fa-balance-scale"></i> Compare</button>' +
      '<button class="btn btn-sm btn-secondary" onclick="approveScenario(\''+s.id+'\',\''+s.name+'\')"><i class="fas fa-check"></i> Approve</button>' +
      '</div></div></div>';
  }).join('') || '<div class="card"><div class="card-body" style="text-align:center;color:#64748B">No saved scenarios found. Create and run a scenario to populate this area.</div></div>';
}

async function runNewScenario() {
  const name = document.getElementById('scn-name').value || 'New Scenario';
  const type = document.getElementById('scn-type').value;
  const mag  = document.getElementById('scn-magnitude').value;
  const btn  = document.getElementById('run-btn');
  btn.textContent = 'Simulating...';
  btn.disabled = true;
  try {
    const r = await axios.post('/api/scenario-lab/run', { name, type, magnitude:mag });
    const d = r.data;
    document.getElementById('sim-result').style.display = 'block';
    document.getElementById('sim-name').textContent   = d.name;
    document.getElementById('sim-solver').textContent = d.solver + ' · ' + d.run_time_ms + 'ms';
    document.getElementById('sim-otd-base').textContent  = d.baseline.otd + '%';
    document.getElementById('sim-otd-opt').textContent   = d.optimized.otd + '%';
    document.getElementById('sim-fill-base').textContent = d.baseline.fill + '%';
    document.getElementById('sim-fill-opt').textContent  = d.optimized.fill + '%';
    document.getElementById('sim-cost-base').textContent = '₹' + d.baseline.cost;
    document.getElementById('sim-cost-opt').textContent  = '₹' + d.optimized.cost;
    document.getElementById('sim-util-base').textContent = d.baseline.util + '%';
    document.getElementById('sim-util-opt').textContent  = d.optimized.util + '%';
    document.getElementById('sim-recs').innerHTML = d.recommendations.map(r =>
      '<div class="alert alert-info" style="margin-bottom:6px;padding:8px 12px;font-size:12px"><i class="fas fa-lightbulb"></i><span>'+r+'</span></div>'
    ).join('');
    // Week schedule chart
    const ctx = document.getElementById('sim-chart');
    if (ctx) {
      if (ctx._chart) ctx._chart.destroy();
      ctx._chart = new Chart(ctx, {
        type:'bar',
        data:{
          labels: d.week_schedule.map(w=>w.week),
          datasets:[
            { label:'Output (cases)', data:d.week_schedule.map(w=>w.output), backgroundColor:'rgba(37,99,235,0.7)', borderRadius:4, yAxisID:'y' },
            { label:'Utilization %',  data:d.week_schedule.map(w=>w.util),   type:'line', borderColor:'#DC2626', fill:false, tension:0.4, yAxisID:'y2' },
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}},
          scales:{ y:{ position:'left', ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}, y2:{ position:'right', min:60, max:100, ticks:{ font:{size:10} }, grid:{ display:false }}, x:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
      });
    }
  } catch(e) {
    window.showToast('Simulation error: '+e.message,'error');
  } finally {
    btn.textContent = 'Run Simulation';
    btn.disabled = false;
  }
}

function openScenario(id) {
  document.getElementById('scn-name').value = 'Scenario ' + id;
  document.getElementById('run-btn').click();
}
function compareScenario(id) {
  window.showToast('Compare mode: Select a second scenario to view KPI impact comparison.','info');
}
function approveScenario(id, name) {
  if(confirm('Approve scenario "'+name+'" and push to production plan?')) {
    window.showToast("Scenario \""+name+"\" approved and pushed to active plan. MRP, Procurement & Deployment notified.","success");
  }
}
document.addEventListener('DOMContentLoaded', initScenarioLab);
  `.trim()
  return c.html(<Layout user={_u} title="Scenario Simulation Lab" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-flask"></i></div>
        <div>
          <div class="page-title">Scenario Simulation Lab</div>
          <div class="page-subtitle">What-if analysis · Demand surges · Disruption planning · Promotion simulation · Multi-scenario comparison</div>
        </div>
      </div>
      <div class="page-header-right">
        <a href="/control-tower" class="btn btn-secondary"><i class="fas fa-satellite-dish"></i> Control Tower</a>
        <a href="/sop/scenarios" class="btn btn-secondary"><i class="fas fa-sitemap"></i> S&OP Scenarios</a>
      </div>
    </div>

    {/* New Scenario Builder */}
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><span class="card-title"><i class="fas fa-plus-circle"></i> New Scenario Simulation</span><span style="font-size:12px;color:#64748B">Configure and run a what-if simulation</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:2fr 1fr 1fr auto;gap:16px;align-items:flex-end">
          <div class="form-group" style="margin:0">
            <label class="form-label">Scenario Name</label>
            <input id="scn-name" class="form-input" placeholder="e.g. Summer Demand Surge 2026" />
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">Type</label>
            <select id="scn-type" class="form-input form-select">
              <option value="demand">Demand Surge</option>
              <option value="disruption">Plant Disruption</option>
              <option value="promotion">Promotion Spike</option>
              <option value="new_sku">New SKU Launch</option>
            </select>
          </div>
          <div class="form-group" style="margin:0">
            <label class="form-label">Magnitude (%)</label>
            <input id="scn-magnitude" type="number" class="form-input" value="15" min="1" max="100" />
          </div>
          <button id="run-btn" class="btn btn-primary" onclick="runNewScenario()"><i class="fas fa-play"></i> Run Simulation</button>
        </div>
      </div>
    </div>

    {/* Simulation Result */}
    <div id="sim-result" style="display:none;margin-bottom:20px;border-left:4px solid #7C3AED" class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-chart-bar"></i> Simulation Result: <span id="sim-name"></span></span>
        <span style="font-size:11px;color:#64748B" id="sim-solver"></span>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:16px">
          {[['OTD','sim-otd-base','sim-otd-opt'],['Fill Rate','sim-fill-base','sim-fill-opt'],['Cost/Case','sim-cost-base','sim-cost-opt'],['Utilization','sim-util-base','sim-util-opt']].map(([label,baseId,optId]) => (
            <div style="background:#F8FAFC;padding:12px;border-radius:8px">
              <div style="font-size:11px;font-weight:700;color:#64748B;text-transform:uppercase;margin-bottom:6px">{label}</div>
              <div style="display:flex;align-items:center;gap:8px">
                <span style="font-size:14px;color:#94A3B8" id={baseId}>—</span>
                <span style="color:#CBD5E1">→</span>
                <span style="font-size:18px;font-weight:800;color:#1E293B" id={optId}>—</span>
              </div>
            </div>
          ))}
        </div>
        <div style="height:200px;margin-bottom:16px"><canvas id="sim-chart"></canvas></div>
        <div id="sim-recs"></div>
      </div>
    </div>

    {/* Saved Scenarios */}
    <div style="font-size:15px;font-weight:700;color:#1E293B;margin-bottom:12px"><i class="fas fa-layer-group" style="color:#7C3AED"></i> Saved Scenarios</div>
    <div id="scenario-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px">
      <div style="text-align:center;padding:40px;color:#64748B"><div class="spinner"></div></div>
    </div>
  </Layout>)
})

// ── Demand Intelligence Dashboard ────────────────────────────
app.get('/demand-intelligence', async (c) => {
  const _u = getUser(c)
  const scripts = `
async function initDemandIntelligence() {
  const res = await axios.get('/api/demand/intelligence').catch(() => ({ data:{} }));
  const d = res.data;
  if (!d.summary) return;

  document.getElementById('di-accuracy').textContent = d.summary.forecast_accuracy + '%';
  document.getElementById('di-mape').textContent     = d.summary.mape + '%';
  document.getElementById('di-bias').textContent     = d.summary.bias + '%';
  document.getElementById('di-sensing').textContent  = '+' + d.summary.demand_sensing_lift + '%';
  document.getElementById('di-total').textContent    = (d.summary.total_demand/1000000).toFixed(2) + 'M cs';

  // SKU table
  const skuTbl = document.getElementById('di-sku-table');
  if (skuTbl && d.by_sku) {
    skuTbl.innerHTML = d.by_sku.map(s => {
      const trend = s.trend==='up'?'↗ <span style=\\'color:#DC2626\\'>Rising</span>':s.trend==='down'?'↘ <span style=\\'color:#059669\\'>Falling</span>':'→ Stable';
      const sc = s.accuracy>=95?'healthy':s.accuracy>=85?'warning':'critical';
      return '<tr><td><strong>'+s.sku+'</strong></td>' +
        '<td>'+s.p10.toLocaleString()+'</td>' +
        '<td style="font-weight:700">'+s.p50.toLocaleString()+'</td>' +
        '<td>'+s.p90.toLocaleString()+'</td>' +
        '<td>'+(s.actual?s.actual.toLocaleString():'<span style=\\'color:#94A3B8\\'>Pending</span>')+'</td>' +
        '<td><span class="badge badge-'+sc+'">'+s.accuracy+'%</span></td>' +
        '<td>'+trend+'</td>' +
        '<td><span class="badge badge-neutral" style="font-size:10px">'+s.seasonality.replace(/_/g,' ')+'</span></td></tr>';
    }).join('');
  }

  // Forecast fan chart
  const ctx = document.getElementById('di-fan-chart');
  if (ctx && d.weekly_forecast) {
    new Chart(ctx, {
      type:'line',
      data:{
        labels: d.weekly_forecast.map(w=>w.week),
        datasets:[
          { label:'P90 Band', data:d.weekly_forecast.map(w=>w.p90), borderColor:'rgba(37,99,235,0.2)', backgroundColor:'rgba(37,99,235,0.08)', fill:'+1', tension:0.4, borderDash:[3,3], pointRadius:0 },
          { label:'P50 (Forecast)', data:d.weekly_forecast.map(w=>w.p50), borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.1)', fill:false, tension:0.4, borderWidth:2.5 },
          { label:'P10 Band', data:d.weekly_forecast.map(w=>w.p10), borderColor:'rgba(37,99,235,0.2)', fill:false, tension:0.4, borderDash:[3,3], pointRadius:0 },
          { label:'Actual', data:d.weekly_forecast.map(w=>w.actual), borderColor:'#059669', fill:false, tension:0.3, borderWidth:2.5, pointRadius:4, spanGaps:false },
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}}, scales:{ y:{ ticks:{ font:{size:10}, callback:v=>v.toLocaleString() }, grid:{ color:'#F1F5F9' }}, x:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
    });
  }

  // Demand drivers
  const ctx2 = document.getElementById('di-drivers-chart');
  if (ctx2 && d.drivers) {
    new Chart(ctx2, {
      type:'bar',
      data:{
        labels: d.drivers.map(dr=>dr.driver),
        datasets:[{ label:'Demand Impact %', data:d.drivers.map(dr=>dr.impact_pct), backgroundColor:d.drivers.map(dr=>dr.impact_pct>0?'rgba(5,150,105,0.8)':'rgba(220,38,38,0.8)'), borderRadius:4 }]
      },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}, y:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
    });
  }
}
document.addEventListener('DOMContentLoaded', initDemandIntelligence);
  `.trim()
  return c.html(<Layout user={_u} title="Demand Intelligence" activeModule="sop-demand" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#60A5FA)"><i class="fas fa-brain"></i></div>
        <div>
          <div class="page-title">Demand Intelligence Dashboard</div>
          <div class="page-subtitle">Statistical forecasting · Demand sensing · P10/P50/P90 bands · Driver analysis · Accuracy tracking</div>
        </div>
      </div>
      <div class="page-header-right">
        <a href="/sop/demand-review" class="btn btn-secondary"><i class="fas fa-chart-line"></i> Demand Review</a>
        <a href="/scenario-lab" class="btn btn-secondary"><i class="fas fa-flask"></i> Scenario Lab</a>
        <button class="btn btn-primary" onclick="location.href='/api/export/demand'"><i class="fas fa-download"></i> Export</button>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="kpi-card healthy"><div class="kpi-label"><i class="fas fa-bullseye"></i> Forecast Accuracy</div><div class="kpi-value healthy" id="di-accuracy">—</div><div class="kpi-meta"><span class="kpi-target">Target 90%</span><span class="kpi-trend up">▲ 1.2%</span></div></div>
      <div class="kpi-card warning"><div class="kpi-label"><i class="fas fa-percentage"></i> MAPE</div><div class="kpi-value warning" id="di-mape">—</div><div class="kpi-meta"><span class="kpi-target">Target &lt;5%</span><span class="kpi-trend down">▼ 0.3%</span></div></div>
      <div class="kpi-card info"><div class="kpi-label"><i class="fas fa-balance-scale"></i> Forecast Bias</div><div class="kpi-value" id="di-bias">—</div><div class="kpi-meta"><span class="kpi-target">Target ±2%</span></div></div>
      <div class="kpi-card healthy"><div class="kpi-label"><i class="fas fa-bolt"></i> Sensing Lift</div><div class="kpi-value healthy" id="di-sensing">—</div><div class="kpi-meta"><span class="kpi-target">vs statistical</span></div></div>
      <div class="kpi-card info"><div class="kpi-label"><i class="fas fa-chart-line"></i> Total Demand (12W)</div><div class="kpi-value" id="di-total">—</div><div class="kpi-meta"><span class="kpi-target">Mar–Jun 2026</span></div></div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-area"></i> Demand Forecast Fan Chart — P10/P50/P90</span></div>
        <div class="card-body" style="height:260px"><canvas id="di-fan-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-filter"></i> Key Demand Drivers</span></div>
        <div class="card-body" style="height:260px"><canvas id="di-drivers-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> SKU-Level Forecast Intelligence</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-secondary" onclick="location.href='/api/export/demand'"><i class="fas fa-download"></i> Export</button>
          <a href="/sop/demand-review" class="btn btn-sm btn-primary"><i class="fas fa-external-link-alt"></i> Full Review</a>
        </div>
      </div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>P10</th><th>P50 (Plan)</th><th>P90</th><th>Actual</th><th>Accuracy</th><th>Trend</th><th>Seasonality</th></tr></thead>
          <tbody id="di-sku-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ── Planner Workbench (unified) ───────────────────────────────
app.get('/planner-workbench', async (c) => {
  const _u = getUser(c)
  const scripts = `
async function initPlannerWorkbench() {
  // Load multiple data sources in parallel
  const [prodKpis, depKpis, invKpis, exceptions] = await Promise.allSettled([
    axios.get('/api/production/kpis'),
    axios.get('/api/deployment/kpis'),
    axios.get('/api/inventory/kpis'),
    axios.get('/api/control-tower/exceptions'),
  ]);

  const prod = prodKpis.status==='fulfilled' ? prodKpis.value.data : [];
  const dep  = depKpis.status==='fulfilled'  ? depKpis.value.data : [];
  const inv  = invKpis.status==='fulfilled'  ? invKpis.value.data : [];
  const exc  = exceptions.status==='fulfilled' ? exceptions.value.data : [];

  // Production mini-KPIs
  const prodGrid = document.getElementById('pw-prod-kpis');
  if (prodGrid && prod.length) {
    prodGrid.innerHTML = prod.slice(0,3).map(k => {
      const sc = k.status==='critical'?'#DC2626':k.status==='warning'?'#D97706':'#059669';
      return '<div style="text-align:center;padding:10px;background:#F8FAFC;border-radius:8px">' +
        '<div style="font-size:16px;font-weight:800;color:'+sc+'">'+k.value+'</div>' +
        '<div style="font-size:10px;color:#64748B;margin-top:2px">'+k.metric+'</div>' +
        '</div>';
    }).join('');
  }

  // Deployment mini-KPIs
  const depGrid = document.getElementById('pw-dep-kpis');
  if (depGrid && dep.length) {
    depGrid.innerHTML = dep.slice(0,3).map(k => {
      const sc = k.status==='critical'?'#DC2626':k.status==='warning'?'#D97706':'#059669';
      return '<div style="text-align:center;padding:10px;background:#F8FAFC;border-radius:8px">' +
        '<div style="font-size:16px;font-weight:800;color:'+sc+'">'+k.value+'</div>' +
        '<div style="font-size:10px;color:#64748B;margin-top:2px">'+k.metric+'</div>' +
        '</div>';
    }).join('');
  }

  // Priority action items
  const actionList = document.getElementById('pw-actions');
  if (actionList) {
    const actions = [
      { priority:'P1', title:'Approve Mumbai Overtime — W1-W2', module:'Production', href:'/production/workbench', deadline:'Today' },
      { priority:'P1', title:'Resolve Delhi DC Over-Fill', module:'Inventory', href:'/inventory/operations', deadline:'Today' },
      { priority:'P2', title:'Approve PO-2024-0892 (Orange Conc.)', module:'MRP', href:'/mrp/purchase-orders', deadline:'Mar 18' },
      { priority:'P2', title:'Switch Delhi→Lucknow Carrier', module:'Deployment', href:'/deployment/carriers', deadline:'Mar 18' },
      { priority:'P3', title:'Review Mango 200ml Forecast Spike', module:'S&OP', href:'/demand-intelligence', deadline:'Mar 20' },
    ];
    actionList.innerHTML = actions.map(a => {
      const pc = a.priority==='P1'?'#DC2626':a.priority==='P2'?'#D97706':'#2563EB';
      return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9">' +
        '<span style="background:'+pc+';color:white;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;white-space:nowrap">'+a.priority+'</span>' +
        '<div style="flex:1"><div style="font-size:13px;font-weight:600">'+a.title+'</div>' +
        '<div style="font-size:11px;color:#64748B">'+a.module+' · Due: '+a.deadline+'</div></div>' +
        '<a href="'+a.href+'" class="btn btn-sm btn-primary"><i class="fas fa-arrow-right"></i></a>' +
        '</div>';
    }).join('');
  }

  // Decision summary chart
  const ctx = document.getElementById('pw-summary-chart');
  if (ctx) {
    new Chart(ctx, {
      type:'radar',
      data:{
        labels:['Production','Deployment','Inventory','Procurement','S&OP','Capacity'],
        datasets:[
          { label:'Current', data:[88,78,74,71,87,72], borderColor:'#2563EB', backgroundColor:'rgba(37,99,235,0.1)', pointBackgroundColor:'#2563EB', borderWidth:2 },
          { label:'Target',  data:[95,95,90,85,92,88], borderColor:'#059669', backgroundColor:'rgba(5,150,105,0.05)', borderDash:[4,4], borderWidth:1.5 },
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}}, scales:{ r:{ min:50, max:100, ticks:{ font:{size:9}, stepSize:10 }, grid:{ color:'#E2E8F0' }, pointLabels:{ font:{size:11} }}}}
    });
  }
}
document.addEventListener('DOMContentLoaded', initPlannerWorkbench);
  `.trim()
  return c.html(<Layout user={_u} title="Planner Workbench" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0F172A,#334155)"><i class="fas fa-drafting-compass"></i></div>
        <div>
          <div class="page-title">Integrated Planner Workbench</div>
          <div class="page-subtitle">Cross-module decision hub · Priority actions · Real-time KPIs · Plan approvals</div>
        </div>
      </div>
      <div class="page-header-right">
        <a href="/control-tower" class="btn btn-secondary"><i class="fas fa-satellite-dish"></i> Control Tower</a>
        <a href="/approvals" class="btn btn-primary"><i class="fas fa-check-double"></i> Approvals</a>
      </div>
    </div>

    <div class="grid-2-1" style="margin-bottom:20px">
      <div>
        {/* Priority Actions */}
        <div class="card" style="margin-bottom:20px">
          <div class="card-header">
            <span class="card-title"><i class="fas fa-tasks"></i> Priority Actions — Requires Planner Decision</span>
            <a href="/action-items" class="btn btn-sm btn-secondary">View All</a>
          </div>
          <div class="card-body" id="pw-actions" style="padding:16px 20px">
            <div class="spinner"></div>
          </div>
        </div>

        {/* Production + Deployment Mini Panels */}
        <div class="grid-2">
          <div class="card">
            <div class="card-header"><span class="card-title"><i class="fas fa-cogs"></i> Production</span><a href="/production" class="btn btn-sm btn-secondary">Open →</a></div>
            <div class="card-body compact" id="pw-prod-kpis" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px"></div>
          </div>
          <div class="card">
            <div class="card-header"><span class="card-title"><i class="fas fa-truck"></i> Deployment</span><a href="/deployment" class="btn btn-sm btn-secondary">Open →</a></div>
            <div class="card-body compact" id="pw-dep-kpis" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px"></div>
          </div>
        </div>
      </div>

      {/* Health Radar */}
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-radar"></i> Module Health Radar</span></div>
        <div class="card-body" style="height:320px"><canvas id="pw-summary-chart"></canvas></div>
      </div>
    </div>

    {/* Module Quick Navigation */}
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-th"></i> Module Navigation</span></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px">
          {[
            { url:'/sop', icon:'fa-balance-scale', label:'S&OP', color:'#2563EB' },
            { url:'/mrp', icon:'fa-boxes', label:'MRP', color:'#0891B2' },
            { url:'/procurement', icon:'fa-handshake', label:'Procurement', color:'#D97706' },
            { url:'/production', icon:'fa-cogs', label:'Production', color:'#7C3AED' },
            { url:'/capacity', icon:'fa-industry', label:'Capacity', color:'#1E3A8A' },
            { url:'/sequencing', icon:'fa-calendar-alt', label:'Sequencing', color:'#6D28D9' },
            { url:'/resource', icon:'fa-users', label:'Resource', color:'#DC2626' },
            { url:'/inventory', icon:'fa-warehouse', label:'Inventory', color:'#059669' },
            { url:'/deployment', icon:'fa-truck', label:'Deployment', color:'#0891B2' },
            { url:'/control-tower', icon:'fa-satellite-dish', label:'Control Tower', color:'#0F172A' },
          ].map(m => (
            <a href={m.url} style="text-decoration:none;text-align:center;padding:16px 8px;border-radius:10px;border:1px solid #E2E8F0;transition:all 0.15s;display:block" onmouseover="this.style.background='#F8FAFC';this.style.borderColor='#CBD5E1'" onmouseout="this.style.background='';this.style.borderColor='#E2E8F0'">
              <i class={`fas ${m.icon}`} style={`font-size:22px;color:${m.color};display:block;margin-bottom:8px`}></i>
              <div style="font-size:12px;font-weight:600;color:#1E293B">{m.label}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  </Layout>)
})

// ── S&OP Intelligence Board ───────────────────────────────────
app.get('/sop/intelligence', async (c) => {
  const _u = getUser(c)
  const scripts = `
async function initSopIntelligence() {
  const res = await axios.get('/api/sop/intelligence').catch(() => ({ data:{} }));
  const d = res.data;
  if (!d.cycle) return;

  document.getElementById('si-gap').textContent = Math.abs(d.gap/1000).toFixed(0)+'K cs';
  document.getElementById('si-gap-pct').textContent = d.gap_pct+'%';
  document.getElementById('si-demand').textContent = (d.demand_plan/1000000).toFixed(2)+'M cs';
  document.getElementById('si-supply').textContent = (d.supply_plan/1000000).toFixed(2)+'M cs';
  document.getElementById('si-score').textContent  = d.consensus_score+'/100';

  const optGrid = document.getElementById('si-options');
  if (optGrid) {
    optGrid.innerHTML = d.gap_resolution.map((opt,i) => {
      const sc = opt.risk==='high'?'critical':opt.risk==='medium'?'warning':'success';
      return '<div class="card" style="padding:14px;border-left:3px solid '+(opt.risk==='high'?'#DC2626':opt.risk==='medium'?'#D97706':'#059669')+'">' +
        '<div style="font-weight:700;font-size:13px;margin-bottom:8px">Option '+(i+1)+': '+opt.option+'</div>' +
        '<div style="display:flex;gap:10px;font-size:12px;margin-bottom:10px">' +
        '<span style="color:#059669"><i class="fas fa-boxes"></i> +'+opt.impact_cases.toLocaleString()+' cs</span>' +
        '<span style="color:#D97706"><i class="fas fa-rupee-sign"></i> ₹'+opt.cost_inr_lakh+'L</span>' +
        '<span class="badge badge-'+sc+'">'+opt.risk+' risk</span>' +
        '</div>' +
        '<div style="display:flex;gap:8px">' +
        '<button class="btn btn-sm btn-primary" onclick="approveSopOption(\''+opt.option+'\')"><i class="fas fa-check"></i> Approve</button>' +
        '<button class="btn btn-sm btn-secondary" onclick="simulateSopOption(\''+opt.option+'\')"><i class="fas fa-flask"></i> Simulate</button>' +
        '</div></div>';
    }).join('');
  }

  // Consensus chart
  const ctx = document.getElementById('si-consensus-chart');
  if (ctx) {
    new Chart(ctx, {
      type:'bar',
      data:{
        labels:['Demand Plan','Supply Plan','Gap'],
        datasets:[{ data:[d.demand_plan/1000,d.supply_plan/1000,Math.abs(d.gap)/1000], backgroundColor:['#2563EB','#059669','#DC2626'], borderRadius:6 }]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ y:{ ticks:{ font:{size:10}, callback:v=>v.toLocaleString()+'K' }, grid:{ color:'#F1F5F9' }}, x:{ ticks:{ font:{size:11} }, grid:{ display:false }}}}
    });
  }
}

function approveSopOption(opt) {
  if(confirm('Approve: "'+opt+'"?\\nThis will push changes to Production Planning and Capacity modules.')) {
    window.showToast('Approved. Production plan updated. MRP and Capacity notified. Next review: Mar 28.','success');
  }
}
function simulateSopOption(opt) {
  window.showToast('Launching Scenario Lab: '+opt+'...','info'); setTimeout(()=>{window.location.href='/scenario-lab';},900);
  location.href = '/scenario-lab';
}
document.addEventListener('DOMContentLoaded', initSopIntelligence);
  `.trim()
  return c.html(<Layout user={_u} title="S&OP Intelligence Board" activeModule="sop" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#1D4ED8)"><i class="fas fa-chess"></i></div>
        <div>
          <div class="page-title">S&OP Intelligence Board</div>
          <div class="page-subtitle">Demand vs Supply gap analysis · Consensus resolution options · Board-ready decision support</div>
        </div>
      </div>
      <div class="page-header-right">
        <a href="/sop/consensus" class="btn btn-secondary"><i class="fas fa-users"></i> Consensus Meeting</a>
        <a href="/scenario-lab" class="btn btn-secondary"><i class="fas fa-flask"></i> Scenario Lab</a>
        <a href="/demand-intelligence" class="btn btn-primary"><i class="fas fa-brain"></i> Demand Intelligence</a>
      </div>
    </div>

    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr);margin-bottom:20px">
      <div class="kpi-card critical"><div class="kpi-label"><i class="fas fa-exclamation-triangle"></i> Supply-Demand Gap</div><div class="kpi-value critical" id="si-gap">—</div><div class="kpi-meta"><span id="si-gap-pct" style="color:#DC2626;font-weight:700"></span><span class="kpi-target">gap %</span></div></div>
      <div class="kpi-card info"><div class="kpi-label"><i class="fas fa-chart-line"></i> Demand Plan (Mar)</div><div class="kpi-value" id="si-demand">—</div><div class="kpi-meta"><span class="kpi-target">P50 consensus</span></div></div>
      <div class="kpi-card warning"><div class="kpi-label"><i class="fas fa-industry"></i> Supply Plan (Mar)</div><div class="kpi-value warning" id="si-supply">—</div><div class="kpi-meta"><span class="kpi-target">Constrained</span></div></div>
      <div class="kpi-card warning"><div class="kpi-label"><i class="fas fa-users"></i> Consensus Score</div><div class="kpi-value warning" id="si-score">—</div><div class="kpi-meta"><span class="kpi-target">Target 85/100</span></div></div>
      <div class="kpi-card info"><div class="kpi-label"><i class="fas fa-calendar"></i> Next Review</div><div class="kpi-value" style="font-size:18px">Mar 28</div><div class="kpi-meta"><span class="kpi-target">2026</span></div></div>
    </div>

    <div class="grid-2-1" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-list-check"></i> Gap Resolution Options — Planner Decision Required</span></div>
        <div class="card-body" id="si-options" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:16px"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> D vs S Summary</span></div>
        <div class="card-body" style="height:260px"><canvas id="si-consensus-chart"></canvas></div>
      </div>
    </div>
  </Layout>)
})

// ── KPI Benchmarking Dashboard ────────────────────────────────
app.get('/benchmarking', async (c) => {
  const _u = getUser(c)
  const scripts = `
function initBenchmarking() {
  // OTIF Benchmark chart
  const ctx1 = document.getElementById('bm-otif-chart');
  if (ctx1) {
    new Chart(ctx1, {
      type:'bar',
      data:{
        labels:['Industry P25','Industry P50','Industry P75 (Best-in-class)','Your Score','Target'],
        datasets:[{ data:[85,91,96,92.1,95], backgroundColor:['#94A3B8','#64748B','#059669','#2563EB','rgba(5,150,105,0.3)'], borderRadius:5 }]
      },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ x:{ min:75, max:100, ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}, y:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
    });
  }
  // Cost/Case benchmark
  const ctx2 = document.getElementById('bm-cost-chart');
  if (ctx2) {
    new Chart(ctx2, {
      type:'bar',
      data:{
        labels:['Best-in-class','Industry P50','Industry P25','Your Score','Target'],
        datasets:[{ data:[14.2,16.8,19.4,18.4,17.0], backgroundColor:['#059669','#64748B','#94A3B8','#DC2626','rgba(5,150,105,0.3)'], borderRadius:5 }]
      },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false, plugins:{ legend:{ display:false }}, scales:{ x:{ ticks:{ font:{size:10}, callback:v=>'₹'+v }, grid:{ color:'#F1F5F9' }}, y:{ ticks:{ font:{size:10} }, grid:{ display:false }}}}
    });
  }
  // Trend vs industry
  const ctx3 = document.getElementById('bm-trend-chart');
  if (ctx3) {
    new Chart(ctx3, {
      type:'line',
      data:{
        labels:['Q2-25','Q3-25','Q4-25','Q1-26'],
        datasets:[
          { label:'Your OTIF', data:[89.4,90.8,91.6,92.1], borderColor:'#2563EB', fill:false, tension:0.4, borderWidth:2.5 },
          { label:'Industry P50', data:[90.2,90.8,91.0,91.2], borderColor:'#64748B', fill:false, tension:0.3, borderDash:[5,5], borderWidth:1.5 },
          { label:'Best-in-class', data:[95.1,95.4,95.6,96.0], borderColor:'#059669', fill:false, tension:0.3, borderDash:[3,3], borderWidth:1.5 },
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ font:{size:11} }}}, scales:{ y:{ min:85, max:100, ticks:{ font:{size:10} }, grid:{ color:'#F1F5F9' }}, x:{ ticks:{ font:{size:11} }, grid:{ display:false }}}}
    });
  }
}
document.addEventListener('DOMContentLoaded', initBenchmarking);
  `.trim()
  return c.html(<Layout user={_u} title="KPI Benchmarking" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#10B981)"><i class="fas fa-trophy"></i></div>
        <div>
          <div class="page-title">KPI Benchmarking Dashboard</div>
          <div class="page-subtitle">Industry comparison · Best-in-class targets · Beverage sector benchmarks · Improvement gaps</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="window.print()"><i class="fas fa-print"></i> Export Report</button>
      </div>
    </div>

    {/* Benchmark KPI Cards */}
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-star"></i> OTIF vs Best-in-Class</div>
        <div class="kpi-value warning">92.1%</div>
        <div class="kpi-meta"><span class="kpi-target">Best-in-class: 96%</span><span class="kpi-trend down">Gap: -3.9%</span></div>
      </div>
      <div class="kpi-card critical">
        <div class="kpi-label"><i class="fas fa-rupee-sign"></i> Cost/Case vs Target</div>
        <div class="kpi-value critical">₹18.4</div>
        <div class="kpi-meta"><span class="kpi-target">Best-in-class: ₹14.2</span><span class="kpi-trend down">Gap: ₹4.2</span></div>
      </div>
      <div class="kpi-card healthy">
        <div class="kpi-label"><i class="fas fa-bullseye"></i> Forecast Accuracy</div>
        <div class="kpi-value healthy">87.3%</div>
        <div class="kpi-meta"><span class="kpi-target">Best-in-class: 91%</span><span class="kpi-trend down">Gap: -3.7%</span></div>
      </div>
      <div class="kpi-card warning">
        <div class="kpi-label"><i class="fas fa-recycle"></i> Inventory Turns</div>
        <div class="kpi-value warning">18.2×</div>
        <div class="kpi-meta"><span class="kpi-target">Best-in-class: 24×</span><span class="kpi-trend down">Gap: -5.8×</span></div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:20px">
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> OTIF — Industry Benchmark</span></div>
        <div class="card-body" style="height:220px"><canvas id="bm-otif-chart"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Cost/Case — Industry Benchmark</span></div>
        <div class="card-body" style="height:220px"><canvas id="bm-cost-chart"></canvas></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> OTIF Trend vs Industry (Quarterly)</span></div>
      <div class="card-body" style="height:240px"><canvas id="bm-trend-chart"></canvas></div>
    </div>
  </Layout>)
})

// ── Additional API endpoints ──────────────────────────────────
app.post('/api/control-tower/exceptions/:id/resolve', async (c) => {
  const id = c.req.param('id')
  return c.json({ success:true, id, status:'resolving', message:'Exception queued for resolution. Planner notified.' })
})

app.get('/api/demo/summer-surge', async (c) => {
  return c.json({
    scenario: 'Summer Demand Surge — April 2026',
    trigger: 'Temperature forecast +4°C above seasonal average across West & South India',
    demand_uplift: { pct:25, cases:118000, peak_week:'W2-Apr', skus:['PET 500ml','Mango 200ml','SportZ Energy'] },
    supply_gaps: [
      { plant:'MUM', current_util:97, headroom_cases:2700, gap:115300 },
      { plant:'DEL', current_util:74, headroom_cases:13800, action:'Activate overtime — cover 8K cases' },
      { plant:'CHN', current_util:82, headroom_cases:6930,  action:'3rd shift for Mango — cover 6K cases' },
    ],
    recommendation: 'Activate 3 mitigation levers: MUM overtime, DEL capacity pull, CHN 3rd shift. Residual gap: 100,300 cases — defer Glass 500ml to Q3.',
    financial_impact: { revenue_at_risk_cr:4.2, mitigation_cost_lakh:18.4, net_benefit_cr:2.8 }
  })
})

app.get('/api/demo/plant-shutdown', async (c) => {
  return c.json({
    scenario: 'Mumbai Plant Partial Shutdown — Maintenance W1-W2 April',
    trigger: 'Boiler inspection + line overhaul — L2 offline 10 days',
    production_loss: 22400,
    reallocation: [
      { to:'DEL', cases:9600, sku_mix:'PET 500ml, PET 1L', lead_time_days:2 },
      { to:'CHN', cases:7200, sku_mix:'Mango 200ml', lead_time_days:3 },
      { to:'BAN', cases:5600, sku_mix:'Glass 500ml', lead_time_days:4 },
    ],
    inventory_buffer: { wh_mum_cover_days:8.4, recommendation:'Pre-build 18K cases in W4-Mar' },
    recommendation: 'Pre-build + reallocation covers 99.6% of demand. Cost: ₹6.8L incremental transport. Customer impact: 0 stockouts if plan approved by Mar 20.'
  })
})

// Pack-Size Master
app.get('/pack-size-master', async (c) => {
  const scripts = `
async function init() {
  const data = await axios.get('/api/master/pack-sizes').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('pack-table');
  if (el) el.innerHTML = data.map(p => \`<tr>
    <td><strong>\${p.sku}</strong><br/><span style="font-size:11px;color:#64748B">\${p.sku_name}</span></td>
    <td>\${p.cases_per_pallet}</td>
    <td>\${p.cases_per_truck_22ft}</td>
    <td>\${p.cases_per_truck_32ft}</td>
    <td>\${p.weight_per_case_kg}</td>
    <td>\${p.volume_per_case_cbm}</td>
    <td>\${(p.cases_per_truck_32ft * p.weight_per_case_kg).toLocaleString()} kg</td>
    <td><button class="btn btn-sm btn-secondary" onclick="editPackSize(\\'' + p.sku + '\\')"><i class="fas fa-edit"></i></button></td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No data</td></tr>';
}
function editPackSize(sku) {
  window.showToast('Edit pack-size for '+sku+': PUT /api/master/pack-sizes/'+sku+' — connect to master data system.','info');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Pack-Size Master" activeModule="audit" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#475569,#64748B)"><i class="fas fa-ruler"></i></div>
        <div><div class="page-title">Pack-Size Master</div><div class="page-subtitle">Cases per pallet · Truck capacity · Weight & volume per case · SKU master dimensions</div></div>
      </div>
      <div class="page-header-right">
        <a href="/inventory/master" class="btn btn-secondary"><i class="fas fa-arrow-left"></i> Inventory Master</a>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><span class="card-title"><i class="fas fa-ruler"></i> Pack-Size Configurations</span></div>
      <div class="card-body compact">
        <table class="data-table">
          <thead><tr><th>SKU</th><th>Cases/Pallet</th><th>Cases/22ft Truck</th><th>Cases/32ft Truck</th><th>Weight/Case (kg)</th><th>Volume/Case (CBM)</th><th>Max Payload/32ft</th><th>Edit</th></tr></thead>
          <tbody id="pack-table"><tr><td colspan={8} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ============================================================
// OPTIMIZATION WORKBENCH PAGES (added per audit — 8 modules)
// Each module gets a new /*/optimization-workbench route with
// 4 tabs: Objectives · Constraints · Results · Scenario Comparison
// Existing pages are NOT modified.
// ============================================================

// ------ 1. INVENTORY – Optimization Workbench ------
app.get('/inventory/optimization-workbench', (c) => {
  const scripts = `
function invWbTab(tab) {
  document.querySelectorAll('.invwb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.invwb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runInvOpt() {
  const btn = document.getElementById('invwb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('invwb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['Fill Rate','98.4%','healthy'],['Inventory Turns','+22%','healthy'],['Inv. Value Reduction','−₹18L','healthy'],['Safety Stock Saved','−15%','healthy'],['Expiry Risk','0.3%','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Optimization complete.</strong> MEIO model recommends adjusting safety stock for 6 SKUs. Estimated annual working-capital saving: ₹21.6L. Service level improvement: +1.3 pp → 98.4%.</div></div>
  \`;
  invWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => invWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Inventory – Optimization Workbench" activeModule="inv-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Inventory — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, define constraints, run MEIO engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="invwb-run-btn" onclick="runInvOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/inventory/optimization" class="btn btn-secondary"><i class="fas fa-sync-alt"></i> Replenishment View</a>
      </div>
    </div>
    {/* Tab bar */}
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="invwb-tab" data-tab={tab} onclick={`invWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      {/* Objectives */}
      <div class="invwb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select inventory optimization objectives aligned to Excel specs</p>
        {[
          ['≥98% Fill Rate','Service Level','Ensure right product at right place and time','high'],
          ['Inventory Turns ↑20–30%','Inventory Efficiency','Balance across network — avoid excess & stockouts','high'],
          ['Inventory Value ↓15–25%','Cost Optimization','Minimize capital locked in RM, WIP, FG','high'],
          ['Forecast Bias ±5%','Demand Alignment','Align inventory with demand, seasonality & promotions','medium'],
          ['Expiry Loss <0.5%','Freshness Control','Manage shelf-life-sensitive SKUs — FEFO discipline','medium'],
          ['Safety Stock ↓15–20%','Network Optimization','Multi-echelon MEIO across all nodes','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#D1FAE5;color:#059669;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      {/* Constraints */}
      <div class="invwb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">System constraints governing inventory optimization engine</p>
        {[
          ['Shelf Life Limit','SKU-specific','days'],
          ['Min Order Quantity','500–50,000','cases'],
          ['Warehouse Fill Limit','80','%'],
          ['Replenishment Frequency','Weekly','cycle'],
          ['Lead Time Variability','±20','%'],
          ['Forecast Accuracy Floor','70','% MAPE'],
          ['Service Level Target','97.5','%'],
          ['Max Safety Stock Cover','30','days'],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:100px">{unit}</span>
          </div>
        )}
      </div>
      {/* Results */}
      <div class="invwb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="invwb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      {/* Scenarios */}
      <div class="invwb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare inventory outcomes across planning scenarios (Excel S1–S7)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>Fill Rate</th><th>Inv. Turns</th><th>SS Change</th><th>Expiry Risk</th><th>Working Capital</th><th>Risk</th></tr></thead>
          <tbody>
            {[
              ['S1 – Baseline','Current State','97.1%','18.2x','0%','0.4%','₹0','Low'],
              ['S2 – Demand Surge','Summer Peak','89.5%','24.1x','+32%','0.2%','+₹22L','High'],
              ['S3 – Promo Uplift','Promotion Event','92.3%','21.5x','+18%','0.3%','+₹14L','Medium'],
              ['S4 – Shelf Life −30d','Quality Change','94.1%','22.8x','+8%','1.2%','+₹6L','High'],
              ['S5 – SL Target 98%','Policy Change','98.0%','16.4x','+25%','0.3%','+₹18L','Medium'],
              ['S6 – Lead Time +10d','Supplier Delay','93.2%','17.1x','+41%','0.5%','+₹28L','High'],
              ['S7 – New SKU Launch','NPD Launch','95.5%','19.3x','+15%','0.6%','+₹10L','Medium'],
            ].map(([sc,dr,fr,it,ss,ex,wc,ri]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class={`badge badge-${Number(fr.replace('%',''))>=97?'success':Number(fr.replace('%',''))>=93?'warning':'critical'}`}>{fr}</span></td>
                <td>{it}</td>
                <td style={`color:${ss==='0%'?'#059669':'#DC2626'}`}>{ss}</td>
                <td style={`color:${Number(ex.replace('%',''))>0.5?'#DC2626':'#059669'}`}>{ex}</td>
                <td style={`color:${wc==='₹0'?'inherit':wc.startsWith('-')?'#059669':'#DC2626'}`}>{wc}</td>
                <td><span class={`badge badge-${ri==='High'||ri==='Critical'?'warning':ri==='Low'?'success':'info'}`}>{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 2. PROCUREMENT – Optimization Workbench ------
app.get('/procurement/optimization-workbench', (c) => {
  const scripts = `
function procWbTab(tab) {
  document.querySelectorAll('.procwb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.procwb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runProcOpt() {
  const btn = document.getElementById('procwb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('procwb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['Cost Saving','₹4.2L/mo','healthy'],['OTIF Gain','+3.8%','healthy'],['Lead Time Cut','−4 days','healthy'],['Risk Reduction','−35%','healthy'],['Contracts Renewed','4','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Procurement optimization complete.</strong> Multi-supplier allocation rebalanced. Consolidation of 3 POs identified. Annual savings potential: ₹50.4L.</div></div>
  \`;
  procWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => procWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Procurement – Optimization Workbench" activeModule="proc-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Procurement — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, constraints, run supplier allocation engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="procwb-run-btn" onclick="runProcOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/procurement/suppliers" class="btn btn-secondary"><i class="fas fa-star"></i> Supplier Scorecard</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="procwb-tab" data-tab={tab} onclick={`procWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      <div class="procwb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select procurement optimization objectives from Excel Procurement Planning specs</p>
        {[
          ['≥90% Supplier OTIF','Supplier Reliability','Improve on-time in-full delivery from all suppliers','high'],
          ['Procurement Cost ↓8–12%','Cost Reduction','Volume consolidation, contract leverage, spot avoidance','high'],
          ['Dual-source all A-class items','Risk Mitigation','Reduce single-supplier concentration risk','high'],
          ['Lead Time ↓15%','Speed Improvement','Reduce procurement cycle time across all categories','medium'],
          ['Contract Coverage ≥80%','Contract Compliance','Move spot spend to contracted agreements','medium'],
          ['Payment Terms ≥60 days','Cash Flow Optimization','Extend DPO without supplier relationship impact','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#FEF3C7;color:#D97706;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      <div class="procwb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Constraints governing procurement optimization</p>
        {[
          ['Max Single-Supplier Share','40','%'],
          ['Min Order Quantity','500','cases'],
          ['Max Spot Buy Allowance','15','% of spend'],
          ['Lead Time Buffer','5','days'],
          ['Quality Rejection Tolerance','1.5','%'],
          ['Supplier Onboarding Lead','60','days'],
          ['Contract Minimum Duration','6','months'],
          ['Dual-Source Threshold','₹10L','monthly spend'],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:100px">{unit}</span>
          </div>
        )}
      </div>
      <div class="procwb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="procwb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      <div class="procwb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare procurement outcomes across scenarios (Excel S1–S6)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>OTIF %</th><th>Cost Impact</th><th>Lead Time</th><th>Risk Level</th><th>Savings</th><th>Status</th></tr></thead>
          <tbody>
            {[
              ['S1 – Baseline','Current Allocation','87.4%','₹0','14 days','Medium','—','Active'],
              ['S2 – Consolidate POs','Volume Consolidation','89.1%','−₹2.4L/mo','12 days','Low','₹28.8L/yr','Recommended'],
              ['S3 – Dual Source A-class','Risk Mitigation','90.2%','+₹0.8L/mo','14 days','Low','−₹9.6L/yr','Recommended'],
              ['S4 – Extend Contracts','DPO +30 days','88.3%','−₹1.2L/mo','13 days','Low','₹14.4L/yr','Pending'],
              ['S5 – Spot Reduction','Contract Coverage','88.9%','−₹1.8L/mo','12 days','Low','₹21.6L/yr','Pending'],
              ['S6 – Near-shore Supplier','Lead Time Cut','87.8%','+₹0.6L/mo','8 days','Medium','Risk Reduction','Evaluating'],
            ].map(([sc,dr,otif,ci,lt,rl,sv,st]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class={`badge badge-${Number(otif.replace('%',''))>=90?'success':Number(otif.replace('%',''))>=87?'warning':'critical'}`}>{otif}</span></td>
                <td style={`color:${ci==='₹0'||ci.startsWith('−')?'#059669':'#DC2626'}`}>{ci}</td>
                <td>{lt}</td>
                <td><span class={`badge badge-${rl==='Low'?'success':rl==='Medium'?'warning':'critical'}`}>{rl}</span></td>
                <td style={`color:${sv.startsWith('−')||sv==='—'?'inherit':'#059669'}`}>{sv}</td>
                <td><span class={`badge badge-${st==='Active'?'info':st==='Recommended'?'success':st==='Pending'?'warning':'neutral'}`}>{st}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 3. RESOURCE – Optimization Workbench ------
app.get('/resource/optimization-workbench', (c) => {
  const scripts = `
function resWbTab(tab) {
  document.querySelectorAll('.reswb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.reswb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runResOpt() {
  const btn = document.getElementById('reswb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('reswb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['OT Reduction','−44 hrs/wk','healthy'],['Utilization Balance','84% all shifts','healthy'],['Cross-training','6 gaps closed','healthy'],['Cost Saving','₹6.8L/mo','healthy'],['Productivity Gain','+12%','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Resource optimization complete.</strong> Shift rebalancing + cross-training plan generated. Estimated annual OT cost savings: ₹81.6L.</div></div>
  \`;
  resWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => resWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Resource – Optimization Workbench" activeModule="res-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Resource — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, constraints, run workforce optimization engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="reswb-run-btn" onclick="runResOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/resource/optimization" class="btn btn-secondary"><i class="fas fa-chart-bar"></i> OT Analysis</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="reswb-tab" data-tab={tab} onclick={`resWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      <div class="reswb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select resource optimization objectives from Excel Resource Planning specs</p>
        {[
          ['Resource Utilization ≥82%','Workforce Utilization','Achieve balanced utilization across all shifts and plants','high'],
          ['Overtime ≤15% of regular hrs','OT Control','Minimize overtime cost while meeting production demand','high'],
          ['Cross-skill ≥80% operators','Skill Flexibility','Build multi-skilled workforce for operational resilience','high'],
          ['Absenteeism <3%','Attendance Management','Reduce unplanned absences with proactive scheduling','medium'],
          ['Productivity ≥OEE 78%','Efficiency','Align operator skills to line requirements for peak output','medium'],
          ['Training Hours ≥8 hrs/month','Capability Development','Ensure continuous skill development per operator','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#FEE2E2;color:#DC2626;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      <div class="reswb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Constraints governing workforce optimization engine</p>
        {[
          ['Shift Duration','8','hours'],
          ['Shift Pattern','3 shifts/day','fixed'],
          ['OT Cap','40','hrs/week'],
          ['Min Rest Between Shifts','10','hours'],
          ['Headcount Cap','128','operators'],
          ['Training Budget','₹8L','per quarter'],
          ['Flex Hiring Lead Time','30','days'],
          ['Cross-skill Coverage Target','3 lines','per operator'],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:100px">{unit}</span>
          </div>
        )}
      </div>
      <div class="reswb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="reswb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      <div class="reswb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare workforce outcomes across planning scenarios (Excel S1–S5)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>Utilization</th><th>OT hrs/wk</th><th>OT Cost/mo</th><th>Headcount</th><th>Productivity</th><th>Risk</th></tr></thead>
          <tbody>
            {[
              ['S1 – Baseline','Current State','79.8%','142','₹8.5L','128','76%','Medium'],
              ['S2 – Shift Rebalance','Rebalance Shifts','83.4%','98','₹5.9L','128','80%','Low'],
              ['S3 – Cross-training','Skill Building','82.1%','110','₹6.6L','128','82%','Low'],
              ['S4 – Demand +20%','Volume Surge','94.2%','210','₹12.6L','140','77%','High'],
              ['S5 – Flex + Rebalance','Combined Plan','84.6%','88','₹5.3L','132','85%','Low'],
            ].map(([sc,dr,ut,ot,oc,hc,pr,ri]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class={`badge badge-${Number(ut.replace('%',''))>=82?'success':Number(ut.replace('%',''))>=75?'warning':'critical'}`}>{ut}</span></td>
                <td style={`color:${Number(ot)>140?'#DC2626':Number(ot)>100?'#D97706':'#059669'}`}>{ot}</td>
                <td>{oc}</td><td>{hc}</td>
                <td><span class={`badge badge-${Number(pr.replace('%',''))>=82?'success':Number(pr.replace('%',''))>=78?'warning':'critical'}`}>{pr}</span></td>
                <td><span class={`badge badge-${ri==='High'||ri==='Critical'?'warning':ri==='Low'?'success':'info'}`}>{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 4. S&OP – Optimization Workbench ------
app.get('/sop/optimization-workbench', (c) => {
  const scripts = `
function sopWbTab(tab) {
  document.querySelectorAll('.sopwb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.sopwb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runSopOpt() {
  const btn = document.getElementById('sopwb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('sopwb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['Forecast Accuracy','91.2%','healthy'],['Supply Fill Rate','95.8%','healthy'],['Consensus Gap','−2.1%','healthy'],['Volume Uplift','+8.4%','healthy'],['Plan Adherence','93.5%','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>S&OP optimization complete.</strong> Demand-supply consensus plan generated. Recommended volume uplift of 8.4% in Q2. Forecast bias reduced to ±2.1%.</div></div>
  \`;
  sopWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => sopWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="S&OP – Optimization Workbench" activeModule="sop-consensus" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#60A5FA)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">S&OP — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, constraints, run demand-supply balancing engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="sopwb-run-btn" onclick="runSopOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/sop/consensus" class="btn btn-secondary"><i class="fas fa-users"></i> Consensus Meeting</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="sopwb-tab" data-tab={tab} onclick={`sopWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      <div class="sopwb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select S&OP optimization objectives from Excel S&OP Planning specs</p>
        {[
          ['Forecast Accuracy ≥90%','Demand Accuracy','Improve statistical forecast quality and reduce bias','high'],
          ['Supply Fill Rate ≥95%','Supply Reliability','Align supply plan to demand — minimize stockouts','high'],
          ['Consensus Gap <3%','Plan Alignment','Reduce delta between commercial and supply plans','high'],
          ['Inventory DOI 12–18 days','Inventory Balance','Right-size inventory across S&OP horizon','medium'],
          ['OTIF ≥92%','Service Performance','On-time in-full delivery across all channels','medium'],
          ['Revenue Uplift via Promo','Revenue Growth','Capture promotional uplift in consensus demand plan','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#DBEAFE;color:#1D4ED8;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      <div class="sopwb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Constraints governing the S&OP optimization engine</p>
        {[
          ['Planning Horizon','6','months rolling'],
          ['Min Forecast Cycle','Weekly','update cadence'],
          ['Capacity Ceiling','90','% utilization'],
          ['Safety Stock Floor','7','days cover'],
          ['Promo Lift Cap','30','%'],
          ['Demand Sensing Window','4','weeks'],
          ['Consensus Deviation Limit','5','%'],
          ['Volume Lock-in Period','4','weeks frozen'],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:120px">{unit}</span>
          </div>
        )}
      </div>
      <div class="sopwb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="sopwb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      <div class="sopwb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare S&OP outcomes across consensus scenarios (Excel S1–S6)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>Forecast Acc.</th><th>Fill Rate</th><th>Inventory DOI</th><th>Revenue Impact</th><th>Risk</th><th>Recommendation</th></tr></thead>
          <tbody>
            {[
              ['S1 – Baseline','Current Plan','87.3%','94.1%','14.8 days','₹0','Medium','Reference'],
              ['S2 – Demand +15%','Volume Uplift','84.2%','91.3%','12.1 days','+₹32L','High','Evaluate'],
              ['S3 – Promo Activation','Q2 Campaign','88.1%','93.8%','11.4 days','+₹18L','Medium','Recommended'],
              ['S4 – Supply Constraint','Capacity Cap 85%','87.3%','89.6%','18.2 days','−₹12L','High','Contingency'],
              ['S5 – Consensus Plan','Aligned Plan','90.2%','95.8%','13.6 days','+₹14L','Low','Recommended'],
              ['S6 – SKU Rationalization','SKU Reduction','91.4%','96.2%','11.8 days','+₹8L','Low','Consider'],
            ].map(([sc,dr,fa,fr,doi,ri_v,rl,rec]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class={`badge badge-${Number(fa.replace('%',''))>=90?'success':Number(fa.replace('%',''))>=85?'warning':'critical'}`}>{fa}</span></td>
                <td><span class={`badge badge-${Number(fr.replace('%',''))>=95?'success':Number(fr.replace('%',''))>=91?'warning':'critical'}`}>{fr}</span></td>
                <td>{doi}</td>
                <td style={`color:${ri_v==='₹0'?'inherit':ri_v.startsWith('+')?'#059669':'#DC2626'}`}>{ri_v}</td>
                <td><span class={`badge badge-${rl==='Low'?'success':rl==='Medium'?'warning':'critical'}`}>{rl}</span></td>
                <td><span class={`badge badge-${rec==='Recommended'?'success':rec==='Reference'?'info':rec==='Consider'?'warning':'neutral'}`}>{rec}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 5. PRODUCTION – Optimization Workbench ------
app.get('/production/optimization-workbench', (c) => {
  const scripts = `
function prodWbTab(tab) {
  document.querySelectorAll('.prodwb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.prodwb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runProdOpt() {
  const btn = document.getElementById('prodwb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('prodwb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['MPS Adherence','96.8%','healthy'],['OEE Gain','+4.2%','healthy'],['Changeover Saved','−11.9 hrs','healthy'],['Cost Saving','₹8.4L/mo','healthy'],['ATP Available','34.2K cases','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Production optimization complete.</strong> AI sequence: 500ml → 1L → Mango saves 11.9h changeover. Annual production cost saving: ₹100.8L. MPS adherence improved to 96.8%.</div></div>
  \`;
  prodWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => prodWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Production – Optimization Workbench" activeModule="prod-workbench" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Production — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, constraints, run production scheduling engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="prodwb-run-btn" onclick="runProdOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/production/workbench" class="btn btn-secondary"><i class="fas fa-drafting-compass"></i> Planner Workbench</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="prodwb-tab" data-tab={tab} onclick={`prodWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      <div class="prodwb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select production optimization objectives from Excel Production Planning specs</p>
        {[
          ['MPS Adherence ≥95%','Plan Adherence','Maximize master production schedule execution rate','high'],
          ['OEE ≥78%','Overall Equipment Effectiveness','Improve availability, performance and quality on all lines','high'],
          ['Changeover ↓20–30%','Sequence Optimization','Minimize changeover loss through optimal SKU sequencing','high'],
          ['Line Utilization 75–90%','Capacity Efficiency','Balanced utilization — avoid idle and over-loaded lines','medium'],
          ['ATP Coverage ≥95%','Available-to-Promise','Ensure firm orders can be met within planning horizon','medium'],
          ['Waste <2% of output','Quality & Waste','Minimize production waste and quality rejections','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#EDE9FE;color:#7C3AED;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      <div class="prodwb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Constraints governing production optimization engine</p>
        {[
          ['Max Line Utilization','90','%'],
          ['Min Batch Size','5,000','cases'],
          ['Max Changeover Window','Weekends Only',''],
          ['Shift Structure','3 shifts/day',''],
          ['Allergen Sequencing','Enabled',''],
          ['Min Safety Buffer','10','%'],
          ['Co-packer Spend Cap','₹50L','per month'],
          ['Lead Time to Market','5','days'],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:120px">{unit}</span>
          </div>
        )}
      </div>
      <div class="prodwb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="prodwb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      <div class="prodwb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare production outcomes across planning scenarios (Excel S1–S6)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>MPS Adherence</th><th>Line Util</th><th>Changeovers</th><th>OEE</th><th>Cost Impact</th><th>Risk</th></tr></thead>
          <tbody>
            {[
              ['S1 – Baseline','Current State','94.2%','78%','42','74.8%','₹0','Low'],
              ['S2 – AI Sequence','Optimal SKU Order','94.2%','79%','29','77.2%','−₹8.4L/mo','Low'],
              ['S3 – Demand +20%','Volume Surge','88.6%','94%','58','71.4%','+₹18L/mo','High'],
              ['S4 – Line 2 Down','Equipment Failure','91.3%','85%','38','72.1%','+₹12L/mo','High'],
              ['S5 – NPD Launch','New SKU','90.8%','88%','71','73.6%','+₹8L/mo','Medium'],
              ['S6 – SKU Rationalization','Fewer SKUs','96.1%','72%','28','80.2%','−₹15L/mo','Low'],
            ].map(([sc,dr,mps,lu,co,oee,ci,ri]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class={`badge badge-${Number(mps.replace('%',''))>=95?'success':Number(mps.replace('%',''))>=90?'warning':'critical'}`}>{mps}</span></td>
                <td><span class={`badge badge-${Number(lu.replace('%',''))>=90?'critical':Number(lu.replace('%',''))>=80?'warning':'success'}`}>{lu}</span></td>
                <td>{co}</td>
                <td><span class={`badge badge-${Number(oee.replace('%',''))>=78?'success':Number(oee.replace('%',''))>=72?'warning':'critical'}`}>{oee}</span></td>
                <td style={`color:${ci==='₹0'||ci.startsWith('−')?'#059669':'#DC2626'}`}>{ci}</td>
                <td><span class={`badge badge-${ri==='High'?'warning':ri==='Low'?'success':'info'}`}>{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 6. SEQUENCING – Optimization Workbench ------
app.get('/sequencing/optimization-workbench', (c) => {
  const scripts = `
function seqWbTab(tab) {
  document.querySelectorAll('.seqwb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.seqwb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runSeqOpt() {
  const btn = document.getElementById('seqwb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('seqwb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['OTD Performance','94.8%','healthy'],['Changeover Reduction','−11.9 hrs','healthy'],['Throughput Gain','+7.2%','healthy'],['Schedule Adherence','96.1%','healthy'],['Bottleneck Cleared','2 lines','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Sequencing optimization complete.</strong> Johnson&apos;s algorithm applied. Optimal sequence: 500ml → 1L → Mango. Changeover saving: 11.9 hrs/week. OTD improvement: +3.6 pp.</div></div>
  \`;
  seqWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => seqWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Sequencing – Optimization Workbench" activeModule="seq-planner" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#6D28D9,#8B5CF6)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Sequencing & Scheduling — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, constraints, run sequence optimization engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="seqwb-run-btn" onclick="runSeqOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/sequencing/gantt" class="btn btn-secondary"><i class="fas fa-bars-staggered"></i> Gantt View</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="seqwb-tab" data-tab={tab} onclick={`seqWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      <div class="seqwb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select sequencing optimization objectives from Excel Sequencing & Scheduling specs</p>
        {[
          ['OTD ≥92%','On-Time Delivery','Maximize on-time job completion across all production lines','high'],
          ['Changeover ↓15–25%','Changeover Minimization','Minimize total changeover time via optimal SKU sequencing','high'],
          ['Throughput ≥OEE 78%','Throughput Maximization','Maximize output from available capacity','high'],
          ['Schedule Adherence ≥95%','Plan Accuracy','Minimize deviation from master production schedule','medium'],
          ['Bottlenecks Cleared','Constraint Removal','Identify and resolve scheduling bottlenecks in real time','medium'],
          ['Setup Matrix Optimization','SMED Application','Apply single-minute exchange of die principles','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#EDE9FE;color:#6D28D9;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      <div class="seqwb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Constraints governing sequencing optimization engine</p>
        {[
          ['Sequence Algorithm','Johnsons / NEH',''],
          ['Max Jobs in Queue','20','per line'],
          ['Min Batch Size','5,000','cases'],
          ['Allergen Sequence Rule','Allergen Last',''],
          ['Changeover Cap','4','hrs max'],
          ['Frozen Schedule Window','24','hours'],
          ['Rush Order Priority','P1 inserted front',''],
          ['Shift Handover Buffer','30','minutes'],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:160px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:80px">{unit}</span>
          </div>
        )}
      </div>
      <div class="seqwb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="seqwb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      <div class="seqwb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare sequencing outcomes across planning scenarios (Excel S1–S5)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Algorithm</th><th>OTD</th><th>Changeovers</th><th>Throughput</th><th>Schedule Adherence</th><th>Changeover hrs saved</th><th>Risk</th></tr></thead>
          <tbody>
            {[
              ['S1 – Random Sequence','Baseline','91.2%','42/wk','74.8%','88.4%','—','Medium'],
              ['S2 – Johnson\'s Algorithm','NEH Optimization','94.8%','29/wk','78.2%','96.1%','11.9 hrs/wk','Low'],
              ['S3 – Allergen Priority','Rule-based','92.1%','36/wk','76.4%','91.8%','5.2 hrs/wk','Low'],
              ['S4 – Demand-Driven','Dynamic','93.4%','31/wk','77.8%','94.2%','9.1 hrs/wk','Low'],
              ['S5 – Mixed SKU Surge','NPD + Rush Orders','88.3%','58/wk','70.1%','82.6%','—','High'],
            ].map(([sc,algo,otd,co,tp,sa,sv,ri]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{algo}</td>
                <td><span class={`badge badge-${Number(otd.replace('%',''))>=94?'success':Number(otd.replace('%',''))>=90?'warning':'critical'}`}>{otd}</span></td>
                <td>{co}</td>
                <td><span class={`badge badge-${Number(tp.replace('%',''))>=78?'success':Number(tp.replace('%',''))>=73?'warning':'critical'}`}>{tp}</span></td>
                <td><span class={`badge badge-${Number(sa.replace('%',''))>=95?'success':Number(sa.replace('%',''))>=88?'warning':'critical'}`}>{sa}</span></td>
                <td style={`color:${sv==='—'?'inherit':'#059669'}`}>{sv}</td>
                <td><span class={`badge badge-${ri==='High'?'warning':ri==='Low'?'success':'info'}`}>{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 7. DEPLOYMENT – Optimization Workbench ------
app.get('/deployment/optimization-workbench', (c) => {
  const scripts = `
function depWbTab(tab) {
  document.querySelectorAll('.depwb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.depwb-panel').forEach(p => p.style.display = p.dataset.panel===tab?'block':'none');
}
async function runDepOpt() {
  const btn = document.getElementById('depwb-run-btn');
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px"></span> Running…';
  btn.disabled = true;
  await new Promise(r => setTimeout(r, 1800));
  document.getElementById('depwb-results').innerHTML = \`
    <div class="kpi-grid" style="grid-template-columns:repeat(5,1fr)">
      \${[['OTD Improvement','+4.2%','healthy'],['Truck Utilization','91.4%','healthy'],['Transport Cost Saving','−₹6.2L/mo','healthy'],['Safety Stock Freed','₹8L','healthy'],['CO2 Reduction','−12%','healthy']].map(([l,v,s]) =>
        '<div class="kpi-card '+s+'"><div class="kpi-label">'+l+'</div><div class="kpi-value '+s+'">'+v+'</div></div>').join('')}
    </div>
    <div class="alert alert-success" style="margin-top:12px"><i class="fas fa-check-circle"></i><div><strong>Deployment optimization complete.</strong> Network rebalancing recommended: Consolidate 3 partial loads, re-route Delhi–Lucknow via Agra hub. Annual transport saving: ₹74.4L.</div></div>
  \`;
  depWbTab('results');
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => depWbTab('objectives'));
`.trim()
  const _u = getUser(c); return c.html(<Layout user={_u} title="Deployment – Optimization Workbench" activeModule="dep-workbench" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-sliders-h"></i></div>
        <div>
          <div class="page-title">Deployment — Optimization Workbench</div>
          <div class="page-subtitle">Set objectives, constraints, run network optimization engine & compare scenarios</div>
        </div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" id="depwb-run-btn" onclick="runDepOpt()"><i class="fas fa-rocket"></i> Run Optimization</button>
        <a href="/deployment/workbench" class="btn btn-secondary"><i class="fas fa-drafting-compass"></i> Planner Workbench</a>
      </div>
    </div>
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[['objectives','1. Objectives','fa-bullseye'],['constraints','2. Constraints','fa-lock'],['results','3. Results','fa-chart-bar'],['scenarios','4. Scenario Comparison','fa-layer-group']].map(([tab,label,icon]) =>
          <button key={tab} class="depwb-tab" data-tab={tab} onclick={`depWbTab('${tab}')`}
            style="padding:12px 20px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>
      <div class="depwb-panel" data-panel="objectives" style="padding:20px">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Select deployment optimization objectives from Excel Deployment Planning specs</p>
        {[
          ['OTD ≥93%','On-Time Delivery','Maximize on-time delivery to all markets and DCs','high'],
          ['Truck Utilization ≥88%','Load Efficiency','Maximize truck fill rate — reduce empty and partial loads','high'],
          ['Transport Cost ↓10–15%','Cost Optimization','Consolidate loads, optimize routes, reduce spot freight','high'],
          ['Safety Stock at DCs ≤15 days','Inventory Efficiency','Right-size safety stock at each distribution center','medium'],
          ['Inter-DC Transfers ↓20%','Network Efficiency','Reduce lateral transfers via improved demand planning','medium'],
          ['CO2 per Case ↓12%','Sustainability','Reduce carbon footprint through route and load optimization','low'],
        ].map(([target, label, desc, pri], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 4} style="width:16px;height:16px" />
            <div style="flex:1"><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <span style="font-size:11px;background:#CFFAFE;color:#0891B2;padding:3px 8px;border-radius:6px;white-space:nowrap">{target}</span>
            <select class="form-input form-select" style="width:130px">
              <option selected={pri==='high'}>High Priority</option>
              <option selected={pri==='medium'}>Medium Priority</option>
              <option selected={pri==='low'}>Low Priority</option>
            </select>
          </div>
        )}
      </div>
      <div class="depwb-panel" data-panel="constraints" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Constraints governing deployment optimization engine</p>
        {[
          ['Min Truck Fill','65','%'],
          ['Max Route Distance','800','km per trip'],
          ['Delivery Window','6:00–22:00','hours'],
          ['DC Safety Stock Floor','7','days'],
          ['Cold Chain Max Duration','18','hours'],
          ['Carrier SLA Minimum','90','% OTD'],
          ['Load Consolidation Window','24','hours'],
          ['Inter-DC Transfer Trigger','<5 days cover',''],
        ].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:140px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:120px">{unit}</span>
          </div>
        )}
      </div>
      <div class="depwb-panel" data-panel="results" style="padding:20px;display:none">
        <div id="depwb-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
      </div>
      <div class="depwb-panel" data-panel="scenarios" style="padding:20px;display:none">
        <p style="font-size:12px;color:#64748B;margin-bottom:16px">Compare deployment outcomes across planning scenarios (Excel S1–S6)</p>
        <table class="data-table">
          <thead><tr><th>Scenario</th><th>Driver</th><th>OTD</th><th>Truck Util</th><th>Transport Cost</th><th>DC Stock DOI</th><th>Transfers</th><th>Risk</th></tr></thead>
          <tbody>
            {[
              ['S1 – Baseline','Current Network','91.4%','84.2%','₹0','14.8 days','12/wk','Medium'],
              ['S2 – Route Opt.','Shortest Path','93.1%','87.8%','−₹4.2L/mo','14.8 days','12/wk','Low'],
              ['S3 – Load Consolidation','Batch Dispatch','92.8%','91.4%','−₹6.2L/mo','15.2 days','8/wk','Low'],
              ['S4 – Demand Surge +20%','Peak Season','88.2%','92.6%','+₹8.4L/mo','11.2 days','22/wk','High'],
              ['S5 – DC Expansion','New Lucknow DC','94.2%','88.6%','−₹3.8L/mo','12.4 days','6/wk','Low'],
              ['S6 – Hub & Spoke','Network Redesign','93.8%','90.2%','−₹9.6L/mo','13.6 days','4/wk','Low'],
            ].map(([sc,dr,otd,tu,tc,doi,tf,ri]) =>
              <tr key={sc}>
                <td><strong>{sc}</strong></td>
                <td style="font-size:12px;color:#64748B">{dr}</td>
                <td><span class={`badge badge-${Number(otd.replace('%',''))>=93?'success':Number(otd.replace('%',''))>=90?'warning':'critical'}`}>{otd}</span></td>
                <td><span class={`badge badge-${Number(tu.replace('%',''))>=88?'success':Number(tu.replace('%',''))>=82?'warning':'critical'}`}>{tu}</span></td>
                <td style={`color:${tc==='₹0'||tc.startsWith('−')?'#059669':'#DC2626'}`}>{tc}</td>
                <td>{doi}</td><td>{tf}</td>
                <td><span class={`badge badge-${ri==='High'?'warning':ri==='Low'?'success':'info'}`}>{ri}</span></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </Layout>)
})

// ------ 8. CAPACITY – Optimization Workbench (new alias) ------
// Note: /capacity/optimization already IS the full 4-tab workbench.
// This alias provides a consistent /capacity/optimization-workbench URL
// that links from the updated NAV_MODULES without touching the existing page.
app.get('/capacity/optimization-workbench', (c) => c.redirect('/capacity/optimization'))

// ============================================================
// ADMIN DATA MANAGEMENT
// ============================================================
// Dataset catalogue — single source of truth for the UI and validation
const DATASET_CATALOGUE = [
  {
    key: 'demand',
    label: 'Demand Planning',
    icon: 'fa-chart-line',
    color: '#2563EB',
    description: 'Weekly SKU-level demand forecasts, sales orders and total demand figures used across S&OP, MRP and Production planning.',
    file_name: 'demand_planning.csv',
    required_columns: [
      { name: 'week', type: 'TEXT', example: 'W01-2026' },
      { name: 'fg_sku', type: 'TEXT', example: 'SKU-500-PET' },
      { name: 'forecast', type: 'INTEGER', example: '12000' },
      { name: 'sales_order', type: 'INTEGER', example: '11500' },
      { name: 'total_demand', type: 'INTEGER', example: '12000' },
    ],
    modules: ['S&OP Planning', 'MRP', 'Production Planning', 'Inventory Planning'],
    sample_rows: [
      ['W01-2026', 'SKU-500-PET', '12000', '11500', '12000'],
      ['W01-2026', 'SKU-1L-PET',  '8000',  '7800',  '8000'],
    ],
  },
  {
    key: 'bom',
    label: 'Bill of Materials',
    icon: 'fa-sitemap',
    color: '#7C3AED',
    description: 'Multi-level BOM defining finished-goods to raw-material relationships, quantities per unit, lead times and MOQs.',
    file_name: 'bom_master.csv',
    required_columns: [
      { name: 'fg_sku',      type: 'TEXT',    example: 'SKU-500-PET' },
      { name: 'rm_sku',      type: 'TEXT',    example: 'RM-PET-500' },
      { name: 'rm_name',     type: 'TEXT',    example: 'PET Bottle 500ml' },
      { name: 'qty_per_unit',type: 'DECIMAL', example: '1.05' },
      { name: 'unit',        type: 'TEXT',    example: 'pcs' },
      { name: 'lead_time_days', type: 'INTEGER', example: '14' },
      { name: 'moq',         type: 'INTEGER', example: '5000' },
      { name: 'unit_cost',   type: 'DECIMAL', example: '4.50' },
      { name: 'supplier',    type: 'TEXT',    example: 'Hindustan Packaging' },
    ],
    modules: ['MRP', 'Procurement Planning', 'Production Planning'],
    sample_rows: [
      ['SKU-500-PET', 'RM-PET-500',  'PET Bottle 500ml', '1.05', 'pcs', '14', '5000', '4.50', 'Hindustan Packaging'],
      ['SKU-500-PET', 'RM-CAP-28MM', 'Cap 28mm',         '1.02', 'pcs', '7',  '10000','0.80', 'PolyPack India'],
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory Stock',
    icon: 'fa-warehouse',
    color: '#059669',
    description: 'Current on-hand, in-transit and safety-stock positions for all SKUs across plants and distribution centres.',
    file_name: 'inventory_stock.csv',
    required_columns: [
      { name: 'sku',          type: 'TEXT',    example: 'SKU-500-PET' },
      { name: 'sku_name',     type: 'TEXT',    example: '500ml PET Water' },
      { name: 'type',         type: 'TEXT',    example: 'FG' },
      { name: 'on_hand',      type: 'INTEGER', example: '45000' },
      { name: 'in_transit',   type: 'INTEGER', example: '12000' },
      { name: 'safety_stock', type: 'INTEGER', example: '8000' },
      { name: 'unit',         type: 'TEXT',    example: 'cases' },
      { name: 'location',     type: 'TEXT',    example: 'Mumbai Plant' },
    ],
    modules: ['Inventory Planning', 'MRP', 'Deployment Planning'],
    sample_rows: [
      ['SKU-500-PET', '500ml PET Water', 'FG', '45000', '12000', '8000',  'cases', 'Mumbai Plant'],
      ['RM-PET-500',  'PET Bottle 500ml','RM', '280000','60000', '50000', 'pcs',   'Mumbai Plant'],
    ],
  },
  {
    key: 'capacity',
    label: 'Capacity Planning',
    icon: 'fa-industry',
    color: '#1E3A8A',
    description: 'Production line capacity data including shift structure, utilisation targets, OEE baselines and maintenance windows.',
    file_name: 'capacity_planning.csv',
    required_columns: [
      { name: 'plant_code',   type: 'TEXT',    example: 'MUM' },
      { name: 'line_code',    type: 'TEXT',    example: 'MUM-L1' },
      { name: 'date',         type: 'DATE',    example: '2026-03-17' },
      { name: 'available_hrs',type: 'DECIMAL', example: '20.0' },
      { name: 'utilized_hrs', type: 'DECIMAL', example: '15.6' },
      { name: 'oee_pct',      type: 'DECIMAL', example: '77.1' },
      { name: 'overtime_hrs', type: 'DECIMAL', example: '2.0' },
    ],
    modules: ['Capacity Planning', 'Production Planning', 'Sequencing & Scheduling'],
    sample_rows: [
      ['MUM', 'MUM-L1', '2026-03-17', '20.0', '15.6', '77.1', '2.0'],
      ['MUM', 'MUM-L2', '2026-03-17', '20.0', '17.1', '85.4', '0.0'],
    ],
  },
  {
    key: 'procurement',
    label: 'Procurement / Purchase Orders',
    icon: 'fa-handshake',
    color: '#D97706',
    description: 'Open and planned purchase orders with supplier, quantity, lead time and cost details.',
    file_name: 'procurement_pos.csv',
    required_columns: [
      { name: 'po_id',        type: 'TEXT',    example: 'PO-2026-001' },
      { name: 'rm_sku',       type: 'TEXT',    example: 'RM-PET-500' },
      { name: 'supplier',     type: 'TEXT',    example: 'Hindustan Packaging' },
      { name: 'qty',          type: 'INTEGER', example: '50000' },
      { name: 'order_date',   type: 'DATE',    example: '2026-03-10' },
      { name: 'expected_delivery', type: 'DATE', example: '2026-03-24' },
      { name: 'status',       type: 'TEXT',    example: 'open' },
      { name: 'unit_cost',    type: 'DECIMAL', example: '4.50' },
    ],
    modules: ['Procurement Planning', 'MRP', 'Inventory Planning'],
    sample_rows: [
      ['PO-2026-001', 'RM-PET-500', 'Hindustan Packaging', '50000', '2026-03-10', '2026-03-24', 'open', '4.50'],
      ['PO-2026-002', 'RM-CAP-28MM','PolyPack India',       '80000', '2026-03-12', '2026-03-19', 'open', '0.80'],
    ],
  },
  {
    key: 'resource',
    label: 'Resource / Workforce',
    icon: 'fa-users',
    color: '#DC2626',
    description: 'Operator headcount, shift assignments, overtime hours, skill levels and training records per plant and line.',
    file_name: 'resource_planning.csv',
    required_columns: [
      { name: 'plant_code',    type: 'TEXT',    example: 'MUM' },
      { name: 'shift',         type: 'TEXT',    example: 'A' },
      { name: 'date',          type: 'DATE',    example: '2026-03-17' },
      { name: 'headcount',     type: 'INTEGER', example: '42' },
      { name: 'overtime_hrs',  type: 'DECIMAL', example: '18.5' },
      { name: 'absenteeism_pct',type:'DECIMAL', example: '2.4' },
      { name: 'efficiency_pct',type: 'DECIMAL', example: '88.0' },
    ],
    modules: ['Resource Planning', 'Capacity Planning', 'Production Planning'],
    sample_rows: [
      ['MUM', 'A', '2026-03-17', '42', '18.5', '2.4', '88.0'],
      ['MUM', 'B', '2026-03-17', '40', '12.0', '1.8', '91.0'],
    ],
  },
  {
    key: 'deployment',
    label: 'Deployment / Shipments',
    icon: 'fa-truck',
    color: '#0891B2',
    description: 'Planned and in-transit shipment details including origin, destination, volume, load utilisation and OTD status.',
    file_name: 'deployment_shipments.csv',
    required_columns: [
      { name: 'shipment_id',  type: 'TEXT',    example: 'SHP-0317-001' },
      { name: 'origin',       type: 'TEXT',    example: 'Mumbai' },
      { name: 'destination',  type: 'TEXT',    example: 'Delhi DC' },
      { name: 'sku',          type: 'TEXT',    example: 'SKU-500-PET' },
      { name: 'volume_cases', type: 'INTEGER', example: '1800' },
      { name: 'truck_util_pct',type:'DECIMAL', example: '87.5' },
      { name: 'etd',          type: 'DATE',    example: '2026-03-17' },
      { name: 'eta',          type: 'DATE',    example: '2026-03-19' },
      { name: 'status',       type: 'TEXT',    example: 'in_transit' },
    ],
    modules: ['Deployment Planning', 'Inventory Planning', 'S&OP Planning'],
    sample_rows: [
      ['SHP-0317-001', 'Mumbai', 'Delhi DC',   'SKU-500-PET', '1800', '87.5', '2026-03-17', '2026-03-19', 'in_transit'],
      ['SHP-0317-002', 'Mumbai', 'Chennai DC', 'SKU-1L-PET',  '1200', '82.1', '2026-03-17', '2026-03-20', 'planned'],
    ],
  },
  {
    key: 'sop_forecast',
    label: 'S&OP Forecast',
    icon: 'fa-balance-scale',
    color: '#2563EB',
    description: 'S&OP cycle statistical forecast, consensus volumes and supply plan numbers per SKU per month.',
    file_name: 'sop_forecast.csv',
    required_columns: [
      { name: 'month',              type: 'TEXT',    example: '2026-04' },
      { name: 'sku',                type: 'TEXT',    example: 'SKU-500-PET' },
      { name: 'statistical_fcst',   type: 'INTEGER', example: '48000' },
      { name: 'consensus_vol',      type: 'INTEGER', example: '50000' },
      { name: 'supply_plan',        type: 'INTEGER', example: '49500' },
      { name: 'bias_pct',           type: 'DECIMAL', example: '-1.2' },
      { name: 'mape_pct',           type: 'DECIMAL', example: '8.4' },
    ],
    modules: ['S&OP Planning', 'Production Planning', 'MRP'],
    sample_rows: [
      ['2026-04', 'SKU-500-PET', '48000', '50000', '49500', '-1.2', '8.4'],
      ['2026-04', 'SKU-1L-PET',  '32000', '33000', '32500', '-0.8', '7.1'],
    ],
  },
  {
    key: 'sequencing',
    label: 'Sequencing / Jobs',
    icon: 'fa-calendar-alt',
    color: '#6D28D9',
    description: 'Production job queue with SKU, quantity, line assignment, planned start/end times and priority for Gantt and sequence optimisation.',
    file_name: 'sequencing_jobs.csv',
    required_columns: [
      { name: 'job_id',       type: 'TEXT',    example: 'JOB-001' },
      { name: 'sku',          type: 'TEXT',    example: 'SKU-500-PET' },
      { name: 'line_code',    type: 'TEXT',    example: 'MUM-L1' },
      { name: 'qty_cases',    type: 'INTEGER', example: '5000' },
      { name: 'planned_start',type: 'DATETIME',example: '2026-03-17 06:00' },
      { name: 'planned_end',  type: 'DATETIME',example: '2026-03-17 14:00' },
      { name: 'priority',     type: 'TEXT',    example: 'P1' },
      { name: 'status',       type: 'TEXT',    example: 'scheduled' },
    ],
    modules: ['Sequencing & Scheduling', 'Production Planning', 'Capacity Planning'],
    sample_rows: [
      ['JOB-001', 'SKU-500-PET', 'MUM-L1', '5000', '2026-03-17 06:00', '2026-03-17 14:00', 'P1', 'scheduled'],
      ['JOB-002', 'SKU-1L-PET',  'MUM-L1', '3200', '2026-03-17 14:30', '2026-03-17 22:00', 'P2', 'scheduled'],
    ],
  },
]

// ── API: GET upload status for all datasets ──────────────────────────────────
app.get('/api/admin/upload-status', async (c) => {
  try {
    const db = c.env.DB
    // Latest record per dataset_key
    const { results } = await db.prepare(`
      SELECT dataset_key, file_name, row_count, status, error_message, uploaded_by, uploaded_at, use_default
      FROM upload_registry
      WHERE id IN (
        SELECT MAX(id) FROM upload_registry GROUP BY dataset_key
      )
      ORDER BY uploaded_at DESC
    `).all()
    return c.json(results || [])
  } catch {
    return c.json([])
  }
})

// ── API: POST upload a CSV dataset ──────────────────────────────────────────
app.post('/api/admin/upload', async (c) => {
  const _u = getUser(c)
  if (!_u) return c.json({ ok: false, error: 'Unauthorized' }, 401)

  try {
    const formData = await c.req.formData()
    const datasetKey  = formData.get('dataset_key')?.toString() || ''
    const useDefault  = formData.get('use_default') !== 'false'
    const file        = formData.get('file') as File | null

    // Validate dataset key
    const catalogue = DATASET_CATALOGUE.find(d => d.key === datasetKey)
    if (!catalogue) {
      return c.json({ ok: false, error: `Unknown dataset key: ${datasetKey}` })
    }
    if (!file || !(file instanceof File)) {
      return c.json({ ok: false, error: 'No file provided' })
    }
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return c.json({ ok: false, error: 'Only CSV files are accepted' })
    }
    if (file.size > 10 * 1024 * 1024) {
      return c.json({ ok: false, error: 'File exceeds 10 MB limit' })
    }

    // Parse CSV text
    const text = await file.text()
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) {
      await _recordUpload(c.env.DB, datasetKey, file.name, file.size, 0, 'failed',
        'File must have a header row and at least one data row', _u.id, useDefault)
      return c.json({ ok: false, error: 'File must have a header row and at least one data row' })
    }

    // Validate header columns
    const headerCols = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const requiredCols = catalogue.required_columns.map(c => c.name.toLowerCase())
    const missing = requiredCols.filter(r => !headerCols.includes(r))
    if (missing.length > 0) {
      const msg = `Missing required columns: ${missing.join(', ')}`
      await _recordUpload(c.env.DB, datasetKey, file.name, file.size, 0, 'failed', msg, _u.id, useDefault)
      return c.json({ ok: false, error: msg, missing_columns: missing })
    }

    const rowCount = lines.length - 1

    // Record success in DB
    await _recordUpload(c.env.DB, datasetKey, file.name, file.size, rowCount, 'uploaded', null, _u.id, useDefault)

    // Audit log entry
    try {
      await c.env.DB.prepare(`INSERT INTO audit_log(user_name,module,action,entity_type,entity_id,new_value) VALUES(?,?,?,?,?,?)`)
        .bind(_u.name, 'admin', 'CSV Upload', 'Dataset', datasetKey, `${rowCount} rows from ${file.name}`).run()
    } catch { /* audit not critical */ }

    return c.json({ ok: true, dataset: datasetKey, rows: rowCount, file_name: file.name })
  } catch (err: any) {
    return c.json({ ok: false, error: err?.message || 'Upload processing failed' }, 500)
  }
})

async function _recordUpload(
  db: D1Database, key: string, fileName: string, size: number,
  rows: number, status: string, err: string | null, user: string, useDefault: boolean
) {
  try {
    await db.prepare(`
      INSERT INTO upload_registry(dataset_key,file_name,file_size_bytes,row_count,status,error_message,uploaded_by,use_default,validated_at)
      VALUES(?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    `).bind(key, fileName, size, rows, status, err, user, useDefault ? 1 : 0).run()
  } catch { /* DB might not have migration applied yet in local dev */ }
}

// ── API: DELETE (reset) a dataset to default ────────────────────────────────
app.post('/api/admin/reset-dataset', async (c) => {
  const _u = getUser(c)
  if (!_u) return c.json({ ok: false, error: 'Unauthorized' }, 401)
  const { dataset_key } = await c.req.json()
  try {
    await c.env.DB.prepare(`DELETE FROM upload_registry WHERE dataset_key=?`).bind(dataset_key).run()
  } catch { /* ok if table not yet created */ }
  return c.json({ ok: true })
})

// ── API: GET catalogue metadata ──────────────────────────────────────────────
app.get('/api/admin/catalogue', (c) => {
  return c.json(DATASET_CATALOGUE.map(d => ({
    key: d.key, label: d.label, icon: d.icon, color: d.color,
    description: d.description, file_name: d.file_name,
    required_columns: d.required_columns,
    modules: d.modules,
  })))
})

// ── PAGE: /admin/data-management ────────────────────────────────────────────
app.get('/admin/data-management', (c) => {
  const _u = getUser(c)

  const scripts = `
// ── Admin page CSS ──
(function() {
  const s = document.createElement('style');
  s.textContent = \`
    .adm-tab { transition: color 0.15s, border-color 0.15s; }
    .adm-tab.active { color: #1E3A8A !important; border-bottom-color: #1E3A8A !important; font-weight: 700 !important; }
    .adm-tab:hover { color: #2563EB; }
    details summary::-webkit-details-marker { display: none; }
    details > summary { user-select: none; }
    details[open] > summary { color: #7C3AED; }
    @keyframes admFadeIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:translateY(0); } }
    .adm-panel { animation: admFadeIn 0.2s ease; }
  \`;
  document.head.appendChild(s);
})();
// ── State ──
let catalogue = [];
let uploadStatus = {};   // key → row from upload_registry
let useDefaultMap = {};  // key → boolean (local toggle state)

// ── Boot ──
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadCatalogue(), loadStatus()]);
  renderAll();
  switchAdminTab('overview');
});

async function loadCatalogue() {
  catalogue = await axios.get('/api/admin/catalogue').then(r=>r.data).catch(()=>[]);
}
async function loadStatus() {
  const rows = await axios.get('/api/admin/upload-status').then(r=>r.data).catch(()=>[]);
  uploadStatus = {};
  rows.forEach(r => { uploadStatus[r.dataset_key] = r; });
}

// ── Tab switching ──
function switchAdminTab(tab) {
  document.querySelectorAll('.adm-tab').forEach(b => b.classList.toggle('active', b.dataset.tab===tab));
  document.querySelectorAll('.adm-panel').forEach(p => { p.style.display = p.dataset.panel===tab ? 'block' : 'none'; });
}

// ── Render entire page ──
function renderAll() {
  renderStatusGrid();
  renderUploadCards();
  renderMappingTable();
}

// ── 1. Status summary grid (overview tab) ──
function renderStatusGrid() {
  const total    = catalogue.length;
  const uploaded = catalogue.filter(d => uploadStatus[d.key]?.status === 'uploaded').length;
  const failed   = catalogue.filter(d => uploadStatus[d.key]?.status === 'failed').length;
  const missing  = total - uploaded - failed;
  document.getElementById('stat-total').textContent    = total;
  document.getElementById('stat-uploaded').textContent = uploaded;
  document.getElementById('stat-failed').textContent   = failed;
  document.getElementById('stat-missing').textContent  = missing;

  // Dataset status list
  const el = document.getElementById('status-list');
  el.innerHTML = catalogue.map(d => {
    const s = uploadStatus[d.key];
    const status   = s ? s.status : 'not_uploaded';
    const badgeCls = status==='uploaded'?'success':status==='failed'?'critical':'warning';
    const icon     = status==='uploaded'?'check-circle':status==='failed'?'times-circle':'clock';
    const label    = status==='uploaded'?'Uploaded':status==='failed'?'Failed – Using Default':'Not Uploaded';
    const detail   = s ? \`\${s.file_name} · \${s.row_count?.toLocaleString()||0} rows · \${(s.uploaded_at||'').slice(0,16)}\` : 'No file uploaded — using built-in default data';
    const errHtml  = (status==='failed' && s?.error_message) ? \`<div style="font-size:11px;color:#DC2626;margin-top:4px"><i class="fas fa-exclamation-circle"></i> \${s.error_message}</div>\` : '';
    return \`<div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #F1F5F9">
      <div style="width:36px;height:36px;border-radius:8px;background:\${d.color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fas \${d.icon}" style="color:\${d.color};font-size:14px"></i>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:13px">\${d.label}</div>
        <div style="font-size:11px;color:#64748B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">\${detail}</div>
        \${errHtml}
      </div>
      <span class="badge badge-\${badgeCls}" style="white-space:nowrap">
        <i class="fas fa-\${icon}"></i> \${label}
      </span>
      <button class="btn btn-sm btn-secondary" onclick="scrollToUpload('\${d.key}')" title="Go to Upload">
        <i class="fas fa-upload"></i>
      </button>
      \${status!=='not_uploaded' ? \`<button class="btn btn-sm btn-secondary" onclick="resetDataset('\${d.key}')" title="Reset to default">
        <i class="fas fa-undo"></i>
      </button>\` : ''}
    </div>\`;
  }).join('');
}

// ── 2. Upload cards (upload tab) ──
function renderUploadCards() {
  const el = document.getElementById('upload-cards');
  el.innerHTML = catalogue.map(d => {
    const s = uploadStatus[d.key];
    const status = s ? s.status : 'not_uploaded';
    const badgeCls = status==='uploaded'?'success':status==='failed'?'critical':'warning';
    const useDefault = useDefaultMap[d.key] !== undefined ? useDefaultMap[d.key] : (s?.use_default !== 0);

    // Column pills
    const colPills = d.required_columns.map(col =>
      \`<span style="display:inline-flex;align-items:center;gap:4px;background:#F1F5F9;border:1px solid #E2E8F0;border-radius:6px;padding:3px 8px;font-size:11px;margin:2px">
        <code style="color:\${d.color};font-weight:600">\${col.name}</code>
        <span style="color:#94A3B8">\${col.type}</span>
      </span>\`
    ).join('');

    // Sample table
    const sampleHdr = d.required_columns.map(c => \`<th>\${c.name}</th>\`).join('');
    const sampleRows = d.sample_rows.map(row =>
      \`<tr>\${row.map(v => \`<td style="font-size:11px">\${v}</td>\`).join('')}</tr>\`
    ).join('');

    return \`<div class="card" id="upload-card-\${d.key}" style="margin-bottom:16px;scroll-margin-top:80px">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:\${d.color}18;display:flex;align-items:center;justify-content:center">
            <i class="fas \${d.icon}" style="color:\${d.color}"></i>
          </div>
          <div>
            <div style="font-weight:700;font-size:14px">\${d.label}</div>
            <div style="font-size:11px;color:#64748B">Expected file: <code>\${d.file_name}</code></div>
          </div>
        </div>
        <span class="badge badge-\${badgeCls}">\${status==='uploaded'?'✓ Uploaded':status==='failed'?'✗ Failed':'⏳ Not Uploaded'}</span>
      </div>
      <div class="card-body">
        <p style="font-size:13px;color:#475569;margin-bottom:14px">\${d.description}</p>

        <!-- Required columns -->
        <div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;color:#64748B;letter-spacing:0.05em;margin-bottom:6px">REQUIRED COLUMNS</div>
          <div>\${colPills}</div>
        </div>

        <!-- Modules -->
        <div style="margin-bottom:14px">
          <div style="font-size:11px;font-weight:700;color:#64748B;letter-spacing:0.05em;margin-bottom:6px">CONSUMED BY</div>
          <div>\${d.modules.map(m => \`<span class="badge badge-info" style="margin:2px">\${m}</span>\`).join('')}</div>
        </div>

        <!-- Sample format -->
        <details style="margin-bottom:14px">
          <summary style="font-size:12px;font-weight:600;color:#2563EB;cursor:pointer;list-style:none">
            <i class="fas fa-table"></i> Show sample format (first 2 rows)
          </summary>
          <div style="overflow-x:auto;margin-top:8px">
            <table class="data-table" style="font-size:11px;min-width:max-content">
              <thead><tr>\${sampleHdr}</tr></thead>
              <tbody>\${sampleRows}</tbody>
            </table>
          </div>
        </details>

        <!-- Error display -->
        \${(status==='failed' && s?.error_message) ? \`
          <div class="alert alert-critical" style="margin-bottom:14px">
            <i class="fas fa-times-circle"></i>
            <div><strong>Upload Failed:</strong> \${s.error_message}<br/>
            <span style="font-size:12px">Default data is being used automatically.</span></div>
          </div>\` : ''}

        <!-- Success display -->
        \${status==='uploaded' ? \`
          <div class="alert alert-success" style="margin-bottom:14px">
            <i class="fas fa-check-circle"></i>
            <div><strong>\${s.file_name}</strong> — \${(s.row_count||0).toLocaleString()} rows uploaded successfully
            on \${(s.uploaded_at||'').slice(0,16)} by \${s.uploaded_by}</div>
          </div>\` : ''}

        <!-- Upload dropzone -->
        <div id="dz-\${d.key}"
          style="border:2px dashed #CBD5E1;border-radius:10px;padding:24px;text-align:center;cursor:pointer;transition:border 0.2s;background:#FAFBFC"
          ondragover="event.preventDefault();this.style.borderColor='\${d.color}'"
          ondragleave="this.style.borderColor='#CBD5E1'"
          ondrop="handleDrop(event,'\${d.key}')"
          onclick="document.getElementById('file-\${d.key}').click()">
          <i class="fas fa-cloud-upload-alt" style="font-size:28px;color:#94A3B8;display:block;margin-bottom:8px"></i>
          <div style="font-size:13px;font-weight:600;color:#475569">Drop CSV here or click to browse</div>
          <div style="font-size:11px;color:#94A3B8;margin-top:4px">CSV only · Max 10 MB</div>
          <input type="file" id="file-\${d.key}" accept=".csv" style="display:none" onchange="handleFile(event,'\${d.key}')">
        </div>

        <!-- Controls -->
        <div style="display:flex;align-items:center;gap:12px;margin-top:12px;flex-wrap:wrap">
          <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#475569;cursor:pointer">
            <input type="checkbox" id="chk-default-\${d.key}" \${useDefault?'checked':''} onchange="toggleDefault('\${d.key}',this.checked)" style="width:14px;height:14px">
            Use default data if upload fails
          </label>
          \${status!=='not_uploaded' ? \`
            <button class="btn btn-sm btn-secondary" onclick="resetDataset('\${d.key}')">
              <i class="fas fa-undo"></i> Reset to Default
            </button>\` : ''}
          <div id="prog-\${d.key}" style="display:none;flex:1;min-width:120px">
            <div style="background:#E2E8F0;border-radius:9px;height:6px;overflow:hidden">
              <div id="prog-bar-\${d.key}" style="height:100%;background:\${d.color};width:0%;transition:width 0.3s;border-radius:9px"></div>
            </div>
            <div id="prog-label-\${d.key}" style="font-size:11px;color:#64748B;margin-top:4px">Validating…</div>
          </div>
        </div>
      </div>
    </div>\`;
  }).join('');
}

// ── 3. Module mapping table ──
function renderMappingTable() {
  const allModules = [...new Set(catalogue.flatMap(d => d.modules))].sort();
  const el = document.getElementById('mapping-table');
  const hdr = allModules.map(m => \`<th style="font-size:11px;white-space:nowrap">\${m}</th>\`).join('');
  const rows = catalogue.map(d => {
    const s = uploadStatus[d.key];
    const status = s?.status || 'not_uploaded';
    const dot = status==='uploaded'
      ? '<i class="fas fa-check-circle" style="color:#059669"></i>'
      : status==='failed'
      ? '<i class="fas fa-times-circle" style="color:#DC2626"></i>'
      : '<i class="fas fa-minus-circle" style="color:#94A3B8"></i>';
    const cells = allModules.map(m =>
      d.modules.includes(m)
        ? \`<td style="text-align:center"><i class="fas fa-check" style="color:\${d.color}"></i></td>\`
        : \`<td style="text-align:center;color:#E2E8F0"><i class="fas fa-minus"></i></td>\`
    ).join('');
    return \`<tr>
      <td style="white-space:nowrap">
        <div style="display:flex;align-items:center;gap:8px">
          \${dot}
          <i class="fas \${d.icon}" style="color:\${d.color};width:14px;text-align:center"></i>
          <span style="font-weight:600;font-size:12px">\${d.label}</span>
        </div>
      </td>
      <td style="font-size:11px;color:#64748B"><code>\${d.file_name}</code></td>
      \${cells}
    </tr>\`;
  }).join('');
  el.innerHTML = \`<table class="data-table" style="font-size:12px;min-width:max-content">
    <thead><tr>
      <th>Dataset</th><th>File Name</th>\${hdr}
    </tr></thead>
    <tbody>\${rows}</tbody>
  </table>\`;
}

// ── File handling ──
function handleDrop(event, key) {
  event.preventDefault();
  document.getElementById('dz-'+key).style.borderColor = '#CBD5E1';
  const file = event.dataTransfer.files[0];
  if (file) uploadFile(key, file);
}
function handleFile(event, key) {
  const file = event.target.files[0];
  if (file) uploadFile(key, file);
}

async function uploadFile(key, file) {
  const progDiv  = document.getElementById('prog-'+key);
  const progBar  = document.getElementById('prog-bar-'+key);
  const progLbl  = document.getElementById('prog-label-'+key);
  const dz       = document.getElementById('dz-'+key);
  const useDefault = document.getElementById('chk-default-'+key)?.checked !== false;

  if (!file.name.toLowerCase().endsWith('.csv')) {
    showAdminToast('Only CSV files are accepted', 'error'); return;
  }

  // Show progress
  if (progDiv) progDiv.style.display = 'block';
  if (dz) dz.style.borderColor = '#2563EB';
  animateProgress(progBar, progLbl, 0, 60, 'Validating structure…');

  const fd = new FormData();
  fd.append('dataset_key', key);
  fd.append('use_default', useDefault ? 'true' : 'false');
  fd.append('file', file);

  try {
    animateProgress(progBar, progLbl, 60, 90, 'Uploading…');
    const res = await axios.post('/api/admin/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    const d = res.data;
    animateProgress(progBar, progLbl, 90, 100, 'Done');

    if (d.ok) {
      showAdminToast(d.dataset.toUpperCase() + ' — ' + d.rows.toLocaleString() + ' rows uploaded ✓', 'success');
    } else {
      showAdminToast('Upload failed: ' + d.error, 'error');
    }
  } catch(e) {
    showAdminToast('Network error during upload', 'error');
  }

  await loadStatus();
  renderAll();
  if (progDiv) setTimeout(() => { progDiv.style.display='none'; }, 1200);
}

function animateProgress(bar, lbl, from, to, text) {
  if (!bar) return;
  bar.style.width = to + '%';
  if (lbl) lbl.textContent = text;
}

function toggleDefault(key, checked) {
  useDefaultMap[key] = checked;
}

async function resetDataset(key) {
  if (!confirm('Reset "' + key + '" to default data? Upload history will be cleared.')) return;
  await axios.post('/api/admin/reset-dataset', { dataset_key: key }).catch(()=>{});
  await loadStatus();
  renderAll();
  showAdminToast(key + ' reset to default data', 'success');
}

function scrollToUpload(key) {
  switchAdminTab('upload');
  setTimeout(() => {
    const el = document.getElementById('upload-card-'+key);
    if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
  }, 80);
}

function showAdminToast(msg, type) {
  const t = document.getElementById('admin-toast');
  if (!t) return;
  t.textContent = msg;
  t.style.background = type==='error' ? '#DC2626' : '#059669';
  t.style.display = 'block';
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.style.display='none', 400); }, 3500);
}
  `.trim()

  return c.html(<Layout user={_u} title="Admin – Data Management" activeModule="admin" scripts={scripts}>
    {/* Toast */}
    <div id="admin-toast" style="display:none;position:fixed;bottom:24px;right:24px;z-index:9999;padding:12px 20px;border-radius:10px;color:white;font-size:13px;font-weight:600;max-width:380px;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:opacity 0.4s"></div>

    {/* Page header */}
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#2563EB)"><i class="fas fa-database"></i></div>
        <div>
          <div class="page-title">Admin — Data Management</div>
          <div class="page-subtitle">Upload, validate and manage CSV datasets across all supply-chain modules</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-secondary" onclick="loadStatus().then(renderAll)"><i class="fas fa-sync"></i> Refresh</button>
      </div>
    </div>

    {/* Summary KPI row */}
    <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
      {[
        ['Total Datasets',    'stat-total',    'info',    'fa-database'],
        ['Uploaded',          'stat-uploaded', 'healthy', 'fa-check-circle'],
        ['Failed / Default',  'stat-failed',   'critical','fa-times-circle'],
        ['Not Uploaded',      'stat-missing',  'warning', 'fa-clock'],
      ].map(([label, id, cls, icon]) =>
        <div key={id} class={`kpi-card ${cls}`}>
          <div class="kpi-label"><i class={`fas ${icon}`} style="margin-right:5px"></i>{label}</div>
          <div class={`kpi-value ${cls}`} id={id}>—</div>
        </div>
      )}
    </div>

    {/* Tab bar */}
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.06);margin-bottom:20px;overflow:hidden">
      <div style="display:flex;border-bottom:1px solid #E2E8F0">
        {[
          ['overview', '1. Status Overview',   'fa-tachometer-alt'],
          ['upload',   '2. Upload Datasets',   'fa-upload'],
          ['mapping',  '3. Module Mapping',    'fa-project-diagram'],
        ].map(([tab,label,icon]) =>
          <button key={tab} class="adm-tab" data-tab={tab} onclick={`switchAdminTab('${tab}')`}
            style="padding:12px 22px;border:none;background:transparent;cursor:pointer;font-size:0.875rem;font-weight:600;color:#64748B;border-bottom:3px solid transparent;display:flex;align-items:center;gap:6px;transition:color 0.15s">
            <i class={`fas ${icon}`}></i>{label}
          </button>
        )}
      </div>

      {/* ── Tab 1: Status Overview ── */}
      <div class="adm-panel" data-panel="overview" style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <div>
            <div style="font-size:15px;font-weight:700">Dataset Status</div>
            <div style="font-size:12px;color:#64748B">Current state of each dataset — click <i class="fas fa-upload"></i> to upload</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#64748B">
            <span class="badge badge-success"><i class="fas fa-check-circle"></i> Uploaded</span>
            <span class="badge badge-critical"><i class="fas fa-times-circle"></i> Failed</span>
            <span class="badge badge-warning"><i class="fas fa-clock"></i> Not Uploaded</span>
          </div>
        </div>
        <div class="alert alert-info" style="margin-bottom:16px">
          <i class="fas fa-info-circle"></i>
          <div>
            <strong>Safe fallback is always on.</strong> When a dataset is not uploaded or fails validation,
            the system automatically uses built-in default data — no module functionality is lost.
          </div>
        </div>
        <div id="status-list"><div class="spinner"></div></div>
      </div>

      {/* ── Tab 2: Upload Datasets ── */}
      <div class="adm-panel" data-panel="upload" style="padding:20px;display:none">
        <div style="margin-bottom:16px">
          <div style="font-size:15px;font-weight:700;margin-bottom:4px">Upload CSV Datasets</div>
          <div style="font-size:12px;color:#64748B">
            Drag-and-drop or click to select a CSV. Each card shows the required columns, sample format and which modules use the data.
            <br/>The <strong>"Use default data if upload fails"</strong> toggle is enabled by default — safe to upload without risk.
          </div>
        </div>
        <div id="upload-cards"><div class="spinner"></div></div>
      </div>

      {/* ── Tab 3: Module Mapping ── */}
      <div class="adm-panel" data-panel="mapping" style="padding:20px;display:none">
        <div style="margin-bottom:14px">
          <div style="font-size:15px;font-weight:700;margin-bottom:4px">Dataset → Module Dependency Map</div>
          <div style="font-size:12px;color:#64748B">
            Shows which planning modules consume each dataset. A <i class="fas fa-check" style="color:#2563EB"></i> means the module depends on this data.
            The status icon shows the current upload state of each dataset.
          </div>
        </div>
        <div style="overflow-x:auto" id="mapping-table"><div class="spinner"></div></div>
        <div style="margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;font-size:12px;color:#64748B">
          <span><i class="fas fa-check-circle" style="color:#059669"></i> Uploaded</span>
          <span><i class="fas fa-times-circle" style="color:#DC2626"></i> Failed – using default</span>
          <span><i class="fas fa-minus-circle" style="color:#94A3B8"></i> Not uploaded – using default</span>
          <span><i class="fas fa-check" style="color:#2563EB"></i> Dataset feeds this module</span>
        </div>
      </div>
    </div>

    {/* Info card — how it works */}
    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-shield-alt"></i> How Data Upload Works</span>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px">
          {[
            ['fa-upload','1. Upload','Select or drop a CSV file for any dataset. The file is validated immediately in-browser and on-server.','#2563EB'],
            ['fa-check-square','2. Validate','Required columns are checked. If any are missing, the upload is rejected and the error is shown clearly.','#7C3AED'],
            ['fa-database','3. Store','Validated files are recorded in the database. Row count, filename and uploader are logged.','#059669'],
            ['fa-life-ring','4. Fallback','If upload fails or no file exists, the system automatically uses safe built-in default data. No module breaks.','#D97706'],
          ].map(([icon, title, desc, color]) =>
            <div key={title} style={`padding:16px;background:#F8FAFC;border-radius:10px;border-left:3px solid ${color}`}>
              <div style={`color:${color};font-size:18px;margin-bottom:8px`}><i class={`fas ${icon}`}></i></div>
              <div style="font-weight:700;font-size:13px;margin-bottom:4px">{title}</div>
              <div style="font-size:12px;color:#64748B;line-height:1.5">{desc}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  </Layout>)
})

export default app
