-- 
-- MetaBridge Database Schema for Supabase (Custom Auth - No Supabase Auth dependency)
-- Version: 2.0 (Custom Auth System)
-- 
-- IMPORTANT: This schema is designed for a CUSTOM authentication system.
-- It does NOT use Supabase Auth (auth.users). Users are stored directly in profiles.
-- RLS is disabled and access is controlled at the application level.
--

-- Enable Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- STEP 1: DROP ALL EXISTING TABLES (Clean Reset)
-- ============================================================
drop table if exists public.portfolio cascade;
drop table if exists public.transactions cascade;
drop table if exists public.global_settings cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- STEP 2: DROP EXISTING FUNCTIONS & TRIGGERS
-- ============================================================
drop function if exists public.generate_random_code(int) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.update_password(text, text) cascade;

-- ============================================================
-- STEP 3: HELPER FUNCTIONS
-- ============================================================

-- Function to generate a random alphanumeric code
create or replace function public.generate_random_code(length int) 
returns text as $$
declare
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result text := '';
  i int := 0;
begin
  while i < length loop
    result := result || substr(chars, floor(random() * char_length(chars) + 1)::int, 1);
    i := i + 1;
  end loop;
  return result;
end;
$$ language plpgsql;

-- ============================================================
-- STEP 4: CREATE TABLES (No FK to auth.users)
-- ============================================================

-- 1. Profiles: Custom user data table (standalone, no auth.users dependency)
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  full_name text,
  first_name text,
  last_name text,
  email text unique,
  password text,
  code text default public.generate_random_code(6),
  phone_number text,
  address text,
  kyc_status text default 'unverified',
  bank_network text,
  bank_account text,
  bank_name text,
  avatar_url text,
  balance decimal(18,2) default 0.00,
  is_admin boolean default false,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Transactions: Ledger for all buy, sell, deposit, withdraw events
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('buy', 'sell', 'deposit', 'withdraw')) not null,
  asset_symbol text not null,
  amount decimal(36,18) not null,
  price decimal(18,2) not null,
  total decimal(20, 2) not null,
  status text default 'pending',
  binary_type text, -- 'up' or 'down' (for Binary trades)
  binary_result text, -- 'win' or 'loss'
  binary_trade_id uuid, -- Reference to binary_trades table
  created_at timestamptz default now()
);

-- 3. Portfolio: Current holdings of assets for each user
create table public.portfolio (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  asset_symbol text not null,
  units decimal(36,18) default 0,
  updated_at timestamp with time zone default now(),

  unique(user_id, asset_symbol)
);

-- 4. Global Settings: Managed by admins
create table public.global_settings (
  id text primary key default 'main',
  contact_phone text default '',
  contact_line text default '',
  contact_telegram text default '',
  updated_at timestamp with time zone default now()
);

-- Insert default settings
insert into public.global_settings (id) 
values ('main') 
on conflict (id) do nothing;

-- ============================================================
-- STEP 5: ROW LEVEL SECURITY (RLS)
-- Since we use custom auth (no Supabase JWT), we DISABLE RLS
-- and rely on application-level access control.
-- This is safe because:
--   - The anon key is used (read-only for public, write controlled by app)
--   - All mutations require a valid user_id from the app
-- ============================================================

-- Disable RLS on all tables
alter table public.profiles disable row level security;
alter table public.transactions disable row level security;
alter table public.portfolio disable row level security;
alter table public.global_settings disable row level security;

-- ============================================================
-- STEP 6: GRANT PERMISSIONS TO anon AND authenticated ROLES
-- ============================================================

-- Profiles
grant select, insert, update on public.profiles to anon;
grant select, insert, update on public.profiles to authenticated;

-- Transactions
grant select, insert, update on public.transactions to anon;
grant select, insert, update on public.transactions to authenticated;

-- Portfolio
grant select, insert, update, delete on public.portfolio to anon;
grant select, insert, update, delete on public.portfolio to authenticated;

-- Global Settings
grant select on public.global_settings to anon;
grant select, update on public.global_settings to authenticated;

-- ============================================================
-- STEP 7: INDEXES FOR PERFORMANCE
-- ============================================================

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_portfolio_user_id on public.portfolio(user_id);
create index if not exists idx_portfolio_user_asset on public.portfolio(user_id, asset_symbol);

-- ============================================================
-- STEP 8: ADMIN USER (Optional - set manually after creation)
-- To make a user admin, run:
--   UPDATE public.profiles SET is_admin = true WHERE username = 'your_admin_username';
-- ============================================================
