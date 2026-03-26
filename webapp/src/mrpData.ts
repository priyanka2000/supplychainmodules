// ============================================================
// MRP Mock Data Store – single source of truth for all modules
// ============================================================

export interface BOMItem {
  rmSKU: string;
  rmName: string;
  qtyPerUnit: number;
  unit: string;
  leadTimeDays: number;
  moq: number;
  unitCost: number;
  supplier: string;
  shelfLifeDays: number;
}

export interface FGItem {
  fgSKU: string;
  fgName: string;
  category: string;
  bom: BOMItem[];
}

export interface DemandRecord {
  week: string;
  fgSKU: string;
  forecast: number;
  salesOrder: number;
  totalDemand: number;
}

export interface InventoryRecord {
  sku: string;
  name: string;
  type: 'FG' | 'RM';
  onHand: number;
  inTransit: number;
  safetyStock: number;
  unit: string;
  location: string;
}

export interface NetRequirement {
  week: string;
  fgSKU: string;
  fgName: string;
  rmSKU: string;
  rmName: string;
  grossReq: number;
  scheduledReceipt: number;
  projectedInventory: number;
  netReq: number;
  plannedOrderReceipt: number;
  plannedOrderRelease: number;
  status: 'OK' | 'SHORT' | 'EXCESS';
}

export interface PurchaseOrder {
  id: string;
  rmSKU: string;
  rmName: string;
  supplier: string;
  qty: number;
  orderDate: string;
  expectedDelivery: string;
  status: 'Planned' | 'Released' | 'Confirmed' | 'Received';
  cost: number;
  priority: 'Normal' | 'Urgent';
}

export interface OptScenario {
  id: string;
  name: string;
  driver: string;
  description: string;
  active: boolean;
  kpis: {
    materialAvailability: number;
    inventoryReduction: number;
    costReduction: number;
    planAdherence: number;
    serviceLevel: number;
    supplierOTIF: number;
    totalCost: number;
    holdingCost: number;
    orderingCost: number;
    shortage: number;
  };
}

// ── BOM Master ──────────────────────────────────────────────
export const bomMaster: FGItem[] = [
  {
    fgSKU: 'FG-001',
    fgName: 'Cola 500ml',
    category: 'Carbonated Soft Drink',
    bom: [
      { rmSKU: 'RM-001', rmName: 'Sugar Syrup', qtyPerUnit: 0.12, unit: 'kg', leadTimeDays: 14, moq: 5000, unitCost: 0.85, supplier: 'SUP-A', shelfLifeDays: 180 },
      { rmSKU: 'RM-002', rmName: 'Cola Concentrate', qtyPerUnit: 0.008, unit: 'L', leadTimeDays: 30, moq: 500, unitCost: 12.50, supplier: 'SUP-B', shelfLifeDays: 365 },
      { rmSKU: 'RM-003', rmName: 'CO₂ Gas', qtyPerUnit: 0.006, unit: 'kg', leadTimeDays: 7, moq: 1000, unitCost: 1.20, supplier: 'SUP-C', shelfLifeDays: 730 },
      { rmSKU: 'PKG-001', rmName: 'PET Bottle 500ml', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 21, moq: 50000, unitCost: 0.18, supplier: 'SUP-D', shelfLifeDays: 9999 },
      { rmSKU: 'PKG-002', rmName: 'Bottle Cap', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 14, moq: 100000, unitCost: 0.03, supplier: 'SUP-D', shelfLifeDays: 9999 },
      { rmSKU: 'PKG-003', rmName: 'Label 500ml', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 18, moq: 100000, unitCost: 0.05, supplier: 'SUP-E', shelfLifeDays: 9999 },
    ],
  },
  {
    fgSKU: 'FG-002',
    fgName: 'Orange Juice 1L',
    category: 'Juice',
    bom: [
      { rmSKU: 'RM-004', rmName: 'Orange Concentrate', qtyPerUnit: 0.25, unit: 'L', leadTimeDays: 45, moq: 1000, unitCost: 3.20, supplier: 'SUP-F', shelfLifeDays: 270 },
      { rmSKU: 'RM-005', rmName: 'Vitamin C Premix', qtyPerUnit: 0.002, unit: 'kg', leadTimeDays: 21, moq: 200, unitCost: 45.00, supplier: 'SUP-G', shelfLifeDays: 540 },
      { rmSKU: 'PKG-004', rmName: 'Tetra Pak 1L', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 35, moq: 20000, unitCost: 0.42, supplier: 'SUP-H', shelfLifeDays: 9999 },
    ],
  },
  {
    fgSKU: 'FG-003',
    fgName: 'Sparkling Water 330ml',
    category: 'Water',
    bom: [
      { rmSKU: 'RM-003', rmName: 'CO₂ Gas', qtyPerUnit: 0.007, unit: 'kg', leadTimeDays: 7, moq: 1000, unitCost: 1.20, supplier: 'SUP-C', shelfLifeDays: 730 },
      { rmSKU: 'PKG-005', rmName: 'Aluminium Can 330ml', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 28, moq: 100000, unitCost: 0.22, supplier: 'SUP-I', shelfLifeDays: 9999 },
      { rmSKU: 'PKG-006', rmName: 'Can End', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 28, moq: 100000, unitCost: 0.06, supplier: 'SUP-I', shelfLifeDays: 9999 },
    ],
  },
  {
    fgSKU: 'FG-004',
    fgName: 'Energy Drink 250ml',
    category: 'Energy',
    bom: [
      { rmSKU: 'RM-006', rmName: 'Taurine Powder', qtyPerUnit: 0.001, unit: 'kg', leadTimeDays: 35, moq: 100, unitCost: 8.50, supplier: 'SUP-G', shelfLifeDays: 730 },
      { rmSKU: 'RM-007', rmName: 'Caffeine Blend', qtyPerUnit: 0.00008, unit: 'kg', leadTimeDays: 28, moq: 50, unitCost: 120.00, supplier: 'SUP-G', shelfLifeDays: 365 },
      { rmSKU: 'RM-001', rmName: 'Sugar Syrup', qtyPerUnit: 0.08, unit: 'kg', leadTimeDays: 14, moq: 5000, unitCost: 0.85, supplier: 'SUP-A', shelfLifeDays: 180 },
      { rmSKU: 'PKG-005', rmName: 'Aluminium Can 330ml', qtyPerUnit: 1, unit: 'pcs', leadTimeDays: 28, moq: 100000, unitCost: 0.22, supplier: 'SUP-I', shelfLifeDays: 9999 },
    ],
  },
];

// ── Demand Forecast ─────────────────────────────────────────
export const demandData: DemandRecord[] = [
  { week: 'W01', fgSKU: 'FG-001', forecast: 120000, salesOrder: 115000, totalDemand: 120000 },
  { week: 'W02', fgSKU: 'FG-001', forecast: 130000, salesOrder: 125000, totalDemand: 130000 },
  { week: 'W03', fgSKU: 'FG-001', forecast: 155000, salesOrder: 148000, totalDemand: 155000 },
  { week: 'W04', fgSKU: 'FG-001', forecast: 160000, salesOrder: 152000, totalDemand: 160000 },
  { week: 'W05', fgSKU: 'FG-001', forecast: 175000, salesOrder: 0, totalDemand: 175000 },
  { week: 'W06', fgSKU: 'FG-001', forecast: 180000, salesOrder: 0, totalDemand: 180000 },

  { week: 'W01', fgSKU: 'FG-002', forecast: 45000, salesOrder: 42000, totalDemand: 45000 },
  { week: 'W02', fgSKU: 'FG-002', forecast: 48000, salesOrder: 46000, totalDemand: 48000 },
  { week: 'W03', fgSKU: 'FG-002', forecast: 52000, salesOrder: 50000, totalDemand: 52000 },
  { week: 'W04', fgSKU: 'FG-002', forecast: 55000, salesOrder: 51000, totalDemand: 55000 },
  { week: 'W05', fgSKU: 'FG-002', forecast: 58000, salesOrder: 0, totalDemand: 58000 },
  { week: 'W06', fgSKU: 'FG-002', forecast: 60000, salesOrder: 0, totalDemand: 60000 },

  { week: 'W01', fgSKU: 'FG-003', forecast: 80000, salesOrder: 76000, totalDemand: 80000 },
  { week: 'W02', fgSKU: 'FG-003', forecast: 85000, salesOrder: 82000, totalDemand: 85000 },
  { week: 'W03', fgSKU: 'FG-003', forecast: 90000, salesOrder: 88000, totalDemand: 90000 },
  { week: 'W04', fgSKU: 'FG-003', forecast: 95000, salesOrder: 90000, totalDemand: 95000 },
  { week: 'W05', fgSKU: 'FG-003', forecast: 100000, salesOrder: 0, totalDemand: 100000 },
  { week: 'W06', fgSKU: 'FG-003', forecast: 105000, salesOrder: 0, totalDemand: 105000 },

  { week: 'W01', fgSKU: 'FG-004', forecast: 35000, salesOrder: 33000, totalDemand: 35000 },
  { week: 'W02', fgSKU: 'FG-004', forecast: 38000, salesOrder: 36000, totalDemand: 38000 },
  { week: 'W03', fgSKU: 'FG-004', forecast: 42000, salesOrder: 40000, totalDemand: 42000 },
  { week: 'W04', fgSKU: 'FG-004', forecast: 45000, salesOrder: 43000, totalDemand: 45000 },
  { week: 'W05', fgSKU: 'FG-004', forecast: 50000, salesOrder: 0, totalDemand: 50000 },
  { week: 'W06', fgSKU: 'FG-004', forecast: 55000, salesOrder: 0, totalDemand: 55000 },
];

// ── Inventory Master ────────────────────────────────────────
export const inventoryData: InventoryRecord[] = [
  { sku: 'FG-001', name: 'Cola 500ml', type: 'FG', onHand: 95000, inTransit: 0, safetyStock: 25000, unit: 'units', location: 'Plant-1' },
  { sku: 'FG-002', name: 'Orange Juice 1L', type: 'FG', onHand: 32000, inTransit: 0, safetyStock: 10000, unit: 'units', location: 'Plant-1' },
  { sku: 'FG-003', name: 'Sparkling Water 330ml', type: 'FG', onHand: 72000, inTransit: 0, safetyStock: 18000, unit: 'units', location: 'Plant-2' },
  { sku: 'FG-004', name: 'Energy Drink 250ml', type: 'FG', onHand: 28000, inTransit: 0, safetyStock: 8000, unit: 'units', location: 'Plant-2' },

  { sku: 'RM-001', name: 'Sugar Syrup', type: 'RM', onHand: 18000, inTransit: 5000, safetyStock: 8000, unit: 'kg', location: 'WH-A' },
  { sku: 'RM-002', name: 'Cola Concentrate', type: 'RM', onHand: 850, inTransit: 200, safetyStock: 400, unit: 'L', location: 'WH-A' },
  { sku: 'RM-003', name: 'CO₂ Gas', type: 'RM', onHand: 1200, inTransit: 0, safetyStock: 500, unit: 'kg', location: 'WH-B' },
  { sku: 'RM-004', name: 'Orange Concentrate', type: 'RM', onHand: 3200, inTransit: 1000, safetyStock: 2000, unit: 'L', location: 'WH-A' },
  { sku: 'RM-005', name: 'Vitamin C Premix', type: 'RM', onHand: 180, inTransit: 0, safetyStock: 100, unit: 'kg', location: 'WH-A' },
  { sku: 'RM-006', name: 'Taurine Powder', type: 'RM', onHand: 95, inTransit: 50, safetyStock: 60, unit: 'kg', location: 'WH-A' },
  { sku: 'RM-007', name: 'Caffeine Blend', type: 'RM', onHand: 12, inTransit: 0, safetyStock: 8, unit: 'kg', location: 'WH-A' },

  { sku: 'PKG-001', name: 'PET Bottle 500ml', type: 'RM', onHand: 380000, inTransit: 50000, safetyStock: 100000, unit: 'pcs', location: 'WH-C' },
  { sku: 'PKG-002', name: 'Bottle Cap', type: 'RM', onHand: 420000, inTransit: 0, safetyStock: 120000, unit: 'pcs', location: 'WH-C' },
  { sku: 'PKG-003', name: 'Label 500ml', type: 'RM', onHand: 310000, inTransit: 100000, safetyStock: 100000, unit: 'pcs', location: 'WH-C' },
  { sku: 'PKG-004', name: 'Tetra Pak 1L', type: 'RM', onHand: 75000, inTransit: 20000, safetyStock: 30000, unit: 'pcs', location: 'WH-C' },
  { sku: 'PKG-005', name: 'Aluminium Can 330ml', type: 'RM', onHand: 290000, inTransit: 0, safetyStock: 80000, unit: 'pcs', location: 'WH-D' },
  { sku: 'PKG-006', name: 'Can End', type: 'RM', onHand: 275000, inTransit: 0, safetyStock: 80000, unit: 'pcs', location: 'WH-D' },
];

// ── Net Requirements (computed from BOM explosion) ──────────
export function computeNetRequirements(): NetRequirement[] {
  const weeks = ['W01', 'W02', 'W03', 'W04', 'W05', 'W06'];
  const results: NetRequirement[] = [];

  for (const fg of bomMaster) {
    for (const rm of fg.bom) {
      let projInv = (inventoryData.find(i => i.sku === rm.rmSKU)?.onHand ?? 0)
        + (inventoryData.find(i => i.sku === rm.rmSKU)?.inTransit ?? 0);
      const ss = inventoryData.find(i => i.sku === rm.rmSKU)?.safetyStock ?? 0;

      for (const week of weeks) {
        const demand = demandData.find(d => d.week === week && d.fgSKU === fg.fgSKU);
        const grossReq = Math.round((demand?.totalDemand ?? 0) * rm.qtyPerUnit);
        const scheduledReceipt = week === 'W01' ? Math.round(grossReq * 0.3) : 0;
        const available = projInv + scheduledReceipt - grossReq - ss;
        const netReq = available < 0 ? Math.abs(available) : 0;
        const plannedOrderQty = netReq > 0 ? Math.max(netReq, rm.moq) : 0;
        const newProjInv = projInv + scheduledReceipt + plannedOrderQty - grossReq;

        results.push({
          week,
          fgSKU: fg.fgSKU,
          fgName: fg.fgName,
          rmSKU: rm.rmSKU,
          rmName: rm.rmName,
          grossReq,
          scheduledReceipt,
          projectedInventory: Math.max(0, newProjInv),
          netReq,
          plannedOrderReceipt: plannedOrderQty,
          plannedOrderRelease: plannedOrderQty > 0
            ? Math.round(plannedOrderQty * 1.1)
            : 0,
          status: netReq > 0 ? 'SHORT' : (newProjInv > grossReq * 2 ? 'EXCESS' : 'OK'),
        });

        projInv = Math.max(0, newProjInv);
      }
    }
  }
  return results;
}

// ── Purchase Orders ─────────────────────────────────────────
export const purchaseOrders: PurchaseOrder[] = [
  { id: 'PO-2024-001', rmSKU: 'RM-001', rmName: 'Sugar Syrup', supplier: 'SUP-A', qty: 25000, orderDate: '2024-01-08', expectedDelivery: '2024-01-22', status: 'Confirmed', cost: 21250, priority: 'Normal' },
  { id: 'PO-2024-002', rmSKU: 'RM-002', rmName: 'Cola Concentrate', supplier: 'SUP-B', qty: 500, orderDate: '2024-01-05', expectedDelivery: '2024-02-04', status: 'Released', cost: 6250, priority: 'Normal' },
  { id: 'PO-2024-003', rmSKU: 'PKG-001', rmName: 'PET Bottle 500ml', supplier: 'SUP-D', qty: 500000, orderDate: '2024-01-10', expectedDelivery: '2024-01-31', status: 'Confirmed', cost: 90000, priority: 'Normal' },
  { id: 'PO-2024-004', rmSKU: 'RM-004', rmName: 'Orange Concentrate', supplier: 'SUP-F', qty: 5000, orderDate: '2024-01-03', expectedDelivery: '2024-02-17', status: 'Released', cost: 16000, priority: 'Urgent' },
  { id: 'PO-2024-005', rmSKU: 'PKG-005', rmName: 'Aluminium Can 330ml', supplier: 'SUP-I', qty: 500000, orderDate: '2024-01-12', expectedDelivery: '2024-02-09', status: 'Planned', cost: 110000, priority: 'Normal' },
  { id: 'PO-2024-006', rmSKU: 'RM-006', rmName: 'Taurine Powder', supplier: 'SUP-G', qty: 200, orderDate: '2024-01-15', expectedDelivery: '2024-02-19', status: 'Planned', cost: 1700, priority: 'Urgent' },
  { id: 'PO-2024-007', rmSKU: 'RM-007', rmName: 'Caffeine Blend', supplier: 'SUP-G', qty: 50, orderDate: '2024-01-15', expectedDelivery: '2024-02-12', status: 'Planned', cost: 6000, priority: 'Urgent' },
  { id: 'PO-2024-008', rmSKU: 'PKG-004', rmName: 'Tetra Pak 1L', supplier: 'SUP-H', qty: 100000, orderDate: '2024-01-08', expectedDelivery: '2024-02-12', status: 'Released', cost: 42000, priority: 'Normal' },
];

// ── Optimization Scenarios ──────────────────────────────────
export const scenarios: OptScenario[] = [
  {
    id: 'S0',
    name: 'Baseline',
    driver: 'Current State',
    description: 'Current planning with no optimization applied. Represents existing Excel-based manual MRP.',
    active: false,
    kpis: {
      materialAvailability: 94.2,
      inventoryReduction: 0,
      costReduction: 0,
      planAdherence: 88.5,
      serviceLevel: 93.5,
      supplierOTIF: 89.0,
      totalCost: 2850000,
      holdingCost: 420000,
      orderingCost: 185000,
      shortage: 8.2,
    },
  },
  {
    id: 'S1',
    name: 'Demand Spike (+30%)',
    driver: 'Demand Spike',
    description: 'Sudden 30% demand increase during summer peak. Tests system resilience and supplier flexibility.',
    active: false,
    kpis: {
      materialAvailability: 87.5,
      inventoryReduction: -15,
      costReduction: -12,
      planAdherence: 79.0,
      serviceLevel: 85.0,
      supplierOTIF: 82.0,
      totalCost: 3420000,
      holdingCost: 390000,
      orderingCost: 265000,
      shortage: 18.5,
    },
  },
  {
    id: 'S2',
    name: 'Optimized Plan',
    driver: 'Cost & Service Optimization',
    description: 'System-driven MRP with safety stock recalibration, lot-size optimization, and supplier lead-time reduction.',
    active: true,
    kpis: {
      materialAvailability: 99.1,
      inventoryReduction: 16.5,
      costReduction: 8.3,
      planAdherence: 96.2,
      serviceLevel: 98.8,
      supplierOTIF: 96.5,
      totalCost: 2613000,
      holdingCost: 335000,
      orderingCost: 158000,
      shortage: 1.2,
    },
  },
  {
    id: 'S3',
    name: 'Supplier Delay (+15d)',
    driver: 'Supplier Delay',
    description: 'Key supplier lead time increases by 15 days. Evaluates buffer stock and alternate sourcing.',
    active: false,
    kpis: {
      materialAvailability: 91.0,
      inventoryReduction: -8,
      costReduction: -5,
      planAdherence: 83.0,
      serviceLevel: 89.5,
      supplierOTIF: 74.0,
      totalCost: 3050000,
      holdingCost: 480000,
      orderingCost: 195000,
      shortage: 12.0,
    },
  },
  {
    id: 'S11',
    name: 'Safety Stock Recalibration',
    driver: 'Inventory Policy Change',
    description: 'Recalibrate safety stock using statistical models (demand variability × lead time). Reduces excess without increasing risk.',
    active: false,
    kpis: {
      materialAvailability: 98.5,
      inventoryReduction: 19.8,
      costReduction: 11.2,
      planAdherence: 95.0,
      serviceLevel: 97.5,
      supplierOTIF: 95.0,
      totalCost: 2530000,
      holdingCost: 298000,
      orderingCost: 162000,
      shortage: 2.5,
    },
  },
];

// ── Constraints ──────────────────────────────────────────────
export const constraints = {
  capacity: [
    { line: 'Line-1 (Cola)', shiftCapacity: 45000, shiftsPerWeek: 3, maxWeekly: 135000, utilization: 88, plant: 'Plant-1' },
    { line: 'Line-2 (Juice)', shiftCapacity: 20000, shiftsPerWeek: 3, maxWeekly: 60000, utilization: 75, plant: 'Plant-1' },
    { line: 'Line-3 (Water/Can)', shiftCapacity: 38000, shiftsPerWeek: 3, maxWeekly: 114000, utilization: 82, plant: 'Plant-2' },
    { line: 'Line-4 (Energy)', shiftCapacity: 15000, shiftsPerWeek: 2, maxWeekly: 30000, utilization: 95, plant: 'Plant-2' },
  ],
  leadTime: [
    { supplier: 'SUP-A', material: 'Sugar Syrup', minDays: 10, maxDays: 18, avgDays: 14, variability: '±25%' },
    { supplier: 'SUP-B', material: 'Cola Concentrate', minDays: 25, maxDays: 40, avgDays: 30, variability: '±30%' },
    { supplier: 'SUP-C', material: 'CO₂ Gas', minDays: 5, maxDays: 10, avgDays: 7, variability: '±15%' },
    { supplier: 'SUP-D', material: 'Packaging (Bottle)', minDays: 16, maxDays: 28, avgDays: 21, variability: '±20%' },
    { supplier: 'SUP-F', material: 'Orange Concentrate', minDays: 35, maxDays: 60, avgDays: 45, variability: '±40%' },
    { supplier: 'SUP-G', material: 'Functional Ingredients', minDays: 25, maxDays: 42, avgDays: 32, variability: '±35%' },
    { supplier: 'SUP-H', material: 'Tetra Pak', minDays: 28, maxDays: 45, avgDays: 35, variability: '±30%' },
    { supplier: 'SUP-I', material: 'Aluminium Cans', minDays: 22, maxDays: 35, avgDays: 28, variability: '±25%' },
  ],
  supplier: [
    { supplier: 'SUP-A', name: 'Sweet Ingredients Ltd', reliability: 96, moq: 5000, unit: 'kg', maxMonthly: 80000, contractStatus: 'Active' },
    { supplier: 'SUP-B', name: 'Flavor Masters Inc', reliability: 91, moq: 500, unit: 'L', maxMonthly: 5000, contractStatus: 'Active' },
    { supplier: 'SUP-C', name: 'Industrial Gas Corp', reliability: 98, moq: 1000, unit: 'kg', maxMonthly: 20000, contractStatus: 'Active' },
    { supplier: 'SUP-D', name: 'PET Pack Solutions', reliability: 94, moq: 50000, unit: 'pcs', maxMonthly: 2000000, contractStatus: 'Active' },
    { supplier: 'SUP-F', name: 'Citrus Global Exports', reliability: 83, moq: 1000, unit: 'L', maxMonthly: 40000, contractStatus: 'Under Review' },
    { supplier: 'SUP-G', name: 'BioNutrient Labs', reliability: 88, moq: 50, unit: 'kg', maxMonthly: 2000, contractStatus: 'Active' },
    { supplier: 'SUP-H', name: 'TetraPak APAC', reliability: 92, moq: 20000, unit: 'pcs', maxMonthly: 500000, contractStatus: 'Active' },
    { supplier: 'SUP-I', name: 'Aluminex Packaging', reliability: 90, moq: 100000, unit: 'pcs', maxMonthly: 3000000, contractStatus: 'Active' },
  ],
  inventoryPolicy: [
    { sku: 'RM-001', method: 'Min-Max', minStock: 8000, maxStock: 30000, reorderPoint: 12000, safetyStock: 8000 },
    { sku: 'RM-002', method: 'Safety Stock', minStock: 400, maxStock: 2000, reorderPoint: 600, safetyStock: 400 },
    { sku: 'RM-003', method: 'Reorder Point', minStock: 500, maxStock: 3000, reorderPoint: 800, safetyStock: 500 },
    { sku: 'RM-004', method: 'Min-Max', minStock: 2000, maxStock: 8000, reorderPoint: 3000, safetyStock: 2000 },
    { sku: 'PKG-001', method: 'LOT-FOR-LOT', minStock: 100000, maxStock: 600000, reorderPoint: 150000, safetyStock: 100000 },
    { sku: 'PKG-005', method: 'EOQ', minStock: 80000, maxStock: 500000, reorderPoint: 120000, safetyStock: 80000 },
  ],
};

// ── Objectives ───────────────────────────────────────────────
export const objectives = [
  { category: 'Supply Planning', name: 'Material Availability Assurance', target: '≥ 99%', current: '94.2%', status: 'Below Target', weight: 30 },
  { category: 'Inventory Optimization', name: 'Inventory Level Optimization', target: '10–20% reduction', current: '0%', status: 'Not Started', weight: 25 },
  { category: 'Cost Optimization', name: 'Procurement Cost Reduction', target: '5–10% reduction', current: '0%', status: 'Not Started', weight: 20 },
  { category: 'Production Efficiency', name: 'Production Plan Adherence', target: '≥ 95%', current: '88.5%', status: 'Below Target', weight: 15 },
  { category: 'Supplier Management', name: 'Supplier OTIF Improvement', target: '≥ 95%', current: '89.0%', status: 'Below Target', weight: 10 },
];
