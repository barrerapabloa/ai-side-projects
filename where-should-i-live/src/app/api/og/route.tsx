import { handleOgGet, handleOgPost } from "@/lib/api/og";

export const runtime = "edge";

export async function GET(req: Request) {
  return handleOgGet(req);
}

export async function POST(req: Request) {
  return handleOgPost(req);
}
