
-- Critical Security Fixes for VIP App

-- 1. Add missing RLS policies for user_roles table to prevent privilege escalation
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Only admins can insert new roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

-- 2. Create a secure function to check dispatcher role (replacing hardcoded email checks)
CREATE OR REPLACE FUNCTION public.is_dispatcher()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'dispatcher'::app_role
  );
$$;

-- 3. Create a secure function to check if email is a registered dispatcher
CREATE OR REPLACE FUNCTION public.is_dispatcher_email(email_to_check text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dispatchers d
    JOIN public.user_roles ur ON ur.user_id = d.user_id
    WHERE lower(d.email) = lower(email_to_check)
    AND ur.role = 'dispatcher'::app_role
  );
$$;

-- 4. Add audit logging for role changes
CREATE TABLE IF NOT EXISTS public.user_role_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  action text NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  changed_by uuid REFERENCES auth.users(id),
  changed_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.user_role_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view role audit logs"
  ON public.user_role_audit
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'admin'::app_role
    )
  );

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, changed_by)
    VALUES (NEW.user_id, NEW.role, 'INSERT', auth.uid());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, changed_by, metadata)
    VALUES (NEW.user_id, NEW.role, 'UPDATE', auth.uid(), 
           jsonb_build_object('old_role', OLD.role, 'new_role', NEW.role));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.user_role_audit (user_id, role, action, changed_by)
    VALUES (OLD.user_id, OLD.role, 'DELETE', auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for audit logging
DROP TRIGGER IF EXISTS user_roles_audit_trigger ON public.user_roles;
CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.audit_user_roles();

-- 5. Add missing RLS policies for passengers table to secure user data
CREATE POLICY "Users can view their own passenger profile"
  ON public.passengers
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "Users can update their own passenger profile"
  ON public.passengers
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR id = auth.uid())
  WITH CHECK (user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "Dispatchers can view all passenger profiles"
  ON public.passengers
  FOR SELECT
  TO authenticated
  USING (public.is_dispatcher());
