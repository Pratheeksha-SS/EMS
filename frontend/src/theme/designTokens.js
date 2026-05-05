/**
 * Design Tokens for HR Management System
 * 
 * This is the single source of truth for all design values.
 * Import and use these tokens everywhere instead of hardcoding values.
 * 
 * Usage:
 *   import { colors, spacing, typography, shadows } from '@/theme/designTokens';
 *   
 *   <div style={{ backgroundColor: colors.primary, padding: spacing.md }}>
 */

// ─────────────────────────────────────────────────────────
// COLOR TOKENS
// ─────────────────────────────────────────────────────────

export const colors = {
  // Primary (Orange)
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FFF7ED',
  primaryBorder: '#FED7AA',
  
  // Secondary/Accent (Green)
  accent: '#16A34A',
  accentDark: '#15803D',
  accentLight: '#F0FDF4',
  accentBorder: '#BBF7D0',
  
  // Status Colors
  success: '#16A34A',
  error: '#DC2626',
  warning: '#F59E0B',
  info: '#2563EB',
  
  // Status Backgrounds
  successBg: '#F0FDF4',
  errorBg: '#FEF2F2',
  warningBg: '#FFFBEB',
  infoBg: '#EFF6FF',
  
  // Neutral Palette
  neutral: {
    bg: '#F8FAFC',        // Page/container background
    surface: '#FFFFFF',   // Card/component background
    border: '#E2E8F0',    // Primary border color
    borderLight: '#F1F5F9', // Lighter border
    textMain: '#0F172A',  // Primary text
    textMuted: '#64748B', // Secondary text
    textPlaceholder: '#94A3B8', // Placeholder text
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #F97316, #EA580C)',
    accent: 'linear-gradient(135deg, #16A34A, #15803D)',
    error: 'linear-gradient(135deg, #DC2626, #B91C1C)',
    warning: 'linear-gradient(135deg, #F59E0B, #D97706)',
    info: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
  },
};

// ─────────────────────────────────────────────────────────
// SPACING TOKENS
// ─────────────────────────────────────────────────────────

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
  xxxl: '28px',
  
  // For readability
  borderRadius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
    xl: '14px',
    xxl: '16px',
    circle: '50%',
  },
  
  // Common patterns
  padding: {
    card: '22px 24px',
    section: '24px 28px',
    button: '10px 16px',
    input: '10px 14px',
  },
  
  gap: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
  },
};

// ─────────────────────────────────────────────────────────
// TYPOGRAPHY TOKENS
// ─────────────────────────────────────────────────────────

export const typography = {
  fontFamily: {
    base: "'Nunito', 'Segoe UI', sans-serif",
    mono: "'Monaco', 'Courier New', monospace",
  },
  
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '13px',
    md: '14px',
    lg: '16px',
    xl: '18px',
    xxl: '20px',
    xxxl: '24px',
    heading: '32px',
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  letterSpacing: {
    tight: '-0.5px',
    normal: '0px',
    wide: '0.5px',
    wider: '0.6px',
  },
};

// ─────────────────────────────────────────────────────────
// SHADOW TOKENS
// ─────────────────────────────────────────────────────────

export const shadows = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.04)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.05)',
  md: '0 2px 8px rgba(0, 0, 0, 0.1)',
  lg: '0 4px 12px rgba(0, 0, 0, 0.15)',
  xl: '0 8px 24px rgba(0, 0, 0, 0.12)',
  xxl: '0 20px 50px rgba(15, 23, 42, 0.18)',
  
  // Color-specific shadows (for gradient backgrounds)
  primary: '0 6px 20px rgba(249, 115, 22, 0.25)',
  accent: '0 6px 20px rgba(22, 163, 74, 0.25)',
  error: '0 6px 20px rgba(220, 38, 38, 0.25)',
  warning: '0 6px 20px rgba(245, 158, 11, 0.25)',
  info: '0 6px 20px rgba(37, 99, 235, 0.25)',
};

// ─────────────────────────────────────────────────────────
// TRANSITION TOKENS
// ─────────────────────────────────────────────────────────

export const transitions = {
  fast: 'all 0.15s ease',
  base: 'all 0.2s ease',
  slow: 'all 0.3s ease',
  verySlow: 'all 0.5s ease',
};

// ─────────────────────────────────────────────────────────
// Z-INDEX TOKENS
// ─────────────────────────────────────────────────────────

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modal: 1000,
  popover: 1100,
  tooltip: 1200,
};

// ─────────────────────────────────────────────────────────
// BREAKPOINT TOKENS
// ─────────────────────────────────────────────────────────

export const breakpoints = {
  mobile: '480px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1280px',
  ultrawide: '1536px',
};

// ─────────────────────────────────────────────────────────
// STATUS BADGE STYLES
// ─────────────────────────────────────────────────────────

export const statusStyles = {
  PENDING: {
    bg: '#FFFBEB',
    color: '#92400E',
    border: '#FDE68A',
  },
  APPROVED: {
    bg: '#F0FDF4',
    color: '#166534',
    border: '#BBF7D0',
  },
  REJECTED: {
    bg: '#FEF2F2',
    color: '#991B1B',
    border: '#FECACA',
  },
  PRESENT: {
    bg: '#F0FDF4',
    color: '#15803D',
    border: '#BBF7D0',
  },
  ABSENT: {
    bg: '#FEF2F2',
    color: '#991B1B',
    border: '#FECACA',
  },
  ON_LEAVE: {
    bg: '#FFF7ED',
    color: '#92400E',
    border: '#FED7AA',
  },
};

// ─────────────────────────────────────────────────────────
// LEAVE TYPE STYLES
// ─────────────────────────────────────────────────────────

export const leaveTypeStyles = {
  SICK: {
    color: '#DC2626',
    bg: '#FEF2F2',
    label: 'Sick Leave',
  },
  CASUAL: {
    color: '#2563EB',
    bg: '#EFF6FF',
    label: 'Casual Leave',
  },
  PAID: {
    color: '#16A34A',
    bg: '#F0FDF4',
    label: 'Paid Leave',
  },
  MATERNITY: {
    color: '#E11D48',
    bg: '#FFE4E6',
    label: 'Maternity Leave',
  },
  PATERNITY: {
    color: '#7C3AED',
    bg: '#F3E8FF',
    label: 'Paternity Leave',
  },
  MARRIAGE: {
    color: '#F59E0B',
    bg: '#FFFBEB',
    label: 'Marriage Leave',
  },
};

// ─────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────

/**
 * Get status style by status name
 */
export const getStatusStyle = (status) => {
  const upperStatus = status?.toUpperCase() || 'PENDING';
  return statusStyles[upperStatus] || statusStyles.PENDING;
};

/**
 * Get leave type style by leave type
 */
export const getLeaveTypeStyle = (leaveType) => {
  const upperType = leaveType?.toUpperCase() || 'CASUAL';
  return leaveTypeStyles[upperType] || leaveTypeStyles.CASUAL;
};

/**
 * Merge styles with design tokens
 */
export const mergeStyles = (baseStyle, tokenStyle) => {
  return { ...baseStyle, ...tokenStyle };
};

// ─────────────────────────────────────────────────────────
// COMMON COMPONENT STYLES
// ─────────────────────────────────────────────────────────

export const componentStyles = {
  // Card style
  card: {
    backgroundColor: colors.neutral.surface,
    borderRadius: spacing.borderRadius.lg,
    border: `1.5px solid ${colors.neutral.borderLight}`,
    boxShadow: shadows.xs,
    padding: spacing.padding.card,
  },
  
  // Button primary style
  buttonPrimary: {
    background: colors.gradients.primary,
    color: 'white',
    border: 'none',
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.button,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    boxShadow: shadows.primary,
    transition: transitions.base,
  },
  
  // Button secondary style
  buttonSecondary: {
    backgroundColor: colors.neutral.bg,
    color: colors.neutral.textMain,
    border: `1.5px solid ${colors.neutral.border}`,
    borderRadius: spacing.borderRadius.md,
    padding: spacing.padding.button,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    cursor: 'pointer',
    transition: transitions.base,
  },
  
  // Input style
  input: {
    width: '100%',
    padding: spacing.padding.input,
    border: `1.5px solid ${colors.neutral.border}`,
    borderRadius: spacing.borderRadius.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.base,
    boxSizing: 'border-box',
    outline: 'none',
    transition: transitions.base,
  },
  
  // Badge style
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `${spacing.xs} ${spacing.sm}`,
    borderRadius: spacing.borderRadius.circle,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
};

export default {
  colors,
  spacing,
  typography,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  statusStyles,
  leaveTypeStyles,
  componentStyles,
  getStatusStyle,
  getLeaveTypeStyle,
  mergeStyles,
};
