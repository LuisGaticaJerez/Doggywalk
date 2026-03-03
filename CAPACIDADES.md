# Documentación de Capacidades - DoggyWalk

**Versión:** 2.0.0
**Actualizado:** 3 de marzo, 2026

## Resumen Ejecutivo

DoggyWalk es una plataforma completa de servicios para mascotas que conecta dueños de mascotas con proveedores de servicios profesionales. La aplicación incluye funcionalidades avanzadas como:

- **Reservas recurrentes** (diarias, semanales, mensuales)
- **Chat en tiempo real** con compartir fotos
- **Notificaciones push**
- **Verificación de identidad** con aprobación admin
- **Multi-servicios** por proveedor (7 tipos diferentes)
- **Catálogo de servicios** detallado
- **Sistema de cancelación inteligente**
- **Dashboard administrativo**
- **Soporte PWA** con service worker

---

## 1. Sistema de Usuarios y Perfiles

### 1.1 Gestión de Usuarios
- **Autenticación integrada con Supabase Auth**
- **Roles de usuario:**
  - `owner` (Dueño de mascota)
  - `pet_master` (Proveedor de servicios)
- **Perfiles completos con:**
  - Nombre completo
  - Email (único)
  - Teléfono
  - Avatar/foto de perfil
  - Proveedor OAuth (Google, Apple, etc.)
  - Estado de verificación de identidad

### 1.2 Sistema de Verificación de Identidad
- **Verificación de documentos:**
  - Cédula de identidad
  - Pasaporte
  - Licencia de conducir
- **Proceso de verificación:**
  - Subida de documento frontal
  - Subida de documento reverso
  - Selfie de verificación
- **Estados del proceso:**
  - No enviado
  - Pendiente
  - En revisión
  - Aprobado
  - Rechazado (con razón del rechazo)
- **Trazabilidad completa:** Fecha de envío, fecha de revisión, revisor

---

## 2. Gestión de Mascotas

### 2.1 Perfiles de Mascotas
- **Información básica:**
  - Nombre
  - Raza
  - Tamaño (pequeño, mediano, grande)
  - Edad
  - Foto
- **Información adicional:**
  - Notas especiales (alergias, comportamiento, necesidades especiales)
  - Relación con el dueño mediante foreign key
- **Seguridad:** Políticas RLS que aseguran que solo el dueño puede ver/editar sus mascotas

---

## 3. Proveedores de Servicios (Pet Masters)

### 3.1 Tipos de Servicios
La plataforma soporta tres tipos de proveedores:

#### A) Paseadores de Perros (Walkers)
- Tarifa por hora
- Radio de servicio (en metros)
- Disponibilidad en tiempo real
- Ubicación GPS actual
- Verificación de antecedentes

#### B) Hoteles para Mascotas (Hotels)
- **Precio por noche**
- **Capacidad de alojamiento**
- **Instalaciones y amenidades:**
  - Aire acondicionado
  - Calefacción
  - Piscina
  - Área de juegos
  - Servicio de grooming
  - Entrenamiento
  - Veterinario en sitio
  - Supervisión 24/7
  - Cámaras de seguridad
  - Habitaciones individuales
  - Juego en grupo
  - Dietas especiales

#### C) Veterinarios (Vets)
- **Servicios disponibles:**
  - Consultas
  - Vacunaciones
  - Cirugía
  - Laboratorio
  - Radiología
  - Ultrasonido
  - Odontología
  - Grooming
  - Hospitalización
  - Emergencias
  - Visitas a domicilio
  - Implantación de microchip
- **Servicio de emergencia** (disponible 24/7)

### 3.2 Perfil del Proveedor
- Biografía/descripción del servicio
- Calificación promedio
- Total de servicios completados
- Estado de verificación
- Estado de verificación de antecedentes
- Especialidades (array de tags)
- Facilidades disponibles

### 3.3 Horarios de Servicio
- Configuración por día de la semana (0-6)
- Hora de apertura y cierre
- Opción para marcar días cerrados
- Actualización en tiempo real

### 3.4 Galería de Fotos
- **Tipos de fotos:**
  - Instalaciones
  - Servicios
  - Equipo de trabajo
  - Otras
- Foto de portada destacada
- Orden de visualización personalizable
- Captions/descripciones

---

## 4. Sistema de Reservas (Bookings)

### 4.1 Gestión de Reservas
- **Estados de reserva:**
  - Pendiente
  - Aceptada
  - En progreso
  - Completada
  - Cancelada
- **Información de la reserva:**
  - Fecha y hora programada
  - Duración (en minutos)
  - Mascota asignada
  - Proveedor asignado
  - Ubicación de recogida (GPS + dirección)
  - Monto total
  - Instrucciones especiales

### 4.2 Seguimiento y Trazabilidad
- Fecha de creación
- Fecha de actualización
- Fecha de completación
- Indicador si tiene calificación

### 4.3 Rutas de Paseo (GPS Tracking)
- Almacenamiento de coordenadas GPS del recorrido
- Cálculo de distancia recorrida (en metros)
- Hora de inicio y finalización
- Formato JSON para coordenadas

---

## 5. Sistema de Pagos Completo

### 5.1 Métodos de Pago
- **Tipos soportados:**
  - Tarjetas de crédito/débito (Stripe)
  - Apple Pay
  - Google Pay
- **Información de tarjeta:**
  - Últimos 4 dígitos
  - Marca (Visa, Mastercard, etc.)
  - Fecha de expiración (mes/año)
  - ID de método de pago en Stripe
- **Método de pago predeterminado**

### 5.2 Transacciones
- **Estados de transacción:**
  - Pendiente
  - Procesando
  - Completada
  - Fallida
  - Reembolsada
- **Información detallada:**
  - Monto y moneda
  - Usuario asociado
  - Reserva asociada
  - Tipo de método de pago
  - ID de Payment Intent de Stripe
  - Mensaje de error (si aplica)
  - Metadata adicional (JSON)

### 5.3 Historial de Pagos
- Sistema de pagos legacy
- Estado del pago de cada reserva:
  - Pendiente
  - Pagado
  - Fallido
  - Reembolsado

### 5.4 Transacciones con Wallets
- Soporte para Apple Pay y Google Pay
- ID de transacción de la plataforma
- Metadata de la transacción

---

## 6. Sistema de Calificaciones y Reseñas

### 6.1 Sistema de Calificación Detallado
- **Calificación general:** 1 a 5 estrellas
- **Comentarios de texto libre**
- **Calificaciones por atributos específicos:**
  - Puntualidad
  - Comunicación
  - Cuidado de la mascota
  - Limpieza
  - Profesionalismo
  - Relación calidad-precio
  - Instalaciones (para hoteles)
  - Atención médica (para veterinarios)
  - Manejo del paseo (para paseadores)
  - Empatía con la mascota

### 6.2 Atributos de Calificación Configurables
- **Multiidioma:** Español e Inglés
- **Aplicabilidad:** Por tipo de servicio (walker, hotel, vet)
- **Descripción detallada** de cada atributo
- **Orden de visualización** personalizable
- **Estado activo/inactivo**

### 6.3 Galería de Fotos en Reseñas
- Los usuarios pueden adjuntar fotos a sus reseñas
- Captions/descripciones de las fotos
- Orden de visualización

### 6.4 Restricciones de Integridad
- Una calificación por reserva
- Solo se puede calificar servicios completados
- Actualización automática del promedio del proveedor

---

## 7. Sistema de Suscripciones

### 7.1 Planes Disponibles
- **Basic:** Funcionalidades básicas
- **Premium:** Funcionalidades avanzadas
- **Enterprise:** Funcionalidades empresariales

### 7.2 Plataformas de Pago
- Stripe (web)
- Apple In-App Purchase
- Google Play Billing

### 7.3 Gestión de Suscripciones
- **Estados:**
  - Prueba (trial)
  - Activa
  - Cancelada
  - Expirada
  - Pago vencido
- **Características:**
  - Período de prueba
  - Período actual (inicio y fin)
  - Cancelación al final del período
  - ID de suscripción de la plataforma
  - Metadata adicional

---

## 8. Seguridad y Privacidad

### 8.1 Row Level Security (RLS)
- **Todas las tablas tienen RLS habilitado**
- **Políticas de seguridad implementadas:**
  - Los usuarios solo ven sus propios datos
  - Los dueños solo ven sus mascotas y reservas
  - Los proveedores solo ven reservas asignadas a ellos
  - Sistema de permisos basado en roles
  - Verificación de propiedad en todas las operaciones

### 8.2 Políticas de Acceso
- **SELECT:** Solo datos propios o públicos
- **INSERT:** Solo crear recursos propios
- **UPDATE:** Solo actualizar recursos propios
- **DELETE:** Solo eliminar recursos propios (con restricciones)

### 8.3 Integridad de Datos
- Foreign keys en todas las relaciones
- Constraints de validación en campos críticos
- Triggers automáticos para actualizaciones
- Índices para optimización de consultas

---

## 9. Características Técnicas

### 9.1 Stack Tecnológico
- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Hosting:** Netlify/Vercel ready

### 9.2 Base de Datos
- **PostgreSQL** con extensiones de Supabase
- **23 tablas** interrelacionadas
- **10 atributos de calificación** preconfigurados
- **Migraciones versionadas** (10 migraciones aplicadas)

### 9.3 Optimizaciones Implementadas
- Índices en columnas frecuentemente consultadas
- Triggers para actualización automática de promedios
- Valores por defecto en campos comunes
- Validaciones a nivel de base de datos

---

## 10. Funcionalidades Adicionales

### 10.1 Geolocalización
- Almacenamiento de coordenadas GPS
- Cálculo de distancias
- Radio de servicio configurable
- Tracking en tiempo real de rutas

### 10.2 Sistema de Notificaciones
- Preparado para notificaciones push
- Estados de reserva actualizables en tiempo real
- Sistema de eventos de base de datos

### 10.3 Multimoneda
- Soporte para diferentes monedas
- USD por defecto
- Preparado para internacionalización

### 10.4 Metadata Extensible
- Campos JSON en transacciones y suscripciones
- Permite almacenar información adicional sin cambios de esquema
- Flexible para requisitos futuros

---

## 11. Mejoras de Seguridad Implementadas

### 11.1 Correcciones Críticas de RLS
- Eliminación de políticas inseguras (USING true)
- Implementación de verificación de propiedad en todas las operaciones
- Restricción de acceso a datos sensibles
- Políticas específicas para cada rol

### 11.2 Optimizaciones de Rendimiento
- Índices en foreign keys
- Índices en campos frecuentemente filtrados
- Optimización de consultas de calificaciones
- Índices compuestos para consultas complejas

---

## 12. Estructura del Proyecto

```
doggywalk/
├── src/
│   ├── App.tsx                 # Componente principal con routing
│   ├── main.tsx                # Punto de entrada
│   ├── index.css               # Estilos globales
│   ├── lib/
│   │   └── supabase.ts         # Cliente de Supabase configurado
│   └── pages/
│       └── Home.tsx            # Página principal
├── dist/                       # Build de producción
├── package.json                # Dependencias del proyecto
├── vite.config.ts              # Configuración de Vite
├── tsconfig.json               # Configuración de TypeScript
└── .env                        # Variables de entorno (Supabase)
```

---

## 13. Variables de Entorno Configuradas

```
VITE_SUPABASE_URL           # URL de la instancia de Supabase
VITE_SUPABASE_ANON_KEY      # Clave pública de Supabase
```

---

## 14. Estado del Proyecto

### ✅ Completado
- Base de datos completa con 23 tablas
- Sistema de autenticación
- Sistema de perfiles y verificación
- Gestión de mascotas
- Tres tipos de proveedores de servicios
- Sistema de reservas completo
- Sistema de pagos robusto (Stripe + Wallets)
- Sistema de calificaciones detallado con atributos
- Sistema de suscripciones
- Row Level Security en todas las tablas
- Optimizaciones de rendimiento
- Correcciones de seguridad críticas
- Aplicación React lista para desarrollo

### 🚀 Listo para Desarrollo
- Configuración completa de frontend
- Base de datos lista y optimizada
- Autenticación configurada
- Build de producción funcional

---

## 15. Sistema de Reservas Recurrentes (NUEVO)

### 15.1 Configuración de Series
- **Frecuencias soportadas:**
  - Diaria: Servicio todos los días
  - Semanal: Días específicos (Lun, Mié, Vie, etc.)
  - Mensual: Misma fecha cada mes
- **Condiciones de finalización:**
  - Fecha de fin específica
  - Número máximo de ocurrencias
  - Ambas condiciones combinadas

### 15.2 Generación Automática
- Sistema genera hasta 10 reservas futuras por serie
- Auto-generación de nuevas reservas cuando se completan
- Solo genera reservas hasta 3 meses adelante
- Respeta días de la semana (para frecuencia semanal)

### 15.3 Gestión de Series
- Vista dedicada de todas las series activas
- Próxima reserva de cada serie
- Estadísticas (total de reservas, completadas, pendientes)
- Cancelación de serie completa (solo afecta reservas futuras)

### 15.4 Tabla de Base de Datos
```sql
recurring_booking_series
- id, owner_id, pet_master_id
- frequency (daily, weekly, monthly)
- days_of_week (array para semanal)
- time_of_day, duration_minutes
- end_date, max_occurrences
- status (active, paused, cancelled, completed)
```

---

## 16. Sistema de Chat en Tiempo Real (NUEVO)

### 16.1 Mensajería
- Chat en tiempo real entre dueño y proveedor
- Contexto de reserva siempre visible
- Historial de mensajes preservado
- Indicadores de lectura y timestamps

### 16.2 Compartir Fotos
- Subida de fotos en conversación
- Almacenamiento en Supabase Storage
- Previsualización de imágenes
- Galería en el chat

### 16.3 Implementación Técnica
- Supabase Realtime subscriptions
- Hook personalizado `useChat`
- Actualizaciones optimistas de UI
- Auto-scroll a mensajes nuevos

### 16.4 Tablas de Base de Datos
```sql
chat_messages
- id, booking_id, sender_id
- message_text, sent_at, read_at

chat_attachments
- id, message_id, file_url
- file_type, file_size
```

---

## 17. Sistema de Notificaciones Push (NUEVO)

### 17.1 Tipos de Notificaciones
- Nuevas solicitudes de reserva (proveedores)
- Reservas aceptadas/rechazadas (dueños)
- Servicio iniciado/completado
- Nuevos mensajes de chat
- Actualizaciones de series recurrentes
- Confirmaciones de pago
- Notificaciones de cancelación

### 17.2 Implementación
- Servicio Expo Push Notifications
- Edge Function de Supabase para envío
- Gestión de tokens en base de datos
- Preferencias por usuario

### 17.3 Tabla de Base de Datos
```sql
notifications
- id, user_id, type, title, message
- data (JSON), read, sent_at
- push_token
```

### 17.4 Edge Function
- `send-push-notification` - Envío de notificaciones
- Integración con Expo API
- Manejo de errores y reintentos

---

## 18. Verificación de Identidad (NUEVO)

### 18.1 Proceso de Verificación
1. Proveedor sube documento de ID (frente y reverso)
2. Proveedor toma selfie de verificación
3. Admin revisa documentos en dashboard
4. Admin aprueba o rechaza con razón
5. Proveedor obtiene badge de verificado

### 18.2 Tipos de Documentos
- Cédula de identidad nacional
- Pasaporte
- Licencia de conducir

### 18.3 Dashboard Administrativo
- Ver verificaciones pendientes
- Visualizar documentos subidos
- Aprobar/rechazar con notas
- Historial de verificaciones

### 18.4 Seguridad
- Documentos en Supabase Storage seguro
- RLS en registros de verificación
- Acceso solo para admins
- Logs de todas las acciones

### 18.5 Tabla de Base de Datos
```sql
identity_verifications
- id, user_id, document_type
- front_image_url, back_image_url, selfie_url
- status (pending, in_review, approved, rejected)
- rejection_reason, reviewed_by, reviewed_at
```

---

## 19. Multi-Servicios por Proveedor (NUEVO)

### 19.1 Tipos de Servicios Disponibles
Los proveedores pueden ofrecer múltiples servicios simultáneamente:
- **Dog Walker** - Paseos de perros
- **Pet Sitter** - Cuidado en casa
- **Groomer** - Servicios de grooming
- **Trainer** - Entrenamiento de mascotas
- **Veterinarian** - Servicios veterinarios
- **Daycare** - Guardería de día
- **Pet Hotel** - Hotel para mascotas

### 19.2 Gestión de Servicios
- Crear ofertas de servicio detalladas
- Precio personalizado por servicio
- Descripciones específicas
- Habilitar/deshabilitar individualmente
- Fotos por servicio

### 19.3 Características Específicas por Servicio

**Para Hoteles:**
- Amenidades (AC, calefacción, piscina, cámaras)
- Áreas de juego interiores/exteriores
- Supervisión 24/7
- Alojamiento individual vs grupal

**Para Veterinarios:**
- Servicios disponibles (vacunas, cirugía, dental)
- Servicio de emergencia
- Especializaciones
- Equipamiento e instalaciones

### 19.4 Tablas de Base de Datos
```sql
provider_services
- id, pet_master_id, service_type
- service_name, description
- price, duration_minutes
- is_active

hotel_amenities
- pet_master_id, has_ac, has_heating
- has_pool, has_cameras, etc.

vet_services
- pet_master_id, has_consultations
- has_vaccinations, has_surgery, etc.
```

---

## 20. Sistema de Cancelación Inteligente (NUEVO)

### 20.1 Política de Reembolsos
- **Más de 24 horas:** 100% de reembolso
- **6-24 horas antes:** 50% de reembolso
- **Menos de 6 horas:** Sin reembolso

### 20.2 Características
- Cálculo automático de reembolso
- Tracking de razón de cancelación
- Compensación del proveedor
- Actualización de estado de reserva
- Notificación a ambas partes

### 20.3 Tabla de Base de Datos
```sql
cancellations
- id, booking_id, cancelled_by
- cancellation_reason
- refund_amount, refund_percentage
- cancelled_at
```

---

## 21. Dashboard Administrativo (NUEVO)

### 21.1 Gestión de Plataforma
- Ver todos los usuarios y reservas
- Verificar identidades de proveedores
- Monitorear estadísticas de plataforma
- Gestionar contenido y disputas
- Configuración del sistema

### 21.2 Métricas Clave
- Total de usuarios (dueños/proveedores)
- Total de reservas (por estado)
- Tracking de ingresos
- Tendencias de crecimiento de usuarios
- Utilización de servicios

### 21.3 Roles de Admin
- Campo `is_admin` en tabla profiles
- Acceso protegido por RLS
- Logs de acciones administrativas

---

## 22. Almacenamiento de Fotos (NUEVO)

### 22.1 Buckets de Storage
- `pet-photos` - Fotos de mascotas
- `service-photos` - Fotos de servicios de proveedores
- `walk-photos` - Fotos tomadas durante paseos
- `verification-documents` - Documentos de identidad
- `chat-attachments` - Archivos compartidos en chat

### 22.2 Características
- Subida directa desde cliente
- URLs seguras con tokens
- Políticas RLS en buckets
- Compresión automática
- Gestión de tamaño y formato

### 22.3 Tablas Relacionadas
```sql
service_photos
- id, pet_master_id, photo_url
- caption, display_order, photo_type

walk_photos
- id, booking_id, photo_url
- taken_at, uploaded_by
```

---

## 23. Progressive Web App (PWA) (NUEVO)

### 23.1 Características PWA
- Service Worker para caché offline
- Instalable en dispositivos móviles
- Experiencia similar a app nativa
- Carga rápida con caché
- Actualización automática

### 23.2 Implementación
- `public/sw.js` - Service worker
- Manifest para instalación
- Estrategias de caché
- Sincronización en background

---

## 24. Características Técnicas Actualizadas

### 24.1 Stack Tecnológico
- **Frontend:** React 18 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **Mapas:** React Leaflet + Leaflet
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Storage:** Supabase Storage
- **Realtime:** Supabase Realtime
- **Edge Functions:** Supabase Functions
- **Hosting:** Netlify/Vercel ready

### 24.2 Base de Datos
- **PostgreSQL** con extensiones de Supabase
- **30+ tablas** interrelacionadas
- **14 migraciones** aplicadas exitosamente
- **RLS habilitado** en todas las tablas
- **Índices optimizados** para consultas frecuentes

### 24.3 Internacionalización
- **5 idiomas completos:** EN, ES, PT, FR, ZH
- **282 claves** de traducción por idioma
- **Preferencia persistente** en base de datos
- **Cambio en tiempo real**

---

## 25. Estado del Proyecto Actualizado

### ✅ Completado
- Base de datos completa con 30+ tablas
- Sistema de autenticación y autorización
- Sistema de perfiles y verificación de identidad
- Gestión de mascotas con fotos
- Siete tipos de servicios para proveedores
- Multi-servicios por proveedor
- Sistema de reservas completo
- **Reservas recurrentes (diarias/semanales/mensuales)**
- Sistema de pagos robusto (Stripe + Wallets)
- Sistema de calificaciones detallado con atributos
- Sistema de suscripciones
- **Chat en tiempo real con compartir fotos**
- **Sistema de notificaciones push**
- **Verificación de identidad con aprobación admin**
- **Sistema de cancelación inteligente**
- **Dashboard administrativo**
- **Almacenamiento de fotos en múltiples buckets**
- **Soporte PWA con service worker**
- Row Level Security en todas las tablas
- Optimizaciones de rendimiento
- Internacionalización completa (5 idiomas)
- Aplicación React lista para producción

### 🚀 Listo para Producción
- Configuración completa de frontend
- Base de datos lista y optimizada
- Autenticación y autorización configuradas
- Build de producción funcional y optimizado
- Edge Functions deployadas
- Storage configurado con políticas
- Realtime subscriptions activas

---

## Conclusión

DoggyWalk es una plataforma robusta y completa para servicios de mascotas, con una arquitectura sólida, seguridad implementada correctamente, y preparada para escalar. La versión 2.0 incluye funcionalidades avanzadas como:

- Sistema completo de reservas recurrentes
- Chat en tiempo real con compartir multimedia
- Notificaciones push para mantener usuarios informados
- Verificación de identidad para confianza y seguridad
- Multi-servicios permitiendo proveedores versátiles
- Dashboard administrativo para gestión de plataforma
- PWA support para experiencia móvil mejorada
- Sistema de cancelación inteligente con reembolsos automáticos

La plataforma está lista para despliegue en producción y ofrece una experiencia completa tanto para dueños de mascotas como para proveedores de servicios.
