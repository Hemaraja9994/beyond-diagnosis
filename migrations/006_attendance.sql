-- Non-RCI CRE track: offline hands-on at Yenepoya, or online. Blank for the RCI track.
alter table registrations add column if not exists attendance text not null default '';
