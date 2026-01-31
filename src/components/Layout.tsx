import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { NotificationBell } from './NotificationBell';
import LanguageSwitcher from './LanguageSwitcher';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/', { replace: true });
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
          <Link to={user ? "/dashboard" : "/"} style={{
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

          {!user ? (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '10px 20px',
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#e2e8f0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#f1f5f9'}
              >
                ← {t.common.back}
              </button>

              <LanguageSwitcher />

              <Link
                to="/login"
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  color: '#FF8C42',
                  border: '2px solid #FF8C42',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#FFF7ED';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                {t.auth.login}
              </Link>

              <Link
                to="/register"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)',
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 140, 66, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 66, 0.3)';
                }}
              >
                {t.auth.register}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <LanguageSwitcher />
                <NotificationBell />
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #FFE5B4 0%, #FFD93D 100%)',
                    color: '#8B6914',
                    border: 'none',
                    borderRadius: '25px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(255, 221, 61, 0.3)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>⚙️</span>
                  <span>{profile?.full_name || 'Menu'}</span>
                  <span style={{ fontSize: '12px' }}>{menuOpen ? '▲' : '▼'}</span>
                </button>

              {menuOpen && (
                <>
                  <div
                    onClick={() => setMenuOpen(false)}
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 998
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    border: '2px solid #FFE5B4',
                    minWidth: '240px',
                    padding: '12px',
                    zIndex: 999
                  }}>
                    {profile?.role === 'owner' ? (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>🏠</span> {t.nav.dashboard}
                        </Link>
                        <Link
                          to="/pets"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>🐕</span> {t.nav.pets}
                        </Link>
                        <Link
                          to="/search"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>🔍</span> {t.nav.search}
                        </Link>
                        <Link
                          to="/bookings"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>📅</span> {t.nav.bookings}
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>🏠</span> {t.nav.dashboard}
                        </Link>
                        <Link
                          to="/manage-offerings"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>📋</span> Mis Servicios
                        </Link>
                        <Link
                          to="/profile-setup"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>👤</span> {t.settings.profile}
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setMenuOpen(false)}
                          style={{
                            ...menuItemStyle,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                        >
                          <span>📅</span> {t.nav.bookings}
                        </Link>
                      </>
                    )}

                    <div style={{
                      height: '1px',
                      background: '#FFE5B4',
                      margin: '8px 0'
                    }} />

                    <Link
                      to="/settings"
                      onClick={() => setMenuOpen(false)}
                      style={{
                        ...menuItemStyle,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}
                    >
                      <span>⚙️</span> {t.nav.settings}
                    </Link>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      style={{
                        ...menuItemStyle,
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                        color: 'white',
                        border: 'none',
                        marginTop: '8px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        justifyContent: 'center'
                      }}
                    >
                      <span>👋</span> {t.auth.logout}
                    </button>
                  </div>
                </>
              )}
              </div>
            </div>
          )}
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

const menuItemStyle: React.CSSProperties = {
  width: '100%',
  textDecoration: 'none',
  color: '#334155',
  padding: '12px 16px',
  borderRadius: '12px',
  fontSize: '15px',
  fontWeight: '500',
  transition: 'all 0.2s',
  cursor: 'pointer'
};
