import { getServiceColor } from '../utils/serviceColors';

interface ServicePawBadgesProps {
  serviceTypes: string[];
  size?: 'small' | 'medium' | 'large';
}

export default function ServicePawBadges({ serviceTypes, size = 'medium' }: ServicePawBadgesProps) {
  if (!serviceTypes || serviceTypes.length === 0) return null;

  const sizes = {
    small: {
      paw: '16px',
      gap: '4px'
    },
    medium: {
      paw: '20px',
      gap: '6px'
    },
    large: {
      paw: '24px',
      gap: '8px'
    }
  };

  const currentSize = sizes[size];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: currentSize.gap,
        flexWrap: 'wrap'
      }}
    >
      {serviceTypes.map((serviceType, index) => {
        const colors = getServiceColor(serviceType);

        return (
          <div
            key={`${serviceType}-${index}`}
            style={{
              fontSize: currentSize.paw,
              filter: `drop-shadow(0 2px 4px ${colors.primary}40)`,
              cursor: 'help',
              transition: 'all 0.2s ease'
            }}
            title={colors.name}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.2) rotate(15deg)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            }}
          >
            <span style={{ color: colors.primary }}>🐾</span>
          </div>
        );
      })}
    </div>
  );
}
