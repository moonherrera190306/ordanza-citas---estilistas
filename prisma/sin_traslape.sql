-- Candado en BD: una profesional no puede tener dos citas que se encimen.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Cita" DROP CONSTRAINT IF EXISTS sin_traslape;

ALTER TABLE "Cita" ADD CONSTRAINT sin_traslape
EXCLUDE USING gist (
  "profesionalId" WITH =,
  tsrange("inicio", "fin") WITH &&
) WHERE ("estado" <> 'CANCELADA');
