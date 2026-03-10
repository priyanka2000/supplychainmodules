-- ============================================================
-- EXTENDED SCHEMA v2 - All missing tables for full suite
-- ============================================================

-- CAPACITY: OEE Decomposition
CREATE TABLE IF NOT EXISTS oee_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL,
  date DATE NOT NULL,
  availability_pct REAL DEFAULT 0,
  performance_pct REAL DEFAULT 0,
  quality_pct REAL DEFAULT 0,
  oee_pct REAL DEFAULT 0,
  planned_downtime_hrs REAL DEFAULT 0,
  unplanned_downtime_hrs REAL DEFAULT 0,
  changeover_hrs REAL DEFAULT 0,
  FOREIGN KEY (line_id) REFERENCES production_lines(id)
);

-- CAPACITY: Downtime Log
CREATE TABLE IF NOT EXISTS downtime_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL,
  started_at DATETIME NOT NULL,
  ended_at DATETIME,
  duration_minutes REAL DEFAULT 0,
  downtime_type TEXT DEFAULT 'unplanned',
  reason_code TEXT,
  description TEXT,
  created_by TEXT DEFAULT 'system',
  FOREIGN KEY (line_id) REFERENCES production_lines(id)
);

-- CAPACITY: Production Calendar / Gantt
CREATE TABLE IF NOT EXISTS production_calendar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  line_id INTEGER NOT NULL,
  job_id INTEGER,
  sku_id INTEGER NOT NULL,
  planned_date DATE NOT NULL,
  shift TEXT DEFAULT 'A',
  planned_qty REAL DEFAULT 0,
  actual_qty REAL DEFAULT 0,
  start_time DATETIME,
  end_time DATETIME,
  status TEXT DEFAULT 'planned',
  locked INTEGER DEFAULT 0,
  FOREIGN KEY (line_id) REFERENCES production_lines(id),
  FOREIGN KEY (sku_id) REFERENCES skus(id)
);

-- SEQUENCING: Changeover Matrix
CREATE TABLE IF NOT EXISTS changeover_matrix (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_sku_id INTEGER NOT NULL,
  to_sku_id INTEGER NOT NULL,
  line_type TEXT NOT NULL,
  changeover_minutes REAL NOT NULL,
  changeover_cost REAL DEFAULT 0,
  FOREIGN KEY (from_sku_id) REFERENCES skus(id),
  FOREIGN KEY (to_sku_id) REFERENCES skus(id),
  UNIQUE(from_sku_id, to_sku_id, line_type)
);

-- SEQUENCING: Exception Log
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id INTEGER,
  exception_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning',
  description TEXT,
  impact_hours REAL DEFAULT 0,
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (job_id) REFERENCES jobs(id)
);

-- MRP: Purchase Requisitions
CREATE TABLE IF NOT EXISTS purchase_requisitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pr_number TEXT UNIQUE NOT NULL,
  material_id INTEGER NOT NULL,
  required_qty REAL NOT NULL,
  required_date DATE NOT NULL,
  requested_by TEXT DEFAULT 'MRP System',
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  linked_job_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- PROCUREMENT: Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_number TEXT UNIQUE NOT NULL,
  pr_id INTEGER,
  supplier_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  ordered_qty REAL NOT NULL,
  unit_price REAL DEFAULT 0,
  total_value REAL DEFAULT 0,
  currency TEXT DEFAULT 'INR',
  order_date DATE NOT NULL,
  expected_date DATE NOT NULL,
  received_date DATE,
  received_qty REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  payment_terms TEXT DEFAULT 'Net 30',
  created_by TEXT DEFAULT 'Sankar',
  approved_by TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- PROCUREMENT: GRN (Goods Receipt Notes)
CREATE TABLE IF NOT EXISTS grn (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  grn_number TEXT UNIQUE NOT NULL,
  po_id INTEGER NOT NULL,
  received_date DATE NOT NULL,
  received_qty REAL NOT NULL,
  accepted_qty REAL DEFAULT 0,
  rejected_qty REAL DEFAULT 0,
  rejection_reason TEXT,
  quality_status TEXT DEFAULT 'pending',
  received_by TEXT DEFAULT 'Vikrant',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id)
);

-- PROCUREMENT: Supplier Contracts
CREATE TABLE IF NOT EXISTS supplier_contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  contract_number TEXT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  committed_volume REAL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  price_validity_date DATE,
  payment_terms TEXT DEFAULT 'Net 30',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (material_id) REFERENCES raw_materials(id)
);

-- INVENTORY: Stock Positions
CREATE TABLE IF NOT EXISTS stock_positions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id INTEGER NOT NULL,
  plant_id INTEGER NOT NULL,
  on_hand_qty REAL DEFAULT 0,
  reserved_qty REAL DEFAULT 0,
  in_transit_qty REAL DEFAULT 0,
  available_qty REAL DEFAULT 0,
  safety_stock REAL DEFAULT 0,
  reorder_point REAL DEFAULT 0,
  max_stock REAL DEFAULT 0,
  avg_daily_demand REAL DEFAULT 0,
  days_of_supply REAL DEFAULT 0,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES skus(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  UNIQUE(sku_id, plant_id)
);

-- INVENTORY: Aging / Dead Stock
CREATE TABLE IF NOT EXISTS inventory_aging (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id INTEGER NOT NULL,
  plant_id INTEGER NOT NULL,
  batch_number TEXT,
  qty REAL DEFAULT 0,
  manufacture_date DATE,
  expiry_date DATE,
  days_in_stock INTEGER DEFAULT 0,
  aging_bucket TEXT DEFAULT '0-30',
  status TEXT DEFAULT 'active',
  FOREIGN KEY (sku_id) REFERENCES skus(id),
  FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- INVENTORY: Replenishment Orders
CREATE TABLE IF NOT EXISTS replenishment_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku_id INTEGER NOT NULL,
  from_plant_id INTEGER,
  to_plant_id INTEGER NOT NULL,
  qty REAL NOT NULL,
  trigger_type TEXT DEFAULT 'reorder_point',
  status TEXT DEFAULT 'pending',
  planned_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES skus(id),
  FOREIGN KEY (to_plant_id) REFERENCES plants(id)
);

-- RESOURCE: Skills Matrix
CREATE TABLE IF NOT EXISTS operator_skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator_name TEXT NOT NULL,
  plant_id INTEGER NOT NULL,
  line_id INTEGER,
  skill_name TEXT NOT NULL,
  proficiency_level TEXT DEFAULT 'basic',
  certification_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- RESOURCE: Shift Roster
CREATE TABLE IF NOT EXISTS shift_roster (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  plant_id INTEGER NOT NULL,
  line_id INTEGER,
  operator_name TEXT NOT NULL,
  shift_date DATE NOT NULL,
  shift TEXT DEFAULT 'A',
  role TEXT DEFAULT 'operator',
  attendance TEXT DEFAULT 'present',
  overtime_hours REAL DEFAULT 0,
  FOREIGN KEY (plant_id) REFERENCES plants(id)
);

-- S&OP: Demand Plan Submissions
CREATE TABLE IF NOT EXISTS demand_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  sku_id INTEGER,
  channel TEXT DEFAULT 'total',
  statistical_forecast REAL DEFAULT 0,
  sales_input REAL DEFAULT 0,
  marketing_input REAL DEFAULT 0,
  consensus_qty REAL DEFAULT 0,
  final_plan REAL DEFAULT 0,
  submitted_by TEXT DEFAULT 'Sankar',
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sku_id) REFERENCES skus(id)
);

-- S&OP: Supply Plan
CREATE TABLE IF NOT EXISTS supply_plan (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  period TEXT NOT NULL,
  plant_id INTEGER,
  sku_id INTEGER,
  planned_production REAL DEFAULT 0,
  constrained_production REAL DEFAULT 0,
  demand_plan REAL DEFAULT 0,
  gap REAL DEFAULT 0,
  gap_pct REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  FOREIGN KEY (plant_id) REFERENCES plants(id),
  FOREIGN KEY (sku_id) REFERENCES skus(id)
);

-- S&OP: Action Items
CREATE TABLE IF NOT EXISTS action_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  module TEXT DEFAULT 'sop',
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  due_date DATE NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  created_by TEXT DEFAULT 'Sankar',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

-- GLOBAL: Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_name TEXT NOT NULL,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_oee_line_date ON oee_data(line_id, date);
CREATE INDEX IF NOT EXISTS idx_downtime_line ON downtime_log(line_id);
CREATE INDEX IF NOT EXISTS idx_prod_cal_date ON production_calendar(planned_date, line_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_po_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_stock_sku_plant ON stock_positions(sku_id, plant_id);
CREATE INDEX IF NOT EXISTS idx_aging_expiry ON inventory_aging(expiry_date);
CREATE INDEX IF NOT EXISTS idx_action_items_status ON action_items(status, due_date);
