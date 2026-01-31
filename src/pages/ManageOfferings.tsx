import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

interface ServiceCatalog {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  description: string;
  suggested_duration_minutes: number;
  suggested_price_clp: number;
}

interface ProviderOffering {
  id: string;
  service_catalog_id: string | null;
  custom_name: string | null;
  description: string;
  duration_minutes: number;
  price_clp: number;
  is_active: boolean;
  max_capacity: number;
  service_catalog?: ServiceCatalog;
}

export default function ManageOfferings() {
  const { user, profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [catalog, setCatalog] = useState<ServiceCatalog[]>([]);
  const [offerings, setOfferings] = useState<ProviderOffering[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingOffering, setEditingOffering] = useState<ProviderOffering | null>(null);
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const [customMode, setCustomMode] = useState(false);

  const [formData, setFormData] = useState({
    custom_name: '',
    description: '',
    duration_minutes: 60,
    price_clp: 10000,
    max_capacity: 1,
    is_active: true
  });

  useEffect(() => {
    if (user && profile?.role === 'pet_master') {
      loadData();
    } else {
      navigate('/dashboard');
    }
  }, [user, profile]);

  const loadData = async () => {
    try {
      const { data: petMasterData } = await supabase
        .from('pet_masters')
        .select('service_type')
        .eq('id', user!.id)
        .maybeSingle();

      if (petMasterData) {
        await loadCatalog(petMasterData.service_type || 'walker');
      }

      await loadOfferings();
    } catch (error) {
      console.error('Error loading data:', error);
      showToast(t.errors.loadFailed, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadCatalog = async (type: string) => {
    const { data, error } = await supabase
      .from('service_catalog')
      .select('*')
      .eq('category', type)
      .eq('is_active', true)
      .order('subcategory', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error loading catalog:', error);
    } else {
      setCatalog(data || []);
    }
  };

  const loadOfferings = async () => {
    const { data, error } = await supabase
      .from('provider_service_offerings')
      .select(`
        *,
        service_catalog:service_catalog_id(*)
      `)
      .eq('provider_id', user!.id)
      .order('is_active', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading offerings:', error);
    } else {
      setOfferings(data || []);
    }
  };

  const handleAddOffering = async () => {
    if (!selectedCatalogId && !customMode) {
      showToast('Por favor selecciona un servicio del catálogo', 'error');
      return;
    }

    if (customMode && !formData.custom_name.trim()) {
      showToast('Por favor ingresa un nombre para el servicio personalizado', 'error');
      return;
    }

    try {
      const offering = {
        provider_id: user!.id,
        service_catalog_id: customMode ? null : selectedCatalogId,
        custom_name: customMode ? formData.custom_name : null,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        price_clp: formData.price_clp,
        max_capacity: formData.max_capacity,
        is_active: formData.is_active
      };

      const { error } = await supabase
        .from('provider_service_offerings')
        .insert(offering);

      if (error) throw error;

      showToast(t.success.saved, 'success');
      setShowAddForm(false);
      resetForm();
      await loadOfferings();
    } catch (error) {
      console.error('Error adding offering:', error);
      showToast(t.errors.saveFailed, 'error');
    }
  };

  const handleUpdateOffering = async () => {
    if (!editingOffering) return;

    try {
      const { error } = await supabase
        .from('provider_service_offerings')
        .update({
          custom_name: formData.custom_name || null,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price_clp: formData.price_clp,
          max_capacity: formData.max_capacity,
          is_active: formData.is_active
        })
        .eq('id', editingOffering.id);

      if (error) throw error;

      showToast(t.success.saved, 'success');
      setEditingOffering(null);
      resetForm();
      await loadOfferings();
    } catch (error) {
      console.error('Error updating offering:', error);
      showToast(t.errors.updateFailed, 'error');
    }
  };

  const handleDeleteOffering = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este servicio?')) return;

    try {
      const { error } = await supabase
        .from('provider_service_offerings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      showToast('Servicio eliminado', 'success');
      await loadOfferings();
    } catch (error) {
      console.error('Error deleting offering:', error);
      showToast(t.errors.deleteFailed, 'error');
    }
  };

  const handleSelectCatalogService = (service: ServiceCatalog) => {
    setSelectedCatalogId(service.id);
    setFormData({
      custom_name: '',
      description: service.description,
      duration_minutes: service.suggested_duration_minutes,
      price_clp: service.suggested_price_clp,
      max_capacity: 1,
      is_active: true
    });
  };

  const handleEditOffering = (offering: ProviderOffering) => {
    setEditingOffering(offering);
    setFormData({
      custom_name: offering.custom_name || '',
      description: offering.description,
      duration_minutes: offering.duration_minutes,
      price_clp: offering.price_clp,
      max_capacity: offering.max_capacity,
      is_active: offering.is_active
    });
  };

  const resetForm = () => {
    setSelectedCatalogId('');
    setCustomMode(false);
    setFormData({
      custom_name: '',
      description: '',
      duration_minutes: 60,
      price_clp: 10000,
      max_capacity: 1,
      is_active: true
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const groupedCatalog = catalog.reduce((acc, service) => {
    if (!acc[service.subcategory]) {
      acc[service.subcategory] = [];
    }
    acc[service.subcategory].push(service);
    return acc;
  }, {} as Record<string, ServiceCatalog[]>);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
        <p>{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
            Gestionar Mis Servicios
          </h1>
          <p style={{ color: '#64748b' }}>
            Agrega y personaliza los servicios que ofreces
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingOffering(null);
            resetForm();
          }}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255, 140, 66, 0.3)'
          }}
        >
          ➕ Agregar Servicio
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: showAddForm || editingOffering ? '1fr 400px' : '1fr',
        gap: '24px'
      }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#1e293b' }}>
            Mis Servicios Activos
          </h2>

          {offerings.length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '40px',
              textAlign: 'center',
              border: '2px dashed #e2e8f0'
            }}>
              <p style={{ fontSize: '48px', marginBottom: '16px' }}>📋</p>
              <p style={{ color: '#64748b', marginBottom: '8px' }}>
                No tienes servicios configurados aún
              </p>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                Haz clic en "Agregar Servicio" para comenzar
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {offerings.map((offering) => (
                <div
                  key={offering.id}
                  style={{
                    background: 'white',
                    borderRadius: '16px',
                    padding: '20px',
                    border: `2px solid ${offering.is_active ? '#FFE5B4' : '#e2e8f0'}`,
                    opacity: offering.is_active ? 1 : 0.6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
                          {offering.custom_name || offering.service_catalog?.name}
                        </h3>
                        <span style={{
                          padding: '4px 12px',
                          background: offering.is_active ? '#dcfce7' : '#fee2e2',
                          color: offering.is_active ? '#166534' : '#991b1b',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {offering.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px' }}>
                        {offering.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>⏱️</span>
                          <span style={{ fontSize: '14px', color: '#475569' }}>
                            {formatDuration(offering.duration_minutes)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>💰</span>
                          <span style={{ fontSize: '14px', color: '#475569', fontWeight: '600' }}>
                            {formatPrice(offering.price_clp)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>👥</span>
                          <span style={{ fontSize: '14px', color: '#475569' }}>
                            Capacidad: {offering.max_capacity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditOffering(offering)}
                        style={{
                          padding: '8px 16px',
                          background: '#f1f5f9',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteOffering(offering.id)}
                        style={{
                          padding: '8px 16px',
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(showAddForm || editingOffering) && (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid #FFE5B4',
            height: 'fit-content',
            position: 'sticky',
            top: '20px'
          }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
                {editingOffering ? 'Editar Servicio' : 'Nuevo Servicio'}
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {editingOffering ? 'Modifica los detalles del servicio' : 'Completa los detalles del servicio'}
              </p>
            </div>

            {!editingOffering && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                  <button
                    onClick={() => setCustomMode(false)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: !customMode ? '#FF8C42' : '#f1f5f9',
                      color: !customMode ? 'white' : '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Del Catálogo
                  </button>
                  <button
                    onClick={() => {
                      setCustomMode(true);
                      setSelectedCatalogId('');
                    }}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: customMode ? '#FF8C42' : '#f1f5f9',
                      color: customMode ? 'white' : '#64748b',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Personalizado
                  </button>
                </div>

                {!customMode && (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px' }}>
                    {Object.entries(groupedCatalog).map(([subcategory, services]) => (
                      <div key={subcategory} style={{ marginBottom: '16px' }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#475569',
                          marginBottom: '8px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {subcategory || 'Otros'}
                        </h4>
                        {services.map((service) => (
                          <div
                            key={service.id}
                            onClick={() => handleSelectCatalogService(service)}
                            style={{
                              padding: '12px',
                              background: selectedCatalogId === service.id ? '#FFF7ED' : '#f8fafc',
                              border: `2px solid ${selectedCatalogId === service.id ? '#FF8C42' : '#e2e8f0'}`,
                              borderRadius: '8px',
                              marginBottom: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>
                              {service.name}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                              {service.description}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#475569' }}>
                              <span>⏱️ {formatDuration(service.suggested_duration_minutes)}</span>
                              <span>💰 {formatPrice(service.suggested_price_clp)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {customMode && !editingOffering && (
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    Nombre del Servicio *
                  </label>
                  <input
                    type="text"
                    value={formData.custom_name}
                    onChange={(e) => setFormData({ ...formData, custom_name: e.target.value })}
                    placeholder="Ej: Paseo nocturno especial"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Descripción
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                    min="1"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                    Precio (CLP)
                  </label>
                  <input
                    type="number"
                    value={formData.price_clp}
                    onChange={(e) => setFormData({ ...formData, price_clp: parseInt(e.target.value) || 0 })}
                    min="0"
                    step="1000"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                  Capacidad Máxima
                </label>
                <input
                  type="number"
                  value={formData.max_capacity}
                  onChange={(e) => setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 1 })}
                  min="1"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '14px', cursor: 'pointer' }}>
                  Servicio activo y visible
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingOffering(null);
                    resetForm();
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={editingOffering ? handleUpdateOffering : handleAddOffering}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {editingOffering ? 'Guardar Cambios' : 'Agregar Servicio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
