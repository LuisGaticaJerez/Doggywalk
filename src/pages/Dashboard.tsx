import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Pet, Booking, PetMaster } from '../types';

export default function Dashboard() {
  const { profile } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [petMaster, setPetMaster] = useState<PetMaster | null>(null);
  const [loading, setLoading] = useState(true);

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
          <p style={{ color: '#64748b' }}>Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Welcome back, {profile?.full_name}!
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          {profile?.role === 'owner' ? 'Manage your pets and bookings' : 'Manage your services and bookings'}
        </p>

        {profile?.role === 'owner' ? (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>My Pets</h2>
                <Link
                  to="/pets/new"
                  style={{
                    padding: '8px 16px',
                    background: '#0ea5e9',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Add Pet
                </Link>
              </div>

              {pets.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  No pets yet. Add your first pet to get started!
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
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>Recent Bookings</h2>
                <Link to="/bookings" style={{ color: '#0ea5e9', textDecoration: 'none', fontSize: '14px' }}>
                  View All
                </Link>
              </div>

              {bookings.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  No bookings yet. Search for services to book!
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
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  color: 'white',
                  padding: '32px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>Find Services</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Search for walkers, hotels, and vets</p>
              </Link>

              <Link
                to="/pets"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  padding: '32px 24px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>My Pets</h3>
                <p style={{ fontSize: '14px', opacity: 0.9 }}>Manage your pet profiles</p>
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
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Rating</p>
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
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Total Services</p>
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
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Status</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: petMaster?.is_available ? '#10b981' : '#ef4444' }}>
                  {petMaster?.is_available ? 'Available' : 'Unavailable'}
                </p>
              </div>

              <div style={{
                background: 'white',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Verified</p>
                <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: petMaster?.verified ? '#10b981' : '#f59e0b' }}>
                  {petMaster?.verified ? 'Yes' : 'Pending'}
                </p>
              </div>
            </div>

            <div style={{
              background: 'white',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '20px' }}>
                Recent Bookings
              </h2>

              {bookings.length === 0 ? (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
                  No bookings yet. Complete your profile to start receiving bookings!
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

function getStatusColor(status: string) {
  const colors = {
    pending: { bg: '#fef3c7', text: '#92400e' },
    accepted: { bg: '#dbeafe', text: '#1e40af' },
    in_progress: { bg: '#e0e7ff', text: '#3730a3' },
    completed: { bg: '#d1fae5', text: '#065f46' },
    cancelled: { bg: '#fee2e2', text: '#991b1b' }
  };
  return colors[status as keyof typeof colors] || colors.pending;
}
