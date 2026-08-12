import type { Plan } from "@/types/database";

export interface HotmartPlanReference {
  productIds: string[];
  offerCode: string | null;
  subscriptionPlanId: string | null;
}

export type HotmartPlanResolution =
  | { status: "matched"; plan: Plan }
  | { status: "ambiguous" | "not_found" };

/**
 * Resolves a SaaS plan using Hotmart's offer/recurring-plan identifiers.
 * The product ID alone is only accepted for legacy products with one plan.
 */
export function resolveHotmartPlan(
  candidates: Plan[],
  reference: HotmartPlanReference,
): HotmartPlanResolution {
  const productIds = new Set(reference.productIds);
  const productCandidates = candidates.filter(
    (plan) => plan.provider_product_id && productIds.has(plan.provider_product_id),
  );

  const exactMatches = productCandidates.filter(
    (plan) =>
      (reference.offerCode !== null && plan.provider_offer_code === reference.offerCode) ||
      (reference.subscriptionPlanId !== null &&
        plan.provider_plan_id === reference.subscriptionPlanId),
  );

  if (exactMatches.length === 1) return { status: "matched", plan: exactMatches[0] };
  if (exactMatches.length > 1) return { status: "ambiguous" };

  if (
    productCandidates.length === 1 &&
    productCandidates[0].provider_offer_code === null &&
    productCandidates[0].provider_plan_id === null
  ) {
    return { status: "matched", plan: productCandidates[0] };
  }

  return { status: productCandidates.length > 1 ? "ambiguous" : "not_found" };
}
