import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Pet, Booking, PetMaster } from '../types';
import { getStatusColor } from '../utils/statusColors';

export default function Dashboard() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [petMaster, setPetMaster] = useState<PetMaster | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  useEffect(() => {
    if (profile) {
      loadDashboardData();
    }
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      if (profile?.role === 'owner') {
        const [petsRes, bookingsRes] = await Promise.all([
          supabase.from('pets').select('*').eq('owner_id', profile.id).order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').eq('owner_id', profile.id).order('scheduled_date', { ascending: false }).limit(5)
        ]);

        if (petsRes.data) setPets(petsRes.data);
        if (bookingsRes.data) setBookings(bookingsRes.data);
      } else if (profile?.role === 'pet_master') {
        const [masterRes, bookingsRes] = await Promise.all([
          supabase.from('pet_masters').select('*').eq('id', profile.id).maybeSingle(),
          supabase.from('bookings').select('*').eq('pet_master_id', profile.id).order('scheduled_date', { ascending: false }).limit(5)
        ]);

        if (masterRes.data) setPetMaster(masterRes.data);
        if (bookingsRes.data) setBookings(bookingsRes.data);
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

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #FFE5B4',
            borderTopColor: '#FF8C42',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b' }}>{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(255, 140, 66, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            fontSize: '8rem',
            opacity: 0.15
          }}>🐾</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', position: 'relative' }}>
            {profile?.role === 'owner' ? '🐶' : '👨‍⚕️'} {t.dashboard.welcome}, {profile?.full_name}!
          </h1>
          <p style={{ opacity: 0.95, fontSize: '1.125rem' }}>
            {profile?.role === 'owner' ? '🏠 Manage your pets and bookings' : '💼 Manage your services and bookings'}
          </p>
        </div>

        {profile?.role === 'owner' ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #FFE5B4',
              boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>🐾 {t.dashboard.myPets}</h2>
                <Link
                  to="/pets/new"
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '25px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  ➕ {t.dashboard.addPet}
                </Link>
              </div>

              {pets.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  {t.dashboard.noPetsGetStarted}
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {pets.map(pet => (
                    <div
                      key={pet.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <h3 style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{pet.name}</h3>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>
                          {pet.breed} • {pet.size} • {pet.age} years old
                        </p>
                      </div>
                      <Link to={`/pets/${pet.id}`} style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: '14px' }}>
                        {t.common.view}
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #E8F5E9',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>📅 {t.dashboard.recentBookings}</h2>
                <Link to="/bookings" style={{
                  color: '#4CAF50',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: '#E8F5E9'
                }}>
                  {t.dashboard.viewAllBookings}
                </Link>
              </div>

              {bookings.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  {t.dashboard.noBookingsGetStarted}
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {bookings.map(booking => (
                    <div
                      key={booking.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: getStatusColor(booking.status).bg,
                          color: getStatusColor(booking.status).text,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {booking.status}
                        </span>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#334155' }}>{booking.pickup_address}</p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        ${booking.total_amount} • {booking.duration_minutes} minutes
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              <Link
                to="/search"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%)',
                  color: 'white',
                  padding: '32px 24px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 8px 20px rgba(255, 107, 107, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(255, 107, 107, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 107, 107, 0.3)';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>{t.dashboard.findServices}</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>{t.dashboard.searchForServices}</p>
              </Link>

              <Link
                to="/pets"
                style={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                  color: 'white',
                  padding: '32px 24px',
                  borderRadius: '20px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  boxShadow: '0 8px 20px rgba(76, 175, 80, 0.3)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(76, 175, 80, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(76, 175, 80, 0.3)';
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🐕</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>{t.dashboard.myPets}</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>{t.dashboard.managePets}</p>
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>{t.common.rating}</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {petMaster?.rating.toFixed(1) || '0.0'}
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>{t.dashboard.totalServices}</p>
                <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>
                  {petMaster?.total_walks || 0}
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>{t.common.status}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: petMaster?.is_available ? '#10b981' : '#ef4444' }}>
                  {petMaster?.is_available ? t.common.available : t.common.unavailable}
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>{t.common.verified}</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: petMaster?.verified ? '#10b981' : '#f59e0b' }}>
                  {petMaster?.verified ? t.common.yes : t.common.pending}
                </p>
              </div>
            </div>

            {petMaster && petMaster.service_type !== 'hotel' && petMaster.service_type !== 'vet' && (
              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '16px',
                border: '2px solid #FFE5B4',
                boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div style={{ flex: '1', minWidth: '200px' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                      {t.dashboard.toggleAvailability}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      {t.dashboard.availabilityDescription}
                    </p>
                  </div>
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
                      opacity: updatingAvailability ? 0.6 : 1
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      left: petMaster.is_available ? '32px' : '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'white',
                      transition: 'left 0.3s',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
                    }} />
                  </button>
                </div>
              </div>
            )}

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
                {t.dashboard.recentBookings}
              </h2>

              {bookings.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  {t.dashboard.noBookingsProvider}
                </p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {bookings.map(booking => (
                    <div
                      key={booking.id}
                      style={{
                        padding: '16px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{
                          padding: '4px 12px',
                          background: getStatusColor(booking.status).bg,
                          color: getStatusColor(booking.status).text,
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {booking.status}
                        </span>
                        <span style={{ fontSize: '14px', color: '#64748b' }}>
                          {new Date(booking.scheduled_date).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ fontSize: '14px', color: '#334155' }}>{booking.pickup_address}</p>
                      <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                        ${booking.total_amount} • {booking.duration_minutes} minutes
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
