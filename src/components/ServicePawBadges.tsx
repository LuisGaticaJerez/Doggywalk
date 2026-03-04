import { getServiceColor } from '../utils/serviceColors';

interface ServicePawBadgesProps {
  serviceTypes: string[];
  size?: 'small' | 'medium' | 'large';
}

export default function ServicePawBadges({ serviceTypes, size = 'medium' }: ServicePawBadgesProps) {
  if (!serviceTypes || serviceTypes.length === 0) return null;

  const sizes = {
    small: {
      paw: '14px',
      text: '11px',
      gap: '6px',
      itemGap: '4px'
    },
    medium: {
      paw: '18px',
      text: '13px',
      gap: '8px',
      itemGap: '5px'
    },
    large: {
      paw: '22px',
      text: '15px',
      gap: '10px',
      itemGap: '6px'
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: currentSize.itemGap,
              transition: 'all 0.2s ease'
            }}
          >
            <span
              style={{
                fontSize: currentSize.paw,
                color: colors.primary,
                filter: `drop-shadow(0 1px 2px ${colors.primary}40)`
              }}
            >
              🐾
            </span>
            <span
              style={{
                fontSize: currentSize.text,
                fontWeight: '600',
                color: colors.text
              }}
            >
              {colors.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
