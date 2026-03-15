export const theme = {
  colors: {
    primary: '#FF6B6B',
    primaryLight: '#FEF2F2',
    secondary: '#FFA500',
    accent: '#FFD93D',

    success: '#4CAF50',
    successLight: '#E8F5E9',
    warning: '#FFA726',
    warningLight: '#FFF3E0',
    error: '#EF5350',
    errorLight: '#FFEBEE',
    info: '#29B6F6',
    infoLight: '#E1F5FE',

    text: {
      primary: '#334155',
      secondary: '#475569',
      tertiary: '#64748B',
      disabled: '#94a3b8',
      inverse: '#FFFFFF',
    },

    border: {
      default: '#e2e8f0',
      light: '#f1f5f9',
      medium: '#cbd5e1',
      dark: '#94a3b8',
    },

    background: {
      default: '#FFFFFF',
      light: '#f8fafc',
      lighter: '#f1f5f9',
      paper: '#FFFFFF',
    },

    status: {
      pending: '#FFA726',
      accepted: '#29B6F6',
      inProgress: '#66BB6A',
      completed: '#4CAF50',
      cancelled: '#EF5350',
      declined: '#757575',
    },
  },

  gradients: {
    primary: 'linear-gradient(135deg, #FF6B6B 0%, #FFA500 50%, #FFD93D 100%)',
    secondary: 'linear-gradient(135deg, #FF6B6B 0%, #FFA500 100%)',
    tertiary: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
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
