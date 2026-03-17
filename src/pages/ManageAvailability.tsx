import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { theme } from '../styles/theme';

interface ServiceHours {
  id?: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface AvailabilityException {
  id?: string;
  exception_date: string;
  is_available: boolean;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

const DAYS_OF_WEEK = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export default function ManageAvailability() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [serviceHours, setServiceHours] = useState<ServiceHours[]>([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [showExceptionForm, setShowExceptionForm] = useState(false);
  const [newException, setNewException] = useState<AvailabilityException>({
    exception_date: '',
    is_available: false,
    reason: ''
  });

  useEffect(() => {
    loadAvailability();
  }, [profile?.id]);

  const loadAvailability = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const [hoursRes, exceptionsRes] = await Promise.all([
        supabase
          .from('service_hours')
          .select('*')
          .eq('pet_master_id', profile.id)
          .order('day_of_week'),
        supabase
          .from('provider_availability_exceptions')
          .select('*')
          .eq('provider_id', profile.id)
          .gte('exception_date', new Date().toISOString().split('T')[0])
          .order('exception_date')
      ]);

      if (hoursRes.data && hoursRes.data.length > 0) {
        setServiceHours(hoursRes.data.map(h => ({
          id: h.id,
          day_of_week: h.day_of_week,
          open_time: h.open_time || '09:00',
          close_time: h.close_time || '18:00',
          is_closed: h.is_closed || false
        })));
      } else {
        const defaultHours: ServiceHours[] = Array.from({ length: 7 }, (_, i) => ({
          day_of_week: i,
          open_time: '09:00',
          close_time: '18:00',
          is_closed: i === 0
        }));
        setServiceHours(defaultHours);
      }

      if (exceptionsRes.data) {
        setExceptions(exceptionsRes.data);
      }
    } catch (error) {
      console.error('Error loading availability:', error);
      showToast('Error al cargar disponibilidad', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHourChange = (dayIndex: number, field: keyof ServiceHours, value: any) => {
    setServiceHours(prev => prev.map((h, i) =>
      i === dayIndex ? { ...h, [field]: value } : h
    ));
  };

  const saveServiceHours = async () => {
    if (!profile?.id) return;

    try {
      setSaving(true);

      for (const hours of serviceHours) {
        if (hours.id) {
          await supabase
            .from('service_hours')
            .update({
              open_time: hours.open_time,
              close_time: hours.close_time,
              is_closed: hours.is_closed,
              updated_at: new Date().toISOString()
            })
            .eq('id', hours.id);
        } else {
          await supabase
            .from('service_hours')
            .insert({
              pet_master_id: profile.id,
              day_of_week: hours.day_of_week,
              open_time: hours.open_time,
              close_time: hours.close_time,
              is_closed: hours.is_closed
            });
        }
      }

      showToast('Horarios guardados exitosamente', 'success');
      await loadAvailability();
    } catch (error) {
      console.error('Error saving hours:', error);
      showToast('Error al guardar horarios', 'error');
    } finally {
      setSaving(false);
    }
  };

  const addException = async () => {
    if (!profile?.id || !newException.exception_date) {
      showToast('Por favor completa la fecha', 'error');
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('provider_availability_exceptions')
        .insert({
          provider_id: profile.id,
          exception_date: newException.exception_date,
          is_available: newException.is_available,
          start_time: newException.start_time || null,
          end_time: newException.end_time || null,
          reason: newException.reason || null
        });

      if (error) throw error;

      showToast('Excepción agregada exitosamente', 'success');
      setShowExceptionForm(false);
      setNewException({
        exception_date: '',
        is_available: false,
        reason: ''
      });
      await loadAvailability();
    } catch (error) {
      console.error('Error adding exception:', error);
      showToast('Error al agregar excepción', 'error');
    } finally {
      setSaving(false);
    }
  };

  const deleteException = async (id: string) => {
    try {
      await supabase
        .from('provider_availability_exceptions')
        .delete()
        .eq('id', id);

      showToast('Excepción eliminada', 'success');
      await loadAvailability();
    } catch (error) {
      console.error('Error deleting exception:', error);
      showToast('Error al eliminar excepción', 'error');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `4px solid ${theme.colors.teal[100]}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: theme.colors.text.secondary }}>{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 16px',
              background: theme.colors.gray[100],
              color: theme.colors.text.primary,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ← Volver
          </button>
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: theme.colors.text.primary,
          marginBottom: '8px'
        }}>
          Gestionar Disponibilidad
        </h1>
        <p style={{
          color: theme.colors.text.secondary,
          marginBottom: '32px'
        }}>
          Configura tus horarios de atención y días disponibles
        </p>

        {/* Weekly Schedule */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: theme.shadows.md
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: '20px'
          }}>
            Horario Semanal
          </h2>

          {serviceHours.map((hours, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                background: hours.is_closed ? theme.colors.gray[50] : 'white',
                borderRadius: '8px',
                marginBottom: '12px',
                border: `1px solid ${theme.colors.border.default}`
              }}
            >
              <div style={{ width: '120px', fontWeight: '500', color: theme.colors.text.primary }}>
                {DAYS_OF_WEEK[hours.day_of_week]}
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={!hours.is_closed}
                  onChange={(e) => handleHourChange(index, 'is_closed', !e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>
                  Abierto
                </span>
              </label>

              {!hours.is_closed && (
                <>
                  <input
                    type="time"
                    value={hours.open_time}
                    onChange={(e) => handleHourChange(index, 'open_time', e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                  <span style={{ color: theme.colors.text.tertiary }}>a</span>
                  <input
                    type="time"
                    value={hours.close_time}
                    onChange={(e) => handleHourChange(index, 'close_time', e.target.value)}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${theme.colors.border.default}`,
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </>
              )}

              {hours.is_closed && (
                <span style={{ color: theme.colors.text.disabled, fontSize: '14px' }}>
                  Cerrado
                </span>
              )}
            </div>
          ))}

          <button
            onClick={saveServiceHours}
            disabled={saving}
            style={{
              marginTop: '16px',
              padding: '12px 24px',
              background: theme.gradients.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
              boxShadow: theme.shadows.md,
              width: '100%'
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Horarios'}
          </button>
        </div>

        {/* Exceptions */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: theme.shadows.md
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              color: theme.colors.text.primary
            }}>
              Excepciones y Días Bloqueados
            </h2>
            <button
              onClick={() => setShowExceptionForm(!showExceptionForm)}
              style={{
                padding: '8px 16px',
                background: theme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showExceptionForm ? 'Cancelar' : '+ Agregar'}
            </button>
          </div>

          {showExceptionForm && (
            <div style={{
              padding: '20px',
              background: theme.colors.background.tealLight,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: theme.colors.text.primary
                }}>
                  Fecha
                </label>
                <input
                  type="date"
                  value={newException.exception_date}
                  onChange={(e) => setNewException({ ...newException, exception_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!newException.is_available}
                    onChange={(e) => setNewException({ ...newException, is_available: !e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '500', color: theme.colors.text.primary }}>
                    Bloquear día completo
                  </span>
                </label>
              </div>

              {newException.is_available && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      fontSize: '14px'
                    }}>
                      Desde
                    </label>
                    <input
                      type="time"
                      value={newException.start_time || ''}
                      onChange={(e) => setNewException({ ...newException, start_time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: theme.colors.text.primary,
                      fontSize: '14px'
                    }}>
                      Hasta
                    </label>
                    <input
                      type="time"
                      value={newException.end_time || ''}
                      onChange={(e) => setNewException({ ...newException, end_time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: `1px solid ${theme.colors.border.default}`,
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: theme.colors.text.primary
                }}>
                  Razón (opcional)
                </label>
                <input
                  type="text"
                  value={newException.reason || ''}
                  onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                  placeholder="Ej: Vacaciones, Día festivo, etc."
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <button
                onClick={addException}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Guardando...' : 'Guardar Excepción'}
              </button>
            </div>
          )}

          {exceptions.length === 0 ? (
            <p style={{
              textAlign: 'center',
              color: theme.colors.text.tertiary,
              padding: '40px 20px'
            }}>
              No hay excepciones configuradas
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {exceptions.map((exception) => (
                <div
                  key={exception.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: exception.is_available ? theme.colors.background.tealLight : theme.colors.background.orangeLight,
                    borderRadius: '8px',
                    border: `1px solid ${exception.is_available ? theme.colors.teal[200] : theme.colors.orange[200]}`
                  }}
                >
                  <div>
                    <div style={{
                      fontWeight: '600',
                      color: theme.colors.text.primary,
                      marginBottom: '4px'
                    }}>
                      {new Date(exception.exception_date + 'T00:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {exception.start_time && exception.end_time ? (
                      <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                        {exception.start_time} - {exception.end_time}
                      </div>
                    ) : (
                      <div style={{ fontSize: '14px', color: theme.colors.text.secondary }}>
                        Día completo bloqueado
                      </div>
                    )}
                    {exception.reason && (
                      <div style={{ fontSize: '13px', color: theme.colors.text.tertiary, marginTop: '4px' }}>
                        {exception.reason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => exception.id && deleteException(exception.id)}
                    style={{
                      padding: '8px 12px',
                      background: theme.colors.error,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}