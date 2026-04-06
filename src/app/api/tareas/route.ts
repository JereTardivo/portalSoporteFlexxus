import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const tareas = await prisma.$queryRawUnsafe<unknown[]>(
    `SELECT id, nombre, premium, basico, porCasos, sinSoporte, orderAdvanced, categoriaEspecial, orden, updatedAt FROM TareaValor ORDER BY orden ASC`
  );
  return NextResponse.json(tareas);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const { nombre, premium, basico, porCasos, sinSoporte, orderAdvanced } = await req.json();
  if (!nombre?.trim()) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const db = prisma as any;
  const last = await db.tareaValor.findFirst({ orderBy: { orden: "desc" } });
  const tarea = await db.tareaValor.create({
    data: {
      nombre: nombre.trim(),
      premium: premium ?? "-",
      basico: basico ?? "-",
      porCasos: porCasos ?? "-",
      sinSoporte: sinSoporte ?? "-",
      orderAdvanced: orderAdvanced ?? "-",
      orden: (last?.orden ?? 0) + 1,
    },
  });

  return NextResponse.json(tarea, { status: 201 });
}
