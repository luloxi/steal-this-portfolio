import { createMcpDraft, listMcpPosts } from "@/lib/mcp-posts";
import { gateMcp, runMcp } from "@/lib/mcp-route";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const blocked = await gateMcp(request);
  if (blocked) return blocked;
  return runMcp(() => listMcpPosts(new URL(request.url)));
}

export async function POST(request: Request) {
  const blocked = await gateMcp(request);
  if (blocked) return blocked;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return runMcp(async () => ({ status: 400, body: { error: "invalid_json" } }));
  }
  return runMcp(() => createMcpDraft(payload));
}
