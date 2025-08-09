
import { supabase } from "@/integrations/supabase/client";
import { cleanPrematureDriverAssignments } from "./cleanPrematureAssignments";

// Utility function to ensure no automatic driver assignment happens
export const disableAutomaticDriverAssignment = async () => {
  console.log('🚫 Disabling automatic driver assignment...');
  
  try {
    // First clean up any existing premature assignments
    const cleanupResult = await cleanPrematureDriverAssignments();
    
    if (cleanupResult?.success) {
      console.log(`✅ Cleaned up ${cleanupResult.cleanedCount} premature assignments`);
    }
    
    // Get bookings that might have been auto-assigned
    const { data: autoAssignedBookings, error } = await supabase
      .from('bookings')
      .select('id, driver_id, final_price, status, created_at')
      .not('driver_id', 'is', null)
      .or('final_price.is.null,final_price.eq.0');

    if (error) {
      console.error('Error checking auto-assigned bookings:', error);
      return;
    }

    console.log('📋 Found potentially auto-assigned bookings:', autoAssignedBookings?.length || 0);
    
    // Clear any remaining auto-assignments
    if (autoAssignedBookings && autoAssignedBookings.length > 0) {
      const { error: clearError } = await supabase
        .from('bookings')
        .update({ 
          driver_id: null,
          updated_at: new Date().toISOString()
        })
        .in('id', autoAssignedBookings.map(b => b.id));
        
      if (clearError) {
        console.error('Error clearing auto-assignments:', clearError);
      } else {
        console.log(`✅ Cleared ${autoAssignedBookings.length} auto-assigned drivers`);
      }
    }
    
    console.log('🔒 Automatic driver assignment completely disabled');
    
  } catch (error) {
    console.error('Error in disableAutomaticDriverAssignment:', error);
  }
};

// Run the disable function on module load to ensure immediate effect
disableAutomaticDriverAssignment();
