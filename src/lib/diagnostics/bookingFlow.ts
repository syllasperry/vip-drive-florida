
import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  component: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class BookingFlowDiagnostics {
  async runFullDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // 1. Auth/Session Check
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        results.push({
          component: 'auth',
          status: 'error',
          message: 'User not authenticated',
          details: error
        });
      } else {
        results.push({
          component: 'auth',
          status: 'success',
          message: `User authenticated: ${user.email}`
        });
      }
    } catch (error) {
      results.push({
        component: 'auth',
        status: 'error',
        message: 'Auth check failed',
        details: error
      });
    }

    // 2. Database Connection Test
    try {
      const { data, error } = await supabase.from('bookings').select('count').limit(1);
      if (error) {
        results.push({
          component: 'database',
          status: 'error',
          message: 'Database connection failed',
          details: error
        });
      } else {
        results.push({
          component: 'database',
          status: 'success',
          message: 'Database connection successful'
        });
      }
    } catch (error) {
      results.push({
        component: 'database',
        status: 'error',
        message: 'Database test failed',
        details: error
      });
    }

    // 3. Passenger Profile Check
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: passenger, error } = await supabase
          .from('passengers')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error) {
          results.push({
            component: 'passenger_profile',
            status: 'error',
            message: 'Passenger profile check failed',
            details: error
          });
        } else if (!passenger) {
          results.push({
            component: 'passenger_profile',
            status: 'warning',
            message: 'No passenger profile found for user'
          });
        } else {
          results.push({
            component: 'passenger_profile',
            status: 'success',
            message: `Passenger profile found: ${passenger.full_name}`
          });
        }
      }
    } catch (error) {
      results.push({
        component: 'passenger_profile',
        status: 'error',
        message: 'Passenger profile diagnostic failed',
        details: error
      });
    }

    // 4. RLS Policy Test
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Test if we can read from passengers table
        const { data, error } = await supabase
          .from('passengers')
          .select('id, user_id')
          .eq('user_id', user.id);
        
        if (error) {
          results.push({
            component: 'rls_policies',
            status: 'error',
            message: 'RLS policy test failed',
            details: error
          });
        } else {
          results.push({
            component: 'rls_policies',
            status: 'success',
            message: `RLS policies working - found ${data?.length || 0} passenger records`
          });
        }
      }
    } catch (error) {
      results.push({
        component: 'rls_policies',
        status: 'error',
        message: 'RLS diagnostic failed',
        details: error
      });
    }

    return results;
  }

  async testBookingCreation(bookingData: any): Promise<DiagnosticResult> {
    try {
      console.log('🔍 Testing booking creation with data:', bookingData);
      
      const { data: newBooking, error } = await supabase
        .from('bookings')
        .insert([bookingData])
        .select()
        .single();

      if (error) {
        return {
          component: 'booking_creation',
          status: 'error',
          message: 'Booking creation test failed',
          details: {
            error,
            attemptedData: bookingData
          }
        };
      }

      return {
        component: 'booking_creation',
        status: 'success',
        message: 'Booking creation test successful',
        details: newBooking
      };
    } catch (error) {
      return {
        component: 'booking_creation',
        status: 'error',
        message: 'Booking creation test exception',
        details: error
      };
    }
  }
}

export const bookingDiagnostics = new BookingFlowDiagnostics();
