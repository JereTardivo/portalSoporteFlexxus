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

    const yearNum = year ? parseInt(year) : null;

    // Cuántos años hacia atrás se busca saldo sin tomar para arrastrar al año consultado.
    const MAX_LOOKBACK_YEARS = 10;

    // Resuelve el cupo de días de un usuario para el año consultado:
    // - usa el cupo específico de ese año si existe (fijado al renovar vacaciones
    //   desde el ABM de usuarios); si no, cae al valor por defecto del usuario.
    // - además suma el saldo no tomado de años anteriores (sin tocar ni borrar
    //   ningún cupo ni vacación ya cargada, es solo un cálculo de lectura).
    const resolveDiasTotales = async (targetId: string, fallback: number, createdAt: Date) => {
      if (!yearNum) return fallback;

      const minYear = Math.max(createdAt.getFullYear(), yearNum - MAX_LOOKBACK_YEARS);
      if (yearNum <= minYear) {
        const cupo = await prisma.cupoVacaciones.findUnique({
          where: { userId_year: { userId: targetId, year: yearNum } },
        });
        return cupo?.dias ?? fallback;
      }

      const [cupos, vacacionesPrevias] = await Promise.all([
        prisma.cupoVacaciones.findMany({
          where: { userId: targetId, year: { gte: minYear, lte: yearNum } },
        }),
        prisma.vacacion.findMany({
          where: {
            userId: targetId,
            fecha: { gte: new Date(`${minYear}-01-01`), lt: new Date(`${yearNum}-01-01`) },
          },
          select: { fecha: true },
        }),
      ]);

      const cupoByYear = new Map(cupos.map((c) => [c.year, c.dias]));
      const tomadosByYear = new Map<number, number>();
      for (const v of vacacionesPrevias) {
        const y = new Date(v.fecha).getFullYear();
        tomadosByYear.set(y, (tomadosByYear.get(y) ?? 0) + 1);
      }

      let saldoArrastrado = 0;
      for (let y = minYear; y < yearNum; y++) {
        const totalAnio = (cupoByYear.get(y) ?? fallback) + saldoArrastrado;
        const tomadosAnio = tomadosByYear.get(y) ?? 0;
        saldoArrastrado = Math.max(0, totalAnio - tomadosAnio);
      }

      const cupoAnioActual = cupoByYear.get(yearNum) ?? fallback;
      return cupoAnioActual + saldoArrastrado;
    };

    // Team view: return all members' data.
    // Admins can view any team; regular agents can only view their own team (read-only on the client).
    const canViewTeam =
      session.user.role === "admin" || teamId === session.user.teamId;

    if (teamId && canViewTeam) {
      const members = await prisma.user.findMany({
        where: { teamId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, diasVacaciones: true, createdAt: true },
      });

      const teamData = await Promise.all(
        members.map(async (m) => ({
          userId: m.id,
          userName: m.name,
          diasTotales: await resolveDiasTotales(m.id, m.diasVacaciones, m.createdAt),
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
      prisma.user.findUnique({ where: { id: targetUserId }, select: { diasVacaciones: true, createdAt: true } }),
    ]);

    const diasTotales = await resolveDiasTotales(
      targetUserId,
      user?.diasVacaciones ?? 15,
      user?.createdAt ?? new Date()
    );

    return NextResponse.json({ vacaciones, diasTotales });
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
