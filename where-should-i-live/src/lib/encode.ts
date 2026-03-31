export function encodeJsonToBase64Url(value: unknown): string {
  const json = JSON.stringify(value);
  const b64 =
    typeof Buffer !== "undefined"
      ? Buffer.from(json, "utf8").toString("base64")
      : btoa(
          encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
            String.fromCharCode(Number.parseInt(hex, 16)),
          ),
        );
  return b64.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export function decodeBase64UrlToJson<T>(value: string): T {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const json =
    typeof Buffer !== "undefined"
      ? Buffer.from(padded, "base64").toString("utf8")
      : decodeURIComponent(
          Array.from(atob(padded))
            .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
            .join(""),
        );
  return JSON.parse(json) as T;
}

