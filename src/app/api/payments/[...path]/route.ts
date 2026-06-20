import { NextRequest, NextResponse } from "next/server";

const PAYMENTS_API_URL =
  process.env.PAYMENTS_API_URL || "https://payments-bonzai-b.vercel.app";
const PAYMENTS_ANALYTICS_KEY = process.env.PAYMENTS_ANALYTICS_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const analyticsPath = path.join("/");
  const search = req.nextUrl.search;

  const upstreamUrl = `${PAYMENTS_API_URL}/api/analytics/${analyticsPath}${search}`;

  try {
    const res = await fetch(upstreamUrl, {
      headers: {
        "x-api-key": PAYMENTS_ANALYTICS_KEY,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "UPSTREAM_ERROR", message: "Could not reach Payments API." },
      { status: 502 }
    );
  }
}
