
-- Migration: Add passenger_driver_profile and dispatcher_passenger_profile RPC functions
-- Created: 2025-01-13

-- 1) Passenger -> Driver profile (contacts only if booking is fully paid)
create or replace function public.passenger_driver_profile(_booking_id uuid)
returns table(
  driver_id uuid,
  full_name text,
  profile_photo_url text,
  car_make text,
  car_model text,
  car_year text,
  car_color text,
  phone text,
  email text
)
language sql
security definer
set search_path = public
as $$
  select
    d.id                      as driver_id,
    d.full_name,
    d.profile_photo_url,
    d.car_make,
    d.car_model,
    d.car_year,
    d.car_color,
    case when b.status = 'all_set' then d.phone else null end as phone,
    case when b.status = 'all_set' then d.email else null end as email
  from public.bookings b
  left join public.drivers d on d.id = b.driver_id
  where b.id = _booking_id
    and b.passenger_id = auth.uid();
$$;

revoke all on function public.passenger_driver_profile(uuid) from public;
grant execute on function public.passenger_driver_profile(uuid) to authenticated;

-- 2) Dispatcher -> Passenger profile (always visible to the dispatcher who owns the booking)
create or replace function public.dispatcher_passenger_profile(_booking_id uuid)
returns table(
  passenger_id uuid,
  full_name text,
  profile_photo_url text,
  phone text,
  email text
)
language sql
security definer
set search_path = public
as $$
  select
    p.id           as passenger_id,
    p.full_name,
    p.profile_photo_url,
    p.phone,
    p.email
  from public.bookings b
  left join public.passengers p on p.id = b.passenger_id
  where b.id = _booking_id
    and b.dispatcher_id = auth.uid();
$$;

revoke all on function public.dispatcher_passenger_profile(uuid) from public;
grant execute on function public.dispatcher_passenger_profile(uuid) to authenticated;
