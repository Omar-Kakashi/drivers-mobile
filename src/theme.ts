/**
 * Ostol Mobile Theme - Consistent styling
 */

export const theme = {
  colors: {
    primary: '#1976d2',
    primaryDark: '#1565c0',
    primaryLight: '#42a5f5',
    secondary: '#ff9800',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    background: '#f5f5f5',
    surface: '#ffffff',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd',
      white: '#ffffff',
    },
    border: '#e0e0e0',
    driver: {
      primary: '#1976d2',
      light: '#e3f2fd',
      active: '#4caf50',
      inactive: '#9e9e9e',
      balance: {
        positive: '#4caf50',
        negative: '#f44336',
      },
    },
    admin: {
      primary: '#9c27b0',
      light: '#f3e5f5',
    },
    status: {
      pending: '#ff9800',
      approved: '#4caf50',
      rejected: '#f44336',
      active: '#4caf50',
      inactive: '#9e9e9e',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' as const, lineHeight: 40 },
    h2: { fontSize: 24, fontWeight: 'bold' as const, lineHeight: 32 },
    h3: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
    body1: { fontSize: 16, fontWeight: 'normal' as const, lineHeight: 24 },
    body2: { fontSize: 14, fontWeight: 'normal' as const, lineHeight: 20 },
    caption: { fontSize: 12, fontWeight: 'normal' as const, lineHeight: 16 },
    button: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    full: 9999,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
  },
};
