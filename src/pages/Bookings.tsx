import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { getStatusColor } from '../utils/statusColors';

interface BookingWithDetails extends Booking {
  pets?: { name: string };
  pet_masters?: {
    profiles?: { full_name: string };
  };
}

export default function Bookings() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const query = supabase
        .from('bookings')
        .select(`
          *,
          pets (name),
          pet_masters (
            profiles (full_name)
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (profile?.role === 'owner') {
        query.eq('owner_id', profile.id);
      } else {
        query.eq('pet_master_id', profile?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b
      ));
    } catch (error) {
      console.error('Error updating booking:', error);
      showToast('Failed to update booking status', 'error');
    }
  };

  const filteredBookings = filter === 'all'
    ? bookings
    : bookings.filter(b => b.status === filter);

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
            margin: '0 auto 16px'
          }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            {t.bookings.title}
          </h1>
          <p style={{ color: '#64748b' }}>
            {profile?.role === 'owner'
              ? t.bookings.subtitle
              : t.bookings.subtitleProvider}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {(['all', 'pending', 'accepted', 'in_progress', 'completed', 'cancelled'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                style={{
                  padding: '8px 20px',
                  background: filter === status ? '#0ea5e9' : 'white',
                  color: filter === status ? 'white' : '#64748b',
                  border: `1px solid ${filter === status ? '#0ea5e9' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {filteredBookings.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '24px' }}>
              {t.bookings.noBookings}
            </p>
            {profile?.role === 'owner' && (
              <Link
                to="/search"
                style={{
                  display: 'inline-block',
                  padding: '12px 24px',
                  background: '#0ea5e9',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                {t.nav.search}
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  background: 'white',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                      {profile?.role === 'owner'
                        ? booking.pet_masters?.profiles?.full_name || t.bookings.provider
                        : booking.pets?.name || t.bookings.pet}
                    </h3>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      background: getStatusColor(booking.status).bg,
                      color: getStatusColor(booking.status).text,
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {booking.status}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                      ${booking.total_amount}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {booking.duration_minutes} min
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                  <p style={{ marginBottom: '4px' }}>
                    <strong>{t.common.date}:</strong> {new Date(booking.scheduled_date).toLocaleString()}
                  </p>
                  <p style={{ marginBottom: '4px' }}>
                    <strong>{t.common.location}:</strong> {booking.pickup_address}
                  </p>
                  {booking.special_instructions && (
                    <p style={{ marginBottom: '4px' }}>
                      <strong>{t.bookings.instructions}:</strong> {booking.special_instructions}
                    </p>
                  )}
                  <p>
                    <strong>{t.bookings.payment}:</strong> <span style={{ textTransform: 'capitalize' }}>{booking.payment_status}</span>
                  </p>
                </div>

                {profile?.role === 'pet_master' && booking.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'accepted')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {t.bookings.accept}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking.id, 'cancelled')}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      {t.bookings.decline}
                    </button>
                  </div>
                )}

                {profile?.role === 'pet_master' && booking.status === 'accepted' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'in_progress')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#0ea5e9',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t.bookings.startService}
                  </button>
                )}

                {profile?.role === 'pet_master' && booking.status === 'in_progress' && (
                  <button
                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    {t.bookings.completeService}
                  </button>
                )}

                {profile?.role === 'owner' && booking.status === 'completed' && !booking.has_rating && (
                  <Link
                    to={`/bookings/${booking.id}/rate`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: '#f59e0b',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}
                  >
                    {t.bookings.rateService}
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
