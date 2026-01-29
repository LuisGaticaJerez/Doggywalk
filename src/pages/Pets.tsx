import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Pet } from '../types';

export default function Pets() {
  const { profile } = useAuth();
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
    if (!confirm('Are you sure you want to delete this pet?')) return;

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
            border: '4px solid #e2e8f0',
            borderTopColor: '#0ea5e9',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
              My Pets
            </h1>
            <p style={{ color: '#64748b' }}>Manage your pet profiles</p>
          </div>
          <Link
            to="/pets/new"
            style={{
              padding: '12px 24px',
              background: '#0ea5e9',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600'
            }}
          >
            Add New Pet
          </Link>
        </div>

        {pets.length === 0 ? (
          <div style={{
            background: 'white',
            padding: '60px 40px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.125rem', color: '#64748b', marginBottom: '24px' }}>
              No pets yet. Add your first pet to get started!
            </p>
            <Link
              to="/pets/new"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: '#0ea5e9',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Add Your First Pet
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
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden'
                }}
              >
                {pet.photo_url && (
                  <div style={{
                    height: '200px',
                    background: '#f1f5f9',
                    backgroundImage: `url(${pet.photo_url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }} />
                )}
                <div style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    {pet.name}
                  </h3>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                    <p>{pet.breed}</p>
                    <p>Size: {pet.size} • Age: {pet.age} years</p>
                    {pet.special_notes && (
                      <p style={{ marginTop: '8px', fontStyle: 'italic' }}>{pet.special_notes}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link
                      to={`/pets/${pet.id}/edit`}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#0ea5e9',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        textAlign: 'center'
                      }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(pet.id)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
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
