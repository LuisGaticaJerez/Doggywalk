import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

function Home() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFA500 50%, #FFD93D 100%)'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid rgba(255,255,255,0.3)',
          borderTopColor: 'white',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

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
        fontSize: '1.5rem',
        opacity: 0.95,
        marginBottom: '3rem',
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        {t.home.title}
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/register?role=owner"
          style={{
            padding: '16px 32px',
            background: 'white',
            color: '#FF6B6B',
            textDecoration: 'none',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: '700',
            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.2)';
          }}
        >
          <span>🐕‍🦺</span> {t.home.findServices}
        </Link>
        <Link
          to="/login"
          style={{
            padding: '16px 32px',
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: '700',
            border: '3px solid white',
            boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }}
        >
          <span>👋</span> {t.auth.signIn}
        </Link>
      </div>

      <div style={{
        marginTop: '4rem',
        maxWidth: '800px',
        textAlign: 'center',
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(10px)',
        padding: '30px 40px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        <p style={{
          opacity: 0.95,
          fontSize: '1.125rem',
          lineHeight: '1.8',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          {t.home.subtitle}
        </p>
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
