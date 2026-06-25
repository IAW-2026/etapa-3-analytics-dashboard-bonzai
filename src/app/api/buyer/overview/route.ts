import { auth, currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getBuyerAnalyticsSnapshot } from "@/services/buyer-analytics";

export async function GET(request: NextRequest) {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const user = await currentUser();

  if (!hasSuperAdminRole(user?.publicMetadata)) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const filters = resolveFilters(request.nextUrl.searchParams);

  if (!filters.ok) {
    return NextResponse.json({ message: filters.message }, { status: 400 });
  }

  const snapshot = await getBuyerAnalyticsSnapshot(filters.value);
  const buyerOverview = snapshot.buyerOverview.data;
  const cartOverview = snapshot.cartOverview.data;

  if (!buyerOverview && !cartOverview) {
    return NextResponse.json(
      { message: snapshot.errors[0]?.message ?? "Could not load Buyer App data." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    totalBuyers: buyerOverview?.totalBuyers ?? null,
    checkoutReadinessRate: buyerOverview?.checkoutReadinessRate ?? null,
    buyersWithShippingAddress: buyerOverview?.buyersWithShippingAddress ?? null,
    buyersWithCartItems: buyerOverview?.buyersWithCartItems ?? null,
    activeCarts: cartOverview?.activeCarts ?? null,
    abandonedCarts: cartOverview?.abandonedCarts ?? null,
  });
}

function resolveFilters(searchParams: URLSearchParams) {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const from = getDateParam(searchParams.get("from")) ?? thirtyDaysAgo;
  const to = getDateParam(searchParams.get("to")) ?? today;

  if (searchParams.has("from") && !getDateParam(searchParams.get("from"))) {
    return { ok: false as const, message: "Invalid from date." };
  }

  if (searchParams.has("to") && !getDateParam(searchParams.get("to"))) {
    return { ok: false as const, message: "Invalid to date." };
  }

  if (new Date(from) > new Date(to)) {
    return { ok: false as const, message: "from must be before or equal to to." };
  }

  return {
    ok: true as const,
    value: {
      from,
      to,
      inactiveDays: 7,
    },
  };
}

function getDateParam(value: string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) {
    return null;
  }

  return value.slice(0, 10);
}

function hasSuperAdminRole(metadata: unknown) {
  const roles = metadata && typeof metadata === "object" && "roles" in metadata
    ? (metadata as { roles?: unknown }).roles
    : [];

  return Array.isArray(roles) && roles.includes("super_admin");
}
