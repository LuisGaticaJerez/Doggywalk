import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import BackButton from '../components/BackButton';
import ImageUpload from '../components/ImageUpload';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { requestNotificationPermission, savePushToken, checkNotificationStatus } from '../utils/pushNotifications';

export default function Settings() {
  const { profile, refreshProfile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: ''
  });
  const [pushNotificationStatus, setPushNotificationStatus] = useState<{
    supported: boolean;
    permission: NotificationPermission;
    hasToken: boolean;
  }>({ supported: false, permission: 'default', hasToken: false });
  const [enablingPush, setEnablingPush] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  useEffect(() => {
    checkNotificationStatus().then(status => {
      setPushNotificationStatus(status);
    });
  }, []);

  const handleEnablePushNotifications = async () => {
    setEnablingPush(true);
    try {
      const result = await requestNotificationPermission();

      if (result.granted && result.token) {
        const saved = await savePushToken(result.token);
        if (saved) {
          showToast('Push notifications enabled successfully', 'success');
          const status = await checkNotificationStatus();
          setPushNotificationStatus(status);
        } else {
          showToast('Failed to save notification token', 'error');
        }
      } else {
        showToast('Notification permission denied', 'error');
      }
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      showToast('Failed to enable push notifications', 'error');
    } finally {
      setEnablingPush(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id);

      if (error) throw error;

      await refreshProfile();
      showToast(t.settings.changesSaved, 'success');
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ marginBottom: '16px' }}>
          <BackButton color="#8B5CF6" />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          {t.settings.title}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          {t.settings.profile}
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.auth.email}</label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              style={{
                ...inputStyle,
                background: '#f8fafc',
                cursor: 'not-allowed'
              }}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              {t.settings.emailCannotChange}
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <LanguageSwitcher />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.auth.fullName}</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.settings.phoneLabel}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t.settings.phonePlaceholder}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>{t.settings.avatarUrl}</label>
            <ImageUpload
              currentImageUrl={formData.avatar_url}
              onUploadComplete={(url) => setFormData({ ...formData, avatar_url: url })}
              folder="avatars"
              maxSizeMB={3}
              disabled={loading}
            />
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
              Push Notifications
            </h3>
            {!pushNotificationStatus.supported ? (
              <p style={{ fontSize: '14px', color: '#64748b' }}>
                Your browser does not support push notifications
              </p>
            ) : pushNotificationStatus.hasToken ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#10b981'
                  }} />
                  <span style={{ fontSize: '14px', color: '#10b981', fontWeight: '500' }}>
                    Enabled
                  </span>
                </div>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  You will receive notifications for bookings, messages, and updates
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '12px' }}>
                  Enable push notifications to stay updated about your bookings and messages
                </p>
                <button
                  type="button"
                  onClick={handleEnablePushNotifications}
                  disabled={enablingPush}
                  style={{
                    padding: '10px 16px',
                    background: enablingPush ? '#94a3b8' : '#0ea5e9',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: enablingPush ? 'not-allowed' : 'pointer'
                  }}
                >
                  {enablingPush ? 'Enabling...' : 'Enable Notifications'}
                </button>
              </div>
            )}
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              <p style={{ marginBottom: '8px' }}>
                <strong>{t.auth.role}:</strong> {profile?.role === 'owner' ? t.auth.petOwner : t.auth.serviceProvider}
              </p>
              <p style={{ marginBottom: '8px' }}>
                <strong>{t.auth.memberSince}:</strong> {new Date(profile?.created_at || '').toLocaleDateString()}
              </p>
              <p>
                <strong>{t.auth.verificationStatus}:</strong>{' '}
                <span style={{
                  color: profile?.identity_verified ? '#10b981' : '#f59e0b',
                  fontWeight: '500'
                }}>
                  {profile?.identity_verified ? t.common.verified : t.common.notVerified}
                </span>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#94a3b8' : '#0ea5e9',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? `${t.common.loading}` : t.settings.saveChanges}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              {t.common.cancel}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  color: '#334155',
  fontSize: '14px',
  fontWeight: '500'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  fontSize: '14px',
  outline: 'none'
};
