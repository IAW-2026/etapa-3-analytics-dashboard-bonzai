import { auth, currentUser } from "@clerk/nextjs/server";
import { getBuyerAnalyticsSnapshot } from "@/services/buyer-analytics";
import type { BuyerAnalyticsFilters } from "@/types/buyer-analytics";
import { BuyerAnalyticsDashboard } from "../../../components/buyer/buyer-analytics-dashboard";

type BuyerAnalyticsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BuyerAnalyticsPage({ searchParams }: BuyerAnalyticsPageProps) {
  const { isAuthenticated } = await auth();

  if (!isAuthenticated) {
    return <AccessState title="Sign in required" description="Sign in with a super admin account to view Buyer App analytics." />;
  }

  const user = await currentUser();

  if (!hasSuperAdminRole(user?.publicMetadata)) {
    return <AccessState title="Access denied" description="Your account does not have the super_admin role required to view Buyer App analytics." />;
  }

  const filters = resolveFilters(await searchParams);
  const snapshot = await getBuyerAnalyticsSnapshot(filters);

  return <BuyerAnalyticsDashboard snapshot={snapshot} />;
}

function AccessState({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ padding: "3rem", background: "white", border: "1px solid var(--color-border)", textAlign: "center" }}>
      <h1 style={{ margin: "0 0 0.5rem", color: "var(--color-primary)", fontFamily: "var(--font-serif)", fontSize: "1.25rem" }}>{title}</h1>
      <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{description}</p>
    </div>
  );
}

function hasSuperAdminRole(metadata: unknown) {
  const roles = metadata && typeof metadata === "object" && "roles" in metadata
    ? (metadata as { roles?: unknown }).roles
    : [];

  return Array.isArray(roles) && roles.includes("super_admin");
}

function resolveFilters(searchParams: Record<string, string | string[] | undefined>): BuyerAnalyticsFilters {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const from = getDateParam(searchParams.from) ?? thirtyDaysAgo;
  const to = getDateParam(searchParams.to) ?? today;
  const [safeFrom, safeTo] = new Date(from) <= new Date(to) ? [from, to] : [to, from];

  return {
    from: safeFrom,
    to: safeTo,
    inactiveDays: getPositiveIntParam(searchParams.inactiveDays, 7, 90),
  };
}

function getDateParam(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate || Number.isNaN(new Date(candidate).getTime())) {
    return null;
  }

  return candidate.slice(0, 10);
}

function getPositiveIntParam(value: string | string[] | undefined, fallback: number, max: number) {
  const candidate = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(candidate ?? "", 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(parsed, max);
}
