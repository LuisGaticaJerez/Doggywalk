import { getServiceColor } from '../utils/serviceColors';

interface ServicePawBadgesProps {
  serviceTypes: string[];
  size?: 'small' | 'medium' | 'large';
}

const PawIcon = ({ color, size }: { color: string; size: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    style={{
      filter: `drop-shadow(0 1px 2px ${color}40)`
    }}
  >
    <path d="M12 20C12 20 3 15 3 9C3 6.5 4.5 5 6.5 5C8 5 9.5 6 10 7C10.5 6 12 5 13.5 5C15.5 5 17 6.5 17 9C17 11 14 14 12 20Z" />
    <ellipse cx="8" cy="9" rx="1.5" ry="2" />
    <ellipse cx="12" cy="8" rx="1.5" ry="2" />
    <ellipse cx="16" cy="9" rx="1.5" ry="2" />
    <ellipse cx="12" cy="13" rx="2.5" ry="3" />
  </svg>
);

export default function ServicePawBadges({ serviceTypes, size = 'medium' }: ServicePawBadgesProps) {
  if (!serviceTypes || serviceTypes.length === 0) return null;

  const sizes = {
    small: {
      paw: 14,
      text: '11px',
      gap: '6px',
      itemGap: '4px'
    },
    medium: {
      paw: 18,
      text: '13px',
      gap: '8px',
      itemGap: '5px'
    },
    large: {
      paw: 22,
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
            <PawIcon color={colors.primary} size={currentSize.paw} />
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
