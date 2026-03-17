import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../styles/theme';

interface TimeSlot {
  slot_start: string;
  slot_end: string;
  is_available: boolean;
}

interface AvailableTimeSlotsProps {
  providerId: string;
  selectedDate: string;
  selectedTime: string;
  duration: number;
  onTimeSelect: (time: string) => void;
}

export default function AvailableTimeSlots({
  providerId,
  selectedDate,
  selectedTime,
  duration,
  onTimeSelect
}: AvailableTimeSlotsProps) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (providerId && selectedDate) {
      loadAvailableSlots();
    }
  }, [providerId, selectedDate, duration]);

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: rpcError } = await supabase
        .rpc('get_available_slots', {
          p_provider_id: providerId,
          p_date: selectedDate,
          p_duration_minutes: duration
        });

      if (rpcError) {
        console.error('Error loading slots:', rpcError);
        setError('Error al cargar horarios disponibles');
        return;
      }

      setSlots(data || []);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar horarios disponibles');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedDate) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: theme.colors.text.tertiary,
        background: theme.colors.background.light,
        borderRadius: '8px'
      }}>
        Por favor selecciona una fecha primero
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: `4px solid ${theme.colors.teal[100]}`,
          borderTopColor: theme.colors.primary,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 12px'
        }} />
        <p style={{ color: theme.colors.text.secondary, fontSize: '14px' }}>
          Cargando horarios disponibles...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: theme.colors.error,
        background: theme.colors.errorLight,
        borderRadius: '8px'
      }}>
        {error}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div style={{
        padding: '30px',
        textAlign: 'center',
        color: theme.colors.text.secondary,
        background: theme.colors.background.orangeLight,
        borderRadius: '8px',
        border: `1px solid ${theme.colors.orange[200]}`
      }}>
        <div style={{
          fontSize: '2rem',
          marginBottom: '12px'
        }}>
          📅
        </div>
        <p style={{ fontWeight: '500', marginBottom: '4px' }}>
          No hay horarios disponibles
        </p>
        <p style={{ fontSize: '14px', color: theme.colors.text.tertiary }}>
          Por favor selecciona otra fecha
        </p>
      </div>
    );
  }

  const availableSlots = slots.filter(slot => slot.is_available);
  const unavailableSlots = slots.filter(slot => !slot.is_available);

  return (
    <div>
      <div style={{
        marginBottom: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: theme.colors.text.primary
        }}>
          Horarios Disponibles
        </h3>
        <div style={{ display: 'flex', gap: '12px', fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: theme.colors.primary,
              borderRadius: '3px'
            }} />
            <span style={{ color: theme.colors.text.tertiary }}>Disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: theme.colors.gray[300],
              borderRadius: '3px'
            }} />
            <span style={{ color: theme.colors.text.tertiary }}>Ocupado</span>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: '8px',
        maxHeight: '300px',
        overflowY: 'auto',
        padding: '4px'
      }}>
        {availableSlots.map((slot, index) => {
          const isSelected = selectedTime === slot.slot_start;
          return (
            <button
              key={`available-${index}`}
              onClick={() => onTimeSelect(slot.slot_start)}
              style={{
                padding: '12px 8px',
                background: isSelected ? theme.colors.primary : 'white',
                color: isSelected ? 'white' : theme.colors.text.primary,
                border: `2px solid ${isSelected ? theme.colors.primary : theme.colors.teal[200]}`,
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: isSelected ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = theme.colors.background.tealLight;
                  e.currentTarget.style.borderColor = theme.colors.primary;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = theme.colors.teal[200];
                }
              }}
            >
              <div style={{ fontSize: '15px', marginBottom: '2px' }}>
                {slot.slot_start.substring(0, 5)}
              </div>
              <div style={{
                fontSize: '11px',
                opacity: 0.8,
                color: isSelected ? 'white' : theme.colors.text.tertiary
              }}>
                {duration} min
              </div>
            </button>
          );
        })}

        {unavailableSlots.map((slot, index) => (
          <button
            key={`unavailable-${index}`}
            disabled
            style={{
              padding: '12px 8px',
              background: theme.colors.gray[100],
              color: theme.colors.text.disabled,
              border: `2px solid ${theme.colors.border.default}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'not-allowed',
              textAlign: 'center',
              opacity: 0.6
            }}
          >
            <div style={{ fontSize: '15px', marginBottom: '2px' }}>
              {slot.slot_start.substring(0, 5)}
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8 }}>
              Ocupado
            </div>
          </button>
        ))}
      </div>

      {availableSlots.length > 0 && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: theme.colors.background.tealLight,
          borderRadius: '6px',
          fontSize: '13px',
          color: theme.colors.text.secondary,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '16px' }}>ℹ️</span>
          <span>
            Hay <strong style={{ color: theme.colors.primary }}>{availableSlots.length}</strong> horarios disponibles para esta fecha
          </span>
        </div>
      )}
    </div>
  );
}