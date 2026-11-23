import { describe, expect, it } from "vitest";
import { getClientIpResolver } from "../../src/security/client-ip-resolver.ts";

const SECRET = "0123456789abcdef0123456789abcdef";

describe("the client-IP resolver", () => {
  it("reads Cloudflare's header as it is when no edge proof secret is set", () => {
    const resolve = getClientIpResolver({});
    expect(resolve(new Headers({ "cf-connecting-ip": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("treats an empty edge proof secret as unset", () => {
    const resolve = getClientIpResolver({ EDGE_PROOF_SECRET: "  " });
    expect(resolve(new Headers({ "cf-connecting-ip": "198.51.100.7" }))).toBe("198.51.100.7");
  });

  it("trusts the header only on a request that carries the edge proof", () => {
    const resolve = getClientIpResolver({ EDGE_PROOF_SECRET: SECRET });
    expect(resolve(new Headers({ "cf-connecting-ip": "198.51.100.7" }))).toBeNull();
    expect(resolve(new Headers({ "cf-connecting-ip": "198.51.100.7", "x-softure-edge-proof": "wrong-proof-value-000" }))).toBeNull();
    expect(resolve(new Headers({ "cf-connecting-ip": "198.51.100.7", "x-softure-edge-proof": SECRET }))).toBe("198.51.100.7");
  });

  it("uses the source CLIENT_IP_SOURCE names behind the edge proof", () => {
    const resolve = getClientIpResolver({ EDGE_PROOF_SECRET: SECRET, CLIENT_IP_SOURCE: "forwarded-for" });
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 192.0.2.1", "x-softure-edge-proof": SECRET });
    expect(resolve(headers)).toBe("192.0.2.1");
  });
});
