import "server-only";

import type {
  BuyerAnalyticsEndpoint,
  BuyerAnalyticsError,
  BuyerAnalyticsFilters,
  BuyerAnalyticsSnapshot,
} from "@/types/buyer-analytics";
import { configError, createUnavailableSnapshot, endpointError, normalizeAbandonedCarts, normalizeAverageCartItems, normalizeBaseUrl, normalizeBuyerOverview, normalizeCartOverview, normalizeCartsByBuyer, normalizeError, normalizeNewBuyers, normalizePaginatedBuyers, normalizePaginatedCarts, normalizeShippingAddressCompleteness, normalizeShippingAddressesByCity, normalizeShippingAddressesByProvince, normalizeShippingAddressOverview, normalizeTopCartProducts } from "@/lib/utils";

type BuyerServiceConfig = {
  baseUrl: string;
  serviceKey: string;
};

type ConfigResult =
  | { ok: true; config: BuyerServiceConfig }
  | { ok: false; error: BuyerAnalyticsError };

type EndpointNormalizer<T> = (payload: unknown) => T;

const BUYER_REQUEST_TIMEOUT_MS = 10_000;
const CONFIG_ERROR_MESSAGE = "Buyer analytics service configuration is invalid.";
const MISSING_CONFIG_ERROR_MESSAGE = "Buyer analytics service is not configured.";


export async function getBuyerAnalyticsSnapshot(
  filters: BuyerAnalyticsFilters,
): Promise<BuyerAnalyticsSnapshot> {
  const configResult = getBuyerServiceConfig();

  if (!configResult.ok) {
    return createUnavailableSnapshot(filters, configResult.error);
  }

  const config = configResult.config;
  const buyerListParams = { page: "1", take: "5" };
  const cartListParams = { page: "1", take: "5" };
  const newBuyerParams = {
    from: filters.from,
    to: filters.to,
    page: "1",
    take: "8",
  };
  const abandonedParams = {
    ...cartListParams,
    inactiveDays: String(filters.inactiveDays),
  };

  const [
    buyerOverview,
    newBuyers,
    buyersWithAddress,
    buyersWithoutAddress,
    cartOverview,
    activeCarts,
    abandonedCarts,
    averageCartItems,
    topCartProducts,
    cartsByBuyer,
    shippingAddressOverview,
    shippingAddressesByCity,
    shippingAddressesByProvince,
    shippingAddressCompleteness,
  ] = await Promise.all([
    loadEndpoint(config, "buyers overview", "/api/analytics/buyers/overview", normalizeBuyerOverview),
    loadEndpoint(config, "new buyers", "/api/analytics/buyers/new", normalizeNewBuyers, newBuyerParams),
    loadEndpoint(
      config,
      "buyers with address",
      "/api/analytics/buyers/with-address",
      normalizePaginatedBuyers,
      buyerListParams,
    ),
    loadEndpoint(
      config,
      "buyers without address",
      "/api/analytics/buyers/without-address",
      normalizePaginatedBuyers,
      buyerListParams,
    ),
    loadEndpoint(config, "carts overview", "/api/analytics/carts/overview", normalizeCartOverview, {
      inactiveDays: String(filters.inactiveDays),
    }),
    loadEndpoint(config, "active carts", "/api/analytics/carts/active", normalizePaginatedCarts, cartListParams),
    loadEndpoint(config, "abandoned carts", "/api/analytics/carts/abandoned", normalizeAbandonedCarts, abandonedParams),
    loadEndpoint(config, "average cart items", "/api/analytics/carts/average-items", normalizeAverageCartItems),
    loadEndpoint(config, "top cart products", "/api/analytics/carts/top-products", normalizeTopCartProducts, {
      limit: "10",
    }),
    loadEndpoint(config, "carts by buyer", "/api/analytics/carts/by-buyer", normalizeCartsByBuyer, cartListParams),
    loadEndpoint(
      config,
      "shipping address overview",
      "/api/analytics/shipping-addresses/overview",
      normalizeShippingAddressOverview,
    ),
    loadEndpoint(
      config,
      "shipping addresses by city",
      "/api/analytics/shipping-addresses/by-city",
      normalizeShippingAddressesByCity,
    ),
    loadEndpoint(
      config,
      "shipping addresses by province",
      "/api/analytics/shipping-addresses/by-province",
      normalizeShippingAddressesByProvince,
    ),
    loadEndpoint(
      config,
      "shipping address completeness",
      "/api/analytics/shipping-addresses/completeness",
      normalizeShippingAddressCompleteness,
    ),
  ]);

  const endpoints = [
    buyerOverview,
    newBuyers,
    buyersWithAddress,
    buyersWithoutAddress,
    cartOverview,
    activeCarts,
    abandonedCarts,
    averageCartItems,
    topCartProducts,
    cartsByBuyer,
    shippingAddressOverview,
    shippingAddressesByCity,
    shippingAddressesByProvince,
    shippingAddressCompleteness,
  ];

  return {
    filters,
    generatedAt: new Date().toISOString(),
    errors: endpoints.flatMap((endpoint) => (endpoint.error ? [endpoint.error] : [])),
    buyerOverview,
    newBuyers,
    buyersWithAddress,
    buyersWithoutAddress,
    cartOverview,
    activeCarts,
    abandonedCarts,
    averageCartItems,
    topCartProducts,
    cartsByBuyer,
    shippingAddressOverview,
    shippingAddressesByCity,
    shippingAddressesByProvince,
    shippingAddressCompleteness,
  };
}

async function loadEndpoint<T>(
  config: BuyerServiceConfig,
  endpoint: string,
  path: string,
  normalize: EndpointNormalizer<T>,
  params?: Record<string, string>,
): Promise<BuyerAnalyticsEndpoint<T>> {
  try {
    const payload = await buyerRequest(config, endpoint, path, params);
    return { data: normalize(payload), error: null };
  } catch (error) {
    return { data: null, error: normalizeError(endpoint, error) };
  }
}

async function buyerRequest(
  config: BuyerServiceConfig,
  endpoint: string,
  path: string,
  params?: Record<string, string>,
): Promise<unknown> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BUYER_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}${path}${query}`, {
      headers: {
        Accept: "application/json",
        "x-api-key": config.serviceKey,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null) as unknown;

    if (!response.ok) {
      throw endpointError(endpoint, response.status);
    }

    return payload;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getBuyerServiceConfig(): ConfigResult {
  const baseUrl = normalizeBaseUrl(process.env.BUYER_API_URL?.trim());

  if (!baseUrl) {
    return {
      ok: false,
      error: configError(CONFIG_ERROR_MESSAGE),
    };
  }

  const serviceKey = process.env.BUYER_SERVICE_KEY?.trim();

  if (!serviceKey) {
    return {
      ok: false,
      error: configError(MISSING_CONFIG_ERROR_MESSAGE),
    };
  }

  return { ok: true, config: { baseUrl, serviceKey } };
}

