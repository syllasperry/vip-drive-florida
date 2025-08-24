
import { supabase } from '@/integrations/supabase/client';

export interface DiagnosticResult {
  component: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class SystemDiagnostics {
  async runFullSystemDiagnostic(): Promise<DiagnosticResult[]> {
    const results: DiagnosticResult[] = [];
    
    // 1. Authentication Check
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        results.push({
          component: 'authentication',
          status: 'error',
          message: 'User not authenticated',
          details: error
        });
      } else {
        results.push({
          component: 'authentication',
          status: 'success',
          message: `User authenticated: ${user.email}`
        });
      }
    } catch (error) {
      results.push({
        component: 'authentication',
        status: 'error',
        message: 'Authentication check failed',
        details: error
      });
    }

    // 2. Database Connection Test
    try {
      const { data, error } = await supabase.from('bookings').select('count').limit(1);
      if (error) {
        results.push({
          component: 'database_connection',
          status: 'error',
          message: 'Database connection failed',
          details: error
        });
      } else {
        results.push({
          component: 'database_connection',
          status: 'success',
          message: 'Database connection successful'
        });
      }
    } catch (error) {
      results.push({
        component: 'database_connection',
        status: 'error',
        message: 'Database test failed',
        details: error
      });
    }

    // 3. Passengers Table Check
    try {
      const { data, error } = await supabase.from('passengers').select('count').limit(1);
      if (error) {
        results.push({
          component: 'passengers_table',
          status: 'error',
          message: 'Passengers table access failed',
          details: error
        });
      } else {
        results.push({
          component: 'passengers_table',
          status: 'success',
          message: 'Passengers table accessible'
        });
      }
    } catch (error) {
      results.push({
        component: 'passengers_table',
        status: 'error',
        message: 'Passengers table test failed',
        details: error
      });
    }

    // 4. Drivers Table Check
    try {
      const { data, error } = await supabase.from('drivers').select('count').limit(1);
      if (error) {
        results.push({
          component: 'drivers_table',
          status: 'error',
          message: 'Drivers table access failed',
          details: error
        });
      } else {
        results.push({
          component: 'drivers_table',
          status: 'success',
          message: 'Drivers table accessible'
        });
      }
    } catch (error) {
      results.push({
        component: 'drivers_table',
        status: 'error',
        message: 'Drivers table test failed',
        details: error
      });
    }

    // 5. RLS Policies Check
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('passengers')
          .select('id, user_id')
          .eq('user_id', user.id);
        
        if (error) {
          results.push({
            component: 'rls_policies',
            status: 'error',
            message: 'RLS policies test failed',
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

  async checkPassengerProfile(): Promise<DiagnosticResult> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          component: 'passenger_profile',
          status: 'error',
          message: 'No authenticated user found'
        };
      }

      const { data: passenger, error } = await supabase
        .from('passengers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        return {
          component: 'passenger_profile',
          status: 'error',
          message: 'Error fetching passenger profile',
          details: error
        };
      }

      if (!passenger) {
        return {
          component: 'passenger_profile',
          status: 'warning',
          message: 'Passenger profile not found - will be created automatically'
        };
      }

      return {
        component: 'passenger_profile',
        status: 'success',
        message: `Passenger profile found: ${passenger.full_name}`,
        details: passenger
      };
    } catch (error) {
      return {
        component: 'passenger_profile',
        status: 'error',
        message: 'Passenger profile check failed',
        details: error
      };
    }
  }
}

export const systemDiagnostics = new SystemDiagnostics();
