import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  verificationCode: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, verificationCode }: VerificationEmailRequest = await req.json();

    console.log('📧 Sending 2FA verification email to:', email);

    const emailResponse = await resend.emails.send({
      from: "VIP Chauffeur Security <security@resend.dev>",
      to: [email],
      subject: "Two-Factor Authentication Code",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #333; font-size: 28px; font-weight: bold; margin-bottom: 10px;">VIP Chauffeur</h1>
            <div style="width: 60px; height: 4px; background: #FF385C; margin: 0 auto;"></div>
          </div>
          
          <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 30px;">
            <div style="width: 80px; height: 80px; background: #FF385C; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="m7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h2 style="color: #333; font-size: 24px; font-weight: bold; margin-bottom: 15px;">Security Verification</h2>
            <p style="color: #666; font-size: 16px; margin-bottom: 25px;">
              You've requested to enable Two-Factor Authentication for your VIP Chauffeur account.
            </p>
            
            <div style="background: white; border: 2px dashed #FF385C; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <p style="color: #333; font-size: 14px; margin-bottom: 10px; font-weight: 500;">Your verification code:</p>
              <div style="font-size: 36px; font-weight: bold; color: #FF385C; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${verificationCode}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; color: #999; font-size: 12px;">
            <p>VIP Chauffeur Service</p>
            <p>This is an automated security email. Please do not reply.</p>
          </div>
        </div>
      `,
    });

    console.log("✅ 2FA verification email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("❌ Error in send-2fa-verification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);