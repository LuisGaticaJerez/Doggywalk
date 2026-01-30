import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

interface ProviderCardProps {
  provider: any;
  colors: {
    bg: string;
    badge: string;
    badgeText: string;
  };
}

export default function ProviderCard({ provider, colors }: ProviderCardProps) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  const [hotelAmenities, setHotelAmenities] = useState<any>(null);
  const [vetServices, setVetServices] = useState<any>(null);
  const [todayHours, setTodayHours] = useState<{ open_time: string; close_time: string; is_closed: boolean } | null>(null);

  useEffect(() => {
    loadProviderDetails();
  }, [provider.id]);

  const loadProviderDetails = async () => {
    const { data: photos } = await supabase
      .from('service_photos')
      .select('photo_url')
      .eq('pet_master_id', provider.id)
      .eq('is_cover', true)
      .maybeSingle();

    if (photos) {
      setCoverPhoto(photos.photo_url);
    }

    if (provider.service_type === 'hotel') {
      const { data: amenities } = await supabase
        .from('hotel_amenities')
        .select('*')
        .eq('pet_master_id', provider.id)
        .maybeSingle();
      setHotelAmenities(amenities);
    }

    if (provider.service_type === 'vet') {
      const { data: services } = await supabase
        .from('vet_services')
        .select('*')
        .eq('pet_master_id', provider.id)
        .maybeSingle();
      setVetServices(services);
    }

    const today = new Date().getDay();
    const { data: hours } = await supabase
      .from('service_hours')
      .select('*')
      .eq('pet_master_id', provider.id)
      .eq('day_of_week', today)
      .maybeSingle();

    if (hours) {
      setTodayHours(hours);
    }
  };

  const getTopAmenities = () => {
    if (!hotelAmenities) return [];
    const amenityList = [
      { key: 'air_conditioning', label: '❄️ AC', value: hotelAmenities.air_conditioning },
      { key: 'pool', label: '🏊 Pool', value: hotelAmenities.pool },
      { key: 'supervision_24h', label: '👁️ 24/7', value: hotelAmenities.supervision_24h },
      { key: 'cameras', label: '📹 Cameras', value: hotelAmenities.cameras }
    ];
    return amenityList.filter(a => a.value).slice(0, 3);
  };

  const getTopVetServices = () => {
    if (!vetServices) return [];
    const serviceList = [
      { key: 'emergency', label: '🚨 Emergency', value: vetServices.emergency },
      { key: 'surgery', label: '⚕️ Surgery', value: vetServices.surgery },
      { key: 'laboratory', label: '🔬 Lab', value: vetServices.laboratory },
      { key: 'home_visits', label: '🏠 Home Visits', value: vetServices.home_visits }
    ];
    return serviceList.filter(s => s.value).slice(0, 3);
  };

  return (
    <div
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
        background: coverPhoto ? `url(${coverPhoto}) center/cover` : colors.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '4rem',
        position: 'relative'
      }}>
        {!coverPhoto && (provider.service_type === 'walker' ? '🐕' : provider.service_type === 'hotel' ? '🏨' : '🩺')}
        {(provider.avg_rating && provider.avg_rating > 0) && (
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
            ⭐ {provider.avg_rating.toFixed(1)} ({provider.review_count})
          </div>
        )}
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

        {todayHours && (
          <div style={{
            fontSize: '13px',
            color: todayHours.is_closed ? '#ef4444' : '#10b981',
            marginBottom: '12px',
            padding: '6px 12px',
            background: todayHours.is_closed ? '#fee2e2' : '#d1fae5',
            borderRadius: '8px',
            fontWeight: '600'
          }}>
            🕐 {todayHours.is_closed ? 'Closed today' : `Open: ${todayHours.open_time} - ${todayHours.close_time}`}
          </div>
        )}

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

        {provider.service_type === 'hotel' && getTopAmenities().length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {getTopAmenities().map((amenity, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 8px',
                    background: '#dbeafe',
                    color: '#1e40af',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {amenity.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {provider.service_type === 'vet' && getTopVetServices().length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {getTopVetServices().map((service, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 8px',
                    background: '#fce7f3',
                    color: '#be185d',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}
                >
                  {service.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {provider.specialties && provider.specialties.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {provider.specialties.slice(0, 3).map((specialty: string, idx: number) => (
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
          to={user ? `/provider/${provider.id}/book` : `/login?redirect=/provider/${provider.id}/book`}
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
}
