export interface ServiceColorScheme {
  primary: string;
  gradient: string;
  light: string;
  text: string;
  emoji: string;
  name: string;
}

export const SERVICE_COLORS: Record<string, ServiceColorScheme> = {
  walker: {
    primary: '#10B981',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    light: '#D1FAE5',
    text: '#065F46',
    emoji: '🏃',
    name: 'Paseo'
  },
  daycare: {
    primary: '#F59E0B',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    light: '#FEF3C7',
    text: '#92400E',
    emoji: '🏃',
    name: 'Guardería'
  },
  hotel: {
    primary: '#0891B2',
    gradient: 'linear-gradient(135deg, #0891B2 0%, #0E7490 100%)',
    light: '#CFFAFE',
    text: '#164E63',
    emoji: '🏨',
    name: 'Hospedaje'
  },
  grooming: {
    primary: '#FF8B7F',
    gradient: 'linear-gradient(135deg, #FF8B7F 0%, #FF9999 100%)',
    light: '#FFE4E1',
    text: '#C85A54',
    emoji: '✂️',
    name: 'Peluquería'
  },
  vet: {
    primary: '#06B6D4',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
    light: '#CFFAFE',
    text: '#155E75',
    emoji: '🩺',
    name: 'Veterinaria'
  },
  sitter: {
    primary: '#8B5CF6',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    light: '#EDE9FE',
    text: '#5B21B6',
    emoji: '🏠',
    name: 'Cuidador'
  },
  trainer: {
    primary: '#EF4444',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
    light: '#FEE2E2',
    text: '#991B1B',
    emoji: '🎓',
    name: 'Entrenador'
  }
};

export const getServiceColor = (serviceType: string): ServiceColorScheme => {
  return SERVICE_COLORS[serviceType] || SERVICE_COLORS.walker;
};

export const getServiceColors = (serviceTypes: string[]): ServiceColorScheme[] => {
  return serviceTypes.map(type => getServiceColor(type));
};
