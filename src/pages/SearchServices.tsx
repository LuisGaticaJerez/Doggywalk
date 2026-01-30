import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProvidersMap from '../components/ProvidersMap';
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
}

export default function SearchServices() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<PetMasterWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'all' | 'walker' | 'hotel' | 'vet'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxDistance, setMaxDistance] = useState<number>(10);

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    loadProviders();
  }, [serviceType]);

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          console.error('Error getting location:', error);
          setLocationError(t.search.geolocationError);
          setUserLocation({ lat: 4.7110, lng: -74.0721 });
        }
      );
    } else {
      setLocationError(t.search.geolocationNotSupported);
      setUserLocation({ lat: 4.7110, lng: -74.0721 });
    }
  };

  const loadProviders = async () => {
    try {
      let query = supabase
        .from('pet_masters')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('is_available', true)
        .eq('verified', true);

      if (serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && userLocation) {
        const providersWithDistance = data.map(provider => {
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

        providersWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        setProviders(providersWithDistance);
      } else if (data) {
        setProviders(data);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation && providers.length > 0) {
      loadProviders();
    }
  }, [userLocation]);

  const filteredProviders = providers.filter(provider => {
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

    return matchesSearch && matchesDistance;
  });

  const handleProviderClick = (providerId: string) => {
    const element = document.getElementById(`provider-${providerId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.style.animation = 'highlight 1s ease';
    }
  };

  return (
    <Layout>
      <div>
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
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#FF8C42'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#FFE5B4'}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setServiceType('all')}
              style={{
                padding: '10px 24px',
                background: serviceType === 'all' ? 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)' : 'white',
                color: serviceType === 'all' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'all' ? '#FF8C42' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'all' ? '0 4px 12px rgba(255, 140, 66, 0.3)' : 'none'
              }}
            >
              🌟 {t.provider.services}
            </button>
            <button
              onClick={() => setServiceType('walker')}
              style={{
                padding: '10px 24px',
                background: serviceType === 'walker' ? 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)' : 'white',
                color: serviceType === 'walker' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'walker' ? '#4CAF50' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'walker' ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none'
              }}
            >
              🚶 {t.search.walker}
            </button>
            <button
              onClick={() => setServiceType('hotel')}
              style={{
                padding: '10px 24px',
                background: serviceType === 'hotel' ? 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)' : 'white',
                color: serviceType === 'hotel' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'hotel' ? '#42A5F5' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'hotel' ? '0 4px 12px rgba(66, 165, 245, 0.3)' : 'none'
              }}
            >
              🏨 {t.search.boarding}
            </button>
            <button
              onClick={() => setServiceType('vet')}
              style={{
                padding: '10px 24px',
                background: serviceType === 'vet' ? 'linear-gradient(135deg, #FF6B9D 0%, #FE5196 100%)' : 'white',
                color: serviceType === 'vet' ? 'white' : '#64748b',
                border: `2px solid ${serviceType === 'vet' ? '#FF6B9D' : '#e2e8f0'}`,
                borderRadius: '25px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: serviceType === 'vet' ? '0 4px 12px rgba(255, 107, 157, 0.3)' : 'none'
              }}
            >
              🩺 {t.search.veterinary}
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
            gap: '16px'
          }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => setViewMode('list')}
                style={{
                  padding: '10px 20px',
                  background: viewMode === 'list' ? 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)' : 'white',
                  color: viewMode === 'list' ? 'white' : '#64748b',
                  border: `2px solid ${viewMode === 'list' ? '#FF8C42' : '#e2e8f0'}`,
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: viewMode === 'list' ? '0 4px 12px rgba(255, 140, 66, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {t.common.listView}
              </button>
              <button
                onClick={() => setViewMode('map')}
                style={{
                  padding: '10px 20px',
                  background: viewMode === 'map' ? 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)' : 'white',
                  color: viewMode === 'map' ? 'white' : '#64748b',
                  border: `2px solid ${viewMode === 'map' ? '#4CAF50' : '#e2e8f0'}`,
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: viewMode === 'map' ? '0 4px 12px rgba(76, 175, 80, 0.3)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {t.common.mapView}
              </button>
            </div>

            {userLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '300px' }}>
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
            <p style={{ fontSize: '1.25rem', color: '#64748b', fontWeight: '500' }}>
              {t.search.noResults}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {filteredProviders.map(provider => {
              const serviceColors = {
                walker: { bg: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)', badge: '#E8F5E9', badgeText: '#2E7D32' },
                hotel: { bg: 'linear-gradient(135deg, #42A5F5 0%, #2196F3 100%)', badge: '#E3F2FD', badgeText: '#1565C0' },
                vet: { bg: 'linear-gradient(135deg, #FF6B9D 0%, #FE5196 100%)', badge: '#FCE4EC', badgeText: '#C2185B' }
              };
              const colors = serviceColors[provider.service_type as keyof typeof serviceColors] || serviceColors.walker;

              return (
              <div
                key={provider.id}
                id={`provider-${provider.id}`}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '2px solid #FFE5B4',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 140, 66, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 66, 0.1)';
                }}
              >
                <div style={{
                  height: '140px',
                  background: colors.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '4rem',
                  position: 'relative'
                }}>
                  {provider.service_type === 'walker' ? '🐕' : provider.service_type === 'hotel' ? '🏨' : '🩺'}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '700',
                    color: colors.badgeText,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ⭐ {provider.rating.toFixed(1)}
                  </div>
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                        {provider.profiles?.full_name || 'Provider'}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '6px 14px',
                        background: colors.badge,
                        color: colors.badgeText,
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        textTransform: 'capitalize'
                      }}>
                        {provider.service_type === 'walker' ? '🚶 ' : provider.service_type === 'hotel' ? '🏨 ' : '🩺 '}
                        {provider.service_type}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {provider.distance && provider.distance !== Infinity && (
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '700',
                          color: '#FF8C42',
                          marginBottom: '4px'
                        }}>
                          📍 {provider.distance.toFixed(1)} km
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                        📊 {provider.total_walks} services
                      </div>
                    </div>
                  </div>

                  {provider.address && (
                    <div style={{
                      fontSize: '13px',
                      color: '#64748b',
                      marginBottom: '12px',
                      padding: '8px 12px',
                      background: '#FFF9E6',
                      borderRadius: '8px'
                    }}>
                      🏠 {provider.address}
                    </div>
                  )}

                  {provider.bio && (
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {provider.bio}
                    </p>
                  )}

                  {provider.specialties && provider.specialties.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {provider.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              background: '#f1f5f9',
                              color: '#475569',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{t.provider.hourlyRate}</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                        ${provider.hourly_rate}/hr
                      </div>
                    </div>
                    {provider.price_per_night && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>Per Night</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                          ${provider.price_per_night}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/provider/${provider.id}/book`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      width: '100%',
                      padding: '14px',
                      background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '30px',
                      fontSize: '15px',
                      fontWeight: '700',
                      textAlign: 'center',
                      boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    📅 {t.provider.bookNow}
                  </Link>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
