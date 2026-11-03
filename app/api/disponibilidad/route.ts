import { NextRequest, NextResponse } from "next/server";
import { horariosLibres } from "@/lib/disponibilidad";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const libres = await horariosLibres(
    q.get("fecha") ?? "",
    Number(q.get("servicioId")),
    Number(q.get("profesionalId")) || null,
  );
  return NextResponse.json(libres);
}
