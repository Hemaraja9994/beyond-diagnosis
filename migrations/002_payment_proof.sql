alter table registrations add column if not exists payment_proof text not null default '';
alter table registrations add column if not exists payment_proof_data text not null default '';
