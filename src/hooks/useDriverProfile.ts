
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleUserProfile } from '@/types/dashboard';
import { useToast } from '@/hooks/use-toast';

export const useDriverProfile = (userId: string | null) => {
  const [userProfile, setUserProfile] = useState<SimpleUserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!userId) return;

    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('drivers')
          .select('full_name, profile_photo_url')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          const profile: SimpleUserProfile = {
            full_name: data.full_name || '',
            profile_photo_url: data.profile_photo_url
          };
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, toast]);

  return { userProfile, loading };
};
