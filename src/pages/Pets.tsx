import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { Pet } from '../types';

export default function Pets() {
  const { profile } = useAuth();
  const { t } = useI18n();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setPets(data);
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId: string) => {
    if (!confirm(t.pets.deleteConfirm)) return;

    try {
      const { error } = await supabase
        .from('pets')
        .delete()
        .eq('id', petId);

      if (error) throw error;
      setPets(pets.filter(p => p.id !== petId));
    } catch (error) {
      console.error('Error deleting pet:', error);
      alert('Failed to delete pet');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #FFE5B4',
            borderTopColor: '#FF8C42',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div>
        <div style={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
          padding: '32px',
          borderRadius: '16px',
          marginBottom: '32px',
          color: 'white',
          boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            right: '-30px',
            top: '-30px',
            fontSize: '12rem',
            opacity: 0.1
          }}>🐾</div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '8px' }}>
              🐾 {t.pets.title}
            </h1>
            <p style={{ opacity: 0.95, fontSize: '1.125rem' }}>{t.dashboard.myPets}</p>
          </div>
          <Link
            to="/pets/new"
            style={{
              padding: '14px 28px',
              background: 'white',
              color: '#4CAF50',
              textDecoration: 'none',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: '700',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <span>➕</span> {t.pets.addPet}
          </Link>
        </div>

        {pets.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '20px',
            border: '2px dashed #FFB74D',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(255, 183, 77, 0.1)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🐕‍🦺</div>
            <p style={{ fontSize: '1.25rem', color: '#64748b', marginBottom: '24px', fontWeight: '500' }}>
              {t.dashboard.noPets}
            </p>
            <Link
              to="/pets/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #FF8C42 0%, #FFA500 100%)',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '30px',
                fontSize: '16px',
                fontWeight: '700',
                boxShadow: '0 6px 16px rgba(255, 140, 66, 0.3)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <span>➕</span> {t.pets.addPet}
            </Link>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {pets.map(pet => (
              <div
                key={pet.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  border: '2px solid #FFE5B4',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(255, 140, 66, 0.1)',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(255, 140, 66, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 140, 66, 0.1)';
                }}
              >
                {pet.photo_url ? (
                  <div style={{
                    height: '200px',
                    background: 'linear-gradient(135deg, #FFE5B4 0%, #FFD93D 100%)',
                    backgroundImage: `url(${pet.photo_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#FF8C42'
                    }}>
                      {pet.size}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    height: '200px',
                    background: 'linear-gradient(135deg, #FFE5B4 0%, #FFD93D 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '5rem'
                  }}>
                    {pet.breed?.toLowerCase().includes('dog') ? '🐕' : pet.breed?.toLowerCase().includes('cat') ? '🐱' : '🐾'}
                  </div>
                )}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.5rem' }}>
                      {pet.breed?.toLowerCase().includes('dog') ? '🐶' : pet.breed?.toLowerCase().includes('cat') ? '🐱' : '🐾'}
                    </span>
                    {pet.name}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    <p style={{ fontWeight: '500', color: '#334155' }}>{pet.breed}</p>
                    <p style={{ marginTop: '6px' }}>📏 {pet.size} • 🎂 {pet.age} years</p>
                    {pet.special_notes && (
                      <p style={{
                        marginTop: '12px',
                        padding: '10px',
                        background: '#FFF9E6',
                        borderRadius: '8px',
                        fontSize: '13px',
                        color: '#8B6914',
                        borderLeft: '3px solid #FFD93D'
                      }}>
                        📝 {pet.special_notes}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/pets/${pet.id}/edit`}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'linear-gradient(135deg, #4CAF50 0%, #45B049 100%)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: '600',
                        textAlign: 'center',
                        boxShadow: '0 3px 8px rgba(76, 175, 80, 0.3)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      ✏️ {t.common.edit}
                    </Link>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '25px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 3px 8px rgba(255, 107, 107, 0.3)',
                        transition: 'transform 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      🗑️ {t.common.delete}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
