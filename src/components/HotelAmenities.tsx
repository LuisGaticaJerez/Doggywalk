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
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const activeAmenities = amenityList.filter(item => amenities[item.key as keyof Amenities]);

  if (!editable && activeAmenities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">
          {t.amenities?.title || 'Hotel Amenities'}
        </h3>
        <p className="text-gray-500 text-center py-4">
          {t.amenities?.noAmenities || 'No amenities listed'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">
        {t.amenities?.title || 'Hotel Amenities'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {amenityList.map((item) => {
          const isActive = amenities[item.key as keyof Amenities];

          if (!editable && !isActive) return null;

          return (
            <label
              key={item.key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!editable ? 'cursor-default' : ''}`}
            >
              {editable && (
                <input
                  type="checkbox"
                  checked={Boolean(isActive)}
                  onChange={() => handleToggle(item.key)}
                  className="h-5 w-5 text-blue-600 rounded"
                />
              )}
              <span className="text-2xl">{item.icon}</span>
              <span className={`flex-1 ${isActive ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </label>
          );
        })}
      </div>

      {editable && (
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving
              ? (t.common?.saving || 'Saving...')
              : (t.common?.save || 'Save Changes')}
          </button>
        </div>
      )}
    </div>
  );
}
