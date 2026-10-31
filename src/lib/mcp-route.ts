import { NextResponse } from "next/server";
import { denyMcp } from "@/lib/mcp-service-auth";

export type McpResult = { status: number; body: unknown };

export function mcpJson(status: number, body: unknown) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "private, no-store" },
  });
}

/** 401 response when the MCP bearer is missing or wrong, otherwise null. */
export async function gateMcp(request: Request) {
  const denied = await denyMcp(request);
  if (!denied) return null;
  return mcpJson(denied.status, denied.body);
}

export async function runMcp(fn: () => Promise<McpResult>) {
  try {
    const result = await fn();
    return mcpJson(result.status, result.body);
  } catch (err) {
    console.error("[mcp]", err);
    return mcpJson(503, { error: "storage_not_configured" });
  }
}
