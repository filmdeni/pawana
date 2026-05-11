insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do nothing;

do $$ begin
  if not exists (select 1 from pg_policies where policyname = 'avatars_public_read' and tablename = 'objects' and schemaname = 'storage') then
    create policy "avatars_public_read" on storage.objects for select using (bucket_id = 'avatars');
  end if;
  if not exists (select 1 from pg_policies where policyname = 'avatars_owner_upload' and tablename = 'objects' and schemaname = 'storage') then
    create policy "avatars_owner_upload" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'avatars_owner_update' and tablename = 'objects' and schemaname = 'storage') then
    create policy "avatars_owner_update" on storage.objects for update using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'avatars_owner_delete' and tablename = 'objects' and schemaname = 'storage') then
    create policy "avatars_owner_delete" on storage.objects for delete using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
  end if;
end $$;
