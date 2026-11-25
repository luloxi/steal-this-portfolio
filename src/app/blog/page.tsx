import { BlogList } from "@/components/views/blog-list";
import type { BlogPost } from "@/content/blog/types";
import { canSeeDraftsRequest } from "@/lib/admin-request";
import { getAllPosts, getPublishedPosts } from "@/lib/blog";
import { parseBlogListView, type BlogListView } from "@/lib/blog-list";

// Read D1 on every request: edits made on the blog are visible immediately.
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ view?: string }> };

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  // Only pass a view when the URL asks for one (after deleting a draft, or a toggle).
  const initialView: BlogListView | undefined =
    params.view === "drafts" || params.view === "published" ? parseBlogListView(params.view) : undefined;
  let posts: BlogPost[] = [];
  let error = false;
  try {
    // Admin with edit mode ON gets drafts too (the client selector defaults to Publicados).
    // Visitors and edit OFF: published only, already filtered here so drafts never leave the server.
    posts = (await canSeeDraftsRequest()) ? await getAllPosts({ includeDrafts: true }) : await getPublishedPosts();
  } catch (err) {
    console.error("[blog] list", err);
    error = true;
  }
  return <BlogList posts={posts} error={error} initialView={initialView} />;
}
