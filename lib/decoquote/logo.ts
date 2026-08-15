export const BUSINESS_LOGO_BUCKET = "business-logos";
export const BUSINESS_LOGO_MAX_BYTES = 2 * 1024 * 1024;

const LOGO_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
} as const;

type LogoMimeType = keyof typeof LOGO_EXTENSIONS;

export interface BusinessLogoValidation {
  file: File | null;
  extension: "jpg" | "png" | null;
  error?: string;
}

export function validateBusinessLogoMetadata(
  file: Pick<File, "size" | "type">,
): string | undefined {
  if (file.size > BUSINESS_LOGO_MAX_BYTES) {
    return "El logo no puede superar 2 MB.";
  }
  if (!(file.type in LOGO_EXTENSIONS)) {
    return "Carga una imagen PNG o JPG.";
  }
}

function hasValidSignature(bytes: Uint8Array, mimeType: LogoMimeType) {
  if (mimeType === "image/png") {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return signature.every((value, index) => bytes[index] === value);
  }
  return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

export async function validateBusinessLogo(value: FormDataEntryValue | null): Promise<BusinessLogoValidation> {
  if (!(value instanceof File) || value.size === 0) {
    return { file: null, extension: null };
  }
  const metadataError = validateBusinessLogoMetadata(value);
  if (metadataError) {
    return { file: null, extension: null, error: metadataError };
  }
  const mimeType = value.type as LogoMimeType;
  const header = new Uint8Array(await value.slice(0, 12).arrayBuffer());
  if (!hasValidSignature(header, mimeType)) {
    return { file: null, extension: null, error: "El archivo no contiene una imagen válida." };
  }
  return { file: value, extension: LOGO_EXTENSIONS[mimeType] };
}

export function createBusinessLogoPath(userId: string, extension: "jpg" | "png") {
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

export function getBusinessLogoStoragePath(url: string | null | undefined): string | null {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUSINESS_LOGO_BUCKET}/`;
  try {
    const path = new URL(url).pathname;
    const markerIndex = path.indexOf(marker);
    return markerIndex >= 0 ? decodeURIComponent(path.slice(markerIndex + marker.length)) : null;
  } catch {
    return null;
  }
}
