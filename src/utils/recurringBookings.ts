import { supabase } from '../lib/supabase';

export interface RecurringSeries {
  id?: string;
  owner_id: string;
  provider_id: string;
  pet_ids: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  interval_count: number;
  days_of_week?: number[];
  time_of_day: string;
  duration_minutes: number;
  pickup_address: string;
  pickup_latitude: number;
  pickup_longitude: number;
  special_instructions?: string;
  service_name: string;
  total_amount: number;
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  occurrences_created?: number;
  is_active?: boolean;
}

export interface RecurringBookingOccurrence {
  date: string;
  occurrence_number: number;
}

export function generateOccurrences(
  series: RecurringSeries,
  limit: number = 10
): RecurringBookingOccurrence[] {
  const occurrences: RecurringBookingOccurrence[] = [];
  const startDate = new Date(series.start_date);
  const endDate = series.end_date ? new Date(series.end_date) : null;
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + 3);

  let currentDate = new Date(startDate);
  let occurrenceNumber = (series.occurrences_created || 0) + 1;

  while (occurrences.length < limit) {
    if (endDate && currentDate > endDate) {
      break;
    }

    if (currentDate > maxDate) {
      break;
    }

    if (series.max_occurrences && occurrenceNumber > series.max_occurrences) {
      break;
    }

    if (series.frequency === 'weekly' && series.days_of_week && series.days_of_week.length > 0) {
      const dayOfWeek = currentDate.getDay();
      if (series.days_of_week.includes(dayOfWeek)) {
        occurrences.push({
          date: currentDate.toISOString().split('T')[0],
          occurrence_number: occurrenceNumber,
        });
        occurrenceNumber++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    } else {
      occurrences.push({
        date: currentDate.toISOString().split('T')[0],
        occurrence_number: occurrenceNumber,
      });
      occurrenceNumber++;

      if (series.frequency === 'daily') {
        currentDate.setDate(currentDate.getDate() + series.interval_count);
      } else if (series.frequency === 'monthly') {
        currentDate.setMonth(currentDate.getMonth() + series.interval_count);
      } else if (series.frequency === 'weekly') {
        currentDate.setDate(currentDate.getDate() + (7 * series.interval_count));
      }
    }
  }

  return occurrences;
}

export async function createRecurringSeries(
  series: RecurringSeries
): Promise<{ success: boolean; seriesId?: string; error?: string }> {
  try {
    const { data: seriesData, error: seriesError } = await supabase
      .from('recurring_booking_series')
      .insert({
        owner_id: series.owner_id,
        provider_id: series.provider_id,
        pet_ids: series.pet_ids,
        frequency: series.frequency,
        interval_count: series.interval_count,
        days_of_week: series.days_of_week || null,
        time_of_day: series.time_of_day,
        duration_minutes: series.duration_minutes,
        pickup_address: series.pickup_address,
        pickup_latitude: series.pickup_latitude,
        pickup_longitude: series.pickup_longitude,
        special_instructions: series.special_instructions,
        service_name: series.service_name,
        total_amount: series.total_amount,
        start_date: series.start_date,
        end_date: series.end_date || null,
        max_occurrences: series.max_occurrences || null,
        is_active: true,
      })
      .select()
      .single();

    if (seriesError) {
      throw seriesError;
    }

    const seriesId = seriesData.id;

    const occurrences = generateOccurrences(series, 10);

    if (occurrences.length === 0) {
      return {
        success: false,
        error: 'No valid occurrences could be generated',
      };
    }

    const bookingsToCreate = occurrences.map(occ => {
      const scheduledDate = new Date(`${occ.date}T${series.time_of_day}`);

      return {
        owner_id: series.owner_id,
        pet_master_id: series.provider_id,
        pet_id: series.pet_ids[0],
        pet_count: series.pet_ids.length,
        status: 'pending',
        scheduled_date: scheduledDate.toISOString(),
        booking_date: scheduledDate.toISOString(),
        duration_minutes: series.duration_minutes,
        pickup_latitude: series.pickup_latitude,
        pickup_longitude: series.pickup_longitude,
        pickup_address: series.pickup_address,
        total_amount: series.total_amount,
        total_price: series.total_amount,
        special_instructions: series.special_instructions,
        payment_status: 'pending',
        service_name: series.service_name,
        recurring_series_id: seriesId,
        is_recurring: true,
        occurrence_number: occ.occurrence_number,
      };
    });

    const { error: bookingsError } = await supabase
      .from('bookings')
      .insert(bookingsToCreate);

    if (bookingsError) {
      await supabase
        .from('recurring_booking_series')
        .delete()
        .eq('id', seriesId);
      throw bookingsError;
    }

    for (const petId of series.pet_ids) {
      const bookingPetsData = bookingsToCreate.map(() => ({
        booking_id: seriesId,
        pet_id: petId,
      }));

      await supabase.from('booking_pets').insert(bookingPetsData);
    }

    await supabase
      .from('recurring_booking_series')
      .update({ occurrences_created: occurrences.length })
      .eq('id', seriesId);

    await supabase.from('notifications').insert([
      {
        pet_master_id: series.owner_id,
        type: 'recurring_created',
        title: 'Recurring Booking Created',
        message: `Your recurring booking series for ${series.service_name} has been created with ${occurrences.length} upcoming appointments.`,
        is_read: false,
      },
      {
        pet_master_id: series.provider_id,
        type: 'recurring_created',
        title: 'New Recurring Booking',
        message: `You have a new recurring booking series for ${series.service_name} starting on ${series.start_date}.`,
        is_read: false,
      },
    ]);

    return {
      success: true,
      seriesId,
    };
  } catch (error) {
    console.error('Error creating recurring series:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function cancelRecurringSeries(
  seriesId: string,
  cancelFutureOnly: boolean = true
): Promise<{ success: boolean; message: string }> {
  try {
    if (cancelFutureOnly) {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Recurring series cancelled by user',
        })
        .eq('recurring_series_id', seriesId)
        .gte('scheduled_date', new Date().toISOString())
        .in('status', ['pending', 'accepted']);

      if (bookingsError) throw bookingsError;
    } else {
      const { error: bookingsError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: 'Recurring series cancelled by user',
        })
        .eq('recurring_series_id', seriesId)
        .in('status', ['pending', 'accepted']);

      if (bookingsError) throw bookingsError;
    }

    const { error: seriesError } = await supabase
      .from('recurring_booking_series')
      .update({ is_active: false })
      .eq('id', seriesId);

    if (seriesError) throw seriesError;

    return {
      success: true,
      message: cancelFutureOnly
        ? 'Future bookings in this series have been cancelled'
        : 'All bookings in this series have been cancelled',
    };
  } catch (error) {
    console.error('Error cancelling recurring series:', error);
    return {
      success: false,
      message: 'Failed to cancel recurring series',
    };
  }
}

export async function getRecurringSeries(userId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('recurring_booking_series')
      .select(`
        *,
        bookings (
          id,
          status,
          scheduled_date,
          occurrence_number
        )
      `)
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching recurring series:', error);
    return [];
  }
}

export async function generateNextBookingsForSeries(
  seriesId: string
): Promise<{ success: boolean; created: number }> {
  try {
    const { data: series, error: seriesError } = await supabase
      .from('recurring_booking_series')
      .select('*')
      .eq('id', seriesId)
      .single();

    if (seriesError || !series || !series.is_active) {
      return { success: false, created: 0 };
    }

    const { count: existingCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('recurring_series_id', seriesId)
      .gte('scheduled_date', new Date().toISOString());

    if (existingCount && existingCount >= 10) {
      return { success: true, created: 0 };
    }

    const occurrences = generateOccurrences(series, 10 - (existingCount || 0));

    if (occurrences.length === 0) {
      return { success: true, created: 0 };
    }

    const bookingsToCreate = occurrences.map(occ => {
      const scheduledDate = new Date(`${occ.date}T${series.time_of_day}`);

      return {
        owner_id: series.owner_id,
        pet_master_id: series.provider_id,
        pet_id: series.pet_ids[0],
        pet_count: series.pet_ids.length,
        status: 'pending',
        scheduled_date: scheduledDate.toISOString(),
        booking_date: scheduledDate.toISOString(),
        duration_minutes: series.duration_minutes,
        pickup_latitude: series.pickup_latitude,
        pickup_longitude: series.pickup_longitude,
        pickup_address: series.pickup_address,
        total_amount: series.total_amount,
        total_price: series.total_amount,
        special_instructions: series.special_instructions,
        payment_status: 'pending',
        service_name: series.service_name,
        recurring_series_id: seriesId,
        is_recurring: true,
        occurrence_number: occ.occurrence_number,
      };
    });

    const { error: bookingsError } = await supabase
      .from('bookings')
      .insert(bookingsToCreate);

    if (bookingsError) throw bookingsError;

    await supabase
      .from('recurring_booking_series')
      .update({
        occurrences_created: series.occurrences_created + occurrences.length,
      })
      .eq('id', seriesId);

    return {
      success: true,
      created: occurrences.length,
    };
  } catch (error) {
    console.error('Error generating next bookings:', error);
    return { success: false, created: 0 };
  }
}
