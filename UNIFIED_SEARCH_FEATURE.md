# Búsqueda Unificada - Actualización v2

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

### 3. Búsqueda Inteligente por Ubicación

#### Por Defecto (Ubicación Actual del Cliente)
- Banner verde con icono 📍
- Mensaje: "X proveedores encontrados dentro de un radio de 50 km de tu ubicación"
- Muestra SOLO proveedores dentro de 50 km de la ubicación actual del cliente
- Ordenados por distancia desde la ubicación actual

#### Al Buscar en Otra Ubicación (> 50 km de distancia)
- Banner naranja con icono 🚗
- Mensaje: "Esta ubicación está a X km de tu ubicación actual"
- Badge: "Lejos de tu ubicación"
- Muestra SOLO proveedores dentro de 50 km de la NUEVA ubicación buscada
- Ordenados por distancia desde la ubicación de búsqueda
- Alerta al cliente que está viendo resultados lejos de su ubicación habitual

### 4. Lógica de Filtrado
- **Siempre** muestra proveedores dentro de 50 km del punto de referencia (actual o buscado)
- **Nunca** muestra todos los proveedores sin filtrar por distancia
- Evita confusión sobre disponibilidad real de servicios

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
