import type {
  CatalogCategory,
  CatalogItem,
  CatalogItemCategory,
  CatalogItemOverride,
  CatalogItemType,
  CatalogSubcategory,
} from "../../types/database";
import type { CatalogItemView } from "../../types/decoquote";

export const CATALOG_ITEM_TYPE_LABELS: Record<CatalogItemType, string> = {
  material: "Material",
  service: "Servicio",
  product: "Producto",
  labor: "Mano de obra",
  equipment: "Equipo",
  transport: "Transporte",
  other: "Otro",
};

export interface CatalogFilter {
  query?: string;
  categoryId?: string;
  itemTypes?: CatalogItemType[];
  preferredCategoryIds?: string[];
  showAll?: boolean;
  includeHidden?: boolean;
}

function searchable(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function buildCatalogItems(
  items: CatalogItem[],
  relations: CatalogItemCategory[],
  categories: CatalogCategory[],
  subcategories: CatalogSubcategory[],
  overrides: CatalogItemOverride[],
): CatalogItemView[] {
  const categoryById = new Map(categories.map((entry) => [entry.id, entry]));
  const subcategoryById = new Map(subcategories.map((entry) => [entry.id, entry]));
  const overrideByItem = new Map(overrides.map((entry) => [entry.catalog_item_id, entry]));
  const relationsByItem = new Map<string, CatalogItemCategory[]>();
  for (const relation of relations) {
    const current = relationsByItem.get(relation.item_id) ?? [];
    current.push(relation);
    relationsByItem.set(relation.item_id, current);
  }

  return items.map((item) => {
    const override = overrideByItem.get(item.id);
    const itemRelations = relationsByItem.get(item.id) ?? [];
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description ?? "",
      itemType: item.item_type,
      unit: override?.unit ?? item.unit,
      defaultCostCents: override?.default_cost_cents ?? item.default_cost_cents,
      defaultPriceCents: override?.default_price_cents ?? item.default_price_cents,
      searchKeywords: item.search_keywords,
      personalized: Boolean(override),
      hidden: override?.hidden ?? false,
      categoryIds: [...new Set(itemRelations.map((entry) => entry.category_id))],
      categoryNames: [...new Set(itemRelations.map((entry) => categoryById.get(entry.category_id)?.name).filter(Boolean) as string[])],
      subcategoryNames: [...new Set(itemRelations.map((entry) => subcategoryById.get(entry.subcategory_id)?.name).filter(Boolean) as string[])],
    };
  });
}

export function filterCatalogItems(items: CatalogItemView[], filter: CatalogFilter): CatalogItemView[] {
  const query = searchable(filter.query?.trim() ?? "");
  const preferred = new Set(filter.preferredCategoryIds ?? []);
  return items
    .filter((item) => filter.includeHidden || !item.hidden)
    .filter((item) => !filter.itemTypes?.length || filter.itemTypes.includes(item.itemType))
    .filter((item) => !filter.categoryId || item.categoryIds.includes(filter.categoryId))
    .filter((item) => filter.showAll || Boolean(filter.categoryId) || preferred.size === 0 || item.categoryIds.some((id) => preferred.has(id)))
    .filter((item) => {
      if (!query) return true;
      return searchable([
        item.name,
        item.description,
        item.searchKeywords,
        ...item.categoryNames,
        ...item.subcategoryNames,
      ].join(" ")).includes(query);
    })
    .sort((a, b) => {
      const aPreferred = a.categoryIds.some((id) => preferred.has(id));
      const bPreferred = b.categoryIds.some((id) => preferred.has(id));
      if (aPreferred !== bPreferred) return aPreferred ? -1 : 1;
      return a.name.localeCompare(b.name, "es");
    });
}

export function filterPersonalizedCatalogItems(
  items: CatalogItemView[],
  filter: Pick<CatalogFilter, "query" | "itemTypes">,
): CatalogItemView[] {
  return filterCatalogItems(items, {
    ...filter,
    showAll: true,
    includeHidden: true,
  }).filter((item) => item.personalized);
}
