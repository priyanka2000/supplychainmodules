-- =============================================================================
-- SYDIAI Supply Planning Suite — Comprehensive Seed Data v4 (schema-aligned)
-- =============================================================================

-- Plants
INSERT OR IGNORE INTO plants (id,plant_code,plant_name,location,region,plant_type,installed_capacity,capacity_units,status) VALUES
(1,'PLT001','Mumbai Central','Mumbai, Maharashtra','West','owned',850,'tons/day','active'),
(2,'PLT002','Delhi North','Delhi, NCR','North','owned',720,'tons/day','active'),
(3,'PLT003','Chennai South','Chennai, Tamil Nadu','South','owned',680,'tons/day','active'),
(4,'PLT004','Kolkata East','Kolkata, West Bengal','East','owned',540,'tons/day','active'),
(5,'PLT005','Bangalore Tech','Bangalore, Karnataka','South','owned',620,'tons/day','active'),
(6,'PLT006','Hyderabad Hub','Hyderabad, Telangana','South','contract',480,'tons/day','active');

-- Production Lines
INSERT OR IGNORE INTO production_lines (id,plant_id,line_code,line_name,line_type,capacity_per_day,line_speed,efficiency_pct,status) VALUES
(1,1,'MUM-L1','Mumbai PET Line 1','PET',180,24000,88,'active'),
(2,1,'MUM-L2','Mumbai PET Line 2','PET',200,26000,92,'active'),
(3,2,'DEL-L1','Delhi PET Line 1','PET',160,21000,78,'active'),
(4,2,'DEL-L2','Delhi Glass Line 1','Glass',120,16000,85,'active'),
(5,3,'CHN-L1','Chennai PET Line 1','PET',150,20000,82,'active'),
(6,3,'CHN-L2','Chennai Aseptic Line','Aseptic',100,12000,90,'active'),
(7,4,'KOL-L1','Kolkata PET Line 1','PET',130,17000,80,'active'),
(8,4,'KOL-L2','Kolkata Can Line','Cans',80,10000,75,'active'),
(9,5,'BLR-L1','Bangalore PET Line 1','PET',140,18500,87,'active'),
(10,5,'BLR-L2','Bangalore Pouches Line','Pouches',60,8000,83,'active'),
(11,6,'HYD-L1','Hyderabad PET Line 1','PET',120,15500,79,'active'),
(12,6,'HYD-L2','Hyderabad Glass Line','Glass',90,11000,84,'active');

-- SKUs
INSERT OR IGNORE INTO skus (id,sku_code,sku_name,brand,category,pack_type,pack_size,shelf_life_days,unit_of_measure,abc_classification,production_rate,cost_per_unit,status) VALUES
(1,'SKU001','AquaPure 500ml PET','AquaPure','Water','PET','500ml',365,'cases','A',1200,45.50,'active'),
(2,'SKU002','AquaPure 1L PET','AquaPure','Water','PET','1L',365,'cases','A',900,68.00,'active'),
(3,'SKU003','FruitBurst Orange 300ml','FruitBurst','Juices','PET','300ml',180,'cases','A',800,72.00,'active'),
(4,'SKU004','FruitBurst Mango 300ml','FruitBurst','Juices','PET','300ml',180,'cases','A',750,74.00,'active'),
(5,'SKU005','CoolSip Lemon 500ml','CoolSip','CSD','PET','500ml',270,'cases','B',600,62.00,'active'),
(6,'SKU006','CoolSip Cola 2L','CoolSip','CSD','PET','2L',270,'cases','B',400,95.00,'active'),
(7,'SKU007','HealthPlus Coconut 200ml','HealthPlus','Health','Aseptic','200ml',120,'cases','B',500,88.00,'active'),
(8,'SKU008','SportZone Energy 250ml','SportZone','Energy','Cans','250ml',365,'cases','B',350,110.00,'active'),
(9,'SKU009','NatureFresh Green Tea 500ml','NatureFresh','RTD Tea','PET','500ml',150,'cases','C',300,95.00,'active'),
(10,'SKU010','AquaPure 5L Jug','AquaPure','Water','PET','5L',365,'cases','C',200,145.00,'active'),
(11,'SKU011','CoolSip Orange 330ml Can','CoolSip','CSD','Cans','330ml',365,'cases','A',700,78.00,'active'),
(12,'SKU012','HealthPlus Aloe 300ml Glass','HealthPlus','Health','Glass','300ml',90,'cases','C',150,125.00,'active');

-- Capacity KPI Metrics
INSERT OR IGNORE INTO cap_kpi_metrics (metric_name,metric_value,metric_unit,metric_category,metric_status,target_value,period) VALUES
('Overall Line Utilization',72.4,'%','utilization','warning',80,'current'),
('Peak Line Utilization',96.8,'%','utilization','critical',90,'current'),
('Order Fill Rate',94.8,'%','service','warning',98,'current'),
('OTIF Service Level',92.1,'%','service','warning',95,'current'),
('OEE',71.8,'%','efficiency','warning',75,'current'),
('Bottleneck Lines',3,'count','risk','warning',1,'current'),
('Changeover Loss Hours',18.4,'hrs/day','efficiency','warning',10,'current'),
('Maintenance Compliance',88.0,'%','reliability','warning',95,'current'),
('Downtime Rate',4.2,'%','reliability','warning',2,'current'),
('Capacity Forecast Next Week',78.6,'%','planning','healthy',80,'next_week');

-- Capacity Utilization
INSERT OR IGNORE INTO capacity_utilization (plant_id,line_id,date,available_hours,utilized_hours,idle_hours,overtime_hours,utilization_pct) VALUES
(1,1,'2026-02-19',24,19.2,4.8,0,80.0),(1,1,'2026-02-20',24,20.4,3.6,0,85.0),(1,1,'2026-02-21',24,18.0,6.0,0,75.0),
(1,1,'2026-02-22',24,21.6,2.4,0,90.0),(1,1,'2026-02-23',24,22.8,0,0.8,95.0),(1,1,'2026-02-24',24,17.0,7.0,0,70.8),
(1,1,'2026-02-25',24,19.6,4.4,0,81.7),(1,2,'2026-02-19',24,22.5,1.5,0,93.8),(1,2,'2026-02-20',24,23.0,1.0,0,95.8),
(1,2,'2026-02-21',24,21.0,3.0,0,87.5),(1,2,'2026-02-22',24,23.3,0.7,0,97.1),(1,2,'2026-02-23',24,24.0,0,1.5,100.0),
(1,2,'2026-02-24',24,20.0,4.0,0,83.3),(1,2,'2026-02-25',24,22.0,2.0,0,91.7),
(2,3,'2026-02-19',24,16.8,7.2,0,70.0),(2,3,'2026-02-20',24,17.5,6.5,0,72.9),(2,3,'2026-02-21',24,15.0,9.0,0,62.5),
(2,3,'2026-02-22',24,18.2,5.8,0,75.8),(2,3,'2026-02-23',24,19.0,5.0,0,79.2),(2,3,'2026-02-24',24,16.0,8.0,0,66.7),
(2,3,'2026-02-25',24,17.0,7.0,0,70.8),
(3,5,'2026-02-19',24,17.5,6.5,0,72.9),(3,5,'2026-02-20',24,18.8,5.2,0,78.3),(3,5,'2026-02-21',24,16.0,8.0,0,66.7),
(3,5,'2026-02-22',24,19.2,4.8,0,80.0),(3,5,'2026-02-23',24,20.0,4.0,0,83.3),(3,5,'2026-02-24',24,15.5,8.5,0,64.6),
(3,5,'2026-02-25',24,18.0,6.0,0,75.0);

-- Bottlenecks
INSERT OR IGNORE INTO bottlenecks (line_id,bottleneck_type,severity,description,detected_at) VALUES
(2,'Over-utilization','critical','Mumbai PET Line 2 running at 97%+ for 5 consecutive days.','2026-02-23 08:00:00'),
(3,'Under-utilization','medium','Delhi PET Line 1 at 67% utilization.','2026-02-21 14:00:00'),
(5,'Changeover Loss','medium','Chennai PET Line 1 - 4+ hour changeovers.','2026-02-22 10:00:00'),
(8,'Capacity Constraint','high','Kolkata Can Line at full capacity.','2026-02-24 09:00:00');

-- Jobs (schema: job_number,sku_id,quantity,priority,due_date,status,assigned_line_id,scheduled_start,scheduled_end,actual_start,actual_end,delay_minutes)
INSERT OR IGNORE INTO jobs (job_number,sku_id,quantity,priority,due_date,status,assigned_line_id,scheduled_start,scheduled_end,actual_start,delay_minutes) VALUES
('JOB-2026-001',1,50000,1,'2026-02-26','in_progress',1,'2026-02-25 06:00','2026-02-25 18:00','2026-02-25 06:05',5),
('JOB-2026-002',2,30000,2,'2026-02-26','scheduled',1,'2026-02-25 18:00','2026-02-26 06:00',NULL,0),
('JOB-2026-003',3,45000,1,'2026-02-26','in_progress',2,'2026-02-25 04:00','2026-02-25 16:00','2026-02-25 04:10',10),
('JOB-2026-004',4,35000,2,'2026-02-27','scheduled',2,'2026-02-26 06:00','2026-02-26 14:00',NULL,0),
('JOB-2026-005',5,25000,3,'2026-02-28','pending',3,'2026-02-27 08:00','2026-02-27 16:00',NULL,0),
('JOB-2026-006',6,20000,2,'2026-02-27','scheduled',3,'2026-02-26 14:00','2026-02-27 02:00',NULL,0),
('JOB-2026-007',7,15000,2,'2026-02-28','pending',6,'2026-02-27 06:00','2026-02-27 18:00',NULL,0),
('JOB-2026-008',11,28000,1,'2026-02-26','in_progress',8,'2026-02-25 08:00','2026-02-25 20:00','2026-02-25 08:30',30),
('JOB-2026-009',8,22000,2,'2026-02-27','scheduled',8,'2026-02-26 08:00','2026-02-26 20:00',NULL,0),
('JOB-2026-010',1,40000,1,'2026-02-27','scheduled',9,'2026-02-26 06:00','2026-02-26 18:00',NULL,0),
('JOB-2026-011',3,32000,2,'2026-02-28','pending',5,'2026-02-27 08:00','2026-02-28 02:00',NULL,0),
('JOB-2026-012',9,12000,3,'2026-03-01','pending',10,'2026-02-28 08:00','2026-02-28 16:00',NULL,0);

-- Setup Matrix (schema: from_sku_id,to_sku_id,setup_time_minutes)
INSERT OR IGNORE INTO setup_matrix (from_sku_id,to_sku_id,setup_time_minutes) VALUES
(1,2,15),(1,3,45),(1,4,45),(1,5,60),(2,1,15),(2,3,45),(2,4,50),(3,4,20),(3,1,50),(4,3,20),(4,5,60),(5,6,25),(5,1,55),(6,5,25),(8,11,30),(11,8,30);

-- Raw Materials (schema: material_code,material_name,material_type,shelf_life_days,unit_of_measure,abc_classification,current_stock,reorder_point,status)
INSERT OR IGNORE INTO raw_materials (material_code,material_name,material_type,shelf_life_days,unit_of_measure,abc_classification,current_stock,reorder_point,status) VALUES
('RM001','PET Resin 500ml Grade','Packaging',365,'MT','A',450,200,'active'),
('RM002','PET Resin 1L Grade','Packaging',365,'MT','A',280,150,'active'),
('RM003','HDPE Cap 28mm','Packaging',730,'000 units','A',8500,3000,'active'),
('RM004','Orange Concentrate','Raw Material',90,'KG','A',2200,800,'active'),
('RM005','Mango Concentrate','Raw Material',90,'KG','A',1800,700,'active'),
('RM006','Citric Acid','Chemical',365,'KG','B',850,300,'active'),
('RM007','Preservative E211','Chemical',730,'KG','B',320,100,'active'),
('RM008','Label Film 500ml','Packaging',365,'Rolls','A',1200,400,'active'),
('RM009','Label Film 1L','Packaging',365,'Rolls','B',680,250,'active'),
('RM010','Secondary Carton 24pk','Packaging',365,'000 units','A',3200,1200,'active'),
('RM011','Can Body 250ml','Packaging',365,'000 units','A',5800,2000,'active'),
('RM012','Can Lid 250ml','Packaging',365,'000 units','A',5600,2000,'active'),
('RM013','Glass Bottle 300ml','Packaging',365,'000 units','B',1200,400,'active'),
('RM014','Crown Cork','Packaging',365,'000 units','B',4500,1500,'active'),
('RM015','Sugar Food Grade','Raw Material',365,'MT','A',380,120,'active'),
('RM016','Aseptic Carton 200ml','Packaging',180,'000 units','B',2800,800,'active');

-- BOM (schema: sku_id,material_id,quantity_per_unit,waste_percentage,version)
INSERT OR IGNORE INTO bom (sku_id,material_id,quantity_per_unit,waste_percentage,version) VALUES
(1,1,0.032,2.0,'v1'),(1,3,1.02,2.0,'v1'),(1,8,1.0,1.0,'v1'),(1,6,0.0005,5.0,'v1'),(1,10,0.042,1.0,'v1'),
(2,2,0.064,2.0,'v1'),(2,3,1.02,2.0,'v1'),(2,9,1.0,1.0,'v1'),(2,6,0.001,5.0,'v1'),(2,10,0.042,1.0,'v1'),
(3,1,0.022,2.0,'v1'),(3,4,0.085,3.0,'v1'),(3,3,1.02,2.0,'v1'),(3,8,1.0,1.0,'v1'),(3,6,0.0008,5.0,'v1'),
(4,1,0.022,2.0,'v1'),(4,5,0.090,3.0,'v1'),(4,3,1.02,2.0,'v1'),(4,8,1.0,1.0,'v1'),(4,6,0.0008,5.0,'v1'),
(5,1,0.030,2.0,'v1'),(5,3,1.02,2.0,'v1'),(5,8,1.0,1.0,'v1'),(5,15,0.010,2.0,'v1'),(5,6,0.0005,5.0,'v1'),
(8,11,1.0,1.0,'v1'),(8,12,1.0,1.0,'v1'),(8,4,0.040,3.0,'v1'),(8,15,0.012,2.0,'v1'),
(11,11,1.0,1.0,'v1'),(11,12,1.0,1.0,'v1'),(11,15,0.014,2.0,'v1'),(11,6,0.0004,5.0,'v1'),
(12,13,1.0,1.0,'v1'),(12,14,1.0,1.0,'v1'),(12,4,0.055,3.0,'v1'),(12,6,0.001,5.0,'v1');

-- MRP Alerts (schema: alert_type,severity,material_id,sku_id,message,recommended_action,status)
INSERT OR IGNORE INTO mrp_alerts (alert_type,severity,sku_id,material_id,message,recommended_action,status) VALUES
('Stock Out Risk','critical',3,4,'Orange Concentrate below safety stock threshold. Demand surge projected. Lead time 14 days.','Raise emergency PO for 1000 KG from SUP002','open'),
('Lead Time Breach','high',1,1,'PET Resin 500ml - supplier confirmed 10-day delay. JOB-2026-001 at risk.','Expedite alternate supplier quotation','open'),
('BOM Change Pending','medium',7,16,'HealthPlus Coconut BOM version change approval pending.','Route to quality team for approval','open'),
('Excess Stock','medium',NULL,10,'Secondary Carton 24pk - 2+ weeks excess vs consumption.','Pause next PO cycle','open'),
('Price Variance','low',NULL,5,'Mango Concentrate spot price up 18% vs standard.','Review contract terms with supplier','open'),
('Supplier Risk','high',NULL,11,'Can Body 250ml - primary supplier on credit hold. 3 weeks stock only.','Activate secondary supplier immediately','open');

-- Suppliers (schema: name,location,capacity,rating,reliability_score,lead_time_days,is_sustainable,risk_level)
INSERT OR IGNORE INTO suppliers (id,name,location,capacity,rating,reliability_score,lead_time_days,is_sustainable,risk_level) VALUES
(1,'IndoPlast Industries','Mumbai',5000,4.2,88,7,1,'low'),
(2,'Citrus India Ltd','Pune',800,4.5,92,14,1,'low'),
(3,'GlobalFlavors Co','Bangalore',1200,3.8,79,18,0,'medium'),
(4,'PetroPlastics Ltd','Chennai',3500,4.0,85,8,0,'medium'),
(5,'CanTech Solutions','Delhi',8000,4.3,90,10,1,'low'),
(6,'AlterCans India','Hyderabad',4000,3.5,75,12,0,'high'),
(7,'SweetSource Ltd','Kolkata',2000,4.1,87,5,0,'low'),
(8,'AgroConcentrates','Nagpur',600,3.2,70,21,0,'high');

-- Scenarios (schema: module,name,description,driver,status,is_baseline)
INSERT OR IGNORE INTO scenarios (module,name,description,driver,status,is_baseline) VALUES
('capacity','Base Plan FY2026','Current demand with existing capacity. No new investments.','Current demand','active',1),
('capacity','Mumbai Expansion','Add 1 new PET line at Mumbai by Q3. CapEx ₹8.5Cr.','Growth demand','draft',0),
('capacity','Outsourcing Delhi','Contract 30% Delhi volume to co-packers.','Cost optimization','draft',0),
('sequencing','Standard Sequence','Default FCFS with priority override.','Priority','active',1),
('sequencing','Cost Optimal','Minimize changeover + overtime. Reduces cost 8.4%.','Cost','draft',0),
('sequencing','OTD Maximized','Maximize on-time delivery. Improves OTD 12%.','Service','draft',0),
('sop','Consensus Plan Mar-2026','Monthly S&OP consensus. Finalized Feb 28.','Consensus','active',1),
('sop','Upside +15%','Demand upside 15% for Mar-Apr. Supply constrained at Mumbai.','Growth','draft',0),
('sop','Downside -10%','Market slowdown scenario. Inventory build risk.','Risk','draft',0);

-- Demand Forecast (schema: sku_id,material_id,location,period,forecast_qty,actual_qty,confidence_level,forecast_type)
INSERT OR IGNORE INTO demand_forecast (sku_id,location,period,forecast_qty,confidence_level,forecast_type) VALUES
(1,'Mumbai','2026-03',1200000,0.88,'baseline'),
(2,'Mumbai','2026-03',850000,0.85,'baseline'),
(3,'Mumbai','2026-03',750000,0.80,'baseline'),
(4,'Mumbai','2026-03',680000,0.82,'baseline'),
(1,'Delhi','2026-03',980000,0.86,'baseline'),
(3,'Delhi','2026-03',620000,0.79,'baseline'),
(5,'Chennai','2026-03',540000,0.81,'baseline'),
(1,'All India','2026-03',4800000,0.87,'consolidated'),
(3,'All India','2026-03',2900000,0.82,'consolidated'),
(11,'All India','2026-03',2200000,0.84,'consolidated'),
(1,'All India','2026-04',5100000,0.80,'baseline'),
(1,'All India','2026-05',5400000,0.75,'baseline'),
(1,'All India','2026-06',5800000,0.72,'baseline');

-- S&OP KPIs (schema: category,name,value,target,unit,trend,period)
INSERT OR IGNORE INTO sop_kpis (category,name,value,target,unit,trend,period) VALUES
('Demand','Forecast Accuracy',87.3,90,'%','down','2026-03'),
('Demand','Demand Variability CV',0.28,0.15,'ratio','up','2026-03'),
('Supply','Supply Fill Rate',94.1,98,'%','up','2026-03'),
('Supply','Production Adherence',91.5,95,'%','up','2026-03'),
('Inventory','Finished Goods DOI',18.4,15,'days','down','2026-03'),
('Inventory','RM Coverage Days',22,21,'days','stable','2026-03'),
('Financial','Revenue Plan Attainment',96.2,100,'%','up','2026-03'),
('Financial','Gross Margin',38.5,40,'%','down','2026-03'),
('Service','OTIF',92.1,95,'%','up','2026-03'),
('Service','Order Fill Rate',94.8,98,'%','up','2026-03');

-- Recommendations (schema: module,category,title,description,impact,status,estimated_benefit)
INSERT OR IGNORE INTO recommendations (module,category,title,description,impact,status,estimated_benefit) VALUES
('capacity','Optimization','Rebalance Mumbai Lines','Shift 15% of MUM-L2 load to MUM-L1. Reduces L2 from 97% to 82%.','high','open',850000),
('sequencing','Scheduling','Optimize CHN-L1 Sequence','Reorder: 1→5→3→4 saves 38 min/cycle. Annual saving ₹3.8L.','high','open',380000),
('mrp','Procurement','Emergency PO Orange Concentrate','Raise PO for 1000 KG from SUP002. 14-day lead time risk.','critical','open',1200000),
('inventory','Replenishment','Reorder PET Resin 500ml','Upcoming demand spike. Early reorder recommended.','medium','open',200000),
('procurement','Supplier','Activate Secondary Can Supplier','SUP005 credit hold. Activate SUP006 immediately.','critical','open',2400000),
('resource','Workforce','Address Overtime Breach Mumbai','Mumbai operators at 45+ hrs/week. Hire or contract workers.','high','open',320000),
('sop','Planning','Close Demand-Supply Gap','Supply short 180K cases vs Mar demand. Approve overtime.','high','open',4500000),
('capacity','Maintenance','Schedule PM DEL-L1','72+ hours without PM. Book 4-hour window this weekend.','medium','open',150000);

-- OEE Data (schema: line_id,date,availability_pct,performance_pct,quality_pct,oee_pct,planned_downtime_hrs,unplanned_downtime_hrs,changeover_hrs)
INSERT OR IGNORE INTO oee_data (line_id,date,availability_pct,performance_pct,quality_pct,oee_pct,planned_downtime_hrs,unplanned_downtime_hrs,changeover_hrs) VALUES
(1,'2026-02-25',88,92,96,77.6,1.0,0.5,0.75),(2,'2026-02-25',95,94,98,87.4,0,0.5,0.5),
(3,'2026-02-25',78,88,97,66.6,2.0,0.5,0),(5,'2026-02-25',82,90,97,71.6,1.0,0.8,1.33),
(8,'2026-02-25',83,91,98,74.0,0,1.0,0.5),(9,'2026-02-25',87,92,97,77.6,1.0,0.3,0.5),
(1,'2026-02-24',86,91,96,75.1,1.0,0.7,0.75),(2,'2026-02-24',94,93,98,85.6,0,0.3,0.5),
(1,'2026-02-23',90,93,96,80.5,0.5,0.3,0.5),(2,'2026-02-23',96,95,98,89.3,0,0.2,0.5),
(3,'2026-02-24',80,87,97,67.5,2.0,0.5,0),(5,'2026-02-24',84,89,97,72.5,1.0,0.5,1.33);

-- Stock Positions (schema: sku_id,plant_id,on_hand_qty,reserved_qty,in_transit_qty,available_qty,safety_stock,reorder_point,max_stock,avg_daily_demand,days_of_supply,last_updated)
INSERT OR IGNORE INTO stock_positions (sku_id,plant_id,on_hand_qty,reserved_qty,in_transit_qty,available_qty,safety_stock,reorder_point,max_stock,avg_daily_demand,days_of_supply,last_updated) VALUES
(1,1,85000,20000,15000,80000,15000,30000,200000,4000,21.3,'2026-02-25'),
(2,1,42000,12000,8000,38000,8000,16000,120000,2500,16.8,'2026-02-25'),
(3,1,28000,8000,5000,25000,6000,12000,90000,2800,10.0,'2026-02-25'),
(4,2,31000,9000,6000,28000,6500,13000,95000,2600,11.9,'2026-02-25'),
(5,3,22000,7000,4000,19000,5000,10000,70000,2000,11.0,'2026-02-25'),
(11,4,38000,11000,8000,35000,8000,16000,110000,2800,13.6,'2026-02-25'),
(8,4,15000,5000,3000,13000,4000,8000,50000,1200,12.5,'2026-02-25'),
(1,2,62000,18000,10000,54000,12000,25000,180000,3500,17.7,'2026-02-25'),
(7,3,18000,6000,2000,14000,4500,9000,60000,1500,12.0,'2026-02-25'),
(6,5,25000,8000,4000,21000,5500,11000,75000,1800,13.9,'2026-02-25');

-- Resource Capacity (schema: plant_id,line_id,capacity_date,available_hours,maintenance_hours,utilization_pct)
INSERT OR IGNORE INTO resource_capacity (plant_id,line_id,capacity_date,available_hours,maintenance_hours,utilization_pct) VALUES
(1,1,'2026-02-25',24,1,80.0),(1,2,'2026-02-25',24,0,93.8),
(2,3,'2026-02-25',24,2,70.0),(3,5,'2026-02-25',24,1,72.9),
(4,8,'2026-02-25',24,0,83.3),(5,9,'2026-02-25',24,1,79.2);

-- Action Items (schema: module,title,description,owner,due_date,priority,status,created_by)
INSERT OR IGNORE INTO action_items (module,title,description,owner,due_date,priority,status,created_by) VALUES
('sop','Finalize March Consensus Plan','Review and finalize demand-supply consensus for March 2026','Sankar Iyer','2026-03-01','high','in_progress','Sankar Iyer'),
('mrp','Raise Emergency PO Orange Conc','Issue emergency PO to SUP002 for 1000 KG orange concentrate','Vikrant Nair','2026-03-02','critical','open','Vikrant Nair'),
('capacity','Schedule PM DEL-L1','Book 4-hour maintenance window for Delhi L1 this weekend','Vikrant Nair','2026-03-08','medium','open','Sankar Iyer'),
('procurement','Activate SUP006','Contact AlterCans India for emergency can body supply','Vikrant Nair','2026-03-02','critical','open','Vikrant Nair'),
('sequencing','Resequence CHN-L1 Jobs','Update job queue for Chennai L1 to optimal flavour sequence','Sankar Iyer','2026-03-05','high','open','Sankar Iyer'),
('resource','Post Overtime Policy Update','Publish updated overtime guidelines and headcount request','Sankar Iyer','2026-03-08','medium','open','Sankar Iyer');

-- Audit Log (schema: user_name,module,action,entity_type,entity_id,old_value,new_value,ip_address)
INSERT OR IGNORE INTO audit_log (user_name,module,action,entity_type,entity_id,old_value,new_value,ip_address) VALUES
('Vikrant Nair','sequencing','UPDATE','job',1,'status:pending','status:in_progress','10.0.0.1'),
('Sankar Iyer','mrp','CREATE','mrp_alert',6,'null','alert:can_supply_risk','10.0.0.2'),
('Vikrant Nair','capacity','UPDATE','bottleneck',1,'severity:high','severity:critical','10.0.0.1'),
('Sankar Iyer','procurement','APPROVE','procurement_plan',1,'status:draft','status:approved','10.0.0.2'),
('Vikrant Nair','sop','UPDATE','sop_kpi',1,'value:85.1','value:87.3','10.0.0.1');
