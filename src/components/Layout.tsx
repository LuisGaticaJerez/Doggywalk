import { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <nav style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '16px 0'
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
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#0ea5e9',
            textDecoration: 'none'
          }}>
            DoggyWalk
          </Link>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            {profile?.role === 'owner' ? (
              <>
                <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
                <Link to="/pets" style={navLinkStyle}>My Pets</Link>
                <Link to="/search" style={navLinkStyle}>Find Services</Link>
                <Link to="/bookings" style={navLinkStyle}>Bookings</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" style={navLinkStyle}>Dashboard</Link>
                <Link to="/profile-setup" style={navLinkStyle}>Profile</Link>
                <Link to="/my-bookings" style={navLinkStyle}>Bookings</Link>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/settings" style={navLinkStyle}>
                {profile?.full_name}
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  padding: '8px 16px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
              >
                Sign Out
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
  color: '#475569',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'color 0.2s'
};
