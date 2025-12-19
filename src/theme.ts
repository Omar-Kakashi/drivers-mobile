/**
 * Ostol Mobile Theme - Consistent styling
 * Modern, accessible, and premium design system
 */

export const theme = {
  colors: {
    // Primary - Deep energetic blue
    primary: '#2563EB',
    primaryDark: '#1E40AF',
    primaryLight: '#60A5FA',
    
    // Secondary - Vibrant accent (e.g., for actions)
    secondary: '#F59E0B',
    
    // Functional Colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // Neutrals
    background: '#F8FAFC', // Very light cool gray for app background
    surface: '#FFFFFF',    // Pure white for cards/surfaces
    
    text: {
      primary: '#1E293B',   // Slate 800 - High contrast
      secondary: '#64748B', // Slate 500 - Medium contrast
      disabled: '#94A3B8',  // Slate 400
      white: '#FFFFFF',
      inverse: '#FFFFFF',
    },
    
    border: '#E2E8F0',      // Slate 200
    
    // Legacy specific colors (kept for compatibility, mapped to new palette where possible)
    driver: {
      primary: '#2563EB',
      light: '#EFF6FF',
      active: '#10B981',
      inactive: '#94A3B8',
      balance: {
        positive: '#10B981',
        negative: '#EF4444',
      },
    },
    admin: {
      primary: '#7C3AED', // Violet
      light: '#F5F3FF',
    },
    status: {
      pending: '#F59E0B',
      approved: '#10B981',
      rejected: '#EF4444',
      active: '#10B981',
      inactive: '#94A3B8',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  typography: {
    h1: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32, letterSpacing: -0.3 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    h4: { fontSize: 18, fontWeight: '600' as const, lineHeight: 26 },
    body1: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    body2: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24, letterSpacing: 0.5 },
    label: { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  },
  
  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  
  shadows: {
    small: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#64748B',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  
  // Layout helpers
  layout: {
    containerPadding: 20,
  }
};
