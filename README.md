# Bonzai — Analytics Dashboard

**Deploy**: [https://etapa-3-analytics-dashboard-bonzai.vercel.app](https://etapa-3-analytics-dashboard-bonzai.vercel.app)

---

## Usuario de prueba

| Email | Rol |
|---|---|
| `seller_admin+clerk_test@iaw.com` | Administrador |

Contraseña: `iawuser#`

---

## Instrucciones de uso

1. Ingresar con el usuario admin en `/login`.
2. Explorar el dashboard general en `/dashboard`: tarjetas con métricas consolidadas de Seller, Payments y Shipping.
3. Ver analytics detallados del Seller App en `/dashboard/seller`: filtros por fecha (desde/hasta), agrupación por día/semana/mes, gráficos de ingresos y órdenes, breakdown por estado, top productos, top vendedores, distribución de reseñas y métricas de reservas.
4. Explorar Payments App en `/dashboard/payments`: volumen de transacciones, comisiones, disputas, billeteras activas y gráficos de estado.
 5. Explorar Buyer App en `/dashboard/buyer`: overview de compradores (totales, nuevos, con/sin dirección), carritos (activos, abandonados, promedio de items, top productos), direcciones de envío (por ciudad, provincia, completitud). Filtrar por rango de fechas y días de inactividad.
 6. Explorar Shipping App en `/dashboard/shipping`: envíos activos, tasa de éxito, tabla de envíos con filtros y mapa de calor de actividad.
 7. Exportar datos a CSV desde cualquier gráfico o sección.

---

## Descripción del proyecto

Bonzai Analytics Dashboard es la aplicación de reportes de Bonzai (Etapa 3). Consume las APIs REST de las cuatro aplicaciones del proyecto — Seller App, Payments App, Buyer App y Shipping App — utilizando las service key de cada app (`x-service-key`) y las presenta en un panel visual unificado.

El dashboard permite filtrar métricas por rango de fechas, visualizar tendencias, rankings y distribuciones, y exportar datos a CSV. Está diseñado como herramienta de administración y monitoreo para supervisores del sistema.

El frontend está desarrollado con Next.js 16 App Router, los gráficos usan Recharts, la autenticación usa Clerk y el deploy es en Vercel. Todas las llamadas a APIs externas se realizan a través de un proxy interno (`/api/seller/*`, `/api/payments/*`, `/api/shipping/*`) para evitar CORS y proteger claves.

---

## Endpoints consumidos por sección

### Dashboard general (`/dashboard`)
| App | Endpoint | Qué muestra |
|---|---|---|
| Seller | `GET /api/admin/statistics` | Total sellers, products, orders, revenue, avg rating, reservas, conversión |
| Payments | `GET /api/payments/overview` | Transacciones, volumen, comisiones, disputas activas, billeteras |
| Shipping | `GET /api/analytics/delivery-stats` | Total envíos, activos, tasa de éxito, entregados, cancelados, pendientes |

### Seller Analytics (`/dashboard/seller`)
| App | Endpoint | Qué muestra |
|---|---|---|
| Seller | `GET /api/admin/statistics?from=&to=` | Tarjetas de sellers, products, orders, revenue (filtradas por fecha) |
| Seller | `GET /api/admin/analytics/revenue?from=&to=&interval=` | Gráfico de tendencia de ingresos |
| Seller | `GET /api/admin/analytics/orders?from=&to=&groupBy=` | Órdenes en el tiempo y breakdown por estado |
| Seller | `GET /api/admin/analytics/reviews?from=&to=` | Distribución de calificaciones |
| Seller | `GET /api/admin/analytics/reservations?from=&to=` | Métricas de reservas |
| Seller | `GET /api/admin/analytics/categories?from=&to=` | Ingresos por categoría |
| Seller | `GET /api/admin/analytics/products/top?from=&to=` | Top productos por ingresos |
| Seller | `GET /api/admin/analytics/sellers/top?from=&to=` | Top vendedores por ingresos |

### Payments Analytics (`/dashboard/payments`)
| App | Endpoint | Qué muestra |
|---|---|---|
| Payments | `GET /api/payments/overview` | Resumen de transacciones y comisiones |
| Payments | `GET /api/payments/analytics/transactions` | Distribución por estado de transacciones |
| Payments | `GET /api/payments/analytics/disputes` | Inteligencia de disputas (razones y resoluciones) |
| Payments | `GET /api/payments/sellers/top` | Top sellers por volumen |

### Buyer Analytics (`/dashboard/buyer`)
| App | Endpoint | Qué muestra |
|---|---|---|
| Buyer | `GET /api/analytics/buyers/overview` | Totales, nuevos, con dirección, sin dirección |
| Buyer | `GET /api/analytics/buyers/new` | Nuevos compradores en el período |
| Buyer | `GET /api/analytics/buyers/with-address` | Compradores con dirección de envío |
| Buyer | `GET /api/analytics/buyers/without-address` | Compradores sin dirección de envío |
| Buyer | `GET /api/analytics/carts/overview` | Carritos activos, abandonados, totales |
| Buyer | `GET /api/analytics/carts/active` | Carritos activos |
| Buyer | `GET /api/analytics/carts/abandoned` | Carritos abandonados |
| Buyer | `GET /api/analytics/carts/average-items` | Promedio de items por carrito |
| Buyer | `GET /api/analytics/carts/top-products` | Productos más agregados a carritos |
| Buyer | `GET /api/analytics/carts/by-buyer` | Carritos por comprador |
| Buyer | `GET /api/analytics/shipping-addresses/overview` | Direcciones de envío: total, completas, incompletas |
| Buyer | `GET /api/analytics/shipping-addresses/by-city` | Direcciones agrupadas por ciudad |
| Buyer | `GET /api/analytics/shipping-addresses/by-province` | Direcciones agrupadas por provincia |
| Buyer | `GET /api/analytics/shipping-addresses/completeness` | Completitud de direcciones |

### Shipping Analytics (`/dashboard/shipping`)
| App | Endpoint | Qué muestra |
|---|---|---|
| Shipping | `GET /api/analytics/delivery-stats` | Estadísticas de entrega |
| Shipping | `GET /api/admin/shipments` | Tabla de envíos con filtros |
| Shipping | `GET /api/analytics/recent-activity` | Feed de actividad reciente |
| Shipping | `GET /api/analytics/delivery-heatmap` | Mapa de calor por hora/día |
| Shipping | `GET /api/admin/shipments/incidents` | Incidentes de envío |

---

## Stack técnico

Next.js 16, Clerk, Recharts, Lucide React, CSS Modules.
