import { describe, it, expect } from "vitest";
import { HealthStatusSchema } from "./common";

describe("HealthStatusSchema", () => {
  it("should validate a correct health status object", () => {
    const validData = {
      service: "api",
      status: "ok",
      timestamp: new Date().toISOString(),
    };

    const result = HealthStatusSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it("should fail validation if status is not 'ok'", () => {
    const invalidData = {
      service: "api",
      status: "error",
      timestamp: new Date().toISOString(),
    };

    const result = HealthStatusSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it("should fail validation if timestamp is missing", () => {
    const invalidData = {
      service: "api",
      status: "ok",
    };

    const result = HealthStatusSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
