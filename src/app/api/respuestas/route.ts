import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segmento = searchParams.get("segmento");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (segmento) where.segmento = segmento;
    if (search) {
      where.OR = [
        { titulo: { contains: search } },
        { detalle: { contains: search } },
        { segmento: { contains: search } },
      ];
    }

    const respuestas = await prisma.respuestaRapida.findMany({
      where,
      orderBy: [{ segmento: "asc" }, { orden: "asc" }],
    });
    return NextResponse.json(respuestas);
  } catch {
    return NextResponse.json({ error: "Error al obtener respuestas" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { segmento, titulo, detalle, orden } = await request.json();
    const respuesta = await prisma.respuestaRapida.create({
      data: { segmento, titulo, detalle, orden: orden ?? 0 },
    });
    return NextResponse.json(respuesta);
  } catch {
    return NextResponse.json({ error: "Error al crear respuesta" }, { status: 500 });
  }
}
