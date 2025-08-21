
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { fetchMyPassengerProfile, createPassengerProfileFromAuth } from '@/lib/passenger/profile';
import { useToast } from '@/hooks/use-toast';

export const usePassengerAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check for passenger profile
          setTimeout(async () => {
            try {
              const profile = await fetchMyPassengerProfile();
              if (profile) {
                setHasProfile(true);
                console.log('✅ Passenger profile exists');
              } else {
                console.log('📝 No passenger profile, creating one...');
                await createPassengerProfileFromAuth();
                setHasProfile(true);
                toast({
                  title: "Welcome!",
                  description: "Your passenger profile has been created successfully.",
                });
              }
            } catch (error) {
              console.error('❌ Error checking/creating passenger profile:', error);
              setHasProfile(false);
            }
          }, 0);
        } else {
          setHasProfile(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchMyPassengerProfile()
          .then(profile => {
            setHasProfile(!!profile);
            if (!profile) {
              // Create profile if it doesn't exist
              createPassengerProfileFromAuth()
                .then(() => setHasProfile(true))
                .catch(console.error);
            }
          })
          .catch(console.error);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setHasProfile(false);
      
      // Force page refresh for clean state
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    user,
    session,
    loading,
    hasProfile,
    signOut,
    isAuthenticated: !!user
  };
};
