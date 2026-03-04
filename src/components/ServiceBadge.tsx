import { getServiceColor } from '../utils/serviceColors';

interface ServiceBadgeProps {
  serviceType: string;
  size?: 'small' | 'medium' | 'large';
  showName?: boolean;
}

export default function ServiceBadge({ serviceType, size = 'medium', showName = true }: ServiceBadgeProps) {
  const colors = getServiceColor(serviceType);

  const sizes = {
    small: {
      padding: '4px 10px',
      fontSize: '11px',
      emoji: '14px'
    },
    medium: {
      padding: '6px 14px',
      fontSize: '13px',
      emoji: '16px'
    },
    large: {
      padding: '8px 18px',
      fontSize: '15px',
      emoji: '18px'
    }
  };

  const currentSize = sizes[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: currentSize.padding,
        background: colors.light,
        color: colors.text,
        borderRadius: '20px',
        fontSize: currentSize.fontSize,
        fontWeight: '600',
        border: `1.5px solid ${colors.primary}`,
        boxShadow: `0 2px 6px ${colors.primary}20`
      }}
    >
      <span style={{ fontSize: currentSize.emoji }}>{colors.emoji}</span>
      {showName && <span>{colors.name}</span>}
    </span>
  );
}
