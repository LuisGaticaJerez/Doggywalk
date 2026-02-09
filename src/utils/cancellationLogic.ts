import { supabase } from '../lib/supabase';

export interface CancellationPolicy {
  id: string;
  name: string;
  hours_before: number;
  refund_percentage: number;
  description: string;
}

export interface CancellationResult {
  canCancel: boolean;
  refundPercentage: number;
  refundAmount: number;
  reason?: string;
  policyName: string;
}

export async function getCancellationPolicies(): Promise<CancellationPolicy[]> {
  const { data, error } = await supabase
    .from('cancellation_policies')
    .select('*')
    .order('hours_before', { ascending: true });

  if (error) {
    console.error('Error fetching cancellation policies:', error);
    return [];
  }

  return data || [];
}

export async function calculateCancellationRefund(
  bookingId: string
): Promise<CancellationResult | null> {
  try {
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, cancellation_policies(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      return null;
    }

    if (booking.status === 'cancelled') {
      return {
        canCancel: false,
        refundPercentage: 0,
        refundAmount: 0,
        reason: 'Booking is already cancelled',
        policyName: 'N/A',
      };
    }

    if (booking.status === 'completed') {
      return {
        canCancel: false,
        refundPercentage: 0,
        refundAmount: 0,
        reason: 'Cannot cancel a completed booking',
        policyName: 'N/A',
      };
    }

    const bookingDate = new Date(booking.booking_date);
    const now = new Date();
    const hoursUntilBooking = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking < 0) {
      return {
        canCancel: false,
        refundPercentage: 0,
        refundAmount: 0,
        reason: 'Cannot cancel a past booking',
        policyName: 'N/A',
      };
    }

    const policy = booking.cancellation_policies || await getDefaultPolicy();

    if (!policy) {
      return {
        canCancel: true,
        refundPercentage: 0,
        refundAmount: 0,
        reason: 'No cancellation policy found',
        policyName: 'No Policy',
      };
    }

    const refundPercentage = hoursUntilBooking >= policy.hours_before
      ? policy.refund_percentage
      : 0;

    const totalAmount = parseFloat(booking.total_price?.toString() || '0');
    const refundAmount = (totalAmount * refundPercentage) / 100;

    return {
      canCancel: true,
      refundPercentage,
      refundAmount,
      policyName: policy.name,
      reason: hoursUntilBooking >= policy.hours_before
        ? `Cancelling ${hoursUntilBooking.toFixed(1)} hours before booking`
        : `Cancelling less than ${policy.hours_before} hours before booking`,
    };
  } catch (error) {
    console.error('Error calculating cancellation refund:', error);
    return null;
  }
}

async function getDefaultPolicy(): Promise<CancellationPolicy | null> {
  const { data, error } = await supabase
    .from('cancellation_policies')
    .select('*')
    .eq('name', 'Flexible')
    .single();

  if (error) {
    console.error('Error fetching default policy:', error);
    return null;
  }

  return data;
}

export async function cancelBookingWithRefund(
  bookingId: string,
  reason: string
): Promise<{ success: boolean; message: string; refundAmount?: number }> {
  try {
    const cancellationResult = await calculateCancellationRefund(bookingId);

    if (!cancellationResult) {
      return {
        success: false,
        message: 'Failed to calculate refund',
      };
    }

    if (!cancellationResult.canCancel) {
      return {
        success: false,
        message: cancellationResult.reason || 'Cannot cancel this booking',
      };
    }

    const { data: booking } = await supabase
      .from('bookings')
      .select('owner_id, provider_id, service_name, booking_date')
      .eq('id', bookingId)
      .single();

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: reason,
        refund_amount: cancellationResult.refundAmount,
        refund_status: cancellationResult.refundAmount > 0 ? 'pending' : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return {
        success: false,
        message: 'Failed to cancel booking',
      };
    }

    if (booking) {
      await supabase.from('notifications').insert([
        {
          pet_master_id: booking.owner_id,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `Your booking for ${booking.service_name} on ${new Date(booking.booking_date).toLocaleDateString()} has been cancelled. ${cancellationResult.refundAmount > 0 ? `Refund: $${cancellationResult.refundAmount.toFixed(2)}` : 'No refund applicable.'}`,
          is_read: false,
        },
        {
          pet_master_id: booking.provider_id,
          type: 'booking_cancelled',
          title: 'Booking Cancelled',
          message: `A booking for ${booking.service_name} on ${new Date(booking.booking_date).toLocaleDateString()} has been cancelled by the customer.`,
          is_read: false,
        },
      ]);
    }

    return {
      success: true,
      message: cancellationResult.refundAmount > 0
        ? `Booking cancelled. Refund of $${cancellationResult.refundAmount.toFixed(2)} will be processed within 5-7 business days.`
        : 'Booking cancelled. No refund applicable based on the cancellation policy.',
      refundAmount: cancellationResult.refundAmount,
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return {
      success: false,
      message: 'An error occurred while cancelling the booking',
    };
  }
}

export async function assignDefaultPolicyToBooking(bookingId: string): Promise<boolean> {
  try {
    const defaultPolicy = await getDefaultPolicy();

    if (!defaultPolicy) {
      return false;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ cancellation_policy_id: defaultPolicy.id })
      .eq('id', bookingId)
      .is('cancellation_policy_id', null);

    return !error;
  } catch (error) {
    console.error('Error assigning default policy:', error);
    return false;
  }
}
