/*
  # Catálogo Detallado de Servicios

  ## Descripción
  Sistema completo de catálogo de servicios que permite a los proveedores seleccionar
  y personalizar servicios específicos con duraciones y precios. Complementa la tabla
  provider_services existente con información más detallada.

  ## Nuevas Tablas

  ### `service_catalog`
  Catálogo de servicios predefinidos sugeridos para cada categoría
  - `id` (uuid, primary key)
  - `name` (text) - Nombre del servicio
  - `category` (text) - walker, hotel, vet
  - `subcategory` (text) - Subcategoría específica
  - `description` (text) - Descripción del servicio
  - `suggested_duration_minutes` (integer) - Duración sugerida
  - `suggested_price_clp` (numeric) - Precio sugerido en pesos chilenos
  - `is_active` (boolean) - Si está activo en el catálogo
  - `created_at` (timestamptz)

  ### `provider_service_offerings`
  Servicios específicos que cada proveedor ofrece
  - `id` (uuid, primary key)
  - `provider_id` (uuid) - Referencia a pet_masters
  - `service_catalog_id` (uuid, nullable) - Referencia al catálogo (null si es personalizado)
  - `custom_name` (text, nullable) - Nombre personalizado
  - `description` (text) - Descripción
  - `duration_minutes` (integer) - Duración en minutos
  - `price_clp` (numeric) - Precio en CLP
  - `is_active` (boolean) - Si está activo
  - `max_capacity` (integer) - Capacidad máxima
  - `requires_approval` (boolean) - Si requiere aprobación
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Seguridad
  - RLS habilitado
  - Lectura pública de servicios activos
  - Solo proveedores pueden gestionar sus propios servicios
*/

-- Tabla de catálogo de servicios
CREATE TABLE IF NOT EXISTS service_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('walker', 'hotel', 'vet')),
  subcategory text DEFAULT '',
  description text DEFAULT '',
  suggested_duration_minutes integer DEFAULT 60,
  suggested_price_clp numeric(10,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabla de ofertas de servicios por proveedor
CREATE TABLE IF NOT EXISTS provider_service_offerings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES pet_masters(id) ON DELETE CASCADE,
  service_catalog_id uuid REFERENCES service_catalog(id) ON DELETE SET NULL,
  custom_name text,
  description text DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 60,
  price_clp numeric(10,2) NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  max_capacity integer DEFAULT 1,
  requires_approval boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON service_catalog(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_offerings_provider ON provider_service_offerings(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_offerings_active ON provider_service_offerings(is_active);
CREATE INDEX IF NOT EXISTS idx_provider_offerings_catalog ON provider_service_offerings(service_catalog_id);

-- Habilitar RLS
ALTER TABLE service_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_service_offerings ENABLE ROW LEVEL SECURITY;

-- Políticas para service_catalog
CREATE POLICY "Anyone can read active catalog services"
  ON service_catalog
  FOR SELECT
  TO public
  USING (is_active = true);

-- Políticas para provider_service_offerings
CREATE POLICY "Anyone can read active provider offerings"
  ON provider_service_offerings
  FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Providers can read their offerings"
  ON provider_service_offerings
  FOR SELECT
  TO authenticated
  USING (provider_id = auth.uid());

CREATE POLICY "Providers can create their offerings"
  ON provider_service_offerings
  FOR INSERT
  TO authenticated
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update their offerings"
  ON provider_service_offerings
  FOR UPDATE
  TO authenticated
  USING (provider_id = auth.uid())
  WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can delete their offerings"
  ON provider_service_offerings
  FOR DELETE
  TO authenticated
  USING (provider_id = auth.uid());

-- Servicios para PASEADORES
INSERT INTO service_catalog (name, category, subcategory, description, suggested_duration_minutes, suggested_price_clp) VALUES
  ('Paseo Corto', 'walker', 'Paseos', 'Paseo de 30 minutos por el vecindario', 30, 5000),
  ('Paseo Estándar', 'walker', 'Paseos', 'Paseo de 45 minutos', 45, 7000),
  ('Paseo Largo', 'walker', 'Paseos', 'Paseo de 60 minutos con ejercicio', 60, 10000),
  ('Paseo Premium', 'walker', 'Paseos', 'Paseo de 90 minutos en parques', 90, 15000),
  ('Guardería Día Completo', 'walker', 'Guardería', 'Cuidado diurno de 8 horas', 480, 20000),
  ('Guardería Media Jornada', 'walker', 'Guardería', 'Cuidado de 4 horas', 240, 12000),
  ('Guardería por Hora', 'walker', 'Guardería', 'Cuidado por hora', 60, 3500),
  ('Hospedaje por Noche', 'walker', 'Hospedaje', 'Alojamiento nocturno en casa del cuidador', 1440, 25000),
  ('Hospedaje Fin de Semana', 'walker', 'Hospedaje', 'Viernes a domingo (2 noches)', 2880, 45000),
  ('Visita a Domicilio', 'walker', 'Visitas', 'Visita de 30 min para alimentar y cuidar', 30, 8000),
  ('Visita Extendida', 'walker', 'Visitas', 'Visita de 60 min con paseo incluido', 60, 12000)
ON CONFLICT DO NOTHING;

-- Servicios para HOTELES
INSERT INTO service_catalog (name, category, subcategory, description, suggested_duration_minutes, suggested_price_clp) VALUES
  ('Hospedaje Standard', 'hotel', 'Alojamiento', 'Habitación compartida supervisada por noche', 1440, 30000),
  ('Hospedaje Premium', 'hotel', 'Alojamiento', 'Habitación individual con extras por noche', 1440, 45000),
  ('Hospedaje VIP', 'hotel', 'Alojamiento', 'Suite privada con atención personalizada por noche', 1440, 60000),
  ('Hospedaje Semanal Standard', 'hotel', 'Alojamiento', 'Una semana completa en habitación compartida', 10080, 180000),
  ('Hospedaje Semanal Premium', 'hotel', 'Alojamiento', 'Una semana completa en habitación individual', 10080, 280000),
  ('Guardería Día Completo', 'hotel', 'Guardería', 'Cuidado diurno con juegos (8 horas)', 480, 25000),
  ('Guardería Media Jornada', 'hotel', 'Guardería', 'Cuidado de 4 horas', 240, 15000),
  ('Baño Básico', 'hotel', 'Estética', 'Baño, secado y cepillado', 60, 15000),
  ('Baño Premium', 'hotel', 'Estética', 'Baño, secado, cepillado y corte', 90, 25000),
  ('Spa Completo', 'hotel', 'Estética', 'Tratamiento completo de spa', 120, 35000),
  ('Corte de Uñas', 'hotel', 'Estética', 'Corte de uñas profesional', 20, 5000),
  ('Limpieza de Oídos', 'hotel', 'Estética', 'Limpieza profesional de oídos', 20, 5000),
  ('Entrenamiento Básico', 'hotel', 'Entrenamiento', 'Sesión de obediencia básica (individual)', 60, 20000),
  ('Entrenamiento Avanzado', 'hotel', 'Entrenamiento', 'Sesión de entrenamiento avanzado', 90, 30000),
  ('Socialización', 'hotel', 'Entrenamiento', 'Sesión de socialización con otros perros', 60, 15000),
  ('Sesión de Juegos', 'hotel', 'Recreación', 'Hora de juegos supervisados', 60, 8000)
ON CONFLICT DO NOTHING;

-- Servicios para VETERINARIAS
INSERT INTO service_catalog (name, category, subcategory, description, suggested_duration_minutes, suggested_price_clp) VALUES
  ('Consulta General', 'vet', 'Consultas', 'Consulta médica general', 30, 20000),
  ('Consulta de Urgencia', 'vet', 'Consultas', 'Atención de emergencia', 45, 35000),
  ('Consulta Especializada', 'vet', 'Consultas', 'Consulta con especialista', 45, 40000),
  ('Control de Salud', 'vet', 'Consultas', 'Examen físico completo', 30, 18000),
  ('Vacuna Óctuple', 'vet', 'Vacunación', 'Vacuna múltiple canina', 20, 15000),
  ('Vacuna Triple Felina', 'vet', 'Vacunación', 'Vacuna múltiple felina', 20, 15000),
  ('Vacuna Antirrábica', 'vet', 'Vacunación', 'Vacuna contra la rabia', 15, 12000),
  ('Desparasitación Interna', 'vet', 'Prevención', 'Tratamiento antiparasitario interno', 15, 8000),
  ('Desparasitación Externa', 'vet', 'Prevención', 'Tratamiento contra pulgas y garrapatas', 15, 10000),
  ('Desparasitación Completa', 'vet', 'Prevención', 'Interna y externa', 20, 15000),
  ('Cirugía Menor', 'vet', 'Cirugía', 'Procedimientos quirúrgicos menores', 60, 80000),
  ('Cirugía Mayor', 'vet', 'Cirugía', 'Cirugías complejas', 180, 250000),
  ('Esterilización Hembra', 'vet', 'Cirugía', 'Esterilización de hembras', 120, 150000),
  ('Castración Macho', 'vet', 'Cirugía', 'Castración de machos', 90, 100000),
  ('Limpieza Dental', 'vet', 'Odontología', 'Profilaxis dental completa', 60, 50000),
  ('Extracción Dental', 'vet', 'Odontología', 'Extracción de pieza dental', 45, 35000),
  ('Hemograma Completo', 'vet', 'Laboratorio', 'Análisis de sangre completo', 30, 25000),
  ('Perfil Bioquímico', 'vet', 'Laboratorio', 'Análisis bioquímico de sangre', 30, 30000),
  ('Urianálisis', 'vet', 'Laboratorio', 'Análisis de orina', 30, 18000),
  ('Examen Coprológico', 'vet', 'Laboratorio', 'Análisis de heces', 30, 15000),
  ('Radiografía Simple', 'vet', 'Imagenología', 'Estudio radiográfico simple', 30, 35000),
  ('Radiografía de Contraste', 'vet', 'Imagenología', 'Radiografía con contraste', 45, 50000),
  ('Ecografía Abdominal', 'vet', 'Imagenología', 'Ultrasonido abdominal', 45, 55000),
  ('Ecocardiografía', 'vet', 'Imagenología', 'Ultrasonido cardíaco', 60, 70000),
  ('Hospitalización', 'vet', 'Hospitalización', 'Internación por día', 1440, 60000),
  ('Hospitalización UTI', 'vet', 'Hospitalización', 'Cuidados intensivos por día', 1440, 100000),
  ('Microchip', 'vet', 'Identificación', 'Implantación de microchip', 15, 25000),
  ('Certificado de Salud', 'vet', 'Certificados', 'Certificado médico de salud', 20, 15000),
  ('Eutanasia', 'vet', 'Otros', 'Eutanasia humanitaria', 30, 40000),
  ('Baño Medicado', 'vet', 'Dermatología', 'Baño con tratamiento dermatológico', 45, 20000),
  ('Curación de Heridas', 'vet', 'Tratamientos', 'Curación y vendaje', 30, 15000),
  ('Aplicación de Inyecciones', 'vet', 'Tratamientos', 'Administración de medicamentos', 15, 8000)
ON CONFLICT DO NOTHING;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_provider_offerings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_provider_offerings ON provider_service_offerings;

CREATE TRIGGER trigger_update_provider_offerings
  BEFORE UPDATE ON provider_service_offerings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_offerings_updated_at();
