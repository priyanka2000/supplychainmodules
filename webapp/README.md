# SYDIAI Supply Chain Intelligence Suite

## Project Overview
- **Name**: SYDIAI Supply Chain Intelligence Suite
- **Goal**: Comprehensive 7-module supply chain planning platform with live KPI dashboards, AI Copilot, and interactive analytics for a beverage manufacturing company
- **Stack**: Hono + TypeScript (JSX) · Vite · Cloudflare Pages/Workers · D1 SQLite · Chart.js · TailwindCSS (CDN) · Font Awesome

---

## Live URL
- **Sandbox**: https://3000-iqbnn6o0yep7wbxzviy9t-b9b802c4.sandbox.novita.ai

---

## Modules & Routes

### 🏠 Home Dashboard
| Path | Description |
|---|---|
| `/` | Home — module health cards, open alerts, top recommendations, AI Copilot |

### 🏭 Capacity Planning
| Path | Description |
|---|---|
| `/capacity` | Main — KPI grid, utilisation trend, bottleneck list, plants overview |
| `/capacity/executive` | Executive dashboard — senior-level charts |
| `/capacity/operations` | Operations center — OEE bar chart, line-by-line table |
| `/capacity/optimization` | Optimization — run optimizer, recommendations |
| `/capacity/scenarios` | Scenario builder |
| `/capacity/analytics` | Analytics — waterfall, OEE trends |
| `/capacity/root-cause` | Root-cause analysis |

### 📋 Sequencing & Scheduling
| Path | Description |
|---|---|
| `/sequencing` | Main — KPI grid, job queue table, throughput by line chart |
| `/sequencing/gantt` | 36-hr Gantt planner — visual job bars, changeover matrix |
| `/sequencing/execution` | Execution monitor — live job status, schedule adherence |
| `/sequencing/bottleneck` | Bottleneck analysis |
| `/sequencing/copilot` | AI Copilot chat for scheduling |
| `/sequencing/rca` | Root-cause analysis |
| `/sequencing/planner` | Constraint-based planner |
| `/sequencing/scenarios` | Scenarios |
| `/sequencing/analytics` | Analytics — OEE trend, delay waterfall |

### 🔩 MRP / Material Requirements
| Path | Description |
|---|---|
| `/mrp` | Main — KPI grid, MRP alerts, raw-material stock table |
| `/mrp/explosion` | MRP explosion — BOM-level net requirements |
| `/mrp/bom` | BOM viewer |
| `/mrp/purchase-orders` | PO status tracker |
| `/mrp/shortage-alerts` | Shortage alert list |
| `/mrp/analytics` | Analytics — coverage chart |

### 📦 Inventory Planning
| Path | Description |
|---|---|
| `/inventory` | Main — KPI grid, SKU stock table, category doughnut |
| `/inventory/operations` | Operations — stock table with reorder triggers |
| `/inventory/optimization` | Replenishment planning — reorder cards |
| `/inventory/scenarios` | ✨ **NEW** What-if analysis — service-level vs cost chart, lead-time sensitivity, SKU comparison table |
| `/inventory/analytics` | ABC pie chart, inventory metrics |
| `/inventory/master` | ✨ **NEW** SKU master table (8 SKUs), ABC doughnut, global policy config |

### 🤝 Procurement Planning
| Path | Description |
|---|---|
| `/procurement` | Main — KPI grid, supplier radar chart, PO status doughnut, risk matrix, OTIF trend |
| `/procurement/operational` | PO Workbench — full PO lifecycle table |
| `/procurement/suppliers` | Supplier scorecards with progress bars |
| `/procurement/contracts` | Contract management |
| `/procurement/optimization` | ✨ **NEW** Multi-supplier allocation chart, bubble chart, savings KPIs, recommendations |
| `/procurement/analytics` | ✨ **ENHANCED** 4 charts: spend by category, supplier concentration, price-variance, spend-vs-budget trend + table |

### 👥 Resource Planning
| Path | Description |
|---|---|
| `/resource` | Main — KPI grid, utilization & shift charts, skill matrix, overtime trend, operator roster |
| `/resource/skills` | Skills & Roster — operator table with certifications |
| `/resource/optimization` | ✨ **NEW** OT reduction waterfall, shift balance radar, 4 recommendations |
| `/resource/scenarios` | ✨ **NEW** Headcount scenario chart, scenario builder/outputs cards, comparison matrix |
| `/resource/analytics` | Analytics — overtime trend chart |

### 📊 S&OP Planning
| Path | Description |
|---|---|
| `/sop` | Main — KPI grid, demand-vs-supply chart, KPI radar, supply gap alert |
| `/sop/demand-review` | Demand review — forecast table with confidence |
| `/sop/supply-review` | Supply review — capacity vs demand table |
| `/sop/scenarios` | Scenario builder — demand upside/downside modelling |
| `/sop/consensus` | Consensus meeting workspace |
| `/sop/analytics` | Analytics — trend charts |

### 🔧 Cross-Module
| Path | Description |
|---|---|
| `/action-items` | Open action items tracker (cross-module) |
| `/audit-log` | Full change-history audit trail |

---

## API Endpoints (28 total)

| Endpoint | Method | Description |
|---|---|---|
| `/api/dashboard/summary` | GET | Plants, lines, alerts, jobs counts |
| `/api/dashboard/health` | GET | Module health scores (7 modules) |
| `/api/capacity/kpis` | GET | 10 capacity KPIs |
| `/api/capacity/utilization` | GET | 14-day utilisation trend |
| `/api/capacity/oee` | GET | OEE by line |
| `/api/capacity/bottlenecks` | GET | Active bottlenecks |
| `/api/capacity/plants` | GET | Plant overview with avg utilisation |
| `/api/sequencing/kpis` | GET | 6 sequencing KPIs |
| `/api/sequencing/jobs` | GET | Full job queue |
| `/api/sequencing/setup-matrix` | GET | Changeover times matrix |
| `/api/mrp/kpis` | GET | 6 MRP KPIs |
| `/api/mrp/alerts` | GET | Open MRP shortage alerts |
| `/api/mrp/materials` | GET | Raw material stock levels |
| `/api/inventory/kpis` | GET | 6 inventory KPIs |
| `/api/inventory/stock` | GET | SKU stock with DOS & reorder |
| `/api/procurement/kpis` | GET | 6 procurement KPIs |
| `/api/procurement/suppliers` | GET | Supplier list with risk & ratings |
| `/api/procurement/plans` | GET | Purchase orders / plans |
| `/api/resource/kpis` | GET | 6 resource KPIs |
| `/api/resource/capacity` | GET | Capacity by line & shift |
| `/api/resource/operators` | GET | Operator roster with skills |
| `/api/sop/kpis` | GET | 10 S&OP KPIs |
| `/api/sop/forecast` | GET | SKU-level demand forecast |
| `/api/sop/scenarios` | GET | S&OP planning scenarios |
| `/api/recommendations` | GET | AI recommendations |
| `/api/action-items` | GET | Open action items |
| `/api/action-items/:id` | PATCH | Mark action as completed |
| `/api/audit-log` | GET | Audit trail |
| `/api/skus` | GET | SKU master list |

---

## Data Architecture

### Storage: Cloudflare D1 (SQLite)
**30+ tables** seeded with realistic FMCG beverage company data (3 plants, 12 lines, 12 SKUs, 8 suppliers)

Key tables: `plants`, `production_lines`, `skus`, `jobs`, `bottlenecks`, `cap_kpi_metrics`, `capacity_utilization`, `oee_data`, `materials`, `inventory_stock`, `suppliers`, `procurement_plans`, `operators`, `operator_skills`, `sop_kpis`, `sop_forecast`, `mrp_alerts`, `action_items`, `audit_log`, `recommendations`

---

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | Hono 4 (JSX server-side rendering) |
| Runtime | Cloudflare Workers / Pages |
| Database | Cloudflare D1 (SQLite) |
| Build tool | Vite 6 + @hono/vite-build |
| Frontend charts | Chart.js (CDN) |
| Frontend styling | TailwindCSS (CDN) + custom theme.css |
| Icons | Font Awesome 6 (CDN) |
| HTTP client | Axios (CDN) |
| Process manager | PM2 (sandbox dev) |

---

## Development

```bash
# Start dev server (sandbox)
npm run build && pm2 start ecosystem.config.cjs

# Reset & seed local DB
npm run db:reset

# Apply migrations only
npm run db:migrate:local
```

---

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: 🟡 Sandbox (ready for production deploy)
- **Last Updated**: 2026-03-04

---

## Completed Features ✅
- 7 planning modules with full sub-navigation (48 pages total)
- 28 REST API endpoints backed by D1 SQLite
- Live KPI cards with status colour-coding (healthy / warning / critical)
- Chart.js visualisations on every page (line, bar, doughnut, radar, bubble, waterfall)
- 36-hour Gantt planner with live job bars
- AI Planning Copilot (rule-based, homepage + /sequencing/copilot)
- Action Items cross-module tracker with PATCH mark-done
- Audit Log
- All previously-stub pages now have real charts & data tables

## Not Yet Implemented ⏳
- Cloudflare Pages production deployment
- Real-time WebSocket updates (edge limitation)
- User authentication / multi-tenancy
- PDF/Excel export (requires external service)
- Email notifications
