import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/profile", () => ({ ensureProfile: vi.fn() }));
vi.mock("@/lib/auth/guards", () => ({ requireUser: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginAction } from "../app/auth/actions";
afterEach(() => vi.resetAllMocks());
describe("login credentials", () => {
  it("preserves the exact password while normalizing email", async () => {
    const signInWithPassword = vi.fn().mockResolvedValue({ data: { user: { id: "user" } }, error: null });
    vi.mocked(createClient).mockResolvedValue({ auth: { signInWithPassword } } as unknown as Awaited<ReturnType<typeof createClient>>);
    const data = new FormData(); data.set("email", " Buyer@example.com "); data.set("password", " secret with spaces ");
    await expect(loginAction({ status: "idle", message: "" }, data)).rejects.toThrow("NEXT_REDIRECT");
    expect(signInWithPassword).toHaveBeenCalledWith({ email: "buyer@example.com", password: " secret with spaces " });
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
