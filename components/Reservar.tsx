"use client";

import { useEffect, useState } from "react";

type Props = {
  servicios: { id: number; nombre: string; precio: number; duracionMin: number }[];
  pros: { id: number; nombre: string }[];
  dias: string[];
};

const pesos = (n: number) => `$${n.toLocaleString("es-MX")}`;
const etiquetaDia = (d: string) => {
  const f = new Date(`${d}T12:00:00-06:00`);
  return {
    dia: f.toLocaleDateString("es-MX", { weekday: "short", timeZone: "America/Mexico_City" }),
    num: f.toLocaleDateString("es-MX", { day: "numeric", timeZone: "America/Mexico_City" }),
  };
};

export default function Reservar({ servicios, pros, dias }: Props) {
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [proId, setProId] = useState<number | null>(pros.length === 1 ? pros[0].id : null);
  const [fecha, setFecha] = useState(dias[0] ?? "");
  const [horarios, setHorarios] = useState<{ hora: string }[] | null>(null);
  const [hora, setHora] = useState("");
  const [clienta, setClienta] = useState("");
  const [telefono, setTelefono] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  async function cargar() {
    if (!servicioId || !fecha) return;
    setHorarios(null);
    setHora("");
    const q = new URLSearchParams({ fecha, servicioId: String(servicioId), ...(proId ? { profesionalId: String(proId) } : {}) });
    const r = await fetch(`/api/disponibilidad?${q}`);
    setHorarios(await r.json());
  }

  useEffect(() => { cargar(); }, [servicioId, proId, fecha]); // eslint-disable-line react-hooks/exhaustive-deps

  async function reservar() {
    setError("");
    setEnviando(true);
    const r = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ servicioId, profesionalId: proId, fecha, hora, clienta, telefono }),
    });
    const data = await r.json();
    setEnviando(false);
    if (r.ok) return setListo(true);
    setError(data.error ?? "No se pudo reservar");
    if (r.status === 409) cargar();
  }

  const servicio = servicios.find((s) => s.id === servicioId);

  if (listo)
    return (
      <section className="caja-blanca" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <h2>¡Tu cita quedó agendada!</h2>
        <span>{servicio?.nombre} · {etiquetaDia(fecha).dia} {etiquetaDia(fecha).num} a las {hora}</span>
        <span className="muted">Si necesitas cambiarla, comunícate con el salón.</span>
      </section>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <strong>1 · Servicio</strong>
        {servicios.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`btn ${servicioId === s.id ? "btn-sel" : ""}`}
            style={{ justifyContent: "space-between", minHeight: 56 }}
            onClick={() => setServicioId(s.id)}
          >
            <span>{s.nombre} <span style={{ opacity: 0.7, fontWeight: 500 }}>· {s.duracionMin} min</span></span>
            <span>{pesos(s.precio)}</span>
          </button>
        ))}
      </section>

      {pros.length > 1 && (
        <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <strong>2 · ¿Con quién?</strong>
          <div className="fila">
            {pros.map((p) => (
              <button key={p.id} type="button" className={`btn ${proId === p.id ? "btn-sel" : ""}`} onClick={() => setProId(p.id)}>{p.nombre}</button>
            ))}
            <button type="button" className={`btn ${proId === null ? "btn-sel" : ""}`} onClick={() => setProId(null)}>Cualquiera</button>
          </div>
        </section>
      )}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <strong>{pros.length > 1 ? 3 : 2} · Día y hora</strong>
        <div className="fila" style={{ flexWrap: "nowrap", overflowX: "auto", paddingBottom: 4 }}>
          {dias.map((d) => {
            const e = etiquetaDia(d);
            return (
              <button key={d} type="button" className={`btn ${fecha === d ? "btn-oro" : ""}`} style={{ flexDirection: "column", minWidth: 58, minHeight: 60, gap: 0 }} onClick={() => setFecha(d)}>
                <span style={{ fontSize: 12, textTransform: "capitalize" }}>{e.dia}</span>
                <span style={{ fontSize: 17 }}>{e.num}</span>
              </button>
            );
          })}
        </div>
        {!servicioId ? (
          <span className="muted">Elige un servicio para ver horarios</span>
        ) : horarios === null ? (
          <span className="muted">Buscando horarios…</span>
        ) : horarios.length === 0 ? (
          <span className="muted">No hay horarios libres este día</span>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 8 }}>
            {horarios.map((h) => (
              <button key={h.hora} type="button" className={`btn ${hora === h.hora ? "btn-sel" : ""}`} onClick={() => setHora(h.hora)}>{h.hora}</button>
            ))}
          </div>
        )}
      </section>

      <section className="caja-blanca" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <label>Nombre<input value={clienta} onChange={(e) => setClienta(e.target.value)} autoComplete="name" /></label>
        <label>WhatsApp (10 dígitos)<input value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="tel" autoComplete="tel" /></label>
        {error && <span className="error" role="alert">{error}</span>}
        <button
          type="button"
          className="btn btn-oro"
          disabled={enviando || !hora || clienta.trim().length < 2 || telefono.length !== 10}
          onClick={reservar}
        >
          {enviando ? "Agendando…" : "Agendar mi cita"}
        </button>
      </section>
    </div>
  );
}
