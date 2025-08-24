
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSmartPriceVisibility = () => {
  const [smartPriceEnabled, setSmartPriceEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSmartPriceSettings = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('smartprice_enabled')
          .single();

        setSmartPriceEnabled(data?.smartprice_enabled || false);
      } catch (error) {
        console.error('Failed to fetch SmartPrice settings:', error);
        setSmartPriceEnabled(false);
      } finally {
        setLoading(false);
      }
    };

    fetchSmartPriceSettings();

    // Listen for SmartPrice setting changes
    const channel = supabase
      .channel('smartprice_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings'
        },
        (payload) => {
          if (payload.new?.smartprice_enabled !== undefined) {
            setSmartPriceEnabled(payload.new.smartprice_enabled);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { smartPriceEnabled, loading };
};
