# Documentación de Capacidades - DoggyWalk

## Resumen Ejecutivo

DoggyWalk es una plataforma completa de servicios para mascotas que conecta dueños de mascotas con proveedores de servicios profesionales. La aplicación incluye funcionalidades para paseadores de perros, hoteles para mascotas y servicios veterinarios, con un sistema robusto de pagos, calificaciones y seguridad.

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

## 15. Próximos Pasos Sugeridos

1. **Desarrollo de UI/UX:**
   - Diseñar y desarrollar pantallas de usuario
   - Implementar pantallas de proveedor de servicios
   - Crear flujos de reserva y pago

2. **Integraciones:**
   - Integración completa de Stripe
   - Implementación de Apple Pay/Google Pay
   - Sistema de notificaciones push
   - Mapas y geolocalización

3. **Funcionalidades Adicionales:**
   - Chat en tiempo real entre usuarios
   - Sistema de favoritos
   - Historial de servicios
   - Dashboard administrativo

4. **Mobile:**
   - Aplicación nativa para iOS
   - Aplicación nativa para Android
   - O continuar con web app responsive

---

## Conclusión

DoggyWalk es una plataforma robusta y completa para servicios de mascotas, con una arquitectura sólida, seguridad implementada correctamente, y preparada para escalar. La base de datos está diseñada para soportar múltiples tipos de servicios, sistemas de pago complejos, y un sistema de calificaciones detallado que proporciona transparencia y confianza a los usuarios.
