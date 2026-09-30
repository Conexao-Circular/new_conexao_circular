import { describe, it, expect } from "vitest";
import { formatAddress, parseTimeWindow, parseVolumes } from "@/lib/address";

describe("formatAddress", () => {
  it("composes a single-line address from structured fields", () => {
    expect(
      formatAddress({
        zip: "60000-000",
        street: "Rua das Flores",
        number: "123",
        complement: "Apto 4",
        neighborhood: "Centro",
        city: "Fortaleza",
        state: "CE",
        reference: null,
      }),
    ).toBe("Rua das Flores, 123, Apto 4, Centro, Fortaleza - CE, CEP 60000-000");
  });

  it("skips missing fields without leaving empty separators", () => {
    expect(
      formatAddress({
        zip: null,
        street: "Rua das Flores",
        number: null,
        complement: null,
        neighborhood: null,
        city: "Fortaleza",
        state: null,
        reference: null,
      }),
    ).toBe("Rua das Flores, Fortaleza");
  });
});

describe("parseTimeWindow", () => {
  it("defaults to 'qualquer' when empty", () => {
    expect(parseTimeWindow("")).toBe("qualquer");
    expect(parseTimeWindow(null)).toBe("qualquer");
  });

  it("accepts a known window and rejects unknown values", () => {
    expect(parseTimeWindow("manha")).toBe("manha");
    expect(parseTimeWindow("madrugada")).toBeNull();
  });
});

describe("parseVolumes", () => {
  it("accepts non-negative integers and empty as null", () => {
    expect(parseVolumes("3")).toBe(3);
    expect(parseVolumes("")).toBeNull();
    expect(parseVolumes(null)).toBeNull();
  });

  it("rejects negative or decimal values", () => {
    expect(parseVolumes("-1")).toBeNull();
    expect(parseVolumes("2.5")).toBeNull();
  });
});
