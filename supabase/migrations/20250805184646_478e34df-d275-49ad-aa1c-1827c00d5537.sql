-- Create ride_status table for detailed status tracking
CREATE TABLE public.ride_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ride_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('driver', 'passenger')),
    status_code TEXT NOT NULL CHECK (
        status_code IN (
            'booking_request_sent',     -- passageiro enviou o request
            'booking_request_received', -- driver recebeu o request
            'driver_offer_sent',        -- driver enviou a oferta
            'offer_accepted',           -- passageiro aceitou a oferta
            'payment_pending',          -- aguardando pagamento
            'payment_confirmed',        -- pagamento confirmado
            'ride_all_set'              -- tudo pronto
        )
    ),
    status_label TEXT NOT NULL, -- Texto amigável para exibir no roadmap
    status_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}', -- dados adicionais (foto, nome, telefone, preço, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ride_status ENABLE ROW LEVEL SECURITY;

-- Create policies for ride_status
CREATE POLICY "Users can view ride status for their rides" 
ON public.ride_status 
FOR SELECT 
USING (
    ride_id IN (
        SELECT id FROM public.bookings 
        WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
);

CREATE POLICY "Users can create ride status for their rides" 
ON public.ride_status 
FOR INSERT 
WITH CHECK (
    ride_id IN (
        SELECT id FROM public.bookings 
        WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
);

CREATE POLICY "Users can update ride status for their rides" 
ON public.ride_status 
FOR UPDATE 
USING (
    ride_id IN (
        SELECT id FROM public.bookings 
        WHERE passenger_id = auth.uid() OR driver_id = auth.uid()
    )
);

-- Create indexes for performance
CREATE INDEX idx_ride_status_ride_id ON public.ride_status(ride_id);
CREATE INDEX idx_ride_status_timestamp ON public.ride_status(status_timestamp);
CREATE INDEX idx_ride_status_actor_timestamp ON public.ride_status(ride_id, actor_role, status_timestamp DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_ride_status_updated_at
    BEFORE UPDATE ON public.ride_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get latest status for each actor
CREATE OR REPLACE FUNCTION public.get_ride_status_summary(p_ride_id UUID)
RETURNS TABLE(
    actor_role TEXT,
    status_code TEXT,
    status_label TEXT,
    status_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (rs.actor_role)
        rs.actor_role,
        rs.status_code,
        rs.status_label,
        rs.status_timestamp,
        rs.metadata
    FROM public.ride_status rs
    WHERE rs.ride_id = p_ride_id
    ORDER BY rs.actor_role, rs.status_timestamp DESC;
END;
$$;

-- Create function to get complete ride timeline
CREATE OR REPLACE FUNCTION public.get_ride_timeline(p_ride_id UUID)
RETURNS TABLE(
    status_code TEXT,
    status_label TEXT,
    actor_role TEXT,
    status_timestamp TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT
        rs.status_code,
        rs.status_label,
        rs.actor_role,
        rs.status_timestamp,
        rs.metadata
    FROM public.ride_status rs
    WHERE rs.ride_id = p_ride_id
    ORDER BY rs.status_timestamp ASC;
END;
$$;