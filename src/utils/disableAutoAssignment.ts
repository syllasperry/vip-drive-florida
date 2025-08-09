
import { supabase } from "@/integrations/supabase/client";

// Utility function to ensure no automatic driver assignment happens
export const disableAutomaticDriverAssignment = async () => {
  console.log('🚫 Disabling automatic driver assignment...');
  
  // This function can be used if we need to clean up any automatically assigned drivers
  // that shouldn't have been assigned automatically
  
  try {
    // Get bookings that might have been auto-assigned
    const { data: autoAssignedBookings, error } = await supabase
      .from('bookings')
      .select('id, driver_id, status, created_at')
      .not('driver_id', 'is', null)
      .eq('status', 'pending');

    if (error) {
      console.error('Error checking auto-assigned bookings:', error);
      return;
    }

    console.log('📋 Found potentially auto-assigned bookings:', autoAssignedBookings?.length || 0);
    
    // Note: We won't automatically remove these assignments as they might be legitimate
    // The dispatcher will need to manually review and re-assign if needed
    
  } catch (error) {
    console.error('Error in disableAutomaticDriverAssignment:', error);
  }
};
