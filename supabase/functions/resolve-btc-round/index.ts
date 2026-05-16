// Supabase Edge Function — called every 5 minutes by pg_cron or external cron
// Resolves all btc_rounds where ends_at <= now() and result IS NULL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function getBtcPrice(): Promise<number> {
  const res = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd",
    { headers: { "Accept": "application/json" } }
  );
  const json = await res.json();
  return json.bitcoin.usd as number;
}

Deno.serve(async () => {
  try {
    // Find unresolved rounds that have ended
    const { data: rounds, error } = await supabase
      .from("btc_rounds")
      .select("id, ends_at, start_price")
      .is("result", null)
      .lte("ends_at", new Date().toISOString());

    if (error) throw error;
    if (!rounds || rounds.length === 0) {
      return new Response(JSON.stringify({ resolved: 0 }), { status: 200 });
    }

    // Fetch current BTC price once
    const endPrice = await getBtcPrice();

    // Resolve each round
    let resolved = 0;
    for (const round of rounds) {
      const { error: resolveError } = await supabase.rpc("resolve_btc_round", {
        p_round_id: round.id,
        p_end_price: endPrice,
      });
      if (!resolveError) resolved++;
      else console.error("resolve error", round.id, resolveError.message);
    }

    return new Response(JSON.stringify({ resolved, endPrice }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
