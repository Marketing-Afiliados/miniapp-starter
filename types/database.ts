export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "inactive" | "suspended";
export type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired"
  | "refunded";
export type QuoteStatus = "draft" | "sent" | "approved" | "rejected" | "expired" | "completed";
export type QuoteItemType = "service" | "material" | "custom";
export type MarginType = "percentage" | "fixed";

export interface Profile extends Record<string, unknown> {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface Plan extends Record<string, unknown> {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  currency: string;
  billing_interval: string;
  limits: Json;
  provider_product_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription extends Record<string, unknown> {
  id: string;
  user_id: string;
  plan_id: string;
  provider: string;
  provider_subscription_id: string | null;
  provider_transaction_id: string | null;
  status: SubscriptionStatus;
  started_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageRecord extends Record<string, unknown> {
  id: string;
  user_id: string;
  feature: string;
  quantity: number;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent extends Record<string, unknown> {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  payload: Json;
  buyer_email: string | null;
  provider_subscription_id: string | null;
  provider_transaction_id: string | null;
  plan_id: string | null;
  subscription_status: SubscriptionStatus | null;
  current_period_start: string | null;
  current_period_end: string | null;
  processed: boolean;
  processed_at: string | null;
  error: string | null;
  created_at: string;
}

export interface BusinessProfile extends Record<string, unknown> {
  id: string;
  user_id: string;
  business_name: string;
  owner_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  instagram: string | null;
  logo_url: string | null;
  address: string | null;
  country_code: string;
  currency: string;
  default_margin_percentage: number;
  default_terms: string | null;
  created_at: string;
  updated_at: string;
}

export interface Customer extends Record<string, unknown> {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service extends Record<string, unknown> {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  default_price_cents: number;
  default_cost_cents: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Material extends Record<string, unknown> {
  id: string;
  user_id: string;
  name: string;
  unit: string;
  unit_cost_cents: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Quote extends Record<string, unknown> {
  id: string;
  user_id: string;
  customer_id: string;
  quote_number: string;
  quote_sequence: number;
  event_name: string;
  event_type: string;
  event_date: string;
  event_location: string;
  valid_until: string | null;
  status: QuoteStatus;
  currency: string;
  items_cost_cents: number;
  items_price_cents: number;
  labor_cost_cents: number;
  transport_cost_cents: number;
  other_cost_cents: number;
  total_cost_cents: number;
  margin_type: MarginType;
  margin_percentage: number | null;
  fixed_margin_cents: number | null;
  margin_amount_cents: number;
  recommended_price_cents: number;
  final_price_cents: number;
  estimated_profit_cents: number;
  notes: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem extends Record<string, unknown> {
  id: string;
  quote_id: string;
  user_id: string;
  item_type: QuoteItemType;
  reference_id: string | null;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unit_cost_cents: number;
  unit_price_cents: number;
  total_cost_cents: number;
  total_price_cents: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: TableDefinition<
        Profile,
        Pick<Profile, "id" | "email"> & Partial<Omit<Profile, "id" | "email">>,
        Partial<Omit<Profile, "id">>
      >;
      plans: TableDefinition<
        Plan,
        Pick<Plan, "name" | "code"> & Partial<Omit<Plan, "id" | "name" | "code">>,
        Partial<Omit<Plan, "id">>
      >;
      subscriptions: TableDefinition<
        Subscription,
        Pick<Subscription, "user_id" | "plan_id" | "provider" | "status"> &
          Partial<Omit<Subscription, "id" | "user_id" | "plan_id" | "provider" | "status">>,
        Partial<Omit<Subscription, "id">>
      >;
      usage: TableDefinition<
        UsageRecord,
        Pick<UsageRecord, "user_id" | "feature" | "period_start" | "period_end"> &
          Partial<Omit<UsageRecord, "id" | "user_id" | "feature" | "period_start" | "period_end">>,
        Partial<Omit<UsageRecord, "id">>
      >;
      webhook_events: TableDefinition<
        WebhookEvent,
        Pick<WebhookEvent, "provider" | "event_id" | "event_type" | "payload"> &
          Partial<Omit<WebhookEvent, "id" | "provider" | "event_id" | "event_type" | "payload">>,
        Partial<Omit<WebhookEvent, "id">>
      >;
      business_profiles: TableDefinition<
        BusinessProfile,
        Pick<BusinessProfile, "user_id" | "business_name" | "owner_name"> &
          Partial<Omit<BusinessProfile, "id" | "user_id" | "business_name" | "owner_name">>,
        Partial<Omit<BusinessProfile, "id" | "user_id">>
      >;
      customers: TableDefinition<
        Customer,
        Pick<Customer, "user_id" | "full_name"> &
          Partial<Omit<Customer, "id" | "user_id" | "full_name">>,
        Partial<Omit<Customer, "id" | "user_id">>
      >;
      services: TableDefinition<
        Service,
        Pick<Service, "user_id" | "name"> & Partial<Omit<Service, "id" | "user_id" | "name">>,
        Partial<Omit<Service, "id" | "user_id">>
      >;
      materials: TableDefinition<
        Material,
        Pick<Material, "user_id" | "name"> & Partial<Omit<Material, "id" | "user_id" | "name">>,
        Partial<Omit<Material, "id" | "user_id">>
      >;
      quotes: TableDefinition<
        Quote,
        Pick<Quote, "user_id" | "customer_id" | "event_name" | "event_type" | "event_date" | "event_location"> &
          Partial<Omit<Quote, "id" | "user_id" | "customer_id" | "event_name" | "event_type" | "event_date" | "event_location">>,
        Partial<Omit<Quote, "id" | "user_id" | "quote_number" | "quote_sequence">>
      >;
      quote_items: TableDefinition<
        QuoteItem,
        Pick<QuoteItem, "quote_id" | "user_id" | "item_type" | "name"> &
          Partial<Omit<QuoteItem, "id" | "quote_id" | "user_id" | "item_type" | "name">>,
        Partial<Omit<QuoteItem, "id" | "quote_id" | "user_id">>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
      save_decoquote_quote: {
        Args: { p_quote_id: string | null; p_payload: Json };
        Returns: string;
      };
      record_decoquote_usage: {
        Args: { p_feature: string; p_quantity?: number };
        Returns: undefined;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
