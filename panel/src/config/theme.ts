/**
 * Theme Configuration for Cal AI Admin Panel
 * Light theme with black as primary color and white as background
 * Minimalist, modern, and clean design system
 */

export const theme = {
  colors: {
    // Primary colors - Black theme
    primary: {
      DEFAULT: '#000000',
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#000000',
    },

    // Accent colors - subtle grays for depth
    accent: {
      DEFAULT: '#18181b',
      light: '#3f3f46',
      lighter: '#71717a',
      lightest: '#a1a1aa',
    },

    // Background colors
    background: {
      DEFAULT: '#ffffff',
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f5f5f5',
      hover: '#f9fafb',
      card: '#ffffff',
    },

    // Text colors
    text: {
      primary: '#000000',
      secondary: '#3f3f46',
      tertiary: '#71717a',
      disabled: '#a1a1aa',
      inverse: '#ffffff',
      placeholder: '#9ca3af',
    },

    // Border colors
    border: {
      DEFAULT: '#e5e7eb',
      strong: '#000000',
      light: '#f3f4f6',
      medium: '#d1d5db',
      focus: '#000000',
    },

    // Status colors with better contrast
    success: {
      DEFAULT: '#16a34a',
      light: '#dcfce7',
      dark: '#15803d',
      text: '#14532d',
    },
    error: {
      DEFAULT: '#dc2626',
      light: '#fee2e2',
      dark: '#b91c1c',
      text: '#7f1d1d',
    },
    warning: {
      DEFAULT: '#ea580c',
      light: '#ffedd5',
      dark: '#c2410c',
      text: '#7c2d12',
    },
    info: {
      DEFAULT: '#0891b2',
      light: '#e0f2fe',
      dark: '#0e7490',
      text: '#164e63',
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },

  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',    // 4px
    DEFAULT: '0.5rem', // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      mono: '"Fira Code", "Courier New", monospace',
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
      base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
      '5xl': ['3rem', { lineHeight: '1' }],         // 48px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Z-index scale
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
} as const;

export type Theme = typeof theme;

// Helper function to get theme values
export const getThemeValue = (path: string): any => {
  return path.split('.').reduce((obj, key) => obj?.[key], theme as any);
};

export default theme;
