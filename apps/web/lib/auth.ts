import { NextResponse } from "next/server";

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export function hasValidApiToken(request: Request): boolean {
  const expectedToken = process.env.MY_DAYS_API_TOKEN;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  return Boolean(expectedToken) && token === expectedToken;
}
