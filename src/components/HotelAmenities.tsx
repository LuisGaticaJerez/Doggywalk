import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';

interface Amenities {
  id?: string;
  air_conditioning: boolean;
  heating: boolean;
  pool: boolean;
  playground: boolean;
  grooming: boolean;
  training: boolean;
  veterinary_on_site: boolean;
  supervision_24h: boolean;
  cameras: boolean;
  individual_rooms: boolean;
  group_play: boolean;
  special_diet: boolean;
}

interface HotelAmenitiesProps {
  petMasterId: string;
  editable?: boolean;
}

export default function HotelAmenities({ petMasterId, editable = false }: HotelAmenitiesProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [amenities, setAmenities] = useState<Amenities>({
    air_conditioning: false,
    heating: false,
    pool: false,
    playground: false,
    grooming: false,
    training: false,
    veterinary_on_site: false,
    supervision_24h: false,
    cameras: false,
    individual_rooms: false,
    group_play: false,
    special_diet: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const amenityList = [
    { key: 'air_conditioning', label: t.amenities?.airConditioning || 'Air Conditioning', icon: '❄️' },
    { key: 'heating', label: t.amenities?.heating || 'Heating', icon: '🔥' },
    { key: 'pool', label: t.amenities?.pool || 'Pool', icon: '🏊' },
    { key: 'playground', label: t.amenities?.playground || 'Playground', icon: '🎾' },
    { key: 'grooming', label: t.amenities?.grooming || 'Grooming', icon: '✂️' },
    { key: 'training', label: t.amenities?.training || 'Training', icon: '🎓' },
    { key: 'veterinary_on_site', label: t.amenities?.veterinaryOnSite || 'Veterinary On-Site', icon: '🏥' },
    { key: 'supervision_24h', label: t.amenities?.supervision24h || '24/7 Supervision', icon: '👁️' },
    { key: 'cameras', label: t.amenities?.cameras || 'Security Cameras', icon: '📹' },
    { key: 'individual_rooms', label: t.amenities?.individualRooms || 'Individual Rooms', icon: '🚪' },
    { key: 'group_play', label: t.amenities?.groupPlay || 'Group Play', icon: '🐕' },
    { key: 'special_diet', label: t.amenities?.specialDiet || 'Special Diet', icon: '🍖' }
  ];

  useEffect(() => {
    loadAmenities();
  }, [petMasterId]);

  const loadAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('hotel_amenities')
        .select('*')
        .eq('pet_master_id', petMasterId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setAmenities(data);
      }
    } catch (error) {
      console.error('Error loading amenities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setAmenities(prev => ({
      ...prev,
      [key]: !prev[key as keyof Amenities]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const amenitiesData = {
        pet_master_id: petMasterId,
        air_conditioning: amenities.air_conditioning,
        heating: amenities.heating,
        pool: amenities.pool,
        playground: amenities.playground,
        grooming: amenities.grooming,
        training: amenities.training,
        veterinary_on_site: amenities.veterinary_on_site,
        supervision_24h: amenities.supervision_24h,
        cameras: amenities.cameras,
        individual_rooms: amenities.individual_rooms,
        group_play: amenities.group_play,
        special_diet: amenities.special_diet
      };

      if (amenities.id) {
        const { error } = await supabase
          .from('hotel_amenities')
          .update(amenitiesData)
          .eq('id', amenities.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('hotel_amenities')
          .insert(amenitiesData);
        if (error) throw error;
      }

      showToast(t.success?.saved || 'Amenities saved successfully', 'success');
      loadAmenities();
    } catch (error) {
      console.error('Error saving amenities:', error);
      showToast(t.errors?.saveFailed || 'Failed to save amenities', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  const activeAmenities = amenityList.filter(item => amenities[item.key as keyof Amenities]);

  if (!editable && activeAmenities.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        border: '2px solid #FEF3C7',
        boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)'
      }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
          🏨 {t.amenities?.title || 'Amenidades del Hotel'}
        </h3>
        <p style={{ fontSize: '14px', color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
          {t.amenities?.noAmenities || 'No hay amenidades listadas'}
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '2px solid #FEF3C7',
      boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
          🏨 {t.amenities?.title || 'Amenidades del Hotel'}
        </h3>
        <p style={{ fontSize: '14px', color: '#64748b' }}>
          Servicios y facilidades que ofreces en tu hotel de mascotas
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: '12px'
      }}>
        {amenityList.map((item) => {
          const isActive = amenities[item.key as keyof Amenities];

          if (!editable && !isActive) return null;

          return (
            <label
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: isActive ? '#10b981' : '#e2e8f0',
                background: isActive ? '#F0FDF4' : '#ffffff',
                cursor: editable ? 'pointer' : 'default',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (editable && !isActive) {
                  e.currentTarget.style.borderColor = '#cbd5e1';
                  e.currentTarget.style.background = '#f8fafc';
                }
              }}
              onMouseLeave={(e) => {
                if (editable && !isActive) {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#ffffff';
                }
              }}
            >
              {editable && (
                <input
                  type="checkbox"
                  checked={Boolean(isActive)}
                  onChange={() => handleToggle(item.key)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#10b981'
                  }}
                />
              )}
              <span style={{ fontSize: '24px' }}>{item.icon}</span>
              <span style={{
                flex: 1,
                fontSize: '14px',
                fontWeight: isActive ? '600' : '500',
                color: isActive ? '#1e293b' : '#64748b'
              }}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>

      {editable && (
        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '2px solid #f1f5f9' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '14px',
              background: saving ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }
            }}
          >
            {saving
              ? '⏳ ' + (t.common?.saving || 'Guardando...')
              : '💾 ' + (t.common?.save || 'Guardar Cambios')}
          </button>
        </div>
      )}
    </div>
  );
}
