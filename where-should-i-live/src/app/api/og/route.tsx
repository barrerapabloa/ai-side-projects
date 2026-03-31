import { ImageResponse } from "next/og";
import { decodeBase64UrlToJson } from "@/lib/encode";
import type { CityResult } from "@/lib/types";

export const runtime = "edge";

type ResultsPayload = {
  cities?: CityResult[];
};

function safeDecode(data: string | null): ResultsPayload | null {
  if (!data) return null;
  try {
    return decodeBase64UrlToJson<ResultsPayload>(data);
  } catch {
    return null;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

async function loadImageDataUrl(url: string | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "HomeCompass/1.0 (share-card)" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2_500_000) return null;
    const ct = res.headers.get("content-type") ?? "image/jpeg";
    const b64 = arrayBufferToBase64(buf);
    return `data:${ct};base64,${b64}`;
  } catch {
    return null;
  }
}

function clamp(s: string, max: number) {
  const t = s.replaceAll(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + "…";
}

const W = 1080;
const H = 1350;

const fallbackCities: CityResult[] = [
  {
    name: "Lisbon",
    country: "Portugal",
    summary: "Sun, walkability, strong remote-worker scene, and a balanced pace.",
    cost: "$$",
    whyItMatches: ["Warm climate", "City + chill lifestyle", "Remote-friendly"],
  },
];

async function renderShareImage(citiesInput: CityResult[]) {
  const raw = citiesInput.slice(0, 3);
  const cities = raw.length ? raw : fallbackCities;
  const city = cities[0]!;
  const imageDataUrl = await loadImageDataUrl(city.imageUrl);

  const cream = "#f3efe6";
  const ink = "#141210";
  const muted = "rgba(20,18,16,0.55)";
  const line = "rgba(20,18,16,0.12)";

  return new ImageResponse(
    (
      <div
        style={{
          width: W,
          height: H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(165deg, #0a0a0a 0%, #1a1816 40%, #0d0c0b 100%)",
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
          color: ink,
        }}
      >
        <div
          style={{
            width: W - 72,
            height: H - 72,
            display: "flex",
            flexDirection: "column",
            borderRadius: 36,
            overflow: "hidden",
            background: cream,
            border: `1px solid ${line}`,
            boxShadow: "0 40px 120px rgba(0,0,0,0.45)",
          }}
        >
          <div
            style={{
              height: 640,
              width: "100%",
              display: "flex",
              position: "relative",
              background: imageDataUrl
                ? "transparent"
                : "linear-gradient(145deg, #e8e0d4 0%, #d4c8b8 55%, #c9bba8 100%)",
            }}
          >
            {imageDataUrl ? (
              <img
                src={imageDataUrl}
                alt=""
                width={1008}
                height={640}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: "50% 45%",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(20,18,16,0.28)",
                }}
              >
                HomeCompass
              </div>
            )}
            <div
              style={{
                position: "absolute",
                left: 28,
                top: 28,
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.72)",
                border: "1px solid rgba(20,18,16,0.10)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: ink,
              }}
            >
              Rare drop
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "44px 44px 36px",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontSize: 62,
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                  fontFamily:
                    'ui-serif, Georgia, "Times New Roman", "Instrument Serif", serif',
                  fontWeight: 400,
                }}
              >
                {city.name}
              </div>
              <div style={{ fontSize: 22, opacity: 0.62, letterSpacing: "-0.01em" }}>
                {city.country}
              </div>
            </div>

            <div
              style={{
                fontSize: 20,
                lineHeight: 1.55,
                color: muted,
                marginTop: 4,
              }}
            >
              {clamp(city.summary, 220)}
            </div>

            <div style={{ flex: 1 }} />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 22,
                borderTop: `1px solid ${line}`,
              }}
            >
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 650,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: `1px solid ${line}`,
                    background: "rgba(255,255,255,0.55)",
                  }}
                >
                  Cost {city.cost}
                </div>
                <div style={{ fontSize: 14, color: muted }}>
                  {(city.whyItMatches ?? []).slice(0, 2).join(" · ")}
                </div>
              </div>
              <div
                style={{
                  fontSize: 13,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(20,18,16,0.42)",
                  fontWeight: 650,
                }}
              >
                HomeCompass
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: W,
      height: H,
    },
  );
}

/** POST avoids very long query strings (browser URL limits) for large summaries. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ResultsPayload | null;
  const list = body?.cities;
  if (!Array.isArray(list) || list.length === 0) {
    return new Response(JSON.stringify({ error: "Expected { cities: [...] }" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  return renderShareImage(list as CityResult[]);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dataParam = url.searchParams.get("data");
  const payload = safeDecode(dataParam);
  const raw = payload?.cities?.slice(0, 3) ?? [];
  return renderShareImage(raw as CityResult[]);
}
