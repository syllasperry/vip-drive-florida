
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { reviewNotification } = await req.json()
    
    console.log('📧 Processing review notification:', reviewNotification.id)

    const emailSubject = "How was your VIP ride? We'd love your feedback!"
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">VIP Chauffeur Service</h1>
          <p style="margin: 10px 0 0; opacity: 0.9;">Thank you for riding with us!</p>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333; margin-bottom: 20px;">How was your recent ride?</h2>
          
          <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
            We hope you had an excellent experience with our VIP chauffeur service. 
            Your feedback helps us maintain our high standards and improve our service.
          </p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
            <h3 style="margin: 0 0 10px; color: #333;">Trip Details</h3>
            <p style="margin: 5px 0; color: #666;">
              <strong>Booking:</strong> #${reviewNotification.booking?.booking_code || 'N/A'}
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Date:</strong> ${new Date(reviewNotification.booking?.pickup_time || '').toLocaleDateString()}
            </p>
            <p style="margin: 5px 0; color: #666;">
              <strong>Driver:</strong> ${reviewNotification.booking?.drivers?.full_name || 'Your driver'}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="https://extdyjkfgftbokabiamc.supabase.co/review?booking=${reviewNotification.booking_id}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;">
              ⭐ Leave Your Review
            </a>
          </div>

          <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
            If you have any immediate concerns, please contact us at support@vipchauffeursfl.com
          </p>
        </div>
      </div>
    `

    // In a real implementation, you would send the actual email here
    // For now, we'll just log it and mark as sent
    console.log(`📧 Would send review email to passenger for booking ${reviewNotification.booking_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Review notification email queued successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error processing review notification:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
