import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import IdentityVerification from '../components/IdentityVerification';
import LoadingFallback from '../components/LoadingFallback';
import BackButton from '../components/BackButton';

export default function IdentityVerificationPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [existingVerification, setExistingVerification] = useState<any>(null);

  useEffect(() => {
    loadVerification();
  }, [profile]);

  const loadVerification = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('identity_verifications')
        .select('*')
        .eq('provider_id', profile.id)
        .maybeSingle();

      if (error) throw error;
      setExistingVerification(data);
    } catch (error) {
      console.error('Error loading verification:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingFallback />;
  }

  if (existingVerification && existingVerification.status === 'approved') {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <BackButton
            label="Volver"
            color="#FF8C42"
            requireLogout={!profile?.onboarding_completed}
          />
        </div>

        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
        }}>
          <IdentityVerification
            onComplete={async () => {
              await loadVerification();
              navigate('/dashboard', { replace: true });
            }}
          />
        </div>
      </div>
    </div>
  );
}
