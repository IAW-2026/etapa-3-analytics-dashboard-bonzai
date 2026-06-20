import { NextRequest, NextResponse } from "next/server";

const SELLER_API_URL =
  process.env.SELLER_API_URL || "https://proyecto-c-seller-bonzai.vercel.app";
const SELLER_SERVICE_KEY = process.env.SELLER_SERVICE_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  
  // path will be e.g. ["api", "admin", "statistics"]
  const actualPath = path.join("/");
  const search = req.nextUrl.search;

  // Re-route to the external Seller API
  // We check if the path starts with "api/admin", if not, prepend it (handles clean mapping)
  const prefix = actualPath.startsWith("api/") ? "" : "api/admin/";
  const upstreamUrl = `${SELLER_API_URL.replace(/\/$/, "")}/${prefix}${actualPath}${search}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        "x-service-key": SELLER_SERVICE_KEY,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(data || { error: "UPSTREAM_ERROR" }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/seller] Upstream error:", err);
    return NextResponse.json(
      { error: "UPSTREAM_ERROR", message: "Could not reach Seller API." },
      { status: 502 }
    );
  }
}
