import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Server-to-server auth for /api/mcp/*.
 * Only `Authorization: Bearer <MCP_SERVICE_TOKEN>` is accepted.
 * A Better Auth session cookie is ignored. The bearer is not a session:
 * admin routes strip Authorization before looking up the cookie (see blog.ts).
 *
 * Both sides are SHA-256'd and compared in constant time, so a wrong token
 * does not leak the secret through an early length check.
 */

const TOKEN_MAX = 512;

let secretOverride: { value: string | undefined } | undefined;

/** Unit tests pin the Worker secret. Production leaves this unset. */
export function setTestMcpSecret(secret: string | undefined): void {
  secretOverride = { value: secret };
}

export function clearTestMcpSecret(): void {
  secretOverride = undefined;
}

export async function mcpServiceToken(): Promise<string | undefined> {
  if (secretOverride) {
    const value = secretOverride.value;
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }
  try {
    const { env } = await getCloudflareContext({ async: true });
    const value = (env as { MCP_SERVICE_TOKEN?: unknown }).MCP_SERVICE_TOKEN;
    return typeof value === "string" && value.length > 0 ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Credential after "Bearer", or "" when the header is missing or malformed. */
export function bearerCredential(authorization: string | null): string {
  if (!authorization || authorization.length > TOKEN_MAX + 32) return "";
  const match = /^Bearer\s+(\S+)$/i.exec(authorization.trim());
  const token = match?.[1] ?? "";
  return token.length > TOKEN_MAX ? "" : token;
}

async function sha256(value: string): Promise<Uint8Array> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(buf);
}

function constTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/**
 * True only when `secret` is set and the bearer hashes to the same SHA-256.
 * Missing, empty, or wrong credentials are false. The cookie header is not read.
 */
export async function mcpBearerMatches(authorization: string | null, secret: string | undefined): Promise<boolean> {
  if (typeof secret !== "string" || secret.length === 0) return false;
  const token = bearerCredential(authorization);
  const [got, expect] = await Promise.all([sha256(token), sha256(secret)]);
  return constTimeEqual(got, expect);
}

export async function denyMcp(request: Request): Promise<{ status: 401; body: { error: "unauthorized" } } | null> {
  const ok = await mcpBearerMatches(request.headers.get("authorization"), await mcpServiceToken());
  return ok ? null : { status: 401, body: { error: "unauthorized" } };
}
