-- Скрипт налаштування безкоштовної бази Supabase для «Любе Авто Мостиська».
-- Скопіюйте і виконайте цей код у Supabase -> SQL Editor -> New query.

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

-- Увімкнення Row Level Security (RLS)
alter table public.cars enable row level security;
alter table public.site_settings enable row level security;

-- Публічне читання для всіх відвідувачів сайту
create policy "Public read cars"
  on public.cars for select
  using (true);

create policy "Public read site_settings"
  on public.site_settings for select
  using (true);

-- Редагування лише для авторизованого менеджера (authenticated)
create policy "Authenticated manage cars"
  on public.cars for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated manage site_settings"
  on public.site_settings for all
  to authenticated
  using (true)
  with check (true);

-- Бакет для фотографій авто (публічний на читання, завантаження тільки для менеджера)
insert into storage.buckets (id, name, public)
values ('car-photos', 'car-photos', true)
on conflict (id) do nothing;

create policy "Public read car photos"
  on storage.objects for select
  using (bucket_id = 'car-photos');

create policy "Authenticated upload car photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'car-photos');

create policy "Authenticated update car photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'car-photos');

create policy "Authenticated delete car photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'car-photos');
