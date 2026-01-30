import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { PetMaster } from '../types';

export default function ProviderProfile() {
  const { profile } = useAuth();
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

      alert('Profile updated successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Provider Profile
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          Complete your profile to start receiving bookings
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Service Type *</label>
            <select
              value={formData.service_type}
              onChange={(e) => setFormData({ ...formData, service_type: e.target.value as PetMaster['service_type'] })}
              required
              style={inputStyle}
            >
              <option value="walker">Dog Walker</option>
              <option value="hotel">Pet Hotel</option>
              <option value="vet">Veterinarian</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Tell pet owners about yourself and your services..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Hourly Rate ($) *</label>
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
                <label style={labelStyle}>Price per Night ($)</label>
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
              <label style={labelStyle}>Service Radius (meters) *</label>
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
              <label style={labelStyle}>Capacity *</label>
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
            <label style={labelStyle}>Specialties (comma separated)</label>
            <input
              type="text"
              value={formData.specialties}
              onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
              placeholder="e.g., Large dogs, Puppies, Senior care"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Facilities (comma separated)</label>
            <input
              type="text"
              value={formData.facilities}
              onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
              placeholder="e.g., Indoor play area, Outdoor yard, Pool"
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
                Currently Available
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
                  24/7 Emergency Service
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
              {loading ? 'Saving...' : 'Save Profile'}
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
              Cancel
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
