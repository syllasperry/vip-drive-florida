-- Fix the remaining function search_path warning
CREATE OR REPLACE FUNCTION public.auto_publish_eligible_reviews()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Auto-publish if eligible (all 5-star ratings and good public review)
  IF NEW.auto_publish_eligible = true THEN
    NEW.is_published = true;
  END IF;
  
  RETURN NEW;
END;
$function$;