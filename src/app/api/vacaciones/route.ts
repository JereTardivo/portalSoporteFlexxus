import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const teamId = searchParams.get("teamId");
    const year = searchParams.get("year");

    const dateFilter = year
      ? { gte: new Date(`${year}-01-01`), lt: new Date(`${parseInt(year) + 1}-01-01`) }
      : undefined;

    // Team view: return all members' data
    if (teamId && session.user.role === "admin") {
      const members = await prisma.user.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, diasVacaciones: true },
      });

      const teamData = await Promise.all(
        members.map(async (m) => ({
          userId: m.id,
          userName: m.name,
          diasTotales: m.diasVacaciones,
          vacaciones: await prisma.vacacion.findMany({
            where: { userId: m.id, ...(dateFilter ? { fecha: dateFilter } : {}) },
            orderBy: { fecha: "asc" },
          }),
        }))
      );

      return NextResponse.json({ teamData });
    }

    // Single user view
    const targetUserId =
      session.user.role === "admin" && userId ? userId : session.user.id;

    const where: Record<string, unknown> = { userId: targetUserId };
    if (dateFilter) where.fecha = dateFilter;

    const [vacaciones, user] = await Promise.all([
      prisma.vacacion.findMany({ where, orderBy: { fecha: "asc" } }),
      prisma.user.findUnique({ where: { id: targetUserId }, select: { diasVacaciones: true } }),
    ]);

    return NextResponse.json({ vacaciones, diasTotales: user?.diasVacaciones ?? 15 });
  } catch {
    return NextResponse.json({ error: "Error al obtener vacaciones" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const { userId, fechas, nota } = await request.json();
    const targetUserId =
      session.user.role === "admin" && userId ? userId : session.user.id;

    const created = [];
    for (const fecha of fechas) {
      try {
        const vac = await prisma.vacacion.create({
          data: {
            userId: targetUserId,
            fecha: new Date(fecha),
            nota: nota || null,
          },
        });
        created.push(vac);
      } catch {
        // Skip duplicate dates
      }
    }
    return NextResponse.json(created);
  } catch {
    return NextResponse.json({ error: "Error al guardar vacaciones" }, { status: 500 });
  }
}
