/*
  # Agregar Servicio de Estética (Grooming)

  ## Descripción
  Añade un nuevo tipo de servicio "grooming" para estética de mascotas con subservicios
  específicos como lavado, corte de pelo, corte de uñas, limpieza de oídos, etc.

  ## Cambios

  1. Nuevo Tipo de Servicio
    - Añade "grooming" a los tipos de servicio existentes

  2. Tabla grooming_services
    - Servicios específicos ofrecidos por peluquerías
    - has_bathing (lavado)
    - has_haircut (corte de pelo)
    - has_nail_trimming (corte de uñas)
    - has_ear_cleaning (limpieza de oídos)
    - has_teeth_cleaning (limpieza dental)
    - has_styling (peinados y estilismo)
    - has_spa_treatments (tratamientos spa)

  3. Catálogo de Servicios
    - Añade servicios de grooming al catálogo predefinido

  ## Seguridad
  - RLS habilitado en grooming_services
  - Lectura pública de servicios activos
  - Proveedores pueden gestionar sus propios servicios
*/

-- Actualizar constraint de category en service_catalog para incluir grooming PRIMERO
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'service_catalog_category_check'
  ) THEN
    ALTER TABLE service_catalog DROP CONSTRAINT service_catalog_category_check;
  END IF;
END $$;

ALTER TABLE service_catalog ADD CONSTRAINT service_catalog_category_check 
  CHECK (category IN ('walker', 'hotel', 'vet', 'grooming'));

-- Actualizar provider_services para incluir grooming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'provider_services_service_type_check'
    AND table_name = 'provider_services'
  ) THEN
    ALTER TABLE provider_services DROP CONSTRAINT provider_services_service_type_check;
  END IF;
END $$;

ALTER TABLE provider_services ADD CONSTRAINT provider_services_service_type_check
  CHECK (service_type IN ('walker', 'hotel', 'vet', 'grooming', 'sitter', 'trainer', 'daycare'));

-- Crear tabla de servicios de grooming
CREATE TABLE IF NOT EXISTS grooming_services (
  pet_master_id uuid PRIMARY KEY REFERENCES pet_masters(id) ON DELETE CASCADE,
  has_bathing boolean DEFAULT false,
  has_haircut boolean DEFAULT false,
  has_nail_trimming boolean DEFAULT false,
  has_ear_cleaning boolean DEFAULT false,
  has_teeth_cleaning boolean DEFAULT false,
  has_styling boolean DEFAULT false,
  has_spa_treatments boolean DEFAULT false,
  has_flea_treatment boolean DEFAULT false,
  has_deshedding boolean DEFAULT false,
  accepts_small_dogs boolean DEFAULT true,
  accepts_medium_dogs boolean DEFAULT true,
  accepts_large_dogs boolean DEFAULT true,
  accepts_cats boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_grooming_services_pet_master ON grooming_services(pet_master_id);

-- Habilitar RLS
ALTER TABLE grooming_services ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Anyone can read grooming services"
  ON grooming_services
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Providers can insert their grooming services"
  ON grooming_services
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pet_masters
      WHERE pet_masters.id = grooming_services.pet_master_id
      AND pet_masters.id = auth.uid()
    )
  );

CREATE POLICY "Providers can update their grooming services"
  ON grooming_services
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pet_masters
      WHERE pet_masters.id = grooming_services.pet_master_id
      AND pet_masters.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pet_masters
      WHERE pet_masters.id = grooming_services.pet_master_id
      AND pet_masters.id = auth.uid()
    )
  );

CREATE POLICY "Providers can delete their grooming services"
  ON grooming_services
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pet_masters
      WHERE pet_masters.id = grooming_services.pet_master_id
      AND pet_masters.id = auth.uid()
    )
  );

-- Insertar servicios de grooming en el catálogo
INSERT INTO service_catalog (name, category, subcategory, description, suggested_duration_minutes, suggested_price_clp, is_active)
VALUES
  ('Baño Completo', 'grooming', 'bathing', 'Baño completo con champú premium y secado', 45, 15000, true),
  ('Baño y Corte', 'grooming', 'bathing_haircut', 'Baño completo más corte de pelo estilo a elección', 90, 25000, true),
  ('Corte de Pelo', 'grooming', 'haircut', 'Corte de pelo profesional según raza y preferencia', 60, 18000, true),
  ('Corte de Uñas', 'grooming', 'nail_trimming', 'Corte y limado de uñas', 20, 5000, true),
  ('Limpieza de Oídos', 'grooming', 'ear_cleaning', 'Limpieza profunda de oídos', 15, 4000, true),
  ('Limpieza Dental', 'grooming', 'teeth_cleaning', 'Cepillado dental y limpieza de sarro', 30, 8000, true),
  ('Peinado y Estilismo', 'grooming', 'styling', 'Peinados especiales y accesorios decorativos', 45, 12000, true),
  ('Tratamiento Spa', 'grooming', 'spa', 'Masajes relajantes y tratamientos hidratantes', 60, 20000, true),
  ('Tratamiento Antipulgas', 'grooming', 'flea_treatment', 'Baño medicado antipulgas y garrapatas', 45, 18000, true),
  ('Deslanado', 'grooming', 'deshedding', 'Tratamiento especializado para eliminar pelo muerto', 60, 22000, true),
  ('Grooming Express', 'grooming', 'express', 'Servicio rápido: baño, secado y cepillado básico', 30, 12000, true),
  ('Grooming Completo', 'grooming', 'complete', 'Servicio completo: baño, corte, uñas, oídos y más', 120, 35000, true)
ON CONFLICT DO NOTHING;