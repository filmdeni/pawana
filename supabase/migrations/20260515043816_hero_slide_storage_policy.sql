-- Allow admins to upload to any path in the predictions bucket
do $$ begin
  if not exists (
    select 1 from pg_policies
    where policyname = 'predictions_admin_upload'
    and tablename = 'objects'
    and schemaname = 'storage'
  ) then
    create policy "predictions_admin_upload"
      on storage.objects for insert
      with check (
        bucket_id = 'predictions'
        and exists (
          select 1 from public.profiles
          where profiles.id = auth.uid()
          and profiles.is_admin = true
        )
      );
  end if;
end $$;
