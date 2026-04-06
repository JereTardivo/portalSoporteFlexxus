import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get("teamId");
    const year = searchParams.get("year");

    const where: Record<string, unknown> = {};
    if (teamId) where.teamId = teamId;
    if (year) {
      where.weekStart = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${parseInt(year) + 1}-01-01`),
      };
    }

    const guardias = await prisma.guardia.findMany({
      where,
      include: {
        guardia1: { select: { id: true, name: true } },
        guardia2: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { weekStart: "asc" },
    });
    return NextResponse.json(guardias);
  } catch {
    return NextResponse.json({ error: "Error al obtener guardias" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { teamId, weekStart, guardia1Id, guardia2Id } = await request.json();

    const guardia = await prisma.guardia.upsert({
      where: {
        teamId_weekStart: {
          teamId,
          weekStart: new Date(weekStart),
        },
      },
      update: {
        guardia1Id: guardia1Id || null,
        guardia2Id: guardia2Id || null,
      },
      create: {
        teamId,
        weekStart: new Date(weekStart),
        guardia1Id: guardia1Id || null,
        guardia2Id: guardia2Id || null,
      },
      include: {
        guardia1: { select: { id: true, name: true } },
        guardia2: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(guardia);
  } catch {
    return NextResponse.json({ error: "Error al guardar guardia" }, { status: 500 });
  }
}
