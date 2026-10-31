import { handleMcpUpload } from "@/lib/mcp-media";
import { gateMcp, runMcp } from "@/lib/mcp-route";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const blocked = await gateMcp(request);
  if (blocked) return blocked;
  return runMcp(() => handleMcpUpload(request));
}
