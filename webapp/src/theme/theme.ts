// =============================================================================
// GLOBAL THEME - Sankar/Vikrant Supply Planning Suite - SYDIAI
// ALL modules MUST import from this file only.
// NO module is allowed to define its own colors, fonts, spacing, or shadows.
// =============================================================================

export const GlobalTheme = {
  // ─── COLOR PALETTE ──────────────────────────────────────────────────────────
  colors: {
    primary:        '#1E3A8A',   // Deep Navy Blue
    primaryLight:   '#2D4FA6',
    primaryDark:    '#162C6B',
    secondary:      '#3B82F6',   // Bright Blue
    secondaryLight: '#60A5FA',
    secondaryDark:  '#2563EB',
    accent:         '#06B6D4',   // Cyan accent

    background:     '#F8FAFC',   // Light grey-white
    surface:        '#FFFFFF',
    surfaceAlt:     '#F1F5F9',
    border:         '#E2E8F0',
    borderLight:    '#F0F4F8',

    textPrimary:    '#0F172A',   // Near-black
    textSecondary:  '#334155',   // Dark grey
    textMuted:      '#64748B',   // Medium grey
    textLight:      '#94A3B8',   // Light grey

    // Status Colors
    healthy:        '#10B981',   // Green
    healthyBg:      '#ECFDF5',
    warning:        '#F59E0B',   // Amber
    warningBg:      '#FFFBEB',
    critical:       '#EF4444',   // Red
    criticalBg:     '#FEF2F2',
    info:           '#3B82F6',
    infoBg:         '#EFF6FF',

    // Chart Colors
    chart1:         '#1E3A8A',
    chart2:         '#3B82F6',
    chart3:         '#06B6D4',
    chart4:         '#10B981',
    chart5:         '#F59E0B',
    chart6:         '#EF4444',
    chart7:         '#8B5CF6',
  },

  // ─── TYPOGRAPHY ─────────────────────────────────────────────────────────────
  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Arial', sans-serif",
    heading1:   { size: '2rem',    weight: '700', lineHeight: '1.2' },
    heading2:   { size: '1.5rem',  weight: '700', lineHeight: '1.3' },
    heading3:   { size: '1.25rem', weight: '600', lineHeight: '1.4' },
    heading4:   { size: '1.125rem',weight: '600', lineHeight: '1.4' },
    subheading: { size: '0.875rem',weight: '600', lineHeight: '1.5', letterSpacing: '0.05em', textTransform: 'uppercase' },
    body:       { size: '0.875rem',weight: '400', lineHeight: '1.6' },
    bodyLg:     { size: '1rem',    weight: '400', lineHeight: '1.6' },
    caption:    { size: '0.75rem', weight: '400', lineHeight: '1.5' },
    label:      { size: '0.75rem', weight: '600', lineHeight: '1.5' },
    mono:       { fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
  },

  // ─── SPACING SCALE ──────────────────────────────────────────────────────────
  spacing: {
    xs:   '4px',
    sm:   '8px',
    md:   '12px',
    lg:   '16px',
    xl:   '24px',
    xxl:  '32px',
    xxxl: '48px',
  },

  // ─── BORDER RADIUS ──────────────────────────────────────────────────────────
  radius: {
    sm:   '8px',
    md:   '12px',
    lg:   '16px',
    xl:   '20px',
    full: '9999px',
  },

  // ─── SHADOWS ────────────────────────────────────────────────────────────────
  shadow: {
    sm:  '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    md:  '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
    lg:  '0 10px 25px rgba(0,0,0,0.10), 0 4px 10px rgba(0,0,0,0.06)',
    xl:  '0 20px 40px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)',
  },

  // ─── LAYOUT ─────────────────────────────────────────────────────────────────
  layout: {
    sidebarWidth: '260px',
    headerHeight: '64px',
    maxContentWidth: '1440px',
    contentPadding: '24px',
  },

  // ─── TRANSITIONS ────────────────────────────────────────────────────────────
  transition: {
    fast:   'all 0.15s ease',
    normal: 'all 0.25s ease',
    slow:   'all 0.40s ease',
  },
} as const

// ─── MODULE DEFINITIONS ─────────────────────────────────────────────────────
export const MODULES = [
  {
    id: 'capacity',
    name: 'Capacity Planning',
    path: '/capacity',
    icon: 'fa-industry',
    description: 'Monitor plant utilization, identify bottlenecks, and optimize production capacity across all facilities.',
    kpis: [
      { label: 'Avg Utilization', value: '78.4%', trend: '+2.1%' },
      { label: 'Bottleneck Lines', value: '3', trend: '-1' },
    ],
    status: 'healthy' as const,
    color: '#1E3A8A',
  },
  {
    id: 'sequencing',
    name: 'Sequencing & Scheduling',
    path: '/sequencing',
    icon: 'fa-calendar-alt',
    description: 'Optimize production sequences, minimize changeovers, and manage weekly scheduling with AI-driven recommendations.',
    kpis: [
      { label: 'Sequence Adherence', value: '91.2%', trend: '+3.4%' },
      { label: 'Avg Schedule Delay', value: '1.2 hrs', trend: '-0.3' },
    ],
    status: 'healthy' as const,
    color: '#3B82F6',
  },
  {
    id: 'mrp',
    name: 'Material Requirement Planning',
    path: '/mrp',
    icon: 'fa-boxes',
    description: 'Automate material requirements, manage BOMs, and ensure timely procurement to prevent production stoppages.',
    kpis: [
      { label: 'On-Time Procurement', value: '88.7%', trend: '+1.2%' },
      { label: 'Material Shortage Alerts', value: '5', trend: '+2' },
    ],
    status: 'warning' as const,
    color: '#06B6D4',
  },
  {
    id: 'inventory',
    name: 'Inventory Planning',
    path: '/inventory',
    icon: 'fa-warehouse',
    description: 'Optimize stock levels, reduce carrying costs, and prevent stockouts with intelligent demand-driven replenishment.',
    kpis: [
      { label: 'Inventory Turnover', value: '8.3x', trend: '+0.5x' },
      { label: 'Stockout Risk Items', value: '12', trend: '-4' },
    ],
    status: 'warning' as const,
    color: '#10B981',
  },
  {
    id: 'procurement',
    name: 'Procurement Planning',
    path: '/procurement',
    icon: 'fa-shopping-cart',
    description: 'Manage supplier relationships, optimize purchase orders, and track procurement performance metrics.',
    kpis: [
      { label: 'Supplier On-Time', value: '94.1%', trend: '+0.8%' },
      { label: 'Cost Variance', value: '-2.3%', trend: 'favorable' },
    ],
    status: 'healthy' as const,
    color: '#8B5CF6',
  },
  {
    id: 'resource',
    name: 'Resource Planning',
    path: '/resource',
    icon: 'fa-users-cog',
    description: 'Allocate workforce, machinery, and resources efficiently across production plans and scenarios.',
    kpis: [
      { label: 'Resource Utilization', value: '82.6%', trend: '+1.9%' },
      { label: 'Overtime Hours', value: '142 hrs', trend: '-18' },
    ],
    status: 'healthy' as const,
    color: '#F59E0B',
  },
  {
    id: 'sop',
    name: 'Sales & Operations Planning',
    path: '/sop',
    icon: 'fa-chart-line',
    description: 'Align sales forecasts with production capacity, enabling cross-functional S&OP reviews and consensus planning.',
    kpis: [
      { label: 'Forecast Accuracy', value: '87.3%', trend: '+2.8%' },
      { label: 'Plan Reliability', value: '93.5%', trend: '+1.1%' },
    ],
    status: 'healthy' as const,
    color: '#EF4444',
  },
] as const

export type ModuleStatus = 'healthy' | 'warning' | 'critical'
export type ModuleId = typeof MODULES[number]['id']
