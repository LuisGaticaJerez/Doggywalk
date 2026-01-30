import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Booking } from '../types';

interface RouteCoordinate {
  lat: number;
  lng: number;
  timestamp: string;
}

interface BookingWithDetails extends Booking {
  pet_masters?: {
    profiles?: {
      full_name: string;
    };
  };
  pets?: {
    name: string;
  };
  booking_pets?: Array<{
    pets: { name: string; id: string };
  }>;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const walkerIcon = L.divIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #4CAF50 0%, #45B049 100%);
      width: 40px;
      height: 40px;
      border-radius: 50% 50% 50% 0;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(76, 175, 80, 0.5);
      transform: rotate(-45deg);
      animation: pulse 2s infinite;
    ">
      <span style="transform: rotate(45deg);">🚶</span>
    </div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: rotate(-45deg) scale(1); }
        50% { transform: rotate(-45deg) scale(1.1); }
      }
    </style>
  `,
  className: 'walker-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
});

const startIcon = L.divIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.5);
    ">🏁</div>
  `,
  className: 'start-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface PhotoMessage {
  id: string;
  image_url: string;
  created_at: string;
  message: string;
}

export default function LiveTracking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<RouteCoordinate[]>([]);
  const [photos, setPhotos] = useState<PhotoMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBookingData = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          pet_masters (
            profiles (
              full_name
            )
          ),
          pets (
            name
          ),
          booking_pets (
            pets (id, name)
          )
        `)
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingData) {
        setError(t.tracking.bookingNotFound || 'Booking not found');
        return;
      }

      if (bookingData.owner_id !== profile?.id) {
        setError(t.tracking.unauthorized || 'Unauthorized');
        return;
      }

      setBooking(bookingData);

      const { data: routeData } = await supabase
        .from('routes')
        .select('coordinates, started_at')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (routeData?.coordinates) {
        const coords = Array.isArray(routeData.coordinates) ? routeData.coordinates : [];
        setRoute(coords);
        if (coords.length > 0) {
          const latest = coords[coords.length - 1];
          setCurrentLocation({ lat: latest.lat, lng: latest.lng });
        }
      }

      const { data: photoMessages } = await supabase
        .from('chat_messages')
        .select('id, image_url, created_at, message')
        .eq('booking_id', bookingId)
        .not('image_url', 'is', null)
        .order('created_at', { ascending: false });

      if (photoMessages) {
        setPhotos(photoMessages as PhotoMessage[]);
      }
    } catch (err) {
      console.error('Error loading tracking data:', err);
      setError(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [bookingId, profile?.id, t]);

  useEffect(() => {
    loadBookingData();
  }, [loadBookingData]);

  useEffect(() => {
    if (!bookingId || !booking) return;

    const channel = supabase
      .channel(`route-${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'routes',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const coords = payload.new.coordinates || [];
          setRoute(coords);
          if (coords.length > 0) {
            const latest = coords[coords.length - 1];
            setCurrentLocation({ lat: latest.lat, lng: latest.lng });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `booking_id=eq.${bookingId}`
        },
        (payload) => {
          const newMessage = payload.new;
          if (newMessage.image_url) {
            setPhotos((prev) => [newMessage as PhotoMessage, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, booking]);

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

  if (error) {
    return (
      <Layout>
        <div style={{
          background: 'white',
          padding: '60px 40px',
          borderRadius: '20px',
          border: '2px solid #fee2e2',
          textAlign: 'center',
          maxWidth: '500px',
          margin: '40px auto'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#dc2626', marginBottom: '12px' }}>
            {error}
          </h2>
          <button
            onClick={() => navigate('/bookings')}
            style={{
              marginTop: '20px',
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {t.common.back}
          </button>
        </div>
      </Layout>
    );
  }

  if (!booking) return null;

  const mapCenter: [number, number] = currentLocation
    ? [currentLocation.lat, currentLocation.lng]
    : booking.pickup_latitude && booking.pickup_longitude
    ? [Number(booking.pickup_latitude), Number(booking.pickup_longitude)]
    : [4.7110, -74.0721];

  const startPoint = booking.pickup_latitude && booking.pickup_longitude
    ? [Number(booking.pickup_latitude), Number(booking.pickup_longitude)] as [number, number]
    : null;

  const pathCoordinates = route.map(coord => [coord.lat, coord.lng] as [number, number]);

  const totalDistance = route.length > 0
    ? (route.length * 0.1).toFixed(2)
    : '0.00';

  const elapsedTime = route.length > 0 && route[0].timestamp
    ? Math.floor((new Date().getTime() - new Date(route[0].timestamp).getTime()) / 60000)
    : 0;

  return (
    <Layout>
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '24px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
        }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {booking.pet_count > 1 ? '🚶🐕🐕' : '🚶🐕'} {t.tracking.liveTracking || 'Live Tracking'}
          </h1>
          <p style={{ opacity: 0.95, fontSize: '1.125rem' }}>
            {booking.booking_pets && booking.booking_pets.length > 0
              ? `${booking.booking_pets.map(bp => bp.pets.name).join(', ')}${booking.pet_count > 1 ? ` (${booking.pet_count} pets)` : ''}`
              : booking.pets?.name
            } {t.tracking.withWalker || 'with'} {booking.pet_masters?.profiles?.full_name}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #E8F5E9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📏</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
              {t.tracking.distance || 'Distance'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>
              {totalDistance} km
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #E8F5E9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⏱️</div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
              {t.tracking.duration || 'Duration'}
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4CAF50' }}>
              {elapsedTime} min
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #E8F5E9',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {booking.status === 'in_progress' ? '🟢' : '🔴'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
              {t.common.status}
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: booking.status === 'in_progress' ? '#4CAF50' : '#64748b',
              textTransform: 'capitalize'
            }}>
              {booking.status === 'in_progress' ? t.tracking.active || 'Active' : booking.status}
            </div>
          </div>
        </div>

        <div style={{
          height: '500px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
          border: '3px solid #E8F5E9'
        }}>
          <MapContainer
            center={mapCenter}
            zoom={15}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <RecenterMap center={mapCenter} />

            {startPoint && (
              <Marker position={startPoint} icon={startIcon} />
            )}

            {currentLocation && (
              <Marker
                position={[currentLocation.lat, currentLocation.lng]}
                icon={walkerIcon}
              />
            )}

            {pathCoordinates.length > 0 && (
              <Polyline
                positions={pathCoordinates}
                color="#4CAF50"
                weight={4}
                opacity={0.8}
              />
            )}
          </MapContainer>
        </div>

        {photos.length > 0 && (
          <div style={{ marginTop: '24px' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              📸 Walk Photos ({photos.length})
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '2px solid #E8F5E9',
                    background: 'white'
                  }}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.message}
                    style={{
                      width: '100%',
                      height: '200px',
                      objectFit: 'cover',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(photo.image_url, '_blank')}
                  />
                  <div style={{
                    padding: '12px',
                    fontSize: '12px',
                    color: '#64748b'
                  }}>
                    {new Date(photo.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {booking.status === 'in_progress' && (
          <div style={{
            marginTop: '24px',
            background: '#E8F5E9',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '2px solid #4CAF50',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#4CAF50',
              animation: 'pulse 2s infinite'
            }} />
            <p style={{ color: '#2E7D32', fontWeight: '600', margin: 0 }}>
              {t.tracking.liveUpdating || 'Live updates active - Location refreshes automatically'}
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
