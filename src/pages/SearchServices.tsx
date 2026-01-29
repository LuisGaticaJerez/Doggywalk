import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { PetMaster } from '../types';

interface PetMasterWithProfile extends PetMaster {
  profiles?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export default function SearchServices() {
  const { t } = useI18n();
  const [providers, setProviders] = useState<PetMasterWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'all' | 'walker' | 'hotel' | 'vet'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadProviders();
  }, [serviceType]);

  const loadProviders = async () => {
    try {
      let query = supabase
        .from('pet_masters')
        .select(`
          *,
          profiles (
            full_name,
            avatar_url
          )
        `)
        .eq('is_available', true)
        .eq('verified', true)
        .order('rating', { ascending: false });

      if (serviceType !== 'all') {
        query = query.eq('service_type', serviceType);
      }

      const { data, error } = await query;

      if (error) throw error;
      if (data) setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(provider => {
    if (!searchTerm) return true;
    const name = provider.profiles?.full_name?.toLowerCase() || '';
    const bio = provider.bio?.toLowerCase() || '';
    const specialties = provider.specialties?.join(' ').toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return name.includes(search) || bio.includes(search) || specialties.includes(search);
  });

  return (
    <Layout>
      <div>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          {t.search.title}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          {t.home.subtitle}
        </p>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          marginBottom: '32px'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <input
              type="text"
              placeholder={`${t.common.search}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setServiceType('all')}
              style={{
                padding: '8px 20px',
                background: serviceType === 'all' ? '#0ea5e9' : 'white',
                color: serviceType === 'all' ? 'white' : '#64748b',
                border: `1px solid ${serviceType === 'all' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.provider.services}
            </button>
            <button
              onClick={() => setServiceType('walker')}
              style={{
                padding: '8px 20px',
                background: serviceType === 'walker' ? '#0ea5e9' : 'white',
                color: serviceType === 'walker' ? 'white' : '#64748b',
                border: `1px solid ${serviceType === 'walker' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.search.walker}
            </button>
            <button
              onClick={() => setServiceType('hotel')}
              style={{
                padding: '8px 20px',
                background: serviceType === 'hotel' ? '#0ea5e9' : 'white',
                color: serviceType === 'hotel' ? 'white' : '#64748b',
                border: `1px solid ${serviceType === 'hotel' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.search.boarding}
            </button>
            <button
              onClick={() => setServiceType('vet')}
              style={{
                padding: '8px 20px',
                background: serviceType === 'vet' ? '#0ea5e9' : 'white',
                color: serviceType === 'vet' ? 'white' : '#64748b',
                border: `1px solid ${serviceType === 'vet' ? '#0ea5e9' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              {t.search.veterinary}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e2e8f0',
              borderTopColor: '#0ea5e9',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
          </div>
        ) : filteredProviders.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.125rem', color: '#64748b' }}>
              {t.search.noResults}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '24px'
          }}>
            {filteredProviders.map(provider => (
              <div
                key={provider.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s'
                }}
              >
                <div style={{
                  height: '120px',
                  background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '3rem'
                }}>
                  {provider.service_type === 'walker' ? '🐕' : provider.service_type === 'hotel' ? '🏠' : '⚕️'}
                </div>

                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                        {provider.profiles?.full_name || 'Provider'}
                      </h3>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#f0f9ff',
                        color: '#0284c7',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {provider.service_type}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#0ea5e9' }}>
                        ⭐ {provider.rating.toFixed(1)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        {provider.total_walks} services
                      </div>
                    </div>
                  </div>

                  {provider.bio && (
                    <p style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '12px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {provider.bio}
                    </p>
                  )}

                  {provider.specialties && provider.specialties.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {provider.specialties.slice(0, 3).map((specialty, idx) => (
                          <span
                            key={idx}
                            style={{
                              padding: '4px 8px',
                              background: '#f1f5f9',
                              color: '#475569',
                              borderRadius: '4px',
                              fontSize: '12px'
                            }}
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{t.provider.hourlyRate}</div>
                      <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                        ${provider.hourly_rate}/hr
                      </div>
                    </div>
                    {provider.price_per_night && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '14px', color: '#64748b' }}>Per Night</div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b' }}>
                          ${provider.price_per_night}
                        </div>
                      </div>
                    )}
                  </div>

                  <Link
                    to={`/provider/${provider.id}/book`}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '12px',
                      background: '#0ea5e9',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}
                  >
                    {t.provider.bookNow}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
