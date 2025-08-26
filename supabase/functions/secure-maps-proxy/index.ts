
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced rate limiting with IP tracking
const rateLimitMap = new Map<string, { count: number; resetTime: number; violations: number }>();

function checkRateLimit(ip: string, maxRequests: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now();
  const key = `maps_${ip}`;
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs, violations: 0 });
    return true;
  }
  
  if (record.count >= maxRequests) {
    record.violations++;
    // Progressive penalties for repeated violations
    if (record.violations > 3) {
      record.resetTime = now + (windowMs * 3); // 3x longer penalty
    }
    return false;
  }
  
  record.count++;
  return true;
}

function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input type');
  }
  
  // Remove HTML tags and dangerous characters
  let sanitized = input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
    
  // Validate length
  if (sanitized.length < 2 || sanitized.length > 200) {
    throw new Error('Input length must be between 2 and 200 characters');
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /union\s+select/gi, /drop\s+table/gi, /delete\s+from/gi,
    /insert\s+into/gi, /update\s+set/gi, /exec\s*\(/gi
  ];
  
  for (const pattern of sqlPatterns) {
    if (pattern.test(sanitized)) {
      throw new Error('Invalid input detected');
    }
  }
  
  return sanitized;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Enhanced rate limiting
    if (!checkRateLimit(clientIP, 20, 60000)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please wait before making more requests.',
          retryAfter: 60 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          } 
        }
      );
    }

    // Parse request body safely
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { query, sessionToken } = requestBody;
    
    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and sanitize query
    let sanitizedQuery: string;
    try {
      sanitizedQuery = sanitizeInput(query);
    } catch (sanitizationError) {
      console.warn(`Input sanitization failed for IP ${clientIP}:`, sanitizationError.message);
      return new Response(
        JSON.stringify({ error: 'Invalid query format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google Maps API key from Supabase secrets
    const mapsApiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!mapsApiKey) {
      console.error('❌ Google Maps API key not configured in Supabase secrets');
      return new Response(
        JSON.stringify({ error: 'Maps service temporarily unavailable' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key format
    if (!mapsApiKey.startsWith('AIza') || mapsApiKey.length < 30) {
      console.error('❌ Invalid Google Maps API key format');
      return new Response(
        JSON.stringify({ error: 'Maps service configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enhanced request to Google Places API with security headers
    const googleMapsUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
    googleMapsUrl.searchParams.set('input', sanitizedQuery);
    googleMapsUrl.searchParams.set('key', mapsApiKey);
    googleMapsUrl.searchParams.set('types', 'geocode|establishment');
    googleMapsUrl.searchParams.set('components', 'country:us');
    
    // Add session token if provided for better caching
    if (sessionToken && typeof sessionToken === 'string') {
      googleMapsUrl.searchParams.set('sessiontoken', sessionToken.substring(0, 100));
    }

    console.log(`🔍 Maps API request from IP: ${clientIP}, Query: "${sanitizedQuery.substring(0, 50)}..."`);

    const mapsResponse = await fetch(googleMapsUrl.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VIP-Chauffeur-Service/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!mapsResponse.ok) {
      console.error(`Google Maps API error: ${mapsResponse.status} - ${mapsResponse.statusText}`);
      return new Response(
        JSON.stringify({ 
          error: 'External service temporarily unavailable',
          status: mapsResponse.status 
        }),
        { 
          status: 502, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await mapsResponse.json();
    
    // Validate response structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid response structure from Google Maps API');
      return new Response(
        JSON.stringify({ error: 'Invalid response from maps service' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful request
    console.log(`✅ Maps API success for IP: ${clientIP}, Results: ${data.predictions?.length || 0}`);
    
    // Return sanitized response
    return new Response(
      JSON.stringify({
        predictions: data.predictions || [],
        status: data.status
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // 5 minute cache
        } 
      }
    );

  } catch (error) {
    console.error('❌ Maps proxy error:', error);
    
    // Don't expose internal error details
    const errorMessage = error instanceof Error ? 
      'Service temporarily unavailable' : 
      'Internal server error';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
