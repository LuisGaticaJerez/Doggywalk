import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';

interface VetServicesData {
  id?: string;
  consultations: boolean;
  vaccinations: boolean;
  surgery: boolean;
  laboratory: boolean;
  radiology: boolean;
  ultrasound: boolean;
  dentistry: boolean;
  grooming: boolean;
  hospitalization: boolean;
  emergency: boolean;
  home_visits: boolean;
  microchipping: boolean;
}

interface VetServicesProps {
  petMasterId: string;
  editable?: boolean;
}

export default function VetServices({ petMasterId, editable = false }: VetServicesProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [services, setServices] = useState<VetServicesData>({
    consultations: false,
    vaccinations: false,
    surgery: false,
    laboratory: false,
    radiology: false,
    ultrasound: false,
    dentistry: false,
    grooming: false,
    hospitalization: false,
    emergency: false,
    home_visits: false,
    microchipping: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const serviceList = [
    { key: 'consultations', label: t.vetServices?.consultations || 'Consultations', icon: '🩺' },
    { key: 'vaccinations', label: t.vetServices?.vaccinations || 'Vaccinations', icon: '💉' },
    { key: 'surgery', label: t.vetServices?.surgery || 'Surgery', icon: '⚕️' },
    { key: 'laboratory', label: t.vetServices?.laboratory || 'Laboratory', icon: '🔬' },
    { key: 'radiology', label: t.vetServices?.radiology || 'Radiology', icon: '📡' },
    { key: 'ultrasound', label: t.vetServices?.ultrasound || 'Ultrasound', icon: '🔊' },
    { key: 'dentistry', label: t.vetServices?.dentistry || 'Dentistry', icon: '🦷' },
    { key: 'grooming', label: t.vetServices?.grooming || 'Grooming', icon: '✂️' },
    { key: 'hospitalization', label: t.vetServices?.hospitalization || 'Hospitalization', icon: '🏥' },
    { key: 'emergency', label: t.vetServices?.emergency || 'Emergency 24/7', icon: '🚨' },
    { key: 'home_visits', label: t.vetServices?.homeVisits || 'Home Visits', icon: '🏠' },
    { key: 'microchipping', label: t.vetServices?.microchipping || 'Microchipping', icon: '🔖' }
  ];

  useEffect(() => {
    loadServices();
  }, [petMasterId]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('vet_services')
        .select('*')
        .eq('pet_master_id', petMasterId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading vet services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setServices(prev => ({
      ...prev,
      [key]: !prev[key as keyof VetServicesData]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const servicesData = {
        pet_master_id: petMasterId,
        consultations: services.consultations,
        vaccinations: services.vaccinations,
        surgery: services.surgery,
        laboratory: services.laboratory,
        radiology: services.radiology,
        ultrasound: services.ultrasound,
        dentistry: services.dentistry,
        grooming: services.grooming,
        hospitalization: services.hospitalization,
        emergency: services.emergency,
        home_visits: services.home_visits,
        microchipping: services.microchipping
      };

      if (services.id) {
        const { error } = await supabase
          .from('vet_services')
          .update(servicesData)
          .eq('id', services.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vet_services')
          .insert(servicesData);
        if (error) throw error;
      }

      showToast(t.success?.saved || 'Services saved successfully', 'success');
      loadServices();
    } catch (error) {
      console.error('Error saving vet services:', error);
      showToast(t.errors?.saveFailed || 'Failed to save services', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const activeServices = serviceList.filter(item => services[item.key as keyof VetServicesData]);

  if (!editable && activeServices.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #DBEAFE',
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
          🏥 {t.vetServices?.title || 'Servicios Veterinarios'}
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
          {t.vetServices?.noServices || 'No hay servicios listados'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '2px solid #DBEAFE',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
          🏥 {t.vetServices?.title || 'Servicios Veterinarios'}
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Servicios médicos y especializados que ofreces en tu clínica
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px'
      }}>
        {serviceList.map((item) => {
          const isActive = services[item.key as keyof VetServicesData];

          if (!editable && !isActive) return null;

          return (
            <label
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: isActive ? '#10b981' : '#e2e8f0',
                background: isActive ? '#F0FDF4' : '#ffffff',
                cursor: editable ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (editable && !isActive) {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (editable && !isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
            >
              {editable && (
                <input
                  type="checkbox"
                  checked={Boolean(isActive)}
                  onChange={() => handleToggle(item.key)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#10b981'
                  }}
                />
              )}
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{
                flex: 1,
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#1e293b' : '#64748b'
              }}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>

      {editable && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #f1f5f9' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            {saving
              ? '⏳ ' + (t.common?.saving || 'Guardando...')
              : '💾 ' + (t.common?.save || 'Guardar Cambios')}
          </button>
        </div>
      )}
    </div>
  );
}
