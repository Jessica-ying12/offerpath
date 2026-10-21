import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { hashSessionToken, issueSessionToken } from "@/lib/session-token";

describe("password hashing", () => {
  it("verifies the right password and rejects the wrong one", () => {
    const stored = hashPassword("Demo123456");
    expect(stored).toContain(":");
    expect(verifyPassword("Demo123456", stored)).toBe(true);
    expect(verifyPassword("demo123456", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("uses a unique salt each time", () => {
    const first = hashPassword("same-password");
    const second = hashPassword("same-password");
    expect(first).not.toEqual(second);
    expect(verifyPassword("same-password", first)).toBe(true);
    expect(verifyPassword("same-password", second)).toBe(true);
  });

  it("rejects malformed stored hashes", () => {
    expect(verifyPassword("anything", "not-a-hash")).toBe(false);
    expect(verifyPassword("anything", "zz:zz")).toBe(false);
  });
});

describe("session tokens", () => {
  it("creates unique tokens and stable hashes", () => {
    const first = issueSessionToken();
    const second = issueSessionToken();
    expect(first.token).not.toEqual(second.token);
    expect(first.tokenHash).toEqual(hashSessionToken(first.token));
    expect(first.tokenHash).not.toContain(first.token);
  });
});
