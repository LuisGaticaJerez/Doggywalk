import { CSSProperties, ReactNode } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: string;
  style?: CSSProperties;
}

export function ResponsiveGrid({
  children,
  columns = { mobile: 1, tablet: 2, desktop: 2 },
  gap = '12px',
  style
}: ResponsiveGridProps) {
  return (
    <>
      <div
        className="responsive-grid"
        style={{
          display: 'grid',
          gap,
          ...style
        }}
      >
        {children}
      </div>
      <style>{`
        .responsive-grid {
          grid-template-columns: repeat(${columns.mobile || 1}, 1fr);
        }

        @media (min-width: 768px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.tablet || 2}, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .responsive-grid {
            grid-template-columns: repeat(${columns.desktop || 2}, 1fr);
          }
        }
      `}</style>
    </>
  );
}
