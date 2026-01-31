import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { storePhoto } from '../utils/photoStorage';

interface ServicePhoto {
  id: string;
  photo_url: string;
  photo_type: 'facility' | 'service' | 'team' | 'other';
  caption: string | null;
  display_order: number;
  is_cover: boolean;
}

interface ServicePhotosProps {
  petMasterId: string;
  editable?: boolean;
}

export default function ServicePhotos({ petMasterId, editable = false }: ServicePhotosProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [photos, setPhotos] = useState<ServicePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const photoTypes = [
    { value: 'facility', label: t.photoTypes?.facility || 'Facility' },
    { value: 'service', label: t.photoTypes?.service || 'Service' },
    { value: 'team', label: t.photoTypes?.team || 'Team' },
    { value: 'other', label: t.photoTypes?.other || 'Other' }
  ];

  useEffect(() => {
    loadPhotos();
  }, [petMasterId]);

  const loadPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('service_photos')
        .select('*')
        .eq('pet_master_id', petMasterId)
        .order('display_order');

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error loading photos:', error);
      showToast(t.errors?.loadFailed || 'Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast(t.errors?.invalidImage || 'Please select an image file', 'error');
      return;
    }

    setUploading(true);
    try {
      const photoUrl = await storePhoto(file);

      const { error } = await supabase
        .from('service_photos')
        .insert({
          pet_master_id: petMasterId,
          photo_url: photoUrl,
          photo_type: 'facility',
          display_order: photos.length,
          is_cover: photos.length === 0
        });

      if (error) throw error;

      showToast(t.success?.photoUploaded || 'Photo uploaded successfully', 'success');
      loadPhotos();
    } catch (error) {
      console.error('Error uploading photo:', error);
      showToast(t.errors?.uploadFailed || 'Failed to upload photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm(t.confirm?.deletePhoto || 'Delete this photo?')) return;

    try {
      const { error } = await supabase
        .from('service_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      showToast(t.success?.photoDeleted || 'Photo deleted successfully', 'success');
      loadPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      showToast(t.errors?.deleteFailed || 'Failed to delete photo', 'error');
    }
  };

  const handleSetCover = async (photoId: string) => {
    try {
      await supabase
        .from('service_photos')
        .update({ is_cover: false })
        .eq('pet_master_id', petMasterId);

      const { error } = await supabase
        .from('service_photos')
        .update({ is_cover: true })
        .eq('id', photoId);

      if (error) throw error;

      showToast(t.success?.coverSet || 'Cover photo updated', 'success');
      loadPhotos();
    } catch (error) {
      console.error('Error setting cover:', error);
      showToast(t.errors?.updateFailed || 'Failed to update cover photo', 'error');
    }
  };

  const handleUpdateCaption = async (photoId: string, caption: string) => {
    try {
      const { error } = await supabase
        .from('service_photos')
        .update({ caption })
        .eq('id', photoId);

      if (error) throw error;
      loadPhotos();
    } catch (error) {
      console.error('Error updating caption:', error);
      showToast(t.errors?.updateFailed || 'Failed to update caption', 'error');
    }
  };

  const handleUpdateType = async (photoId: string, photo_type: string) => {
    try {
      const { error } = await supabase
        .from('service_photos')
        .update({ photo_type })
        .eq('id', photoId);

      if (error) throw error;
      loadPhotos();
    } catch (error) {
      console.error('Error updating type:', error);
      showToast(t.errors?.updateFailed || 'Failed to update photo type', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '32px' }}>
        <div style={{
          display: 'inline-block',
          width: '32px',
          height: '32px',
          border: '3px solid #e2e8f0',
          borderTopColor: '#10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      border: '2px solid #E8F5E9',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>
            📸 {t.servicePhotos?.title || 'Fotos del Servicio'}
          </h3>
          <p style={{ fontSize: '14px', color: '#64748b' }}>
            Muestra tu espacio y servicio a los clientes
          </p>
        </div>
        {editable && (
          <label style={{
            padding: '12px 24px',
            background: uploading ? '#94a3b8' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
            border: 'none',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s'
          }}>
            {uploading ? '📤 Subiendo...' : '+ Agregar Foto'}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      {photos.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '2px dashed #CBD5E1'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📷</div>
          <p style={{ fontSize: '16px', color: '#64748b', marginBottom: '8px' }}>
            {t.servicePhotos?.noPhotos || 'No hay fotos aún'}
          </p>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            Sube fotos de tus instalaciones para atraer más clientes
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                position: 'relative',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <img
                src={photo.photo_url}
                alt={photo.caption || ''}
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover'
                }}
              />

              {photo.is_cover && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '11px',
                  padding: '4px 12px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                }}>
                  ⭐ {t.servicePhotos?.cover || 'Portada'}
                </div>
              )}

              {editable && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0, 0, 0, 0.7)',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '12px',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = '0';
                  }}
                >
                  <select
                    value={photo.photo_type}
                    onChange={(e) => handleUpdateType(photo.id, e.target.value)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: 'white',
                      border: 'none',
                      fontWeight: '500'
                    }}
                  >
                    {photoTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder={t.servicePhotos?.captionPlaceholder || 'Agregar descripción...'}
                    value={photo.caption || ''}
                    onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                    style={{
                      fontSize: '12px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'white'
                    }}
                  />

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {!photo.is_cover && (
                      <button
                        onClick={() => handleSetCover(photo.id)}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          fontSize: '12px',
                          padding: '6px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        ⭐ Portada
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                        color: 'white',
                        fontSize: '12px',
                        padding: '6px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
