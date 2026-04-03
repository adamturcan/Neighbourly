-- Add lat/lng convenience columns to tasks
-- (location_point is used for spatial queries, lat/lng for easy reads)
alter table public.tasks add column if not exists lat double precision;
alter table public.tasks add column if not exists lng double precision;

-- Auto-sync lat/lng from location_point on insert/update
create or replace function public.sync_task_lat_lng()
returns trigger as $$
begin
  if new.location_point is not null then
    new.lat := ST_Y(new.location_point::geometry);
    new.lng := ST_X(new.location_point::geometry);
  end if;
  return new;
end;
$$ language plpgsql;

create trigger tasks_sync_lat_lng
  before insert or update on public.tasks
  for each row execute function public.sync_task_lat_lng();
