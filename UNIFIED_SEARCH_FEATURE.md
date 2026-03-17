# Búsqueda Unificada - Actualización

## Cambios Implementados

### 1. Barra de Búsqueda Unificada
Se ha unificado la funcionalidad de búsqueda en una sola barra que permite:
- Buscar por nombre de proveedor
- Buscar por tipo de servicio
- Buscar por dirección o ciudad

### 2. Actualización Automática del Mapa
Cuando se realiza una búsqueda:
- El mapa se centra automáticamente en la ubicación encontrada
- Si es un proveedor, centra en su ubicación exacta
- Si es una dirección, centra en las coordenadas geocodificadas

### 3. Agrupación de Proveedores por Distancia
Los proveedores se muestran en dos grupos:

#### Grupo 1: Dentro del Rango (≤ 50 km)
- Banner verde con icono 📍
- Mensaje: "X proveedores encontrados dentro de un radio de 50 km"
- Muestra proveedores cercanos a la ubicación de referencia

#### Grupo 2: Fuera del Rango (> 50 km)
- Banner naranja con icono 🚗
- Mensaje: "Proveedores fuera de tu ubicación habitual"
- Indica claramente que estos proveedores están a más de 50 km
- Solo se muestra si hay proveedores en esta categoría

### 4. Funcionalidades Adicionales
- Botón "Limpiar" para resetear la búsqueda
- Botón "Mi ubicación" para usar la ubicación actual del dispositivo
- Mensajes de error claros cuando no se encuentran resultados
- Animación suave del mapa al cambiar de ubicación

## Ejemplo de Uso

1. **Buscar por nombre**: Escribe "Carlos" para encontrar al proveedor Carlos González
2. **Buscar por servicio**: Escribe "grooming" para encontrar servicios de peluquería
3. **Buscar por dirección**: Escribe "San Esteban" o "Las Parras" para centrar el mapa en esa ubicación
4. **Buscar por ciudad**: Escribe "Talcahuano" para ver proveedores en esa ciudad

## Mejoras en UX

- Las búsquedas son instantáneas y fluidas
- El mapa se actualiza automáticamente al encontrar resultados
- Los proveedores se ordenan por distancia desde la ubicación de búsqueda
- Separación visual clara entre proveedores cercanos y lejanos
- Información de distancia visible en cada grupo
