import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

if ((await db.servicio.count()) === 0) {
  await db.profesional.createMany({ data: [{ nombre: "Ana" }, { nombre: "Sofía" }] });
  await db.servicio.createMany({
    data: [
      { nombre: "Gelish manos", duracionMin: 60, precio: 320 },
      { nombre: "Acrílico + diseño", duracionMin: 90, precio: 550 },
      { nombre: "Retiro + rubber base", duracionMin: 75, precio: 480 },
      { nombre: "Pedicure spa", duracionMin: 60, precio: 380 },
      { nombre: "Corte y peinado", duracionMin: 60, precio: 350 },
      { nombre: "Balayage + matiz", duracionMin: 120, precio: 1600 },
    ],
  });
  console.log("Datos iniciales creados");
}
await db.$disconnect();
