import { describe, expect, it } from "vitest";
import { buildCatalogItems, filterCatalogItems } from "./catalog";
import type {
  CatalogCategory,
  CatalogItem,
  CatalogItemCategory,
  CatalogItemOverride,
  CatalogSubcategory,
} from "../../types/database";

const timestamp = "2026-08-12T00:00:00.000Z";
const categories = [
  { id: "cat-paper", code: "paper", name: "Papelería creativa", description: null, sort_order: 1, active: true, created_at: timestamp, updated_at: timestamp },
  { id: "cat-balloon", code: "balloons", name: "Globos", description: null, sort_order: 2, active: true, created_at: timestamp, updated_at: timestamp },
] satisfies CatalogCategory[];
const subcategories = [
  { id: "sub-paper", category_id: "cat-paper", code: "papers", name: "Papeles", description: null, sort_order: 1, active: true, created_at: timestamp, updated_at: timestamp },
] satisfies CatalogSubcategory[];
const items = [
  { id: "item-vinyl", code: "vinyl", name: "Vinilo adhesivo", description: null, item_type: "material", unit: "metro", default_cost_cents: 0, default_price_cents: 0, search_keywords: "sticker cricut", active: true, sort_order: 1, created_at: timestamp, updated_at: timestamp },
] satisfies CatalogItem[];
const relations = [
  { item_id: "item-vinyl", category_id: "cat-paper", subcategory_id: "sub-paper", sort_order: 1 },
] satisfies CatalogItemCategory[];

describe("catálogo global", () => {
  it("aplica overrides sin modificar el registro global", () => {
    const overrides = [{ user_id: "user", catalog_item_id: "item-vinyl", unit: null, default_cost_cents: 250, default_price_cents: 500, hidden: false, created_at: timestamp, updated_at: timestamp }] satisfies CatalogItemOverride[];
    const [view] = buildCatalogItems(items, relations, categories, subcategories, overrides);
    expect(view.defaultCostCents).toBe(250);
    expect(items[0].default_cost_cents).toBe(0);
  });

  it("busca sin depender de mayúsculas o acentos y por palabras relacionadas", () => {
    const views = buildCatalogItems(items, relations, categories, subcategories, []);
    expect(filterCatalogItems(views, { query: "PAPELERIA" })).toHaveLength(1);
    expect(filterCatalogItems(views, { query: "cricut" })).toHaveLength(1);
  });

  it("prioriza rubros elegidos y permite ver todo", () => {
    const views = buildCatalogItems(items, relations, categories, subcategories, []);
    expect(filterCatalogItems(views, { preferredCategoryIds: ["cat-balloon"] })).toHaveLength(0);
    expect(filterCatalogItems(views, { preferredCategoryIds: ["cat-balloon"], showAll: true })).toHaveLength(1);
    expect(filterCatalogItems(views, { preferredCategoryIds: ["cat-balloon"], categoryId: "cat-paper" })).toHaveLength(1);
  });
});
