import { describe, expect, it } from "vitest";
import { looksLikeEmail, parseRecoveryHash, validatePassword, MIN_PASSWORD_LENGTH } from "@/lib/auth-utils";

describe("parseRecoveryHash", () => {
  it("accepts a Supabase recovery hash", () => {
    expect(parseRecoveryHash("#type=recovery&access_token=abc123")).toBe(true);
  });
  it("accepts params in any order", () => {
    expect(parseRecoveryHash("#access_token=abc123&type=recovery")).toBe(true);
  });
  it("rejects a signup-confirmation hash", () => {
    expect(parseRecoveryHash("#type=signup&access_token=abc123")).toBe(false);
  });
  it("rejects recovery without a token", () => {
    expect(parseRecoveryHash("#type=recovery")).toBe(false);
  });
  it("rejects empty and unrelated hashes", () => {
    expect(parseRecoveryHash("")).toBe(false);
    expect(parseRecoveryHash("#access_token=abc123")).toBe(false);
  });
});

describe("validatePassword", () => {
  it("rejects passwords shorter than the minimum", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH - 1))).toMatch(/at least/);
  });
  it("accepts a password at the minimum length", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH))).toBeNull();
  });
});

describe("looksLikeEmail", () => {
  it("accepts a normal address", () => {
    expect(looksLikeEmail("actor@example.com")).toBe(true);
  });
  it("rejects missing parts", () => {
    expect(looksLikeEmail("actor@")).toBe(false);
    expect(looksLikeEmail("actor.example.com")).toBe(false);
    expect(looksLikeEmail("")).toBe(false);
  });
});
