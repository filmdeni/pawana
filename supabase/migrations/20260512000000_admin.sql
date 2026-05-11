-- Admin support: is_admin flag on profiles + status on predictions

alter table public.profiles add column if not exists is_admin boolean default false;

-- 'pending' = awaiting approval, 'approved' = live, 'rejected' = hidden
alter table public.predictions add column if not exists status text not null default 'approved'
  check (status in ('pending', 'approved', 'rejected'));

-- Admin can update any prediction
create policy "predictions_admin_update"
  on public.predictions for update
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Admin can delete any prediction
create policy "predictions_admin_delete"
  on public.predictions for delete
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
