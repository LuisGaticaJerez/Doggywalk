import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
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
        .eq('verified', true);

      if (serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data) {
        const { data: activeBookings } = await supabase
          .from('bookings')
          .select('pet_master_id')
          .in('status', ['in_progress', 'accepted']);

        const activeProviderIds = new Set(
          activeBookings?.map(b => b.pet_master_id).filter(Boolean) || []
        );

        const availableProviders = data.filter(
          provider => !activeProviderIds.has(provider.id)
        );

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

    const matchesAvailability = (() => {
      if (provider.service_type === 'hotel' || provider.service_type === 'vet') {
        return true;
      }
      return provider.is_available === true;
    })();

    return matchesSearch && matchesDistance && matchesAvailability;
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

              return <ProviderCard key={provider.id} provider={provider} colors={colors} />;
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
