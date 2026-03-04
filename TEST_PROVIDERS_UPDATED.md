# Proveedores de Prueba Actualizados - Sistema de Medallas

Se han configurado 4 proveedores de prueba con múltiples servicios para demostrar el sistema de medallas de colores.

## Sistema de Colores por Servicio

- **Paseo (walker)**: Verde (#10B981) 🐾
- **Guardería (daycare)**: Amarillo mostaza (#F59E0B) 🏃
- **Hospedaje (hotel)**: Azul petróleo (#0891B2) 🏨
- **Peluquería (grooming)**: Coral suave (#FF8B7F) ✂️
- **Veterinaria (vet)**: Turquesa clínico (#06B6D4) 🩺

## Proveedores Disponibles

### 1. 🏨 PetParadise Hotel (Multi-servicio)
**Email:** `hotel@petparadise.cl`
**Contraseña:** `demo123`

**Servicio Principal:** Hotel
**Servicios Adicionales:**
- 🏨 Hospedaje (azul petróleo)
- ✂️ Peluquería (coral suave)
- 🏃 Guardería (amarillo mostaza)

**Total de servicios:** 3
**Ubicación:** -36.7235, -73.1145 (Talcahuano)

En el mapa y tarjetas verás:
- Marcador principal con color azul petróleo (hotel)
- Medallas con huellitas en coral (peluquería) y amarillo (guardería)
- 3 badges de colores mostrando todos los servicios

---

### 2. 🩺 Clínica Veterinaria Talcahuano (Multi-servicio)
**Email:** `vet@clinicatalcahuano.cl`
**Contraseña:** `demo123`

**Servicio Principal:** Veterinaria
**Servicios Adicionales:**
- 🩺 Veterinaria (turquesa clínico)
- ✂️ Peluquería (coral suave)

**Total de servicios:** 2
**Ubicación:** -36.7215, -73.1125 (Talcahuano)

En el mapa y tarjetas verás:
- Marcador principal con color turquesa (veterinaria)
- Medalla con huellita en coral (peluquería)
- 2 badges de colores

---

### 3. 🚶 Carlos Muñoz - Paseador (Multi-servicio)
**Email:** `carlos@dogwalker.cl`
**Contraseña:** `demo123`

**Servicio Principal:** Paseador
**Servicios Adicionales:**
- 🐾 Paseo (verde)
- 🏃 Guardería (amarillo mostaza)

**Total de servicios:** 2
**Ubicación:** -36.7230, -73.1130 (Talcahuano)

En el mapa y tarjetas verás:
- Marcador principal con color verde (paseo)
- Medalla con huellita en amarillo (guardería)
- 2 badges de colores

---

### 4. ✂️ Test Provider - Peluquería (Multi-servicio)
**Email:** `provider@test.com`
**Contraseña:** (usar contraseña de prueba)

**Servicio Principal:** Peluquería
**Servicios Adicionales:**
- ✂️ Peluquería (coral suave)
- 🐾 Paseo (verde)

**Total de servicios:** 2
**Ubicación:** (Verificar en base de datos)

En el mapa y tarjetas verás:
- Marcador principal con color coral (peluquería)
- Medalla con huellita en verde (paseo)
- 2 badges de colores

---

## Características del Sistema de Medallas

### En las Tarjetas de Proveedores:
1. **Imagen de portada**: Muestra medallas pequeñas (huellitas) en la esquina superior izquierda con los colores de servicios adicionales
2. **Debajo del nombre**: Muestra badges completos con emoji, nombre y color de cada servicio
3. **Colores distintivos**: Cada servicio tiene su propio esquema de color (fondo claro, borde y texto oscuro)

### En el Mapa:
1. **Marcador principal**: Usa el color del servicio principal del proveedor
2. **Medallas flotantes**: Huellitas con borde de color en la esquina superior derecha del marcador
3. **Popup**: Muestra todos los servicios con badges de colores

### En los Filtros:
- Ahora incluye filtro de "Peluquería" (Grooming) con el color coral correspondiente
- Todos los filtros usan los colores del sistema unificado

## Cómo Probar

1. **Inicia sesión** como owner (o crea una cuenta)
2. **Ve a "Buscar Servicios"**
3. **Ubícate en Talcahuano** o cerca del Casino Marina del Sol
4. **Observa en el mapa**:
   - PetParadise Hotel tendrá 2 medallas adicionales (peluquería y guardería)
   - Veterinaria tendrá 1 medalla adicional (peluquería)
   - Carlos Walker tendrá 1 medalla adicional (guardería)
   - Test Provider tendrá 1 medalla adicional (paseo)

5. **Haz clic en las tarjetas** para ver el sistema de badges completo debajo del nombre

6. **Filtra por servicio** usando los botones de filtro y observa cómo los proveedores multi-servicio aparecen en múltiples categorías

## Credenciales de Acceso

| Proveedor | Email | Contraseña | Servicios |
|-----------|-------|------------|-----------|
| PetParadise Hotel | hotel@petparadise.cl | demo123 | Hotel + Peluquería + Guardería |
| Veterinaria Talcahuano | vet@clinicatalcahuano.cl | demo123 | Veterinaria + Peluquería |
| Carlos Muñoz | carlos@dogwalker.cl | demo123 | Paseo + Guardería |
| Test Provider | provider@test.com | (verificar) | Peluquería + Paseo |

## Datos Técnicos

### Tabla `provider_services`
Almacena la relación entre proveedores y los servicios que ofrecen:
```sql
SELECT
  p.full_name,
  pm.service_type as main_service,
  ps.service_type as additional_service
FROM pet_masters pm
JOIN profiles p ON p.id = pm.id
JOIN provider_services ps ON ps.provider_id = pm.id
WHERE pm.verified = true;
```

### Colores Definidos en `src/utils/serviceColors.ts`
```typescript
walker: verde #10B981
daycare: amarillo mostaza #F59E0B
hotel: azul petróleo #0891B2
grooming: coral suave #FF8B7F
vet: turquesa clínico #06B6D4
```

---

**Fecha de actualización:** 2026-03-04
**Estado:** ✅ Sistema de medallas implementado y funcionando
**Ubicación:** Talcahuano, Chile
