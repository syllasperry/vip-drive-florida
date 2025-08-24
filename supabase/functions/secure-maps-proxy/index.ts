
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google Maps API key from Supabase secrets (NOT hardcoded)
    const mapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!mapsApiKey) {
      console.error('❌ Google Maps API key not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ error: 'Maps service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize query to prevent injection attacks
    const sanitizedQuery = query.replace(/[^\w\s,-]/g, '').trim();
    if (sanitizedQuery.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid query format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Proxy request to Google Places API with rate limiting
    const mapsResponse = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(sanitizedQuery)}&key=${mapsApiKey}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!mapsResponse.ok) {
      throw new Error(`Google Maps API error: ${mapsResponse.status}`);
    }

    const data = await mapsResponse.json();
    
    return new Response(
      JSON.stringify(data),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Maps proxy error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
