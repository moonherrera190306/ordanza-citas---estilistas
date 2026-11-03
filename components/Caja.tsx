"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Item = { concepto: string; precio: number; cantidad: number };
type Props = {
  servicios: { id: number; nombre: string; precio: number }[];
  cita: { id: number; clienta: string; concepto: string; precio: number } | null;
};

const pesos = (n: number) => `$${n.toLocaleString("es-MX")}`;

export default function Caja({ servicios, cita }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(cita ? [{ concepto: cita.concepto, precio: cita.precio, cantidad: 1 }] : []);
  const [clienta, setClienta] = useState(cita?.clienta ?? "");
  const [metodo, setMetodo] = useState("EFECTIVO");
  const [recibido, setRecibido] = useState("");
  const [libre, setLibre] = useState({ concepto: "", precio: "" });
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  const cambio = Number(recibido) - total;

  const agregar = (concepto: string, precio: number) =>
    setItems((xs) => {
      const i = xs.findIndex((x) => x.concepto === concepto && x.precio === precio);
      if (i < 0) return [...xs, { concepto, precio, cantidad: 1 }];
      return xs.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + 1 } : x));
    });

  const cambiarCantidad = (i: number, d: number) =>
    setItems((xs) => xs.map((x, j) => (j === i ? { ...x, cantidad: x.cantidad + d } : x)).filter((x) => x.cantidad > 0));

  async function cobrar() {
    setError("");
    setEnviando(true);
    const r = await fetch("/api/ventas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citaId: cita?.id, clienta, metodo, recibido: Number(recibido), items }),
    });
    const data = await r.json();
    setEnviando(false);
    if (!r.ok) return setError(data.error ?? "No se pudo cobrar");
    router.push(`/ticket/${data.id}`);
  }

  return (
    <div className="rejilla" style={{ alignItems: "start" }}>
      <section className="caja-blanca" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2>Servicios</h2>
        <div className="fila">
          {servicios.map((s) => (
            <button key={s.id} className="btn btn-chico" type="button" onClick={() => agregar(s.nombre, s.precio)}>
              {s.nombre} · {pesos(s.precio)}
            </button>
          ))}
        </div>
        <h2>Otro concepto</h2>
        <div className="fila" style={{ alignItems: "end" }}>
          <label style={{ flex: "2 1 160px" }}>Concepto
            <input value={libre.concepto} onChange={(e) => setLibre({ ...libre, concepto: e.target.value })} placeholder="Diseño extra, producto…" />
          </label>
          <label style={{ flex: "1 1 90px" }}>Precio
            <input inputMode="numeric" value={libre.precio} onChange={(e) => setLibre({ ...libre, precio: e.target.value.replace(/\D/g, "") })} />
          </label>
          <button
            className="btn"
            type="button"
            disabled={!libre.concepto.trim() || !libre.precio}
            onClick={() => { agregar(libre.concepto.trim(), Number(libre.precio)); setLibre({ concepto: "", precio: "" }); }}
          >
            Agregar
          </button>
        </div>
      </section>

      <section className="caja-blanca" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <h2>Cuenta</h2>
        <label>Clienta (opcional)
          <input value={clienta} onChange={(e) => setClienta(e.target.value)} />
        </label>
        {items.length === 0 ? (
          <span className="muted">Agrega servicios o conceptos</span>
        ) : (
          <table>
            <tbody>
              {items.map((x, i) => (
                <tr key={i}>
                  <td>{x.concepto}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className="btn btn-chico" type="button" aria-label="Quitar uno" onClick={() => cambiarCantidad(i, -1)}>−</button>
                    {" "}{x.cantidad}{" "}
                    <button className="btn btn-chico" type="button" aria-label="Agregar uno" onClick={() => cambiarCantidad(i, 1)}>+</button>
                  </td>
                  <td style={{ textAlign: "right" }}>{pesos(x.precio * x.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="fila entre"><span className="muted">Total</span><span className="total">{pesos(total)}</span></div>

        <div className="fila">
          {[["EFECTIVO", "Efectivo"], ["TARJETA", "Tarjeta"], ["TRANSFERENCIA", "Transferencia"]].map(([v, t]) => (
            <button key={v} type="button" className={`btn btn-chico ${metodo === v ? "btn-sel" : ""}`} onClick={() => setMetodo(v)}>{t}</button>
          ))}
        </div>
        {metodo === "EFECTIVO" && (
          <div className="fila" style={{ alignItems: "end" }}>
            <label style={{ flex: 1 }}>Recibido
              <input inputMode="numeric" value={recibido} onChange={(e) => setRecibido(e.target.value.replace(/\D/g, ""))} />
            </label>
            <span style={{ flex: 1, fontWeight: 700 }}>Cambio: {recibido && cambio >= 0 ? pesos(cambio) : "—"}</span>
          </div>
        )}
        {error && <span className="error" role="alert">{error}</span>}
        <button
          className="btn btn-oro"
          type="button"
          disabled={enviando || !items.length || (metodo === "EFECTIVO" && !(cambio >= 0 && recibido))}
          onClick={cobrar}
        >
          {enviando ? "Cobrando…" : `Cobrar ${pesos(total)} e imprimir ticket`}
        </button>
      </section>
    </div>
  );
}
