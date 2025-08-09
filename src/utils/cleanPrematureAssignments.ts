
import { supabase } from "@/integrations/supabase/client";

/**
 * Cleans up any premature driver assignments where:
 * - driver_id exists but final_price is null or 0
 * - This indicates auto-assignment rather than manual dispatcher assignment
 */
export const cleanPrematureDriverAssignments = async () => {
  console.log('🧹 Starting cleanup of premature driver assignments...');
  
  try {
    // First, get bookings with premature assignments
    const { data: prematureBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id, driver_id, final_price')
      .not('driver_id', 'is', null)
      .or('final_price.is.null,final_price.eq.0');

    if (fetchError) {
      console.error('❌ Error fetching premature assignments:', fetchError);
      return;
    }

    if (!prematureBookings || prematureBookings.length === 0) {
      console.log('✅ No premature driver assignments found');
      return;
    }

    console.log(`📋 Found ${prematureBookings.length} bookings with premature driver assignments`);

    // Clear the premature assignments
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        driver_id: null,
        updated_at: new Date().toISOString()
      })
      .not('driver_id', 'is', null)
      .or('final_price.is.null,final_price.eq.0');

    if (updateError) {
      console.error('❌ Error cleaning premature assignments:', updateError);
      return;
    }

    console.log(`✅ Successfully cleaned ${prematureBookings.length} premature driver assignments`);
    
    return {
      success: true,
      cleanedCount: prematureBookings.length
    };
    
  } catch (error) {
    console.error('❌ Error in cleanPrematureDriverAssignments:', error);
    return {
      success: false,
      error: error
    };
  }
};
