import Reservar from "@/components/Reservar";
import { db } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { diaSemana, sumarDias, ymd } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

export default async function ReservarPage() {
  const [servicios, pros] = await Promise.all([
    db.servicio.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    db.profesional.findMany({ where: { activo: true }, orderBy: { id: "asc" } }),
  ]);

  const hoy = ymd(new Date());
  const dias = Array.from({ length: CONFIG.diasAdelante }, (_, i) => sumarDias(hoy, i)).filter((d) =>
    CONFIG.dias.includes(diaSemana(d)),
  );

  return (
    <main className="pagina" style={{ maxWidth: 520 }}>
      <div>
        <span className="etiqueta">{CONFIG.salon}</span>
        <h1>Reserva tu cita</h1>
      </div>
      <Reservar
        servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio, duracionMin: s.duracionMin }))}
        pros={pros.map((p) => ({ id: p.id, nombre: p.nombre }))}
        dias={dias}
      />
      <img src="/logo-ordanza.png" alt="" style={{ height: 22, alignSelf: "center", filter: "invert(1) grayscale(1)", opacity: 0.5 }} />
    </main>
  );
}
