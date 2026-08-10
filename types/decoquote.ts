import type {
  BusinessProfile,
  Customer,
  MarginType,
  Material,
  Quote,
  QuoteItem,
  QuoteItemType,
  QuoteStatus,
  Service,
} from "@/types/database";
import type { QuoteCalculation } from "@/lib/decoquote/calculations";

export type {
  BusinessProfile,
  Customer,
  Material,
  Quote,
  QuoteCalculation,
  QuoteItem,
  QuoteItemType,
  QuoteStatus,
  Service,
};

export interface QuoteEditorItem {
  id: string;
  itemType: QuoteItemType;
  referenceId: string | null;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  unitPriceCents: number;
}

export interface QuoteEditorPayload {
  customerId: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  validUntil: string | null;
  items: QuoteEditorItem[];
  laborCostCents: number;
  transportCostCents: number;
  otherCostCents: number;
  marginType: MarginType;
  marginValue: number;
  finalPriceCents: number | null;
  notes: string;
  terms: string;
}
