import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #FFF9E6 0%, #f8fafc 100%)' }}>
      <nav style={{
        background: 'white',
        borderBottom: '3px solid #FFD93D',
        padding: '16px 0',
        boxShadow: '0 2px 8px rgba(255, 140, 66, 0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Link to="/dashboard" style={{
            fontSize: '1.75rem',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>🐾</span> DoggyWalk
          </Link>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {profile?.role === 'owner' ? (
              <>
                <Link to="/dashboard" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>🏠</span> {t.nav.dashboard}
                </Link>
                <Link to="/pets" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>🐕</span> {t.nav.pets}
                </Link>
                <Link to="/search" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>🔍</span> {t.nav.search}
                </Link>
                <Link to="/bookings" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>📅</span> {t.nav.bookings}
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>🏠</span> {t.nav.dashboard}
                </Link>
                <Link to="/profile-setup" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>👤</span> {t.settings.profile}
                </Link>
                <Link to="/my-bookings" style={{...navLinkStyle, display: 'flex', alignItems: 'center', gap: '6px'}}>
                  <span>📅</span> {t.nav.bookings}
                </Link>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '12px' }}>
              <Link to="/settings" style={{
                ...navLinkStyle,
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #FFE5B4 0%, #FFD93D 100%)',
                borderRadius: '25px',
                fontWeight: '600',
                color: '#8B6914',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span>⚙️</span> {profile?.full_name}
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF5252 0%, #E53935 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)';
                }}
              >
                <span>👋</span> {t.auth.logout}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '32px 20px'
      }}>
        {children}
      </main>
    </div>
  );
}

const navLinkStyle: React.CSSProperties = {
  color: '#334155',
  textDecoration: 'none',
  fontSize: '15px',
  fontWeight: '600',
  padding: '8px 16px',
  borderRadius: '25px',
  transition: 'all 0.2s'
};
