"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

function serviceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type HomeSections = {
  hero: boolean;
  stats_bar: boolean;
  quick: boolean;
  trending: boolean;
  ending_soon: boolean;
  for_you: boolean;
  missions: boolean;
  shop: boolean;
  rank_card: boolean;
  leaderboard: boolean;
  community: boolean;
};

const DEFAULTS: HomeSections = {
  hero: true,
  stats_bar: true,
  quick: true,
  trending: true,
  ending_soon: true,
  for_you: true,
  missions: true,
  shop: true,
  rank_card: true,
  leaderboard: true,
  community: true,
};

export async function getHomeSections(): Promise<HomeSections> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "home_sections")
    .single();
  if (error || !data) return DEFAULTS;
  return { ...DEFAULTS, ...(data.value as Partial<HomeSections>) };
}

export async function setHomeSections(sections: HomeSections) {
  const supabase = serviceClient();
  const { error } = await supabase.from("app_config").upsert({
    key: "home_sections",
    value: sections,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/home-sections");
}
