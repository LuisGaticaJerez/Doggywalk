import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { uploadPhoto, compressImage } from '../utils/photoStorage';
import { Booking } from '../types';

interface RouteCoordinate {
  lat: number;
  lng: number;
  timestamp: string;
}

interface BookingWithDetails extends Booking {
  pets?: {
    name: string;
  };
  profiles?: {
    full_name: string;
  };
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
  `,
  className: 'walker-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
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

export default function ActiveWalk() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [route, setRoute] = useState<RouteCoordinate[]>([]);
  const [loading, setLoading] = useState(true);
  const [tracking, setTracking] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const loadBookingData = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          pets (
            name
          ),
          profiles (
            full_name
          )
        `)
        .eq('id', bookingId)
        .maybeSingle();

      if (bookingError) throw bookingError;
      if (!bookingData) {
        showToast('Booking not found', 'error');
        navigate('/my-bookings');
        return;
      }

      if (bookingData.pet_master_id !== profile?.id) {
        showToast('Unauthorized', 'error');
        navigate('/my-bookings');
        return;
      }

      setBooking(bookingData);

      const { data: routeData } = await supabase
        .from('routes')
        .select('*')
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
    } catch (err) {
      console.error('Error loading walk data:', err);
      showToast(t.common.error, 'error');
    } finally {
      setLoading(false);
    }
  }, [bookingId, profile?.id, navigate, showToast, t]);

  useEffect(() => {
    loadBookingData();
  }, [loadBookingData]);

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    if (!bookingId) return;

    const newCoord: RouteCoordinate = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: new Date().toISOString()
    };

    setCurrentLocation({ lat: newCoord.lat, lng: newCoord.lng });

    const updatedRoute = [...route, newCoord];
    setRoute(updatedRoute);

    const totalDistance = updatedRoute.length * 0.01;

    try {
      await supabase
        .from('routes')
        .update({
          coordinates: updatedRoute,
          distance_meters: Math.round(totalDistance * 1000)
        })
        .eq('booking_id', bookingId);

      await supabase
        .from('pet_masters')
        .update({
          current_latitude: newCoord.lat,
          current_longitude: newCoord.lng
        })
        .eq('id', profile?.id);
    } catch (error) {
      console.error('Error updating location:', error);
    }
  }, [bookingId, route, profile?.id]);

  const startTracking = () => {
    if (!('geolocation' in navigator)) {
      showToast('Geolocation not supported', 'error');
      return;
    }

    setTracking(true);

    const watchId = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => {
        console.error('Geolocation error:', error);
        showToast('Error tracking location', 'error');
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );

    watchIdRef.current = watchId;
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setTracking(false);
  };

  const endWalk = async () => {
    try {
      stopTracking();

      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      await supabase
        .from('routes')
        .update({ ended_at: new Date().toISOString() })
        .eq('booking_id', bookingId);

      showToast('Walk completed successfully', 'success');
      navigate('/my-bookings');
    } catch (error) {
      console.error('Error ending walk:', error);
      showToast('Error ending walk', 'error');
    }
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bookingId || !profile?.id) return;

    setUploadingPhoto(true);
    try {
      const compressed = await compressImage(file);
      const imageUrl = await uploadPhoto(bookingId, compressed);

      await supabase.from('chat_messages').insert({
        booking_id: bookingId,
        sender_id: profile.id,
        message: '📸 Photo from the walk',
        image_url: imageUrl,
      });

      showToast('Photo sent successfully!', 'success');

      if (photoInputRef.current) {
        photoInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast('Failed to send photo', 'error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

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
    ? (route.length * 0.01).toFixed(2)
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
            🐕 {t.tracking.walkInProgress}
          </h1>
          <p style={{ opacity: 0.95, fontSize: '1.125rem' }}>
            {booking.pets?.name} - {booking.profiles?.full_name}
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
              {t.tracking.distance}
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
              {t.tracking.duration}
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
              {tracking ? '🟢' : '🔴'}
            </div>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
              Tracking
            </div>
            <div style={{
              fontSize: '1rem',
              fontWeight: 'bold',
              color: tracking ? '#4CAF50' : '#ef4444'
            }}>
              {tracking ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        <div style={{
          height: '400px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.2)',
          border: '3px solid #E8F5E9',
          marginBottom: '24px'
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
            {currentLocation && <RecenterMap center={[currentLocation.lat, currentLocation.lng]} />}

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

        <div style={{ display: 'grid', gap: '12px' }}>
          {!tracking ? (
            <button
              onClick={startTracking}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
              }}
            >
              ▶️ {t.tracking.startWalk}
            </button>
          ) : (
            <button
              onClick={stopTracking}
              style={{
                padding: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              ⏸️ Pause Tracking
            </button>
          )}

          <button
            onClick={endWalk}
            style={{
              padding: '16px',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
            }}
          >
            🏁 {t.tracking.endWalk}
          </button>
        </div>

        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          capture="environment"
          onChange={handlePhotoCapture}
          style={{ display: 'none' }}
        />

        <button
          onClick={() => photoInputRef.current?.click()}
          disabled={uploadingPhoto}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: uploadingPhoto
              ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
              : 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: 'white',
            border: 'none',
            fontSize: '28px',
            cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          title="Take a photo"
        >
          {uploadingPhoto ? (
            <div
              style={{
                width: '28px',
                height: '28px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTopColor: 'white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : (
            '📸'
          )}
        </button>
      </div>
    </Layout>
  );
}
