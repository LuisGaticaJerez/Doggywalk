import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useI18n } from '../contexts/I18nContext';

interface Provider {
  id: string;
  latitude: number | string | null;
  longitude: number | string | null;
  profiles?: {
    full_name: string;
  };
  service_type: string;
  rating?: number;
  avg_rating?: number;
  hourly_rate: number | string;
}

interface ProvidersMapProps {
  providers: Provider[];
  userLocation: { lat: number; lng: number } | null;
  onProviderClick: (providerId: string) => void;
}

function RecenterMap({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

const createCustomIcon = (emoji: string, color: string) => {
  return L.divIcon({
    html: `
      <div style="
        background: ${color};
        width: 40px;
        height: 40px;
        border-radius: 50% 50% 50% 0;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: rotate(-45deg);
      ">
        <span style="transform: rotate(45deg);">${emoji}</span>
      </div>
    `,
    className: 'custom-marker',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });
};

const userIcon = L.divIcon({
  html: `
    <div style="
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%);
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 4px solid white;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.5);
      position: relative;
      animation: pulse 2s infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.2); opacity: 0.8; }
      }
    </style>
  `,
  className: 'user-marker',
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

export default function ProvidersMap({ providers, userLocation, onProviderClick }: ProvidersMapProps) {
  const { t } = useI18n();
  const mapRef = useRef<L.Map>(null);

  const defaultCenter: [number, number] = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [4.7110, -74.0721];

  const providerIcons = useMemo(() => ({
    walker: createCustomIcon('🚶', 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)'),
    hotel: createCustomIcon('🏨', 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)'),
    vet: createCustomIcon('🩺', 'linear-gradient(135deg, #FF6B9D 0%, #FE5196 100%)'),
    default: createCustomIcon('🐾', 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)')
  }), []);

  const getProviderIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'walker':
        return { emoji: '🚶', color: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)', icon: providerIcons.walker };
      case 'hotel':
        return { emoji: '🏨', color: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)', icon: providerIcons.hotel };
      case 'vet':
        return { emoji: '🩺', color: 'linear-gradient(135deg, #FF6B9D 0%, #FE5196 100%)', icon: providerIcons.vet };
      default:
        return { emoji: '🐾', color: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)', icon: providerIcons.default };
    }
  };

  const validProviders = useMemo(
    () => providers.filter(p => {
      const lat = typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude;
      const lng = typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude;
      return lat && lng && !isNaN(lat) && !isNaN(lng);
    }).map(p => ({
      ...p,
      latitude: typeof p.latitude === 'string' ? parseFloat(p.latitude) : p.latitude,
      longitude: typeof p.longitude === 'string' ? parseFloat(p.longitude) : p.longitude,
    })),
    [providers]
  );

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: '20px', overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && <RecenterMap center={[userLocation.lat, userLocation.lng]} />}

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>📍</div>
                <strong>{t.provider.yourLocation}</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {validProviders.map((provider) => {
          const iconData = getProviderIcon(provider.service_type);
          const lat = typeof provider.latitude === 'number' ? provider.latitude : parseFloat(String(provider.latitude));
          const lng = typeof provider.longitude === 'number' ? provider.longitude : parseFloat(String(provider.longitude));

          return (
            <Marker
              key={provider.id}
              position={[lat, lng]}
              icon={iconData.icon}
              eventHandlers={{
                click: () => onProviderClick(provider.id)
              }}
            >
              <Popup>
                <div style={{ padding: '8px', minWidth: '200px' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '8px'
                  }}>
                    {iconData.emoji} {provider.profiles?.full_name || 'Provider'}
                  </h3>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    background: '#FFF9E6',
                    color: '#8B6914',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    marginBottom: '8px',
                    textTransform: 'capitalize'
                  }}>
                    {provider.service_type}
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px'
                  }}>
                    <span style={{ fontSize: '14px', color: '#64748b' }}>
                      ⭐ {(provider.avg_rating || provider.rating || 0).toFixed(1)}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#FF8C42' }}>
                      ${typeof provider.hourly_rate === 'string' ? parseFloat(provider.hourly_rate) : provider.hourly_rate}/hr
                    </span>
                  </div>
                  <button
                    onClick={() => onProviderClick(provider.id)}
                    style={{
                      width: '100%',
                      marginTop: '12px',
                      padding: '8px',
                      background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {t.common.viewDetails}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {validProviders.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '24px',
          borderRadius: '16px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗺️</div>
          <p style={{ color: '#64748b', fontWeight: '500' }}>
            {t.provider.noLocationData}
          </p>
        </div>
      )}
    </div>
  );
}
