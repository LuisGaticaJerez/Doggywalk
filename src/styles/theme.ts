export const theme = {
  colors: {
    primary: '#00BCD4',
    primaryLight: '#E0F7FA',
    primaryDark: '#0097A7',
    secondary: '#FF9800',
    secondaryLight: '#FFF3E0',
    secondaryDark: '#F57C00',
    accent: '#00ACC1',

    teal: {
      50: '#E0F7FA',
      100: '#B2EBF2',
      200: '#80DEEA',
      300: '#4DD0E1',
      400: '#26C6DA',
      500: '#00BCD4',
      600: '#00ACC1',
      700: '#0097A7',
      800: '#00838F',
      900: '#006064',
    },

    orange: {
      50: '#FFF3E0',
      100: '#FFE0B2',
      200: '#FFCC80',
      300: '#FFB74D',
      400: '#FFA726',
      500: '#FF9800',
      600: '#FB8C00',
      700: '#F57C00',
      800: '#EF6C00',
      900: '#E65100',
    },

    success: '#4CAF50',
    successLight: '#C8E6C9',
    successDark: '#388E3C',
    warning: '#FFC107',
    warningLight: '#FFF9C4',
    warningDark: '#FFA000',
    error: '#F44336',
    errorLight: '#FFCDD2',
    errorDark: '#D32F2F',
    info: '#03A9F4',
    infoLight: '#B3E5FC',
    infoDark: '#0288D1',

    text: {
      primary: '#212121',
      secondary: '#616161',
      tertiary: '#757575',
      disabled: '#BDBDBD',
      inverse: '#FFFFFF',
    },

    gray: {
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#EEEEEE',
      300: '#E0E0E0',
      400: '#BDBDBD',
      500: '#9E9E9E',
      600: '#757575',
      700: '#616161',
      800: '#424242',
      900: '#212121',
    },

    border: {
      default: '#EEEEEE',
      light: '#F5F5F5',
      medium: '#E0E0E0',
      dark: '#BDBDBD',
    },

    background: {
      default: '#FFFFFF',
      light: '#FAFAFA',
      lighter: '#F5F5F5',
      paper: '#FFFFFF',
      tealLight: '#E0F7FA',
      orangeLight: '#FFF3E0',
    },

    status: {
      pending: '#FF9800',
      accepted: '#00BCD4',
      inProgress: '#00ACC1',
      completed: '#4CAF50',
      cancelled: '#F44336',
      declined: '#757575',
    },
  },

  gradients: {
    primary: 'linear-gradient(135deg, #00BCD4 0%, #00ACC1 100%)',
    secondary: 'linear-gradient(135deg, #FF9800 0%, #FB8C00 100%)',
    warm: 'linear-gradient(135deg, #00BCD4 0%, #FF9800 100%)',
    softBackground: 'linear-gradient(135deg, #E0F7FA 0%, #FFF3E0 100%)',
    hero: 'linear-gradient(135deg, rgba(0, 188, 212, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
    huge: '40px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '50px',
  },

  shadows: {
    sm: '0 2px 4px rgba(0,0,0,0.1)',
    md: '0 4px 12px rgba(0,0,0,0.15)',
    lg: '0 8px 24px rgba(0,0,0,0.2)',
    xl: '0 12px 40px rgba(0,0,0,0.25)',
  },

  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.2s ease',
    slow: 'all 0.3s ease',
  },

  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '15px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
      xxxl: '32px',
      huge: '48px',
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.75',
    },
  },

  breakpoints: {
    mobile: '320px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },

  zIndex: {
    base: 0,
    dropdown: 1000,
    modal: 2000,
    tooltip: 3000,
    notification: 4000,
  },
};

export const buttonStyles = {
  base: {
    padding: '12px 24px',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    cursor: 'pointer',
    border: 'none',
    transition: theme.transitions.normal,
    fontFamily: theme.typography.fontFamily,
  },

  primary: {
    background: theme.gradients.secondary,
    color: theme.colors.text.inverse,
    boxShadow: theme.shadows.md,
  },

  secondary: {
    background: theme.colors.background.default,
    color: theme.colors.text.primary,
    border: `2px solid ${theme.colors.border.default}`,
  },

  outlined: {
    background: 'transparent',
    color: theme.colors.primary,
    border: `2px solid ${theme.colors.primary}`,
  },

  disabled: {
    background: theme.colors.border.light,
    color: theme.colors.text.disabled,
    cursor: 'not-allowed',
    opacity: 0.6,
  },
};

export const inputStyles = {
  base: {
    width: '100%',
    padding: '12px 16px',
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSize.md,
    fontFamily: theme.typography.fontFamily,
    outline: 'none',
    transition: theme.transitions.normal,
    background: theme.colors.background.default,
    color: theme.colors.text.primary,
  },

  focus: {
    borderColor: theme.colors.primary,
    boxShadow: `0 0 0 3px ${theme.colors.primaryLight}`,
  },

  error: {
    borderColor: theme.colors.error,
  },

  disabled: {
    background: theme.colors.background.light,
    color: theme.colors.text.disabled,
    cursor: 'not-allowed',
  },
};

export const labelStyles = {
  base: {
    display: 'block',
    marginBottom: theme.spacing.sm,
    color: theme.colors.text.secondary,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    fontFamily: theme.typography.fontFamily,
  },
};

export const cardStyles = {
  base: {
    background: theme.colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xxxl,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.border.default}`,
  },

  hover: {
    boxShadow: theme.shadows.lg,
    transform: 'translateY(-2px)',
  },
};

export const containerStyles = {
  page: {
    minHeight: '100vh',
    padding: theme.spacing.xl,
    fontFamily: theme.typography.fontFamily,
  },

  centered: {
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },

  form: {
    maxWidth: '600px',
    margin: '0 auto',
    width: '100%',
  },
};

export const getStatusColor = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: theme.colors.status.pending,
    accepted: theme.colors.status.accepted,
    in_progress: theme.colors.status.inProgress,
    completed: theme.colors.status.completed,
    cancelled: theme.colors.status.cancelled,
    declined: theme.colors.status.declined,
  };

  return statusMap[status] || theme.colors.border.medium;
};

export const getServiceColor = (service: string): string => {
  const serviceMap: Record<string, string> = {
    walker: '#4CAF50',
    hotel: '#2196F3',
    vet: '#F44336',
    grooming: '#FF9800',
  };

  return serviceMap[service] || theme.colors.primary;
};

export const mediaQueries = {
  mobile: `@media (max-width: ${theme.breakpoints.tablet})`,
  tablet: `@media (min-width: ${theme.breakpoints.tablet}) and (max-width: ${theme.breakpoints.desktop})`,
  desktop: `@media (min-width: ${theme.breakpoints.desktop})`,
};
