import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'

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
  { id: 'sop', label: 'S&OP Planning', icon: 'fa-balance-scale', path: '/sop',
    subs: [
      { id: 'sop-executive', label: 'Executive Dashboard', icon: 'fa-chart-pie', path: '/sop/executive' },
      { id: 'sop-demand', label: 'Demand Review', icon: 'fa-chart-line', path: '/sop/demand-review' },
      { id: 'sop-supply', label: 'Supply Review', icon: 'fa-industry', path: '/sop/supply-review' },
      { id: 'sop-scenarios', label: 'Scenarios', icon: 'fa-sitemap', path: '/sop/scenarios' },
      { id: 'sop-consensus', label: 'Consensus Meeting', icon: 'fa-users', path: '/sop/consensus' },
      { id: 'sop-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/sop/analytics' },
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
    ]
  },
  { id: 'procurement', label: 'Procurement Planning', icon: 'fa-handshake', path: '/procurement',
    subs: [
      { id: 'proc-workbench', label: 'PO Workbench', icon: 'fa-clipboard-list', path: '/procurement/operational' },
      { id: 'proc-suppliers', label: 'Supplier Scorecard', icon: 'fa-star', path: '/procurement/suppliers' },
      { id: 'proc-contracts', label: 'Contracts', icon: 'fa-file-contract', path: '/procurement/contracts' },
      { id: 'proc-optimization', label: 'Optimization', icon: 'fa-sliders-h', path: '/procurement/optimization' },
      { id: 'proc-analytics', label: 'Spend Analytics', icon: 'fa-chart-bar', path: '/procurement/analytics' },
    ]
  },
  { id: 'production', label: 'Production Planning', icon: 'fa-cogs', path: '/production',
    subs: [
      { id: 'prod-mps', label: 'Master Production Schedule', icon: 'fa-calendar-check', path: '/production/mps' },
      { id: 'prod-atp', label: 'Available-to-Promise', icon: 'fa-check-double', path: '/production/atp' },
      { id: 'prod-rccp', label: 'Rough-Cut Capacity', icon: 'fa-ruler-combined', path: '/production/rccp' },
      { id: 'prod-workbench', label: 'Planner Workbench', icon: 'fa-drafting-compass', path: '/production/workbench' },
      { id: 'prod-scenarios', label: 'Scenario Manager', icon: 'fa-layer-group', path: '/production/scenarios' },
      { id: 'prod-mlmodels', label: 'ML Models', icon: 'fa-brain', path: '/production/ml-models' },
      { id: 'prod-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/production/analytics' },
      { id: 'prod-copilot', label: 'AI Copilot', icon: 'fa-robot', path: '/production/copilot' },
    ]
  },
  { id: 'capacity', label: 'Capacity Planning', icon: 'fa-industry', path: '/capacity',
    subs: [
      { id: 'capacity-executive', label: 'Executive Dashboard', icon: 'fa-chart-pie', path: '/capacity/executive' },
      { id: 'capacity-operations', label: 'Operations Center', icon: 'fa-tachometer-alt', path: '/capacity/operations' },
      { id: 'capacity-optimization', label: 'Optimization', icon: 'fa-sliders-h', path: '/capacity/optimization' },
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
      { id: 'seq-scenarios', label: 'Scenario Modeling', icon: 'fa-layer-group', path: '/sequencing/scenarios' },
      { id: 'seq-analytics', label: 'Health & Analytics', icon: 'fa-heartbeat', path: '/sequencing/analytics' },
      { id: 'seq-copilot', label: 'AI Copilot', icon: 'fa-robot', path: '/sequencing/copilot' },
    ]
  },
  { id: 'resource', label: 'Resource Planning', icon: 'fa-users', path: '/resource',
    subs: [
      { id: 'res-executive', label: 'Executive View', icon: 'fa-chart-pie', path: '/resource/executive' },
      { id: 'res-operations', label: 'Operations Center', icon: 'fa-tachometer-alt', path: '/resource/operations' },
      { id: 'res-skills', label: 'Skills & Roster', icon: 'fa-id-badge', path: '/resource/skills' },
      { id: 'res-optimization', label: 'Optimization', icon: 'fa-sliders-h', path: '/resource/optimization' },
      { id: 'res-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/resource/analytics' },
    ]
  },
  { id: 'inventory', label: 'Inventory Planning', icon: 'fa-warehouse', path: '/inventory',
    subs: [
      { id: 'inv-executive', label: 'Executive View', icon: 'fa-chart-pie', path: '/inventory/executive' },
      { id: 'inv-operations', label: 'Stock Positions', icon: 'fa-tachometer-alt', path: '/inventory/operations' },
      { id: 'inv-optimization', label: 'Replenishment', icon: 'fa-sync-alt', path: '/inventory/optimization' },
      { id: 'inv-scenarios', label: 'Scenarios', icon: 'fa-sitemap', path: '/inventory/scenarios' },
      { id: 'inv-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/inventory/analytics' },
      { id: 'inv-master', label: 'Master Data', icon: 'fa-database', path: '/inventory/master' },
    ]
  },
  { id: 'deployment', label: 'Deployment Planning', icon: 'fa-truck', path: '/deployment',
    subs: [
      { id: 'dep-network', label: 'Distribution Network', icon: 'fa-project-diagram', path: '/deployment/network' },
      { id: 'dep-workbench', label: 'Planner Workbench', icon: 'fa-drafting-compass', path: '/deployment/workbench' },
      { id: 'dep-route', label: 'Route Optimization', icon: 'fa-route', path: '/deployment/routes' },
      { id: 'dep-load', label: 'Load Planning', icon: 'fa-boxes', path: '/deployment/load-planning' },
      { id: 'dep-carrier', label: 'Carrier Selection', icon: 'fa-shipping-fast', path: '/deployment/carriers' },
      { id: 'dep-scenarios', label: 'Scenario Manager', icon: 'fa-layer-group', path: '/deployment/scenarios' },
      { id: 'dep-mlmodels', label: 'ML Models', icon: 'fa-brain', path: '/deployment/ml-models' },
      { id: 'dep-analytics', label: 'Analytics', icon: 'fa-chart-bar', path: '/deployment/analytics' },
    ]
  },
]

function isModuleActive(activeModule: string, moduleId: string): boolean {
  return activeModule === moduleId || activeModule.startsWith(moduleId + '-') || activeModule.startsWith(moduleId.replace('-',''))
}

const Layout = ({ title, activeModule = 'home', scripts = '', children }: {
  title: string, activeModule?: string, scripts?: string, children: any
}) => {
  const activeTopModule = NAV_MODULES.find(m => isModuleActive(activeModule, m.id))
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
              <span class="header-greeting">Welcome, <strong>Sankar &amp; Vikrant</strong></span>
              <button class="header-btn" title="Notifications" id="notifBtn">
                <i class="fas fa-bell"></i>
                <span class="notif-badge" id="notifCount">5</span>
              </button>
              <button class="header-btn" title="Settings"><i class="fas fa-cog"></i></button>
              <div class="header-avatar" title="Sankar Iyer">SI</div>
            </div>
          </header>

          <aside class="app-sidebar">
            <div class="sidebar-section">Navigation</div>
            <a href="/" class={`nav-item ${activeModule === 'home' ? 'active' : ''}`}>
              <i class="fas fa-home"></i> Home Dashboard
            </a>
            <div class="sidebar-section">Planning Modules</div>
            {NAV_MODULES.map(mod => {
              const topActive = isModuleActive(activeModule, mod.id)
              return (
                <div key={mod.id}>
                  <a href={mod.path} class={`nav-item ${topActive ? 'active' : ''}`}>
                    <i class={`fas ${mod.icon}`}></i> {mod.label}
                  </a>
                  {topActive && (
                    <div class="nav-submenu">
                      {mod.subs.map(sub => (
                        <a key={sub.id} href={sub.path} class={`nav-sub-item ${activeModule === sub.id ? 'active' : ''}`}>
                          <i class={`fas ${sub.icon}`}></i> {sub.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <div class="sidebar-section" style="margin-top:16px">Quick Links</div>
            <a href="/action-items" class={`nav-item ${activeModule === 'actions' ? 'active' : ''}`}>
              <i class="fas fa-tasks"></i> Action Items
            </a>
            <a href="/audit-log" class={`nav-item ${activeModule === 'audit' ? 'active' : ''}`}>
              <i class="fas fa-history"></i> Audit Log
            </a>
          </aside>

          <main class="app-main">
            {children}
          </main>
        </div>
        {scripts && <script dangerouslySetInnerHTML={{ __html: scripts }}></script>}
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
app.get('/api/dashboard/health', async (c) => {
  try {
    const db = c.env.DB
    const util = await db.prepare('SELECT AVG(utilization_pct) as avg FROM capacity_utilization WHERE date >= date("now","-7 days")').first<{avg:number}>()
    const kpi = await db.prepare('SELECT AVG(metric_value) as avg FROM cap_kpi_metrics WHERE metric_category="utilization"').first<{avg:number}>()
    const alerts = await db.prepare('SELECT COUNT(*) as cnt FROM mrp_alerts WHERE status="open" AND severity IN ("critical","high")').first<{cnt:number}>()
    const bns = await db.prepare('SELECT COUNT(*) as cnt FROM bottlenecks WHERE resolved_at IS NULL AND severity="critical"').first<{cnt:number}>()
    const capScore = Math.min(100, Math.max(0, Math.round((util?.avg || 72))))
    return c.json({
      capacity: { score: capScore, status: capScore > 85 ? 'critical' : capScore > 70 ? 'warning' : 'healthy', issues: bns?.cnt || 2 },
      sequencing: { score: 78, status: 'warning', issues: 3 },
      mrp: { score: 65, status: 'warning', issues: alerts?.cnt || 4 },
      inventory: { score: 82, status: 'warning', issues: 2 },
      procurement: { score: 71, status: 'warning', issues: 3 },
      resource: { score: 76, status: 'warning', issues: 2 },
      sop: { score: 88, status: 'healthy', issues: 1 },
    })
  } catch {
    return c.json({
      capacity: { score: 72, status: 'warning', issues: 2 }, sequencing: { score: 78, status: 'warning', issues: 3 },
      mrp: { score: 65, status: 'warning', issues: 4 }, inventory: { score: 82, status: 'warning', issues: 2 },
      procurement: { score: 71, status: 'warning', issues: 3 }, resource: { score: 76, status: 'warning', issues: 2 },
      sop: { score: 88, status: 'healthy', issues: 1 },
    })
  }
})

// Capacity KPIs
app.get('/api/capacity/kpis', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM cap_kpi_metrics ORDER BY id').all()
    return c.json(results)
  } catch {
    return c.json([
      { metric_name:'Overall Line Utilization', metric_value:72.4, metric_unit:'%', metric_status:'warning', target_value:80 },
      { metric_name:'Peak Line Utilization', metric_value:96.8, metric_unit:'%', metric_status:'critical', target_value:90 },
      { metric_name:'Order Fill Rate', metric_value:94.8, metric_unit:'%', metric_status:'warning', target_value:98 },
      { metric_name:'OTIF Service Level', metric_value:92.1, metric_unit:'%', metric_status:'warning', target_value:95 },
      { metric_name:'OEE', metric_value:71.8, metric_unit:'%', metric_status:'warning', target_value:75 },
      { metric_name:'Bottleneck Lines', metric_value:3, metric_unit:'count', metric_status:'warning', target_value:1 },
    ])
  }
})

// Capacity utilization trend
app.get('/api/capacity/utilization', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT date, ROUND(AVG(utilization_pct),1) as avg_util, SUM(overtime_hours) as total_ot
      FROM capacity_utilization WHERE date >= date('now','-14 days')
      GROUP BY date ORDER BY date
    `).all()
    return c.json(results)
  } catch {
    const data = []; const now = new Date('2026-02-25')
    for(let i=6;i>=0;i--){ const d=new Date(now); d.setDate(d.getDate()-i); data.push({ date:d.toISOString().split('T')[0], avg_util:65+Math.random()*25, total_ot:Math.random()*3 }) }
    return c.json(data)
  }
})

// Capacity bottlenecks
app.get('/api/capacity/bottlenecks', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*, pl.line_name, pl.line_code, p.plant_name
      FROM bottlenecks b JOIN production_lines pl ON b.line_id=pl.id JOIN plants p ON pl.plant_id=p.id
      WHERE b.resolved_at IS NULL ORDER BY CASE b.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Capacity plants
app.get('/api/capacity/plants', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.*, COUNT(pl.id) as line_count, ROUND(AVG(cu.utilization_pct),1) as avg_util
      FROM plants p LEFT JOIN production_lines pl ON p.id=pl.plant_id LEFT JOIN capacity_utilization cu ON cu.plant_id=p.id AND cu.date>=date('now','-7 days')
      WHERE p.status='active' GROUP BY p.id ORDER BY p.plant_name
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Capacity OEE
app.get('/api/capacity/oee', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT o.*, pl.line_name, pl.line_code, p.plant_name
      FROM oee_data o JOIN production_lines pl ON o.line_id=pl.id JOIN plants p ON pl.plant_id=p.id
      WHERE o.date >= date('now','-7 days') ORDER BY o.date DESC, o.line_id
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Jobs (Sequencing)
app.get('/api/sequencing/jobs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT j.*, s.sku_name, s.sku_code, pl.line_name, pl.line_code, p.plant_name
      FROM jobs j JOIN skus s ON j.sku_id=s.id LEFT JOIN production_lines pl ON j.assigned_line_id=pl.id LEFT JOIN plants p ON pl.plant_id=p.id
      ORDER BY CASE j.status WHEN 'in_progress' THEN 1 WHEN 'scheduled' THEN 2 WHEN 'pending' THEN 3 ELSE 4 END, j.priority
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
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
app.get('/api/sequencing/setup-matrix', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sm.*, s1.sku_name as from_sku, s2.sku_name as to_sku
      FROM setup_matrix sm JOIN skus s1 ON sm.from_sku_id=s1.id JOIN skus s2 ON sm.to_sku_id=s2.id
      ORDER BY sm.from_sku_id, sm.to_sku_id
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
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
app.get('/api/mrp/alerts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT ma.*, s.sku_name, rm.material_name
      FROM mrp_alerts ma LEFT JOIN skus s ON ma.sku_id=s.id LEFT JOIN raw_materials rm ON ma.material_id=rm.id
      WHERE ma.status='open' ORDER BY CASE ma.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Raw materials
app.get('/api/mrp/materials', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM raw_materials ORDER BY abc_classification, material_name').all()
    return c.json(results)
  } catch { return c.json([]) }
})

// BOM
app.get('/api/mrp/bom', async (c) => {
  try {
    const skuId = c.req.query('sku_id')
    const query = skuId
      ? 'SELECT b.*, s.sku_name, rm.material_name, rm.material_code, rm.unit_of_measure, rm.current_stock, rm.reorder_point FROM bom b JOIN skus s ON b.sku_id=s.id JOIN raw_materials rm ON b.material_id=rm.id WHERE b.sku_id=? ORDER BY rm.abc_classification'
      : 'SELECT b.*, s.sku_name, rm.material_name, rm.material_code, rm.unit_of_measure, rm.current_stock, rm.reorder_point FROM bom b JOIN skus s ON b.sku_id=s.id JOIN raw_materials rm ON b.material_id=rm.id ORDER BY s.sku_code, rm.abc_classification'
    const { results } = skuId ? await c.env.DB.prepare(query).bind(parseInt(skuId)).all() : await c.env.DB.prepare(query).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// MRP Explosion (simulated)
app.get('/api/mrp/explosion', async (c) => {
  try {
    const { results: jobs } = await c.env.DB.prepare(`
      SELECT j.*, s.sku_name FROM jobs j JOIN skus s ON j.sku_id=s.id WHERE j.status IN ('scheduled','pending') ORDER BY j.due_date LIMIT 10
    `).all() as { results: any[] }
    const explosion: any[] = []
    for (const job of jobs.slice(0,5)) {
      const { results: bomItems } = await c.env.DB.prepare(`
        SELECT b.*, rm.material_name, rm.material_code, rm.current_stock, rm.lead_time_days
        FROM bom b JOIN raw_materials rm ON b.material_id=rm.id WHERE b.sku_id=?
      `).bind(job.sku_id).all() as { results: any[] }
      for (const item of bomItems) {
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
    return c.json(explosion)
  } catch { return c.json([]) }
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
app.get('/api/inventory/stock', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sp.*, s.sku_name, s.sku_code, s.abc_classification, s.category, p.plant_name
      FROM stock_positions sp JOIN skus s ON sp.sku_id=s.id JOIN plants p ON sp.plant_id=p.id
      ORDER BY s.abc_classification, s.sku_name
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
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
app.get('/api/procurement/suppliers', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM suppliers ORDER BY rating DESC').all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Procurement plans
app.get('/api/procurement/plans', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT pp.*, rm.material_name, rm.material_code, s.name as supplier_name
      FROM procurement_plans pp JOIN raw_materials rm ON pp.material_id=rm.id JOIN suppliers s ON pp.supplier_id=s.id
      ORDER BY pp.status, pp.period
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
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
app.get('/api/resource/capacity', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT rc.*, p.plant_name, pl.line_name, pl.line_code
      FROM resource_capacity rc JOIN plants p ON rc.plant_id=p.id JOIN production_lines pl ON rc.line_id=pl.id
      ORDER BY rc.capacity_date DESC, p.plant_name
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Operator skills
app.get('/api/resource/operators', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT os.*, p.plant_name, pl.line_name
      FROM operator_skills os LEFT JOIN plants p ON os.plant_id=p.id LEFT JOIN production_lines pl ON os.line_id=pl.id
      ORDER BY p.plant_name, os.operator_name
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// S&OP KPIs
app.get('/api/sop/kpis', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM sop_kpis ORDER BY category, name').all()
    return c.json(results)
  } catch { return c.json([]) }
})

// S&OP Demand forecast
app.get('/api/sop/forecast', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT df.*, s.sku_name, s.category FROM demand_forecast df JOIN skus s ON df.sku_id=s.id
      WHERE df.location='All India' ORDER BY df.period, s.sku_name
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// S&OP Scenarios
app.get('/api/sop/scenarios', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM scenarios WHERE module='sop' ORDER BY is_baseline DESC, status").all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Recommendations
app.get('/api/recommendations', async (c) => {
  const module = c.req.query('module')
  try {
    const query = module
      ? 'SELECT * FROM recommendations WHERE module=? ORDER BY CASE impact WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, status'
      : 'SELECT * FROM recommendations ORDER BY CASE impact WHEN "critical" THEN 1 WHEN "high" THEN 2 WHEN "medium" THEN 3 ELSE 4 END, status'
    const { results } = module ? await c.env.DB.prepare(query).bind(module).all() : await c.env.DB.prepare(query).all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Action Items
app.get('/api/action-items', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM action_items ORDER BY CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END, due_date
    `).all()
    return c.json(results)
  } catch { return c.json([]) }
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
app.get('/api/skus', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM skus WHERE status="active" ORDER BY abc_classification, sku_name').all()
    return c.json(results)
  } catch { return c.json([]) }
})

// Audit log
app.get('/api/audit-log', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 50').all()
    return c.json(results)
  } catch { return c.json([]) }
})

// ============================================================
// PAGE ROUTES - HOME
// ============================================================
app.get('/', async (c) => {
  const scripts = `
const MODULE_CONFIG = {
  capacity: { label:'Capacity Planning', icon:'fa-industry', color:'#1E3A8A', kpi1:'Line Utilization', kpi2:'Peak Util', url:'/capacity' },
  sequencing: { label:'Sequencing & Scheduling', icon:'fa-calendar-alt', color:'#7C3AED', kpi1:'OTD Performance', kpi2:'Changeover Loss', url:'/sequencing' },
  mrp: { label:'Material Req. Planning', icon:'fa-boxes', color:'#0891B2', kpi1:'Open Alerts', kpi2:'Coverage Days', url:'/mrp' },
  inventory: { label:'Inventory Planning', icon:'fa-warehouse', color:'#059669', kpi1:'Avg DOI', kpi2:'Stockout Risk', url:'/inventory' },
  procurement: { label:'Procurement Planning', icon:'fa-handshake', color:'#D97706', kpi1:'Supplier OTIF', kpi2:'High Risk Sup.', url:'/procurement' },
  resource: { label:'Resource Planning', icon:'fa-users', color:'#DC2626', kpi1:'Resource Util', kpi2:'OT Hours', url:'/resource' },
  sop: { label:'S&OP Planning', icon:'fa-balance-scale', color:'#2563EB', kpi1:'Forecast Accuracy', kpi2:'Supply Fill Rate', url:'/sop' },
};
const KPI_DATA = {
  capacity: { kpi1:'72.4%', kpi2:'96.8%' },
  sequencing: { kpi1:'91.2%', kpi2:'18.4 hrs' },
  mrp: { kpi1:'6 open', kpi2:'21 days' },
  inventory: { kpi1:'14.8 days', kpi2:'1 SKU' },
  procurement: { kpi1:'87.4%', kpi2:'2 sup.' },
  resource: { kpi1:'79.8%', kpi2:'142 hrs' },
  sop: { kpi1:'87.3%', kpi2:'94.1%' },
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
      const h = health[id] || { score:75, status:'warning', issues:2 };
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
    if (healthCtx && Object.keys(health).length) {
      const moduleLabels = ['Capacity','Sequencing','MRP','Inventory','Procurement','Resource','S&OP'];
      const moduleKeys = ['capacity','sequencing','mrp','inventory','procurement','resource','sop'];
      const scores = moduleKeys.map(k => health[k]?.score || 70);
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
          scales:{r:{min:0,max:100,ticks:{stepSize:20,font:{size:10}},pointLabels:{font:{size:11}}}},
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

  return c.html(<Layout title="Home Dashboard" activeModule="home" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#1E3A8A,#3B82F6)"><i class="fas fa-home"></i></div>
        <div>
          <div class="page-title">Supply Chain Intelligence Dashboard</div>
          <div class="page-subtitle">Real-time visibility across all planning modules · Sankar Iyer & Vikrant Nair</div>
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
          {[1,2,3,4,5,6,7].map(i => <div key={i} class="card" style="padding:40px;text-align:center"><div class="spinner"></div></div>)}
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

  return c.html(<Layout title="Capacity Planning" activeModule="capacity" scripts={scripts}>
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
  return c.html(<Layout title="Capacity – Executive" activeModule="capacity-executive" scripts={scripts}>
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
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export PDF</button>
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
      <td><button class="btn btn-sm btn-secondary">Resolve</button></td>
    </tr>\`).join('') || '<tr><td colspan="5" style="text-align:center">No bottlenecks</td></tr>';
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
  return c.html(<Layout title="Capacity – Operations" activeModule="capacity-operations" scripts={scripts}>
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
  } catch(e) { alert('Optimization failed'); }
  btn.innerHTML = '<i class="fas fa-rocket"></i> Run Optimization';
  btn.disabled = false;
}
document.addEventListener('DOMContentLoaded', () => switchTab('objectives'));
  `.trim()
  return c.html(<Layout title="Capacity – Optimization" activeModule="capacity-optimization" scripts={scripts}>
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
      {[['objectives','Objectives'],['constraints','Constraints'],['results','Results']].map(([id,label]) =>
        <button key={id} class="tab-btn" data-tab={id} onclick={`switchTab('${id}')`}>{label}</button>
      )}
    </div>
    <div class="tab-content" id="tab-objectives">
      <div class="card"><div class="card-body">
        <h3 style="margin-bottom:16px;font-size:15px">Select Optimization Objectives</h3>
        {[['Max Line Utilization','Maximize production throughput across all lines'],['Minimize Bottleneck Risk','Reduce lines above 90% threshold'],['Optimize OEE','Improve availability, performance and quality'],['Minimize Overtime Cost','Reduce overtime hours and associated costs'],['Maximize OTD','Prioritize on-time delivery over cost']].map(([label, desc], i) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px">
            <input type="checkbox" defaultChecked={i < 2} style="width:16px;height:16px" />
            <div><strong style="font-size:13px">{label}</strong><div style="font-size:12px;color:#64748B">{desc}</div></div>
            <select class="form-input form-select" style="width:120px;margin-left:auto">
              <option>High Priority</option><option>Medium Priority</option><option>Low Priority</option>
            </select>
          </div>
        )}
      </div></div>
    </div>
    <div class="tab-content" id="tab-constraints">
      <div class="card"><div class="card-body">
        <h3 style="margin-bottom:16px;font-size:15px">Optimization Constraints</h3>
        {[['Max Line Utilization','90','%'],['Min Safety Buffer','10','%'],['Overtime Cap','40','hrs/week'],['Min Batch Size','5000','cases'],['Changeover Window','Weekends Only','']].map(([label, val, unit]) =>
          <div key={label} style="display:flex;align-items:center;gap:12px;padding:10px;border-bottom:1px solid var(--border)">
            <span style="flex:1;font-size:13px">{label}</span>
            <input type="text" class="form-input" style="width:120px" defaultValue={val} />
            <span style="font-size:12px;color:#64748B;width:60px">{unit}</span>
          </div>
        )}
      </div></div>
    </div>
    <div class="tab-content" id="tab-results">
      <div id="opt-results"><div class="alert alert-info"><i class="fas fa-info-circle"></i><div>Run the optimization engine to see results here.</div></div></div>
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
        <button class="btn btn-sm btn-primary">View Details</button>
        <button class="btn btn-sm btn-secondary">Compare</button>
        \${!s.is_baseline ? '<button class="btn btn-sm btn-success">Set as Active</button>' : ''}
      </div>
    </div>
  </div>\`).join('') || '<p class="text-muted">No scenarios yet</p>';
}
async function createScenario() {
  const name = document.getElementById('sc-name').value;
  const desc = document.getElementById('sc-desc').value;
  if (!name) return alert('Enter scenario name');
  await axios.post('/api/scenarios', { module:'capacity', name, description:desc, driver: 'Manual' });
  init();
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="Capacity – Scenarios" activeModule="capacity-scenarios" scripts={scripts}>
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
  return c.html(<Layout title="Capacity – Analytics" activeModule="capacity-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-chart-bar"></i></div>
        <div><div class="page-title">Capacity — Analytics & OEE</div><div class="page-subtitle">Downtime, OEE waterfall, utilization trends and loss analysis</div></div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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
  return c.html(<Layout title="Capacity – Root Cause" activeModule="capacity-rootcause" scripts={scripts}>
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
  return c.html(<Layout title="Sequencing & Scheduling" activeModule="sequencing" scripts={scripts}>
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
  return c.html(<Layout title="Sequencing – Gantt Planner" activeModule="seq-gantt" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-bars-staggered"></i></div>
        <div><div class="page-title">Gantt Planner</div><div class="page-subtitle">Visual 36-hour production schedule · Live job tracking · Changeover analysis</div></div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-secondary" onclick="location.reload()"><i class="fas fa-sync-alt"></i> Refresh</button>
        <button class="btn btn-secondary"><i class="fas fa-lock"></i> Lock Horizon</button>
        <button class="btn btn-primary"><i class="fas fa-rocket"></i> Optimize Sequence</button>
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
  return c.html(<Layout title="Sequencing – Execution" activeModule="seq-execution" scripts={scripts}>
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
        <button class="btn btn-sm btn-primary">Resolve</button>
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
  return c.html(<Layout title="Sequencing – Bottleneck" activeModule="seq-bottleneck" scripts={scripts}>
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
  return c.html(<Layout title="Sequencing – AI Copilot" activeModule="seq-copilot" scripts={scripts}>
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
  return c.html(<Layout title="Sequencing – RCA" activeModule="seq-rca">
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
function moveJob(id, dir) { alert('Job ' + id + ' moved ' + dir); }
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="Sequencing – Planner" activeModule="seq-planner" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#7C3AED,#8B5CF6)"><i class="fas fa-drafting-compass"></i></div>
        <div><div class="page-title">Planner Workbench</div><div class="page-subtitle">Manual job reordering, splitting, locking and priority management</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary"><i class="fas fa-rocket"></i> Auto-Optimize</button>
        <button class="btn btn-secondary"><i class="fas fa-share"></i> Publish Plan</button>
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
  return c.html(<Layout title="Sequencing – Scenarios" activeModule="seq-scenarios">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-layer-group"></i></div>
        <div><div class="page-title">Scenario Modeling</div><div class="page-subtitle">Compare scheduling scenarios and their cost/service trade-offs</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary"><i class="fas fa-plus"></i> New Scenario</button></div>
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
  return c.html(<Layout title="Sequencing – Analytics" activeModule="seq-analytics" scripts={scripts}>
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
      <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-line"></i> OEE Trend (7 Days)</span></div><div class="card-body" style="height:200px"><canvas id="oee-trend"></canvas></div></div>
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
  return c.html(<Layout title="Material Req. Planning" activeModule="mrp" scripts={scripts}>
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
  const expl = exploRes.status==='fulfilled' ? exploRes.value.data : [];
  const skus = skuRes.status==='fulfilled' ? skuRes.value.data : [];
  const skuSel = document.getElementById('sku-select');
  if (skuSel) skuSel.innerHTML = '<option value="">All SKUs</option>' + skus.map(s => \`<option value="\${s.id}">\${s.sku_name}</option>\`).join('');
  renderExpl(expl);
}
function renderExpl(expl) {
  const tbody = document.getElementById('expl-table');
  if (!tbody) return;
  tbody.innerHTML = expl.map(e => \`<tr>
    <td><strong>\${e.job_number}</strong></td>
    <td>\${e.sku_name}</td>
    <td>\${e.material_code}</td>
    <td>\${e.material_name}</td>
    <td>\${e.gross_requirement?.toLocaleString()}</td>
    <td>\${e.current_stock?.toLocaleString()}</td>
    <td><strong class="\${e.net_requirement>0?'critical':'healthy'}">\${e.net_requirement?.toLocaleString()}</strong></td>
    <td><span class="badge badge-\${e.status==='critical'?'critical':e.status==='shortage'?'warning':'success'}">\${e.status}</span></td>
    <td>\${e.lead_time_days||7}d</td>
    <td>\${e.net_requirement>0?'<button class="btn btn-sm btn-primary">Raise PO</button>':''}</td>
  </tr>\`).join('') || '<tr><td colspan="10" style="text-align:center">No data. Run MRP first.</td></tr>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="MRP Explosion" activeModule="mrp-explosion" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-project-diagram"></i></div>
        <div><div class="page-title">MRP Explosion — Net Requirements</div><div class="page-subtitle">Gross requirements → Stock → Net requirements → PO triggers</div></div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" id="sku-select" style="width:200px"><option>All SKUs</option></select>
        <button class="btn btn-primary"><i class="fas fa-play"></i> Recalculate</button>
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
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="MRP – BOM" activeModule="mrp-bom" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-sitemap"></i></div>
        <div><div class="page-title">Bill of Materials</div><div class="page-subtitle">Multi-level BOM with component quantities, waste factors and stock status</div></div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" id="sku-filter" style="width:200px" onchange="filterBOM()"><option>All SKUs</option></select>
        <button class="btn btn-primary"><i class="fas fa-plus"></i> Add Component</button>
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
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="MRP – Purchase Orders" activeModule="mrp-po" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-file-invoice"></i></div>
        <div><div class="page-title">Purchase Orders</div><div class="page-subtitle">PO lifecycle: Draft → Approved → Sent → Confirmed → Received</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary"><i class="fas fa-plus"></i> Create PO</button>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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
        <button class="btn btn-sm btn-primary">Take Action</button>
        <button class="btn btn-sm btn-secondary">Dismiss</button>
      </div>
    </div>
  </div>\`).join('') || '<div class="alert alert-success"><i class="fas fa-check-circle"></i><div>No open shortage alerts.</div></div>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="MRP – Shortage Alerts" activeModule="mrp-alerts" scripts={scripts}>
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
  return c.html(<Layout title="MRP Analytics" activeModule="mrp-analytics" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#22D3EE)"><i class="fas fa-chart-line"></i></div>
        <div><div class="page-title">MRP Analytics</div><div class="page-subtitle">Material coverage, procurement performance, supplier reliability</div></div>
      </div>
    </div>
    <div class="card"><div class="card-header"><span class="card-title"><i class="fas fa-chart-bar"></i> Material Coverage Days</span></div><div class="card-body" style="height:250px"><canvas id="coverage-chart"></canvas></div></div>
  </Layout>)
})


// ============================================================
// INVENTORY ROUTES
// ============================================================

app.get('/inventory', async (c) => {
  const scripts = `// inventory-module.js handles this page
  `.trim()
  return c.html(<Layout title="Inventory Planning" activeModule="inventory" scripts={scripts}>
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
  return c.html(<Layout title="Inventory – Stock Positions" activeModule="inv-operations" scripts={scripts}>
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
  return c.html(<Layout title="Inventory – Replenishment" activeModule="inv-optimization">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-sync-alt"></i></div>
        <div><div class="page-title">Replenishment Planning</div><div class="page-subtitle">Safety stock calculation, reorder point triggers, ABC-based policies</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary"><i class="fas fa-rocket"></i> Generate Replenishment Plan</button></div>
    </div>
    <div class="grid-2">
      {[{sku:'AquaPure 500ml', dos:21.3, rop:30000, ss:15000, action:'Monitor'},
        {sku:'FruitBurst Orange', dos:10.0, rop:12000, ss:6000, action:'Reorder'},
        {sku:'CoolSip Lemon', dos:11.0, rop:10000, ss:5000, action:'Watch'},
        {sku:'SportZone Energy', dos:12.5, rop:8000, ss:4000, action:'Watch'},
      ].map(item =>
        <div class="card" key={item.sku}>
          <div class="card-body">
            <div class="flex items-center justify-between mb-4">
              <strong>{item.sku}</strong>
              <span class={`badge badge-${item.action==='Reorder'?'critical':item.action==='Watch'?'warning':'success'}`}>{item.action}</span>
            </div>
            {[['Days of Supply', item.dos+' days'],['Reorder Point', item.rop.toLocaleString()],['Safety Stock', item.ss.toLocaleString()]].map(([l,v]) =>
              <div key={l} style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #F1F5F9;font-size:13px">
                <span style="color:#64748B">{l}</span><strong>{v}</strong>
              </div>
            )}
            <button class="btn btn-sm btn-primary" style="margin-top:12px;width:100%">
              {item.action === 'Reorder' ? '🔴 Trigger Reorder Now' : '📊 Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  </Layout>)
})

app.get('/inventory/scenarios', (c) => {
  const scripts = `
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
  return c.html(<Layout title="Inventory – Scenarios" activeModule="inv-scenarios" scripts={scripts}>
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
          <button class="btn btn-primary" style="width:100%;margin-top:12px" onclick="window.showToast('Scenario applied to inventory policy','success')"><i class="fas fa-check"></i> Apply Recommendation</button>
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
  return c.html(<Layout title="Inventory Analytics" activeModule="inv-analytics" scripts={scripts}>
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
  return c.html(<Layout title="Inventory – Master Data" activeModule="inv-master" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#059669,#34D399)"><i class="fas fa-database"></i></div>
        <div><div class="page-title">Inventory Master Data</div><div class="page-subtitle">SKU master, storage locations, ABC classification, inventory policies</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="window.showToast('Export complete — inventory_master.xlsx generated','success')"><i class="fas fa-download"></i> Export</button>
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
  return c.html(<Layout title="Procurement Planning" activeModule="procurement" scripts={scripts}>
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
      \${p.status==='draft'?'<button class="btn btn-sm btn-success">Approve</button>':''}
      <button class="btn btn-sm btn-secondary">Details</button>
    </div></td>
  </tr>\`).join('') || '<tr><td colspan="8" style="text-align:center">No POs</td></tr>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="Procurement – PO Workbench" activeModule="proc-workbench" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-clipboard-list"></i></div>
        <div><div class="page-title">PO Workbench</div><div class="page-subtitle">Full PO lifecycle: Draft → Approve → Send → Confirm → GRN → Invoice</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary"><i class="fas fa-plus"></i> New PO</button></div>
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
  return c.html(<Layout title="Supplier Scorecards" activeModule="proc-suppliers" scripts={scripts}>
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
  return c.html(<Layout title="Procurement – Contracts" activeModule="proc-contracts">
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

app.get('/procurement/optimization', (c) => {
  const scripts = `
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
  return c.html(<Layout title="Procurement Optimization" activeModule="proc-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-sliders-h"></i></div>
        <div><div class="page-title">Procurement Optimization</div><div class="page-subtitle">Multi-supplier allocation, consolidation, spot buy vs contract analysis</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="window.showToast('Optimization run complete — ₹4.2L savings identified','success')"><i class="fas fa-rocket"></i> Run Optimizer</button>
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
  return c.html(<Layout title="Procurement Analytics" activeModule="proc-analytics" scripts={scripts}>
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
  return c.html(<Layout title="Resource Planning" activeModule="resource" scripts={scripts}>
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

app.get('/resource/executive', (c) => c.redirect('/resource'))
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
  return c.html(<Layout title="Resource – Skills & Roster" activeModule="res-skills" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-id-badge"></i></div>
        <div><div class="page-title">Skills &amp; Roster Management</div><div class="page-subtitle">Operator certifications, skill levels and shift scheduling</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary"><i class="fas fa-plus"></i> Add Operator</button></div>
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
  return c.html(<Layout title="Resource Optimization" activeModule="res-optimization" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#DC2626,#F87171)"><i class="fas fa-sliders-h"></i></div>
        <div><div class="page-title">Resource Optimization</div><div class="page-subtitle">Workforce allocation, overtime minimization, shift balance analysis</div></div>
      </div>
      <div class="page-header-right">
        <button class="btn btn-primary" onclick="window.showToast('Optimization complete — 44 hrs/wk OT reduction possible','success')"><i class="fas fa-rocket"></i> Run Optimizer</button>
      </div>
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
  return c.html(<Layout title="Resource Scenarios" activeModule="res-scenarios" scripts={scripts}>
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
  return c.html(<Layout title="Resource Analytics" activeModule="res-analytics" scripts={scripts}>
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
  return c.html(<Layout title="S&OP Planning" activeModule="sop" scripts={scripts}>
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
            <button class="btn btn-primary btn-sm" data-action="run-sop"><i class="fas fa-check"></i> Approve Overtime</button>
            <button class="btn btn-secondary btn-sm">Review Deferral</button>
          </div>
        </div>
      </div>
    </div>
    <script src="/static/sop-module.js"></script>
  </Layout>)
})

app.get('/sop/executive', (c) => c.redirect('/sop'))

app.get('/sop/demand-review', async (c) => {
  const scripts = `
async function init() {
  const [fcRes, kpiRes] = await Promise.allSettled([axios.get('/api/sop/forecast'), axios.get('/api/sop/kpis')]);
  const fc = fcRes.status==='fulfilled' ? fcRes.value.data : [];
  const kpis = kpiRes.status==='fulfilled' ? kpiRes.value.data.filter(k=>k.category==='Demand') : [];
  const grid = document.getElementById('kpi-grid');
  if (grid && kpis.length) grid.innerHTML = kpis.map(k => {
    const sc = k.value >= k.target ? 'healthy' : k.value >= k.target * 0.95 ? 'warning' : 'critical';
    return \`<div class="kpi-card \${sc}"><div class="kpi-label">\${k.name}</div><div class="kpi-value \${sc}">\${k.value}\${k.unit||''}</div><div class="kpi-meta"><span class="kpi-target">Target: \${k.target}</span></div></div>\`;
  }).join('');
  const tbody = document.getElementById('forecast-table');
  if (tbody && fc.length) tbody.innerHTML = fc.slice(0,10).map(f => \`<tr>
    <td>\${f.sku_name}</td><td>\${f.category}</td><td>\${f.location}</td>
    <td>\${f.period}</td><td><strong>\${f.forecast_qty?.toLocaleString()}</strong></td>
    <td>\${Math.round(f.confidence_level*100)}%</td>
    <td>\${f.actual_qty?f.actual_qty.toLocaleString():'Pending'}</td>
  </tr>\`).join('') || '<tr><td colspan="7" style="text-align:center">No forecast data</td></tr>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="S&OP – Demand Review" activeModule="sop-demand" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-chart-line"></i></div>
        <div><div class="page-title">Demand Review</div><div class="page-subtitle">Forecast accuracy, demand signals, statistical forecasting and consensus</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary"><i class="fas fa-sync"></i> Refresh Forecast</button></div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="card"><div class="card-body compact">
      <table class="data-table">
        <thead><tr><th>SKU</th><th>Category</th><th>Location</th><th>Period</th><th>Forecast (cases)</th><th>Confidence</th><th>Actual</th></tr></thead>
        <tbody id="forecast-table"><tr><td colspan={7} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
      </table>
    </div></div>
  </Layout>)
})

app.get('/sop/supply-review', async (c) => {
  const scripts = `
async function init() {
  const kpis = await axios.get('/api/sop/kpis').then(r=>r.data.filter(k=>k.category==='Supply')).catch(()=>[]);
  const grid = document.getElementById('kpi-grid');
  if (grid && kpis.length) grid.innerHTML = kpis.map(k => {
    const sc = k.value >= k.target ? 'healthy' : k.value >= k.target * 0.95 ? 'warning' : 'critical';
    return \`<div class="kpi-card \${sc}"><div class="kpi-label">\${k.name}</div><div class="kpi-value \${sc}">\${k.value}\${k.unit||''}</div><div class="kpi-meta"><span class="kpi-target">Target: \${k.target}</span></div></div>\`;
  }).join('');
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="S&OP – Supply Review" activeModule="sop-supply" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-industry"></i></div>
        <div><div class="page-title">Supply Review</div><div class="page-subtitle">Production plan, capacity constraints, supply gaps and OTIF analysis</div></div>
      </div>
    </div>
    <div class="kpi-grid" id="kpi-grid"><div class="kpi-card"><div class="spinner"></div></div></div>
    <div class="card"><div class="card-body">
      {[['Demand Plan Mar-2026','4,800,000 cases'],['Supply Plan','4,620,000 cases'],['Gap','180,000 cases shortfall'],['Mumbai Capacity','Constrained — 97% utilization'],['OTIF','92.1% (Target: 95%)']].map(([l,v]) =>
        <div key={l} style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #F1F5F9;font-size:13px">
          <span style="color:#64748B">{l}</span>
          <strong style={l==='Gap'?'color:#DC2626':undefined}>{v}</strong>
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
      <button class="btn btn-sm btn-primary">Simulate</button>
      <button class="btn btn-sm btn-secondary">Compare</button>
      \${!s.is_baseline?'<button class="btn btn-sm btn-success">Activate</button>':''}
    </div>
  </div></div>\`).join('') || '<p class="text-muted">No scenarios</p>';
}
async function createScenario() {
  const name = document.getElementById('sc-name').value;
  if (!name) return alert('Enter name');
  await axios.post('/api/scenarios', { module:'sop', name, description:document.getElementById('sc-desc').value, driver:'Manual' });
  init();
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="S&OP – Scenarios" activeModule="sop-scenarios" scripts={scripts}>
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
  return c.html(<Layout title="S&OP – Consensus Meeting" activeModule="sop-consensus" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#2563EB,#3B82F6)"><i class="fas fa-users"></i></div>
        <div><div class="page-title">Consensus Meeting</div><div class="page-subtitle">March 2026 S&amp;OP cycle · Meeting notes, decisions, action items</div></div>
      </div>
      <div class="page-header-right"><button class="btn btn-primary"><i class="fas fa-plus"></i> Add Action Item</button></div>
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
  return c.html(<Layout title="S&OP Analytics" activeModule="sop-analytics" scripts={scripts}>
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
  return c.html(<Layout title="Action Items" activeModule="actions" scripts={scripts}>
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
  const log = await axios.get('/api/audit-log').then(r=>r.data).catch(()=>[]);
  const el = document.getElementById('audit-table');
  el.innerHTML = log.map(l => \`<tr>
    <td>\${l.created_at?.slice(0,16)||'—'}</td>
    <td><strong>\${l.user_name}</strong></td>
    <td><span class="badge badge-neutral">\${l.module?.toUpperCase()}</span></td>
    <td>\${l.action}</td>
    <td>\${l.entity_type} #\${l.entity_id}</td>
    <td style="font-size:11px">\${l.old_value||'—'}</td>
    <td style="font-size:11px">\${l.new_value||'—'}</td>
  </tr>\`).join('') || '<tr><td colspan="7" style="text-align:center">No audit records</td></tr>';
}
document.addEventListener('DOMContentLoaded', init);
  `.trim()
  return c.html(<Layout title="Audit Log" activeModule="audit" scripts={scripts}>
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#475569,#64748B)"><i class="fas fa-history"></i></div>
        <div><div class="page-title">Audit Log</div><div class="page-subtitle">Complete change history across all planning modules</div></div>
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
  return c.html(<Layout title="Production Planning" activeModule="production">
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
  return c.html(<Layout title="Master Production Schedule" activeModule="prod-mps">
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
        <button class="btn btn-primary"><i class="fas fa-plus"></i> New Order</button>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
        <a href="/production/rccp" class="btn btn-secondary"><i class="fas fa-ruler-combined"></i> RCCP Check</a>
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

    <div class="card mb-4">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-chart-bar"></i> MPS 12-Week Capacity vs. Planned</span>
        <div style="display:flex;gap:8px">
          <select class="form-input form-select" style="width:auto;font-size:12px">
            <option>All SKUs</option><option>PET 500ml</option><option>PET 1L</option><option>Mango 200ml</option>
          </select>
          <select class="form-input form-select" style="width:auto;font-size:12px">
            <option>All Lines</option><option>MUM-L1</option><option>MUM-L2</option><option>DEL-L1</option>
          </select>
        </div>
      </div>
      <div class="card-body" style="height:240px"><canvas id="mps-chart"></canvas></div>
    </div>

    <div class="card">
      <div class="card-header">
        <span class="card-title"><i class="fas fa-table"></i> MPS Detail</span>
        <div style="display:flex;gap:8px">
          <button class="btn btn-sm btn-secondary"><i class="fas fa-filter"></i> Filter</button>
          <button class="btn btn-sm btn-primary"><i class="fas fa-bolt"></i> Firm All W1</button>
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
    <script>document.body.dataset.page='production-mps';</script>
  </Layout>)
})

app.get('/production/atp', (c) => {
  return c.html(<Layout title="Available-to-Promise" activeModule="prod-atp">
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
        <button class="btn btn-primary"><i class="fas fa-search"></i> Check ATP</button>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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
  return c.html(<Layout title="Rough-Cut Capacity Planning" activeModule="prod-rccp">
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
        <button class="btn btn-primary"><i class="fas fa-sync"></i> Recalculate</button>
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
  return c.html(<Layout title="Production Planner Workbench" activeModule="prod-workbench">
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
        <button class="btn btn-primary"><i class="fas fa-plus"></i> New Job</button>
        <a href="/sequencing/gantt" class="btn btn-secondary"><i class="fas fa-bars-staggered"></i> Gantt View</a>
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

    <div class="grid-2-1 mb-4">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-list-ol"></i> Production Job Queue</span>
          <div style="display:flex;gap:8px">
            <select class="form-input form-select" style="width:auto;font-size:12px">
              <option>All Lines</option><option>MUM-L1</option><option>MUM-L2</option><option>DEL-L1</option>
            </select>
            <button class="btn btn-sm btn-primary"><i class="fas fa-robot"></i> AI Sequence</button>
          </div>
        </div>
        <div class="card-body" id="workbench-jobs"><div class="spinner"></div></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-clock"></i> Changeover Matrix</span></div>
        <div class="card-body compact">
          <table class="data-table" style="font-size:11px">
            <thead><tr><th>From → To</th><th>500ml</th><th>1L</th><th>Mango</th></tr></thead>
            <tbody>
              <tr><td style="font-weight:600">500ml PET</td><td style="color:#059669">—</td><td style="color:#D97706">2.5h</td><td style="color:#DC2626">4.0h</td></tr>
              <tr><td style="font-weight:600">1L PET</td><td style="color:#D97706">2.5h</td><td style="color:#059669">—</td><td style="color:#DC2626">4.5h</td></tr>
              <tr><td style="font-weight:600">Mango Can</td><td style="color:#DC2626">4.0h</td><td style="color:#DC2626">4.5h</td><td style="color:#059669">—</td></tr>
            </tbody>
          </table>
          <div class="alert alert-info" style="margin-top:12px"><i class="fas fa-info-circle"></i><div>AI recommends sequencing 500ml → 1L → Mango to minimize total changeover to 6.5h vs. current 11h</div></div>
        </div>
      </div>
    </div>
    <script src="/static/production-module.js"></script>
    <script>document.body.dataset.page='production-workbench';</script>
  </Layout>)
})

app.get('/production/scenarios', (c) => {
  return c.html(<Layout title="Production – Scenario Manager" activeModule="prod-scenarios">
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
        <button class="btn btn-secondary"><i class="fas fa-upload"></i> Import</button>
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
  return c.html(<Layout title="Production – ML Models" activeModule="prod-mlmodels">
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
        <button class="btn btn-primary"><i class="fas fa-sync"></i> Retrain</button>
        <button class="btn btn-secondary"><i class="fas fa-history"></i> Run History</button>
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
              <button class="btn btn-sm btn-primary"><i class="fas fa-play"></i> Run</button>
              <button class="btn btn-sm btn-secondary"><i class="fas fa-history"></i> Logs</button>
              <button class="btn btn-sm btn-secondary"><i class="fas fa-sliders-h"></i> Config</button>
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
  return c.html(<Layout title="Production Analytics" activeModule="prod-analytics">
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
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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
      <div class="card-header"><span class="card-title"><i class="fas fa-table"></i> Production Performance Summary</span></div>
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
  return c.html(<Layout title="Production AI Copilot" activeModule="prod-copilot">
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

// ============================================================
// DEPLOYMENT PLANNING MODULE
// ============================================================

app.get('/deployment', (c) => {
  return c.html(<Layout title="Deployment Planning" activeModule="deployment">
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
  return c.html(<Layout title="Distribution Network" activeModule="dep-network">
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
        <button class="btn btn-primary"><i class="fas fa-sitemap"></i> Redesign Network</button>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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
  return c.html(<Layout title="Deployment Planner Workbench" activeModule="dep-workbench">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-drafting-compass"></i></div>
        <div>
          <div class="page-title">Deployment Planner Workbench</div>
          <div class="page-subtitle">Manage shipments, optimize loads, and track dispatches in real-time</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-live">Live</span>
        <button class="btn btn-primary"><i class="fas fa-plus"></i> Create Shipment</button>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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

    <div class="grid-2-1 mb-4">
      <div class="card">
        <div class="card-header">
          <span class="card-title"><i class="fas fa-truck"></i> Shipment Queue</span>
          <div style="display:flex;gap:8px">
            <select class="form-input form-select" style="width:auto;font-size:12px">
              <option>All Hubs</option><option>Mumbai</option><option>Delhi</option><option>Chennai</option>
            </select>
            <select class="form-input form-select" style="width:auto;font-size:12px">
              <option>All Status</option><option>In Transit</option><option>Planned</option><option>Delayed</option>
            </select>
          </div>
        </div>
        <div class="card-body compact">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Origin</th><th>Destination</th><th>Volume</th><th>Truck</th><th>Util%</th><th>ETD</th><th>ETA</th><th>Status</th><th>Action</th></tr></thead>
            <tbody id="dep-shipments-table"><tr><td colspan={10} style="text-align:center;padding:20px"><div class="spinner"></div></td></tr></tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title"><i class="fas fa-gauge"></i> Avg Load Utilization</span></div>
        <div class="card-body" style="position:relative;height:160px">
          <canvas id="dep-load-gauge-chart"></canvas>
          <div id="dep-load-gauge-value" style="position:absolute;top:50%;left:50%;transform:translate(-50%,0);font-size:28px;font-weight:800;color:#1E3A8A"></div>
        </div>
        <div class="card-header" style="margin-top:0"><span class="card-title"><i class="fas fa-exclamation-triangle"></i> Exceptions</span></div>
        <div class="card-body compact">
          <div class="alert alert-critical"><i class="fas fa-times-circle"></i><div><strong>SHP-0317-006 Delayed</strong><br/>Delhi → Lucknow, 14 hrs late. Driver rest stop required.</div></div>
          <div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i><div><strong>SHP-0317-005 Low Util 65%</strong><br/>Consider consolidating with SHP-0317-009 (same lane).</div></div>
        </div>
      </div>
    </div>
    <script src="/static/deployment-module.js"></script>
    <script>document.body.dataset.page='deployment-workbench';</script>
  </Layout>)
})

app.get('/deployment/routes', (c) => {
  return c.html(<Layout title="Route Optimization" activeModule="dep-route">
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
        <button class="btn btn-primary"><i class="fas fa-robot"></i> AI Optimize All</button>
        <button class="btn btn-secondary"><i class="fas fa-plus"></i> New Route</button>
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
    <script>document.body.dataset.page='deployment-routes';</script>
  </Layout>)
})

app.get('/deployment/load-planning', (c) => {
  return c.html(<Layout title="Load Planning" activeModule="dep-load">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#D97706,#F59E0B)"><i class="fas fa-boxes"></i></div>
        <div>
          <div class="page-title">Load Planning</div>
          <div class="page-subtitle">Truck utilization · SKU mix optimization · Weight & cube utilization · 3D load planner</div>
        </div>
      </div>
      <div class="page-header-right">
        <span class="badge badge-warning">Avg Util: 84%</span>
        <button class="btn btn-primary"><i class="fas fa-magic"></i> Auto-Optimize All</button>
        <button class="btn btn-secondary"><i class="fas fa-plus"></i> New Load Plan</button>
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
    <script>document.body.dataset.page='deployment-load';</script>
  </Layout>)
})

app.get('/deployment/carriers', (c) => {
  return c.html(<Layout title="Carrier Selection" activeModule="dep-carrier">
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
        <button class="btn btn-primary"><i class="fas fa-gavel"></i> Run RFQ</button>
        <button class="btn btn-secondary"><i class="fas fa-plus"></i> Add Carrier</button>
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
  return c.html(<Layout title="Deployment Scenario Manager" activeModule="dep-scenarios">
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
        <button class="btn btn-secondary"><i class="fas fa-upload"></i> Import</button>
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
  return c.html(<Layout title="Deployment ML Models" activeModule="dep-mlmodels">
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
        <button class="btn btn-primary"><i class="fas fa-sync"></i> Retrain All</button>
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
              <button class="btn btn-sm btn-primary"><i class="fas fa-play"></i> Run</button>
              <button class="btn btn-sm btn-secondary"><i class="fas fa-history"></i> Logs</button>
              <button class="btn btn-sm btn-secondary"><i class="fas fa-sliders-h"></i> Config</button>
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

app.get('/deployment/analytics', (c) => {
  return c.html(<Layout title="Deployment Analytics" activeModule="dep-analytics">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-icon" style="background:linear-gradient(135deg,#0891B2,#38BDF8)"><i class="fas fa-chart-bar"></i></div>
        <div>
          <div class="page-title">Deployment Analytics</div>
          <div class="page-subtitle">OTD trends · Cost analysis · Carrier performance · Route efficiency · Exception analytics</div>
        </div>
      </div>
      <div class="page-header-right">
        <select class="form-input form-select" style="width:auto;font-size:13px">
          <option>Last 12 Weeks</option><option>Last 6 Months</option><option>This Year</option>
        </select>
        <button class="btn btn-secondary"><i class="fas fa-download"></i> Export</button>
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

export default app
