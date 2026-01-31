import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';

interface ServiceHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface ServiceHoursProps {
  petMasterId: string;
  editable?: boolean;
}

export default function ServiceHours({ petMasterId, editable = false }: ServiceHoursProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [hours, setHours] = useState<ServiceHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    t.days?.sunday || 'Sunday',
    t.days?.monday || 'Monday',
    t.days?.tuesday || 'Tuesday',
    t.days?.wednesday || 'Wednesday',
    t.days?.thursday || 'Thursday',
    t.days?.friday || 'Friday',
    t.days?.saturday || 'Saturday'
  ];

  useEffect(() => {
    loadServiceHours();
  }, [petMasterId]);

  const loadServiceHours = async () => {
    try {
      const { data, error } = await supabase
        .from('service_hours')
        .select('*')
        .eq('pet_master_id', petMasterId)
        .order('day_of_week');

      if (error) throw error;

      if (data && data.length > 0) {
        setHours(data);
      } else {
        setHours(
          Array.from({ length: 7 }, (_, i) => ({
            id: `new-${i}`,
            day_of_week: i,
            open_time: '09:00',
            close_time: '18:00',
            is_closed: false
          }))
        );
      }
    } catch (error) {
      console.error('Error loading service hours:', error);
      showToast(t.errors?.loadFailed || 'Failed to load service hours', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    setHours(prev =>
      prev.map((h, i) =>
        i === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const handleClosedToggle = (dayIndex: number) => {
    setHours(prev =>
      prev.map((h, i) =>
        i === dayIndex ? { ...h, is_closed: !h.is_closed } : h
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const hour of hours) {
        if (hour.id.startsWith('new-')) {
          const { error } = await supabase
            .from('service_hours')
            .insert({
              pet_master_id: petMasterId,
              day_of_week: hour.day_of_week,
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed
            });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('service_hours')
            .update({
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed
            })
            .eq('id', hour.id);
          if (error) throw error;
        }
      }

      showToast(t.success?.saved || 'Service hours saved successfully', 'success');
      loadServiceHours();
    } catch (error) {
      console.error('Error saving service hours:', error);
      showToast(t.errors?.saveFailed || 'Failed to save service hours', 'error');
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
          🕐 {t.serviceHours?.title || 'Horario de Atención'}
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Configura tus horarios de disponibilidad por día
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {hours.map((hour, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 16px',
              background: hour.is_closed ? '#F8FAFC' : '#FFFFFF',
              borderRadius: '10px',
              border: '2px solid',
              borderColor: hour.is_closed ? '#E2E8F0' : '#DBEAFE'
            }}
          >
            <div style={{
              minWidth: '100px',
              fontWeight: '600',
              color: '#1e293b',
              fontSize: '14px'
            }}>
              {daysOfWeek[hour.day_of_week]}
            </div>

            {editable ? (
              <>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={hour.is_closed}
                    onChange={() => handleClosedToggle(index)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#EF4444'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>
                    {t.serviceHours?.closed || 'Cerrado'}
                  </span>
                </label>

                {!hour.is_closed && (
                  <>
                    <input
                      type="time"
                      value={hour.open_time}
                      onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                    <span style={{ color: '#94a3b8', fontWeight: '600' }}>-</span>
                    <input
                      type="time"
                      value={hour.close_time}
                      onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                      style={{
                        padding: '6px 12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    />
                  </>
                )}
              </>
            ) : (
              <div style={{ color: '#64748b', fontSize: '14px', fontWeight: '500', flex: 1 }}>
                {hour.is_closed
                  ? (t.serviceHours?.closed || 'Cerrado')
                  : `${hour.open_time} - ${hour.close_time}`}
              </div>
            )}
          </div>
        ))}
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
