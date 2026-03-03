import React from 'react';
import { useI18n } from '../contexts/I18nContext';

interface GroomingServicesProps {
  services: {
    has_bathing: boolean;
    has_haircut: boolean;
    has_nail_trimming: boolean;
    has_ear_cleaning: boolean;
    has_teeth_cleaning: boolean;
    has_styling: boolean;
    has_spa_treatments: boolean;
    has_flea_treatment: boolean;
    has_deshedding: boolean;
    accepts_small_dogs: boolean;
    accepts_medium_dogs: boolean;
    accepts_large_dogs: boolean;
    accepts_cats: boolean;
  };
  onChange?: (services: any) => void;
  readOnly?: boolean;
}

const GroomingServices: React.FC<GroomingServicesProps> = ({
  services,
  onChange,
  readOnly = false
}) => {
  const { t } = useI18n();

  const handleChange = (field: string, value: boolean) => {
    if (onChange) {
      onChange({ ...services, [field]: value });
    }
  };

  const ServiceCheckbox = ({ field, label }: { field: string; label: string }) => (
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
      cursor: readOnly ? 'default' : 'pointer'
    }}>
      <input
        type="checkbox"
        checked={(services as any)[field]}
        onChange={(e) => handleChange(field, e.target.checked)}
        disabled={readOnly}
        style={{ cursor: readOnly ? 'default' : 'pointer' }}
      />
      <span style={{ fontSize: '14px' }}>{label}</span>
    </label>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
          {t.provider?.services || 'Services'}
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '8px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <ServiceCheckbox field="has_bathing" label="🛁 Baño Completo" />
          <ServiceCheckbox field="has_haircut" label="✂️ Corte de Pelo" />
          <ServiceCheckbox field="has_nail_trimming" label="💅 Corte de Uñas" />
          <ServiceCheckbox field="has_ear_cleaning" label="👂 Limpieza de Oídos" />
          <ServiceCheckbox field="has_teeth_cleaning" label="🦷 Limpieza Dental" />
          <ServiceCheckbox field="has_styling" label="💇 Peinado y Estilismo" />
          <ServiceCheckbox field="has_spa_treatments" label="🧖 Tratamientos Spa" />
          <ServiceCheckbox field="has_flea_treatment" label="🐛 Tratamiento Antipulgas" />
          <ServiceCheckbox field="has_deshedding" label="🪮 Deslanado" />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '12px', fontSize: '16px', fontWeight: '600' }}>
          Acepta
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '8px',
          padding: '12px',
          background: '#f9fafb',
          borderRadius: '8px'
        }}>
          <ServiceCheckbox field="accepts_small_dogs" label="🐕 Perros Pequeños" />
          <ServiceCheckbox field="accepts_medium_dogs" label="🐕 Perros Medianos" />
          <ServiceCheckbox field="accepts_large_dogs" label="🐕 Perros Grandes" />
          <ServiceCheckbox field="accepts_cats" label="🐈 Gatos" />
        </div>
      </div>
    </div>
  );
};

export default GroomingServices;
