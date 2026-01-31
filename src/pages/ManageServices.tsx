import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';
import ImageUpload from '../components/ImageUpload';

type ServiceType = 'walker' | 'hotel' | 'vet';

interface ProviderService {
  id: string;
  service_type: ServiceType;
  is_active: boolean;
  hourly_rate: number;
  price_per_night?: number;
  service_radius: number;
  capacity: number;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface BusinessVerification {
  id: string;
  business_name: string;
  business_tax_id: string;
  business_license_url?: string;
  business_proof_url?: string;
  ownership_proof_url?: string;
  status: string;
  rejection_reason?: string;
}

export default function ManageServices() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [businessVerification, setBusinessVerification] = useState<BusinessVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ProviderService>>({});
  const [showAddService, setShowAddService] = useState(false);
  const [newServiceType, setNewServiceType] = useState<ServiceType>('walker');

  useEffect(() => {
    loadData();
    if (profile?.business_type === 'business') {
      setNewServiceType('hotel');
    } else {
      setNewServiceType('walker');
    }
  }, [profile]);

  const loadData = async () => {
    try {
      const [servicesRes, businessRes] = await Promise.all([
        supabase.from('provider_services').select('*').eq('provider_id', profile?.id),
        supabase.from('business_verifications').select('*').eq('provider_id', profile?.id).maybeSingle(),
      ]);

      if (servicesRes.data) setServices(servicesRes.data);
      if (businessRes.data) setBusinessVerification(businessRes.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .update({ is_active: !currentStatus })
        .eq('id', serviceId);

      if (error) throw error;

      showToast(currentStatus ? 'Servicio desactivado' : 'Servicio activado', 'success');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al actualizar', 'error');
    }
  };

  const handleUpdateService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('provider_services')
        .update(editData)
        .eq('id', serviceId);

      if (error) throw error;

      if (editData.latitude !== undefined || editData.longitude !== undefined || editData.address || editData.city) {
        const updateData: any = {};
        if (editData.address) updateData.address = editData.address;
        if (editData.city) updateData.city = editData.city;
        if (editData.country) updateData.country = editData.country;
        if (editData.latitude !== undefined) updateData.latitude = editData.latitude;
        if (editData.longitude !== undefined) updateData.longitude = editData.longitude;

        if (Object.keys(updateData).length > 0) {
          await supabase
            .from('pet_masters')
            .update(updateData)
            .eq('id', profile?.id);
        }
      }

      showToast('Servicio actualizado', 'success');
      setEditingService(null);
      setEditData({});
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al actualizar', 'error');
    }
  };

  const handleAddService = async () => {
    try {
      const { error } = await supabase.from('provider_services').insert({
        provider_id: profile?.id,
        service_type: newServiceType,
        ...editData,
      });

      if (error) throw error;

      showToast('Servicio agregado', 'success');
      setShowAddService(false);
      setEditData({});
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al agregar servicio', 'error');
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocalización no disponible', 'error');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditData({
          ...editData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        showToast('Ubicación obtenida', 'success');
      },
      () => showToast('Error al obtener ubicación', 'error')
    );
  };

  const handleBusinessDocumentUpload = async (field: string, url: string) => {
    try {
      if (businessVerification) {
        const { error } = await supabase
          .from('business_verifications')
          .update({ [field]: url })
          .eq('id', businessVerification.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('business_verifications').insert({
          provider_id: profile?.id,
          business_name: profile?.full_name || '',
          business_tax_id: '',
          [field]: url,
        });

        if (error) throw error;
      }

      showToast('Documento subido', 'success');
      loadData();
    } catch (error) {
      console.error('Error:', error);
      showToast('Error al subir documento', 'error');
    }
  };

  const getServiceIcon = (type: ServiceType) => {
    switch (type) {
      case 'walker':
        return '🚶';
      case 'hotel':
        return '🏨';
      case 'vet':
        return '⚕️';
    }
  };

  const getServiceLabel = (type: ServiceType) => {
    switch (type) {
      case 'walker':
        return 'Paseador';
      case 'hotel':
        return 'Hotel';
      case 'vet':
        return 'Veterinaria';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#92400E' },
      under_review: { bg: '#DBEAFE', text: '#1E40AF' },
      approved: { bg: '#D1FAE5', text: '#065F46' },
      rejected: { bg: '#FEE2E2', text: '#991B1B' },
    };

    const color = colors[status] || colors.pending;

    return (
      <span
        style={{
          padding: '4px 12px',
          background: color.bg,
          color: color.text,
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '600',
        }}
      >
        {status === 'pending' && '⏳ Pendiente'}
        {status === 'under_review' && '🔍 En Revisión'}
        {status === 'approved' && '✓ Aprobado'}
        {status === 'rejected' && '✗ Rechazado'}
      </span>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              border: '4px solid #FFE5B4',
              borderTopColor: '#FF8C42',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#64748b' }}>Cargando...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              background: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '8px',
              color: '#64748b',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#FF8C42';
              e.currentTarget.style.color = '#FF8C42';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.color = '#64748b';
            }}
          >
            <span style={{ fontSize: '18px' }}>←</span>
            <span>Volver</span>
          </button>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Gestión de Servicios
          </h1>
          <p style={{ color: '#64748b' }}>Administra tus servicios y configuraciones</p>
        </div>

        {profile?.business_type === 'business' && (
          <div
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              border: '2px solid #FFE5B4',
              boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>
                🏢 Verificación de Negocio
              </h2>
              {businessVerification && getStatusBadge(businessVerification.status)}
            </div>

            {businessVerification && businessVerification.status === 'rejected' && (
              <div
                style={{
                  padding: '12px',
                  background: '#FEE2E2',
                  borderRadius: '8px',
                  marginBottom: '16px',
                }}
              >
                <p style={{ fontSize: '14px', color: '#991B1B' }}>
                  <strong>Motivo de rechazo:</strong> {businessVerification.rejection_reason}
                </p>
              </div>
            )}

            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  📄 Licencia Comercial
                </label>
                <ImageUpload
                  currentImageUrl={businessVerification?.business_license_url}
                  onUploadComplete={(url: string) => handleBusinessDocumentUpload('business_license_url', url)}
                  folder="business-licenses"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  📋 Prueba de Negocio (RUT, Cámara de Comercio, etc.)
                </label>
                <ImageUpload
                  currentImageUrl={businessVerification?.business_proof_url}
                  onUploadComplete={(url: string) => handleBusinessDocumentUpload('business_proof_url', url)}
                  folder="business-proofs"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  👤 Prueba de Propiedad (Documento de identidad del propietario)
                </label>
                <ImageUpload
                  currentImageUrl={businessVerification?.ownership_proof_url}
                  onUploadComplete={(url: string) => handleBusinessDocumentUpload('ownership_proof_url', url)}
                  folder="ownership-proofs"
                />
              </div>
            </div>

            {businessVerification &&
              businessVerification.business_license_url &&
              businessVerification.business_proof_url &&
              businessVerification.ownership_proof_url &&
              businessVerification.status === 'pending' && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: '#DBEAFE',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ fontSize: '14px', color: '#1E40AF' }}>
                    ✓ Documentos completos. Tu verificación será revisada pronto.
                  </p>
                </div>
              )}
          </div>
        )}

        <div
          style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            border: '2px solid #E8F5E9',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b' }}>💼 Mis Servicios</h2>
            {services.length === 0 && (
              <button
                onClick={() => setShowAddService(true)}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Agregar Servicio
              </button>
            )}
          </div>

          {services.length > 0 && (
            <div
              style={{
                padding: '12px',
                background: '#EEF2FF',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <p style={{ fontSize: '14px', color: '#4338CA' }}>
                {profile?.business_type === 'individual'
                  ? '📢 Como persona individual, solo puedes tener un servicio activo de paseador.'
                  : '📢 Como empresa, solo puedes tener un servicio activo (hotel o veterinaria).'}
              </p>
            </div>
          )}

          {showAddService && (
            <div
              style={{
                padding: '20px',
                background: '#F0FDF4',
                border: '2px solid #BBF7D0',
                borderRadius: '12px',
                marginBottom: '20px',
              }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '16px' }}>Nuevo Servicio</h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Tipo de Servicio
                  </label>
                  <select
                    value={newServiceType}
                    onChange={(e) => setNewServiceType(e.target.value as ServiceType)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                    }}
                  >
                    {profile?.business_type === 'individual' ? (
                      <option value="walker">🚶 Paseador</option>
                    ) : (
                      <>
                        <option value="hotel">🏨 Hotel</option>
                        <option value="vet">⚕️ Veterinaria</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                    Dirección
                  </label>
                  <input
                    type="text"
                    value={editData.address || ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
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
                      Ciudad
                    </label>
                    <input
                      type="text"
                      value={editData.city || ''}
                      onChange={(e) => setEditData({ ...editData, city: e.target.value })}
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
                      value={editData.country || 'Colombia'}
                      onChange={(e) => setEditData({ ...editData, country: e.target.value })}
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

                {newServiceType === 'walker' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Tarifa por Hora ($)
                    </label>
                    <input
                      type="number"
                      value={editData.hourly_rate || 15}
                      onChange={(e) => setEditData({ ...editData, hourly_rate: Number(e.target.value) })}
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
                )}

                {newServiceType === 'hotel' && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                      Precio por Noche ($)
                    </label>
                    <input
                      type="number"
                      value={editData.price_per_night || 30}
                      onChange={(e) => setEditData({ ...editData, price_per_night: Number(e.target.value) })}
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
                )}

                <button
                  onClick={handleGetLocation}
                  style={{
                    padding: '10px',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  📍 Obtener Mi Ubicación
                </button>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleAddService}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Guardar
                  </button>
                  <button
                    onClick={() => {
                      setShowAddService(false);
                      setEditData({});
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#e2e8f0',
                      color: '#334155',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: '16px' }}>
            {services.map((service) => (
              <div
                key={service.id}
                style={{
                  padding: '20px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  background: service.is_active ? 'white' : '#f8fafc',
                }}
              >
                {editingService === service.id ? (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                      {getServiceIcon(service.service_type)} Editando {getServiceLabel(service.service_type)}
                    </h3>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={editData.address ?? service.address}
                        onChange={(e) => setEditData({ ...editData, address: e.target.value })}
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
                          Ciudad
                        </label>
                        <input
                          type="text"
                          value={editData.city ?? service.city}
                          onChange={(e) => setEditData({ ...editData, city: e.target.value })}
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
                          value={editData.country ?? service.country}
                          onChange={(e) => setEditData({ ...editData, country: e.target.value })}
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

                    <button
                      onClick={handleGetLocation}
                      style={{
                        padding: '10px',
                        background: '#3B82F6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      📍 Actualizar Ubicación
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleUpdateService(service.id)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        ✓ Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingService(null);
                          setEditData({});
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#e2e8f0',
                          color: '#334155',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
                          {getServiceIcon(service.service_type)} {getServiceLabel(service.service_type)}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#64748b' }}>
                          📍 {service.address}, {service.city}
                        </p>
                        {service.service_type === 'walker' && (
                          <p style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                            💵 ${service.hourly_rate}/hora • 📏 {service.service_radius}m radio
                          </p>
                        )}
                        {service.service_type === 'hotel' && (
                          <p style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                            💵 ${service.price_per_night}/noche • 👥 Capacidad: {service.capacity}
                          </p>
                        )}
                      </div>
                      <span
                        style={{
                          padding: '6px 12px',
                          background: service.is_active ? '#D1FAE5' : '#F1F5F9',
                          color: service.is_active ? '#065F46' : '#475569',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {service.is_active ? '✓ Activo' : '⏸ Inactivo'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button
                        onClick={() => {
                          setEditingService(service.id);
                          setEditData(service);
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => toggleServiceStatus(service.id, service.is_active)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          background: service.is_active ? '#f59e0b' : '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {service.is_active ? '⏸ Desactivar' : '▶️ Activar'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {services.length === 0 && !showAddService && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <p style={{ fontSize: '1rem', marginBottom: '16px' }}>No tienes servicios configurados</p>
              <button
                onClick={() => setShowAddService(true)}
                style={{
                  padding: '12px 24px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Agregar tu Primer Servicio
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
