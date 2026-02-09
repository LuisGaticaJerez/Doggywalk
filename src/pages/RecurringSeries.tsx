import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getRecurringSeries, cancelRecurringSeries } from '../utils/recurringBookings';

interface RecurringSeriesData {
  id: string;
  frequency: string;
  interval_count: number;
  days_of_week: number[] | null;
  time_of_day: string;
  duration_minutes: number;
  pickup_address: string;
  service_name: string;
  total_amount: number;
  start_date: string;
  end_date: string | null;
  max_occurrences: number | null;
  occurrences_created: number;
  is_active: boolean;
  created_at: string;
  bookings: Array<{
    id: string;
    status: string;
    scheduled_date: string;
    occurrence_number: number;
  }>;
}

export default function RecurringSeries() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [series, setSeries] = useState<RecurringSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    loadSeries();
  }, []);

  const loadSeries = async () => {
    try {
      const data = await getRecurringSeries(profile!.id);
      setSeries(data);
    } catch (error) {
      console.error('Error loading recurring series:', error);
      showToast('Failed to load recurring series', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSeries = async (seriesId: string) => {
    if (!confirm('Are you sure you want to cancel this recurring series? All future bookings will be cancelled.')) {
      return;
    }

    setCancellingId(seriesId);
    try {
      const result = await cancelRecurringSeries(seriesId, true);

      if (result.success) {
        showToast(result.message, 'success');
        await loadSeries();
      } else {
        showToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Error cancelling series:', error);
      showToast('Failed to cancel series', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const getDaysOfWeekText = (days: number[] | null): string => {
    if (!days || days.length === 0) return 'N/A';
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.map(d => dayNames[d]).join(', ');
  };

  const getFrequencyText = (s: RecurringSeriesData): string => {
    if (s.frequency === 'weekly' && s.days_of_week) {
      return `Weekly on ${getDaysOfWeekText(s.days_of_week)}`;
    }
    if (s.interval_count === 1) {
      return s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1);
    }
    return `Every ${s.interval_count} ${s.frequency === 'daily' ? 'days' : s.frequency === 'weekly' ? 'weeks' : 'months'}`;
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#0ea5e9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <BackButton color="#0ea5e9" />
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Recurring Bookings
          </h1>
          <p style={{ color: '#64748b' }}>
            Manage your recurring booking schedules
          </p>
        </div>

        {series.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '16px' }}>
              No recurring bookings found
            </p>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '12px 24px',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Find Services
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {series.map(s => {
              const activeBookings = s.bookings.filter(b => b.status !== 'cancelled' && b.status !== 'completed');
              const nextBooking = activeBookings.sort((a, b) =>
                new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
              )[0];

              return (
                <div
                  key={s.id}
                  style={{
                    background: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    border: s.is_active ? '2px solid #0ea5e9' : '1px solid #e2e8f0',
                    opacity: s.is_active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                          {s.service_name}
                        </h3>
                        {s.is_active ? (
                          <span style={{
                            padding: '4px 12px',
                            background: '#dcfce7',
                            color: '#166534',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Active
                          </span>
                        ) : (
                          <span style={{
                            padding: '4px 12px',
                            background: '#f3f4f6',
                            color: '#6b7280',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}>
                            Cancelled
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                        <p style={{ marginBottom: '4px' }}>
                          <strong>Schedule:</strong> {getFrequencyText(s)} at {s.time_of_day}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                          <strong>Duration:</strong> {s.duration_minutes} minutes
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                          <strong>Location:</strong> {s.pickup_address}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                          <strong>Price per booking:</strong> ${s.total_amount.toFixed(2)}
                        </p>
                        <p style={{ marginBottom: '4px' }}>
                          <strong>Started:</strong> {new Date(s.start_date).toLocaleDateString()}
                          {s.end_date && ` • Ends: ${new Date(s.end_date).toLocaleDateString()}`}
                        </p>
                        <p>
                          <strong>Bookings created:</strong> {s.occurrences_created}
                          {s.max_occurrences && ` of ${s.max_occurrences}`}
                        </p>
                      </div>

                      {nextBooking && (
                        <div style={{
                          background: '#f0f9ff',
                          padding: '12px',
                          borderRadius: '8px',
                          marginBottom: '12px'
                        }}>
                          <p style={{ fontSize: '13px', color: '#0369a1', marginBottom: '4px' }}>
                            <strong>Next booking:</strong>
                          </p>
                          <p style={{ fontSize: '13px', color: '#0369a1' }}>
                            {new Date(nextBooking.scheduled_date).toLocaleString()} • {nextBooking.status}
                          </p>
                        </div>
                      )}

                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#94a3b8',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: '4px'
                        }}>
                          {activeBookings.length} upcoming
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: '4px'
                        }}>
                          {s.bookings.filter(b => b.status === 'completed').length} completed
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: '4px'
                        }}>
                          {s.bookings.filter(b => b.status === 'cancelled').length} cancelled
                        </span>
                      </div>
                    </div>
                  </div>

                  {s.is_active && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={() => navigate('/bookings')}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: 'white',
                          color: '#0ea5e9',
                          border: '1px solid #0ea5e9',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        View All Bookings
                      </button>
                      <button
                        onClick={() => handleCancelSeries(s.id)}
                        disabled={cancellingId === s.id}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: cancellingId === s.id ? '#94a3b8' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: cancellingId === s.id ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {cancellingId === s.id ? 'Cancelling...' : 'Cancel Series'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
