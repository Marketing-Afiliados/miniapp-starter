import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/supabase/config", () => ({ getSupabaseConfig: () => ({ url: "https://test.supabase.co", publishableKey: "public-test" }) }));
import { createServerClient } from "@supabase/ssr";
import { proxy } from "../proxy";
beforeEach(() => vi.resetAllMocks());
describe("session cookies survive proxy redirects", () => {
  it.each([true, false])("preserves refreshed/cleared cookies when user exists: %s", async authenticated => {
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      return { auth: { getUser: async () => {
        options?.cookies?.setAll?.([{ name: "sb-test-session", value: authenticated ? "refreshed" : "", options: { path: "/", httpOnly: true, maxAge: authenticated ? 3600 : 0 } }], {});
        return { data: { user: authenticated ? { id: "user" } : null }, error: null };
      } } } as unknown as ReturnType<typeof createServerClient>;
    });
    const response = await proxy(new NextRequest(`https://app.example.com/${authenticated ? "login" : "dashboard"}`));
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain(authenticated ? "/dashboard" : "/login");
    expect(response.cookies.get("sb-test-session")?.value).toBe(authenticated ? "refreshed" : "");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
