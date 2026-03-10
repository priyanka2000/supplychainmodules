-- ============================================================
-- SYDIAI Suite v2 - Extended Seed Data
-- ============================================================

-- OEE DATA (last 7 days, key lines)
INSERT OR IGNORE INTO oee_data (line_id, date, availability_pct, performance_pct, quality_pct, oee_pct, planned_downtime_hrs, unplanned_downtime_hrs, changeover_hrs) VALUES
(1, date('now','-6 days'), 88.4, 91.2, 98.6, 79.5, 1.2, 0.5, 0.8),
(1, date('now','-5 days'), 85.2, 89.8, 98.8, 75.4, 1.5, 1.2, 1.0),
(1, date('now','-4 days'), 92.1, 93.4, 99.0, 80.2, 0.8, 0.2, 0.6),
(1, date('now','-3 days'), 87.6, 90.1, 98.4, 77.5, 1.1, 0.8, 0.9),
(1, date('now','-2 days'), 90.3, 92.8, 98.9, 82.8, 0.9, 0.4, 0.7),
(1, date('now','-1 days'), 84.7, 88.5, 98.2, 73.6, 1.4, 1.5, 1.1),
(1, date('now'),           86.2, 90.6, 98.7, 77.1, 1.0, 0.8, 0.9),
(2, date('now','-6 days'), 91.4, 88.2, 97.8, 78.8, 0.6, 0.3, 1.2),
(2, date('now','-3 days'), 96.2, 95.1, 98.2, 89.8, 0.2, 0.1, 0.4),
(2, date('now'),           93.8, 92.4, 98.6, 85.4, 0.4, 0.2, 0.6),
(3, date('now','-6 days'), 88.9, 91.5, 99.1, 80.6, 1.1, 0.4, 0.7),
(3, date('now'),           85.4, 90.2, 98.8, 76.1, 1.3, 0.6, 0.8);

-- DOWNTIME LOG
INSERT OR IGNORE INTO downtime_log (line_id, started_at, ended_at, duration_minutes, downtime_type, reason_code, description, created_by) VALUES
(2, datetime('now','-2 days','+8 hours'), datetime('now','-2 days','+9 hours','30 minutes'), 90, 'unplanned', 'MECH-001', 'Spindle bearing wear on filler head', 'Vikrant'),
(1, datetime('now','-4 days','+14 hours'), datetime('now','-4 days','+14 hours','45 minutes'), 45, 'changeover', 'CO-PET-CAN', 'PET to Can line changeover', 'system'),
(3, datetime('now','-1 days','+10 hours'), datetime('now','-1 days','+11 hours'), 60, 'planned', 'PM-SCHED', 'Scheduled preventive maintenance', 'Vikrant'),
(4, datetime('now','-3 days','+16 hours'), datetime('now','-3 days','+16 hours','30 minutes'), 30, 'unplanned', 'ELEC-002', 'Power fluctuation - conveyor stopped', 'system'),
(9, datetime('now','-5 days','+12 hours'), datetime('now','-5 days','+14 hours'), 120, 'unplanned', 'MECH-003', 'Cap applicator jam - CO2 line', 'Vikrant');

-- PRODUCTION CALENDAR (next 14 days gantt data)
INSERT OR IGNORE INTO production_calendar (line_id, sku_id, planned_date, shift, planned_qty, actual_qty, start_time, end_time, status, locked) VALUES
(1, 1, date('now'), 'A', 48000, 42000, datetime('now','start of day','+6 hours'), datetime('now','start of day','+14 hours'), 'in_progress', 0),
(1, 7, date('now'), 'B', 52000, 0, datetime('now','start of day','+14 hours'), datetime('now','start of day','+22 hours'), 'planned', 0),
(2, 1, date('now'), 'A', 56000, 51000, datetime('now','start of day','+6 hours'), datetime('now','start of day','+14 hours'), 'in_progress', 0),
(2, 3, date('now'), 'B', 60000, 0, datetime('now','start of day','+14 hours'), datetime('now','start of day','+22 hours'), 'planned', 0),
(3, 3, date('now'), 'A', 72000, 64000, datetime('now','start of day','+6 hours'), datetime('now','start of day','+14 hours'), 'in_progress', 0),
(1, 2, date('now','+1 days'), 'A', 50000, 0, datetime('now','+1 days','start of day','+6 hours'), datetime('now','+1 days','start of day','+14 hours'), 'planned', 0),
(1, 4, date('now','+1 days'), 'B', 46000, 0, datetime('now','+1 days','start of day','+14 hours'), datetime('now','+1 days','start of day','+22 hours'), 'planned', 0),
(2, 2, date('now','+1 days'), 'A', 58000, 0, datetime('now','+1 days','start of day','+6 hours'), datetime('now','+1 days','start of day','+14 hours'), 'planned', 0),
(1, 7, date('now','+2 days'), 'A', 54000, 0, datetime('now','+2 days','start of day','+6 hours'), datetime('now','+2 days','start of day','+14 hours'), 'planned', 0),
(1, 1, date('now','+2 days'), 'B', 48000, 0, datetime('now','+2 days','start of day','+14 hours'), datetime('now','+2 days','start of day','+22 hours'), 'planned', 0),
(2, 3, date('now','+2 days'), 'A', 64000, 0, datetime('now','+2 days','start of day','+6 hours'), datetime('now','+2 days','start of day','+14 hours'), 'planned', 0),
(3, 5, date('now','+3 days'), 'A', 68000, 0, datetime('now','+3 days','start of day','+6 hours'), datetime('now','+3 days','start of day','+14 hours'), 'planned', 0),
(1, 6, date('now','+3 days'), 'B', 44000, 0, datetime('now','+3 days','start of day','+14 hours'), datetime('now','+3 days','start of day','+22 hours'), 'planned', 0),
(1, 8, date('now','+4 days'), 'A', 50000, 0, datetime('now','+4 days','start of day','+6 hours'), datetime('now','+4 days','start of day','+14 hours'), 'planned', 0),
(2, 1, date('now','+4 days'), 'B', 56000, 0, datetime('now','+4 days','start of day','+14 hours'), datetime('now','+4 days','start of day','+22 hours'), 'planned', 0);

-- CHANGEOVER MATRIX (SKU × SKU for PET lines)
INSERT OR IGNORE INTO changeover_matrix (from_sku_id, to_sku_id, line_type, changeover_minutes, changeover_cost) VALUES
(1, 2, 'PET', 35, 2800), (1, 4, 'PET', 45, 3600), (1, 6, 'PET', 50, 4000), (1, 7, 'PET', 30, 2400),
(2, 1, 'PET', 35, 2800), (2, 4, 'PET', 40, 3200), (2, 6, 'PET', 48, 3840), (2, 7, 'PET', 32, 2560),
(4, 1, 'PET', 45, 3600), (4, 2, 'PET', 40, 3200), (4, 6, 'PET', 25, 2000), (4, 7, 'PET', 38, 3040),
(6, 1, 'PET', 50, 4000), (6, 2, 'PET', 48, 3840), (6, 4, 'PET', 25, 2000), (6, 7, 'PET', 42, 3360),
(7, 1, 'PET', 30, 2400), (7, 2, 'PET', 32, 2560), (7, 4, 'PET', 38, 3040), (7, 6, 'PET', 42, 3360),
(3, 5, 'Can', 28, 2240), (3, 11, 'Can', 55, 4400), (5, 3, 'Can', 28, 2240), (5, 11, 'Can', 60, 4800),
(11, 3, 'Can', 55, 4400), (11, 5, 'Can', 60, 4800);

-- SCHEDULE EXCEPTIONS
INSERT OR IGNORE INTO schedule_exceptions (job_id, exception_type, severity, description, impact_hours, status, assigned_to) VALUES
(1, 'material_shortage', 'critical', 'CO2 Gas shortage - Mumbai PET Line 2 at risk', 4.5, 'open', 'Sankar'),
(2, 'equipment_failure', 'warning', 'Filler head bearing wear detected - Line 2', 2.0, 'in_progress', 'Vikrant'),
(3, 'rush_order', 'warning', 'Priority order inserted - PET Line 1 sequence changed', 1.5, 'open', 'Sankar'),
(4, 'capacity_breach', 'critical', 'Line 2 utilization forecast to exceed 95% - Week 26', 8.0, 'open', 'Vikrant'),
(5, 'changeover_delay', 'warning', 'PET-to-Can changeover 35% over standard time', 0.8, 'resolved', 'Sankar');

-- PURCHASE REQUISITIONS
INSERT OR IGNORE INTO purchase_requisitions (pr_number, material_id, required_qty, required_date, requested_by, status, priority) VALUES
('PR-2024-0891', 1, 5000, date('now','+7 days'), 'MRP System', 'open', 'urgent'),
('PR-2024-0892', 2, 8000, date('now','+10 days'), 'MRP System', 'approved', 'high'),
('PR-2024-0893', 3, 2000, date('now','+5 days'), 'MRP System', 'open', 'urgent'),
('PR-2024-0894', 4, 15000, date('now','+14 days'), 'Sankar', 'approved', 'normal'),
('PR-2024-0895', 5, 120000, date('now','+12 days'), 'MRP System', 'open', 'high'),
('PR-2024-0896', 6, 800, date('now','+8 days'), 'Vikrant', 'pending', 'high');

-- PURCHASE ORDERS  
INSERT OR IGNORE INTO purchase_orders (po_number, pr_id, supplier_id, material_id, ordered_qty, unit_price, total_value, order_date, expected_date, received_qty, status, created_by, approved_by) VALUES
('PO-2024-1841', 1, 7, 1, 50000, 25.0, 1250000, date('now','-8 days'), date('now','+2 days'), 0, 'confirmed', 'Sankar', 'Vikrant'),
('PO-2024-1842', 2, 1, 2, 10000, 48.0, 480000, date('now','-6 days'), date('now','+4 days'), 0, 'open', 'Sankar', NULL),
('PO-2024-1843', 3, 6, 3, 2000, 82.0, 164000, date('now','-10 days'), date('now','-2 days'), 0, 'overdue', 'Vikrant', 'Sankar'),
('PO-2024-1844', 4, 3, 4, 100000, 2.2, 220000, date('now','-5 days'), date('now','+3 days'), 0, 'open', 'Sankar', 'Vikrant'),
('PO-2024-1845', 5, 5, 5, 500, 90.0, 45000, date('now','-12 days'), date('now','-4 days'), 0, 'overdue', 'Vikrant', NULL),
('PO-2024-1846', 6, 7, 1, 30000, 25.0, 750000, date('now','-3 days'), date('now','+7 days'), 0, 'draft', 'Sankar', NULL),
('PO-2024-1847', NULL, 2, 6, 5000, 18.0, 90000, date('now','-4 days'), date('now','+6 days'), 0, 'confirmed', 'Vikrant', 'Sankar'),
('PO-2024-1838', NULL, 4, 8, 8000, 60.0, 480000, date('now','-14 days'), date('now','-7 days'), 8000, 'received', 'Sankar', 'Vikrant');

-- GRN RECORDS
INSERT OR IGNORE INTO grn (grn_number, po_id, received_date, received_qty, accepted_qty, rejected_qty, quality_status, received_by) VALUES
('GRN-2024-0421', 8, date('now','-7 days'), 8000, 7840, 160, 'passed', 'Vikrant'),
('GRN-2024-0422', 1, date('now','-1 days'), 25000, 25000, 0, 'passed', 'Vikrant');

-- SUPPLIER CONTRACTS
INSERT OR IGNORE INTO supplier_contracts (supplier_id, material_id, contract_number, start_date, end_date, committed_volume, unit_price, payment_terms, status) VALUES
(7, 1, 'CTR-2024-001', date('now','-180 days'), date('now','+185 days'), 500000, 24.5, 'Net 30', 'active'),
(1, 2, 'CTR-2024-002', date('now','-90 days'), date('now','+275 days'), 200000, 47.0, 'Net 30', 'active'),
(6, 3, 'CTR-2024-003', date('now','-60 days'), date('now','+25 days'), 50000, 80.0, 'Net 15', 'expiring'),
(3, 4, 'CTR-2024-004', date('now','-120 days'), date('now','+245 days'), 1000000, 2.1, 'Net 45', 'active'),
(2, 5, 'CTR-2024-005', date('now','-30 days'), date('now','+335 days'), 20000, 88.0, 'Net 30', 'active');

-- STOCK POSITIONS
INSERT OR IGNORE INTO stock_positions (sku_id, plant_id, on_hand_qty, reserved_qty, in_transit_qty, available_qty, safety_stock, reorder_point, max_stock, avg_daily_demand, days_of_supply) VALUES
(1, 1, 125000, 42000, 0, 83000, 30000, 50000, 200000, 8500, 14.7),
(1, 2, 68000, 22000, 15000, 46000, 25000, 40000, 150000, 6200, 11.0),
(2, 1, 45000, 18000, 0, 27000, 20000, 35000, 120000, 5100, 8.8),
(3, 1, 88000, 35000, 0, 53000, 25000, 45000, 160000, 7200, 12.2),
(4, 1, 32000, 15000, 8000, 17000, 18000, 28000, 100000, 4200, 7.6),
(5, 2, 18000, 8000, 0, 10000, 12000, 20000, 80000, 2800, 6.4),
(7, 1, 210000, 80000, 20000, 130000, 50000, 90000, 400000, 14200, 14.8),
(7, 2, 156000, 62000, 0, 94000, 45000, 80000, 320000, 11800, 13.2),
(8, 1, 98000, 40000, 12000, 58000, 30000, 55000, 200000, 6800, 14.4),
(9, 3, 28000, 12000, 0, 16000, 10000, 18000, 80000, 3200, 8.8),
(10, 3, 8500, 4000, 0, 4500, 5000, 8000, 40000, 1200, 7.1),
(11, 1, 42000, 18000, 0, 24000, 15000, 25000, 100000, 3800, 11.1),
(12, 4, 15000, 8000, 0, 7000, 8000, 12000, 60000, 1800, 8.3);

-- INVENTORY AGING
INSERT OR IGNORE INTO inventory_aging (sku_id, plant_id, batch_number, qty, manufacture_date, expiry_date, days_in_stock, aging_bucket, status) VALUES
(10, 3, 'BTH-2024-0421', 2800, date('now','-82 days'), date('now','+8 days'), 82, '61-90', 'near_expiry'),
(9, 3, 'BTH-2024-0389', 1500, date('now','-71 days'), date('now','+19 days'), 71, '61-90', 'active'),
(4, 1, 'BTH-2024-0445', 4200, date('now','-55 days'), date('now','+125 days'), 55, '31-60', 'active'),
(6, 1, 'BTH-2024-0412', 1800, date('now','-90 days'), date('now','+60 days'), 90, '61-90', 'slow_moving'),
(12, 4, 'BTH-2024-0398', 600, date('now','-95 days'), date('now','+205 days'), 95, '91+', 'dead_stock'),
(1, 1, 'BTH-2024-0466', 125000, date('now','-14 days'), date('now','+166 days'), 14, '0-30', 'active'),
(7, 1, 'BTH-2024-0468', 210000, date('now','-8 days'), date('now','+357 days'), 8, '0-30', 'active');

-- REPLENISHMENT ORDERS
INSERT OR IGNORE INTO replenishment_orders (sku_id, from_plant_id, to_plant_id, qty, trigger_type, status, planned_date) VALUES
(5, 1, 2, 15000, 'reorder_point', 'pending', date('now','+2 days')),
(4, 2, 1, 10000, 'min_max', 'approved', date('now','+1 days')),
(10, NULL, 3, 5000, 'safety_stock', 'pending', date('now','+3 days')),
(12, NULL, 4, 8000, 'manual', 'planned', date('now','+5 days'));

-- SKILLS MATRIX
INSERT OR IGNORE INTO operator_skills (operator_name, plant_id, line_id, skill_name, proficiency_level, certification_date, expiry_date, status) VALUES
('Ravi Kumar', 1, 1, 'PET Line Operation', 'expert', date('now','-365 days'), date('now','+365 days'), 'active'),
('Ravi Kumar', 1, 2, 'PET Line Operation', 'advanced', date('now','-300 days'), date('now','+430 days'), 'active'),
('Ravi Kumar', 1, NULL, 'CIP Operation', 'basic', date('now','-180 days'), date('now','+185 days'), 'active'),
('Priya Sharma', 1, 1, 'PET Line Operation', 'advanced', date('now','-240 days'), date('now','+490 days'), 'active'),
('Priya Sharma', 1, 3, 'Can Line Operation', 'basic', date('now','-90 days'), date('now','+275 days'), 'active'),
('Arjun Singh', 1, 2, 'PET Line Operation', 'basic', date('now','-120 days'), date('now','+245 days'), 'active'),
('Arjun Singh', 1, 3, 'Can Line Operation', 'expert', date('now','-480 days'), date('now','+250 days'), 'active'),
('Meena Patel', 2, 4, 'PET Line Operation', 'advanced', date('now','-200 days'), date('now','+530 days'), 'active'),
('Deepak Rao', 4, 9, 'PET Line Operation', 'expert', date('now','-600 days'), date('now','+130 days'), 'active'),
('Deepak Rao', 4, 10, 'Can Line Operation', 'advanced', date('now','-420 days'), date('now','+310 days'), 'active'),
('Suresh Nair', 1, NULL, 'Food Safety HACCP', 'certified', date('now','-365 days'), date('now','+15 days'), 'expiring'),
('Anjali Desai', 3, 7, 'Water Line Operation', 'expert', date('now','-480 days'), date('now','+250 days'), 'active');

-- SHIFT ROSTER (last 3 days + today)
INSERT OR IGNORE INTO shift_roster (plant_id, line_id, operator_name, shift_date, shift, role, attendance, overtime_hours) VALUES
(1, 1, 'Ravi Kumar', date('now'), 'A', 'operator', 'present', 0),
(1, 1, 'Priya Sharma', date('now'), 'A', 'helper', 'present', 0),
(1, 2, 'Arjun Singh', date('now'), 'A', 'operator', 'absent', 0),
(1, 2, 'Deepak Rao', date('now'), 'A', 'helper', 'present', 0),
(1, 3, 'Suresh Nair', date('now'), 'A', 'operator', 'present', 2),
(1, 1, 'Meena Patel', date('now'), 'B', 'operator', 'present', 0),
(1, 2, 'Ravi Kumar', date('now'), 'B', 'operator', 'present', 1.5),
(2, 4, 'Anjali Desai', date('now'), 'A', 'operator', 'present', 0),
(1, 1, 'Ravi Kumar', date('now','-1 days'), 'A', 'operator', 'present', 0),
(1, 2, 'Arjun Singh', date('now','-1 days'), 'A', 'operator', 'present', 0),
(1, 3, 'Suresh Nair', date('now','-1 days'), 'B', 'operator', 'present', 1),
(1, 1, 'Priya Sharma', date('now','-2 days'), 'A', 'helper', 'absent', 0),
(1, 2, 'Meena Patel', date('now','-2 days'), 'A', 'helper', 'present', 0);

-- DEMAND SUBMISSIONS (S&OP)
INSERT OR IGNORE INTO demand_submissions (period, sku_id, channel, statistical_forecast, sales_input, marketing_input, consensus_qty, final_plan, submitted_by, status) VALUES
('2024-07', 1, 'total', 248000, 265000, 270000, 258000, 258000, 'Sankar', 'approved'),
('2024-07', 2, 'total', 185000, 192000, 188000, 188000, 188000, 'Sankar', 'approved'),
('2024-07', 3, 'total', 132000, 140000, 136000, 136000, 136000, 'Vikrant', 'approved'),
('2024-07', 7, 'total', 420000, 435000, 440000, 432000, 432000, 'Sankar', 'approved'),
('2024-08', 1, 'total', 262000, 280000, 290000, 275000, 275000, 'Sankar', 'draft'),
('2024-08', 2, 'total', 196000, 205000, 200000, 200000, NULL, 'Vikrant', 'submitted'),
('2024-08', 7, 'total', 445000, 460000, 455000, 450000, NULL, 'Sankar', 'submitted'),
('2024-09', 1, 'total', 278000, NULL, NULL, NULL, NULL, 'system', 'draft');

-- SUPPLY PLAN (S&OP)
INSERT OR IGNORE INTO supply_plan (period, plant_id, sku_id, planned_production, constrained_production, demand_plan, gap, gap_pct, status) VALUES
('2024-07', 1, 1, 260000, 248000, 258000, -10000, -3.9, 'approved'),
('2024-07', 2, 1, 80000, 78000, 78000, 0, 0.0, 'approved'),
('2024-07', 1, 2, 190000, 185000, 188000, -3000, -1.6, 'approved'),
('2024-07', 1, 3, 138000, 132000, 136000, -4000, -2.9, 'approved'),
('2024-07', 1, 7, 435000, 425000, 432000, -7000, -1.6, 'approved'),
('2024-08', 1, 1, 278000, 262000, 275000, -13000, -4.7, 'draft'),
('2024-08', 2, 1, 85000, 82000, NULL, NULL, NULL, 'draft'),
('2024-08', 1, 7, 455000, 438000, 450000, -12000, -2.7, 'draft');

-- ACTION ITEMS (S&OP)
INSERT OR IGNORE INTO action_items (module, title, description, owner, due_date, priority, status, created_by) VALUES
('sop', 'Update demand forecast for NE region — spike in institutional channel', 'Sales team to review and update NE region forecast for Jul-Sep before consensus meeting', 'Sankar', date('now','-2 days'), 'high', 'overdue', 'Vikrant'),
('sop', 'Confirm Mumbai Line 2 maintenance window for July', 'Engineering to confirm PM window so supply plan can be updated', 'Vikrant', date('now','+3 days'), 'high', 'open', 'Sankar'),
('sop', 'Resolve CO2 Gas shortage — dual source supplier qualification', 'Procurement to qualify second supplier for CO2 Gas by end of month', 'Sankar', date('now','+7 days'), 'high', 'in_progress', 'Vikrant'),
('sop', 'Submit revised supply plan for Aug S&OP cycle', 'Operations to submit constrained supply plan by Jul 5 for Aug review', 'Vikrant', date('now','+5 days'), 'medium', 'open', 'Sankar'),
('mrp', 'Expedite PO-2024-1843 for Citric Acid — 2 days overdue', 'Contact Gujarat Alkalies and confirm revised delivery date', 'Sankar', date('now','+1 days'), 'high', 'open', 'Vikrant'),
('capacity', 'Schedule Line 2 bearing replacement before peak season', 'Maintenance team to schedule bearing replacement during next planned window', 'Vikrant', date('now','+6 days'), 'high', 'open', 'Sankar'),
('procurement', 'Renew CTR-2024-003 for CO2 Gas before expiry in 25 days', 'Procurement to negotiate and renew contract with Gujarat Alkalies', 'Sankar', date('now','+10 days'), 'high', 'open', 'Vikrant'),
('inventory', 'Review and action slow-moving SKU-006 batch at Mumbai', 'Inventory team to review Orange Fizz aging batch and plan promotional clearance', 'Vikrant', date('now','+4 days'), 'medium', 'open', 'Sankar');

-- S&OP KPIs (update existing or insert new)
INSERT OR IGNORE INTO sop_kpis (category, name, value, target, unit, trend, period) VALUES
('demand', 'Forecast Accuracy', 87.3, 90.0, '%', 'up', 'monthly'),
('demand', 'Demand Plan Adherence', 94.2, 95.0, '%', 'stable', 'monthly'),
('supply', 'Production Plan Adherence', 91.8, 95.0, '%', 'up', 'monthly'),
('supply', 'Capacity Utilization', 78.4, 80.0, '%', 'up', 'monthly'),
('inventory', 'Days of Supply', 24.6, 22.0, 'days', 'down', 'monthly'),
('service', 'OTIF Service Level', 93.4, 95.0, '%', 'up', 'monthly'),
('financial', 'Revenue vs Plan', 101.8, 100.0, '%', 'up', 'monthly'),
('financial', 'Cost per Case', 42.6, 40.0, '₹', 'down', 'monthly'),
('demand', 'Bias Index', -1.8, 0.0, '%', 'stable', 'monthly'),
('service', 'Fill Rate', 96.2, 98.0, '%', 'stable', 'monthly');

-- RECOMMENDATIONS (comprehensive for all modules)
INSERT OR IGNORE INTO recommendations (module, category, title, description, impact, status, estimated_benefit) VALUES
('capacity', 'optimization', 'Rebalance Mumbai PET Line 2 load to Line 1', 'Line 2 at 96.2% utilization — redistribute 15% volume to Line 1. Expected OEE gain: 6.2%.', 'high', 'pending', 'Reduces risk of unplanned downtime saving ~₹18L/month'),
('capacity', 'maintenance', 'Schedule Line 2 bearing replacement this week', 'Vibration sensor shows abnormal bearing wear. Schedule replacement before failure.', 'high', 'pending', 'Prevents 8+ hrs unplanned downtime (₹12L loss)'),
('sequencing', 'optimization', 'Consolidate PET 600ml runs for 2-day blocks', 'Current daily SKU mixing causes 18 changeovers/week. Blocking saves 6.4 hrs/week.', 'high', 'pending', '₹24L annual savings from changeover reduction'),
('mrp', 'procurement', 'Expedite CO2 Gas order — 5-day supply risk', 'Current stock covers 5 days. Expedite PO-1843 immediately.', 'high', 'pending', 'Prevents production stoppage (₹8L/day loss)'),
('mrp', 'planning', 'Qualify second supplier for Citric Acid', 'Single-source dependency creates recurring shortage risk.', 'medium', 'pending', 'Reduces supply disruption risk by 60%'),
('inventory', 'optimization', 'Safety stock adjustment for CSD SKUs pre-summer', 'Increase safety stock for top 5 SKUs before May peak. Current levels inadequate.', 'high', 'pending', '₹4.2Cr revenue protection from stockout prevention'),
('inventory', 'clearance', 'Action Orange Fizz aging batch — 60 days old', 'BTH-2024-0412 approaching slow-moving threshold. Promotional offer recommended.', 'medium', 'pending', 'Prevents ₹3.2L write-off loss'),
('procurement', 'contract', 'Renew CO2 Gas contract CTR-2024-003 expiring in 25 days', 'Auto-renewal not enabled. Risk of buying at spot price.', 'high', 'pending', 'Saves ₹8-12L vs spot pricing'),
('resource', 'workforce', 'Cross-train 8 operators for multi-line capability', 'Current single-skill dependency creates shift coverage gaps.', 'medium', 'pending', 'Reduces shift gap risk by 35%'),
('sop', 'demand', 'Pull-forward summer inventory build by 3 weeks', 'Summer demand spike requires 3-week advance build. Current plan is 2 weeks late.', 'high', 'pending', '₹2.5Cr revenue protection from service level maintenance'),
('sop', 'planning', 'Close supply-demand gap for Aug — 4.7% shortfall', 'Aug plan shows 13,000 case shortfall on SKU001. Activate backup production.', 'high', 'pending', 'Protects ₹1.8Cr revenue');
