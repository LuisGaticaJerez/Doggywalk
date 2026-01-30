import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';

interface VetServicesData {
  id?: string;
  consultations: boolean;
  vaccinations: boolean;
  surgery: boolean;
  laboratory: boolean;
  radiology: boolean;
  ultrasound: boolean;
  dentistry: boolean;
  grooming: boolean;
  hospitalization: boolean;
  emergency: boolean;
  home_visits: boolean;
  microchipping: boolean;
}

interface VetServicesProps {
  petMasterId: string;
  editable?: boolean;
}

export default function VetServices({ petMasterId, editable = false }: VetServicesProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [services, setServices] = useState<VetServicesData>({
    consultations: false,
    vaccinations: false,
    surgery: false,
    laboratory: false,
    radiology: false,
    ultrasound: false,
    dentistry: false,
    grooming: false,
    hospitalization: false,
    emergency: false,
    home_visits: false,
    microchipping: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const serviceList = [
    { key: 'consultations', label: t.vetServices?.consultations || 'Consultations', icon: '🩺' },
    { key: 'vaccinations', label: t.vetServices?.vaccinations || 'Vaccinations', icon: '💉' },
    { key: 'surgery', label: t.vetServices?.surgery || 'Surgery', icon: '⚕️' },
    { key: 'laboratory', label: t.vetServices?.laboratory || 'Laboratory', icon: '🔬' },
    { key: 'radiology', label: t.vetServices?.radiology || 'Radiology', icon: '📡' },
    { key: 'ultrasound', label: t.vetServices?.ultrasound || 'Ultrasound', icon: '🔊' },
    { key: 'dentistry', label: t.vetServices?.dentistry || 'Dentistry', icon: '🦷' },
    { key: 'grooming', label: t.vetServices?.grooming || 'Grooming', icon: '✂️' },
    { key: 'hospitalization', label: t.vetServices?.hospitalization || 'Hospitalization', icon: '🏥' },
    { key: 'emergency', label: t.vetServices?.emergency || 'Emergency 24/7', icon: '🚨' },
    { key: 'home_visits', label: t.vetServices?.homeVisits || 'Home Visits', icon: '🏠' },
    { key: 'microchipping', label: t.vetServices?.microchipping || 'Microchipping', icon: '🔖' }
  ];

  useEffect(() => {
    loadServices();
  }, [petMasterId]);

  const loadServices = async () => {
    try {
      const { data, error } = await supabase
        .from('vet_services')
        .select('*')
        .eq('pet_master_id', petMasterId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setServices(data);
      }
    } catch (error) {
      console.error('Error loading vet services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: string) => {
    setServices(prev => ({
      ...prev,
      [key]: !prev[key as keyof VetServicesData]
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const servicesData = {
        pet_master_id: petMasterId,
        consultations: services.consultations,
        vaccinations: services.vaccinations,
        surgery: services.surgery,
        laboratory: services.laboratory,
        radiology: services.radiology,
        ultrasound: services.ultrasound,
        dentistry: services.dentistry,
        grooming: services.grooming,
        hospitalization: services.hospitalization,
        emergency: services.emergency,
        home_visits: services.home_visits,
        microchipping: services.microchipping
      };

      if (services.id) {
        const { error } = await supabase
          .from('vet_services')
          .update(servicesData)
          .eq('id', services.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vet_services')
          .insert(servicesData);
        if (error) throw error;
      }

      showToast(t.success?.saved || 'Services saved successfully', 'success');
      loadServices();
    } catch (error) {
      console.error('Error saving vet services:', error);
      showToast(t.errors?.saveFailed || 'Failed to save services', 'error');
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

  const activeServices = serviceList.filter(item => services[item.key as keyof VetServicesData]);

  if (!editable && activeServices.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">
          {t.vetServices?.title || 'Veterinary Services'}
        </h3>
        <p className="text-gray-500 text-center py-4">
          {t.vetServices?.noServices || 'No services listed'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">
        {t.vetServices?.title || 'Veterinary Services'}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {serviceList.map((item) => {
          const isActive = services[item.key as keyof VetServicesData];

          if (!editable && !isActive) return null;

          return (
            <label
              key={item.key}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${!editable ? 'cursor-default' : ''}`}
            >
              {editable && (
                <input
                  type="checkbox"
                  checked={Boolean(isActive)}
                  onChange={() => handleToggle(item.key)}
                  className="h-5 w-5 text-green-600 rounded"
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
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
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
