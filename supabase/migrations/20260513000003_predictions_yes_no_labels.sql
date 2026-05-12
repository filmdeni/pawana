alter table predictions
  add column if not exists yes_label text not null default 'ใช่',
  add column if not exists no_label  text not null default 'ไม่ใช่';
