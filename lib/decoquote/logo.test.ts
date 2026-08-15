import { describe, expect, it } from "vitest";

import {
  BUSINESS_LOGO_MAX_BYTES,
  validateBusinessLogoMetadata,
} from "./logo";

describe("validateBusinessLogoMetadata", () => {
  it("accepts a PNG up to 2 MB", () => {
    expect(
      validateBusinessLogoMetadata({
        size: BUSINESS_LOGO_MAX_BYTES,
        type: "image/png",
      }),
    ).toBeUndefined();
  });

  it("rejects a logo larger than 2 MB", () => {
    expect(
      validateBusinessLogoMetadata({
        size: BUSINESS_LOGO_MAX_BYTES + 1,
        type: "image/jpeg",
      }),
    ).toBe("El logo no puede superar 2 MB.");
  });

  it("rejects unsupported file types", () => {
    expect(
      validateBusinessLogoMetadata({
        size: 1024,
        type: "image/svg+xml",
      }),
    ).toBe("Carga una imagen PNG o JPG.");
  });
});
