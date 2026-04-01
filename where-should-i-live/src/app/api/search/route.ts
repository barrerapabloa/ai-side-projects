import { handleSearchPost } from "@/lib/api/search";

export async function POST(req: Request) {
  return handleSearchPost(req);
}
