alter table predictions
  add column if not exists image_position text not null default '50% 50%';
