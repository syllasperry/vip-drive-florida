
import { supabase } from '@/integrations/supabase/client';

export interface PassengerProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export async function fetchMyPassengerProfile(): Promise<PassengerProfile | null> {
  try {
    console.log('🔄 Fetching passenger profile...');
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return null;
    }

    console.log('✅ User authenticated:', user.id);

    // Try to get existing passenger profile first
    const { data: existingProfile, error: fetchError } = await supabase
      .from('passengers')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ Error fetching passenger profile:', fetchError);
      return null;
    }

    if (existingProfile) {
      console.log('✅ Passenger profile found:', existingProfile);
      return existingProfile;
    }

    // If no profile exists, create one using user's email as name
    const userEmail = user.email || 'Passenger';
    const { data: newProfile, error: createError } = await supabase
      .from('passengers')
      .insert({
        user_id: user.id,
        full_name: userEmail,
        email: user.email,
        phone: null,
        profile_photo_url: null
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating passenger profile:', createError);
      return null;
    }

    console.log('✅ Passenger profile created:', newProfile);
    return newProfile;

  } catch (error) {
    console.error('❌ Unexpected error in fetchMyPassengerProfile:', error);
    return null;
  }
}

export async function updateMyPassengerProfile(updates: Partial<PassengerProfile>): Promise<PassengerProfile | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('passengers')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating passenger profile:', error);
      throw error;
    }

    console.log('✅ Passenger profile updated:', data);
    return data;
  } catch (error) {
    console.error('❌ Error in updateMyPassengerProfile:', error);
    throw error;
  }
}
