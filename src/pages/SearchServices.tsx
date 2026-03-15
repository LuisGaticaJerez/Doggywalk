import { useEffect, useState, useMemo, useRef } from 'react';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import ProvidersMap from '../components/ProvidersMap';
import ProviderCard from '../components/ProviderCard';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { PetMaster } from '../types';
import { calculateDistance } from '../utils/distance';

interface PetMasterWithProfile extends PetMaster {
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
  distance?: number;
  avg_rating?: number;
  review_count?: number;
}

export default function SearchServices() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<PetMasterWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'all' | 'walker' | 'hotel' | 'vet' | 'grooming'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [manualLocation, setManualLocation] = useState('');
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    getUserLocation();

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (userLocation) {
      loadProviders();
    }
  }, [serviceType, userLocation]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMountedRef.current) {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
            setLocationError(null);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (isMountedRef.current) {
            setLocationError(t.search.geolocationError);
            // Usar Talcahuano como ubicación predeterminada
            setUserLocation({ lat: -36.7225, lng: -73.1136 });
          }
        },
        { timeout: 10000, maximumAge: 300000 }
      );
    } else {
      setLocationError(t.search.geolocationNotSupported);
      // Usar Talcahuano como ubicación predeterminada
      setUserLocation({ lat: -36.7225, lng: -73.1136 });
    }
  };

  const handleManualLocationSearch = async () => {
    if (!manualLocation.trim()) return;

    setIsGeocodingLocation(true);
    try {
      // Usar Nominatim (OpenStreetMap) para geocodificar
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualLocation)}&limit=1`,
        {
          headers: {
            'User-Agent': 'DoggyWalk App'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setUserLocation({ lat: parseFloat(lat), lng: parseFloat(lon) });
        setLocationError(null);
      } else {
        setLocationError('No se pudo encontrar la ubicación');
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      setLocationError('Error al buscar la ubicación');
    } finally {
      setIsGeocodingLocation(false);
    }
  };

  const loadProviders = async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      let query = supabase
        .from('pet_masters')
        .select(`
          *,
          profiles!pet_masters_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .not('service_type', 'is', null)
        .eq('is_available', true);

      const { data, error } = await query;

      if (error) {
        console.error('Query error:', error);
        throw error;
      }

      if (data && isMountedRef.current) {
        let availableProviders = data;

        // Filtrar por tipo de servicio
        if (serviceType !== 'all') {
          availableProviders = availableProviders.filter(provider =>
            provider.service_type === serviceType
          );
        }

        const { data: ratingsData } = await supabase
          .from('ratings')
          .select('pet_master_id, rating');

        const ratingsByProvider = new Map<string, { total: number; count: number; avg: number }>();
        if (ratingsData) {
          ratingsData.forEach(r => {
            const current = ratingsByProvider.get(r.pet_master_id) || { total: 0, count: 0, avg: 0 };
            const newTotal = current.total + r.rating;
            const newCount = current.count + 1;
            ratingsByProvider.set(r.pet_master_id, {
              total: newTotal,
              count: newCount,
              avg: newTotal / newCount
            });
          });
        }

        let processedProviders = availableProviders.map(provider => {
          const stats = ratingsByProvider.get(provider.id);
          return {
            ...provider,
            avg_rating: stats?.avg || 0,
            review_count: stats?.count || 0
          };
        });

        if (userLocation) {
          processedProviders = processedProviders.map(provider => {
            if (provider.latitude && provider.longitude) {
              const distance = calculateDistance(
                userLocation.lat,
                userLocation.lng,
                provider.latitude,
                provider.longitude
              );
              return { ...provider, distance };
            }
            return { ...provider, distance: Infinity };
          });

          processedProviders.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        }

        setProviders(processedProviders);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  };

  const filteredProviders = useMemo(() => {
    const filtered = providers.filter(provider => {
      const matchesSearch = (() => {
        if (!searchTerm) return true;
        const name = provider.profiles?.full_name?.toLowerCase() || '';
        const bio = provider.bio?.toLowerCase() || '';
        const specialties = provider.specialties?.join(' ').toLowerCase() || '';
        const search = searchTerm.toLowerCase();
        return name.includes(search) || bio.includes(search) || specialties.includes(search);
      })();

      const matchesDistance = (() => {
        if (!userLocation || !provider.distance) return true;
        return provider.distance <= maxDistance;
      })();

      const matchesAvailability =
        provider.service_type === 'hotel' ||
        provider.service_type === 'vet' ||
        provider.service_type === 'grooming' ||
        provider.is_available === true;

      return matchesSearch && matchesDistance && matchesAvailability;
    });

    return filtered;
  }, [providers, searchTerm, userLocation, maxDistance]);

  const handleProviderClick = (providerId: string) => {
    const element = document.getElementById(`provider-${providerId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'highlight 1s ease';
    }
  };

  const handleMapMove = (center: { lat: number; lng: number }) => {
    setUserLocation(center);
  };

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: '16px' }}>
          <BackButton color="#FF6B6B" />
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8C42 100%)',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(255, 107, 107, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            right: '-20px',
            top: '-20px',
            fontSize: '8rem',
            opacity: 0.15
          }}>🔍</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px', position: 'relative' }}>
            🔍 {t.search.title}
          </h1>
          <p style={{ opacity: 0.95, fontSize: '1.125rem' }}>
            {t.home.subtitle}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '28px',
          borderRadius: '20px',
          border: '2px solid #FFE5B4',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder={`🔎 ${t.common.search}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 18px',
                border: '2px solid #FFE5B4',
                borderRadius: '30px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s',
                marginBottom: '12px'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FF8C42'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#FFE5B4'}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                placeholder="Buscar por ciudad o direccion"
                value={manualLocation}
                onChange={(e) => setManualLocation(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualLocationSearch()}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #E0E0E0',
                  borderRadius: '25px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#4CAF50'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#E0E0E0'}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleManualLocationSearch}
                  disabled={isGeocodingLocation}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: isGeocodingLocation ? '#CCC' : 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: isGeocodingLocation ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: isGeocodingLocation ? 'none' : '0 4px 12px rgba(76, 175, 80, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {isGeocodingLocation ? 'Buscando...' : 'Buscar'}
                </button>
                <button
                  onClick={getUserLocation}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                  title="Usar mi ubicacion actual"
                >
                  Mi ubicacion
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
            <button
              onClick={() => setServiceType('all')}
              style={{
                padding: '10px 16px',
                background: serviceType === 'all' ? 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)' : 'white',
                color: serviceType === 'all' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'all' ? '#FF8C42' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'all' ? '0 4px 12px rgba(255, 140, 66, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              🌟 {t.provider.services}
            </button>
            <button
              onClick={() => setServiceType('walker')}
              style={{
                padding: '10px 16px',
                background: serviceType === 'walker' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'white',
                color: serviceType === 'walker' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'walker' ? '#10B981' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'walker' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              🚶 {t.search.walker}
            </button>
            <button
              onClick={() => setServiceType('hotel')}
              style={{
                padding: '10px 16px',
                background: serviceType === 'hotel' ? 'linear-gradient(135deg, #D4A017 0%, #B8860B 100%)' : 'white',
                color: serviceType === 'hotel' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'hotel' ? '#D4A017' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'hotel' ? '0 4px 12px rgba(212, 160, 23, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              🏨 {t.search.boarding}
            </button>
            <button
              onClick={() => setServiceType('vet')}
              style={{
                padding: '10px 16px',
                background: serviceType === 'vet' ? 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)' : 'white',
                color: serviceType === 'vet' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'vet' ? '#06B6D4' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'vet' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              🩺 {t.search.veterinary}
            </button>
            <button
              onClick={() => setServiceType('grooming')}
              style={{
                padding: '10px 16px',
                background: serviceType === 'grooming' ? 'linear-gradient(135deg, #FF8B7F 0%, #FF9999 100%)' : 'white',
                color: serviceType === 'grooming' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'grooming' ? '#FF8B7F' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'grooming' ? '0 4px 12px rgba(255, 139, 127, 0.3)' : 'none',
                whiteSpace: 'nowrap',
                textAlign: 'center'
              }}
            >
              ✂️ {t.search.grooming || 'Grooming'}
            </button>
          </div>

          <div style={{
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '2px solid #FFE5B4',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'list' ? 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)' : 'white',
                  color: viewMode === 'list' ? 'white' : '#64748b',
                  border: `2px solid ${viewMode === 'list' ? '#FF8C42' : '#e2e8f0'}`,
                  borderRadius: '25px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: viewMode === 'list' ? '0 4px 12px rgba(255, 140, 66, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.common.listView}
              </button>
              <button
                onClick={() => setViewMode('map')}
                style={{
                  padding: '8px 16px',
                  background: viewMode === 'map' ? 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)' : 'white',
                  color: viewMode === 'map' ? 'white' : '#64748b',
                  border: `2px solid ${viewMode === 'map' ? '#4CAF50' : '#e2e8f0'}`,
                  borderRadius: '25px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: viewMode === 'map' ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.common.mapView}
              </button>
            </div>

            {userLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '250px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b', whiteSpace: 'nowrap' }}>
                  {t.search.radiusLabel} {maxDistance}km
                </span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={maxDistance}
                  onChange={(e) => setMaxDistance(Number(e.target.value))}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: `linear-gradient(to right, #FF8C42 0%, #FF8C42 ${(maxDistance/50)*100}%, #e2e8f0 ${(maxDistance/50)*100}%, #e2e8f0 100%)`,
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                />
              </div>
            )}

            {locationError && (
              <div style={{
                padding: '8px 16px',
                background: '#FFF9E6',
                color: '#8B6914',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: '500'
              }}>
                ⚠️ {locationError}
              </div>
            )}
          </div>
        </div>

        {viewMode === 'map' && (
          <div style={{
            height: '600px',
            marginBottom: '32px',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 24px rgba(255, 140, 66, 0.2)',
            border: '3px solid #FFE5B4'
          }}>
            <ProvidersMap
              providers={filteredProviders}
              userLocation={userLocation}
              onProviderClick={handleProviderClick}
              onMapMove={handleMapMove}
            />
          </div>
        )}

        {!loading && filteredProviders.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
            padding: '20px 28px',
            borderRadius: '16px',
            marginBottom: '24px',
            color: 'white',
            boxShadow: '0 4px 16px rgba(76, 175, 80, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '2rem' }}>📍</div>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
                  {filteredProviders.length} {filteredProviders.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
                </div>
                <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
                  Dentro de un radio de {maxDistance}km de tu ubicación
                </div>
              </div>
            </div>
            {userLocation && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '10px 20px',
                borderRadius: '25px',
                fontSize: '0.9rem',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>🎯</span>
                Ordenados por distancia
              </div>
            )}
          </div>
        )}

        {loading ? (
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
          </div>
        ) : filteredProviders.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '20px',
            border: '2px dashed #FFB74D',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(255, 183, 77, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔍</div>
            <p style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: '500', marginBottom: '12px' }}>
              {t.search.noResults}
            </p>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', marginTop: '8px' }}>
              {providers.length > 0
                ? 'Intenta ampliar el radio de búsqueda o mover el mapa a otra ubicación'
                : 'No hay proveedores registrados en este momento'}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {filteredProviders.map(provider => (
              <ProviderCard key={provider.id} provider={provider} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
