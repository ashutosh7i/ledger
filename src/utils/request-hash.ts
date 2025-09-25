// Deterministic JSON body hashing for idempotency
import crypto from "node:crypto";

function sortObject(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  } else if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc: any, key) => {
        acc[key] = sortObject(obj[key]);
        return acc;
      }, {} as any);
  }
  return obj;
}

export function hashRequestBody(body: any): string {
  const sorted = sortObject(body);
  const json = JSON.stringify(sorted);
  return crypto.createHash("sha256").update(json).digest("hex");
}
