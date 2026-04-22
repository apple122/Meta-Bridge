-- 
-- MetaBridge MASTER Database Schema
-- Version: 4.1 (Performance & Activity Dashboard)
-- 
-- IMPORTANT: This schema is designed for a CUSTOM authentication system.
-- It does NOT use Supabase Auth (auth.users). Users are stored directly in profiles.
-- RLS is disabled and access is controlled at the application level.
--

-- Enable Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- STEP 1: DROP ALL EXISTING TABLES & FUNCTIONS (Clean Reset)
-- ============================================================
drop table if exists public.push_subscriptions cascade;
drop table if exists public.admin_audit_logs cascade;
drop table if exists public.user_login_history cascade;
drop table if exists public.portfolio cascade;
drop table if exists public.transactions cascade;
drop table if exists public.binary_trades cascade;
drop table if exists public.global_settings cascade;
drop table if exists public.profiles cascade;

drop function if exists public.generate_random_code(int) cascade;
drop function if exists public.place_binary_trade(uuid, text, text, decimal, decimal, int, bigint) cascade;
drop function if exists public.resolve_binary_trade(uuid, text, decimal, decimal) cascade;
drop function if exists public.refund_binary_trade(uuid) cascade;

-- ============================================================
-- STEP 2: HELPER FUNCTIONS
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
-- STEP 3: CREATE TABLES
-- ============================================================

-- 1. Profiles: Custom user data table
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
  language text default 'en',
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Binary Trades: For Binary Options tracking
create table public.binary_trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- 'up' or 'down'
  asset_symbol text not null,
  amount decimal(20, 2) not null,
  entry_price decimal(20, 8) not null,
  payout_percent integer not null,
  expiry_time bigint not null,
  status text default 'pending', -- 'pending', 'won', 'lost', 'refunded'
  result_price decimal(20, 8),
  created_at timestamptz default now(),
  settled_at timestamptz
);

-- 3. Transactions: Financial ledger
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('buy', 'sell', 'deposit', 'withdraw', 'win', 'loss')) not null,
  asset_symbol text not null,
  amount decimal(36,18) not null,
  price decimal(18,2) not null,
  total decimal(20, 2) not null,
  status text default 'pending',
  binary_type text, 
  binary_result text, 
  binary_trade_id uuid references public.binary_trades(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Portfolio: Asset holdings
create table public.portfolio (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  asset_symbol text not null,
  units decimal(36,18) default 0,
  updated_at timestamp with time zone default now(),

  unique(user_id, asset_symbol)
);

-- 5. Global Settings: Admin managed
create table public.global_settings (
  id text primary key default 'main',
  contact_phone text default '',
  contact_line text default '',
  contact_telegram text default '',
  contact_whatsapp text default '',
  contact_facebook text default '',
  contact_email text default '',
  contact_discord text default '',
  phone_enabled boolean default true,
  line_enabled boolean default true,
  telegram_enabled boolean default true,
  whatsapp_enabled boolean default true,
  facebook_enabled boolean default true,
  email_enabled boolean default true,
  discord_enabled boolean default true,
  registration_otp_enabled boolean default true,
  updated_at timestamp with time zone default now()
);

-- 6. User Login History: Security logs
create table public.user_login_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_name text,
  os_name text,
  browser_name text,
  device_info text,
  ip_address text,
  created_at timestamptz default now()
);

-- 7. Push Subscriptions: Notification tokens
create table public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  endpoint text not null,
  subscription jsonb not null,
  created_at timestamptz default now(),
  
  unique(user_id, endpoint)
);

-- 8. Admin Audit Logs: Track admin actions (top-up, edit, role changes, etc.)
create table public.admin_audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  admin_email text,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_user_email text,
  action_type text not null, -- 'TOP_UP','EDIT_PROFILE','TOGGLE_ROLE','CREATE_USER','UPDATE_SETTINGS'
  description text,
  details jsonb,
  created_at timestamptz default now()
);

-- 9. User Sessions: Track currently active sessions for remote logout
create table public.user_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_name text,
  os_name text,
  browser_name text,
  ip_address text,
  last_active timestamptz default now(),
  created_at timestamptz default now()
);

-- Insert default settings
insert into public.global_settings (id) 
values ('main') 
on conflict (id) do nothing;

-- ============================================================
-- STEP 4: TRADING RPC FUNCTIONS (Atomic Transactions)
-- ============================================================

-- A. Place Binary Trade
create or replace function public.place_binary_trade(
  p_user_id uuid,
  p_type text,
  p_asset_symbol text,
  p_amount decimal,
  p_entry_price decimal,
  p_payout_percent integer,
  p_expiry_time bigint
) returns jsonb as $$
declare
  v_current_balance decimal;
  v_trade_id uuid;
begin
  select balance into v_current_balance from profiles where id = p_user_id for update;
  if v_current_balance < p_amount then
    return jsonb_build_object('success', false, 'message', 'Insufficient balance');
  end if;

  update profiles set balance = balance - p_amount where id = p_user_id;

  insert into binary_trades (user_id, type, asset_symbol, amount, entry_price, payout_percent, expiry_time, status)
  values (p_user_id, p_type, p_asset_symbol, p_amount, p_entry_price, p_payout_percent, p_expiry_time, 'pending')
  returning id into v_trade_id;

  insert into transactions (user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_trade_id)
  values (p_user_id, 'buy', p_asset_symbol, p_amount / p_entry_price, p_entry_price, p_amount, 'success', p_type, v_trade_id);

  return jsonb_build_object('success', true, 'message', 'Trade placed successfully', 'trade_id', v_trade_id);
end;
$$ language plpgsql;

-- B. Resolve Binary Trade
create or replace function public.resolve_binary_trade(
  p_trade_id uuid,
  p_new_status text,
  p_result_price decimal,
  p_payout_amount decimal
) returns jsonb as $$
declare
  v_user_id uuid;
  v_current_status text;
  v_asset_symbol text;
  v_amount decimal;
  v_binary_type text;
begin
  select user_id, status, asset_symbol, amount, type 
  into v_user_id, v_current_status, v_asset_symbol, v_amount, v_binary_type 
  from binary_trades where id = p_trade_id for update;
  
  if v_current_status != 'pending' then
    return jsonb_build_object('success', false, 'message', 'Trade already resolved');
  end if;

  update binary_trades 
  set status = p_new_status, result_price = p_result_price, settled_at = now()
  where id = p_trade_id;

  if p_payout_amount > 0 then
    update profiles set balance = balance + p_payout_amount where id = v_user_id;
  end if;

  insert into transactions (user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_result, binary_trade_id)
  values (
    v_user_id, 
    case when p_new_status = 'won' then 'win' else 'loss' end, 
    v_asset_symbol, 
    v_amount, 
    p_result_price, 
    p_payout_amount, 
    'success', 
    v_binary_type, 
    p_new_status, 
    p_trade_id
  );

  return jsonb_build_object('success', true, 'message', 'Trade resolved successfully');
end;
$$ language plpgsql;

-- C. Refund Binary Trade
create or replace function public.refund_binary_trade(
  p_trade_id uuid
) returns jsonb as $$
declare
  v_user_id uuid;
  v_trade_amount decimal;
  v_current_status text;
  v_asset_symbol text;
begin
  select user_id, amount, status, asset_symbol 
  into v_user_id, v_trade_amount, v_current_status, v_asset_symbol 
  from binary_trades where id = p_trade_id for update;
  
  if v_current_status != 'pending' then
    return jsonb_build_object('success', false, 'message', 'Trade not pending');
  end if;

  update binary_trades set status = 'refunded', settled_at = now() where id = p_trade_id;
  update profiles set balance = balance + v_trade_amount where id = v_user_id;

  insert into transactions (user_id, type, asset_symbol, amount, price, total, status, binary_trade_id)
  values (v_user_id, 'deposit', v_asset_symbol, 0, 0, v_trade_amount, 'success', p_trade_id);

  return jsonb_build_object('success', true, 'message', 'Trade refunded successfully');
end;
$$ language plpgsql;

-- ============================================================
-- STEP 5: RLS & GRANTS
-- ============================================================

alter table public.profiles disable row level security;
alter table public.binary_trades disable row level security;
alter table public.transactions disable row level security;
alter table public.portfolio disable row level security;
alter table public.global_settings disable row level security;
alter table public.user_login_history disable row level security;
alter table public.push_subscriptions disable row level security;
alter table public.admin_audit_logs disable row level security;
alter table public.user_sessions disable row level security;

grant all on all tables in schema public to anon;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to anon;
grant all on all sequences in schema public to authenticated;

-- ============================================================
-- STEP 6: INDEXES
-- ============================================================

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_binary_trades_user_id on public.binary_trades(user_id);
create index if not exists idx_binary_trades_status on public.binary_trades(status);
create index if not exists idx_portfolio_user_id on public.portfolio(user_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_binary_trades_created_at on public.binary_trades(created_at desc);
create index if not exists idx_login_history_created_at on public.user_login_history(created_at desc);
create index if not exists idx_user_login_history_user_id on public.user_login_history(user_id);
create index if not exists idx_profiles_code on public.profiles(code);
create index if not exists idx_push_subs_user_id on public.push_subscriptions(user_id);
create index if not exists idx_audit_logs_admin_id on public.admin_audit_logs(admin_id);
create index if not exists idx_audit_logs_created_at on public.admin_audit_logs(created_at desc);
create index if not exists idx_user_sessions_user_id on public.user_sessions(user_id);
create index if not exists idx_user_sessions_last_active on public.user_sessions(last_active desc);

-- ============================================================
-- STEP 7: BACKGROUND SETTLEMENT (Edge Functions & pg_cron)
-- ============================================================
-- 
-- IMPORTANT: To enable 24/7 automated trade resolution, you must:
-- 1. Deploy the Edge Function:
--    npx supabase functions deploy resolve-trades --no-verify-jwt
-- 
-- 2. Configure Environment Variables in Supabase Dashboard (Settings > Edge Functions):
--    BREVO_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
-- 
-- 3. Run the following SQL to enable the cron job:
/*
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('resolve-binary-trades-every-minute');
select cron.schedule(
  'resolve-binary-trades-every-minute',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/resolve-trades',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
*/
