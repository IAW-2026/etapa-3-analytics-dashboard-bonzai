"use server";

import type {
  BuyerOverview,
  CartOverview,
  SellerAnalytics,
  PaymentDisputes,
  ConsolidatedMetrics,
  AIInsight,
  AIAdvisorResponse,
} from "@/types/ai-advisor";
import type { DeliveryStats } from "@/types/shipping";

const BUYER_API_URL =
  process.env.BUYER_API_URL || "https://proyecto-c-buyer-bonzai.vercel.app";
const BUYER_SERVICE_KEY = process.env.BUYER_SERVICE_KEY || "";

const SELLER_API_URL =
  process.env.SELLER_API_URL || "https://proyecto-c-seller-bonzai.vercel.app";
const SELLER_SERVICE_KEY = process.env.SELLER_SERVICE_KEY || "";

const SHIPPING_API_URL =
  process.env.SHIPPING_API_URL || "https://proyecto-c-shipping-bonzai.vercel.app";
const SHIPPING_SERVICE_KEY = process.env.SHIPPING_SERVICE_KEY || "";

const PAYMENTS_API_URL =
  process.env.PAYMENTS_API_URL || "https://payments-bonzai-b.vercel.app";
const PAYMENTS_ANALYTICS_KEY = process.env.PAYMENTS_ANALYTICS_KEY || "";

const AI_PROVIDER_API_KEY = process.env.AI_PROVIDER_API_KEY || "";
const AI_MODEL = process.env.AI_MODEL || "gemini-2.5-flash";

async function fetchBuyerOverview(): Promise<BuyerOverview | null> {
  const url = `${BUYER_API_URL.replace(/\/$/, "")}/api/analytics/buyers/overview`;
  const res = await fetch(url, {
    headers: { "x-api-key": BUYER_SERVICE_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Buyer overview returned ${res.status}`);
  return res.json();
}

async function fetchCartOverview(): Promise<CartOverview | null> {
  const url = `${BUYER_API_URL.replace(/\/$/, "")}/api/analytics/carts/overview`;
  const res = await fetch(url, {
    headers: { "x-api-key": BUYER_SERVICE_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Cart overview returned ${res.status}`);
  return res.json();
}

async function fetchSellerAnalytics(): Promise<SellerAnalytics | null> {
  const url = `${SELLER_API_URL.replace(/\/$/, "")}/api/admin/analytics`;
  const res = await fetch(url, {
    headers: { "x-service-key": SELLER_SERVICE_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Seller analytics returned ${res.status}`);
  return res.json();
}

async function fetchDeliveryStats(): Promise<DeliveryStats | null> {
  const url = `${SHIPPING_API_URL.replace(/\/$/, "")}/api/analytics/delivery-stats`;
  const res = await fetch(url, {
    headers: { "x-shipping-service-key": SHIPPING_SERVICE_KEY },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Delivery stats returned ${res.status}`);
  return res.json();
}

async function fetchPaymentDisputes(): Promise<PaymentDisputes | null> {
  const url = `${PAYMENTS_API_URL.replace(/\/$/, "")}/api/analytics/disputes`;
  const res = await fetch(url, {
    headers: { "x-api-key": PAYMENTS_ANALYTICS_KEY, "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Payment disputes returned ${res.status}`);
  return res.json();
}

interface FetchResults {
  buyersOverview: BuyerOverview | null;
  cartsOverview: CartOverview | null;
  sellerAnalytics: SellerAnalytics | null;
  deliveryStats: DeliveryStats | null;
  paymentDisputes: PaymentDisputes | null;
}

function buildContext(results: FetchResults): ConsolidatedMetrics {
  const buyerAvailable =
    results.buyersOverview !== null || results.cartsOverview !== null;

  return {
    generated_at: new Date().toISOString(),
    services: {
      buyer: {
        status: buyerAvailable ? "ok" : "unavailable",
        buyers_overview: results.buyersOverview,
        carts_overview: results.cartsOverview,
      },
      seller: {
        status: results.sellerAnalytics ? "ok" : "unavailable",
        analytics: results.sellerAnalytics,
      },
      shipping: {
        status: results.deliveryStats ? "ok" : "unavailable",
        delivery_stats: results.deliveryStats,
      },
      payments: {
        status: results.paymentDisputes ? "ok" : "unavailable",
        disputes: results.paymentDisputes,
      },
    },
  };
}

const SYSTEM_PROMPT = `You are Bonzai's senior strategic consultant for a botany-specialized marketplace. Your goal is to analyze this cross-service dataset from the ecosystem:

1. Buyer App: checkout completion rates and cart abandonment.
2. Seller App: global sales KPIs, revenue, products, and categories.
3. Shipping App: delivery success rate, active shipments, and status distribution.
4. Payments App: dispute metrics, conflicts, and disputed amounts.

Identify 3 critical findings that are not obvious in isolation. Cross-reference data between services. For example:
- Correlate cart abandonment (Buyer) with logistics delays (Shipping).
- Link disputes in Payments with revenue by category or seller (Seller).
- Connect delivery success rate (Shipping) with checkout conversion (Buyer).

Respond ONLY with a JSON array of 3 objects. Each object must use this exact format:
{
  "title": "Brief, editorial headline for the finding",
  "description": "Elegant, concise, actionable explanation (2-3 sentences). Include concrete data if available in the metrics.",
  "severity": "positive" | "warning" | "critical",
  "services_involved": ["Buyer", "Seller", "Shipping", "Payments"]
}

Rules:
- Do NOT include markdown, backticks, or any text outside the JSON array.
- severity must be "positive" if an opportunity, "warning" if needs attention, "critical" if a risk.
- services_involved must list the service names involved in the finding.
- If any service is unavailable, omit findings that depend exclusively on it.
- Each description must be a MAXIMUM of 2 sentences. Be direct and use concrete numeric data from the metrics.`;

async function callGemini(context: ConsolidatedMetrics): Promise<AIInsight[]> {
  if (!AI_PROVIDER_API_KEY) {
    throw new Error("AI_PROVIDER_API_KEY is not configured");
  }

  const model = AI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": AI_PROVIDER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          parts: [{ text: JSON.stringify(context, null, 2) }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini API error ${res.status}: ${errBody}`);
  }

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) {
    throw new Error("Gemini returned an empty response");
  }

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  let parsed: AIInsight[];
  try {
    const arr = JSON.parse(cleaned);
    parsed = Array.isArray(arr) ? arr : arr.insights;
  } catch {
    const lastComma = cleaned.lastIndexOf("},");
    if (lastComma > 0) {
      try {
        parsed = JSON.parse(cleaned.slice(0, lastComma + 1) + "\n]");
      } catch {
        console.error("[ai-advisor] Raw Gemini response:", raw);
        throw new Error("Failed to parse Gemini response as JSON");
      }
    } else {
      console.error("[ai-advisor] Raw Gemini response:", raw);
      throw new Error("Failed to parse Gemini response as JSON");
    }
  }

  const insights: AIInsight[] = parsed;

  if (!Array.isArray(insights) || insights.length === 0) {
    throw new Error("Gemini did not return valid insights");
  }

  return insights.slice(0, 3) as AIInsight[];
}

export async function getAiInsights(): Promise<AIAdvisorResponse> {
  try {
    const [buyersResult, cartsResult, sellerResult, shippingResult, paymentsResult] =
      await Promise.allSettled([
        fetchBuyerOverview(),
        fetchCartOverview(),
        fetchSellerAnalytics(),
        fetchDeliveryStats(),
        fetchPaymentDisputes(),
      ]);

    const buyersOverview =
      buyersResult.status === "fulfilled" ? buyersResult.value : null;
    const cartsOverview =
      cartsResult.status === "fulfilled" ? cartsResult.value : null;
    const sellerAnalytics =
      sellerResult.status === "fulfilled" ? sellerResult.value : null;
    const deliveryStats =
      shippingResult.status === "fulfilled" ? shippingResult.value : null;
    const paymentDisputes =
      paymentsResult.status === "fulfilled" ? paymentsResult.value : null;

    const anyAvailable =
      buyersOverview ||
      cartsOverview ||
      sellerAnalytics ||
      deliveryStats ||
      paymentDisputes;

    if (!anyAvailable) {
      return {
        insights: [],
        partial: true,
        error:
          "All services are temporarily offline. Please try again later.",
      };
    }

    const context = buildContext({
      buyersOverview,
      cartsOverview,
      sellerAnalytics,
      deliveryStats,
      paymentDisputes,
    });

    const allServicesOk =
      buyersOverview &&
      cartsOverview &&
      sellerAnalytics &&
      deliveryStats &&
      paymentDisputes;

    const insights = await callGemini(context);

    return {
      insights,
      partial: !allServicesOk,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error generating insights";
    console.error("[ai-advisor]", message);
    return {
      insights: [],
      partial: true,
      error: "Advisor temporarily offline. Please try again in a few minutes.",
    };
  }
}
