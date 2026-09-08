import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/services/hotmart-webhook", () => ({ reconcilePendingHotmartEvents: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { reconcilePendingHotmartEvents } from "@/services/hotmart-webhook";
import { ensureProfile } from "../lib/auth/profile";
import type { User } from "@supabase/supabase-js";
const rpc = vi.fn();
const profile = vi.fn();
const user = { id: "user", email: "buyer@example.com", user_metadata: {} } as User;
beforeEach(() => {
  vi.resetAllMocks();
  const builder = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), maybeSingle: profile };
  vi.mocked(createClient).mockResolvedValue({ rpc, from: () => builder } as unknown as Awaited<ReturnType<typeof createClient>>);
  profile.mockResolvedValue({ data: { id: "user" }, error: null });
});
describe("post-auth synchronization", () => {
  it("keeps login successful if new purchase linking fails", async () => {
    rpc.mockRejectedValue(new Error("missing schema"));
    await expect(ensureProfile(user)).resolves.toBeUndefined();
    expect(reconcilePendingHotmartEvents).toHaveBeenCalledWith(user);
  });
  it("does not discard an authenticated session on legacy reconciliation errors", async () => {
    vi.mocked(reconcilePendingHotmartEvents).mockRejectedValue(new Error("temporarily unavailable"));
    await expect(ensureProfile(user)).resolves.toBeUndefined();
  });
  it("does not discard an authenticated session on profile network errors", async () => {
    profile.mockRejectedValue(new Error("temporarily unavailable"));
    await expect(ensureProfile(user)).resolves.toBeUndefined();
  });
});
