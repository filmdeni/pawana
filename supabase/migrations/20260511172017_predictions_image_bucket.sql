insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('predictions', 'predictions', true, 5242880, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'predictions_public_read' and tablename = 'objects' and schemaname = 'storage') then
    create policy "predictions_public_read" on storage.objects for select using (bucket_id = 'predictions');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'predictions_auth_upload' and tablename = 'objects' and schemaname = 'storage') then
    create policy "predictions_auth_upload" on storage.objects for insert with check (bucket_id = 'predictions' and auth.role() = 'authenticated');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'predictions_owner_update' and tablename = 'objects' and schemaname = 'storage') then
    create policy "predictions_owner_update" on storage.objects for update using (bucket_id = 'predictions' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'predictions_owner_delete' and tablename = 'objects' and schemaname = 'storage') then
    create policy "predictions_owner_delete" on storage.objects for delete using (bucket_id = 'predictions' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;
