
import { supabase } from './supabaseClient';

/**
 * Carrega TODOS os bookings já com os dados do passageiro (foto, nome e preferências)
 * GUARD: Esta função é APENAS para leitura - nunca atribui driver_id
 */
export const getAllBookings = async () => {
  console.log('[DISPATCHER LOAD] fetching all bookings...');
  
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
  
  console.log('[DISPATCHER LOAD] bookings loaded:', data?.length || 0);
  console.log('[AUTO-ASSIGN GUARD] getAllBookings completed - NO auto-assignment performed');
  return data ?? [];
};

/**
 * Carrega bookings para o dispatcher com dados completos de passageiro e driver
 * CRÍTICO: SOMENTE SELECT - ZERO auto-assign - NUNCA toca em driver_id
 */
export const getDispatcherBookings = async () => {
  console.log('[DISPATCHER LOAD] fetching dispatcher bookings...');
  
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
  
  console.log('[DISPATCHER LOAD] bookings loaded:', data?.length || 0);
  console.log('[AUTO-ASSIGN GUARD] dispatcher load completed - NO auto-assignment performed');
  
  return data || [];
};

/**
 * Função para criar booking - CRÍTICO: driver_id NUNCA é incluído na criação
 */
export const createBooking = async (bookingData: any) => {
  console.log('[GUARD] createBooking called with payload:', bookingData);
  
  // SECURITY GUARD: Verificar se driver_id está sendo enviado na criação
  if ('driver_id' in bookingData && bookingData.driver_id) {
    console.error('[GUARD] BLOCKED: driver_id found in create payload:', bookingData.driver_id);
    throw new Error('GUARD: driver_id must be null on create');
  }
  
  // Garantir que driver_id está ausente do payload
  const { driver_id: _ignore, ...cleanPayload } = bookingData;
  
  console.log('[GUARD] Clean payload for booking creation (driver_id removed):', cleanPayload);
  
  const { data, error } = await supabase
    .from('bookings')
    .insert(cleanPayload)
    .select()
    .single();

  if (error) {
    console.error('[GUARD] Error creating booking:', error);
    throw error;
  }

  console.log('[GUARD] Booking created successfully without driver_id:', data);
  return data;
};

/**
 * Escuta INSERT/UPDATE/DELETE em bookings.
 * Para INSERT/UPDATE, buscamos o registro completo (com join de passengers) antes de disparar o callback.
 * IMPORTANTE: ZERO auto-assign aqui - apenas notificação de mudanças
 */
export const listenForBookingChanges = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('bookings-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      async (payload) => {
        try {
          console.log('[AUTO-ASSIGN GUARD] booking change detected - listening only, NO auto-assignment');
          
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
