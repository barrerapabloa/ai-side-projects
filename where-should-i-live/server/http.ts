import { config } from "dotenv";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { handleOgGet, handleOgPost } from "../src/lib/api/og";
import { handleRecommendPost } from "../src/lib/api/recommend";
import { handleSearchPost } from "../src/lib/api/search";

config({ path: ".env.local" });
config({ path: ".env" });

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

async function toRequest(req: IncomingMessage, origin: string): Promise<Request> {
  const url = new URL(req.url ?? "/", origin);
  const method = req.method ?? "GET";
  let body: Buffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await readBody(req);
  }
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const x of v) headers.append(k, x);
    else headers.set(k, v);
  }
  return new Request(url, {
    method,
    headers,
    body: body?.length ? Uint8Array.from(body) : undefined,
  });
}

async function sendResponse(nodeRes: ServerResponse, webRes: Response) {
  nodeRes.statusCode = webRes.status;
  webRes.headers.forEach((v, k) => {
    nodeRes.setHeader(k, v);
  });
  nodeRes.end(Buffer.from(await webRes.arrayBuffer()));
}

const PORT = Number(process.env.PORT ?? "3001");
const origin = `http://127.0.0.1:${PORT}`;

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? "/", origin);
    const path = url.pathname.replace(/\/$/, "") || "/";
    const webReq = await toRequest(req, origin);

    if (path === "/api/recommend" && req.method === "POST") {
      await sendResponse(res, await handleRecommendPost(webReq));
      return;
    }
    if (path === "/api/search" && req.method === "POST") {
      await sendResponse(res, await handleSearchPost(webReq));
      return;
    }
    if (path === "/api/og" && req.method === "GET") {
      await sendResponse(res, await handleOgGet(webReq));
      return;
    }
    if (path === "/api/og" && req.method === "POST") {
      await sendResponse(res, await handleOgPost(webReq));
      return;
    }

    res.statusCode = 404;
    res.setHeader("content-type", "text/plain");
    res.end("Not found");
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain");
    res.end("Server error");
  }
}).listen(PORT, () => {
  console.log(`API server http://127.0.0.1:${PORT}`);
});
