-- Allow users to update their own resolution report (needed for upsert)
create policy "reports_update_own"
  on public.resolution_reports
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
