import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { CONFIG } from "@/lib/config";
import { horariosLibres } from "@/lib/disponibilidad";
import { local, minutos } from "@/lib/tiempo";

const error = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const clienta = String(b?.clienta ?? "").trim().slice(0, 80);
  const telefono = String(b?.telefono ?? "").replace(/\D/g, "").slice(-10);
  const servicioId = Number(b?.servicioId);
  const profesionalId = Number(b?.profesionalId) || null;
  const fecha = String(b?.fecha ?? "");
  const hora = String(b?.hora ?? "");

  if (clienta.length < 2) return error("Escribe tu nombre");
  if (telefono.length !== 10) return error("El teléfono debe tener 10 dígitos");
  if (!/^\d{2}:\d{2}$/.test(hora)) return error("Horario inválido");

  // Máximo 1 cita activa por teléfono
  const activa = await db.cita.findFirst({
    where: { telefono, estado: "CONFIRMADA", inicio: { gt: new Date() } },
  });
  if (activa) return error("Ya tienes una cita activa. Cancélala o reagéndala con el salón.", 409);

  const libres = await horariosLibres(fecha, servicioId, profesionalId);
  const slot = libres.find((h) => h.hora === hora);
  if (!slot) return error("Ese horario ya no está disponible, elige otro.", 409);

  const servicio = await db.servicio.findUniqueOrThrow({ where: { id: servicioId } });
  const inicio = local(fecha, hora);

  try {
    const cita = await db.cita.create({
      data: {
        clienta,
        telefono,
        servicioId,
        profesionalId: slot.profesionalId,
        inicio,
        fin: minutos(inicio, servicio.duracionMin + CONFIG.margenMin),
      },
    });
    return NextResponse.json({ id: cita.id }, { status: 201 });
  } catch (e) {
    // 23P01 = violación de la regla sin_traslape (dos reservas al mismo tiempo)
    if (String(e).includes("23P01") || String(e).includes("sin_traslape"))
      return error("Ese horario se acaba de ocupar, elige otro.", 409);
    throw e;
  }
}
