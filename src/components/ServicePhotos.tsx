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
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">
          {t.servicePhotos?.title || 'Service Photos'}
        </h3>
        {editable && (
          <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
            {uploading ? (t.common?.uploading || 'Uploading...') : (t.common?.addPhoto || 'Add Photo')}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {t.servicePhotos?.noPhotos || 'No photos yet'}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.photo_url}
                alt={photo.caption || ''}
                className="w-full h-48 object-cover rounded-lg"
              />

              {photo.is_cover && (
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                  {t.servicePhotos?.cover || 'Cover'}
                </div>
              )}

              {editable && (
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex flex-col justify-end p-3 gap-2">
                  <select
                    value={photo.photo_type}
                    onChange={(e) => handleUpdateType(photo.id, e.target.value)}
                    className="text-sm px-2 py-1 rounded bg-white"
                  >
                    {photoTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder={t.servicePhotos?.captionPlaceholder || 'Add caption...'}
                    value={photo.caption || ''}
                    onChange={(e) => handleUpdateCaption(photo.id, e.target.value)}
                    className="text-sm px-2 py-1 rounded"
                  />

                  <div className="flex gap-2">
                    {!photo.is_cover && (
                      <button
                        onClick={() => handleSetCover(photo.id)}
                        className="flex-1 bg-blue-600 text-white text-sm py-1 rounded hover:bg-blue-700"
                      >
                        {t.servicePhotos?.setCover || 'Set Cover'}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="flex-1 bg-red-600 text-white text-sm py-1 rounded hover:bg-red-700"
                    >
                      {t.common?.delete || 'Delete'}
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
