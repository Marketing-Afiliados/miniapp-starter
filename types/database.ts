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
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: {
        Args: Record<never, never>;
        Returns: boolean;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
