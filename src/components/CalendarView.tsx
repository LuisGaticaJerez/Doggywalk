import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { theme } from '../styles/theme';

interface BookingSummary {
  date: string;
  count: number;
  revenue: number;
  status: 'light' | 'medium' | 'heavy';
}

interface CalendarViewProps {
  providerId: string;
  onDateSelect?: (date: string) => void;
}

export default function CalendarView({ providerId, onDateSelect }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<BookingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    loadMonthBookings();
  }, [providerId, currentDate]);

  const loadMonthBookings = async () => {
    try {
      setLoading(true);
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('time_slot_bookings')
        .select('slot_date, status')
        .eq('provider_id', providerId)
        .gte('slot_date', firstDay.toISOString().split('T')[0])
        .lte('slot_date', lastDay.toISOString().split('T')[0])
        .in('status', ['pending', 'confirmed']);

      if (error) throw error;

      const bookingsByDate = data?.reduce((acc: Record<string, number>, booking) => {
        acc[booking.slot_date] = (acc[booking.slot_date] || 0) + 1;
        return acc;
      }, {}) || {};

      const summaries: BookingSummary[] = Object.entries(bookingsByDate).map(([date, count]) => ({
        date,
        count: count as number,
        revenue: 0,
        status: (count as number) > 5 ? 'heavy' : (count as number) > 2 ? 'medium' : 'light'
      }));

      setBookings(summaries);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const getBookingForDate = (day: number): BookingSummary | undefined => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.find(b => b.date === dateStr);
  };

  const handleDateClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    if (onDateSelect) {
      onDateSelect(dateStr);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const days = getDaysInMonth();
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
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
        marginBottom: '24px'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: theme.colors.text.primary
        }}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={goToPreviousMonth}
            style={{
              padding: '8px 12px',
              background: theme.colors.background.light,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              color: theme.colors.text.primary
            }}
          >
            ←
          </button>
          <button
            onClick={goToToday}
            style={{
              padding: '8px 16px',
              background: theme.colors.background.tealLight,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              color: theme.colors.primary
            }}
          >
            Hoy
          </button>
          <button
            onClick={goToNextMonth}
            style={{
              padding: '8px 12px',
              background: theme.colors.background.light,
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              color: theme.colors.text.primary
            }}
          >
            →
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px',
        marginBottom: '8px'
      }}>
        {dayNames.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: '600',
              color: theme.colors.text.tertiary,
              padding: '8px 0'
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: `4px solid ${theme.colors.teal[100]}`,
            borderTopColor: theme.colors.primary,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px'
        }}>
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }

            const booking = getBookingForDate(day);
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const isPast = new Date(dateStr) < new Date(today.toDateString());

            let backgroundColor = 'white';
            let borderColor = theme.colors.border.default;

            if (isSelected) {
              backgroundColor = theme.colors.primary;
            } else if (booking) {
              if (booking.status === 'heavy') {
                backgroundColor = theme.colors.orange[100];
                borderColor = theme.colors.orange[300];
              } else if (booking.status === 'medium') {
                backgroundColor = theme.colors.teal[50];
                borderColor = theme.colors.teal[200];
              } else {
                backgroundColor = theme.colors.background.tealLight;
                borderColor = theme.colors.teal[100];
              }
            }

            return (
              <button
                key={day}
                onClick={() => handleDateClick(day)}
                disabled={isPast}
                style={{
                  padding: '12px',
                  background: backgroundColor,
                  border: `2px solid ${isToday(day) ? theme.colors.primary : borderColor}`,
                  borderRadius: '8px',
                  cursor: isPast ? 'not-allowed' : 'pointer',
                  opacity: isPast ? 0.5 : 1,
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!isPast && !isSelected) {
                    e.currentTarget.style.background = theme.colors.background.tealLight;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPast && !isSelected) {
                    e.currentTarget.style.background = backgroundColor;
                    e.currentTarget.style.borderColor = isToday(day) ? theme.colors.primary : borderColor;
                  }
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: isToday(day) ? '700' : '500',
                  color: isSelected ? 'white' : theme.colors.text.primary,
                  marginBottom: booking ? '4px' : '0'
                }}>
                  {day}
                </div>
                {booking && !isSelected && (
                  <div style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    color: booking.status === 'heavy' ? theme.colors.orange[700] : theme.colors.primary
                  }}>
                    {booking.count} 📅
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: theme.colors.background.light,
        borderRadius: '8px',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '13px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: theme.colors.background.tealLight,
            border: `2px solid ${theme.colors.teal[100]}`,
            borderRadius: '4px'
          }} />
          <span style={{ color: theme.colors.text.secondary }}>Pocas reservas</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: theme.colors.teal[50],
            border: `2px solid ${theme.colors.teal[200]}`,
            borderRadius: '4px'
          }} />
          <span style={{ color: theme.colors.text.secondary }}>Moderado</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            background: theme.colors.orange[100],
            border: `2px solid ${theme.colors.orange[300]}`,
            borderRadius: '4px'
          }} />
          <span style={{ color: theme.colors.text.secondary }}>Muy ocupado</span>
        </div>
      </div>
    </div>
  );
}