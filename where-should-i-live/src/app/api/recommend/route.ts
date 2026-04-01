import { handleRecommendPost } from "@/lib/api/recommend";

export async function POST(req: Request) {
  return handleRecommendPost(req);
}
