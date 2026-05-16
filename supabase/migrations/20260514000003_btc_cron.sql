-- Schedule resolve-btc-round Edge Function every 5 minutes
-- Requires pg_cron + pg_net extensions (enable via Supabase dashboard if needed)
DO $outer$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'resolve-btc-rounds',
      '*/5 * * * *',
      $job$
      SELECT net.http_post(
        url    := current_setting('app.supabase_url') || '/functions/v1/resolve-btc-round',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
          'Content-Type',  'application/json'
        ),
        body   := '{}'::jsonb
      );
      $job$
    );
  END IF;
END $outer$;
