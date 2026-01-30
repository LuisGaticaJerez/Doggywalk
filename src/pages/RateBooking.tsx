import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { ReviewForm } from '../components/ReviewForm';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';

export default function RateBooking() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<{
    id: string;
    pet_master_id: string;
    status: string;
    has_rating: boolean;
    owner_id: string;
    pet_masters?: {
      id: string;
      profiles?: {
        full_name: string;
        avatar_url: string | null;
      };
    };
  } | null>(null);

  useEffect(() => {
    loadBooking();
  }, [bookingId]);

  const loadBooking = async () => {
    if (!bookingId) {
      navigate('/bookings');
      return;
    }

    try {
      const { data: bookingData, error } = await supabase
        .from('bookings')
        .select('id, pet_master_id, status, owner_id, has_rating')
        .eq('id', bookingId)
        .maybeSingle();

      if (error) throw error;

      if (!bookingData) {
        showToast('Booking not found', 'error');
        navigate('/bookings');
        return;
      }

      if (bookingData.owner_id !== user?.id) {
        showToast('You do not have permission to rate this booking', 'error');
        navigate('/bookings');
        return;
      }

      if (bookingData.status !== 'completed') {
        showToast('You can only rate completed services', 'error');
        navigate('/bookings');
        return;
      }

      if (bookingData.has_rating) {
        showToast('You have already rated this service', 'info');
        navigate('/bookings');
        return;
      }

      const { data: petMasterData } = await supabase
        .from('pet_masters')
        .select(`
          id,
          profiles:id (
            full_name,
            avatar_url
          )
        `)
        .eq('id', bookingData.pet_master_id)
        .maybeSingle();

      const formattedPetMaster = petMasterData ? {
        id: petMasterData.id,
        profiles: Array.isArray(petMasterData.profiles) && petMasterData.profiles.length > 0
          ? petMasterData.profiles[0]
          : undefined
      } : undefined;

      setBooking({
        ...bookingData,
        pet_masters: formattedPetMaster
      });
    } catch (error) {
      console.error('Error loading booking:', error);
      showToast('Failed to load booking', 'error');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    showToast('Thank you for your review!', 'success');
    navigate('/bookings');
  };

  const handleCancel = () => {
    navigate('/bookings');
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #FFE5B4',
              borderTopColor: '#FF8C42',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b' }}>{t.common.loading}</p>
        </div>
      </Layout>
    );
  }

  if (!booking) return null;

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)',
            padding: '32px',
            borderRadius: '16px 16px 0 0',
            color: 'white',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '4rem', marginBottom: '12px' }}>⭐</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
            {t.bookings.rateService || 'Rate Your Experience'}
          </h1>
          <p style={{ opacity: 0.95, fontSize: '1.125rem' }}>
            How was your experience with{' '}
            {booking.pet_masters?.profiles?.full_name || 'your provider'}?
          </p>
        </div>

        <div
          style={{
            background: 'white',
            padding: '32px',
            borderRadius: '0 0 16px 16px',
            border: '1px solid #e2e8f0',
            borderTop: 'none',
          }}
        >
          {booking.pet_masters?.profiles?.avatar_url && (
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img
                src={booking.pet_masters.profiles.avatar_url}
                alt={booking.pet_masters.profiles.full_name}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid #F59E0B',
                }}
              />
            </div>
          )}

          <ReviewForm
            bookingId={booking.id}
            petMasterId={booking.pet_master_id}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '16px',
            background: '#EFF6FF',
            borderRadius: '12px',
            border: '1px solid #DBEAFE',
          }}
        >
          <p style={{ fontSize: '14px', color: '#1E40AF', margin: 0 }}>
            💡 Your honest feedback helps other pet owners make informed decisions
            and helps providers improve their service.
          </p>
        </div>
      </div>
    </Layout>
  );
}
