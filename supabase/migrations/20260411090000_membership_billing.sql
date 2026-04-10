-- 会员计费与状态同步
-- Task 20: 实现会员购买与状态同步

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('monthly', 'yearly')),
  name text not null,
  description text not null default '',
  billing_cycle text not null check (billing_cycle in ('month', 'year')),
  price_cents integer not null check (price_cents > 0),
  currency text not null default 'CNY',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id uuid references public.plans(id) on delete set null,
  tier text not null default 'free' check (tier in ('free', 'premium')),
  status text not null default 'inactive' check (status in ('inactive', 'pending', 'active', 'expired', 'canceled')),
  started_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id uuid not null references public.plans(id) on delete restrict,
  provider text not null default 'mockpay',
  provider_session_id text not null unique,
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'canceled', 'expired')),
  success_url text,
  cancel_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists payment_sessions_user_idx on public.payment_sessions (user_id, created_at desc);
create index if not exists memberships_user_status_idx on public.memberships (user_id, status);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  provider text not null default 'mockpay',
  provider_event_id text not null,
  provider_session_id text,
  event_type text not null,
  session_id uuid references public.payment_sessions(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz not null default now()
);

create or replace function public.refresh_membership_state(p_user_id uuid)
returns table (
  membership_id uuid,
  tier text,
  status text,
  plan_id uuid,
  started_at timestamptz,
  expires_at timestamptz,
  checked_at timestamptz,
  is_expired boolean,
  subscription_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.memberships
  set
    tier = 'free',
    status = 'expired',
    updated_at = now()
  where user_id = p_user_id
    and status = 'active'
    and expires_at is not null
    and expires_at <= now();

  return query
  with current_membership as (
    select
      m.id as membership_id,
      m.tier,
      m.status,
      m.plan_id,
      m.started_at,
      m.expires_at
    from public.memberships m
    where m.user_id = p_user_id
    order by m.updated_at desc
    limit 1
  )
  select
    cm.membership_id,
    coalesce(cm.tier, 'free') as tier,
    coalesce(cm.status, 'inactive') as status,
    cm.plan_id,
    cm.started_at,
    cm.expires_at,
    now() as checked_at,
    coalesce(cm.status = 'expired' or (cm.expires_at is not null and cm.expires_at <= now()), false) as is_expired,
    case
      when cm.tier = 'premium' and cm.status = 'active' and (cm.expires_at is null or cm.expires_at > now()) then 1000
      else 10
    end as subscription_limit
  from current_membership cm
  union all
  select
    null::uuid as membership_id,
    'free'::text as tier,
    'inactive'::text as status,
    null::uuid as plan_id,
    null::timestamptz as started_at,
    null::timestamptz as expires_at,
    now() as checked_at,
    false as is_expired,
    10 as subscription_limit
  where not exists (select 1 from current_membership);
end;
$$;

alter table public.plans enable row level security;
alter table public.memberships enable row level security;
alter table public.payment_sessions enable row level security;

create policy "plans_select_active" on public.plans
for select using (is_active = true);

create policy "memberships_select_own" on public.memberships
for select using (auth.uid() = user_id);

create policy "payment_sessions_select_own" on public.payment_sessions
for select using (auth.uid() = user_id);

insert into public.plans (code, name, description, billing_cycle, price_cents, currency, is_active)
values
  ('monthly', '月付会员', '按月解锁高级订阅、翻译与朗读能力', 'month', 1800, 'CNY', true),
  ('yearly', '年付会员', '按年订阅，享受更长会员有效期', 'year', 16800, 'CNY', true)
on conflict (code) do update
set
  name = excluded.name,
  description = excluded.description,
  billing_cycle = excluded.billing_cycle,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  is_active = excluded.is_active,
  updated_at = now();
