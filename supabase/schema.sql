-- HUELLITAS · Esquema PostgreSQL para Supabase
-- Ejecutar en Supabase > SQL Editor > New query > Run.
-- Se puede volver a ejecutar sin borrar datos existentes.

CREATE TABLE IF NOT EXISTS public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 60),
  species TEXT NOT NULL CHECK (species IN ('Perro', 'Gato', 'Ave', 'Conejo', 'Otro')),
  breed TEXT,
  birth_date DATE,
  sex TEXT NOT NULL DEFAULT 'No especificado' CHECK (sex IN ('Macho', 'Hembra', 'No especificado')),
  weight_kg NUMERIC(6,2) CHECK (weight_kg > 0 AND weight_kg <= 200),
  status TEXT NOT NULL DEFAULT 'Activo' CHECK (status IN ('Activo', 'En tratamiento', 'En adopción')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vaccines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 100),
  administered_on DATE NOT NULL,
  next_due_on DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pets_owner_id_idx ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS vaccines_pet_id_idx ON public.vaccines(pet_id);
CREATE INDEX IF NOT EXISTS vaccines_next_due_idx ON public.vaccines(next_due_on);

-- Actualización automática de fecha de modificación.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pets_touch_updated_at ON public.pets;
CREATE TRIGGER pets_touch_updated_at BEFORE UPDATE ON public.pets
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS vaccines_touch_updated_at ON public.vaccines;
CREATE TRIGGER vaccines_touch_updated_at BEFORE UPDATE ON public.vaccines
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seguridad por filas: cada usuario ve y modifica solo sus mascotas y vacunas.
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

-- Privilegios mínimos: ninguna operación directa para visitantes anónimos.
REVOKE ALL ON public.pets, public.vaccines FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pets, public.vaccines TO authenticated;

DROP POLICY IF EXISTS pets_read_own ON public.pets;
DROP POLICY IF EXISTS pets_create_own ON public.pets;
DROP POLICY IF EXISTS pets_edit_own ON public.pets;
DROP POLICY IF EXISTS pets_delete_own ON public.pets;
DROP POLICY IF EXISTS vaccines_read_own ON public.vaccines;
DROP POLICY IF EXISTS vaccines_create_own ON public.vaccines;
DROP POLICY IF EXISTS vaccines_edit_own ON public.vaccines;
DROP POLICY IF EXISTS vaccines_delete_own ON public.vaccines;

CREATE POLICY pets_read_own ON public.pets FOR SELECT TO authenticated
USING (owner_id = (SELECT auth.uid()));
CREATE POLICY pets_create_own ON public.pets FOR INSERT TO authenticated
WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY pets_edit_own ON public.pets FOR UPDATE TO authenticated
USING (owner_id = (SELECT auth.uid()))
WITH CHECK (owner_id = (SELECT auth.uid()));
CREATE POLICY pets_delete_own ON public.pets FOR DELETE TO authenticated
USING (owner_id = (SELECT auth.uid()));

CREATE POLICY vaccines_read_own ON public.vaccines FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pets p
  WHERE p.id = vaccines.pet_id AND p.owner_id = (SELECT auth.uid())
));
CREATE POLICY vaccines_create_own ON public.vaccines FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pets p
  WHERE p.id = vaccines.pet_id AND p.owner_id = (SELECT auth.uid())
));
CREATE POLICY vaccines_edit_own ON public.vaccines FOR UPDATE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pets p
  WHERE p.id = vaccines.pet_id AND p.owner_id = (SELECT auth.uid())
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pets p
  WHERE p.id = vaccines.pet_id AND p.owner_id = (SELECT auth.uid())
));
CREATE POLICY vaccines_delete_own ON public.vaccines FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pets p
  WHERE p.id = vaccines.pet_id AND p.owner_id = (SELECT auth.uid())
));

-- Comprobación sugerida después de ejecutar:
-- SELECT tablename, rowsecurity FROM pg_tables
-- WHERE schemaname = 'public' AND tablename IN ('pets','vaccines');
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('pets','vaccines');
