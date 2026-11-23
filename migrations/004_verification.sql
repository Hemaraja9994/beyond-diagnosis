alter table registrations add column if not exists title text not null default '';
alter table registrations add column if not exists cre_claim text not null default '';
alter table registrations add column if not exists documents text not null default '';
alter table registrations add column if not exists verification text not null default '';

create index if not exists registrations_payment_reference_lower
  on registrations (lower(payment_reference));

create table if not exists registration_files (
  reference text not null,
  kind text not null,
  content_type text not null,
  data text not null,
  created_at timestamptz not null default now(),
  primary key (reference, kind)
);
