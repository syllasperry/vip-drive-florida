import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  bookingId: string;
  status: string;
  triggerType: 'status_change' | 'new_booking';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bookingId, status, triggerType }: BookingNotificationRequest = await req.json();

    console.log(`Processing ${triggerType} notification for booking ${bookingId} with status ${status}`);

    // Fetch booking details with passenger and driver info
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(`
        *,
        passenger:passengers(full_name, email),
        driver:drivers(full_name, email, car_make, car_model)
      `)
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Error fetching booking:', bookingError);
      throw new Error('Booking not found');
    }

    console.log('Booking details:', booking);

    if (!resend) {
      console.warn('RESEND_API_KEY not configured, skipping email notifications');
      return new Response(
        JSON.stringify({ success: true, message: 'Booking updated successfully (email notifications disabled)' }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const dashboardUrl = `https://7e830e49-c9ab-402a-82b9-2f0f8fa7d484.lovableproject.com`;

    // Send emails based on status and trigger type
    await sendNotificationEmails(booking, status, triggerType, dashboardUrl);

    return new Response(
      JSON.stringify({ success: true, message: 'Notifications sent successfully' }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-booking-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

async function sendNotificationEmails(booking: any, status: string, triggerType: string, dashboardUrl: string) {
  const passenger = booking.passengers || booking.passenger;
  const driver = booking.drivers || booking.driver;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!resend) {
    console.log('RESEND_API_KEY not configured, skipping email sending');
    return;
  }

  switch (status) {
    case 'pending':
      // Send confirmation to passenger
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [passenger.email],
        subject: "Your ride request has been sent!",
        html: `
          <h1>Hi ${passenger.full_name},</h1>
          <p>Your ride request has been submitted and is now waiting for a driver to respond.</p>
          <p>We'll notify you as soon as your request is accepted or declined.</p>
          
          <h3>Ride Details:</h3>
          <ul>
            <li><strong>Pickup:</strong> ${booking.pickup_location}</li>
            <li><strong>Dropoff:</strong> ${booking.dropoff_location}</li>
            <li><strong>Date:</strong> ${formatDate(booking.pickup_time)}</li>
            <li><strong>Time:</strong> ${formatTime(booking.pickup_time)}</li>
            <li><strong>Passengers:</strong> ${booking.passenger_count}</li>
            ${booking.vehicle_type ? `<li><strong>Vehicle:</strong> ${booking.vehicle_type}</li>` : ''}
          </ul>

          <p><a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View My Ride Status</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });
      break;

    case 'price_proposed':
      // Send notification to passenger about fare proposal
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [passenger.email],
        subject: "Driver has proposed a fare for your ride",
        html: `
          <h1>Hi ${passenger.full_name},</h1>
          <p>Good news! Your driver ${driver.full_name} has accepted your ride request and proposed a fare.</p>
          <p><strong>Proposed Fare: $${booking.final_price?.toFixed(2)}</strong></p>
          <p>You have 1 hour to accept or decline this fare. Please respond quickly to secure your ride.</p>
          
          <h3>Ride Details:</h3>
          <ul>
            <li><strong>Driver:</strong> ${driver.full_name}</li>
            <li><strong>Pickup:</strong> ${booking.pickup_location}</li>
            <li><strong>Dropoff:</strong> ${booking.dropoff_location}</li>
            <li><strong>Date:</strong> ${formatDate(booking.pickup_time)}</li>
            <li><strong>Time:</strong> ${formatTime(booking.pickup_time)}</li>
            ${driver.car_make && driver.car_model ? `<li><strong>Vehicle:</strong> ${driver.car_make} ${driver.car_model}</li>` : ''}
          </ul>

          <p><a href="${dashboardUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept or Decline Fare</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });
      break;

    case 'accepted':
      // Send notification to passenger
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [passenger.email],
        subject: "Your ride has been accepted!",
        html: `
          <h1>Great news, ${passenger.full_name}!</h1>
          <p>Your ride request was accepted by ${driver.full_name}.</p>
          <p>Please be ready at your pickup location by ${formatTime(booking.pickup_time)}.</p>
          
          <h3>Driver & Vehicle Details:</h3>
          <ul>
            <li><strong>Driver:</strong> ${driver.full_name}</li>
            ${driver.car_make && driver.car_model ? `<li><strong>Vehicle:</strong> ${driver.car_make} ${driver.car_model}</li>` : ''}
          </ul>

          <h3>Ride Details:</h3>
          <ul>
            <li><strong>Pickup:</strong> ${booking.pickup_location}</li>
            <li><strong>Dropoff:</strong> ${booking.dropoff_location}</li>
            <li><strong>Date:</strong> ${formatDate(booking.pickup_time)}</li>
            <li><strong>Time:</strong> ${formatTime(booking.pickup_time)}</li>
          </ul>

          <p><a href="${dashboardUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Track My Ride</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });

      // Send confirmation to driver
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [driver.email],
        subject: "You've accepted the ride – Let's go!",
        html: `
          <h1>Hi ${driver.full_name},</h1>
          <p>You've accepted the ride request from ${passenger.full_name}.</p>
          <p>Please make your way to the pickup location by ${formatTime(booking.pickup_time)}.</p>
          
          <h3>Ride Details:</h3>
          <ul>
            <li><strong>Passenger:</strong> ${passenger.full_name}</li>
            <li><strong>Pickup:</strong> ${booking.pickup_location}</li>
            <li><strong>Dropoff:</strong> ${booking.dropoff_location}</li>
            <li><strong>Date:</strong> ${formatDate(booking.pickup_time)}</li>
            <li><strong>Time:</strong> ${formatTime(booking.pickup_time)}</li>
            <li><strong>Passengers:</strong> ${booking.passenger_count}</li>
          </ul>

          <p><a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to My Dashboard</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });
      break;

    case 'declined':
      // Send notification to passenger
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [passenger.email],
        subject: "Ride request declined",
        html: `
          <h1>Hi ${passenger.full_name},</h1>
          <p>Unfortunately, the driver wasn't able to accept your request.</p>
          <p>You can submit a new request anytime.</p>
          
          <p><a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Make Another Request</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });
      break;

    case 'rejected_by_passenger':
      // Send notification to driver
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [driver.email],
        subject: "Passenger declined your fare proposal",
        html: `
          <h1>Hi ${driver.full_name},</h1>
          <p>The passenger ${passenger.full_name} has declined your fare proposal of $${booking.final_price?.toFixed(2)}.</p>
          <p>You can view other available ride requests in your dashboard.</p>
          
          <p><a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });
      break;

    case 'payment_confirmed':
      // Send notifications to both passenger and driver
      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [passenger.email],
        subject: "Payment confirmed - Your ride is confirmed!",
        html: `
          <h1>Hi ${passenger.full_name},</h1>
          <p>Great! You've accepted the fare and your ride is now confirmed.</p>
          <p><strong>Final Price: $${booking.final_price?.toFixed(2)}</strong></p>
          <p>Please proceed with payment to complete your booking.</p>
          
          <h3>Ride Details:</h3>
          <ul>
            <li><strong>Driver:</strong> ${driver.full_name}</li>
            <li><strong>Pickup:</strong> ${booking.pickup_location}</li>
            <li><strong>Dropoff:</strong> ${booking.dropoff_location}</li>
            <li><strong>Date:</strong> ${formatDate(booking.pickup_time)}</li>
            <li><strong>Time:</strong> ${formatTime(booking.pickup_time)}</li>
            ${driver.car_make && driver.car_model ? `<li><strong>Vehicle:</strong> ${driver.car_make} ${driver.car_model}</li>` : ''}
          </ul>

          <p><a href="${dashboardUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Complete Payment</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });

      await resend.emails.send({
        from: "Ride Service <notifications@resend.dev>",
        to: [driver.email],
        subject: "Passenger accepted your fare!",
        html: `
          <h1>Hi ${driver.full_name},</h1>
          <p>Great news! ${passenger.full_name} has accepted your fare proposal of $${booking.final_price?.toFixed(2)}.</p>
          <p>They are now proceeding with payment. You'll be notified once payment is complete.</p>
          
          <p><a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a></p>
          
          <p>Best regards,<br>Your Ride Service Team</p>
        `,
      });
      break;

    case 'completed':
      // Send to both passenger and driver
      const completedEmails = [
        {
          to: passenger.email,
          name: passenger.full_name
        },
        {
          to: driver.email,
          name: driver.full_name
        }
      ];

      for (const recipient of completedEmails) {
        await resend.emails.send({
          from: "Ride Service <notifications@resend.dev>",
          to: [recipient.to],
          subject: "Ride completed – Thank you!",
          html: `
            <h1>Hi ${recipient.name},</h1>
            <p>Your ride has been marked as completed.</p>
            <p>Thank you for using our service!</p>
            
            <p>If you enjoyed your experience, consider leaving feedback.</p>

            <p><a href="${dashboardUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Leave a Review</a></p>
            
            <p>Best regards,<br>Your Ride Service Team</p>
          `,
        });
      }
      break;

    case 'cancelled':
      // Send to both passenger and driver
      const canceledEmails = [
        {
          to: passenger.email,
          name: passenger.full_name
        }
      ];

      if (driver && driver.email) {
        canceledEmails.push({
          to: driver.email,
          name: driver.full_name
        });
      }

      for (const recipient of canceledEmails) {
        await resend.emails.send({
          from: "Ride Service <notifications@resend.dev>",
          to: [recipient.to],
          subject: "Ride cancelled",
          html: `
            <h1>Hi ${recipient.name},</h1>
            <p>This ride has been cancelled. If this was an error, feel free to submit a new request.</p>

            <p><a href="${dashboardUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Make Another Request</a></p>
            
            <p>Best regards,<br>Your Ride Service Team</p>
          `,
        });
      }
      break;
  }
}

serve(handler);