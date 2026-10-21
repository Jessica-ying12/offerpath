import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "@/lib/http";

function request(headers: Record<string, string>) {
  return new Request("http://127.0.0.1:3000/api/auth/login", {
    method: "POST",
    headers,
  });
}

describe("same-origin CSRF check", () => {
  it("allows requests without an Origin header (same-origin navigations and non-browser clients)", () => {
    expect(assertSameOrigin(request({}))).toBe(true);
  });

  it("allows a matching origin and rejects a foreign one", () => {
    expect(assertSameOrigin(request({ origin: "http://127.0.0.1:3000" }))).toBe(true);
    expect(assertSameOrigin(request({ origin: "https://evil.example" }))).toBe(false);
  });

  it("trusts the browser fetch metadata, including behind host-rewriting proxies", () => {
    expect(
      assertSameOrigin(
        request({
          origin: "https://3e369e.lhr.life",
          host: "127.0.0.1:3000",
          "sec-fetch-site": "same-origin",
        }),
      ),
    ).toBe(true);
    expect(
      assertSameOrigin(
        request({
          origin: "https://3e369e.lhr.life",
          "sec-fetch-site": "cross-site",
        }),
      ),
    ).toBe(false);
    expect(
      assertSameOrigin(
        request({
          origin: "https://evil.example",
          "sec-fetch-site": "same-site",
        }),
      ),
    ).toBe(false);
  });

  it("uses the forwarded host and protocol behind a reverse proxy", () => {
    expect(
      assertSameOrigin(
        request({
          origin: "https://offer.example.com",
          host: "127.0.0.1:3000",
          "x-forwarded-host": "offer.example.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(true);
    expect(
      assertSameOrigin(
        request({
          origin: "https://evil.example",
          "x-forwarded-host": "offer.example.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(false);
    expect(
      assertSameOrigin(
        request({
          origin: "http://offer.example.com",
          "x-forwarded-host": "offer.example.com",
          "x-forwarded-proto": "https",
        }),
      ),
    ).toBe(false);
  });
});
