import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { formatCurrency } from "./money";
import type { BusinessProfile, Customer, Quote, QuoteItem } from "@/types/database";

export interface QuotePdfData {
  business: BusinessProfile;
  customer: Customer;
  quote: Quote;
  items: QuoteItem[];
  logo?: {
    bytes: Uint8Array;
    mimeType: "image/jpeg" | "image/png";
  } | null;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/[^\u0020-\u007e\u00a0-\u00ff]/g, " ");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) current = candidate;
    else { if (current) lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export async function generateQuotePdf({ business, customer, quote, items, logo }: QuotePdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const ensure = (height: number) => {
    if (y - height < MARGIN + 20) {
      page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };
  const text = (value: string, x: number, size = 10, font = regular, color = rgb(0.25, 0.27, 0.35)) => {
    page.drawText(clean(value), { x, y, size, font, color });
  };
  const paragraph = (value: string, x: number, width: number, size = 9, lineHeight = 14) => {
    const lines = wrap(value, regular, size, width);
    ensure(lines.length * lineHeight);
    for (const line of lines) { text(line, x, size); y -= lineHeight; }
  };

  page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 150, width: PAGE_WIDTH, height: 150, color: rgb(0.95, 0.93, 1) });
  if (logo) {
    try {
      const image = logo.mimeType === "image/png"
        ? await document.embedPng(logo.bytes)
        : await document.embedJpg(logo.bytes);
      const scale = Math.min(42 / image.width, 42 / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      page.drawImage(image, {
        x: MARGIN + (42 - width) / 2,
        y: PAGE_HEIGHT - 92 + (42 - height) / 2,
        width,
        height,
      });
    } catch {
      page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 92, width: 42, height: 42, color: rgb(0.48, 0.27, 0.93) });
      page.drawText("DQ", { x: MARGIN + 11, y: PAGE_HEIGHT - 77, size: 12, font: bold, color: rgb(1, 1, 1) });
    }
  } else {
    page.drawRectangle({ x: MARGIN, y: PAGE_HEIGHT - 92, width: 42, height: 42, color: rgb(0.48, 0.27, 0.93) });
    page.drawText("DQ", { x: MARGIN + 11, y: PAGE_HEIGHT - 77, size: 12, font: bold, color: rgb(1, 1, 1) });
  }
  y = PAGE_HEIGHT - 66;
  text(business.business_name, 104, 17, bold, rgb(0.09, 0.1, 0.18));
  y -= 23;
  text("PROPUESTA DE DECORACION", 104, 9, bold, rgb(0.48, 0.27, 0.93));
  y = PAGE_HEIGHT - 62;
  text(quote.quote_number, 430, 11, bold, rgb(0.09, 0.1, 0.18));
  y -= 18;
  text(`Fecha: ${new Date(quote.created_at).toLocaleDateString("es-EC")}`, 430, 8);
  if (quote.valid_until) { y -= 14; text(`Valida hasta: ${quote.valid_until}`, 430, 8); }
  y = PAGE_HEIGHT - 182;

  text("PREPARADO PARA", MARGIN, 8, bold, rgb(0.48, 0.27, 0.93));
  y -= 20; text(customer.full_name, MARGIN, 13, bold, rgb(0.09, 0.1, 0.18));
  y -= 16; text(customer.email || customer.whatsapp || customer.phone || "", MARGIN, 9);
  y = PAGE_HEIGHT - 182;
  text("EVENTO", 320, 8, bold, rgb(0.48, 0.27, 0.93));
  y -= 20; text(quote.event_name, 320, 13, bold, rgb(0.09, 0.1, 0.18));
  y -= 16; text(`${quote.event_type} | ${quote.event_date}`, 320, 9);
  y -= 14; text(quote.event_location, 320, 9);
  y = PAGE_HEIGHT - 285;

  page.drawRectangle({ x: MARGIN, y: y - 5, width: PAGE_WIDTH - MARGIN * 2, height: 25, color: rgb(0.12, 0.13, 0.2) });
  text("DESCRIPCION", MARGIN + 10, 8, bold, rgb(1, 1, 1));
  text("CANT.", 350, 8, bold, rgb(1, 1, 1));
  text("PRECIO", 405, 8, bold, rgb(1, 1, 1));
  text("TOTAL", 500, 8, bold, rgb(1, 1, 1));
  y -= 28;

  for (const item of items) {
    const nameLines = wrap(item.name, bold, 9, 270);
    const descriptionLines = item.description ? wrap(item.description, regular, 8, 270) : [];
    const height = Math.max(34, nameLines.length * 12 + descriptionLines.length * 11 + 10);
    ensure(height + 8);
    const rowTop = y;
    for (const line of nameLines) { text(line, MARGIN + 10, 9, bold, rgb(0.09, 0.1, 0.18)); y -= 12; }
    for (const line of descriptionLines) { text(line, MARGIN + 10, 8); y -= 11; }
    text(`${item.quantity}`, 350, 9);
    text(formatCurrency(item.unit_price_cents, quote.currency), 405, 9);
    text(formatCurrency(item.total_price_cents, quote.currency), 500, 9, bold, rgb(0.09, 0.1, 0.18));
    y = rowTop - height;
    page.drawLine({ start: { x: MARGIN, y: y + 5 }, end: { x: PAGE_WIDTH - MARGIN, y: y + 5 }, thickness: 0.5, color: rgb(0.88, 0.88, 0.92) });
  }

  ensure(125);
  y -= 18;
  text("TOTAL DE LA PROPUESTA", 340, 9, bold, rgb(0.25, 0.27, 0.35));
  y -= 48;
  page.drawRectangle({ x: 335, y: y - 8, width: 212, height: 42, color: rgb(0.48, 0.27, 0.93) });
  text(formatCurrency(quote.final_price_cents, quote.currency), 420, 20, bold, rgb(1, 1, 1));
  y -= 50;

  if (quote.terms) {
    ensure(80);
    y -= 10; text("CONDICIONES", MARGIN, 9, bold, rgb(0.48, 0.27, 0.93)); y -= 18;
    paragraph(quote.terms, MARGIN, PAGE_WIDTH - MARGIN * 2);
  }
  y -= 12;
  paragraph([business.owner_name, business.phone, business.whatsapp, business.email, business.instagram].filter(Boolean).join(" | "), MARGIN, PAGE_WIDTH - MARGIN * 2, 8, 12);

  document.getPages().forEach((current: PDFPage, index) => {
    current.drawText(`DecoQuote | Pagina ${index + 1} de ${document.getPageCount()}`, { x: MARGIN, y: 24, size: 7, font: regular, color: rgb(0.55, 0.56, 0.62) });
  });
  document.setTitle(`${quote.quote_number} - ${quote.event_name}`);
  document.setAuthor(business.business_name);
  return document.save();
}
