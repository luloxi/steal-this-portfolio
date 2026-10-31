import { getMcpPost } from "@/lib/mcp-posts";
import { gateMcp, runMcp } from "@/lib/mcp-route";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

function pathSlug(raw: string): string | null {
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    return null;
  }
  if (!slug || /[\\/\0]/.test(slug)) return null;
  return slug;
}

export async function GET(request: Request, ctx: Ctx) {
  const blocked = await gateMcp(request);
  if (blocked) return blocked;
  const slug = pathSlug((await ctx.params).slug);
  if (!slug) return runMcp(async () => ({ status: 404, body: { error: "not_found" } }));
  return runMcp(() => getMcpPost(slug));
}
