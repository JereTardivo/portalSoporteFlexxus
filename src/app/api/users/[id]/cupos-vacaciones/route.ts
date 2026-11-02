import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Cupos de días de vacaciones por año de un usuario puntual.
// Permite al admin "renovar" los días (ej. cada octubre) fijando el cupo del
// próximo año sin tocar los cupos ya asignados a años anteriores ni las
// vacaciones ya marcadas/aprobadas.

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const cupos = await prisma.cupoVacaciones.findMany({
      where: { userId: params.id },
      orderBy: { year: "desc" },
    });
    return NextResponse.json(cupos);
  } catch {
    return NextResponse.json({ error: "Error al obtener cupos" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { year, dias } = await request.json();
    const yearNum = parseInt(year);
    const diasNum = parseInt(dias);

    if (!Number.isInteger(yearNum) || !Number.isInteger(diasNum) || diasNum < 0) {
      return NextResponse.json({ error: "Año o días inválidos" }, { status: 400 });
    }

    const cupo = await prisma.cupoVacaciones.upsert({
      where: { userId_year: { userId: params.id, year: yearNum } },
      update: { dias: diasNum },
      create: { userId: params.id, year: yearNum, dias: diasNum },
    });
    return NextResponse.json(cupo);
  } catch {
    return NextResponse.json({ error: "Error al guardar el cupo" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const yearNum = parseInt(searchParams.get("year") ?? "");
    if (!Number.isInteger(yearNum)) {
      return NextResponse.json({ error: "Año inválido" }, { status: 400 });
    }
    await prisma.cupoVacaciones.delete({
      where: { userId_year: { userId: params.id, year: yearNum } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar el cupo" }, { status: 500 });
  }
}
