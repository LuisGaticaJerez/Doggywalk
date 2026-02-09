import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import { Pet, PetMaster } from '../types';
import { createRecurringSeries, RecurringSeries } from '../utils/recurringBookings';

interface PetMasterWithProfile extends PetMaster {
  profiles?: {
    full_name: string;
  };
}

export default function BookingForm() {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<PetMasterWithProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: '60',
    pickup_address: '',
    pickup_latitude: '0',
    pickup_longitude: '0',
    special_instructions: ''
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringOptions, setRecurringOptions] = useState({
    frequency: 'weekly' as 'daily' | 'weekly' | 'monthly',
    interval_count: 1,
    days_of_week: [] as number[],
    end_type: 'date' as 'date' | 'occurrences',
    end_date: '',
    max_occurrences: 10,
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

  const handlePetToggle = (petId: string) => {
    setSelectedPetIds(prev =>
      prev.includes(petId)
        ? prev.filter(id => id !== petId)
        : [...prev, petId]
    );
  };

  const calculateTotal = () => {
    if (!provider) return 0;
    const basePrice = (parseFloat(formData.duration_minutes) / 60) * provider.hourly_rate;
    const petCount = selectedPetIds.length;
    if (petCount <= 1) return basePrice;
    return basePrice + (basePrice * 0.5 * (petCount - 1));
  };

  const handleDayToggle = (day: number) => {
    setRecurringOptions(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day].sort()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedPetIds.length === 0) {
      showToast(t.bookings.selectPetRequired, 'error');
      return;
    }

    if (isRecurring && recurringOptions.frequency === 'weekly' && recurringOptions.days_of_week.length === 0) {
      showToast('Please select at least one day of the week', 'error');
      return;
    }

    setLoading(true);

    try {
      const totalAmount = calculateTotal();

      if (isRecurring) {
        const series: RecurringSeries = {
          owner_id: profile!.id,
          provider_id: providerId!,
          pet_ids: selectedPetIds,
          frequency: recurringOptions.frequency,
          interval_count: recurringOptions.interval_count,
          days_of_week: recurringOptions.frequency === 'weekly' ? recurringOptions.days_of_week : undefined,
          time_of_day: formData.scheduled_time,
          duration_minutes: parseInt(formData.duration_minutes),
          pickup_address: formData.pickup_address,
          pickup_latitude: parseFloat(formData.pickup_latitude),
          pickup_longitude: parseFloat(formData.pickup_longitude),
          special_instructions: formData.special_instructions,
          service_name: provider?.service_type || 'Service',
          total_amount: totalAmount,
          start_date: formData.scheduled_date,
          end_date: recurringOptions.end_type === 'date' ? recurringOptions.end_date : undefined,
          max_occurrences: recurringOptions.end_type === 'occurrences' ? recurringOptions.max_occurrences : undefined,
        };

        const result = await createRecurringSeries(series);

        if (!result.success) {
          throw new Error(result.error || 'Failed to create recurring series');
        }

        showToast('Recurring booking series created successfully!', 'success');
        navigate('/bookings');
      } else {
        const scheduledDateTime = `${formData.scheduled_date}T${formData.scheduled_time}:00`;

        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .insert({
            owner_id: profile?.id,
            pet_master_id: providerId,
            pet_id: selectedPetIds[0],
            pet_count: selectedPetIds.length,
            scheduled_date: scheduledDateTime,
            booking_date: scheduledDateTime,
            duration_minutes: parseInt(formData.duration_minutes),
            pickup_address: formData.pickup_address,
            pickup_latitude: parseFloat(formData.pickup_latitude),
            pickup_longitude: parseFloat(formData.pickup_longitude),
            total_amount: totalAmount,
            total_price: totalAmount,
            special_instructions: formData.special_instructions || null,
            status: 'pending',
            service_name: provider?.service_type || 'Service'
          })
          .select()
          .single();

        if (bookingError) throw bookingError;

        const bookingPets = selectedPetIds.map(petId => ({
          booking_id: booking.id,
          pet_id: petId
        }));

        const { error: petsError } = await supabase
          .from('booking_pets')
          .insert(bookingPets);

        if (petsError) throw petsError;

        showToast(t.bookings.bookingSuccess, 'success');
        navigate('/bookings');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showToast(error instanceof Error ? error.message : t.bookings.bookingError, 'error');
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
          {t.bookings.bookService}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          {t.bookings.bookService} {provider.profiles?.full_name}
        </p>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '12px' }}>
            {t.bookings.providerDetails}
          </h3>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            <p><strong>{t.common.name}:</strong> {provider.profiles?.full_name}</p>
            <p><strong>{t.bookings.serviceType}:</strong> {provider.service_type}</p>
            <p><strong>{t.bookings.hourlyRate}:</strong> ${provider.hourly_rate}/hr</p>
            <p><strong>{t.common.rating}:</strong> ⭐ {provider.rating.toFixed(1)}</p>
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
              {t.bookings.needPetFirst}
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
              {t.bookings.addPetFirst}
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
              <label style={labelStyle}>
                {t.bookings.selectPet}
                {selectedPetIds.length > 0 && (
                  <span style={{
                    marginLeft: '8px',
                    padding: '2px 8px',
                    background: '#E8F5E9',
                    color: '#2E7D32',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {selectedPetIds.length} selected
                  </span>
                )}
              </label>
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                maxHeight: '240px',
                overflowY: 'auto'
              }}>
                {pets.map(pet => (
                  <label
                    key={pet.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'background 0.2s',
                      background: selectedPetIds.includes(pet.id) ? '#E8F5E9' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedPetIds.includes(pet.id)) {
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedPetIds.includes(pet.id)) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPetIds.includes(pet.id)}
                      onChange={() => handlePetToggle(pet.id)}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginRight: '12px',
                        cursor: 'pointer',
                        accentColor: '#4CAF50'
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>
                        {pet.name}
                      </div>
                      <div style={{ fontSize: '13px', color: '#64748b' }}>
                        {pet.breed} • {pet.size} • {pet.age} years
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              {selectedPetIds.length > 1 && (
                <p style={{
                  marginTop: '8px',
                  fontSize: '13px',
                  color: '#4CAF50',
                  fontWeight: '500'
                }}>
                  Group walk: {selectedPetIds.length} pets (+50% per additional pet)
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>{t.common.date}</label>
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
                <label style={labelStyle}>{t.common.time}</label>
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
              <label style={labelStyle}>{t.bookings.durationMinutes}</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                required
                style={inputStyle}
              >
                <option value="30">{t.bookings.minutes30}</option>
                <option value="60">{t.bookings.hour1}</option>
                <option value="90">{t.bookings.hour1_5}</option>
                <option value="120">{t.bookings.hour2}</option>
                <option value="180">{t.bookings.hour3}</option>
              </select>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>{t.bookings.pickupAddress}</label>
              <input
                type="text"
                value={formData.pickup_address}
                onChange={(e) => setFormData({ ...formData, pickup_address: e.target.value })}
                required
                placeholder={t.bookings.addressPlaceholder}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>{t.bookings.specialInstructions}</label>
              <textarea
                value={formData.special_instructions}
                onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                rows={4}
                placeholder={t.bookings.instructionsPlaceholder}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            <div style={{
              background: '#f0f9ff',
              border: '2px solid #0ea5e9',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: isRecurring ? '20px' : '0'
              }}>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    marginRight: '12px',
                    cursor: 'pointer',
                    accentColor: '#0ea5e9'
                  }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                    Make this a recurring booking
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Automatically schedule multiple bookings on a regular basis
                  </div>
                </div>
              </label>

              {isRecurring && (
                <div style={{ borderTop: '1px solid #bae6fd', paddingTop: '20px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Frequency</label>
                    <select
                      value={recurringOptions.frequency}
                      onChange={(e) => setRecurringOptions({ ...recurringOptions, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
                      style={inputStyle}
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {recurringOptions.frequency === 'weekly' && (
                    <div style={{ marginBottom: '16px' }}>
                      <label style={labelStyle}>Days of the week</label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <button
                            key={day}
                            type="button"
                            onClick={() => handleDayToggle(index)}
                            style={{
                              padding: '8px 12px',
                              background: recurringOptions.days_of_week.includes(index) ? '#0ea5e9' : 'white',
                              color: recurringOptions.days_of_week.includes(index) ? 'white' : '#64748b',
                              border: `2px solid ${recurringOptions.days_of_week.includes(index) ? '#0ea5e9' : '#e2e8f0'}`,
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ marginBottom: '16px' }}>
                    <label style={labelStyle}>Ends</label>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={recurringOptions.end_type === 'date'}
                          onChange={() => setRecurringOptions({ ...recurringOptions, end_type: 'date' })}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px' }}>On date</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          checked={recurringOptions.end_type === 'occurrences'}
                          onChange={() => setRecurringOptions({ ...recurringOptions, end_type: 'occurrences' })}
                          style={{ marginRight: '8px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '14px' }}>After number of times</span>
                      </label>
                    </div>

                    {recurringOptions.end_type === 'date' ? (
                      <input
                        type="date"
                        value={recurringOptions.end_date}
                        onChange={(e) => setRecurringOptions({ ...recurringOptions, end_date: e.target.value })}
                        min={formData.scheduled_date || new Date().toISOString().split('T')[0]}
                        style={inputStyle}
                      />
                    ) : (
                      <input
                        type="number"
                        value={recurringOptions.max_occurrences}
                        onChange={(e) => setRecurringOptions({ ...recurringOptions, max_occurrences: parseInt(e.target.value) || 1 })}
                        min="1"
                        max="100"
                        placeholder="Number of occurrences"
                        style={inputStyle}
                      />
                    )}
                  </div>

                  <div style={{
                    background: 'rgba(14, 165, 233, 0.1)',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#0369a1'
                  }}>
                    <strong>Note:</strong> Up to 10 future bookings will be created initially. As bookings are completed, new ones will be generated automatically.
                  </div>
                </div>
              )}
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>{t.common.duration}:</span>
                <span style={{ fontWeight: '600' }}>{formData.duration_minutes} minutes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#64748b' }}>{t.bookings.rate}:</span>
                <span style={{ fontWeight: '600' }}>${provider.hourly_rate}/hr</span>
              </div>
              {selectedPetIds.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Pets:</span>
                  <span style={{ fontWeight: '600' }}>
                    {selectedPetIds.length} {selectedPetIds.length === 1 ? 'pet' : 'pets'}
                  </span>
                </div>
              )}
              {selectedPetIds.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Multi-pet discount:</span>
                  <span style={{ fontWeight: '600', fontSize: '13px', color: '#4CAF50' }}>
                    Base + 50% × {selectedPetIds.length - 1}
                  </span>
                </div>
              )}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: '600', fontSize: '1.125rem' }}>{t.common.total}:</span>
                  <span style={{ fontWeight: 'bold', fontSize: '1.125rem', color: '#0ea5e9' }}>
                    ${calculateTotal().toFixed(2)}
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
                {loading ? t.bookings.creatingBooking : t.bookings.bookNow}
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
                {t.common.cancel}
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
