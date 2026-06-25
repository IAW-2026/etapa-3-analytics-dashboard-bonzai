import {
  AbandonedCartAnalytics,
  AddressDistributionPoint,
  AverageCartItems,
  BuyerCartSummary,
  BuyerDateBucket,
  BuyerOverview,
  BuyerSummary,
  CartBuyerSummary,
  CartOverview,
  CartSummary,
  CartsByBuyerAnalytics,
  NewBuyersAnalytics,
  PaginatedBuyerAnalytics,
  PaginatedCartAnalytics,
  ShippingAddressCompleteness,
  ShippingAddressesByCity,
  ShippingAddressesByProvince,
  ShippingAddressOverview,
  TopCartProduct,
  TopCartProductsAnalytics,
  BuyerAnalyticsFilters,
  BuyerAnalyticsSnapshot,
  BuyerAnalyticsError,
  BuyerAnalyticsEndpoint,
} from '@/types/buyer-analytics';

type UnknownRecord = Record<string, unknown>;

const CONFIG_ENDPOINT = 'buyer service configuration';
const ENDPOINT_ERROR_MESSAGE =
  'Buyer analytics endpoint is currently unavailable.';
const TIMEOUT_ERROR_MESSAGE = 'Buyer analytics endpoint timed out.';

export function normalizeBaseUrl(rawBaseUrl: string | undefined) {
  if (!rawBaseUrl) {
    return null;
  }

  try {
    const url = new URL(rawBaseUrl);
    const isLocal = isLocalhost(url.hostname);
    const isAllowedProtocol =
      url.protocol === 'https:' || (url.protocol === 'http:' && isLocal);

    if (!isAllowedProtocol) {
      return null;
    }

    url.hash = '';
    url.search = '';

    return url.toString().replace(/\/+$/, '');
  } catch {
    return null;
  }
}

export function isLocalhost(hostname: string) {
  const normalized = hostname.toLowerCase();
  return (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized === '[::1]'
  );
}

export function createUnavailableSnapshot(
  filters: BuyerAnalyticsFilters,
  error: BuyerAnalyticsError,
): BuyerAnalyticsSnapshot {
  return {
    filters,
    generatedAt: new Date().toISOString(),
    errors: [error],
    buyerOverview: unavailable(error),
    newBuyers: unavailable(error),
    buyersWithAddress: unavailable(error),
    buyersWithoutAddress: unavailable(error),
    cartOverview: unavailable(error),
    activeCarts: unavailable(error),
    abandonedCarts: unavailable(error),
    averageCartItems: unavailable(error),
    topCartProducts: unavailable(error),
    cartsByBuyer: unavailable(error),
    shippingAddressOverview: unavailable(error),
    shippingAddressesByCity: unavailable(error),
    shippingAddressesByProvince: unavailable(error),
    shippingAddressCompleteness: unavailable(error),
  };
}

export function unavailable<T>(
  error: BuyerAnalyticsError,
): BuyerAnalyticsEndpoint<T> {
  return { data: null, error };
}

export function normalizeError(
  endpoint: string,
  error: unknown,
): BuyerAnalyticsError {
  if (isAbortError(error)) {
    return endpointError(endpoint, undefined, TIMEOUT_ERROR_MESSAGE);
  }

  if (isBuyerAnalyticsError(error)) {
    return endpointError(
      error.endpoint || endpoint,
      error.status,
      error.message === TIMEOUT_ERROR_MESSAGE
        ? TIMEOUT_ERROR_MESSAGE
        : undefined,
    );
  }

  return endpointError(endpoint);
}

export function configError(message: string): BuyerAnalyticsError {
  return { endpoint: CONFIG_ENDPOINT, message };
}

export function endpointError(
  endpoint: string,
  status?: number,
  message = ENDPOINT_ERROR_MESSAGE,
): BuyerAnalyticsError {
  return { endpoint, message, ...(status ? { status } : {}) };
}

export function isBuyerAnalyticsError(
  error: unknown,
): error is BuyerAnalyticsError {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'endpoint' in error &&
    'message' in error,
  );
}

export function isAbortError(error: unknown) {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError',
  );
}

export function normalizeBuyerOverview(payload: unknown): BuyerOverview {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    totalBuyers: toNonNegativeInteger(record.totalBuyers),
    buyersWithCompleteProfile: toNonNegativeInteger(
      record.buyersWithCompleteProfile,
    ),
    buyersWithShippingAddress: toNonNegativeInteger(
      record.buyersWithShippingAddress,
    ),
    buyersWithoutShippingAddress: toNonNegativeInteger(
      record.buyersWithoutShippingAddress,
    ),
    buyersWithCartItems: toNonNegativeInteger(record.buyersWithCartItems),
    checkoutReadyBuyers: toNonNegativeInteger(record.checkoutReadyBuyers),
    checkoutReadinessRate: toNonNegativeNumber(record.checkoutReadinessRate),
  };
}

export function normalizeNewBuyers(payload: unknown): NewBuyersAnalytics {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    ...normalizePagination(record),
    buyers: toArray(record.buyers).map(normalizeBuyerSummary),
    buckets: toArray(record.buckets).map(normalizeBuyerDateBucket),
  };
}

export function normalizePaginatedBuyers(
  payload: unknown,
): PaginatedBuyerAnalytics<BuyerSummary> {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    ...normalizePagination(record),
    buyers: toArray(record.buyers).map(normalizeBuyerSummary),
  };
}

export function normalizeCartOverview(payload: unknown): CartOverview {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    totalCarts: toNonNegativeInteger(record.totalCarts),
    activeCarts: toNonNegativeInteger(record.activeCarts),
    emptyCarts: toNonNegativeInteger(record.emptyCarts),
    abandonedCarts: toNonNegativeInteger(record.abandonedCarts),
    abandonedAfterDays: toNonNegativeInteger(record.abandonedAfterDays),
    averageDistinctItemsPerCart: toNonNegativeNumber(
      record.averageDistinctItemsPerCart,
    ),
    averageQuantityPerCart: toNonNegativeNumber(record.averageQuantityPerCart),
  };
}

export function normalizePaginatedCarts(
  payload: unknown,
): PaginatedCartAnalytics {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    ...normalizePagination(record),
    carts: toArray(record.carts).map(normalizeCartSummary),
  };
}

export function normalizeAbandonedCarts(
  payload: unknown,
): AbandonedCartAnalytics {
  const record = asRecord(payload);
  return {
    ...normalizePaginatedCarts(record),
    abandonedAfterDays: toNonNegativeInteger(record.abandonedAfterDays),
    cutoff: toSafeDateString(record.cutoff),
  };
}

export function normalizeAverageCartItems(payload: unknown): AverageCartItems {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    totalCarts: toNonNegativeInteger(record.totalCarts),
    activeCarts: toNonNegativeInteger(record.activeCarts),
    averageDistinctItemsAcrossAllCarts: toNonNegativeNumber(
      record.averageDistinctItemsAcrossAllCarts,
    ),
    averageDistinctItemsAcrossActiveCarts: toNonNegativeNumber(
      record.averageDistinctItemsAcrossActiveCarts,
    ),
    averageQuantityAcrossAllCarts: toNonNegativeNumber(
      record.averageQuantityAcrossAllCarts,
    ),
    averageQuantityAcrossActiveCarts: toNonNegativeNumber(
      record.averageQuantityAcrossActiveCarts,
    ),
  };
}

export function normalizeTopCartProducts(
  payload: unknown,
): TopCartProductsAnalytics {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    limit: toNonNegativeInteger(record.limit),
    products: toArray(record.products).map(normalizeTopCartProduct),
  };
}

export function normalizeCartsByBuyer(payload: unknown): CartsByBuyerAnalytics {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    ...normalizePagination(record),
    buyers: toArray(record.buyers).map(normalizeBuyerCartSummary),
  };
}

export function normalizeShippingAddressOverview(
  payload: unknown,
): ShippingAddressOverview {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    totalAddresses: toNonNegativeInteger(record.totalAddresses),
    totalBuyers: toNonNegativeInteger(record.totalBuyers),
    buyersWithAddress: toNonNegativeInteger(record.buyersWithAddress),
    buyersWithoutAddress: toNonNegativeInteger(record.buyersWithoutAddress),
    averageAddressesPerBuyer: toNonNegativeNumber(
      record.averageAddressesPerBuyer,
    ),
    averageAddressesPerAddressedBuyer: toNonNegativeNumber(
      record.averageAddressesPerAddressedBuyer,
    ),
    topCity: normalizeNullableDistributionPoint(record.topCity),
    topProvince: normalizeNullableDistributionPoint(record.topProvince),
  };
}

export function normalizeShippingAddressesByCity(
  payload: unknown,
): ShippingAddressesByCity {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    cities: toArray(record.cities).map(normalizeDistributionPoint),
  };
}

export function normalizeShippingAddressesByProvince(
  payload: unknown,
): ShippingAddressesByProvince {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    provinces: toArray(record.provinces).map(normalizeDistributionPoint),
  };
}

export function normalizeShippingAddressCompleteness(
  payload: unknown,
): ShippingAddressCompleteness {
  const record = asRecord(payload);
  return {
    ...normalizeDateRange(record),
    totalAddresses: toNonNegativeInteger(record.totalAddresses),
    completeRequiredFields: toNonNegativeInteger(record.completeRequiredFields),
    incompleteRequiredFields: toNonNegativeInteger(
      record.incompleteRequiredFields,
    ),
    completeRequiredFieldsRate: toNonNegativeNumber(
      record.completeRequiredFieldsRate,
    ),
    withLabel: toNonNegativeInteger(record.withLabel),
    withLabelRate: toNonNegativeNumber(record.withLabelRate),
    withApartment: toNonNegativeInteger(record.withApartment),
    withFloor: toNonNegativeInteger(record.withFloor),
    withApartmentOrFloor: toNonNegativeInteger(record.withApartmentOrFloor),
    withApartmentOrFloorRate: toNonNegativeNumber(
      record.withApartmentOrFloorRate,
    ),
  };
}

export function normalizeBuyerSummary(
  value: unknown,
  index: number,
): BuyerSummary {
  const record = asRecord(value);
  const fallbackLabel = `Buyer ${index + 1}`;
  return {
    rowId: `buyer-${index + 1}`,
    displayName: normalizeBuyerDisplayName(record, fallbackLabel),
    createdAt: toSafeDateString(record.createdAt),
    addressCount: toNonNegativeInteger(record.addressCount),
  };
}

export function normalizeCartBuyerSummary(
  value: unknown,
  index: number,
): CartBuyerSummary | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    displayName: normalizeBuyerDisplayName(value, `Buyer ${index + 1}`),
  };
}

export function normalizeBuyerCartSummary(
  value: unknown,
  index: number,
): BuyerCartSummary {
  const record = asRecord(value);
  return {
    ...normalizeBuyerSummary(record, index),
    cart: isRecord(record.cart)
      ? normalizeCartSummary(record.cart, index)
      : null,
  };
}

export function normalizeCartSummary(
  value: unknown,
  index: number,
): CartSummary {
  const record = asRecord(value);
  return {
    id: toSafeString(record.id, `cart-${index + 1}`),
    itemCount: toNonNegativeInteger(record.itemCount),
    totalQuantity: toNonNegativeInteger(record.totalQuantity),
    updatedAt: toSafeDateString(record.updatedAt),
    lastItemActivityAt: toNullableDateString(record.lastItemActivityAt),
    buyer: normalizeCartBuyerSummary(record.buyer, index),
  };
}

export function normalizeTopCartProduct(value: unknown): TopCartProduct {
  const record = asRecord(value);
  return {
    productId: toSafeString(record.productId, 'Unknown product'),
    totalQuantity: toNonNegativeInteger(record.totalQuantity),
    cartCount: toNonNegativeInteger(record.cartCount),
    lineCount: toNonNegativeInteger(record.lineCount),
  };
}

export function normalizeBuyerDateBucket(value: unknown): BuyerDateBucket {
  const record = asRecord(value);
  const date = toSafeString(record.date);
  const bucketValue = toSafeString(record.value);

  return {
    ...(date ? { date } : {}),
    ...(bucketValue ? { value: bucketValue } : {}),
    count: toNonNegativeInteger(record.count),
  };
}

export function normalizeNullableDistributionPoint(
  value: unknown,
): AddressDistributionPoint | null {
  if (!isRecord(value)) {
    return null;
  }

  return normalizeDistributionPoint(value);
}

export function normalizeDistributionPoint(
  value: unknown,
): AddressDistributionPoint {
  const record = asRecord(value);
  return {
    value: toSafeString(record.value, 'Unknown'),
    count: toNonNegativeInteger(record.count),
  };
}

export function normalizePagination(value: unknown) {
  const record = asRecord(value);
  return {
    page: toPositiveInteger(record.page, 1),
    take: toNonNegativeInteger(record.take),
    total: toNonNegativeInteger(record.total),
  };
}

export function normalizeDateRange(value: unknown) {
  const record = asRecord(value);
  return {
    from: toNullableString(record.from),
    to: toNullableString(record.to),
  };
}

export function normalizeBuyerDisplayName(
  record: UnknownRecord,
  fallback: string,
) {
  const fullName = [record.firstName, record.lastName]
    .map((value) => toSafeString(value))
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || fallback;
}

export function asRecord(value: unknown): UnknownRecord {
  return isRecord(value) ? value : {};
}

export function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

export function toArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

export function toSafeString(value: unknown, fallback = '') {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
}

export function toNullableString(value: unknown) {
  return toSafeString(value) || null;
}

export function toSafeDateString(value: unknown) {
  const candidate = toSafeString(value);
  return candidate && !Number.isNaN(new Date(candidate).getTime())
    ? candidate
    : '';
}

export function toNullableDateString(value: unknown) {
  const date = toSafeDateString(value);
  return date || null;
}

export function toNumber(value: unknown, fallback = 0) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim()
        ? Number(value)
        : fallback;

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function toNonNegativeNumber(value: unknown, fallback = 0) {
  return Math.max(toNumber(value, fallback), 0);
}

export function toNonNegativeInteger(value: unknown, fallback = 0) {
  return Math.trunc(toNonNegativeNumber(value, fallback));
}

export function toPositiveInteger(value: unknown, fallback = 1) {
  return Math.max(toNonNegativeInteger(value, fallback), 1);
}
