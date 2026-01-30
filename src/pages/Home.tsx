import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

function Home() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<'walker' | 'hotel' | 'vet'>('walker');
  const [address, setAddress] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    params.append('service', serviceType);
    if (useCurrentLocation) {
      params.append('useLocation', 'true');
    } else if (address) {
      params.append('address', address);
    }
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FF6B6B 0%, #FFA500 50%, #FFD93D 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        fontSize: '4rem',
        opacity: 0.2,
        animation: 'float 3s ease-in-out infinite'
      }}>🐶</div>
      <div style={{
        position: 'absolute',
        top: '20%',
        right: '15%',
        fontSize: '3rem',
        opacity: 0.2,
        animation: 'float 4s ease-in-out infinite'
      }}>🐱</div>
      <div style={{
        position: 'absolute',
        bottom: '15%',
        left: '20%',
        fontSize: '3.5rem',
        opacity: 0.2,
        animation: 'float 3.5s ease-in-out infinite'
      }}>🐾</div>
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '10%',
        fontSize: '3rem',
        opacity: 0.2,
        animation: 'float 4.5s ease-in-out infinite'
      }}>🦴</div>

      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px', alignItems: 'center', zIndex: 10 }}>
        <LanguageSwitcher />
        <Link
          to="/login"
          style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontSize: '16px',
            fontWeight: '600',
            border: '2px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {t.auth.signIn}
        </Link>
        <Link
          to="/register"
          style={{
            padding: '12px 24px',
            background: 'white',
            color: '#FF6B6B',
            textDecoration: 'none',
            borderRadius: '50px',
            fontSize: '16px',
            fontWeight: '700',
            border: '2px solid white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
          }}
        >
          {t.auth.register}
        </Link>
      </div>

      <div style={{
        fontSize: '5rem',
        marginBottom: '0.5rem',
        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
      }}>🐕</div>

      <h1 style={{
        fontSize: '3rem',
        marginBottom: '0.5rem',
        fontWeight: 'bold',
        textAlign: 'center',
        textShadow: '0 2px 8px rgba(0,0,0,0.2)'
      }}>
        🐾 DoggyWalk
      </h1>
      <p style={{
        fontSize: '1.25rem',
        opacity: 0.95,
        marginBottom: '2rem',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        {t.home.subtitle}
      </p>

      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
        maxWidth: '600px',
        width: '100%',
        marginBottom: '2rem'
      }}>
        <h2 style={{ color: '#334155', marginBottom: '24px', fontSize: '1.5rem', fontWeight: '700' }}>
          {t.home.searchServices}
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#475569', fontSize: '14px', fontWeight: '600' }}>
            {t.search.serviceType}
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['walker', 'hotel', 'vet'].map((type) => (
              <button
                key={type}
                onClick={() => setServiceType(type as any)}
                style={{
                  flex: 1,
                  minWidth: '150px',
                  padding: '12px 20px',
                  border: serviceType === type ? '2px solid #FF6B6B' : '2px solid #e2e8f0',
                  borderRadius: '8px',
                  background: serviceType === type ? '#FEF2F2' : 'white',
                  color: serviceType === type ? '#FF6B6B' : '#64748B',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (serviceType !== type) {
                    e.currentTarget.style.borderColor = '#CBD5E1';
                    e.currentTarget.style.background = '#F8FAFC';
                  }
                }}
                onMouseLeave={(e) => {
                  if (serviceType !== type) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                {type === 'walker' ? '🚶 ' + t.search.walker : type === 'hotel' ? '🏨 ' + t.search.boarding : '🏥 ' + t.search.veterinary}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={useCurrentLocation}
              onChange={(e) => {
                setUseCurrentLocation(e.target.checked);
                if (e.target.checked) setAddress('');
              }}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ color: '#475569', fontSize: '14px', fontWeight: '600' }}>
              {t.home.useMyLocation}
            </span>
          </label>

          {!useCurrentLocation && (
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.home.addressPlaceholder}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#FF6B6B'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          )}
        </div>

        <button
          onClick={handleSearch}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFA500 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 107, 107, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 107, 107, 0.3)';
          }}
        >
          {t.common.search} 🔍
        </button>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}

export default Home
