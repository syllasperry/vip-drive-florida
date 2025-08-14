
import { supabase } from "@/integrations/supabase/client";
import { isDispatcherEmail } from "./roles";

export async function routeAfterAuth(navigate: any, location: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const email = user?.email ?? "";
    const returnTo = new URLSearchParams(location.search).get("returnTo");

    if (isDispatcherEmail(email)) {
      navigate("/dispatcher/dashboard", { replace: true });
    } else {
      // If coming from a wizard step, honor it. Otherwise go to passenger dashboard.
      if (returnTo) {
        navigate(returnTo, { replace: true });
      } else {
        navigate("/passenger/dashboard", { replace: true });
      }
    }
  } catch (error) {
    console.error("Error routing after auth:", error);
    // Fallback to passenger dashboard
    navigate("/passenger/dashboard", { replace: true });
  }
}
