// Global mock fallback dataset for empty/failed API responses
(function () {
  'use strict';

  function getTimeSeriesData() {
    return [
      { period: 'W1 Jan', week: 'W1', month: 'Jan', demand: 1045000, supply: 1012000, otif: 91.2 },
      { period: 'W2 Jan', week: 'W2', month: 'Jan', demand: 1082000, supply: 1059000, otif: 91.8 },
      { period: 'W3 Jan', week: 'W3', month: 'Jan', demand: 1104000, supply: 1073000, otif: 92.4 },
      { period: 'W4 Jan', week: 'W4', month: 'Jan', demand: 1127000, supply: 1095000, otif: 92.9 },
      { period: 'W1 Feb', week: 'W1', month: 'Feb', demand: 1169000, supply: 1128000, otif: 93.3 },
      { period: 'W2 Feb', week: 'W2', month: 'Feb', demand: 1184000, supply: 1149000, otif: 93.6 },
      { period: 'W3 Feb', week: 'W3', month: 'Feb', demand: 1210000, supply: 1176000, otif: 93.9 },
      { period: 'W4 Feb', week: 'W4', month: 'Feb', demand: 1238000, supply: 1201000, otif: 94.2 },
      { period: 'W1 Mar', week: 'W1', month: 'Mar', demand: 1262000, supply: 1229000, otif: 94.6 },
      { period: 'W2 Mar', week: 'W2', month: 'Mar', demand: 1287000, supply: 1255000, otif: 94.9 },
      { period: 'W3 Mar', week: 'W3', month: 'Mar', demand: 1313000, supply: 1277000, otif: 95.1 },
      { period: 'W4 Mar', week: 'W4', month: 'Mar', demand: 1339000, supply: 1306000, otif: 95.3 }
    ];
  }

  function getMRPData() {
    return {
      kpis: [
        { name: 'Open MRP Alerts', value: 9, unit: '', target: 5, status: 'warning' },
        { name: 'Critical Shortages', value: 2, unit: '', target: 0, status: 'critical' },
        { name: 'Below Reorder Point', value: 7, unit: '', target: 3, status: 'warning' },
        { name: 'Active Suppliers', value: 8, unit: '', target: 8, status: 'healthy' },
        { name: 'PO On-Time Delivery', value: 92.4, unit: '%', target: 95, status: 'warning' },
        { name: 'MRP Coverage', value: 18.6, unit: 'days', target: 21, status: 'warning' }
      ],
      alerts: [
        { id: 1, alert_type: 'shortage', severity: 'high', material_name: 'CO2 Gas', message: 'Projected shortage in W2 at MUM plant', recommended_action: 'Release emergency PO', status: 'open' },
        { id: 2, alert_type: 'shortage', severity: 'high', material_name: 'Orange Concentrate', message: 'Coverage drops below 3 days in W3', recommended_action: 'Advance supplier dispatch', status: 'open' },
        { id: 3, alert_type: 'reorder', severity: 'medium', material_name: 'PET Resin 500ml', message: 'Stock trending below reorder point', recommended_action: 'Create planned order', status: 'acknowledged' },
        { id: 4, alert_type: 'expiry_risk', severity: 'low', material_name: 'Natural Flavour Base', message: 'Batch expires in 21 days', recommended_action: 'Prioritize in production plan', status: 'open' },
        { id: 5, alert_type: 'reorder', severity: 'medium', material_name: 'Can Body 250ml', message: 'Reorder due in 5 days', recommended_action: 'Issue RFQ to approved vendor', status: 'open' }
      ],
      materials: [
        { id: 1, material_name: 'CO2 Gas', material_code: 'RM-CO2-01', material_type: 'Gas', current_stock: 28, reorder_point: 30, unit_of_measure: 'MT', abc_classification: 'A', shelf_life_days: 120 },
        { id: 2, material_name: 'Sugar Food Grade', material_code: 'RM-SUG-04', material_type: 'Sweetener', current_stock: 91000, reorder_point: 65000, unit_of_measure: 'kg', abc_classification: 'A', shelf_life_days: 180 },
        { id: 3, material_name: 'PET Resin 500ml', material_code: 'RM-PET-50', material_type: 'Packaging', current_stock: 118000, reorder_point: 125000, unit_of_measure: 'kg', abc_classification: 'A', shelf_life_days: 365 },
        { id: 4, material_name: 'PET Resin 1L', material_code: 'RM-PET-1L', material_type: 'Packaging', current_stock: 98000, reorder_point: 82000, unit_of_measure: 'kg', abc_classification: 'A', shelf_life_days: 365 },
        { id: 5, material_name: 'Mango Concentrate', material_code: 'RM-MNG-09', material_type: 'Flavor', current_stock: 36000, reorder_point: 30000, unit_of_measure: 'kg', abc_classification: 'B', shelf_life_days: 240 },
        { id: 6, material_name: 'Orange Concentrate', material_code: 'RM-ORG-11', material_type: 'Flavor', current_stock: 22000, reorder_point: 26000, unit_of_measure: 'kg', abc_classification: 'B', shelf_life_days: 210 },
        { id: 7, material_name: 'Can Body 250ml', material_code: 'RM-CAN-25', material_type: 'Packaging', current_stock: 54000, reorder_point: 60000, unit_of_measure: 'pcs', abc_classification: 'B', shelf_life_days: 720 },
        { id: 8, material_name: 'HDPE Cap 28mm', material_code: 'RM-CAP-28', material_type: 'Packaging', current_stock: 84000, reorder_point: 70000, unit_of_measure: 'pcs', abc_classification: 'C', shelf_life_days: 540 }
      ],
      runResult: { suggested_pos: 4, critical_shortages: 2, net_requirements: [{ week: 'W2', sku: 'SKU-MNG-200', qty: 12000 }, { week: 'W3', sku: 'SKU-ORG-500', qty: 9800 }] }
    };
  }

  function getNetworkData() {
    return {
      nodes: [
        { hub: 'Mumbai Mega Hub', plant: 'MUM', lane_count: 42, outbound_cases_wk: 480000, utilization: 87, otif: 91.2 },
        { hub: 'Delhi Primary DC', plant: 'DEL', lane_count: 31, outbound_cases_wk: 360000, utilization: 79, otif: 93.4 },
        { hub: 'Chennai Regional DC', plant: 'CHN', lane_count: 24, outbound_cases_wk: 280000, utilization: 83, otif: 89.8 },
        { hub: 'Bangalore Tech DC', plant: 'BLR', lane_count: 27, outbound_cases_wk: 310000, utilization: 88, otif: 90.6 }
      ],
      lanes: [
        { lane_id: 'MUM-PUN', origin: 'Mumbai', destination: 'Pune', mode: 'Road', transit_hr: 6, cost_per_case: 16.4 },
        { lane_id: 'MUM-SUR', origin: 'Mumbai', destination: 'Surat', mode: 'Road', transit_hr: 9, cost_per_case: 18.2 },
        { lane_id: 'DEL-JAI', origin: 'Delhi', destination: 'Jaipur', mode: 'Road', transit_hr: 7, cost_per_case: 15.8 },
        { lane_id: 'CHN-BLR', origin: 'Chennai', destination: 'Bangalore', mode: 'Road', transit_hr: 8, cost_per_case: 17.1 }
      ],
      trend: getTimeSeriesData().map(t => ({ period: t.period, otd: t.otif, volume: Math.round(t.supply / 4) }))
    };
  }

  function getForecastData() {
    return getTimeSeriesData().map((t, i) => ({
      period: t.period,
      sku: ['SKU-PET500', 'SKU-PET1L', 'SKU-MNG200', 'SKU-ORG500'][i % 4],
      plant: ['MUM', 'DEL', 'CHN'][i % 3],
      forecast_qty: t.demand,
      actual_qty: i < 9 ? t.supply : null,
      confidence_level: 0.8 + ((i % 4) * 0.04)
    }));
  }

  function getATPData() {
    return [
      { sku: 'SKU-PET500', plant: 'MUM', atp_qty: 185000, allocated_qty: 142000, available_to_promise: 43000, week: 'W1 Apr' },
      { sku: 'SKU-PET1L', plant: 'DEL', atp_qty: 132000, allocated_qty: 106000, available_to_promise: 26000, week: 'W1 Apr' },
      { sku: 'SKU-MNG200', plant: 'CHN', atp_qty: 98000, allocated_qty: 91000, available_to_promise: 7000, week: 'W1 Apr' },
      { sku: 'SKU-ORG500', plant: 'MUM', atp_qty: 76000, allocated_qty: 69000, available_to_promise: 7000, week: 'W1 Apr' }
    ];
  }

  function getPOData() {
    return [
      { po_number: 'PO-2026-1101', material_name: 'PET Resin 500ml', supplier_name: 'IndoPlast Industries', planned_qty: 120000, planned_cost: 11400000, period: '2026-03', status: 'approved' },
      { po_number: 'PO-2026-1102', material_name: 'Mango Concentrate', supplier_name: 'GlobalFlavors Co', planned_qty: 32000, planned_cost: 4000000, period: '2026-03', status: 'pending' },
      { po_number: 'PO-2026-1103', material_name: 'Sugar Food Grade', supplier_name: 'SweetSource Ltd', planned_qty: 55000, planned_cost: 5610000, period: '2026-03', status: 'executed' },
      { po_number: 'PO-2026-1104', material_name: 'Can Body 250ml', supplier_name: 'CanTech Solutions', planned_qty: 22000, planned_cost: 2530000, period: '2026-04', status: 'draft' },
      { po_number: 'PO-2026-1105', material_name: 'HDPE Cap 28mm', supplier_name: 'IndoPlast Industries', planned_qty: 45000, planned_cost: 3240000, period: '2026-04', status: 'approved' }
    ];
  }

  window.getTimeSeriesData = getTimeSeriesData;
  window.getMRPData = getMRPData;
  window.getNetworkData = getNetworkData;
  window.getForecastData = getForecastData;
  window.getATPData = getATPData;
  window.getPOData = getPOData;
})();
