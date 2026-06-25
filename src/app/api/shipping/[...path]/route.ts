import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.SHIPPING_API_URL || "https://proyecto-c-shipping-bonzai.vercel.app";
const SERVICE_KEY = process.env.SHIPPING_SERVICE_KEY || "";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const search = req.nextUrl.search;
  const upstreamPath = path.join("/");
  const upstreamUrl = `${API_URL.replace(/\/$/, "")}/${upstreamPath}${search}`;

  try {
    const upstream = await fetch(upstreamUrl, {
      headers: { "x-shipping-service-key": SERVICE_KEY },
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ message: "Shipping service unavailable" }, { status: 502 });
  }
}
