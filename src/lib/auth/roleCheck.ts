
import { supabase } from "@/integrations/supabase/client";

export type UserRole = 'admin' | 'dispatcher' | 'driver' | 'passenger';

/**
 * Secure function to check if current user has a specific role
 * Uses the database function instead of hardcoded checks
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('has_role', {
      _user_id: (await supabase.auth.getUser()).data.user?.id,
      _role: role
    });

    if (error) {
      console.error('Error checking user role:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Unexpected error checking role:', error);
    return false;
  }
}

/**
 * Check if current user is a dispatcher using secure database function
 */
export async function isDispatcher(): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_dispatcher');

    if (error) {
      console.error('Error checking dispatcher status:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Unexpected error checking dispatcher status:', error);
    return false;
  }
}

/**
 * Check if an email belongs to a registered dispatcher
 */
export async function isDispatcherEmail(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('is_dispatcher_email', {
      email_to_check: email
    });

    if (error) {
      console.error('Error checking dispatcher email:', error);
      return false;
    }

    return data || false;
  } catch (error) {
    console.error('Unexpected error checking dispatcher email:', error);
    return false;
  }
}

/**
 * Get current user's roles
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return [];

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.user.id);

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data.map(r => r.role) || [];
  } catch (error) {
    console.error('Unexpected error fetching roles:', error);
    return [];
  }
}
