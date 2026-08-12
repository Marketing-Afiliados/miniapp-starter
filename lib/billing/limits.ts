import type { Json } from "@/types/database";

export type PlanLimitPolicy =
  | { kind: "disabled"; limit: 0 }
  | { kind: "unlimited"; limit: null }
  | { kind: "limited"; limit: number }
  | { kind: "unconfigured"; limit: null };

function isRecord(value: Json): value is { [key: string]: Json | undefined } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Commercial plan limits use -1 to represent unlimited access.
 * Zero/false disable a feature; positive integers set a usage cap.
 */
export function resolvePlanLimit(value: Json | undefined): PlanLimitPolicy {
  if (value === -1) return { kind: "unlimited", limit: null };
  if (value === false || value === 0) return { kind: "disabled", limit: 0 };
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return { kind: "limited", limit: value };
  }
  return { kind: "unconfigured", limit: null };
}

export function getFeaturePlanLimit(limits: Json, feature: string): PlanLimitPolicy {
  if (!isRecord(limits)) return { kind: "unconfigured", limit: null };
  return resolvePlanLimit(
    limits[feature] ??
      limits[`${feature}_per_month`] ??
      limits[`${feature}_enabled`],
  );
}
