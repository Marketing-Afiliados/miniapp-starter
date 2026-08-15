import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import { buildCommercialProposalLines } from "./commercial-lines";
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

export interface ImageFit {
  width: number;
  height: number;
  xOffset: number;
  yOffset: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

const COLORS = {
  ink: rgb(0.208, 0.169, 0.239),
  muted: rgb(0.455, 0.4, 0.49),
  subtle: rgb(0.63, 0.57, 0.66),
  violet: rgb(0.545, 0.361, 0.965),
  violetDark: rgb(0.424, 0.157, 0.827),
  lavender: rgb(0.933, 0.906, 1),
  lavenderLine: rgb(0.875, 0.824, 0.97),
  blush: rgb(0.973, 0.863, 0.91),
  peach: rgb(1, 0.882, 0.78),
  mint: rgb(0.847, 0.953, 0.898),
  sky: rgb(0.863, 0.933, 1),
  cream: rgb(1, 0.985, 0.965),
  white: rgb(1, 1, 1),
};

function clean(value: string | null | undefined) {
  return (value ?? "").replace(/[^ -~ -ÿ]/g, " ");
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = clean(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

export function fitImageWithin(
  imageWidth: number,
  imageHeight: number,
  maxWidth: number,
  maxHeight: number,
): ImageFit {
  if (imageWidth <= 0 || imageHeight <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return { width: 0, height: 0, xOffset: 0, yOffset: 0 };
  }
  const scale = Math.min(maxWidth / imageWidth, maxHeight / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    xOffset: (maxWidth - width) / 2,
    yOffset: (maxHeight - height) / 2,
  };
}

export async function generateQuotePdf({ business, customer, quote, items, logo }: QuotePdfData): Promise<Uint8Array> {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page: PDFPage;
  let y = 0;

  const drawTextAt = (
    value: string,
    x: number,
    yPosition: number,
    size = 10,
    font = regular,
    color = COLORS.muted,
  ) => {
    page.drawText(clean(value), { x, y: yPosition, size, font, color });
  };

  const drawRightTextAt = (
    value: string,
    rightX: number,
    yPosition: number,
    size = 10,
    font = regular,
    color = COLORS.muted,
  ) => {
    const cleaned = clean(value);
    page.drawText(cleaned, {
      x: rightX - font.widthOfTextAtSize(cleaned, size),
      y: yPosition,
      size,
      font,
      color,
    });
  };

  const fittedSize = (value: string, font: PDFFont, preferred: number, min: number, maxWidth: number) => {
    let size = preferred;
    while (size > min && font.widthOfTextAtSize(clean(value), size) > maxWidth) size -= 0.5;
    return size;
  };

  const drawBackground = (currentPage: PDFPage) => {
    currentPage.drawRectangle({ x: 0, y: 0, width: PAGE_WIDTH, height: PAGE_HEIGHT, color: COLORS.cream });
    currentPage.drawRectangle({ x: 0, y: PAGE_HEIGHT - 7, width: PAGE_WIDTH, height: 7, color: COLORS.violet });
  };

  const addContinuationPage = () => {
    page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    drawBackground(page);
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 92, width: PAGE_WIDTH, height: 85, color: COLORS.lavender });
    page.drawEllipse({ x: PAGE_WIDTH - 44, y: PAGE_HEIGHT - 35, xScale: 54, yScale: 54, color: COLORS.blush, opacity: 0.72 });
    drawTextAt("MAGICS DECOQUOTE", MARGIN, PAGE_HEIGHT - 48, 9, bold, COLORS.violetDark);
    drawTextAt(quote.event_name, MARGIN, PAGE_HEIGHT - 68, 14, bold, COLORS.ink);
    drawRightTextAt(`${quote.quote_number} - Continuacion`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 58, 8, bold, COLORS.muted);
    y = PAGE_HEIGHT - 120;
  };

  page = document.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  drawBackground(page);

  const headerBottom = PAGE_HEIGHT - 172;
  page.drawRectangle({ x: 0, y: headerBottom, width: PAGE_WIDTH, height: 165, color: COLORS.lavender });
  page.drawEllipse({ x: PAGE_WIDTH - 28, y: PAGE_HEIGHT - 38, xScale: 72, yScale: 72, color: COLORS.blush, opacity: 0.78 });
  page.drawEllipse({ x: PAGE_WIDTH - 105, y: headerBottom + 15, xScale: 42, yScale: 42, color: COLORS.peach, opacity: 0.68 });
  page.drawEllipse({ x: 25, y: headerBottom + 8, xScale: 36, yScale: 36, color: COLORS.sky, opacity: 0.72 });

  const logoCard = { x: MARGIN, y: PAGE_HEIGHT - 111, width: 128, height: 66 };
  page.drawRectangle({
    x: logoCard.x + 2,
    y: logoCard.y - 2,
    width: logoCard.width,
    height: logoCard.height,
    color: COLORS.violet,
    opacity: 0.1,
  });
  page.drawRectangle({
    x: logoCard.x,
    y: logoCard.y,
    width: logoCard.width,
    height: logoCard.height,
    color: COLORS.white,
    borderColor: COLORS.lavenderLine,
    borderWidth: 0.8,
  });

  let logoRendered = false;
  if (logo) {
    try {
      const image = logo.mimeType === "image/png"
        ? await document.embedPng(logo.bytes)
        : await document.embedJpg(logo.bytes);
      const content = { x: logoCard.x + 10, y: logoCard.y + 9, width: logoCard.width - 20, height: logoCard.height - 18 };
      const fitted = fitImageWithin(image.width, image.height, content.width, content.height);
      page.drawImage(image, {
        x: content.x + fitted.xOffset,
        y: content.y + fitted.yOffset,
        width: fitted.width,
        height: fitted.height,
      });
      logoRendered = true;
    } catch {
      logoRendered = false;
    }
  }

  if (!logoRendered) {
    const centerX = logoCard.x + 32;
    const centerY = logoCard.y + 33;
    page.drawEllipse({ x: centerX, y: centerY + 10, xScale: 8, yScale: 8, color: COLORS.violet });
    page.drawEllipse({ x: centerX + 10, y: centerY, xScale: 8, yScale: 8, color: COLORS.peach });
    page.drawEllipse({ x: centerX, y: centerY - 10, xScale: 8, yScale: 8, color: COLORS.mint });
    page.drawEllipse({ x: centerX - 10, y: centerY, xScale: 8, yScale: 8, color: COLORS.blush });
    page.drawEllipse({ x: centerX, y: centerY, xScale: 5, yScale: 5, color: COLORS.violetDark });
    drawTextAt("DecoQuote", logoCard.x + 53, logoCard.y + 29, 10, bold, COLORS.ink);
  }

  const businessX = 194;
  drawTextAt(
    business.business_name,
    businessX,
    PAGE_HEIGHT - 70,
    fittedSize(business.business_name, bold, 17, 11, 205),
    bold,
    COLORS.ink,
  );
  drawTextAt("PROPUESTA DE DECORACION", businessX, PAGE_HEIGHT - 91, 8, bold, COLORS.violetDark);

  drawRightTextAt("COTIZACION", PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 57, 7, bold, COLORS.violetDark);
  drawRightTextAt(quote.quote_number, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 76, 11, bold, COLORS.ink);
  drawRightTextAt(
    `Fecha: ${new Date(quote.created_at).toLocaleDateString("es-EC")}`,
    PAGE_WIDTH - MARGIN,
    PAGE_HEIGHT - 94,
    8,
    regular,
    COLORS.muted,
  );
  if (quote.valid_until) {
    drawRightTextAt(`Valida hasta: ${quote.valid_until}`, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 108, 8, regular, COLORS.muted);
  }

  const infoTop = headerBottom - 24;
  const infoHeight = 90;
  const infoWidth = (PAGE_WIDTH - MARGIN * 2 - 18) / 2;
  const infoBottom = infoTop - infoHeight;
  page.drawRectangle({ x: MARGIN, y: infoBottom, width: infoWidth, height: infoHeight, color: COLORS.white, borderColor: COLORS.lavenderLine, borderWidth: 0.7 });
  page.drawRectangle({ x: MARGIN, y: infoTop - 5, width: infoWidth, height: 5, color: COLORS.blush });
  page.drawRectangle({ x: MARGIN + infoWidth + 18, y: infoBottom, width: infoWidth, height: infoHeight, color: COLORS.white, borderColor: COLORS.lavenderLine, borderWidth: 0.7 });
  page.drawRectangle({ x: MARGIN + infoWidth + 18, y: infoTop - 5, width: infoWidth, height: 5, color: COLORS.sky });

  const leftX = MARGIN + 15;
  drawTextAt("PREPARADO PARA", leftX, infoTop - 23, 7, bold, COLORS.violetDark);
  drawTextAt(customer.full_name, leftX, infoTop - 45, fittedSize(customer.full_name, bold, 13, 10, infoWidth - 30), bold, COLORS.ink);
  drawTextAt(customer.email || customer.whatsapp || customer.phone || "", leftX, infoTop - 65, 8.5, regular, COLORS.muted);

  const rightX = MARGIN + infoWidth + 33;
  drawTextAt("EVENTO", rightX, infoTop - 23, 7, bold, COLORS.violetDark);
  drawTextAt(quote.event_name, rightX, infoTop - 45, fittedSize(quote.event_name, bold, 13, 10, infoWidth - 30), bold, COLORS.ink);
  drawTextAt(`${quote.event_type} | ${quote.event_date}`, rightX, infoTop - 63, 8.5, regular, COLORS.muted);
  const location = wrap(quote.event_location, regular, 8, infoWidth - 30)[0] ?? "";
  drawTextAt(location, rightX, infoTop - 78, 8, regular, COLORS.muted);

  y = infoBottom - 40;

  const drawTableHeader = () => {
    page.drawRectangle({ x: MARGIN, y: y - 7, width: PAGE_WIDTH - MARGIN * 2, height: 29, color: COLORS.ink });
    drawTextAt("DESCRIPCION", MARGIN + 13, y + 3, 8, bold, COLORS.white);
    drawTextAt("CANT.", 390, y + 3, 8, bold, COLORS.white);
    drawRightTextAt("IMPORTE", PAGE_WIDTH - MARGIN - 13, y + 3, 8, bold, COLORS.white);
    y -= 34;
  };

  drawTableHeader();
  const commercialLines = buildCommercialProposalLines(quote, items);
  for (const [index, line] of commercialLines.entries()) {
    const nameLines = wrap(line.name, bold, 9, 295);
    const descriptionLines = line.description ? wrap(line.description, regular, 8, 295) : [];
    const rowHeight = Math.max(38, nameLines.length * 12 + descriptionLines.length * 11 + 12);
    if (y - rowHeight < MARGIN + 105) {
      addContinuationPage();
      drawTableHeader();
    }
    const rowTop = y;
    if (index % 2 === 0) {
      page.drawRectangle({ x: MARGIN, y: rowTop - rowHeight + 5, width: PAGE_WIDTH - MARGIN * 2, height: rowHeight, color: COLORS.white, opacity: 0.72 });
    }
    let lineY = rowTop - 5;
    for (const nameLine of nameLines) {
      drawTextAt(nameLine, MARGIN + 13, lineY, 9, bold, COLORS.ink);
      lineY -= 12;
    }
    for (const descriptionLine of descriptionLines) {
      drawTextAt(descriptionLine, MARGIN + 13, lineY, 8, regular, COLORS.muted);
      lineY -= 11;
    }
    drawTextAt(line.quantityLabel, 390, rowTop - 5, 9, regular, COLORS.muted);
    drawRightTextAt(
      line.amountCents > 0 ? formatCurrency(line.amountCents, quote.currency) : "Incluido",
      PAGE_WIDTH - MARGIN - 13,
      rowTop - 5,
      9,
      bold,
      COLORS.ink,
    );
    y = rowTop - rowHeight;
    page.drawLine({
      start: { x: MARGIN, y: y + 5 },
      end: { x: PAGE_WIDTH - MARGIN, y: y + 5 },
      thickness: 0.55,
      color: COLORS.lavenderLine,
    });
  }

  if (y - 190 < MARGIN + 45) addContinuationPage();
  y -= 20;
  drawRightTextAt("Subtotal propuesta", 420, y, 8, bold, COLORS.muted);
  drawRightTextAt(formatCurrency(quote.final_price_cents, quote.currency), PAGE_WIDTH - MARGIN, y, 10, bold, COLORS.ink);
  y -= 58;

  const totalX = 318;
  const totalWidth = PAGE_WIDTH - MARGIN - totalX;
  page.drawRectangle({ x: totalX + 4, y: y - 7, width: totalWidth, height: 52, color: COLORS.blush });
  page.drawRectangle({ x: totalX, y: y - 3, width: totalWidth, height: 52, color: COLORS.violet });
  drawTextAt(`TOTAL ${quote.currency}`, totalX + 17, y + 14, 8, bold, COLORS.lavender);
  const finalPriceLabel = formatCurrency(quote.final_price_cents, quote.currency);
  drawRightTextAt(
    finalPriceLabel,
    PAGE_WIDTH - MARGIN - 16,
    y + 10,
    fittedSize(finalPriceLabel, bold, 18, 12, 118),
    bold,
    COLORS.white,
  );
  y -= 43;

  if (quote.terms) {
    const termLines = wrap(quote.terms, regular, 9, PAGE_WIDTH - MARGIN * 2 - 28);
    const termHeight = Math.max(70, termLines.length * 14 + 38);
    if (y - termHeight < MARGIN + 48) addContinuationPage();
    y -= 24;
    page.drawRectangle({
      x: MARGIN,
      y: y - termHeight + 17,
      width: PAGE_WIDTH - MARGIN * 2,
      height: termHeight,
      color: COLORS.lavender,
      opacity: 0.72,
      borderColor: COLORS.lavenderLine,
      borderWidth: 0.6,
    });
    drawTextAt("CONDICIONES", MARGIN + 14, y - 4, 8, bold, COLORS.violetDark);
    let termY = y - 23;
    for (const line of termLines) {
      drawTextAt(line, MARGIN + 14, termY, 9, regular, COLORS.muted);
      termY -= 14;
    }
    y -= termHeight;
  }

  const contact = [business.owner_name, business.phone, business.whatsapp, business.email, business.instagram]
    .filter(Boolean)
    .join(" | ");
  page.drawRectangle({ x: MARGIN, y: 44, width: PAGE_WIDTH - MARGIN * 2, height: 30, color: COLORS.mint, opacity: 0.72 });
  drawTextAt("CONTACTO", MARGIN + 12, 56, 7, bold, COLORS.ink);
  drawTextAt(
    contact,
    MARGIN + 82,
    55,
    fittedSize(contact, regular, 8, 6, PAGE_WIDTH - MARGIN * 2 - 94),
    regular,
    COLORS.muted,
  );

  const pageCount = document.getPageCount();
  document.getPages().forEach((current, index) => {
    current.drawLine({
      start: { x: MARGIN, y: 36 },
      end: { x: PAGE_WIDTH - MARGIN, y: 36 },
      thickness: 0.5,
      color: COLORS.lavenderLine,
    });
    current.drawText("Magics DecoQuote", { x: MARGIN, y: 22, size: 7, font: bold, color: COLORS.violetDark });
    const pageLabel = `Pagina ${index + 1} de ${pageCount}`;
    current.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageLabel, 7),
      y: 22,
      size: 7,
      font: regular,
      color: COLORS.subtle,
    });
  });

  document.setTitle(`${quote.quote_number} - ${quote.event_name}`);
  document.setAuthor(business.business_name);
  document.setSubject("Propuesta comercial de decoracion");
  return document.save();
}
