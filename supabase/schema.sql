create extension if not exists "pgcrypto";

do $$ begin
  create type public.user_role as enum ('doctor', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.patient_status as enum ('active', 'discharged', 'deceased', 'archived');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.patient_sex as enum ('female', 'male', 'other', 'unknown');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.alert_severity as enum ('info', 'warning', 'critical');
exception when duplicate_object then null; end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_user_role()
returns public.user_role language sql stable as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', '')::public.user_role,
    nullif(auth.jwt() -> 'user_metadata' ->> 'role', '')::public.user_role,
    'doctor'::public.user_role
  );
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  role public.user_role not null default 'doctor',
  full_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  medical_record_number text unique,
  display_name text not null,
  date_of_birth date,
  sex public.patient_sex not null default 'unknown',
  status public.patient_status not null default 'active',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vitals (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  heart_rate numeric(6,2),
  respiratory_rate numeric(6,2),
  oxygen_saturation numeric(5,2),
  temperature_c numeric(5,2),
  systolic_bp numeric(6,2),
  diastolic_bp numeric(6,2),
  lactate numeric(6,2),
  measured_at timestamptz not null default now(),
  recorded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid references public.patients(id) on delete set null,
  patient_identifier text not null,
  record jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  model_version text not null default 'foundation-v1',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  source text not null,
  severity public.alert_severity not null,
  title text not null,
  message text not null,
  escalation_level integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  acknowledged_at timestamptz,
  acknowledged_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  encrypted_body text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.prediction_timelines (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  prediction_id uuid references public.predictions(id) on delete set null,
  deterioration_risk numeric(6,5) not null,
  septic_shock_risk numeric(6,5) not null,
  mortality_risk numeric(6,5) not null,
  estimated_deterioration_minutes integer,
  created_at timestamptz not null default now()
);

create table if not exists public.medical_summaries (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  body text not null,
  encrypted_body text,
  severity text not null default 'info',
  source text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.patient_access (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  access_level text not null default 'viewer',
  granted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(patient_id, user_id)
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  patient_id uuid references public.patients(id) on delete cascade,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  platform text not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  patient_id uuid references public.patients(id) on delete cascade,
  alert_id uuid references public.alerts(id) on delete set null,
  title text not null,
  body text not null,
  status text not null default 'queued',
  attempts integer not null default 0,
  provider_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

alter table public.alerts add column if not exists escalation_level integer not null default 0;
alter table public.notes add column if not exists encrypted_body text;

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_patients_status on public.patients(status);
create index if not exists idx_vitals_patient_measured_at on public.vitals(patient_id, measured_at desc);
create index if not exists idx_alerts_patient_created_at on public.alerts(patient_id, created_at desc);
create index if not exists idx_alerts_open on public.alerts(created_at desc) where acknowledged_at is null;
create index if not exists idx_predictions_created_at on public.predictions(created_at desc);
create index if not exists idx_predictions_patient_id on public.predictions(patient_id);
create index if not exists idx_notes_patient_created_at on public.notes(patient_id, created_at desc);
create index if not exists idx_audit_actor_created_at on public.audit_logs(actor_id, created_at desc);
create index if not exists idx_timeline_patient_created_at on public.prediction_timelines(patient_id, created_at desc);
create index if not exists idx_medical_summaries_patient_created_at on public.medical_summaries(patient_id, created_at desc);
create index if not exists idx_patient_access_user on public.patient_access(user_id);
create index if not exists idx_activity_patient_created_at on public.activity_events(patient_id, created_at desc);
create index if not exists idx_notification_deliveries_status on public.notification_deliveries(status, created_at desc);

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at before update on public.users for each row execute function public.set_updated_at();
drop trigger if exists patients_set_updated_at on public.patients;
create trigger patients_set_updated_at before update on public.patients for each row execute function public.set_updated_at();
drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at before update on public.notes for each row execute function public.set_updated_at();

alter table public.users enable row level security;
alter table public.patients enable row level security;
alter table public.vitals enable row level security;
alter table public.predictions enable row level security;
alter table public.alerts enable row level security;
alter table public.notes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.prediction_timelines enable row level security;
alter table public.medical_summaries enable row level security;
alter table public.patient_access enable row level security;
alter table public.activity_events enable row level security;
alter table public.notification_devices enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "users can read self" on public.users for select using (id = auth.uid() or public.current_user_role() = 'admin');
create policy "admins manage users" on public.users for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "clinical users read patients" on public.patients for select using (auth.role() = 'authenticated');
create policy "doctors and admins insert patients" on public.patients for insert with check (public.current_user_role() in ('doctor', 'admin'));
create policy "doctors and admins update patients" on public.patients for update using (public.current_user_role() in ('doctor', 'admin'));

create policy "clinical users read vitals" on public.vitals for select using (auth.role() = 'authenticated');
create policy "doctors and admins insert vitals" on public.vitals for insert with check (public.current_user_role() in ('doctor', 'admin'));

create policy "clinical users read alerts" on public.alerts for select using (auth.role() = 'authenticated');
create policy "doctors and admins manage alerts" on public.alerts for update using (public.current_user_role() in ('doctor', 'admin'));

create policy "clinical users read predictions" on public.predictions for select using (auth.role() = 'authenticated');
create policy "doctors and admins create predictions" on public.predictions for insert with check (public.current_user_role() in ('doctor', 'admin'));
create policy "owners delete predictions" on public.predictions for delete using (created_by = auth.uid() or public.current_user_role() = 'admin');

create policy "clinical users read notes" on public.notes for select using (auth.role() = 'authenticated');
create policy "doctors and admins create notes" on public.notes for insert with check (public.current_user_role() in ('doctor', 'admin'));

create policy "admins read audit logs" on public.audit_logs for select using (public.current_user_role() = 'admin');

create policy "clinical users read timelines" on public.prediction_timelines for select using (auth.role() = 'authenticated');
create policy "clinical users create timelines" on public.prediction_timelines for insert with check (public.current_user_role() in ('doctor', 'admin'));

create policy "clinical users read summaries" on public.medical_summaries for select using (auth.role() = 'authenticated');
create policy "clinical users create summaries" on public.medical_summaries for insert with check (public.current_user_role() in ('doctor', 'admin'));

create policy "clinical users read patient access" on public.patient_access for select using (auth.role() = 'authenticated');
create policy "admins manage patient access" on public.patient_access for all using (public.current_user_role() = 'admin') with check (public.current_user_role() = 'admin');

create policy "clinical users read activity" on public.activity_events for select using (auth.role() = 'authenticated');
create policy "clinical users create activity" on public.activity_events for insert with check (auth.role() = 'authenticated');

create policy "users manage own notification devices" on public.notification_devices for all using (user_id = auth.uid() or public.current_user_role() = 'admin') with check (user_id = auth.uid() or public.current_user_role() = 'admin');
create policy "admins read notification deliveries" on public.notification_deliveries for select using (public.current_user_role() = 'admin');

do $$
begin
  alter publication supabase_realtime add table public.vitals;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.alerts;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.predictions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.prediction_timelines;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.medical_summaries;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.activity_events;
exception when duplicate_object then null;
end $$;
