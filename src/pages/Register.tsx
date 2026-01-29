import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'owner' | 'pet_master'>('owner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, role);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          Create Account
        </h1>
        <p style={{
          color: '#64748b',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          Join DoggyWalk today
        </p>

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              I am a
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                border: `2px solid ${role === 'owner' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: role === 'owner' ? '#f0f9ff' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  value="owner"
                  checked={role === 'owner'}
                  onChange={(e) => setRole(e.target.value as 'owner')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Pet Owner</span>
              </label>
              <label style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                border: `2px solid ${role === 'pet_master' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: role === 'pet_master' ? '#f0f9ff' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  value="pet_master"
                  checked={role === 'pet_master'}
                  onChange={(e) => setRole(e.target.value as 'pet_master')}
                  style={{ marginRight: '8px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Provider</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#94a3b8' : '#0ea5e9',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => !loading && (e.currentTarget.style.background = '#0284c7')}
            onMouseLeave={(e) => !loading && (e.currentTarget.style.background = '#0ea5e9')}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#64748b'
        }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
