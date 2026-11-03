import { NextRequest, NextResponse } from "next/server";

// Rutas que las clientas pueden abrir sin contraseña
const PUBLICAS = ["/reservar", "/api/disponibilidad", "/api/citas", "/logo-ordanza.png"];

export function middleware(req: NextRequest) {
  const ruta = req.nextUrl.pathname;
  if (PUBLICAS.some((p) => ruta.startsWith(p))) return NextResponse.next();

  const pin = process.env.PANEL_PIN;
  const auth = req.headers.get("authorization");
  if (pin && auth?.startsWith("Basic ")) {
    const pass = atob(auth.slice(6)).split(":").slice(1).join(":");
    if (pass === pin) return NextResponse.next();
  }
  return new NextResponse("Acceso restringido", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Ordanza"' },
  });
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
