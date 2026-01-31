import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { PetMaster } from '../types';
import { ReviewsList } from '../components/ReviewsList';
import ServiceHours from '../components/ServiceHours';
import ServicePhotos from '../components/ServicePhotos';
import HotelAmenities from '../components/HotelAmenities';
import VetServices from '../components/VetServices';

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
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 16px' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
            ⚙️ {t.provider.profile}
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>
            {t.provider.completeProfile}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          border: '2px solid #E8F5E9',
          boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            📋 Información Básica
          </h3>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>🎯 {t.provider.serviceType}</label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value as PetMaster['service_type'] })}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <option value="walker">{t.provider.dogWalker}</option>
              <option value="hotel">{t.provider.petHotel}</option>
              <option value="vet">{t.provider.veterinarian}</option>
            </select>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>📝 {t.provider.bio}</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder={t.provider.bioPlaceholder}
              style={{ ...inputStyle, resize: 'vertical' }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#10b981';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            💰 Precios y Capacidad
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>💵 {t.provider.hourlyRateLabel}</label>
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
                <label style={labelStyle}>🌙 {t.provider.pricePerNight}</label>
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

          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            🗺️ Cobertura y Capacidad
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>📍 {t.provider.serviceRadius}</label>
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
              <label style={labelStyle}>👥 {t.provider.capacity}</label>
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

          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            ✨ Especialidades y Facilidades
          </h3>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>🎓 {t.provider.specialties}</label>
            <input
              type="text"
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              placeholder={t.provider.specialtiesPlaceholder}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={labelStyle}>🏢 {t.provider.facilities}</label>
            <input
              type="text"
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder={t.provider.facilitiesPlaceholder}
              style={inputStyle}
            />
          </div>

          <h3 style={{
            fontSize: '1.1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '24px',
            paddingBottom: '12px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            ⚙️ Configuración de Disponibilidad
          </h3>

          <div style={{
            marginBottom: '20px',
            padding: '16px',
            background: '#F0FDF4',
            borderRadius: '10px',
            border: '2px solid #BBF7D0'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={formData.is_available}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#10b981'
                }}
              />
              <div>
                <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', display: 'block' }}>
                  ✅ {t.provider.currentlyAvailable}
                </span>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Los clientes podrán reservar tus servicios
                </span>
              </div>
            </label>
          </div>

          {formData.service_type === 'vet' && (
            <div style={{
              marginBottom: '20px',
              padding: '16px',
              background: '#FEF2F2',
              borderRadius: '10px',
              border: '2px solid #FECACA'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={formData.emergency_service}
                  onChange={(e) => setFormData({ ...formData, emergency_service: e.target.checked })}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: '#EF4444'
                  }}
                />
                <div>
                  <span style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b', display: 'block' }}>
                    🚨 {t.provider.emergencyService}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Disponible para emergencias fuera del horario normal
                  </span>
                </div>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px', paddingTop: '24px', borderTop: '2px solid #f1f5f9' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }
              }}
            >
              {loading ? '⏳ ' + t.common.loading : '💾 ' + t.provider.saveProfile}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '14px 24px',
                background: 'white',
                color: '#64748b',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.borderColor = '#e2e8f0';
              }}
            >
              {t.common.cancel}
            </button>
          </div>
        </form>

        {profile?.id && (
          <>
            <div style={{ marginTop: '24px' }}>
              <ServicePhotos petMasterId={profile.id} editable={true} />
            </div>

            <div style={{ marginTop: '24px' }}>
              <ServiceHours petMasterId={profile.id} editable={true} />
            </div>

            {formData.service_type === 'hotel' && (
              <div style={{ marginTop: '24px' }}>
                <HotelAmenities petMasterId={profile.id} editable={true} />
              </div>
            )}

            {formData.service_type === 'vet' && (
              <div style={{ marginTop: '24px' }}>
                <VetServices petMasterId={profile.id} editable={true} />
              </div>
            )}

            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '16px',
              border: '2px solid #FEF3C7',
              boxShadow: '0 4px 12px rgba(251, 191, 36, 0.1)',
              marginTop: '24px'
            }}>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                  ⭐ Tus Reseñas
                </h2>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  Opiniones de clientes que han usado tus servicios
                </p>
              </div>
              <ReviewsList petMasterId={profile.id} />
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '10px',
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '2px solid #e2e8f0',
  borderRadius: '10px',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.2s',
  background: '#fff'
};
