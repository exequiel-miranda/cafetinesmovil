export const theme = {
  colors: {
    primary: '#1E3A8A', // Deep Blue
    primaryLight: '#3B82F6', // Lighter Blue
    primaryDark: '#172554', // Very Dark Blue
    secondary: '#F59E0B', // Amber/Gold for accents
    background: '#F8FAFC', // Very light blue/gray for app background
    surface: '#FFFFFF', // White for cards
    text: '#0F172A', // Slate 900 for dark text
    textMuted: '#64748B', // Slate 500 for secondary text
    border: '#E2E8F0', // Slate 200 for subtle borders
    success: '#10B981', // Emerald for success states
    error: '#EF4444', // Red for errors
  },
  typography: {
    fontFamily: {
      regular: 'System', // Will use platform default (San Francisco on iOS, Roboto on Android)
      medium: 'System',
      bold: 'System',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  shadows: {
    small: {
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#1E3A8A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
      elevation: 8,
    },
  }
};
