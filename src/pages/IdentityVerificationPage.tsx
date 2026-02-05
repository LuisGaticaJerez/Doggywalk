import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import IdentityVerification from '../components/IdentityVerification';
import LoadingFallback from '../components/LoadingFallback';

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
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            marginBottom: '20px',
            padding: '10px 20px',
            background: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            color: '#FF8C42',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          ← Volver al Dashboard
        </button>

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
