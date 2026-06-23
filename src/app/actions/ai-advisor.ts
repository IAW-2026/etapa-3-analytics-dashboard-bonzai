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

// ── Environment ──

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
const AI_MODEL = process.env.AI_MODEL || "gpt-4o";

// ── Individual fetchers ──

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

// ── Context builder (modular for future endpoints) ──

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

// ── Gemini caller ──

const SYSTEM_PROMPT = `Eres el consultor estratégico senior de Bonzai, un marketplace especializado en botánica. Tu objetivo es analizar este conjunto de datos cruzados del ecosistema:

1. Buyer App: tasas de preparación de checkout y abandono de carritos.
2. Seller App: KPIs globales de ventas, revenue, productos y categorías.
3. Shipping App: tasa de éxito de entregas, envíos activos y distribución por estado.
4. Payments App: métricas de disputas, conflictos y montos disputados.

Debes identificar 3 hallazgos críticos que no sean evidentes de forma aislada. Cruza los datos entre servicios. Por ejemplo:
- Correlaciona el abandono de carritos (Buyer) con demoras logísticas (Shipping).
- Relaciona las disputas en Payments con el revenue por categoría o vendedor (Seller).
- Conecta la tasa de éxito de entregas (Shipping) con la conversión de checkout (Buyer).

Responde ÚNICAMENTE con un array JSON de 3 objetos. Cada objeto debe tener este formato exacto:
{
  "title": "Título breve y editorial del hallazgo",
  "description": "Explicación elegante, breve y accionable del hallazgo (2-3 oraciones). Incluye datos concretos si están disponibles en las métricas.",
  "severity": "positive" | "warning" | "critical",
  "services_involved": ["Buyer", "Seller", "Shipping", "Payments"]
}

Reglas:
- NO incluyas markdown, ni backticks, ni texto fuera del array JSON.
- severity debe ser "positive" si es una oportunidad, "warning" si requiere atención, "critical" si es un riesgo.
- services_involved debe listar los nombres de los servicios involucrados en el hallazgo.
- Si algún servicio no está disponible, omite hallazgos que dependan exclusivamente de él.
- Cada descripción debe tener MÁXIMO 2 oraciones. Sé directo y usa datos numéricos concretos de las métricas.`;

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

// ── Main exported Server Action ──

export async function getAiInsights(): Promise<AIAdvisorResponse> {
  try {
    // 1. Parallel fetch from all microservices
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
          "Todos los servicios están temporalmente fuera de línea. Intenta nuevamente más tarde.",
      };
    }

    // 2. Build consolidated context (modular)
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

    // 3. Call Gemini
    const insights = await callGemini(context);

    return {
      insights,
      partial: !allServicesOk,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error desconocido al generar insights";
    console.error("[ai-advisor]", message);
    return {
      insights: [],
      partial: true,
      error: "Consultor temporalmente fuera de línea. Intenta nuevamente en unos minutos.",
    };
  }
}
