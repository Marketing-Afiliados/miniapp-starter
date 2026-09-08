import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireUser: vi.fn() }));
vi.mock("@/lib/billing/access", () => ({ hasActiveSubscription: vi.fn(), canUseFeature: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { hasActiveSubscription, canUseFeature } from "@/lib/billing/access";
import { getOneTimeAccess, hasDecoQuoteAccess, canUseDecoQuoteFeature } from "../lib/decoquote/access";

const rpc = vi.fn();
const from = vi.fn();
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(createClient).mockResolvedValue({ rpc, from } as unknown as Awaited<ReturnType<typeof createClient>>);
  vi.mocked(hasActiveSubscription).mockResolvedValue(false);
  vi.mocked(canUseFeature).mockResolvedValue({ allowed: false, reason: "no_subscription", remaining: null, used: 0, limit: null });
  rpc.mockImplementation(async (name: string) => name === "is_admin" ? { data: false, error: null } : { error: { code: "PGRST202" } });
});
describe("login remains usable while billing schema is unavailable", () => {
  it("reports unavailable rather than throwing or claiming there is no purchase", async () => {
    expect(await getOneTimeAccess("user")).toMatchObject({ active: false, unavailable: true });
    expect(from).not.toHaveBeenCalled();
  });
  it("preserves administrator access without querying the missing billing schema", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    expect(await hasDecoQuoteAccess("admin")).toBe(true);
    expect(await canUseDecoQuoteFeature("admin", "quotes")).toMatchObject({ allowed: true });
    expect(rpc.mock.calls.every(([name]) => name === "is_admin")).toBe(true);
  });
  it("preserves a historical subscription when new purchases cannot be read", async () => {
    vi.mocked(hasActiveSubscription).mockResolvedValue(true);
    expect(await hasDecoQuoteAccess("historical-user")).toBe(true);
    expect(rpc).not.toHaveBeenCalledWith("claim_one_time_purchases");
    vi.mocked(canUseFeature).mockResolvedValue({ allowed: true, reason: "available", remaining: 10, limit: 50, used: 40 });
    expect(await canUseDecoQuoteFeature("historical-user", "quotes")).toMatchObject({ allowed: true, remaining: 10 });
  });
  it("does not grant unverified access on a missing schema or network error", async () => {
    expect(await hasDecoQuoteAccess("unpaid-user")).toBe(false);
    expect(await canUseDecoQuoteFeature("unpaid-user", "quotes")).toMatchObject({ allowed: false, reason: "access_unavailable" });
    rpc.mockRejectedValue(new Error("network failure"));
    expect(await getOneTimeAccess("user")).toMatchObject({ active: false, unavailable: true });
  });
  it("handles missing tables even if the claim RPC exists", async () => {
    rpc.mockResolvedValue({ error: null });
    const builder = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST205" } }) };
    from.mockReturnValue(builder);
    expect(await getOneTimeAccess("user")).toMatchObject({ active: false, unavailable: true });
  });
});
