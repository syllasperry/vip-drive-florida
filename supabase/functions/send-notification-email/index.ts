
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationEmailRequest {
  type: string;
  bookingId: string;
  recipientId: string;
  recipientType: 'passenger' | 'driver' | 'dispatcher';
  title: string;
  message: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { type, bookingId, recipientId, recipientType, title, message, metadata } = await req.json() as NotificationEmailRequest
    
    console.log('📧 Processing notification email:', { type, bookingId, recipientType })

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        passengers(*),
        drivers(*)
      `)
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      throw new Error(`Failed to fetch booking: ${bookingError?.message}`)
    }

    let emailContent = ''
    let subject = title
    let recipientEmail = ''

    // Get recipient email
    if (recipientType === 'passenger') {
      recipientEmail = booking.passengers?.email || booking.passenger_email || ''
    } else if (recipientType === 'driver') {
      recipientEmail = booking.drivers?.email || ''
    }

    if (!recipientEmail) {
      throw new Error(`No email found for ${recipientType}`)
    }

    // Generate email content based on type
    switch (type) {
      case 'offer_sent':
        emailContent = generateOfferEmail(booking, metadata)
        subject = `VIP Ride Offer - $${(booking.final_price_cents / 100).toFixed(2)}`
        break
      
      case 'payment_required':
        emailContent = generatePaymentRequiredEmail(booking)
        subject = 'Complete Your VIP Ride Payment'
        break
      
      case 'all_set':
        if (recipientType === 'passenger') {
          emailContent = generatePassengerAllSetEmail(booking)
          subject = 'Your VIP Ride is Confirmed!'
        } else if (recipientType === 'driver') {
          emailContent = generateDriverAssignmentEmail(booking, metadata)
          subject = 'New VIP Ride Assignment'
        }
        break
      
      case 'cancelled':
        emailContent = generateCancellationEmail(booking, recipientType)
        subject = 'VIP Ride Cancelled'
        break
      
      case 'review_request':
        emailContent = generateReviewRequestEmail(booking)
        subject = 'How was your VIP ride? Share your experience'
        break
      
      default:
        emailContent = generateGenericEmail(booking, message)
    }

    // Log the email (in production, you would send via email service)
    console.log(`📧 Would send email to ${recipientEmail}:`, {
      subject,
      type,
      bookingCode: booking.booking_code
    })

    // In a real implementation, you would send the actual email here
    // For now, we'll just log it and return success
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notification queued successfully',
        recipientEmail,
        subject
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error sending notification email:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateOfferEmail(booking: any, metadata: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">VIP Chauffeur Service</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Your ride offer is ready</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Ride Offer Details</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 5px 0; color: #666;">
            <strong>Booking:</strong> #${booking.booking_code || 'N/A'}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>From:</strong> ${booking.pickup_location}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>To:</strong> ${booking.dropoff_location}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Date:</strong> ${new Date(booking.pickup_time).toLocaleDateString()}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Time:</strong> ${new Date(booking.pickup_time).toLocaleTimeString()}
          </p>
          <p style="margin: 5px 0; color: #333; font-size: 18px;">
            <strong>Total Price: $${(booking.final_price_cents / 100).toFixed(2)}</strong>
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://extdyjkfgftbokabiamc.supabase.co/passenger/dashboard" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: bold;
                    display: inline-block;">
            💳 Complete Payment
          </a>
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">
          Complete payment to confirm your ride. If you have any questions, contact us at support@vipchauffeursfl.com
        </p>
      </div>
    </div>
  `
}

function generatePaymentRequiredEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Payment Required</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Complete your booking</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Complete Your Payment</h2>
        <p>Your VIP ride is waiting for payment confirmation.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://extdyjkfgftbokabiamc.supabase.co/passenger/dashboard" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: bold;
                    display: inline-block;">
            💳 Pay Now
          </a>
        </div>
      </div>
    </div>
  `
}

function generatePassengerAllSetEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">✅ Ride Confirmed!</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Your driver has been assigned</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Your VIP Ride Details</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ade80;">
          <p style="margin: 5px 0; color: #666;">
            <strong>Driver:</strong> ${booking.drivers?.full_name || 'Your driver'}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Phone:</strong> ${booking.drivers?.phone || 'Will be provided'}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Vehicle:</strong> ${booking.drivers?.car_make} ${booking.drivers?.car_model} (${booking.drivers?.car_color})
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>License Plate:</strong> ${booking.drivers?.license_plate || 'TBD'}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://extdyjkfgftbokabiamc.supabase.co/passenger/dashboard" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: bold;
                    display: inline-block;">
            📱 Track Your Ride
          </a>
        </div>
      </div>
    </div>
  `
}

function generateDriverAssignmentEmail(booking: any, metadata: any): string {
  const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(booking.pickup_location)}`
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(booking.pickup_location)}`
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(booking.pickup_location)}`

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🚗 New Assignment</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">You have a new VIP ride</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Ride Details</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4ade80;">
          <p style="margin: 5px 0; color: #666;">
            <strong>Passenger:</strong> ${booking.passengers?.full_name}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Phone:</strong> ${booking.passengers?.phone}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Pickup:</strong> ${booking.pickup_location}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Dropoff:</strong> ${booking.dropoff_location}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Time:</strong> ${new Date(booking.pickup_time).toLocaleString()}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p style="margin-bottom: 15px; color: #333; font-weight: bold;">Start Navigation:</p>
          
          <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <a href="${googleMapsUrl}" 
               style="background: #4285f4; 
                      color: white; 
                      padding: 10px 20px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;
                      margin: 5px;">
              📍 Google Maps
            </a>
            
            <a href="${appleMapsUrl}" 
               style="background: #007aff; 
                      color: white; 
                      padding: 10px 20px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;
                      margin: 5px;">
              🗺️ Apple Maps
            </a>
            
            <a href="${wazeUrl}" 
               style="background: #00d4d4; 
                      color: white; 
                      padding: 10px 20px; 
                      text-decoration: none; 
                      border-radius: 6px; 
                      font-weight: bold;
                      display: inline-block;
                      margin: 5px;">
              🚗 Waze
            </a>
          </div>
        </div>

        ${booking.passengers?.additional_notes ? `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <p style="margin: 0; color: #856404;">
            <strong>Passenger Notes:</strong> ${booking.passengers.additional_notes}
          </p>
        </div>
        ` : ''}
      </div>
    </div>
  `
}

function generateCancellationEmail(booking: any, recipientType: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">Ride Cancelled</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Booking #${booking.booking_code}</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <p>Your VIP ride has been cancelled. If you have any questions, please contact us at support@vipchauffeursfl.com</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://extdyjkfgftbokabiamc.supabase.co/${recipientType}/dashboard" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 6px; 
                    font-weight: bold;
                    display: inline-block;">
            📱 Go to Dashboard
          </a>
        </div>
      </div>
    </div>
  `
}

function generateReviewRequestEmail(booking: any): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">How was your ride?</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Share your experience</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <h2 style="color: #333; margin-bottom: 20px;">Rate Your VIP Experience</h2>
        
        <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
          We hope you had an excellent experience with our VIP chauffeur service. 
          Your feedback helps us maintain our high standards and improve our service.
        </p>

        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <h3 style="margin: 0 0 10px; color: #333;">Trip Details</h3>
          <p style="margin: 5px 0; color: #666;">
            <strong>Booking:</strong> #${booking.booking_code || 'N/A'}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Date:</strong> ${new Date(booking.pickup_time).toLocaleDateString()}
          </p>
          <p style="margin: 5px 0; color: #666;">
            <strong>Driver:</strong> ${booking.drivers?.full_name || 'Your driver'}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://extdyjkfgftbokabiamc.supabase.co/review?booking=${booking.id}" 
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
      </div>
    </div>
  `
}

function generateGenericEmail(booking: any, message: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">VIP Chauffeur Service</h1>
        <p style="margin: 10px 0 0; opacity: 0.9;">Ride Update</p>
      </div>
      
      <div style="padding: 30px; background: #f8f9fa;">
        <p style="color: #666; line-height: 1.6;">${message}</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 5px 0; color: #666;">
            <strong>Booking:</strong> #${booking.booking_code || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  `
}
