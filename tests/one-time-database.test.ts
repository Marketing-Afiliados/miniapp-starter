import { calculateQuote } from "../lib/decoquote/calculations";
import { generateQuotePdf } from "../lib/decoquote/pdf";
import type { BusinessProfile, Customer, Quote, QuoteItem } from "../types/database";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { beforeAll, beforeEach, afterEach, afterAll, describe, expect, it } from "vitest";

const user = "11111111-1111-4111-8111-111111111111";
const other = "22222222-2222-4222-8222-222222222222";
let db: PGlite;
const event = (id = "e1", status = "approved", transaction = "tx1", occurred = "2026-09-07T10:00:00Z") => ({
  id, type: status === "approved" ? "PURCHASE_APPROVED" : "PURCHASE_" + status.toUpperCase(),
  status, product_ids: ["product-test"], offer_code: "offer-test", transaction,
  buyer_email: "buyer@example.com", occurred_at: occurred,
  approved_at: status === "approved" ? occurred : null, amount: 12.99, currency: "USD",
});
async function processEvent(e = event(), environment = "test") {
  const result = await db.query<{ result: { ok: boolean; duplicate?: boolean; error?: string } }>("select public.process_one_time_purchase($1::jsonb,$2) result", [JSON.stringify(e),environment]);
  return result.rows[0].result;
}
async function authenticated(id = user) {
  await db.exec("set local role authenticated");
  await db.query("select set_config('request.jwt.claim.sub',$1,true)",[id]);
}
async function count(table: string) { return (await db.query<{ n: number }>(`select count(*)::int n from public.${table}`)).rows[0].n; }
async function access() { return (await db.query<{ allowed: boolean }>("select public.has_decoquote_access() allowed")).rows[0].allowed; }

beforeAll(async () => {
  db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,raw_user_meta_data jsonb default '{}');
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('email',(select email from auth.users where id=auth.uid())) $$;
    grant usage on schema auth,public to authenticated,anon,service_role;
    grant execute on function auth.uid(),auth.jwt() to authenticated,anon,service_role;`);
  for (const name of ["202608080001_core_schema.sql","202608080002_rls.sql","202608080003_pending_billing_links.sql","202608090004_decoquote.sql","202608100002_business_country.sql","202608110001_hotmart_multi_plan.sql","202608110002_decoquote_plans.sql","202608120001_global_creative_catalog.sql","202609070001_one_time_access.sql"]) {
    // gen_random_uuid is built in; PGlite doesn't ship the unused pgcrypto extension.
    await db.exec(readFileSync(`supabase/migrations/${name}`,"utf8").replace("create extension if not exists pgcrypto;", ""));
  }
});
beforeEach(async () => {
  await db.exec("begin");
  await db.query("insert into auth.users(id,email,email_confirmed_at) values($1,'buyer@example.com',now()),($2,'other@example.com',now())",[user,other]);
  await db.exec("insert into public.payment_settings(environment) values('test'); insert into public.payment_offers(provider_product_id,provider_offer_code,environment,enabled,revoke_on_refund) values('product-test','offer-test','test',true,true)");
});
afterEach(async () => { await db.exec("rollback"); });
afterAll(async () => { await db.close(); });

describe("atomic purchase and access SQL", () => {
  it("approves an existing verified user with a lifetime entitlement and no subscription", async () => {
    expect((await processEvent()).ok).toBe(true);
    expect(await count("subscriptions")).toBe(0);
    expect(await count("access_entitlements")).toBe(1);
    await authenticated(); expect(await access()).toBe(true);
  });
  it("does not activate pending or cancelled attempts", async () => {
    await processEvent(event("pending","pending")); await processEvent(event("cancelled","cancelled"));
    expect(await count("access_entitlements")).toBe(0);
    await authenticated(); expect(await access()).toBe(false);
  });
  it("deduplicates events and transactions, while keeping accidental second purchases", async () => {
    await processEvent(); expect((await processEvent()).duplicate).toBe(true);
    await processEvent(event("e2"));
    expect(await count("purchases")).toBe(1); expect(await count("access_entitlements")).toBe(1);
    await processEvent(event("e3","approved","tx2")); expect(await count("purchases")).toBe(2);
  });
  it.each(["product_ids","offer_code"])("records wrong %s for safe retry without granting access", async field => {
    const e = { ...event(), [field]: field === "product_ids" ? ["wrong"] : "wrong" };
    expect((await processEvent(e)).ok).toBe(false);
    expect(await count("purchases")).toBe(0); expect(await count("webhook_events")).toBe(1);
  });
  it("fails closed on environment mismatch", async () => {
    expect((await processEvent(event(),"production")).ok).toBe(false);
    expect(await count("purchases")).toBe(0);
  });
  it("reprocesses a failed event once its offer configuration is corrected", async () => {
    await db.exec("update public.payment_offers set enabled=false");
    expect((await processEvent()).ok).toBe(false);
    await db.exec("update public.payment_offers set enabled=true");
    expect(await processEvent()).toMatchObject({ ok: true, duplicate: true });
    expect(await count("access_entitlements")).toBe(1);
  });
  it("rejects reuse of an event identifier with changed content", async () => {
    await processEvent(); expect((await processEvent({ ...event(), buyer_email: "other@example.com" })).ok).toBe(false);
  });
  it("handles purchase before registration and only claims a verified Auth email", async () => {
    await db.query("delete from auth.users where id=$1",[user]);
    await processEvent();
    expect((await db.query<{ user_id: string | null }>("select user_id from public.purchases")).rows[0].user_id).toBeNull();
    await db.query("insert into auth.users(id,email) values($1,'buyer@example.com')",[user]);
    await authenticated(); await db.exec("select public.claim_one_time_purchases()"); expect(await access()).toBe(false);
    await db.exec("reset role"); await db.query("update auth.users set email_confirmed_at=now() where id=$1",[user]);
    await authenticated(); await db.exec("select public.claim_one_time_purchases()"); expect(await access()).toBe(true);
  });
  it("does not attach an existing unverified user or a different email", async () => {
    await db.query("update auth.users set email_confirmed_at=null where id=$1",[user]);
    await processEvent();
    await authenticated(other); await db.exec("select public.claim_one_time_purchases()"); expect(await access()).toBe(false);
    expect(await count("purchases")).toBe(0);
  });
  it.each(["refunded","chargeback"])("revokes only the affected transaction on %s and resists late approvals", async status => {
    await processEvent(); await processEvent(event("r",status)); await processEvent(event("late","approved"));
    await authenticated(); expect(await access()).toBe(false); await db.exec("reset role");
    await processEvent(event("second","approved","tx2"));
    await authenticated(); expect(await access()).toBe(true);
  });
  it("does not activate when a refund arrives before approval", async () => {
    await processEvent(event("r","refunded")); await processEvent();
    expect(await count("access_entitlements")).toBe(0);
  });
  it("pending/cancelled or disputed events never undo a confirmed purchase", async () => {
    await processEvent(); await processEvent(event("old","pending", "tx1", "2026-09-06T10:00:00Z"));
    await processEvent(event("cancel","cancelled")); await processEvent(event("dispute","review"));
    await authenticated(); expect(await access()).toBe(true);
  });
  it("queues refunds for review until revocation policy is explicitly configured", async () => {
    await db.exec("update public.payment_offers set revoke_on_refund=false");
    await processEvent(); await processEvent(event("r","refunded"));
    expect((await db.query<{ error: string | null }>("select error from public.webhook_events where event_id='r'")).rows[0].error).toBe("REVIEW_REQUIRED");
    await authenticated(); expect(await access()).toBe(true);
  });
  it("preserves historical subscription rows and access even after a new purchase refund", async () => {
    await db.query("insert into public.subscriptions(user_id,plan_id,status,current_period_end) select $1,id,'active',now()+interval '1 month' from public.plans where code='decoquote-emprende'",[user]);
    const before = await db.query("select * from public.subscriptions");
    await processEvent(); await processEvent(event("r","refunded"));
    expect((await db.query("select * from public.subscriptions")).rows).toEqual(before.rows);
    await authenticated(); expect(await access()).toBe(true);
  });
  it("blocks direct purchase writes, provider RPCs and admin retries for normal users", async () => {
    await authenticated();
    // Savepoints keep the surrounding fixture transaction usable after expected errors.
    for (const sql of ["insert into public.purchases(transaction_id) values('forged')", "select public.process_one_time_purchase('{}','test')", "select public.retry_one_time_event(gen_random_uuid(),'unauthorized attempt')", "select public.reconcile_purchase_access(gen_random_uuid(),'grant',null,'unauthorized attempt')"]) {
      await db.exec("savepoint rejected"); await expect(db.exec(sql)).rejects.toThrow(); await db.exec("rollback to savepoint rejected");
    }
  });
  it("enforces RLS without purchase, preserves business data, and isolates other buyers", async () => {
    await db.query("insert into public.customers(user_id,full_name) values($1,'Original customer')",[user]);
    await authenticated(); expect(await count("customers")).toBe(0);
    await db.exec("savepoint denied"); await expect(db.query("insert into public.customers(user_id,full_name) values($1,'Bypass')",[user])).rejects.toThrow(); await db.exec("rollback to savepoint denied");
    await db.exec("reset role"); await processEvent(); await authenticated();
    expect(await count("customers")).toBe(1); expect(await count("catalog_items")).toBeGreaterThan(0);
    await authenticated(other); expect(await count("customers")).toBe(0); expect(await count("catalog_items")).toBe(0);
  });
  it("persists quotes and profitability, generates PDF, and keeps records after revocation", async () => {
    await processEvent(); await authenticated();
    await db.query("insert into public.business_profiles(user_id,business_name,owner_name) values($1,'Creative business','Buyer')",[user]);
    const customer = (await db.query<Customer>("insert into public.customers(user_id,full_name) values($1,'Customer') returning *",[user])).rows[0];
    const calculation = calculateQuote({ items: [{ itemType: "material", quantity: 2, unitCostCents: 1000, unitPriceCents: 1400 }], laborCostCents: 500, transportCostCents: 200, otherCostCents: 300, marginType: "percentage", marginValue: 40 });
    const payload = { customer_id: customer.id, event_name: "Birthday", event_type: "Celebration", event_date: "2026-09-12", event_location: "Quito", currency: "USD", items_cost_cents: calculation.itemsCostCents, items_price_cents: calculation.itemsPriceCents, labor_cost_cents: 500, transport_cost_cents: 200, other_cost_cents: 300, total_cost_cents: calculation.totalCostCents, margin_type: "percentage", margin_percentage: 40, margin_amount_cents: calculation.marginAmountCents, recommended_price_cents: calculation.recommendedPriceCents, final_price_cents: calculation.finalPriceCents, estimated_profit_cents: calculation.estimatedProfitCents,
      items: [{ item_type: "material", name: "Balloons", quantity: 2, unit: "unidad", unit_cost_cents: 1000, unit_price_cents: 1400, total_cost_cents: 2000, total_price_cents: 2800, sort_order: 0 }] };
    await db.query("select public.save_decoquote_quote(null,$1::jsonb)",[JSON.stringify(payload)]);
    const quote = (await db.query<Quote>("select * from public.quotes")).rows[0];
    expect(Number(quote.estimated_profit_cents)).toBe(1200);
    expect(quote.quote_number).toMatch(/^DQ-/);
    const business = (await db.query<BusinessProfile>("select * from public.business_profiles")).rows[0];
    const items = (await db.query<QuoteItem>("select * from public.quote_items")).rows;
    const pdf = await generateQuotePdf({ business, customer, quote, items });
    expect(new TextDecoder().decode(pdf.slice(0,5))).toBe("%PDF-");
    await db.exec("select public.record_decoquote_usage('quotes',1000)");
    expect(await access()).toBe(true);
    await db.exec("reset role"); await processEvent(event("r","refunded"));
    expect(await count("quotes")).toBe(1); expect(await count("quote_items")).toBe(1);
    await authenticated(); expect(await count("quotes")).toBe(0);
    await db.exec("savepoint denied");
    await expect(db.query("select public.save_decoquote_quote(null,$1::jsonb)",[JSON.stringify(payload)])).rejects.toThrow();
    await db.exec("rollback to savepoint denied");
  });
  it("audits authorized retries and preserves their original payload", async () => {
    await db.exec("update public.payment_offers set enabled=false"); await processEvent();
    await db.exec("update public.payment_offers set enabled=true");
    await db.query("update public.profiles set role='admin' where id=$1",[user]);
    await authenticated();
    const result = await db.query<{ result: { ok: boolean } }>("select public.retry_one_time_event((select id from public.webhook_events where event_id='e1'),'Offer verified by administrator') result");
    expect(result.rows[0].result.ok).toBe(true); expect(await count("payment_admin_audit")).toBe(1);
  });

  it("requires approved purchases for administrative grants and audits manual changes", async () => {
    await processEvent();
    const purchaseId = (await db.query<{ id: string }>("select id from public.purchases")).rows[0].id;
    await db.query("update public.profiles set role='admin' where id=$1",[other]);
    await authenticated(other);
    await db.query("select public.reconcile_purchase_access($1,'revoke',null,'Authorized test revocation')",[purchaseId]);
    await authenticated(user); expect(await access()).toBe(false);
    await authenticated(other);
    await db.query("select public.reconcile_purchase_access($1,'grant',null,'Approved purchase verified')",[purchaseId]);
    await authenticated(user); expect(await access()).toBe(true);
    await authenticated(other); expect(await count("payment_admin_audit")).toBe(2);
  });

});
