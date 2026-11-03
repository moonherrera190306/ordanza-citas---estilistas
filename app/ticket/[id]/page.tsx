import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { pesos } from "@/lib/tiempo";
import Imprimir from "@/components/Imprimir";

export const dynamic = "force-dynamic";

const METODO = { EFECTIVO: "Efectivo", TARJETA: "Tarjeta", TRANSFERENCIA: "Transferencia" } as const;

export default async function Ticket({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const v = await db.venta.findUnique({
    where: { id: Number(id) || 0 },
    include: { items: true, cita: { include: { profesional: true } } },
  });
  if (!v) notFound();

  const fecha = v.creadaEn.toLocaleString("es-MX", { timeZone: CONFIG.zona, dateStyle: "short", timeStyle: "short" });

  return (
    <main style={{ padding: "24px 12px", display: "flex", flexDirection: "column", gap: 16, alignItems: "center" }}>
      <div className="fila no-imprimir">
        <Imprimir />
        <Link className="btn" href="/">Volver a la agenda</Link>
        <Link className="btn" href="/caja">Nueva venta</Link>
      </div>

      <div className="ticket">
        <img src="/logo-ticket.png" alt="Ordanza" />
        <div className="c grande">{CONFIG.salon}</div>
        <div className="c">{CONFIG.direccion}</div>
        <div className="c">Tel. {CONFIG.telefono}</div>
        <hr />
        <div className="r"><span>Folio</span><span>{String(v.id).padStart(6, "0")}</span></div>
        <div className="r"><span>Fecha</span><span>{fecha}</span></div>
        {v.clienta && <div className="r"><span>Clienta</span><span>{v.clienta}</span></div>}
        {v.cita && <div className="r"><span>Atendió</span><span>{v.cita.profesional.nombre}</span></div>}
        <hr />
        {v.items.map((i) => (
          <div key={i.id}>
            <div>{i.concepto}</div>
            <div className="r"><span>{i.cantidad} x {pesos(i.precio)}</span><span>{pesos(i.precio * i.cantidad)}</span></div>
          </div>
        ))}
        <hr />
        <div className="r grande"><span>TOTAL</span><span>{pesos(v.total)}</span></div>
        <div className="r"><span>Pago</span><span>{METODO[v.metodo]}</span></div>
        {v.recibido != null && (
          <>
            <div className="r"><span>Recibido</span><span>{pesos(v.recibido)}</span></div>
            <div className="r"><span>Cambio</span><span>{pesos(v.recibido - v.total)}</span></div>
          </>
        )}
        <hr />
        <div className="c">¡Gracias por tu visita!</div>
        <div className="c">Agenda tu próxima cita en línea</div>
        <div className="c" style={{ marginTop: 6, fontSize: 10 }}>Sistema Ordanza · software que pone en orden</div>
      </div>
    </main>
  );
}
