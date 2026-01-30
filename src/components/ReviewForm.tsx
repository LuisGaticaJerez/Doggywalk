import { useState } from 'react';
import { StarRating } from './StarRating';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useI18n } from '../contexts/I18nContext';

interface ReviewFormProps {
  bookingId: string;
  petMasterId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({
  bookingId,
  petMasterId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useI18n();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      showToast('You must be logged in to submit a review', 'error');
      return;
    }

    if (rating < 1 || rating > 5) {
      showToast('Please select a rating', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('ratings').insert({
        booking_id: bookingId,
        pet_master_id: petMasterId,
        owner_id: user.id,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      await supabase
        .from('bookings')
        .update({ has_rating: true })
        .eq('id', bookingId);

      showToast('Review submitted successfully!', 'success');

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      const err = error as { message?: string };
      showToast(err.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t.common.rating || 'Rate Your Experience'}
        </h3>
        <div className="flex justify-center mb-2">
          <StarRating
            rating={rating}
            onRatingChange={setRating}
            size="large"
          />
        </div>
        <p className="text-center text-sm text-gray-600">
          {rating === 5 && 'Excellent!'}
          {rating === 4 && 'Very Good'}
          {rating === 3 && 'Good'}
          {rating === 2 && 'Fair'}
          {rating === 1 && 'Poor'}
        </p>
      </div>

      <div>
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Your Review <span className="text-gray-400">(Optional)</span>
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Tell us about your experience..."
          maxLength={500}
        />
        <p className="text-xs text-gray-500 mt-1 text-right">
          {comment.length}/500
        </p>
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            {t.common.cancel || 'Cancel'}
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {submitting ? 'Submitting...' : t.common.submit || 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
