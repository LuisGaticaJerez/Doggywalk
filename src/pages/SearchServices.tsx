import { useEffect, useState, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const [searchParams] = useSearchParams();
  const [providers, setProviders] = useState<PetMasterWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'all' | 'walker' | 'hotel' | 'vet' | 'grooming'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('map');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [initialUserLocation, setInitialUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultLocation, setSearchResultLocation] = useState<{ lat: number; lng: number } | null>(null);
  const isLoadingRef = useRef(false);
  const isMountedRef = useRef(true);
  const hasProcessedParams = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    const defaultLocation = { lat: -36.7225, lng: -73.1136 };
    setUserLocation(defaultLocation);
    setInitialUserLocation(defaultLocation);

    const savedSearchState = sessionStorage.getItem('searchState');
    if (savedSearchState) {
      try {
        const state = JSON.parse(savedSearchState);
        if (state.serviceType) setServiceType(state.serviceType);
        if (state.searchTerm) {
          setSearchTerm(state.searchTerm);
          setTimeout(() => {
            handleUnifiedSearch(state.searchTerm);
          }, 800);
        }
        if (state.searchResultLocation) setSearchResultLocation(state.searchResultLocation);
        sessionStorage.removeItem('searchState');
        hasProcessedParams.current = true;
      } catch (e) {
        console.error('Error restoring search state:', e);
      }
    }

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userLocation || hasProcessedParams.current) return;

    const processUrlParams = async () => {
      const useLocation = searchParams.get('useLocation');
      const address = searchParams.get('address');
      const service = searchParams.get('service');

      if (service && service !== 'all') {
        setServiceType(service as any);
      }

      if (useLocation === 'true') {
        hasProcessedParams.current = true;
        await getUserLocation();
      } else if (address) {
        hasProcessedParams.current = true;
        setSearchTerm(address);
        setTimeout(() => {
          handleUnifiedSearch(address);
        }, 500);
      } else {
        hasProcessedParams.current = true;
      }
    };

    processUrlParams();
  }, [userLocation, searchParams]);

  useEffect(() => {
    if (userLocation) {
      loadProviders();
    }
  }, [serviceType, userLocation]);

  const getUserLocation = async () => {
    if (!('geolocation' in navigator)) {
      setLocationError(t.search.geolocationNotSupported);
      setUserLocation({ lat: -36.7225, lng: -73.1136 });
      return;
    }

    try {
      // Verificar el estado del permiso primero
      if ('permissions' in navigator) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          console.log('Permission status:', permissionStatus.state);
        } catch (e) {
          console.log('Permission API not fully supported, continuing with geolocation request');
        }
      }

      // Solicitar la ubicación con opciones optimizadas para Mac/Safari
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isMountedRef.current) {
            console.log('Location obtained:', position.coords.latitude, position.coords.longitude);
            const newLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(newLocation);
            setInitialUserLocation(newLocation);
            setLocationError(null);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          if (isMountedRef.current) {
            let errorMessage = t.search.geolocationError;

            // Proporcionar mensajes de error más específicos
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Permiso de ubicación denegado. Por favor, habilita la ubicación en la configuración de tu navegador.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Información de ubicación no disponible.';
                break;
              case error.TIMEOUT:
                errorMessage = 'La solicitud de ubicación ha expirado.';
                break;
            }

            setLocationError(errorMessage);
            // Usar Talcahuano como ubicación predeterminada
            setUserLocation({ lat: -36.7225, lng: -73.1136 });
          }
        },
        {
          enableHighAccuracy: false, // false es mejor para Mac/Safari
          timeout: 10000,
          maximumAge: 300000
        }
      );
    } catch (error) {
      console.error('Error in getUserLocation:', error);
      setLocationError(t.search.geolocationError);
      setUserLocation({ lat: -36.7225, lng: -73.1136 });
    }
  };

  const handleUnifiedSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResultLocation(null);
      setLocationError(null);
      return;
    }

    setIsSearching(true);
    setSearchTerm(query);

    try {
      // Buscar como dirección usando geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, Chile&limit=1`,
        {
          headers: {
            'User-Agent': 'DoggyWalk App'
          }
        }
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLocation = { lat: parseFloat(lat), lng: parseFloat(lon) };

        // Establecer la ubicación de búsqueda
        // Esto hará que el useMemo recalcule automáticamente:
        // 1. Distancias desde este punto
        // 2. Proveedores dentro de 50 km
        // 3. Distancia desde ubicación inicial
        // 4. Banner de alerta si está lejos
        setSearchResultLocation(newLocation);
        setLocationError(null);

        console.log('Búsqueda exitosa:', {
          query,
          location: newLocation,
          displayName: data[0].display_name
        });
      } else {
        setLocationError('No se encontraron resultados para: ' + query);
        setSearchResultLocation(null);
      }
    } catch (error) {
      console.error('Error geocoding location:', error);
      setLocationError('Error al buscar la ubicación. Intenta con otro término.');
      setSearchResultLocation(null);
    } finally {
      setIsSearching(false);
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
    // La ubicación desde donde calcular distancias: ubicación de búsqueda o ubicación actual
    const searchLocation = searchResultLocation || userLocation;

    // Filtrar solo por disponibilidad (no por texto de búsqueda)
    let filtered = providers.filter(provider => {
      const matchesAvailability =
        provider.service_type === 'hotel' ||
        provider.service_type === 'vet' ||
        provider.service_type === 'grooming' ||
        provider.is_available === true;

      return matchesAvailability;
    });

    // Recalcular distancias desde el punto de búsqueda
    if (searchLocation) {
      filtered = filtered.map(provider => {
        if (provider.latitude && provider.longitude) {
          const distance = calculateDistance(
            searchLocation.lat,
            searchLocation.lng,
            provider.latitude,
            provider.longitude
          );
          return { ...provider, distance };
        }
        return { ...provider, distance: Infinity };
      });

      // Ordenar por distancia desde el punto de búsqueda
      filtered.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    }

    return filtered;
  }, [providers, userLocation, searchResultLocation]);

  const handleProviderClick = (providerId: string) => {
    const element = document.getElementById(`provider-${providerId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'highlight 1s ease';
    }
  };

  const handleMapMove = (center: { lat: number; lng: number }) => {
    // Solo actualizar la vista del mapa, no afectar búsquedas
    // Si hay una búsqueda activa, mantenerla
    if (!searchResultLocation) {
      setUserLocation(center);
    }
  };

  // Filtrar y agrupar proveedores según búsqueda activa
  const { providersToShow, isSearchingAwayFromHome, distanceFromHome } = useMemo(() => {
    const searchLocation = searchResultLocation || userLocation;

    if (!searchLocation) {
      return { providersToShow: [], isSearchingAwayFromHome: false, distanceFromHome: 0 };
    }

    // Filtrar proveedores dentro de 50 km de la ubicación de búsqueda
    const nearby = filteredProviders.filter(provider =>
      provider.distance !== undefined && provider.distance <= 50
    );

    // Determinar si está buscando lejos de su ubicación actual
    let isAway = false;
    let distanceAway = 0;

    if (searchResultLocation && initialUserLocation) {
      distanceAway = calculateDistance(
        initialUserLocation.lat,
        initialUserLocation.lng,
        searchResultLocation.lat,
        searchResultLocation.lng
      );
      isAway = distanceAway > 50;
    }

    console.log('DEBUG:', {
      totalFiltered: filteredProviders.length,
      nearbyProviders: nearby.length,
      isSearchingAway: isAway,
      distance: distanceAway,
      hasSearchResult: !!searchResultLocation,
      searchLocation,
      initialLocation: initialUserLocation
    });

    return {
      providersToShow: nearby,
      isSearchingAwayFromHome: isAway,
      distanceFromHome: distanceAway
    };
  }, [filteredProviders, initialUserLocation, searchResultLocation]);

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
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="🔎 Buscar por nombre, servicio o dirección..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUnifiedSearch(searchTerm)}
                style={{
                  flex: 1,
                  padding: '14px 18px',
                  border: '2px solid #FFE5B4',
                  borderRadius: '30px',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#FF8C42'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#FFE5B4'}
              />
              <button
                onClick={() => handleUnifiedSearch(searchTerm)}
                disabled={isSearching}
                style={{
                  padding: '10px 24px',
                  background: isSearching ? '#CCC' : 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '30px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: isSearching ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isSearching ? 'none' : '0 4px 12px rgba(76, 175, 80, 0.3)',
                  whiteSpace: 'nowrap'
                }}
              >
                {isSearching ? '🔄' : '🔍 Buscar'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
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
                title="Usar mi ubicación actual"
              >
                📍 Mi ubicación
              </button>
              {(searchTerm || searchResultLocation) && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSearchResultLocation(null);
                    setLocationError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                    whiteSpace: 'nowrap'
                  }}
                >
                  ✕ Limpiar
                </button>
              )}
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
              providers={providersToShow}
              userLocation={searchResultLocation || userLocation}
              onProviderClick={handleProviderClick}
              onMapMove={handleMapMove}
            />
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
        ) : providersToShow.length === 0 ? (
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
                ? 'No hay proveedores dentro de 50 km en esta ubicación. Intenta buscar en otra área.'
                : 'No hay proveedores registrados en este momento'}
            </p>
          </div>
        ) : (
          <>
            {isSearchingAwayFromHome ? (
              <div style={{
                background: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
                padding: '20px 28px',
                borderRadius: '16px',
                marginBottom: '24px',
                color: 'white',
                boxShadow: '0 4px 16px rgba(255, 152, 0, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '2rem' }}>🚗</div>
                  <div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
                      {providersToShow.length} {providersToShow.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
                      Esta ubicación está a {distanceFromHome.toFixed(1)} km de tu ubicación actual
                    </div>
                  </div>
                </div>
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
                  <span>⚠️</span>
                  Lejos de tu ubicación
                </div>
              </div>
            ) : (
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
                      {providersToShow.length} {providersToShow.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
                    </div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.95 }}>
                      {searchResultLocation
                        ? 'Dentro de un radio de 50 km del punto de búsqueda'
                        : 'Dentro de un radio de 50 km de tu ubicación'}
                    </div>
                  </div>
                </div>
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
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {providersToShow.map(provider => (
                <ProviderCard key={provider.id} provider={provider} />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
