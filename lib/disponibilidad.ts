import { db } from "./db";
import { CONFIG } from "./config";
import { diaSemana, hora, local, minutos } from "./tiempo";

export type Horario = { hora: string; profesionalId: number };

/** Horarios donde el servicio cabe completo, sin encimarse con otras citas. */
export async function horariosLibres(fecha: string, servicioId: number, profesionalId?: number | null) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !CONFIG.dias.includes(diaSemana(fecha))) return [];

  const servicio = await db.servicio.findFirst({ where: { id: servicioId, activo: true } });
  if (!servicio) return [];

  const pros = await db.profesional.findMany({
    where: { activo: true, ...(profesionalId ? { id: profesionalId } : {}) },
    orderBy: { id: "asc" },
  });
  if (!pros.length) return [];

  const abre = local(fecha, CONFIG.apertura);
  const cierra = local(fecha, CONFIG.cierre);
  const citas = await db.cita.findMany({
    where: {
      profesionalId: { in: pros.map((p) => p.id) },
      estado: { not: "CANCELADA" },
      inicio: { lt: cierra },
      fin: { gt: abre },
    },
  });

  const limite = minutos(new Date(), CONFIG.anticipacionMin);
  const bloque = servicio.duracionMin + CONFIG.margenMin;
  const libres: Horario[] = [];

  for (let ini = abre; minutos(ini, servicio.duracionMin) <= cierra; ini = minutos(ini, CONFIG.pasoMin)) {
    if (ini < limite) continue;
    const fin = minutos(ini, bloque);
    const pro = pros.find(
      (p) => !citas.some((c) => c.profesionalId === p.id && c.inicio < fin && c.fin > ini),
    );
    if (pro) libres.push({ hora: hora(ini), profesionalId: pro.id });
  }
  return libres;
}
