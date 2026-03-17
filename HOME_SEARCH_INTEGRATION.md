# Integración de Búsqueda desde Página de Inicio

**Fecha:** 2026-03-17
**Estado:** ✅ Implementado

## Resumen de Cambios

La página de inicio ahora pasa correctamente los parámetros de búsqueda a la página de Búsqueda de Servicios, permitiendo que el usuario inicie una búsqueda directamente desde el home con su ubicación actual o una dirección específica.

---

## Problema Anterior

**Comportamiento:** La página de inicio enviaba parámetros a la URL pero la página de búsqueda no los procesaba. El usuario llegaba a la página de búsqueda pero tenía que volver a ingresar la dirección manualmente.

**Experiencia del usuario:**
```
Usuario en Home → Ingresa dirección → Click "Buscar"
  ↓
Página de Búsqueda (sin procesar la dirección)
  ↓
Usuario debe volver a buscar ❌
```

---

## Solución Implementada

### 1. Página de Inicio (Home.tsx)

**Sin cambios** - Ya estaba correctamente enviando los parámetros:

```typescript
const handleSearch = () => {
  const params = new URLSearchParams();
  params.append('service', serviceType);
  if (useCurrentLocation) {
    params.append('useLocation', 'true');
  } else if (address) {
    params.append('address', address);
  }
  navigate(`/search?${params.toString()}`);
};
```

**Ejemplos de URLs generadas:**
- Con ubicación actual: `/search?service=walker&useLocation=true`
- Con dirección: `/search?service=hotel&address=Las%20Parras%201001%2C%20San%20Esteban`

---

### 2. Página de Búsqueda (SearchServices.tsx)

**Cambios realizados:**

#### A) Import de `useSearchParams`

```typescript
import { useSearchParams } from 'react-router-dom';
```

#### B) Hook para leer parámetros

```typescript
const [searchParams] = useSearchParams();
```

#### C) Ref para evitar procesamiento múltiple

```typescript
const hasProcessedParams = useRef(false);
```

#### D) Inicialización básica (useEffect #1)

```typescript
useEffect(() => {
  isMountedRef.current = true;
  const defaultLocation = { lat: -36.7225, lng: -73.1136 };
  setUserLocation(defaultLocation);
  setInitialUserLocation(defaultLocation);

  return () => {
    isMountedRef.current = false;
  };
}, []);
```

**Propósito:** Establecer ubicación predeterminada de forma síncrona.

#### E) Procesamiento de parámetros URL (useEffect #2)

```typescript
useEffect(() => {
  if (!userLocation || hasProcessedParams.current) return;

  const processUrlParams = async () => {
    const useLocation = searchParams.get('useLocation');
    const address = searchParams.get('address');
    const service = searchParams.get('service');

    // Establecer tipo de servicio
    if (service && service !== 'all') {
      setServiceType(service as any);
    }

    // Caso 1: Usar ubicación actual del dispositivo
    if (useLocation === 'true') {
      hasProcessedParams.current = true;
      await getUserLocation();
    }
    // Caso 2: Buscar por dirección específica
    else if (address) {
      hasProcessedParams.current = true;
      setSearchTerm(address);
      setTimeout(() => {
        handleUnifiedSearch(address);
      }, 500);
    }
    // Caso 3: Sin parámetros (navegación directa)
    else {
      hasProcessedParams.current = true;
    }
  };

  processUrlParams();
}, [userLocation, searchParams]);
```

**Propósito:** Procesar parámetros de URL y ejecutar búsqueda automática.

**Dependencias:**
- `userLocation`: Espera que la ubicación predeterminada esté establecida
- `searchParams`: Detecta cambios en los parámetros de URL

**Guardián:** `hasProcessedParams.current` evita procesamiento múltiple.

---

## Flujo de Ejecución

### Caso 1: Usuario usa "Mi Ubicación"

```
Home Page
  ↓
Usuario marca checkbox "Usar mi ubicación actual"
Usuario selecciona tipo de servicio: "Paseo"
Usuario click "Buscar"
  ↓
navigate('/search?service=walker&useLocation=true')
  ↓
SearchServices Page
  ↓
useEffect #1: Establece ubicación predeterminada
  ↓
useEffect #2: Detecta useLocation=true
  ↓
getUserLocation() → Solicita geolocalización del navegador
  ↓
Si tiene éxito:
  - setUserLocation(coordenadas reales)
  - setInitialUserLocation(coordenadas reales)
  - Mapa se centra en ubicación real
  - Muestra proveedores cercanos
  ↓
Si falla:
  - setUserLocation(Talcahuano)
  - Muestra error pero continúa con ubicación predeterminada
```

### Caso 2: Usuario ingresa dirección

```
Home Page
  ↓
Usuario ingresa: "Las Parras 1001, San Esteban"
Usuario selecciona tipo de servicio: "Hotel"
Usuario click "Buscar"
  ↓
navigate('/search?service=hotel&address=Las%20Parras%201001%2C%20San%20Esteban')
  ↓
SearchServices Page
  ↓
useEffect #1: Establece ubicación predeterminada (Talcahuano)
  ↓
useEffect #2: Detecta address="Las Parras 1001, San Esteban"
  ↓
setSearchTerm("Las Parras 1001, San Esteban")
  ↓
setTimeout 500ms (espera a que componente esté listo)
  ↓
handleUnifiedSearch("Las Parras 1001, San Esteban")
  ↓
Geocoding API (Nominatim)
  ↓
Encuentra coordenadas: -32.80432, -70.58891
  ↓
setSearchResultLocation({ lat: -32.80432, lng: -70.58891 })
  ↓
useMemo actualiza:
  - filteredProviders (recalcula distancias desde San Esteban)
  - providersToShow (filtra ≤50km, determina banner)
  ↓
UI actualiza:
  - Mapa se centra en San Esteban
  - Muestra proveedores cercanos a San Esteban
  - Banner naranja (492.9 km de Talcahuano)
```

### Caso 3: Usuario navega directamente a /search

```
Usuario escribe URL: /search
  ↓
SearchServices Page
  ↓
useEffect #1: Establece ubicación predeterminada (Talcahuano)
  ↓
useEffect #2: No hay parámetros
  ↓
hasProcessedParams.current = true
  ↓
Continúa con comportamiento normal:
  - Mapa centrado en Talcahuano
  - Muestra proveedores cercanos
  - Sin búsqueda activa
```

---

## Detalles Técnicos

### Sincronización de Estados

```typescript
// Estado inicial
userLocation: null
initialUserLocation: null
searchResultLocation: null
hasProcessedParams: false

// Después de useEffect #1
userLocation: Talcahuano
initialUserLocation: Talcahuano
searchResultLocation: null
hasProcessedParams: false

// Después de useEffect #2 (con address)
userLocation: Talcahuano
initialUserLocation: Talcahuano
searchResultLocation: null (aún)
searchTerm: "Las Parras 1001, San Esteban"
hasProcessedParams: true

// Después de handleUnifiedSearch
userLocation: Talcahuano
initialUserLocation: Talcahuano
searchResultLocation: San Esteban
searchTerm: "Las Parras 1001, San Esteban"
hasProcessedParams: true
```

### Timeout de 500ms

**Razón:** Dar tiempo al componente para:
1. Renderizar completamente
2. Establecer todos los estados iniciales
3. Preparar referencias y contextos

Sin el timeout, la función `handleUnifiedSearch` podría ejecutarse antes de que el componente esté completamente montado.

### Ref vs State

**hasProcessedParams usa `useRef` en lugar de `useState`:**

**Ventaja:**
- No causa re-renders
- Persiste entre renders
- Lectura/escritura síncrona
- Perfecto para flags de control

**Si usara useState:**
```typescript
const [hasProcessedParams, setHasProcessedParams] = useState(false);

// ❌ Problema: setState es asíncrono
setHasProcessedParams(true);
if (hasProcessedParams) { ... } // Aún es false!

// ✅ Con useRef: Actualización inmediata
hasProcessedParams.current = true;
if (hasProcessedParams.current) { ... } // Es true!
```

---

## Validación y Testing

### Checklist de Funcionalidad

- [x] Home → Buscar con "Mi ubicación" → Solicita geolocalización
- [x] Home → Buscar con dirección → Ejecuta búsqueda automática
- [x] Home → Filtro de servicio → Se aplica correctamente
- [x] Navegación directa a /search → Funciona sin parámetros
- [x] No hay procesamiento múltiple de parámetros
- [x] Timeout evita errores de montaje
- [x] Compilación sin errores ✅

### Escenarios de Prueba

#### Prueba 1: Búsqueda con dirección desde home

```
1. Ir a página de inicio
2. Seleccionar "Hotel" como tipo de servicio
3. Ingresar "Las Parras 1001, San Esteban"
4. Click "Buscar"

Resultado esperado:
✅ Navega a página de búsqueda
✅ Filtro "Hotel" está activo
✅ Campo de búsqueda muestra "Las Parras 1001, San Esteban"
✅ Mapa centrado en San Esteban
✅ Banner naranja mostrando distancia de ~492.9 km
✅ Muestra proveedores de tipo "hotel" cerca de San Esteban
```

#### Prueba 2: Búsqueda con ubicación actual desde home

```
1. Ir a página de inicio
2. Seleccionar "Paseo" como tipo de servicio
3. Marcar checkbox "Usar mi ubicación actual"
4. Click "Buscar"

Resultado esperado:
✅ Navega a página de búsqueda
✅ Solicita permiso de geolocalización
✅ Si se acepta: Mapa se centra en ubicación real
✅ Si se rechaza: Mapa se centra en Talcahuano (fallback)
✅ Filtro "Paseo" está activo
✅ Muestra proveedores de paseo cercanos
```

#### Prueba 3: Navegación directa

```
1. Escribir URL: localhost:5173/search
2. Presionar Enter

Resultado esperado:
✅ Página carga correctamente
✅ Ubicación predeterminada: Talcahuano
✅ Sin búsqueda activa
✅ Campo de búsqueda vacío
✅ Filtro "Todos" activo
✅ Muestra todos los proveedores cercanos a Talcahuano
```

---

## Arquitectura de Componentes

```
Home.tsx
  │
  ├─ useState: serviceType, address, useCurrentLocation
  ├─ handleSearch() → Construye URL con parámetros
  └─ navigate('/search?...params')
        │
        ↓
SearchServices.tsx
  │
  ├─ useSearchParams() → Lee parámetros de URL
  │
  ├─ useEffect #1 (sin dependencias)
  │   └─ Inicializa ubicación predeterminada
  │
  ├─ useEffect #2 ([userLocation, searchParams])
  │   ├─ Espera a userLocation
  │   ├─ Lee parámetros (service, address, useLocation)
  │   ├─ Establece serviceType
  │   └─ Ejecuta búsqueda según tipo:
  │       ├─ useLocation=true → getUserLocation()
  │       └─ address → handleUnifiedSearch(address)
  │
  ├─ getUserLocation() → Geolocalización del navegador
  │
  ├─ handleUnifiedSearch(query) → Geocoding + Búsqueda
  │   ├─ Nominatim API
  │   ├─ setSearchResultLocation()
  │   └─ Actualiza UI
  │
  ├─ useMemo: filteredProviders
  │   └─ Recalcula distancias
  │
  └─ useMemo: providersToShow
      └─ Filtra ≤50km + determina banner
```

---

## Mejoras Futuras (Opcional)

### 1. Loading State durante búsqueda automática

```typescript
const [isAutoSearching, setIsAutoSearching] = useState(false);

// En processUrlParams
if (address) {
  setIsAutoSearching(true);
  setSearchTerm(address);
  setTimeout(async () => {
    await handleUnifiedSearch(address);
    setIsAutoSearching(false);
  }, 500);
}

// En UI
{isAutoSearching && <div>Buscando ubicación...</div>}
```

### 2. Validación de dirección antes de navegar

```typescript
// En Home.tsx
const validateAddress = async (address: string) => {
  const response = await fetch(`...nominatim...${address}`);
  const data = await response.json();
  return data.length > 0;
};

const handleSearch = async () => {
  if (address && !useCurrentLocation) {
    const isValid = await validateAddress(address);
    if (!isValid) {
      alert('Dirección no encontrada');
      return;
    }
  }
  navigate(...);
};
```

### 3. Historial de búsquedas

```typescript
// Guardar en localStorage
const saveSearchHistory = (address: string) => {
  const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
  history.unshift(address);
  localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 5)));
};

// Mostrar autocompletado
const [searchHistory, setSearchHistory] = useState<string[]>([]);
```

---

## Resumen Final

### Antes

```
Home → [Dirección] → [Buscar]
  ↓
Search (vacío, sin acción)
  ↓
Usuario debe buscar de nuevo ❌
```

### Después

```
Home → [Dirección] → [Buscar]
  ↓
Search (procesa parámetros)
  ↓
Búsqueda automática ✅
  ↓
Resultados mostrados inmediatamente ✅
```

### Comportamiento Garantizado

1. ✅ **Con dirección:** Ejecuta búsqueda automática mediante geocoding
2. ✅ **Con ubicación actual:** Solicita geolocalización del dispositivo
3. ✅ **Con filtro de servicio:** Se aplica correctamente
4. ✅ **Sin parámetros:** Funciona con comportamiento predeterminado
5. ✅ **No hay ubicación hardcodeada:** Usa Talcahuano solo como fallback
6. ✅ **No hay procesamiento múltiple:** Ref evita ejecuciones duplicadas

---

**Documento creado por:** Claude Agent
**Última actualización:** 2026-03-17
**Estado:** ✅ Completamente implementado y validado
