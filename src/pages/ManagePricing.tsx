import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { theme } from '../styles/theme';

interface PriceModifier {
  id?: string;
  name: string;
  modifier_type: 'time_of_day' | 'day_of_week' | 'date_range';
  multiplier: number;
  start_time?: string;
  end_time?: string;
  days_of_week?: number[];
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export default function ManagePricing() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modifiers, setModifiers] = useState<PriceModifier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newModifier, setNewModifier] = useState<PriceModifier>({
    name: '',
    modifier_type: 'time_of_day',
    multiplier: 1.0,
    is_active: true
  });

  useEffect(() => {
    loadPriceModifiers();
  }, [profile?.id]);

  const loadPriceModifiers = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('price_modifiers')
        .select('*')
        .eq('provider_id', profile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setModifiers(data || []);
    } catch (error) {
      console.error('Error loading price modifiers:', error);
      showToast('Error al cargar modificadores de precio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveModifier = async () => {
    if (!profile?.id || !newModifier.name) {
      showToast('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    try {
      setSaving(true);

      const modifierData: any = {
        provider_id: profile.id,
        name: newModifier.name,
        modifier_type: newModifier.modifier_type,
        multiplier: newModifier.multiplier,
        is_active: newModifier.is_active
      };

      if (newModifier.modifier_type === 'time_of_day') {
        if (!newModifier.start_time || !newModifier.end_time) {
          showToast('Por favor selecciona el rango horario', 'error');
          setSaving(false);
          return;
        }
        modifierData.start_time = newModifier.start_time;
        modifierData.end_time = newModifier.end_time;
      } else if (newModifier.modifier_type === 'day_of_week') {
        if (!newModifier.days_of_week || newModifier.days_of_week.length === 0) {
          showToast('Por favor selecciona al menos un día', 'error');
          setSaving(false);
          return;
        }
        modifierData.days_of_week = newModifier.days_of_week;
      } else if (newModifier.modifier_type === 'date_range') {
        if (!newModifier.start_date || !newModifier.end_date) {
          showToast('Por favor selecciona el rango de fechas', 'error');
          setSaving(false);
          return;
        }
        modifierData.start_date = newModifier.start_date;
        modifierData.end_date = newModifier.end_date;
      }

      const { error } = await supabase
        .from('price_modifiers')
        .insert(modifierData);

      if (error) throw error;

      showToast('Modificador creado exitosamente', 'success');
      setShowForm(false);
      setNewModifier({
        name: '',
        modifier_type: 'time_of_day',
        multiplier: 1.0,
        is_active: true
      });
      await loadPriceModifiers();
    } catch (error) {
      console.error('Error saving modifier:', error);
      showToast('Error al guardar modificador', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleModifier = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('price_modifiers')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      showToast('Estado actualizado', 'success');
      await loadPriceModifiers();
    } catch (error) {
      console.error('Error toggling modifier:', error);
      showToast('Error al actualizar estado', 'error');
    }
  };

  const deleteModifier = async (id: string) => {
    try {
      const { error } = await supabase
        .from('price_modifiers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Modificador eliminado', 'success');
      await loadPriceModifiers();
    } catch (error) {
      console.error('Error deleting modifier:', error);
      showToast('Error al eliminar modificador', 'error');
    }
  };

  const handleDayToggle = (day: number) => {
    const days = newModifier.days_of_week || [];
    const newDays = days.includes(day)
      ? days.filter(d => d !== day)
      : [...days, day].sort();
    setNewModifier({ ...newModifier, days_of_week: newDays });
  };

  const getModifierDescription = (modifier: PriceModifier) => {
    if (modifier.modifier_type === 'time_of_day') {
      return `${modifier.start_time} - ${modifier.end_time}`;
    } else if (modifier.modifier_type === 'day_of_week') {
      return modifier.days_of_week?.map(d => DAYS_OF_WEEK[d]).join(', ');
    } else if (modifier.modifier_type === 'date_range') {
      return `${new Date(modifier.start_date + 'T00:00:00').toLocaleDateString()} - ${new Date(modifier.end_date + 'T00:00:00').toLocaleDateString()}`;
    }
    return '';
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
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '24px' }}>
          <BackButton
            color="#FF8C42"
            requireLogout={!profile?.onboarding_completed}
          />
        </div>

        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: theme.colors.text.primary,
          marginBottom: '8px'
        }}>
          Gestión de Precios Dinámicos
        </h1>
        <p style={{
          color: theme.colors.text.secondary,
          marginBottom: '32px'
        }}>
          Configura precios especiales para horarios pico, días específicos o temporadas
        </p>

        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
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
              Modificadores de Precio
            </h2>
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                padding: '10px 20px',
                background: theme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {showForm ? 'Cancelar' : '+ Nuevo Modificador'}
            </button>
          </div>

          {showForm && (
            <div style={{
              padding: '24px',
              background: theme.colors.background.tealLight,
              borderRadius: '12px',
              marginBottom: '24px'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: theme.colors.text.primary
                }}>
                  Nombre del Modificador
                </label>
                <input
                  type="text"
                  value={newModifier.name}
                  onChange={(e) => setNewModifier({ ...newModifier, name: e.target.value })}
                  placeholder="Ej: Horario Pico Mañana, Fin de Semana, Temporada Alta"
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
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: theme.colors.text.primary
                }}>
                  Tipo de Modificador
                </label>
                <select
                  value={newModifier.modifier_type}
                  onChange={(e) => setNewModifier({
                    ...newModifier,
                    modifier_type: e.target.value as any,
                    start_time: undefined,
                    end_time: undefined,
                    days_of_week: undefined,
                    start_date: undefined,
                    end_date: undefined
                  })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${theme.colors.border.default}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="time_of_day">Por Horario del Día</option>
                  <option value="day_of_week">Por Día de la Semana</option>
                  <option value="date_range">Por Rango de Fechas</option>
                </select>
              </div>

              {newModifier.modifier_type === 'time_of_day' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: theme.colors.text.primary
                    }}>
                      Hora Inicio
                    </label>
                    <input
                      type="time"
                      value={newModifier.start_time || ''}
                      onChange={(e) => setNewModifier({ ...newModifier, start_time: e.target.value })}
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
                      color: theme.colors.text.primary
                    }}>
                      Hora Fin
                    </label>
                    <input
                      type="time"
                      value={newModifier.end_time || ''}
                      onChange={(e) => setNewModifier({ ...newModifier, end_time: e.target.value })}
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

              {newModifier.modifier_type === 'day_of_week' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: theme.colors.text.primary
                  }}>
                    Días de la Semana
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {DAYS_OF_WEEK.map((day, index) => {
                      const isSelected = newModifier.days_of_week?.includes(index);
                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleDayToggle(index)}
                          style={{
                            padding: '8px 16px',
                            background: isSelected ? theme.colors.primary : 'white',
                            color: isSelected ? 'white' : theme.colors.text.primary,
                            border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.border.default}`,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '500'
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {newModifier.modifier_type === 'date_range' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '500',
                      color: theme.colors.text.primary
                    }}>
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={newModifier.start_date || ''}
                      onChange={(e) => setNewModifier({ ...newModifier, start_date: e.target.value })}
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
                      color: theme.colors.text.primary
                    }}>
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={newModifier.end_date || ''}
                      onChange={(e) => setNewModifier({ ...newModifier, end_date: e.target.value })}
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: theme.colors.text.primary
                }}>
                  Multiplicador de Precio: {newModifier.multiplier.toFixed(2)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.05"
                  value={newModifier.multiplier}
                  onChange={(e) => setNewModifier({ ...newModifier, multiplier: parseFloat(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: theme.colors.text.tertiary, marginTop: '4px' }}>
                  <span>50% (Descuento)</span>
                  <span>100% (Normal)</span>
                  <span>300% (Tarifa Alta)</span>
                </div>
                <p style={{ fontSize: '13px', color: theme.colors.text.secondary, marginTop: '8px' }}>
                  {newModifier.multiplier < 1 ?
                    `Precio reducido al ${(newModifier.multiplier * 100).toFixed(0)}%` :
                    newModifier.multiplier > 1 ?
                    `Precio incrementado al ${(newModifier.multiplier * 100).toFixed(0)}%` :
                    'Precio normal (sin cambios)'}
                </p>
              </div>

              <button
                onClick={saveModifier}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: theme.colors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Guardando...' : 'Crear Modificador'}
              </button>
            </div>
          )}

          {modifiers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: theme.colors.text.tertiary
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💰</div>
              <p>No hay modificadores de precio configurados</p>
              <p style={{ fontSize: '14px', marginTop: '8px' }}>
                Crea modificadores para ajustar precios en horarios específicos
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {modifiers.map((modifier) => (
                <div
                  key={modifier.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    background: modifier.is_active ? 'white' : theme.colors.background.light,
                    border: `2px solid ${modifier.is_active ? theme.colors.teal[200] : theme.colors.border.default}`,
                    borderRadius: '12px',
                    opacity: modifier.is_active ? 1 : 0.6
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: theme.colors.text.primary
                      }}>
                        {modifier.name}
                      </h3>
                      <span style={{
                        padding: '4px 12px',
                        background: modifier.multiplier > 1 ? theme.colors.orange[100] :
                                   modifier.multiplier < 1 ? theme.colors.teal[100] :
                                   theme.colors.gray[100],
                        color: modifier.multiplier > 1 ? theme.colors.orange[700] :
                               modifier.multiplier < 1 ? theme.colors.primary :
                               theme.colors.text.secondary,
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {modifier.multiplier}x
                      </span>
                    </div>
                    <div style={{
                      fontSize: '14px',
                      color: theme.colors.text.secondary
                    }}>
                      {getModifierDescription(modifier)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => modifier.id && toggleModifier(modifier.id, modifier.is_active)}
                      style={{
                        padding: '8px 16px',
                        background: modifier.is_active ? theme.colors.warning : theme.colors.success,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      {modifier.is_active ? 'Pausar' : 'Activar'}
                    </button>
                    <button
                      onClick={() => modifier.id && deleteModifier(modifier.id)}
                      style={{
                        padding: '8px 16px',
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}