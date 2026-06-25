# Bonzai — Analytics Dashboard

**Deploy**: [https://etapa-3-analytics-dashboard-bonzai.vercel.app](https://etapa-3-analytics-dashboard-bonzai.vercel.app)

---

## Usuario de prueba

| Email | Rol |
|---|---|
| `super_admin+clerk_test@iaw.com` | Administrador (`super_admin`) |

Contraseña: `iawuser#`

---

## Instrucciones de uso

1. Ingresar con el usuario admin en `/login`.
2. Explorar el dashboard general en `/dashboard`: tarjetas con métricas consolidadas de Seller, Payments y Shipping.
3. Ver analytics detallados del Seller App en `/dashboard/seller`: filtros por fecha (desde/hasta), agrupación por día/semana/mes, gráficos de ingresos y órdenes, breakdown por estado, top productos, top vendedores, distribución de reseñas y métricas de reservas.
4. Explorar Payments App en `/dashboard/payments`: volumen de transacciones, comisiones, disputas, billeteras activas y gráficos de estado.
 5. Explorar Buyer App en `/dashboard/buyer`: overview de compradores (totales, nuevos, con/sin dirección), carritos (activos, abandonados, promedio de items, top productos), direcciones de envío (por ciudad, provincia, completitud). Filtrar por rango de fechas y días de inactividad.
 6. Explorar Shipping App en `/dashboard/shipping`: filtro por fecha (desde/hasta) y granularidad (día/semana/mes), tarjetas de envíos totales/activos/éxito/cancelados, gráfico de evolución temporal por estado, distribución por tipo de envío, breakdown por estado, funnel logístico, feed de actividad y tabla de envíos con búsqueda, filtro por estado y paginación.
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
| Shipping | `GET /api/analytics/delivery-stats?from=&to=&granularity=` | Totales, tasa de éxito, breakdown por estado y períodos agrupados (día/semana/mes) |
| Shipping | `GET /api/admin/shipments?from=&to=&status=&q=` | Tabla de envíos con búsqueda, filtro por estado y paginación |
| Shipping | `GET /api/analytics/shipments-by-type?from=&to=` | Distribución por tipo de envío |
| Shipping | `GET /api/analytics/recent-activity?from=&to=` | Feed de actividad reciente y mapa de calor |

---

## Bonzai Advisor

El **Bonzai Advisor** es un módulo de inteligencia artificial en el dashboard general (`/dashboard`) que genera un diagnóstico estratégico cruzando datos de los cuatro servicios del ecosistema Bonzai.

### Cómo funciona

1. **Recolección**: el backend obtiene métricas de Buyer, Seller, Shipping y Payments en paralelo vía `Promise.allSettled`.
2. **Análisis**: los datos se consolidan y se envían a **Google Gemini** (`gemini-2.5-flash`) con un prompt que instruye al modelo a correlacionar información entre servicios (ej: abandono de carritos vs. demoras logísticas, disputas vs. revenue por categoría).
3. **Respuesta**: Gemini devuelve 3 hallazgos críticos en formato JSON, cada uno con título, descripción, severidad (`positive`, `warning`, `critical`) y servicios involucrados.

### Uso

- Hacer clic en **"Generate AI Diagnosis"** desde la tarjeta Bonzai Advisor en `/dashboard`.
- Los resultados se muestran con color según severidad (verde = oportunidad, dorado = atención, rojo = crítico).
- El botón **"Regenerate Diagnosis"** permite re-ejecutar el análisis.

### Limitaciones

- **Dependencia de servicios externos**: si uno o más servicios no responden, el diagnóstico será **parcial** y se indicará con un aviso. Si todos fallan, el advisor no estará disponible.
- **Respuestas no determinísticas**: Gemini puede generar hallazgos distintos en cada ejecución aunque los datos no hayan cambiado.
- **Sin memoria ni historial**: cada diagnóstico es independiente. No compara con ejecuciones anteriores ni detecta tendencias a largo plazo.
- **Alucinaciones**: el modelo puede inferir correlaciones espurias o mencionar datos inexactos si las métricas son insuficientes.
- **Rate limits de la API de Gemini**: la key gratuita de Google AI Studio tiene límites de cuota que pueden degradar la disponibilidad bajo uso intensivo.

---

## Stack técnico

Next.js 16, Clerk, Recharts, Lucide React, CSS Modules.
