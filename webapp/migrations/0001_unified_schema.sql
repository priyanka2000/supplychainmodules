-- =============================================================================
-- SYDIAI Supply Planning Suite - Unified Database Schema
-- Covers: Capacity, Sequencing, MRP, Inventory, Procurement, Resource, S&OP
-- =============================================================================

-- ─── SHARED: PLANTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_code TEXT UNIQUE NOT NULL,
  plant_name TEXT NOT NULL,
  location TEXT NOT NULL,
  region TEXT DEFAULT 'India',
  plant_type TEXT DEFAULT 'owned',
  installed_capacity REAL DEFAULT 0,
  capacity_units TEXT DEFAULT 'tons/day',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── SHARED: PRODUCTION LINES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS production_lines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  line_code TEXT UNIQUE NOT NULL,
  line_name TEXT NOT NULL,
  line_type TEXT DEFAULT 'PET',
  capacity_per_day REAL DEFAULT 0,
  line_speed REAL DEFAULT 0,
  efficiency_pct REAL DEFAULT 85.0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- ─── SHARED: SKUs ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS skus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_code TEXT UNIQUE NOT NULL,
  sku_name TEXT NOT NULL,
  brand TEXT DEFAULT 'SYDIAI',
  category TEXT DEFAULT 'Beverages',
  pack_type TEXT DEFAULT 'PET',
  pack_size TEXT DEFAULT '500ml',
  shelf_life_days INTEGER DEFAULT 365,
  unit_of_measure TEXT DEFAULT 'cases',
  abc_classification TEXT DEFAULT 'A',
  production_rate REAL DEFAULT 0,
  cost_per_unit REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── CAPACITY PLANNING ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS capacity_utilization (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER,
  line_id INTEGER,
  date DATE NOT NULL,
  available_hours REAL DEFAULT 24,
  utilized_hours REAL DEFAULT 0,
  idle_hours REAL DEFAULT 0,
  overtime_hours REAL DEFAULT 0,
  utilization_pct REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (line_id) REFERENCES production_lines(id)
);

CREATE TABLE IF NOT EXISTS bottlenecks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER,
  bottleneck_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  description TEXT,
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (line_id) REFERENCES production_lines(id)
);

CREATE TABLE IF NOT EXISTS cap_kpi_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT,
  metric_category TEXT NOT NULL,
  metric_status TEXT NOT NULL,
  target_value REAL,
  period TEXT NOT NULL DEFAULT 'current',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── SEQUENCING & SCHEDULING ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_number TEXT UNIQUE NOT NULL,
  sku_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  priority INTEGER DEFAULT 5,
  due_date DATETIME,
  status TEXT DEFAULT 'pending',
  assigned_line_id INTEGER,
  scheduled_start DATETIME,
  scheduled_end DATETIME,
  actual_start DATETIME,
  actual_end DATETIME,
  delay_minutes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES skus(id),
  FOREIGN KEY (assigned_line_id) REFERENCES production_lines(id)
);

CREATE TABLE IF NOT EXISTS setup_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_sku_id INTEGER NOT NULL,
  to_sku_id INTEGER NOT NULL,
  setup_time_minutes REAL NOT NULL,
  FOREIGN KEY (from_sku_id) REFERENCES skus(id),
  FOREIGN KEY (to_sku_id) REFERENCES skus(id),
  UNIQUE(from_sku_id, to_sku_id)
);

-- ─── MRP: BILL OF MATERIALS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code TEXT UNIQUE NOT NULL,
  material_name TEXT NOT NULL,
  material_type TEXT DEFAULT 'Raw Material',
  shelf_life_days INTEGER DEFAULT 90,
  unit_of_measure TEXT DEFAULT 'kg',
  abc_classification TEXT DEFAULT 'A',
  current_stock REAL DEFAULT 0,
  reorder_point REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bom (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  quantity_per_unit REAL NOT NULL,
  waste_percentage REAL DEFAULT 0,
  version INTEGER DEFAULT 1,
  FOREIGN KEY (sku_id) REFERENCES skus(id),
  FOREIGN KEY (material_id) REFERENCES raw_materials(id),
  UNIQUE(sku_id, material_id, version)
);

CREATE TABLE IF NOT EXISTS mrp_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  material_id INTEGER,
  sku_id INTEGER,
  message TEXT NOT NULL,
  recommended_action TEXT,
  status TEXT DEFAULT 'open',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id),
  FOREIGN KEY (sku_id) REFERENCES skus(id)
);

-- ─── PROCUREMENT PLANNING ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  location TEXT,
  capacity INTEGER DEFAULT 0,
  rating REAL DEFAULT 4.0,
  reliability_score REAL DEFAULT 85.0,
  lead_time_days INTEGER DEFAULT 7,
  is_sustainable BOOLEAN DEFAULT 0,
  risk_level TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procurement_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER,
  material_id INTEGER,
  supplier_id INTEGER,
  planned_qty REAL DEFAULT 0,
  planned_cost REAL DEFAULT 0,
  period TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ─── RESOURCE PLANNING ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resource_capacity (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  line_id INTEGER NOT NULL,
  capacity_date DATE NOT NULL,
  available_hours REAL NOT NULL DEFAULT 8,
  maintenance_hours REAL DEFAULT 0,
  utilization_pct REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (line_id) REFERENCES production_lines(id)
);

-- ─── SHARED: SCENARIOS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scenarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL DEFAULT 'sop',
  name TEXT NOT NULL,
  description TEXT,
  driver TEXT,
  status TEXT DEFAULT 'draft',
  is_baseline INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenario_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id INTEGER NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  baseline_value REAL,
  variance REAL,
  unit TEXT,
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id)
);

-- ─── SHARED: DEMAND FORECAST ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_forecast (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id INTEGER,
  material_id INTEGER,
  location TEXT,
  period TEXT NOT NULL,
  forecast_qty REAL DEFAULT 0,
  actual_qty REAL,
  confidence_level REAL DEFAULT 0.8,
  forecast_type TEXT DEFAULT 'baseline',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES skus(id)
);

-- ─── SHARED: RECOMMENDATIONS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recommendations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT NOT NULL DEFAULT 'sop',
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  estimated_benefit TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── S&OP: OBJECTIVES & CONSTRAINTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS objectives (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_metric TEXT,
  weight REAL DEFAULT 1.0,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS constraints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  value TEXT,
  enabled INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sop_kpis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  value REAL NOT NULL,
  target REAL,
  unit TEXT,
  trend TEXT DEFAULT 'stable',
  period TEXT DEFAULT 'monthly',
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_cap_util_date ON capacity_utilization(date);
CREATE INDEX IF NOT EXISTS idx_cap_util_line ON capacity_utilization(line_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_line ON jobs(assigned_line_id);
CREATE INDEX IF NOT EXISTS idx_demand_period ON demand_forecast(period);
CREATE INDEX IF NOT EXISTS idx_scenarios_module ON scenarios(module);
CREATE INDEX IF NOT EXISTS idx_recs_module ON recommendations(module);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON mrp_alerts(status);
