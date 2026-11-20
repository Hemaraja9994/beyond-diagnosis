create table if not exists registrations (
  id text primary key,
  reference text not null unique,
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  mobile text not null,
  crr_number text not null,
  profession text not null,
  designation text not null default '',
  institution text not null,
  state_name text not null,
  payment_reference text not null default '',
  access_needs text not null default '',
  source text not null,
  consent boolean not null
);

create unique index if not exists registrations_email_lower
  on registrations (lower(email));

create table if not exists queries (
  id text primary key,
  created_at timestamptz not null default now(),
  full_name text not null,
  email text not null,
  topic text not null,
  message text not null
);

create table if not exists settings (
  key text primary key,
  value text not null
);
