import Link from "next/link";
import { revalidatePath } from "next/cache";
import Barra from "@/components/Barra";
import { db } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { fechaLarga, hora, local, minutos, pesos, sumarDias, ymd } from "@/lib/tiempo";

export const dynamic = "force-dynamic";

async function cancelar(form: FormData) {
  "use server";
  await db.cita.update({
    where: { id: Number(form.get("id")), estado: "CONFIRMADA" },
    data: { estado: "CANCELADA" },
  });
  revalidatePath("/");
}

export default async function Agenda({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const { fecha: f } = await searchParams;
  const fecha = f && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : ymd(new Date());
  const ini = local(fecha, "00:00");

  const [pros, citas] = await Promise.all([
    db.profesional.findMany({ where: { activo: true }, orderBy: { id: "asc" } }),
    db.cita.findMany({
      where: { inicio: { gte: ini, lt: minutos(ini, 1440) } },
      include: { servicio: true, venta: true },
      orderBy: { inicio: "asc" },
    }),
  ]);

  const activas = citas.filter((c) => c.estado !== "CANCELADA");
  const cobrado = citas.reduce((s, c) => s + (c.venta?.total ?? 0), 0);
  const estimado = activas.reduce((s, c) => s + c.servicio.precio, 0);

  return (
    <>
      <Barra />
      <main className="pagina">
        <div className="fila entre">
          <div>
            <span className="etiqueta">{fechaLarga(ini)}</span>
            <h1>Agenda</h1>
          </div>
          <div className="fila">
            <Link className="btn" href={`/?fecha=${sumarDias(fecha, -1)}`} aria-label="Día anterior">←</Link>
            <Link className="btn" href="/">Hoy</Link>
            <Link className="btn" href={`/?fecha=${sumarDias(fecha, 1)}`} aria-label="Día siguiente">→</Link>
            <Link className="btn btn-oro" href="/caja">Venta sin cita</Link>
          </div>
        </div>

        <div className="rejilla">
          <div className="caja-blanca"><span className="muted">Citas</span><div className="total">{activas.length}</div></div>
          <div className="caja-blanca"><span className="muted">Estimado</span><div className="total">{pesos(estimado)}</div></div>
          <div className="caja-blanca"><span className="muted">Cobrado</span><div className="total">{pesos(cobrado)}</div></div>
        </div>

        <div className="rejilla">
          {pros.map((p) => {
            const suyas = citas.filter((c) => c.profesionalId === p.id);
            return (
              <section key={p.id} className="caja-blanca" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <h2>{p.nombre}</h2>
                {suyas.length === 0 && <span className="muted">Sin citas este día</span>}
                {suyas.map((c) => (
                  <article key={c.id} className={`cita ${c.estado}`}>
                    <div className="fila entre">
                      <strong>{hora(c.inicio)} – {hora(minutos(c.inicio, c.servicio.duracionMin))}</strong>
                      <span>{pesos(c.servicio.precio)}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{c.clienta}</span>
                    <span className="muted">{c.servicio.nombre} · {c.telefono}</span>
                    {c.estado === "CANCELADA" && <span className="chip">Cancelada</span>}
                    <div className="fila">
                      {c.venta ? (
                        <Link className="btn btn-chico" href={`/ticket/${c.venta.id}`}>Ver ticket</Link>
                      ) : c.estado === "CONFIRMADA" ? (
                        <>
                          <Link className="btn btn-chico btn-tinta" href={`/caja?cita=${c.id}`}>Cobrar</Link>
                          <a className="btn btn-chico" target="_blank" href={`https://wa.me/52${c.telefono}?text=${encodeURIComponent(`Hola ${c.clienta}, te recordamos tu cita de ${c.servicio.nombre} el ${fechaLarga(c.inicio)} a las ${hora(c.inicio)} en ${CONFIG.salon}.`)}`}>WhatsApp</a>
                          <form action={cancelar}>
                            <input type="hidden" name="id" value={c.id} />
                            <button className="btn btn-chico" type="submit">Cancelar</button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}
