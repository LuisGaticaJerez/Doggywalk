import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Home() {
  const { user, loading } = useAuth();
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
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)'
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
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      color: 'white',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', fontWeight: 'bold', textAlign: 'center' }}>
        DoggyWalk
      </h1>
      <p style={{ fontSize: '1.5rem', opacity: 0.9, marginBottom: '3rem', textAlign: 'center' }}>
        Connect with trusted pet care providers
      </p>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/register"
          style={{
            padding: '16px 32px',
            background: 'white',
            color: '#0ea5e9',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          Get Started
        </Link>
        <Link
          to="/login"
          style={{
            padding: '16px 32px',
            background: 'transparent',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            border: '2px solid white'
          }}
        >
          Sign In
        </Link>
      </div>

      <div style={{ marginTop: '4rem', maxWidth: '800px', textAlign: 'center' }}>
        <p style={{ opacity: 0.9, fontSize: '1.125rem', lineHeight: '1.6' }}>
          Find professional dog walkers, pet hotels, and veterinary services. Book trusted care for your pets with ease.
        </p>
      </div>
    </div>
  )
}

export default Home
