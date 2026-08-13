import { buildCatalogItems } from "@/lib/decoquote/catalog";
import { createClient } from "@/lib/supabase/server";

export async function loadCatalogForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const [
    { data: categories },
    { data: subcategories },
    { data: items },
    { data: relations },
    { data: overrides },
    { data: selections },
  ] = await Promise.all([
    supabase.from("catalog_categories").select("*").eq("active", true).order("sort_order"),
    supabase.from("catalog_subcategories").select("*").eq("active", true).order("sort_order"),
    supabase.from("catalog_items").select("*").eq("active", true).order("sort_order"),
    supabase.from("catalog_item_categories").select("*").order("sort_order"),
    supabase.from("catalog_item_overrides").select("*").eq("user_id", userId),
    supabase.from("business_catalog_categories").select("*").eq("user_id", userId),
  ]);

  return {
    categories: categories ?? [],
    subcategories: subcategories ?? [],
    catalogItems: buildCatalogItems(
      items ?? [],
      relations ?? [],
      categories ?? [],
      subcategories ?? [],
      overrides ?? [],
    ),
    preferredCategoryIds: (selections ?? []).map((selection) => selection.category_id),
  };
}
