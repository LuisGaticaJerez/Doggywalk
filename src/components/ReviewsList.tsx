import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { StarRating } from './StarRating';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ReviewsListProps {
  petMasterId: string;
  limit?: number;
}

export function ReviewsList({ petMasterId, limit }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
  });

  useEffect(() => {
    loadReviews();
  }, [petMasterId]);

  const loadReviews = async () => {
    try {
      let query = supabase
        .from('ratings')
        .select(
          `
          id,
          rating,
          comment,
          created_at,
          profiles:owner_id (
            full_name,
            avatar_url
          )
        `
        )
        .eq('pet_master_id', petMasterId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      const formattedReviews: Review[] = (data || []).map((item: { id: string; rating: number; comment: string | null; created_at: string; profiles: { full_name: string; avatar_url: string | null }[] }) => ({
        id: item.id,
        rating: item.rating,
        comment: item.comment,
        created_at: item.created_at,
        profiles: Array.isArray(item.profiles) && item.profiles.length > 0
          ? item.profiles[0]
          : { full_name: 'Unknown', avatar_url: null }
      }));

      setReviews(formattedReviews);

      const { data: statsData } = await supabase
        .from('ratings')
        .select('rating')
        .eq('pet_master_id', petMasterId);

      if (statsData && statsData.length > 0) {
        const avg =
          statsData.reduce((sum, r) => sum + r.rating, 0) / statsData.length;
        setStats({
          average: avg,
          total: statsData.length,
        });
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div
          className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-4xl mb-2">⭐</div>
        <p className="text-gray-600">No reviews yet</p>
        <p className="text-sm text-gray-500 mt-1">
          Be the first to review this provider!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-gray-900">
                {stats.average.toFixed(1)}
              </span>
              <span className="text-gray-600">/ 5</span>
            </div>
            <StarRating rating={stats.average} readOnly size="medium" />
            <p className="text-sm text-gray-600 mt-2">
              Based on {stats.total} {stats.total === 1 ? 'review' : 'reviews'}
            </p>
          </div>
          <div className="text-6xl">⭐</div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="bg-white rounded-lg p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {review.profiles.avatar_url ? (
                  <img
                    src={review.profiles.avatar_url}
                    alt={review.profiles.full_name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg border-2 border-gray-200">
                    {review.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {review.profiles.full_name}
                  </h4>
                  <span className="text-xs text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                <StarRating rating={review.rating} readOnly size="small" />

                {review.comment && (
                  <p className="mt-3 text-gray-700 leading-relaxed">
                    {review.comment}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
