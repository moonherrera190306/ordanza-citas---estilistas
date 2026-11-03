import { CONFIG } from "./config";

/** "2026-11-04" + "11:30" → Date en hora local del salón */
export const local = (fecha: string, hhmm: string) => new Date(`${fecha}T${hhmm}:00${CONFIG.offset}`);

export const hora = (d: Date) =>
  d.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: CONFIG.zona });

export const fechaLarga = (d: Date) =>
  d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: CONFIG.zona });

/** YYYY-MM-DD en hora local */
export const ymd = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: CONFIG.zona });

export const sumarDias = (fecha: string, n: number) => ymd(new Date(local(fecha, "12:00").getTime() + n * 864e5));

export const diaSemana = (fecha: string) => local(fecha, "12:00").getUTCDay();

export const minutos = (d: Date, m: number) => new Date(d.getTime() + m * 60000);

export const pesos = (n: number) => `$${n.toLocaleString("es-MX")}`;
