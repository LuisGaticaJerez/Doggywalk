import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProviderCard from '../components/ProviderCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../styles/theme';

interface FavoriteProvider {
  id: string;
  provider_id: string;
  created_at: string;
  notes: string | null;
  pet_masters: any;
}

export default function Favorites() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('favorite_providers')
        .select(`
          id,
          provider_id,
          created_at,
          notes,
          pet_masters:provider_id (
            id,
            full_name,
            service_type,
            hourly_rate,
            bio,
            address,
            latitude,
            longitude,
            profile_photo_url,
            provider_services (
              id,
              service_type
            ),
            view_count,
            favorite_count
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFavorites = await Promise.all(
        (data || []).map(async (fav: any) => {
          const provider = fav.pet_masters;
          if (!provider) return null;

          const { data: reviewData } = await supabase
            .from('reviews')
            .select('rating')
            .eq('pet_master_id', provider.id);

          const avgRating = reviewData && reviewData.length > 0
            ? reviewData.reduce((sum, r) => sum + r.rating, 0) / reviewData.length
            : 0;

          return {
            ...fav,
            pet_masters: {
              ...provider,
              avg_rating: avgRating,
              review_count: reviewData?.length || 0
            }
          };
        })
      );

      setFavorites(formattedFavorites.filter(f => f !== null) as FavoriteProvider[]);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: `4px solid ${theme.colors.teal[100]}`,
            borderTopColor: theme.colors.primary,
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
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '8px 16px',
              background: theme.colors.gray[100],
              color: theme.colors.text.primary,
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            ← Volver
          </button>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: theme.colors.text.primary,
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            ❤️ Mis Favoritos
          </h1>
          <p style={{
            color: theme.colors.text.secondary,
            fontSize: '16px'
          }}>
            {favorites.length === 0 ? 'No tienes proveedores favoritos' :
             favorites.length === 1 ? '1 proveedor favorito' :
             `${favorites.length} proveedores favoritos`}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '60px 20px',
            textAlign: 'center',
            boxShadow: theme.shadows.md
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🤍</div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: theme.colors.text.primary,
              marginBottom: '12px'
            }}>
              No tienes favoritos aún
            </h2>
            <p style={{
              color: theme.colors.text.secondary,
              marginBottom: '24px',
              maxWidth: '500px',
              margin: '0 auto 24px'
            }}>
              Guarda tus proveedores favoritos para acceder rápidamente a ellos
            </p>
            <button
              onClick={() => navigate('/search')}
              style={{
                padding: '12px 32px',
                background: theme.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: theme.shadows.md
              }}
            >
              Buscar Proveedores
            </button>
          </div>
        ) : (
          <>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              boxShadow: theme.shadows.sm,
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ fontSize: '1.5rem' }}>💡</div>
              <p style={{ color: theme.colors.text.secondary, fontSize: '14px', margin: 0 }}>
                Haz clic en el corazón en cualquier tarjeta de proveedor para agregarlo o quitarlo de favoritos
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '24px'
            }}>
              {favorites.map((favorite) => (
                <ProviderCard
                  key={favorite.id}
                  provider={favorite.pet_masters}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}