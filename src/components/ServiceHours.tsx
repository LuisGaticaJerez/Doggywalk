import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';

interface ServiceHour {
  id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface ServiceHoursProps {
  petMasterId: string;
  editable?: boolean;
}

export default function ServiceHours({ petMasterId, editable = false }: ServiceHoursProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [hours, setHours] = useState<ServiceHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const daysOfWeek = [
    t.days?.sunday || 'Sunday',
    t.days?.monday || 'Monday',
    t.days?.tuesday || 'Tuesday',
    t.days?.wednesday || 'Wednesday',
    t.days?.thursday || 'Thursday',
    t.days?.friday || 'Friday',
    t.days?.saturday || 'Saturday'
  ];

  useEffect(() => {
    loadServiceHours();
  }, [petMasterId]);

  const loadServiceHours = async () => {
    try {
      const { data, error } = await supabase
        .from('service_hours')
        .select('*')
        .eq('pet_master_id', petMasterId)
        .order('day_of_week');

      if (error) throw error;

      if (data && data.length > 0) {
        setHours(data);
      } else {
        setHours(
          Array.from({ length: 7 }, (_, i) => ({
            id: `new-${i}`,
            day_of_week: i,
            open_time: '09:00',
            close_time: '18:00',
            is_closed: false
          }))
        );
      }
    } catch (error) {
      console.error('Error loading service hours:', error);
      showToast(t.errors?.loadFailed || 'Failed to load service hours', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChange = (dayIndex: number, field: 'open_time' | 'close_time', value: string) => {
    setHours(prev =>
      prev.map((h, i) =>
        i === dayIndex ? { ...h, [field]: value } : h
      )
    );
  };

  const handleClosedToggle = (dayIndex: number) => {
    setHours(prev =>
      prev.map((h, i) =>
        i === dayIndex ? { ...h, is_closed: !h.is_closed } : h
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const hour of hours) {
        if (hour.id.startsWith('new-')) {
          const { error } = await supabase
            .from('service_hours')
            .insert({
              pet_master_id: petMasterId,
              day_of_week: hour.day_of_week,
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed
            });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('service_hours')
            .update({
              open_time: hour.open_time,
              close_time: hour.close_time,
              is_closed: hour.is_closed
            })
            .eq('id', hour.id);
          if (error) throw error;
        }
      }

      showToast(t.success?.saved || 'Service hours saved successfully', 'success');
      loadServiceHours();
    } catch (error) {
      console.error('Error saving service hours:', error);
      showToast(t.errors?.saveFailed || 'Failed to save service hours', 'error');
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

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">
        {t.serviceHours?.title || 'Service Hours'}
      </h3>

      <div className="space-y-4">
        {hours.map((hour, index) => (
          <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
            <div className="w-32 font-medium text-gray-700">
              {daysOfWeek[hour.day_of_week]}
            </div>

            {editable ? (
              <>
                <input
                  type="checkbox"
                  checked={hour.is_closed}
                  onChange={() => handleClosedToggle(index)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">
                  {t.serviceHours?.closed || 'Closed'}
                </span>

                {!hour.is_closed && (
                  <>
                    <input
                      type="time"
                      value={hour.open_time}
                      onChange={(e) => handleTimeChange(index, 'open_time', e.target.value)}
                      className="border rounded px-3 py-1"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hour.close_time}
                      onChange={(e) => handleTimeChange(index, 'close_time', e.target.value)}
                      className="border rounded px-3 py-1"
                    />
                  </>
                )}
              </>
            ) : (
              <div className="text-gray-600">
                {hour.is_closed
                  ? (t.serviceHours?.closed || 'Closed')
                  : `${hour.open_time} - ${hour.close_time}`}
              </div>
            )}
          </div>
        ))}
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
