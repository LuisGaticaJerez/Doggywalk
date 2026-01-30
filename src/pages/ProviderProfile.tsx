import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { PetMaster } from '../types';

export default function ProviderProfile() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    service_type: 'walker' as 'walker' | 'hotel' | 'vet',
    hourly_rate: '15',
    price_per_night: '',
    service_radius: '5000',
    capacity: '0',
    is_available: true,
    emergency_service: false,
    specialties: '',
    facilities: ''
  });

  useEffect(() => {
    loadPetMaster();
  }, []);

  const loadPetMaster = async () => {
    try {
      const { data, error } = await supabase
        .from('pet_masters')
        .select('*')
        .eq('id', profile?.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          bio: data.bio || '',
          service_type: data.service_type,
          hourly_rate: data.hourly_rate.toString(),
          price_per_night: data.price_per_night?.toString() || '',
          service_radius: data.service_radius.toString(),
          capacity: data.capacity.toString(),
          is_available: data.is_available,
          emergency_service: data.emergency_service,
          specialties: data.specialties?.join(', ') || '',
          facilities: data.facilities?.join(', ') || ''
        });
      }
    } catch (error) {
      console.error('Error loading pet master:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        bio: formData.bio || null,
        service_type: formData.service_type,
        hourly_rate: parseFloat(formData.hourly_rate),
        service_radius: parseInt(formData.service_radius),
        capacity: parseInt(formData.capacity),
        is_available: formData.is_available,
        emergency_service: formData.emergency_service,
        specialties: formData.specialties ? formData.specialties.split(',').map(s => s.trim()) : [],
        facilities: formData.facilities ? formData.facilities.split(',').map(s => s.trim()) : []
      };

      if (formData.price_per_night) {
        updateData.price_per_night = parseFloat(formData.price_per_night);
      }

      const { error } = await supabase
        .from('pet_masters')
        .update(updateData)
        .eq('id', profile?.id);

      if (error) throw error;

      showToast('Profile updated successfully!', 'success');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          {t.provider.profile}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          {t.provider.completeProfile}
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.provider.serviceType}</label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value as PetMaster['service_type'] })}
              required
              style={inputStyle}
            >
              <option value="walker">{t.provider.dogWalker}</option>
              <option value="hotel">{t.provider.petHotel}</option>
              <option value="vet">{t.provider.veterinarian}</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.provider.bio}</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder={t.provider.bioPlaceholder}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>{t.provider.hourlyRateLabel}</label>
              <input
                type="number"
                value={formData.hourly_rate}
                onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                required
                min="0"
                step="0.01"
                style={inputStyle}
              />
            </div>

            {formData.service_type === 'hotel' && (
              <div>
                <label style={labelStyle}>{t.provider.pricePerNight}</label>
                <input
                  type="number"
                  value={formData.price_per_night}
                  onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  min="0"
                  step="0.01"
                  style={inputStyle}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>{t.provider.serviceRadius}</label>
              <input
                type="number"
                value={formData.service_radius}
                onChange={(e) => setFormData({ ...formData, service_radius: e.target.value })}
                required
                min="0"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>{t.provider.capacity}</label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                required
                min="0"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.provider.specialties}</label>
            <input
              type="text"
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              placeholder={t.provider.specialtiesPlaceholder}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.provider.facilities}</label>
            <input
              type="text"
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder={t.provider.facilitiesPlaceholder}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                {t.provider.currentlyAvailable}
              </span>
            </label>
          </div>

          {formData.service_type === 'vet' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.emergency_service}
                  onChange={(e) => setFormData({ ...formData, emergency_service: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                  {t.provider.emergencyService}
                </span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#94a3b8' : '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? t.common.loading : t.provider.saveProfile}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  color: '#334155',
  fontSize: '14px',
  fontWeight: '500'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none'
};
