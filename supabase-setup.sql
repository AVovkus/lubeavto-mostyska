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
