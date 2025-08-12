import { supabase } from './supabaseClient';
import { normalizeBookingStatus } from '@/utils/statusHelpers';

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
 * Helper function to normalize status values to valid booking_status enum values
 */
const normalizeBookingStatus = (status: string | null | undefined): string => {
  if (!status) return 'pending';
  
  // Map common status values to valid enum values
  const statusMap: Record<string, string> = {
    'booking_requested': 'pending',
    'driver_assigned': 'pending',
    'assigned': 'pending',
    'assigned_by_dispatcher': 'pending',
    'offer_sent': 'offer_sent',
    'price_awaiting_acceptance': 'offer_sent',
    'payment_pending': 'payment_pending',
    'passenger_paid': 'payment_pending',
    'all_set': 'all_set',
    'completed': 'completed',
    'cancelled': 'cancelled',
    'cancelled_by_driver': 'cancelled',
    'cancelled_by_passenger': 'cancelled'
  };
  
  return statusMap[status] || status;
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
  
  // Garantir que driver_id está ausente do payload e normalizar status
  const { driver_id: _ignore, ...cleanPayload } = bookingData;
  
  // Normalize status to valid enum value
  if (cleanPayload.status) {
    cleanPayload.status = normalizeBookingStatus(cleanPayload.status);
  }
  
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
 * Helper function to get booking by ID with debug logging
 */
export const getBookingById = async (bookingId: string) => {
  console.log('[DEBUG_BOOKING_ID]', bookingId);
  
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle(); // não explode se não achar

  if (error) {
    console.error('[SEND_OFFER] select by id failed:', error);
    throw error;
  }

  return data; // pode ser null
};

/**
 * Helper function to create status history entry
 */
export const createStatusHistoryEntry = async (params: {
  bookingId: string;
  status: string;
  updatedBy?: string;
  role?: string;
  metadata?: any;
}) => {
  const { bookingId, status, updatedBy, role, metadata } = params;

  console.log('📝 Creating status history entry:', { bookingId, status, role });

  try {
    const { data, error } = await supabase
      .from('booking_status_history')
      .insert({
        booking_id: bookingId,
        status: normalizeBookingStatus(status),
        updated_by: updatedBy,
        role: role || 'system',
        metadata: metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating status history:', error);
      throw error;
    }

    console.log('✅ Status history entry created:', data);
    return data;
  } catch (error) {
    console.error('❌ Failed to create status history entry:', error);
    throw error;
  }
};

/**
 * Atomic function to send offer with proper validation and status normalization
 */
export const sendOfferAtomic = async (params: {
  bookingId: string;
  driverId: string;
  price: number;
}) => {
  const { bookingId, driverId, price } = params;

  console.log('[SEND_OFFER] start', { bookingId, driverId, price });

  // 1) Confirma existência
  const existing = await getBookingById(bookingId);
  if (!existing) {
    console.warn('[BOOKING_NOT_FOUND_IN_DB]', bookingId);
    return { data: null, error: { message: 'Booking not found in database' } };
  }

  // 2) Update atômico (uma operação) with normalized status
  const updateData = {
    driver_id: driverId,
    final_price: price,
    status: normalizeBookingStatus('payment_pending'),
    updated_at: new Date().toISOString(),
  };

  const { data: updatedBooking, error: updateError } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)
    .select('*')
    .maybeSingle(); // se políticas retornarem 0 linhas, não explode

  if (updateError) {
    console.error('[RLS_BLOCK or UPDATE_ERROR]', updateError);
    return { data: null, error: updateError };
  }

  if (!updatedBooking) {
    // Pode acontecer se RLS impedir o retorno da linha.
    console.warn('[SEND_OFFER] update returned no row (RLS?)');
    return { data: null, error: { message: 'Update executed but no row returned (RLS?)' } };
  }

  // 3) Create status history entry
  try {
    await createStatusHistoryEntry({
      bookingId,
      status: 'payment_pending',
      updatedBy: driverId,
      role: 'driver',
      metadata: {
        final_price: price,
        previous_status: existing.status
      }
    });
  } catch (historyError) {
    console.warn('⚠️ Status history creation failed:', historyError);
    // Don't fail the entire operation for history logging
  }

  console.log('[SEND_OFFER] success', updatedBooking);
  return { data: updatedBooking, error: null };
};

/**
 * Send offer with driver assignment - UPDATED TO USE ATOMIC FUNCTION
 * Atualiza booking e registra no histórico em uma operação atômica
 */
export const sendOffer = async (
  bookingId: string, 
  driverId: string, 
  price: number, 
  dispatcherId?: string
) => {
  console.log('[SEND_OFFER] payload', { bookingId, driverId, finalPrice: price });

  // Validação básica
  if (!bookingId || !driverId || !Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid offer parameters');
  }

  try {
    // Usar função atômica com validação
    const result = await sendOfferAtomic({
      bookingId,
      driverId,
      price
    });

    if (result.error) {
      console.log('[SEND_OFFER] result', { data: null, error: result.error });
      throw new Error(result.error.message || 'Failed to send offer');
    }

    console.log('[SEND_OFFER] result', { data: result.data, error: null });
    return result.data;

  } catch (error) {
    console.error('[SEND_OFFER] Transaction failed:', error);
    throw error;
  }
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
