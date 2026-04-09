-- 邮箱注册 OTP 挑战（仅存哈希，明文验证码仅出现在邮件中）
create table if not exists public.email_otp_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists email_otp_challenges_email_created_idx
  on public.email_otp_challenges (email, created_at desc);

create index if not exists email_otp_challenges_expires_idx
  on public.email_otp_challenges (expires_at);

alter table public.email_otp_challenges enable row level security;
