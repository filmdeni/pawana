-- Allow users to edit their own comments (UPDATE policy was missing)
-- Without SELECT+UPDATE policies, PATCH silently returns 0 rows
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'comments' and policyname = 'comments_update_own'
  ) then
    execute 'create policy "comments_update_own" on public.comments for update using (auth.uid() = user_id) with check (auth.uid() = user_id)';
  end if;
end $$;
