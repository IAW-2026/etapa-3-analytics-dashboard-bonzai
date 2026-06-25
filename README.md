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
5. Explorar Shipping App en `/dashboard/shipping`: envíos activos, tasa de éxito, tabla de envíos con filtros y mapa de calor de actividad.
6. Exportar datos a CSV desde cualquier gráfico o sección.

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

### Shipping Analytics (`/dashboard/shipping`)
| App | Endpoint | Qué muestra |
|---|---|---|
| Shipping | `GET /api/analytics/delivery-stats` | Estadísticas de entrega |
| Shipping | `GET /api/admin/shipments` | Tabla de envíos con filtros |
| Shipping | `GET /api/analytics/recent-activity` | Feed de actividad reciente |
| Shipping | `GET /api/analytics/delivery-heatmap` | Mapa de calor por hora/día |
| Shipping | `GET /api/admin/shipments/incidents` | Incidentes de envío |

---

## Próximas implementaciones

- **Buyer App**: integrar `/api/buyer/*` para métricas de comportamiento de usuarios, frecuencia de compra y segmentación.
- **Panel de usuarios**: sección administrativa para visualizar datos de cada usuario, sus órdenes, productos y actividad, con acciones de habilitar/deshabilitar.
- **Órdenes**: vista detallada con timeline, posibilidad de cancelar órdenes pendientes desde el dashboard.
- **Comparativa entre apps**: gráfico unificado que cruce datos de Seller y Payments (ej. órdenes vs transacciones).
- **Alertas**: notificaciones ante umbrales críticos (ej. alta tasa de disputas, stock agotado, caída de servicio).
- **Chat IA Leafy**: integrar el asistente Leafy para consultas sobre métricas en lenguaje natural.

---

## Stack técnico

Next.js 16, Clerk, Recharts, Lucide React, CSS Modules.
