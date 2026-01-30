import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { PetMaster, Booking } from '../types';
import { getStatusColor } from '../utils/statusColors';

interface BookingWithDetails extends Booking {
  pets?: { name: string };
  profiles?: { full_name: string };
  booking_pets?: Array<{
    pets: { name: string; id: string };
  }>;
}

interface ServiceStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
}

export default function ProviderDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [petMaster, setPetMaster] = useState<PetMaster | null>(null);
  const [pendingBookings, setPendingBookings] = useState<BookingWithDetails[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingWithDetails[]>([]);
  const [stats, setStats] = useState<ServiceStats>({
    totalBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    if (profile && !profile.onboarding_completed) {
      navigate('/provider-onboarding', { replace: true });
      return;
    }
    if (profile) {
      loadDashboardData();
    }
  }, [profile, navigate]);

  const loadDashboardData = async () => {
    try {
      const [masterRes, pendingRes, upcomingRes, statsRes] = await Promise.all([
        supabase.from('pet_masters').select('*').eq('id', profile?.id).maybeSingle(),
        supabase
          .from('bookings')
          .select(`
            *,
            pets (name),
            profiles!bookings_owner_id_fkey (full_name),
            booking_pets (
              pets (id, name)
            )
          `)
          .eq('pet_master_id', profile?.id)
          .eq('status', 'pending')
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('bookings')
          .select(`
            *,
            pets (name),
            profiles!bookings_owner_id_fkey (full_name),
            booking_pets (
              pets (id, name)
            )
          `)
          .eq('pet_master_id', profile?.id)
          .in('status', ['accepted', 'in_progress'])
          .order('scheduled_date', { ascending: true })
          .limit(5),
        supabase
          .from('bookings')
          .select('status, total_amount')
          .eq('pet_master_id', profile?.id),
      ]);

      if (masterRes.data) setPetMaster(masterRes.data);
      if (pendingRes.data) setPendingBookings(pendingRes.data);
      if (upcomingRes.data) setUpcomingBookings(upcomingRes.data);

      if (statsRes.data) {
        const totalBookings = statsRes.data.length;
        const completedBookings = statsRes.data.filter((b) => b.status === 'completed').length;
        const cancelledBookings = statsRes.data.filter((b) => b.status === 'cancelled').length;
        const revenue = statsRes.data
          .filter((b) => b.status === 'completed')
          .reduce((sum, b) => sum + Number(b.total_amount), 0);

        setStats({ totalBookings, completedBookings, cancelledBookings, revenue });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    if (!petMaster || !profile) return;

    setUpdatingAvailability(true);
    try {
      const newAvailability = !petMaster.is_available;

      const { error } = await supabase
        .from('pet_masters')
        .update({ is_available: newAvailability })
        .eq('id', profile.id);

      if (error) throw error;

      setPetMaster({ ...petMaster, is_available: newAvailability });
      showToast(
        newAvailability ? t.dashboard.nowAvailable : t.dashboard.nowUnavailable,
        'success'
      );
    } catch (error) {
      console.error('Error updating availability:', error);
      showToast(t.common.error, 'error');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleBookingAction = async (bookingId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: action === 'accept' ? 'accepted' : 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      showToast(
        action === 'accept' ? 'Reserva aceptada' : 'Reserva rechazada',
        'success'
      );
      loadDashboardData();
    } catch (error) {
      console.error('Error updating booking:', error);
      showToast(t.common.error, 'error');
    }
  };

  const getServiceTypeLabel = (type?: string) => {
    switch (type) {
      case 'walker':
        return 'Paseador';
      case 'hotel':
        return 'Hotel';
      case 'vet':
        return 'Veterinario';
      default:
        return 'Servicio';
    }
  };

  const getServiceTypeIcon = (type?: string) => {
    switch (type) {
      case 'walker':
        return '🚶';
      case 'hotel':
        return '🏨';
      case 'vet':
        return '⚕️';
      default:
        return '💼';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #FFE5B4',
              borderTopColor: '#FF8C42',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b' }}>{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div
          style={{
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
            padding: '32px',
            borderRadius: '16px',
            marginBottom: '32px',
            color: 'white',
            boxShadow: '0 8px 24px rgba(255, 140, 66, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-20px',
              top: '-20px',
              fontSize: '8rem',
              opacity: 0.15,
            }}
          >
            {getServiceTypeIcon(petMaster?.service_type)}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                {getServiceTypeIcon(petMaster?.service_type)} {t.dashboard.welcome}, {profile?.full_name}!
              </h1>
              <p style={{ opacity: 0.95, fontSize: '1.125rem', marginBottom: '8px' }}>
                {getServiceTypeLabel(petMaster?.service_type)} - {petMaster?.verified ? '✓ Verificado' : '⏳ Pendiente'}
              </p>
            </div>
            {petMaster && petMaster.service_type !== 'hotel' && petMaster.service_type !== 'vet' && (
              <button
                onClick={toggleAvailability}
                disabled={updatingAvailability}
                style={{
                  position: 'relative',
                  width: '60px',
                  height: '32px',
                  borderRadius: '16px',
                  border: 'none',
                  cursor: updatingAvailability ? 'not-allowed' : 'pointer',
                  background: petMaster.is_available ? '#10b981' : '#94a3b8',
                  transition: 'background-color 0.3s',
                  opacity: updatingAvailability ? 0.6 : 1,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: petMaster.is_available ? '32px' : '4px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'white',
                    transition: 'left 0.3s',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  }}
                />
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>⭐ {t.common.rating}</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#FF8C42' }}>
              {petMaster?.rating.toFixed(1) || '0.0'}
            </p>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>📊 Total Servicios</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
              {stats.completedBookings}
            </p>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>💰 Ingresos Totales</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              ${stats.revenue.toFixed(0)}
            </p>
          </div>

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            }}
          >
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>🔔 Pendientes</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
              {pendingBookings.length}
            </p>
          </div>
        </div>

        {pendingBookings.length > 0 && (
          <div
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
              color: 'white',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'white',
                  animation: 'pulse 2s infinite',
                }}
              />
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>
                ⏳ Solicitudes Pendientes ({pendingBookings.length})
              </h2>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {pendingBookings.map((booking) => (
                <div
                  key={booking.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '16px',
                    borderRadius: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '1.25rem' }}>
                          {booking.pet_count > 1 ? '🐕🐕' : '🐕'}
                        </span>
                        <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', margin: 0 }}>
                          {booking.booking_pets && booking.booking_pets.length > 0
                            ? booking.booking_pets.map((bp) => bp.pets.name).join(', ')
                            : booking.pets?.name}
                        </h3>
                        {booking.pet_count > 1 && (
                          <span
                            style={{
                              padding: '2px 6px',
                              background: '#E8F5E9',
                              color: '#2E7D32',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '600',
                            }}
                          >
                            {booking.pet_count} mascotas
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
                        👤 {booking.profiles?.full_name}
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        📅 {new Date(booking.scheduled_date).toLocaleString('es', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                      <p style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                        📍 {booking.pickup_address}
                      </p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        💵 ${booking.total_amount} • ⏱️ {booking.duration_minutes} min
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'accept')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#059669')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#10b981')}
                    >
                      ✓ Aceptar
                    </button>
                    <button
                      onClick={() => handleBookingAction(booking.id, 'reject')}
                      style={{
                        flex: 1,
                        padding: '10px 16px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#dc2626')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#ef4444')}
                    >
                      ✗ Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '24px' }}>
          {upcomingBookings.length > 0 && (
            <div
              style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #E8F5E9',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                  📅 Próximos Servicios
                </h2>
                <Link
                  to="/bookings"
                  style={{
                    color: '#4CAF50',
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    background: '#E8F5E9',
                  }}
                >
                  {t.dashboard.viewAllBookings}
                </Link>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            background: getStatusColor(booking.status).bg,
                            color: getStatusColor(booking.status).text,
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                          }}
                        >
                          {booking.status}
                        </span>
                        {booking.booking_pets && booking.booking_pets.length > 0 ? (
                          <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                            {booking.pet_count > 1 ? '🐕🐕' : '🐕'}{' '}
                            {booking.booking_pets.map((bp) => bp.pets.name).join(', ')}
                            {booking.pet_count > 1 && (
                              <span
                                style={{
                                  marginLeft: '6px',
                                  padding: '2px 6px',
                                  background: '#E8F5E9',
                                  color: '#2E7D32',
                                  borderRadius: '8px',
                                  fontSize: '11px',
                                }}
                              >
                                {booking.pet_count}
                              </span>
                            )}
                          </span>
                        ) : (
                          booking.pets?.name && (
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                              🐕 {booking.pets.name}
                            </span>
                          )
                        )}
                      </div>
                      <span style={{ fontSize: '14px', color: '#64748b' }}>
                        {new Date(booking.scheduled_date).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '14px', color: '#334155' }}>{booking.pickup_address}</p>
                    <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      ${booking.total_amount} • {booking.duration_minutes} min
                      {booking.profiles?.full_name && ` • ${booking.profiles.full_name}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #FFE5B4',
              boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
              ⚙️ Gestión de Servicios
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <Link
                to="/manage-services"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(255, 107, 107, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(255, 107, 107, 0.3)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⚙️</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                  Gestión de Servicios
                </h3>
                <p style={{ fontSize: '13px', opacity: 0.9 }}>Administra tus servicios</p>
              </Link>

              <Link
                to="/settings"
                style={{
                  background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.3)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                  Perfil
                </h3>
                <p style={{ fontSize: '13px', opacity: 0.9 }}>Configura tu información</p>
              </Link>

              <Link
                to="/bookings"
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(76, 175, 80, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(76, 175, 80, 0.3)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📅</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                  Ver Todas las Reservas
                </h3>
                <p style={{ fontSize: '13px', opacity: 0.9 }}>Historial completo</p>
              </Link>

              <Link
                to="/chat"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: 'white',
                  padding: '24px',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
                }}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💬</div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '4px' }}>
                  Mensajes
                </h3>
                <p style={{ fontSize: '13px', opacity: 0.9 }}>Chatea con clientes</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
