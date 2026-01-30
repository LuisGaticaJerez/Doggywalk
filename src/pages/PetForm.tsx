import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import ImageUpload from '../components/ImageUpload';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

export default function PetForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    size: 'medium' as 'small' | 'medium' | 'large',
    age: '',
    special_notes: '',
    photo_url: ''
  });

  useEffect(() => {
    if (id) {
      loadPet();
    }
  }, [id]);

  const loadPet = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setFormData({
          name: data.name,
          breed: data.breed || '',
          size: data.size,
          age: data.age?.toString() || '',
          special_notes: data.special_notes || '',
          photo_url: data.photo_url || ''
        });
      }
    } catch (error) {
      console.error('Error loading pet:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const petData = {
        owner_id: profile?.id,
        name: formData.name,
        breed: formData.breed || null,
        size: formData.size,
        age: formData.age ? parseInt(formData.age) : null,
        special_notes: formData.special_notes || null,
        photo_url: formData.photo_url || null
      };

      if (id) {
        const { error } = await supabase
          .from('pets')
          .update(petData)
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pets')
          .insert(petData);

        if (error) throw error;
      }

      navigate('/pets');
    } catch (error) {
      console.error('Error saving pet:', error);
      showToast('Failed to save pet', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
          {id ? t.pets.editPet : t.pets.addPet}
        </h1>
        <p style={{ color: '#64748b', marginBottom: '32px' }}>
          {id ? t.pets.editPet : t.pets.addPet}
        </p>

        <form onSubmit={handleSubmit} style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.common.name}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.pets.breed}
            </label>
            <input
              type="text"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.pets.size}
            </label>
            <select
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value as 'small' | 'medium' | 'large' })}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none'
              }}
            >
              <option value="small">{t.pets.small}</option>
              <option value="medium">{t.pets.medium}</option>
              <option value="large">{t.pets.large}</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.pets.ageYears}
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="0"
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.pets.photoUrl}
            </label>
            <ImageUpload
              currentImageUrl={formData.photo_url}
              onUploadComplete={(url) => setFormData({ ...formData, photo_url: url })}
              folder="pets"
              maxSizeMB={5}
              disabled={loading}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#334155',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {t.pets.specialNotes}
            </label>
            <textarea
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
              rows={4}
              placeholder={t.pets.specialNotesPlaceholder}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical'
              }}
            />
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
              {loading ? t.pets.saving : (id ? t.pets.updatePet : t.pets.addPet)}
            </button>
            <button
              type="button"
              onClick={() => navigate('/pets')}
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
