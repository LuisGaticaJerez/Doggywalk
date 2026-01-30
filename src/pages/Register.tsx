import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'owner' | 'pet_master'>('owner');
  const [accountType, setAccountType] = useState<'individual' | 'company'>('individual');
  const [roleFromUrl, setRoleFromUrl] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'owner') {
      setRole('owner');
      setRoleFromUrl(true);
    } else if (roleParam === 'master') {
      setRole('pet_master');
      setRoleFromUrl(true);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (password.length < 6) {
      showToast(t.auth.passwordMinLength, 'error');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password, fullName, role, accountType);

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
        maxWidth: '400px',
        position: 'relative'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '24px',
            color: '#64748b',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#1e293b';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#64748b';
          }}
          aria-label="Volver"
        >
          ←
        </button>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          marginBottom: '8px',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          {t.auth.register}
        </h1>
        <p style={{
          color: '#64748b',
          marginBottom: '32px',
          textAlign: 'center'
        }}>
          {t.auth.signUp}
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
              {t.auth.fullName}
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
              {t.auth.email}
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
              {t.auth.password}
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
            {roleFromUrl && role === 'owner' ? (
              <div style={{
                padding: '16px',
                background: '#EEF2FF',
                borderRadius: '8px',
                border: '2px solid #818CF8'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🐕‍🦺</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#4338CA' }}>
                    {t.home.becomePetOwner}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6366F1', margin: 0 }}>
                  Te estás registrando como dueño de mascota para buscar y contratar servicios de paseadores, hoteles y veterinarias.
                </p>
              </div>
            ) : roleFromUrl && role === 'pet_master' ? (
              <div style={{
                padding: '16px',
                background: '#FFF7ED',
                borderRadius: '8px',
                border: '2px solid #FB923C'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.5rem' }}>⭐</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: '#C2410C' }}>
                    {t.home.becomeProvider}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#EA580C', margin: 0 }}>
                  Te estás registrando como proveedor de servicios para ofrecer cuidado de mascotas.
                </p>
              </div>
            ) : (
              <>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {t.auth.iAmA}
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
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{t.auth.petOwner}</span>
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
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>{t.auth.provider}</span>
                  </label>
                </div>
              </>
            )}
          </div>

          {role === 'pet_master' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#334155',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                {t.auth.providerType}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  border: `2px solid ${accountType === 'individual' ? '#FB923C' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: accountType === 'individual' ? '#FFF7ED' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      value="individual"
                      checked={accountType === 'individual'}
                      onChange={(e) => setAccountType(e.target.value as 'individual')}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>🚶 {t.auth.walker}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b', paddingLeft: '28px' }}>
                    Registro individual para paseadores de mascotas
                  </span>
                </label>
                <label style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '16px',
                  border: `2px solid ${accountType === 'company' ? '#FB923C' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: accountType === 'company' ? '#FFF7ED' : 'white',
                  transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      type="radio"
                      value="company"
                      checked={accountType === 'company'}
                      onChange={(e) => setAccountType(e.target.value as 'company')}
                      style={{ marginRight: '12px' }}
                    />
                    <span style={{ fontSize: '16px', fontWeight: '600' }}>🏨 {t.auth.hotelOrVet}</span>
                  </div>
                  <span style={{ fontSize: '13px', color: '#64748b', paddingLeft: '28px' }}>
                    Registro empresarial para hoteles de mascotas o veterinarias
                  </span>
                </label>
              </div>
            </div>
          )}

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
            {loading ? `${t.common.loading}` : t.auth.register}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '14px',
          color: '#64748b'
        }}>
          {t.auth.alreadyHaveAccount}{' '}
          <Link to="/login" style={{ color: '#0ea5e9', textDecoration: 'none', fontWeight: '600' }}>
            {t.auth.signIn}
          </Link>
        </div>
      </div>
    </div>
  );
}
