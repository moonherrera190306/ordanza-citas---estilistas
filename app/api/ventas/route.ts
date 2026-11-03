import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

const METODOS = ["EFECTIVO", "TARJETA", "TRANSFERENCIA"] as const;
const error = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  const metodo = METODOS.find((m) => m === b?.metodo);
  const citaId = Number(b?.citaId) || null;
  const items = (Array.isArray(b?.items) ? b.items : [])
    .map((i: any) => ({
      concepto: String(i?.concepto ?? "").trim().slice(0, 60),
      precio: Math.round(Number(i?.precio)),
      cantidad: Math.round(Number(i?.cantidad)),
    }))
    .filter((i: any) => i.concepto && i.precio >= 0 && i.cantidad >= 1);

  if (!metodo) return error("Elige método de pago");
  if (!items.length) return error("Agrega al menos un concepto");

  const total = items.reduce((s: number, i: any) => s + i.precio * i.cantidad, 0);
  const recibido = metodo === "EFECTIVO" ? Math.round(Number(b?.recibido)) : null;
  if (recibido !== null && !(recibido >= total)) return error("El efectivo recibido no cubre el total");

  try {
    const venta = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const v = await tx.venta.create({
        data: {
          citaId,
          clienta: String(b?.clienta ?? "").trim().slice(0, 80) || null,
          metodo,
          total,
          recibido,
          items: { create: items },
        },
      });
      if (citaId) await tx.cita.update({ where: { id: citaId }, data: { estado: "COMPLETADA" } });
      return v;
    });
    return NextResponse.json({ id: venta.id }, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return error("Esa cita ya fue cobrada", 409);
    throw e;
  }
}
