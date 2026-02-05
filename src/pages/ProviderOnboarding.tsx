import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import IdentityVerification from '../components/IdentityVerification';

type BusinessType = 'individual' | 'business';
type ServiceType = 'walker' | 'hotel' | 'vet';

interface ServiceData {
  service_type: ServiceType;
  hourly_rate?: number;
  price_per_night?: number;
  service_radius?: number;
  capacity?: number;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  specialties: string[];
  facilities: string[];
  emergency_service: boolean;
}

export default function ProviderOnboarding() {
  const { profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [businessType, setBusinessType] = useState<BusinessType>('individual');
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);

  const handleBusinessTypeChange = (type: BusinessType) => {
    setBusinessType(type);
    setSelectedServices([]);
  };
  const [servicesData, setServicesData] = useState<Record<ServiceType, Partial<ServiceData>>>({
    walker: {},
    hotel: {},
    vet: {},
  });

  const [businessData, setBusinessData] = useState({
    business_name: '',
    business_tax_id: '',
  });

  useEffect(() => {
    if (profile?.onboarding_completed) {
      navigate('/dashboard');
    }
  }, [profile, navigate]);

  const toggleService = (service: ServiceType) => {
    setSelectedServices([service]);
  };

  const getAvailableServices = (): ServiceType[] => {
    if (businessType === 'individual') {
      return ['walker'];
    }
    return ['hotel', 'vet'];
  };

  const updateServiceData = (service: ServiceType, data: Partial<ServiceData>) => {
    setServicesData((prev) => ({
      ...prev,
      [service]: { ...prev[service], ...data },
    }));
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocalización no disponible', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        selectedServices.forEach((service) => {
          updateServiceData(service, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        });
        showToast('Ubicación obtenida', 'success');
      },
      () => showToast('Error al obtener ubicación', 'error')
    );
  };

  const needsIdentityVerification = () => {
    return businessType === 'individual' && selectedServices.includes('walker');
  };

  const handleSaveAndContinue = async () => {
    if (selectedServices.length === 0) {
      showToast('Selecciona al menos un servicio', 'error');
      return;
    }

    setLoading(true);
    try {
      for (const serviceType of selectedServices) {
        const data = servicesData[serviceType];
        if (!data.address || !data.city) {
          showToast(`Completa la información de ${serviceType}`, 'error');
          setLoading(false);
          return;
        }

        const { error } = await supabase.from('provider_services').insert({
          provider_id: profile?.id,
          service_type: serviceType,
          ...data,
          is_active: false,
        });

        if (error) throw error;
      }

      if (businessType === 'business') {
        const { error: businessError } = await supabase.from('business_verifications').insert({
          provider_id: profile?.id,
          business_name: businessData.business_name,
          business_tax_id: businessData.business_tax_id,
        });

        if (businessError) throw businessError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          business_type: businessType,
        })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      const { error: masterError } = await supabase.from('pet_masters').upsert({
        id: profile?.id,
        service_type: selectedServices[0],
        address: servicesData[selectedServices[0]].address,
        latitude: servicesData[selectedServices[0]].latitude,
        longitude: servicesData[selectedServices[0]].longitude,
        city: servicesData[selectedServices[0]].city,
        country: servicesData[selectedServices[0]].country,
      });

      if (masterError) throw masterError;

      if (needsIdentityVerification()) {
        setStep(4);
      } else {
        await completeOnboarding();
      }
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
        })
        .eq('id', profile?.id);

      if (profileError) throw profileError;

      await refreshProfile();

      showToast('¡Configuración completada con éxito! Ahora configura tus servicios', 'success');
      navigate('/manage-offerings', { replace: true });
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al completar onboarding', 'error');
    }
  };

  const getServiceIcon = (service: ServiceType) => {
    switch (service) {
      case 'walker':
        return '🚶';
      case 'hotel':
        return '🏨';
      case 'vet':
        return '⚕️';
    }
  };

  const getServiceLabel = (service: ServiceType) => {
    switch (service) {
      case 'walker':
        return 'Paseador de Mascotas';
      case 'hotel':
        return 'Hotel para Mascotas';
      case 'vet':
        return 'Veterinaria';
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
          maxWidth: '800px',
          width: '100%',
          padding: '40px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            ¡Bienvenido a DoggyWalk! 👋
          </h1>
          <p style={{ color: '#64748b' }}>Configuremos tu perfil de proveedor</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
            {Array.from({ length: needsIdentityVerification() ? 4 : 3 }).map((_, index) => {
              const s = index + 1;
              return (
                <div
                  key={s}
                  style={{
                    width: s <= step ? '40px' : '12px',
                    height: '8px',
                    background: s <= step ? '#FF8C42' : '#e2e8f0',
                    borderRadius: '4px',
                    transition: 'all 0.3s',
                  }}
                />
              );
            })}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
              ¿Eres persona individual o empresa?
            </h2>
            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              <label
                style={{
                  padding: '24px',
                  border: `3px solid ${businessType === 'individual' ? '#FF8C42' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: businessType === 'individual' ? '#FFF8F3' : 'white',
                }}
              >
                <input
                  type="radio"
                  value="individual"
                  checked={businessType === 'individual'}
                  onChange={(e) => handleBusinessTypeChange(e.target.value as BusinessType)}
                  style={{ marginRight: '12px' }}
                />
                <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>👤</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>Persona Individual</span>
                <p style={{ marginLeft: '48px', marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                  Presto servicios por mi cuenta
                </p>
              </label>

              <label
                style={{
                  padding: '24px',
                  border: `3px solid ${businessType === 'business' ? '#FF8C42' : '#e2e8f0'}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: businessType === 'business' ? '#FFF8F3' : 'white',
                }}
              >
                <input
                  type="radio"
                  value="business"
                  checked={businessType === 'business'}
                  onChange={(e) => handleBusinessTypeChange(e.target.value as BusinessType)}
                  style={{ marginRight: '12px' }}
                />
                <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>🏢</span>
                <span style={{ fontWeight: '600', color: '#1e293b' }}>Empresa/Negocio</span>
                <p style={{ marginLeft: '48px', marginTop: '8px', color: '#64748b', fontSize: '14px' }}>
                  Tengo un hotel de mascotas o veterinaria registrada
                </p>
              </label>
            </div>

            {businessType === 'business' && (
              <div
                style={{
                  padding: '20px',
                  background: '#FFF8F3',
                  borderRadius: '12px',
                  border: '2px solid #FFE5B4',
                  marginBottom: '24px',
                }}
              >
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                  Información del Negocio
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Nombre del Negocio
                    </label>
                    <input
                      type="text"
                      value={businessData.business_name}
                      onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                      placeholder="Hotel Canino Paradise"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      RUT o NIT
                    </label>
                    <input
                      type="text"
                      value={businessData.business_tax_id}
                      onChange={(e) => setBusinessData({ ...businessData, business_tax_id: e.target.value })}
                      placeholder="123456789-0"
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#FF8C42',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Continuar →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
              {businessType === 'individual' ? 'Servicio de Paseador' : '¿Qué servicio ofrecerás?'}
            </h2>
            <p style={{ color: '#64748b', marginBottom: '24px' }}>
              {businessType === 'individual'
                ? 'Como persona individual, solo puedes ofrecer servicios de paseador de mascotas'
                : 'Selecciona un servicio para tu negocio'}
            </p>

            <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
              {getAvailableServices().map((service) => (
                <label
                  key={service}
                  style={{
                    padding: '24px',
                    border: `3px solid ${selectedServices.includes(service) ? '#FF8C42' : '#e2e8f0'}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: selectedServices.includes(service) ? '#FFF8F3' : 'white',
                  }}
                >
                  <input
                    type="radio"
                    checked={selectedServices.includes(service)}
                    onChange={() => toggleService(service)}
                    style={{ marginRight: '12px' }}
                  />
                  <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>{getServiceIcon(service)}</span>
                  <span style={{ fontWeight: '600', color: '#1e293b' }}>{getServiceLabel(service)}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ← Atrás
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedServices.length === 0}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: selectedServices.length === 0 ? '#cbd5e1' : '#FF8C42',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: selectedServices.length === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
              Configura tus servicios
            </h2>

            <div style={{ display: 'grid', gap: '24px', marginBottom: '24px' }}>
              {selectedServices.map((service) => (
                <div
                  key={service}
                  style={{
                    padding: '24px',
                    background: '#FFF8F3',
                    border: '2px solid #FFE5B4',
                    borderRadius: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
                    {getServiceIcon(service)} {getServiceLabel(service)}
                  </h3>

                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Dirección *
                      </label>
                      <input
                        type="text"
                        value={servicesData[service].address || ''}
                        onChange={(e) => updateServiceData(service, { address: e.target.value })}
                        placeholder="Calle 123 #45-67"
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '14px',
                        }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          value={servicesData[service].city || ''}
                          onChange={(e) => updateServiceData(service, { city: e.target.value })}
                          placeholder="Talcahuano"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                          País
                        </label>
                        <input
                          type="text"
                          value={servicesData[service].country || 'Colombia'}
                          onChange={(e) => updateServiceData(service, { country: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '14px',
                          }}
                        />
                      </div>
                    </div>

                    {service === 'walker' && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            Tarifa por Hora ($)
                          </label>
                          <input
                            type="number"
                            value={servicesData[service].hourly_rate || 15}
                            onChange={(e) => updateServiceData(service, { hourly_rate: Number(e.target.value) })}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            Radio de Servicio (metros)
                          </label>
                          <input
                            type="number"
                            value={servicesData[service].service_radius || 5000}
                            onChange={(e) => updateServiceData(service, { service_radius: Number(e.target.value) })}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                          />
                        </div>
                      </>
                    )}

                    {service === 'hotel' && (
                      <>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            Precio por Noche ($)
                          </label>
                          <input
                            type="number"
                            value={servicesData[service].price_per_night || 30}
                            onChange={(e) => updateServiceData(service, { price_per_night: Number(e.target.value) })}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                            Capacidad (mascotas)
                          </label>
                          <input
                            type="number"
                            value={servicesData[service].capacity || 10}
                            onChange={(e) => updateServiceData(service, { capacity: Number(e.target.value) })}
                            min="0"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '14px',
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleGetLocation}
              style={{
                width: '100%',
                padding: '12px',
                background: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                marginBottom: '16px',
              }}
            >
              📍 Obtener Mi Ubicación
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep(2)}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: '#e2e8f0',
                  color: '#334155',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                ← Atrás
              </button>
              <button
                onClick={handleSaveAndContinue}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: loading ? '#cbd5e1' : (needsIdentityVerification() ? '#3b82f6' : '#10b981'),
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Guardando...' : (needsIdentityVerification() ? 'Continuar →' : '✓ Completar')}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <IdentityVerification
              onComplete={async () => {
                showToast('Verificación enviada con éxito', 'success');
                await completeOnboarding();
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
