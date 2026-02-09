import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';
import { getStatusColor } from '../utils/statusColors';
import { calculateCancellationRefund, cancelBookingWithRefund, CancellationResult } from '../utils/cancellationLogic';

interface BookingWithDetails extends Booking {
  pets?: { name: string };
  pet_masters?: {
    profiles?: { full_name: string };
  };
  booking_pets?: Array<{
    pets: { name: string; id: string };
  }>;
}

export default function Bookings() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled'>('all');
  const [cancelModal, setCancelModal] = useState<{
    open: boolean;
    bookingId: string | null;
    cancellationInfo: CancellationResult | null;
    reason: string;
    processing: boolean;
  }>({
    open: false,
    bookingId: null,
    cancellationInfo: null,
    reason: '',
    processing: false,
  });

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
          ),
          booking_pets (
            pets (id, name)
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

  const handleOpenCancelModal = async (bookingId: string) => {
    const cancellationInfo = await calculateCancellationRefund(bookingId);
    setCancelModal({
      open: true,
      bookingId,
      cancellationInfo,
      reason: '',
      processing: false,
    });
  };

  const handleCancelBooking = async () => {
    if (!cancelModal.bookingId || !cancelModal.reason.trim()) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }

    setCancelModal(prev => ({ ...prev, processing: true }));

    const result = await cancelBookingWithRefund(cancelModal.bookingId, cancelModal.reason);

    if (result.success) {
      showToast(result.message, 'success');
      await loadBookings();
      setCancelModal({
        open: false,
        bookingId: null,
        cancellationInfo: null,
        reason: '',
        processing: false,
      });
    } else {
      showToast(result.message, 'error');
      setCancelModal(prev => ({ ...prev, processing: false }));
    }
  };

  const handleStatusUpdate = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: newStatus,
          ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {})
        })
        .eq('id', bookingId);

      if (error) throw error;

      if (newStatus === 'in_progress') {
        const { data: existingRoute } = await supabase
          .from('routes')
          .select('id')
          .eq('booking_id', bookingId)
          .maybeSingle();

        if (!existingRoute) {
          await supabase
            .from('routes')
            .insert({
              booking_id: bookingId,
              coordinates: [],
              started_at: new Date().toISOString()
            });
        }

        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const initialCoord = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                timestamp: new Date().toISOString()
              };

              await supabase
                .from('routes')
                .update({ coordinates: [initialCoord] })
                .eq('booking_id', bookingId);
            },
            (error) => {
              console.error('Geolocation error:', error);
              showToast('Could not get initial location. Tracking will start when available.', 'warning');
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            }
          );
        }
      }

      if (newStatus === 'completed') {
        const { data: route } = await supabase
          .from('routes')
          .select('*')
          .eq('booking_id', bookingId)
          .maybeSingle();

        if (route) {
          await supabase
            .from('routes')
            .update({ ended_at: new Date().toISOString() })
            .eq('booking_id', bookingId);
        }
      }

      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: newStatus as Booking['status'] } : b
      ));

      showToast('Booking status updated', 'success');
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
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#0ea5e9';
              e.currentTarget.style.color = '#0ea5e9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <span style={{ fontSize: '18px' }}>←</span>
            <span>Volver</span>
          </button>
        </div>

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
                  border: (booking.status === 'in_progress' || booking.status === 'accepted') && profile?.role === 'owner'
                    ? '3px solid #4CAF50'
                    : '1px solid #e2e8f0',
                  boxShadow: (booking.status === 'in_progress' || booking.status === 'accepted') && profile?.role === 'owner'
                    ? '0 4px 12px rgba(76, 175, 80, 0.2)'
                    : 'none',
                  position: 'relative'
                }}
              >
                {(booking.status === 'in_progress' || booking.status === 'accepted') && profile?.role === 'owner' && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#4CAF50',
                    animation: 'pulse 2s infinite'
                  }} />
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    {profile?.role === 'owner' && booking.booking_pets && booking.booking_pets.length > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontSize: '1.5rem' }}>
                            {booking.pet_count > 1 ? '🐕🐕' : '🐕'}
                          </span>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                            {booking.booking_pets.map(bp => bp.pets.name).join(', ')}
                          </h3>
                          {booking.pet_count > 1 && (
                            <span style={{
                              padding: '2px 8px',
                              background: '#E8F5E9',
                              color: '#2E7D32',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              Group: {booking.pet_count} pets
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    {profile?.role === 'owner' && (!booking.booking_pets || booking.booking_pets.length === 0) && booking.pets?.name && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '1.5rem' }}>🐕</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
                          {booking.pets.name}
                        </h3>
                      </div>
                    )}
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>
                      {profile?.role === 'owner'
                        ? booking.pet_masters?.profiles?.full_name || t.bookings.provider
                        : booking.booking_pets && booking.booking_pets.length > 0
                          ? booking.booking_pets.map(bp => bp.pets.name).join(', ')
                          : booking.pets?.name || t.bookings.pet}
                    </h4>
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
                  <Link
                    to={`/my-bookings/${booking.id}/walk`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    🗺️ Manage Walk
                  </Link>
                )}

                {profile?.role === 'owner' && (booking.status === 'in_progress' || booking.status === 'accepted') && (
                  <Link
                    to={`/bookings/${booking.id}/track`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    🗺️ {t.tracking.trackWalk}
                  </Link>
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

                {booking.status !== 'cancelled' && (
                  <Link
                    to={`/bookings/${booking.id}/chat`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px',
                      background: 'white',
                      color: '#0ea5e9',
                      textDecoration: 'none',
                      border: '1px solid #0ea5e9',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      textAlign: 'center',
                      marginTop: '8px'
                    }}
                  >
                    💬 {t.chat?.openChat || 'Open Chat'}
                  </Link>
                )}

                {profile?.role === 'owner' && (booking.status === 'pending' || booking.status === 'accepted') && (
                  <button
                    onClick={() => handleOpenCancelModal(booking.id)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      background: 'white',
                      color: '#ef4444',
                      border: '1px solid #ef4444',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      marginTop: '8px'
                    }}
                  >
                    {t.bookings.cancel || 'Cancel Booking'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {cancelModal.open && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '16px' }}>
              Cancel Booking
            </h2>

            {cancelModal.cancellationInfo ? (
              <>
                {cancelModal.cancellationInfo.canCancel ? (
                  <>
                    <div style={{
                      background: '#f0f9ff',
                      border: '1px solid #0ea5e9',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ fontSize: '14px', color: '#0369a1', marginBottom: '8px' }}>
                        <strong>Policy:</strong> {cancelModal.cancellationInfo.policyName}
                      </p>
                      <p style={{ fontSize: '14px', color: '#0369a1', marginBottom: '8px' }}>
                        <strong>Refund:</strong> {cancelModal.cancellationInfo.refundPercentage}% (${cancelModal.cancellationInfo.refundAmount.toFixed(2)})
                      </p>
                      <p style={{ fontSize: '12px', color: '#64748b' }}>
                        {cancelModal.cancellationInfo.reason}
                      </p>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: '#334155',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}>
                        Reason for cancellation *
                      </label>
                      <textarea
                        value={cancelModal.reason}
                        onChange={(e) => setCancelModal(prev => ({ ...prev, reason: e.target.value }))}
                        placeholder="Please provide a reason for cancelling this booking..."
                        rows={4}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        onClick={handleCancelBooking}
                        disabled={cancelModal.processing || !cancelModal.reason.trim()}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: cancelModal.processing || !cancelModal.reason.trim() ? '#94a3b8' : '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: cancelModal.processing || !cancelModal.reason.trim() ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {cancelModal.processing ? 'Processing...' : 'Confirm Cancellation'}
                      </button>
                      <button
                        onClick={() => setCancelModal({ open: false, bookingId: null, cancellationInfo: null, reason: '', processing: false })}
                        disabled={cancelModal.processing}
                        style={{
                          flex: 1,
                          padding: '12px',
                          background: 'white',
                          color: '#64748b',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: cancelModal.processing ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Keep Booking
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{
                      background: '#fef2f2',
                      border: '1px solid #ef4444',
                      borderRadius: '8px',
                      padding: '16px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ fontSize: '14px', color: '#991b1b' }}>
                        {cancelModal.cancellationInfo.reason}
                      </p>
                    </div>

                    <button
                      onClick={() => setCancelModal({ open: false, bookingId: null, cancellationInfo: null, reason: '', processing: false })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Close
                    </button>
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  border: '4px solid #e2e8f0',
                  borderTopColor: '#0ea5e9',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
