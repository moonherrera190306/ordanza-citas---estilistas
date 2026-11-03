import Barra from "@/components/Barra";
import Caja from "@/components/Caja";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CajaPage({ searchParams }: { searchParams: Promise<{ cita?: string }> }) {
  const { cita: citaId } = await searchParams;
  const [servicios, cita] = await Promise.all([
    db.servicio.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }),
    citaId
      ? db.cita.findFirst({ where: { id: Number(citaId), estado: "CONFIRMADA", venta: null }, include: { servicio: true } })
      : null,
  ]);

  return (
    <>
      <Barra />
      <main className="pagina">
        <div>
          <span className="etiqueta">Caja</span>
          <h1>{cita ? `Cobrar a ${cita.clienta}` : "Venta"}</h1>
        </div>
        <Caja
          servicios={servicios.map((s) => ({ id: s.id, nombre: s.nombre, precio: s.precio }))}
          cita={cita ? { id: cita.id, clienta: cita.clienta, concepto: cita.servicio.nombre, precio: cita.servicio.precio } : null}
        />
      </main>
    </>
  );
}
