export type BuyerAnalyticsEndpoint<T> = {
  data: T | null;
  error: BuyerAnalyticsError | null;
};

export type BuyerAnalyticsError = {
  endpoint: string;
  message: string;
  status?: number;
};

export type BuyerAnalyticsFilters = {
  from: string;
  to: string;
  inactiveDays: number;
};

export type DateRangeResponse = {
  from: string | null;
  to: string | null;
};

export type BuyerSummary = {
  rowId: string;
  displayName: string;
  createdAt: string;
  addressCount: number;
};

export type CartBuyerSummary = {
  displayName: string;
};

export type BuyerOverview = DateRangeResponse & {
  totalBuyers: number;
  buyersWithCompleteProfile: number;
  buyersWithShippingAddress: number;
  buyersWithoutShippingAddress: number;
  buyersWithCartItems: number;
  checkoutReadyBuyers: number;
  checkoutReadinessRate: number;
};

export type BuyerDateBucket = {
  date?: string;
  value?: string;
  count: number;
};

export type PaginatedBuyerAnalytics<T> = DateRangeResponse & {
  page: number;
  take: number;
  total: number;
  buyers: T[];
};

export type NewBuyersAnalytics = PaginatedBuyerAnalytics<BuyerSummary> & {
  buckets: BuyerDateBucket[];
};

export type CartOverview = DateRangeResponse & {
  totalCarts: number;
  activeCarts: number;
  emptyCarts: number;
  abandonedCarts: number;
  abandonedAfterDays: number;
  averageDistinctItemsPerCart: number;
  averageQuantityPerCart: number;
};

export type CartSummary = {
  id: string;
  itemCount: number;
  totalQuantity: number;
  updatedAt: string;
  lastItemActivityAt: string | null;
  buyer: CartBuyerSummary | null;
};

export type PaginatedCartAnalytics = DateRangeResponse & {
  page: number;
  take: number;
  total: number;
  carts: CartSummary[];
};

export type AbandonedCartAnalytics = PaginatedCartAnalytics & {
  abandonedAfterDays: number;
  cutoff: string;
};

export type AverageCartItems = DateRangeResponse & {
  totalCarts: number;
  activeCarts: number;
  averageDistinctItemsAcrossAllCarts: number;
  averageDistinctItemsAcrossActiveCarts: number;
  averageQuantityAcrossAllCarts: number;
  averageQuantityAcrossActiveCarts: number;
};

export type TopCartProduct = {
  productId: string;
  totalQuantity: number;
  cartCount: number;
  lineCount: number;
};

export type TopCartProductsAnalytics = DateRangeResponse & {
  limit: number;
  products: TopCartProduct[];
};

export type BuyerCartSummary = BuyerSummary & {
  cart: CartSummary | null;
};

export type CartsByBuyerAnalytics = PaginatedBuyerAnalytics<BuyerCartSummary>;

export type AddressDistributionPoint = {
  value: string;
  count: number;
};

export type ShippingAddressOverview = DateRangeResponse & {
  totalAddresses: number;
  totalBuyers: number;
  buyersWithAddress: number;
  buyersWithoutAddress: number;
  averageAddressesPerBuyer: number;
  averageAddressesPerAddressedBuyer: number;
  topCity: AddressDistributionPoint | null;
  topProvince: AddressDistributionPoint | null;
};

export type ShippingAddressesByCity = DateRangeResponse & {
  cities: AddressDistributionPoint[];
};

export type ShippingAddressesByProvince = DateRangeResponse & {
  provinces: AddressDistributionPoint[];
};

export type ShippingAddressCompleteness = DateRangeResponse & {
  totalAddresses: number;
  completeRequiredFields: number;
  incompleteRequiredFields: number;
  completeRequiredFieldsRate: number;
  withLabel: number;
  withLabelRate: number;
  withApartment: number;
  withFloor: number;
  withApartmentOrFloor: number;
  withApartmentOrFloorRate: number;
};

export type BuyerAnalyticsSnapshot = {
  filters: BuyerAnalyticsFilters;
  generatedAt: string;
  errors: BuyerAnalyticsError[];
  buyerOverview: BuyerAnalyticsEndpoint<BuyerOverview>;
  newBuyers: BuyerAnalyticsEndpoint<NewBuyersAnalytics>;
  buyersWithAddress: BuyerAnalyticsEndpoint<PaginatedBuyerAnalytics<BuyerSummary>>;
  buyersWithoutAddress: BuyerAnalyticsEndpoint<PaginatedBuyerAnalytics<BuyerSummary>>;
  cartOverview: BuyerAnalyticsEndpoint<CartOverview>;
  activeCarts: BuyerAnalyticsEndpoint<PaginatedCartAnalytics>;
  abandonedCarts: BuyerAnalyticsEndpoint<AbandonedCartAnalytics>;
  averageCartItems: BuyerAnalyticsEndpoint<AverageCartItems>;
  topCartProducts: BuyerAnalyticsEndpoint<TopCartProductsAnalytics>;
  cartsByBuyer: BuyerAnalyticsEndpoint<CartsByBuyerAnalytics>;
  shippingAddressOverview: BuyerAnalyticsEndpoint<ShippingAddressOverview>;
  shippingAddressesByCity: BuyerAnalyticsEndpoint<ShippingAddressesByCity>;
  shippingAddressesByProvince: BuyerAnalyticsEndpoint<ShippingAddressesByProvince>;
  shippingAddressCompleteness: BuyerAnalyticsEndpoint<ShippingAddressCompleteness>;
};
