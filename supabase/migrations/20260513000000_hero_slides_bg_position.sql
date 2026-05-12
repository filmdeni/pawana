alter table hero_slides
  add column if not exists bg_position text not null default '50% 50%';
