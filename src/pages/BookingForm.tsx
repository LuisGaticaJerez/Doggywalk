import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Pet, PetMaster } from '../types';

interface PetMasterWithProfile extends PetMaster {
  profiles?: {
    full_name: string;
  };
}

export default function BookingForm() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<PetMasterWithProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [formData, setFormData] = useState({
    pet_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '60',
    pickup_address: '',
    pickup_latitude: '0',
    pickup_longitude: '0',
    special_instructions: ''
  });

  useEffect(() => {
    loadData();
  }, [providerId]);

  const loadData = async () => {
    try {
      const [providerRes, petsRes] = await Promise.all([
        supabase
          .from('pet_masters')
          .select(`
            *,
            profiles (
              full_name
            )
          `)
          .eq('id', providerId)
          .maybeSingle(),
        supabase
          .from('pets')
          .select('*')
          .eq('owner_id', profile?.id)
      ]);

      if (providerRes.data) setProvider(providerRes.data);
      if (petsRes.data) setPets(petsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pet_id) {
      alert('Please select a pet');
      return;
    }

    setLoading(true);

    try {
      const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;
      const totalAmount = provider ? (parseFloat(formData.duration_minutes) / 60) * provider.hourly_rate : 0;

      const { error } = await supabase
        .from('bookings')
        .insert({
          owner_id: profile?.id,
          pet_master_id: providerId,
          pet_id: formData.pet_id,
          scheduled_date: scheduledDateTime,
          duration_minutes: parseInt(formData.duration_minutes),
          pickup_address: formData.pickup_address,
          pickup_latitude: parseFloat(formData.pickup_latitude),
          pickup_longitude: parseFloat(formData.pickup_longitude),
          total_amount: totalAmount,
          special_instructions: formData.special_instructions || null,
          status: 'pending'
        });

      if (error) throw error;

      alert('Booking created successfully!');
      navigate('/bookings');
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  if (!provider) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#0ea5e9',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          Book Service
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          Book a service with {provider.profiles?.full_name}
        </p>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px' }}>
            Provider Details
          </h3>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <p><strong>Name:</strong> {provider.profiles?.full_name}</p>
            <p><strong>Service Type:</strong> {provider.service_type}</p>
            <p><strong>Hourly Rate:</strong> ${provider.hourly_rate}/hr</p>
            <p><strong>Rating:</strong> ⭐ {provider.rating.toFixed(1)}</p>
          </div>
        </div>

        {pets.length === 0 ? (
          <div style={{
            background: '#fef3c7',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#92400e', marginBottom: '12px' }}>
              You need to add a pet before making a booking
            </p>
            <button
              onClick={() => navigate('/pets/new')}
              style={{
                padding: '8px 16px',
                background: '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Add Pet
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: 'white',
            padding: '32px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Select Pet *</label>
              <select
                value={formData.pet_id}
                onChange={(e) => setFormData({ ...formData, pet_id: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="">Choose a pet</option>
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} ({pet.breed})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>Date *</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Time *</label>
                <input
                  type="time"
                  value={formData.scheduled_time}
                  onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Duration (minutes) *</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Pickup Address *</label>
              <input
                type="text"
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                required
                placeholder="123 Main St, City, State"
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>Special Instructions</label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                rows={4}
                placeholder="Any special instructions for the provider..."
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Duration:</span>
                <span style={{ fontWeight: '600' }}>{formData.duration_minutes} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>Rate:</span>
                <span style={{ fontWeight: '600' }}>${provider.hourly_rate}/hr</span>
              </div>
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>Total:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#0ea5e9' }}>
                    ${((parseFloat(formData.duration_minutes) / 60) * provider.hourly_rate).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

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
                {loading ? 'Creating Booking...' : 'Book Now'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/search')}
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
        )}
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
