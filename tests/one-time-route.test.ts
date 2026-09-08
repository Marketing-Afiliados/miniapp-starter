import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/services/one-time-payment", () => ({ processOneTimePayment: vi.fn() }));
import { processOneTimePayment } from "@/services/one-time-payment";
import { POST } from "../app/api/webhooks/hotmart/one-time/route";
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
function configure() { vi.stubEnv("HOTMART_HOTTOK","test-token"); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY","test-key"); }
function request(token = "test-token", body = "{}") { return new Request("https://local.test/api/webhooks/hotmart/one-time", { method: "POST", headers: { "x-hotmart-hottok": token }, body }); }
describe("one-time webhook HTTP boundary", () => {
  it("fails closed when unconfigured", async () => {
    vi.stubEnv("HOTMART_HOTTOK",""); expect((await POST(request())).status).toBe(503);
    expect(processOneTimePayment).not.toHaveBeenCalled();
  });
  it("rejects forged authentication before processing", async () => {
    configure(); expect((await POST(request("forged"))).status).toBe(401);
    expect(processOneTimePayment).not.toHaveBeenCalled();
  });
  it("rejects malformed and oversized bodies without exposing data", async () => {
    configure(); expect((await POST(request("test-token","{"))).status).toBe(400);
    expect((await POST(request("test-token","x".repeat(1_000_001)))).status).toBe(413);
    expect(processOneTimePayment).not.toHaveBeenCalled();
  });
  it("acknowledges processed duplicate payments", async () => {
    configure(); vi.mocked(processOneTimePayment).mockResolvedValue({ ok: true, status: 200, duplicate: true });
    const response = await POST(request()); expect(response.status).toBe(200); expect(await response.json()).toEqual({ ok: true, duplicate: true });
  });
  it("returns retryable server failures without leaking provider secrets", async () => {
    configure(); vi.mocked(processOneTimePayment).mockRejectedValue(new Error("sensitive-test-error"));
    const response = await POST(request()); expect(response.status).toBe(500); expect(await response.text()).not.toContain("sensitive");
  });
});
