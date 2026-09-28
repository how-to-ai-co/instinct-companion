create table if not exists public.companion_records (
 id text primary key, version integer not null check(version > 0), data jsonb not null,
 updated_at timestamptz not null default now()
);
create table if not exists public.companion_events (
 id text primary key, payload jsonb not null, received_at timestamptz not null default now()
);
alter table public.companion_records enable row level security;
alter table public.companion_events enable row level security;
revoke all on public.companion_records, public.companion_events from anon, authenticated;
grant all on public.companion_records, public.companion_events to service_role;

create or replace function public.companion_ingest(event jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare old_event jsonb; item jsonb; existing public.companion_records; applied integer := 0;
begin
 -- Serialize writes so duplicates, overlapping batches and out-of-order revisions are deterministic.
 perform pg_advisory_xact_lock(927461802);
 select payload into old_event from public.companion_events where id = event->>'eventId';
 if found then
  if old_event <> event then raise exception 'EVENT_CONFLICT'; end if;
  return jsonb_build_object('duplicate',true,'applied',0);
 end if;
 for item in select value from jsonb_array_elements(event->'records') loop
  select * into existing from public.companion_records where id = item->>'id';
  if found then
   if existing.version = (item->>'version')::integer and existing.data <> item then
    raise exception 'VERSION_CONFLICT';
   end if;
   if existing.version >= (item->>'version')::integer then continue; end if;
  end if;
  insert into public.companion_records(id,version,data) values(item->>'id',(item->>'version')::integer,item)
  on conflict(id) do update set version=excluded.version,data=excluded.data,updated_at=now();
  applied := applied + 1;
 end loop;
 insert into public.companion_events(id,payload) values(event->>'eventId',event);
 return jsonb_build_object('duplicate',false,'applied',applied);
end $$;
revoke all on function public.companion_ingest(jsonb) from public, anon, authenticated;
grant execute on function public.companion_ingest(jsonb) to service_role;

create or replace function public.companion_snapshot() returns jsonb
language sql security invoker set search_path = '' as $$
 select jsonb_build_object(
 'records',coalesce((select jsonb_agg(data || jsonb_build_object('updatedAt',updated_at) order by updated_at desc) from (select * from public.companion_records order by updated_at desc,id limit 1000) r),'[]'::jsonb),
 'total',(select count(*) from public.companion_records),
 'events',coalesce((select jsonb_agg(jsonb_build_object('id',id,'message',payload->>'message','receivedAt',received_at,'count',jsonb_array_length(payload->'records')) order by received_at desc) from (select * from public.companion_events order by received_at desc,id limit 50) e),'[]'::jsonb)
 );
$$;
revoke all on function public.companion_snapshot() from public, anon, authenticated;
grant execute on function public.companion_snapshot() to service_role;
