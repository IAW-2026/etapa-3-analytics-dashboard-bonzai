import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBuyerAnalyticsSnapshot } from "@/services/buyer-analytics";

export async function GET() {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const user = await currentUser();

  if (!hasSuperAdminRole(user?.publicMetadata)) {
    return NextResponse.json({ message: "Access denied." }, { status: 403 });
  }

  const snapshot = await getBuyerAnalyticsSnapshot(getDefaultFilters());
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

function getDefaultFilters() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  return {
    from: thirtyDaysAgo,
    to: today,
    inactiveDays: 7,
  };
}

function hasSuperAdminRole(metadata: unknown) {
  const roles = metadata && typeof metadata === "object" && "roles" in metadata
    ? (metadata as { roles?: unknown }).roles
    : [];

  return Array.isArray(roles) && roles.includes("super_admin");
}
