-- Скрипт налаштування безкоштовної захищеної бази Supabase для «Любе Авто Мостиська».

-- Окрема непублічна схема для списку менеджерів та функції перевірки доступу
create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.cars (
  id text primary key,
  brand text not null,
  model text not null,
  title text not null,
  year integer not null,
  mileage_thousand_km numeric not null default 0,
  mileage_text text not null default '',
  price_usd numeric not null default 0,
  old_price_usd numeric default null check (old_price_usd is null or old_price_usd >= 0),
  fuel text not null default 'Бензин',
  fuel_type text not null default 'petrol',
  engine_cc integer,
  engine_label text default '',
  transmission text default '',
  drive text default '',
  body_type text default '',
  vehicle_type text default 'passenger',
  color text default '',
  status text not null default 'В наявності',
  image text not null default '',
  images jsonb not null default '[]'::jsonb,
  description text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.cars add column if not exists old_price_usd numeric default null;

create table if not exists public.site_settings (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Таблиця дозволених email менеджерів у непублічній схемі private
create table if not exists private.admin_users (
  email text primary key,
  created_at timestamptz not null default now()
);

alter table public.cars enable row level security;
alter table public.site_settings enable row level security;
alter table private.admin_users enable row level security;

-- Перевірка прав менеджера (auth.uid + JWT email у private.admin_users)
create or replace function private.is_lube_admin()
returns boolean
language sql
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from private.admin_users
      where lower(email) = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    );
$$;

revoke all on function private.is_lube_admin() from public;
grant execute on function private.is_lube_admin() to authenticated;

grant usage on schema public to anon, authenticated;
grant select on public.cars to anon, authenticated;
grant insert, update, delete on public.cars to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

drop policy if exists "Public read cars" on public.cars;
drop policy if exists "Public read site_settings" on public.site_settings;
drop policy if exists "Authenticated manage cars" on public.cars;
drop policy if exists "Authenticated manage site_settings" on public.site_settings;
drop policy if exists "Admin manage cars" on public.cars;
drop policy if exists "Admin manage site_settings" on public.site_settings;
drop policy if exists "Admin insert cars" on public.cars;
drop policy if exists "Admin update cars" on public.cars;
drop policy if exists "Admin delete cars" on public.cars;
drop policy if exists "Admin insert site_settings" on public.site_settings;
drop policy if exists "Admin update site_settings" on public.site_settings;
drop policy if exists "Admin delete site_settings" on public.site_settings;

-- Публічне читання для всіх відвідувачів сайту
create policy "Public read cars"
  on public.cars for select
  using (true);

create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

-- Запис, оновлення та видалення ЛИШЕ для менеджера з private.admin_users
create policy "Admin insert cars"
  on public.cars for insert
  to authenticated
  with check (private.is_lube_admin());

create policy "Admin update cars"
  on public.cars for update
  to authenticated
  using (private.is_lube_admin())
  with check (private.is_lube_admin());

create policy "Admin delete cars"
  on public.cars for delete
  to authenticated
  using (private.is_lube_admin());

create policy "Admin insert site_settings"
  on public.site_settings for insert
  to authenticated
  with check (private.is_lube_admin());

create policy "Admin update site_settings"
  on public.site_settings for update
  to authenticated
  using (private.is_lube_admin())
  with check (private.is_lube_admin());

create policy "Admin delete site_settings"
  on public.site_settings for delete
  to authenticated
  using (private.is_lube_admin());

-- Бакет для фото та відео авто (публічний на перегляд, до 50 МБ, лише фото/відео)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'car-photos',
  'car-photos',
  true,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read car photos" on storage.objects;
drop policy if exists "Authenticated upload car photos" on storage.objects;
drop policy if exists "Authenticated update car photos" on storage.objects;
drop policy if exists "Authenticated delete car photos" on storage.objects;
drop policy if exists "Admin upload car photos" on storage.objects;
drop policy if exists "Admin update car photos" on storage.objects;
drop policy if exists "Admin delete car photos" on storage.objects;

create policy "Public read car photos"
  on storage.objects for select
  using (bucket_id = 'car-photos');

create policy "Admin upload car photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-photos' and private.is_lube_admin());

create policy "Admin update car photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'car-photos' and private.is_lube_admin())
  with check (bucket_id = 'car-photos' and private.is_lube_admin());

create policy "Admin delete car photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-photos' and private.is_lube_admin());

-- Приклад додавання email менеджера:
-- insert into private.admin_users (email) values ('manager@example.com') on conflict do nothing;

-- =========================================================
-- Автоматичне щоденне оновлення курсів валют (НБУ)
-- =========================================================
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists private.nbu_sync_state (
  id integer primary key default 1 check (id = 1),
  last_request_id bigint,
  last_applied_id bigint,
  last_error text,
  updated_at timestamptz not null default now()
);

alter table private.nbu_sync_state enable row level security;

insert into private.nbu_sync_state (id)
values (1)
on conflict (id) do nothing;

create or replace function private.request_nbu_rates_sync(p_force boolean default false)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  auto_enabled boolean;
  req_id bigint;
begin
  if current_user <> 'postgres' and not private.is_lube_admin() then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  if not p_force then
    select coalesce((payload->>'ratesAutoSync')::boolean, true)
      into auto_enabled
    from public.site_settings
    where id = 'main';

    if coalesce(auto_enabled, true) is false then
      return null;
    end if;
  end if;

  select net.http_get(
    url := 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?json',
    timeout_milliseconds := 5000
  ) into req_id;

  insert into private.nbu_sync_state (id, last_request_id, updated_at)
  values (1, req_id, now())
  on conflict (id) do update
    set last_request_id = excluded.last_request_id,
        updated_at = now();

  return req_id;
end;
$$;

create or replace function private.apply_nbu_rates_sync(p_force boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_req_id bigint;
  v_applied_id bigint;
  v_status integer;
  v_err text;
  v_content text;
  v_arr jsonb;
  v_usd numeric;
  v_eur numeric;
  v_date text;
  v_usd_rounded numeric;
  v_eur_usd numeric;
  v_auto boolean;
  v_updated_at text;
  v_patch jsonb;
begin
  if current_user <> 'postgres' and not private.is_lube_admin() then
    raise exception 'Access denied' using errcode = '42501';
  end if;

  select last_request_id, last_applied_id
    into v_req_id, v_applied_id
  from private.nbu_sync_state
  where id = 1;

  if v_req_id is null then
    return jsonb_build_object('status', 'idle');
  end if;

  if not p_force and v_req_id = coalesce(v_applied_id, 0) then
    return jsonb_build_object('status', 'already_applied');
  end if;

  select status_code, error_msg, content
    into v_status, v_err, v_content
  from net._http_response
  where id = v_req_id;

  if not found then
    return jsonb_build_object('status', 'pending', 'requestId', v_req_id);
  end if;

  if v_status <> 200 or v_err is not null or v_content is null or left(ltrim(v_content), 1) <> '[' then
    v_err := coalesce(v_err, 'HTTP ' || coalesce(v_status::text, 'unknown'));
    update private.nbu_sync_state
    set last_applied_id = v_req_id,
        last_error = v_err,
        updated_at = now()
    where id = 1;
    return jsonb_build_object('status', 'error', 'error', v_err);
  end if;

  begin
    v_arr := v_content::jsonb;
  exception when others then
    update private.nbu_sync_state
    set last_applied_id = v_req_id,
        last_error = 'Invalid JSON from NBU',
        updated_at = now()
    where id = 1;
    return jsonb_build_object('status', 'error', 'error', 'Invalid JSON from NBU');
  end;

  select
    max(case when elem->>'cc' = 'USD' then (elem->>'rate')::numeric end),
    max(case when elem->>'cc' = 'EUR' then (elem->>'rate')::numeric end),
    max(case when elem->>'cc' = 'USD' then elem->>'exchangedate' end)
  into v_usd, v_eur, v_date
  from jsonb_array_elements(v_arr) as elem
  where elem->>'cc' in ('USD', 'EUR');

  if v_usd is null or v_eur is null or v_usd < 10 or v_usd > 200 or v_eur < 10 or v_eur > 250 then
    update private.nbu_sync_state
    set last_applied_id = v_req_id,
        last_error = 'Out-of-bounds NBU rate',
        updated_at = now()
    where id = 1;
    return jsonb_build_object('status', 'error', 'error', 'Out-of-bounds NBU rate');
  end if;

  v_eur_usd := round(v_eur / v_usd, 5);
  if v_eur_usd < 0.5 or v_eur_usd > 2.5 then
    update private.nbu_sync_state
    set last_applied_id = v_req_id,
        last_error = 'Out-of-bounds cross rate',
        updated_at = now()
    where id = 1;
    return jsonb_build_object('status', 'error', 'error', 'Out-of-bounds cross rate');
  end if;

  v_usd_rounded := round(v_usd, 2);
  v_updated_at := to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"');

  select coalesce((payload->>'ratesAutoSync')::boolean, true)
    into v_auto
  from public.site_settings
  where id = 'main';

  if p_force or coalesce(v_auto, true) then
    v_patch := jsonb_build_object(
      'rates', jsonb_build_object(
        'usdToUah', v_usd_rounded,
        'eurToUsd', v_eur_usd
      ),
      'ratesAutoSync', coalesce(v_auto, true),
      'ratesSource', 'НБУ',
      'ratesExchangeDate', coalesce(v_date, ''),
      'ratesUpdatedAt', v_updated_at
    );

    insert into public.site_settings (id, payload, updated_at)
    values ('main', v_patch, now())
    on conflict (id) do update
      set payload = coalesce(public.site_settings.payload, '{}'::jsonb) || v_patch,
          updated_at = now();
  end if;

  update private.nbu_sync_state
  set last_applied_id = v_req_id,
      last_error = null,
      updated_at = now()
  where id = 1;

  return jsonb_build_object(
    'status', 'applied',
    'usdToUah', v_usd_rounded,
    'eurToUsd', v_eur_usd,
    'exchangeDate', coalesce(v_date, ''),
    'source', 'НБУ',
    'updatedAt', v_updated_at
  );
end;
$$;

create or replace function private.request_nbu_rates()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.request_nbu_rates_sync(false);
end;
$$;

create or replace function private.apply_nbu_rates()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.apply_nbu_rates_sync(false);
end;
$$;

create or replace function public.admin_request_nbu_rates()
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_lube_admin() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  return private.request_nbu_rates_sync(true);
end;
$$;

create or replace function public.admin_apply_nbu_rates()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_lube_admin() then
    raise exception 'Access denied' using errcode = '42501';
  end if;
  return private.apply_nbu_rates_sync(true);
end;
$$;

revoke all on function private.request_nbu_rates_sync(boolean) from public, anon;
grant execute on function private.request_nbu_rates_sync(boolean) to authenticated;
revoke all on function private.apply_nbu_rates_sync(boolean) from public, anon;
grant execute on function private.apply_nbu_rates_sync(boolean) to authenticated;
revoke all on function private.request_nbu_rates() from public, anon, authenticated;
revoke all on function private.apply_nbu_rates() from public, anon, authenticated;
revoke all on function public.admin_request_nbu_rates() from public, anon;
grant execute on function public.admin_request_nbu_rates() to authenticated;
revoke all on function public.admin_apply_nbu_rates() from public, anon;
grant execute on function public.admin_apply_nbu_rates() to authenticated;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'lubeavto_request_nbu_rates') then
    perform cron.unschedule('lubeavto_request_nbu_rates');
  end if;
  if exists (select 1 from cron.job where jobname = 'lubeavto_apply_nbu_rates') then
    perform cron.unschedule('lubeavto_apply_nbu_rates');
  end if;
end $$;

select cron.schedule('lubeavto_request_nbu_rates', '5 7,14 * * *', $$select private.request_nbu_rates();$$);
select cron.schedule('lubeavto_apply_nbu_rates', '6 7,14 * * *', $$select private.apply_nbu_rates();$$);
