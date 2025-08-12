
import { supabase } from './supabaseClient';

/**
 * Carrega TODOS os bookings já com os dados do passageiro (foto, nome e preferências)
 */
export const getAllBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passengers!inner(
        id,
        full_name,
        profile_photo_url,
        preferred_temperature,
        music_preference,
        interaction_preference,
        trip_purpose,
        additional_notes
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
  return data ?? [];
};

/**
 * Carrega bookings para o dispatcher com dados completos de passageiro e driver
 */
export const getDispatcherBookings = async () => {
  const { data, error } = await supabase
    .from('bookings')
    .select(`
      *,
      passengers (
        id, full_name, profile_photo_url, email, phone
      ),
      drivers (
        id, full_name, profile_photo_url, car_make, car_model, car_color, license_plate, phone
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) { 
    console.error('Error fetching dispatcher bookings:', error); 
    return []; 
  }
  return data || [];
};

/**
 * Escuta INSERT/UPDATE/DELETE em bookings.
 * Para INSERT/UPDATE, buscamos o registro completo (com join de passengers) antes de disparar o callback.
 */
export const listenForBookingChanges = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      async (payload) => {
        try {
          const id =
            (payload as any)?.new?.id ??
            (payload as any)?.old?.id;

          let enrichedNew = null;

          if ((payload as any).eventType === 'INSERT' || (payload as any).eventType === 'UPDATE') {
            const { data, error } = await supabase
              .from('bookings')
              .select(`
                *,
                passengers!inner(
                  id,
                  full_name,
                  profile_photo_url,
                  preferred_temperature,
                  music_preference,
                  interaction_preference,
                  trip_purpose,
                  additional_notes
                )
              `)
              .eq('id', id)
              .single();

            if (!error) {
              enrichedNew = data;
            } else {
              console.warn('Realtime enrich select error:', error);
            }
          }

          // Dispara o callback com o "new" enriquecido quando houver.
          callback({
            ...payload,
            new: enrichedNew ?? (payload as any).new,
          });
        } catch (e) {
          console.error('listenForBookingChanges enrich error:', e);
          // fallback: manda o payload original
          callback(payload);
        }
      }
    )
    .subscribe();

  // Return a cleanup function that properly unsubscribes
  return () => {
    supabase.removeChannel(channel);
  };
};
