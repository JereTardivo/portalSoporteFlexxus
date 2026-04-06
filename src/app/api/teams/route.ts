import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const teams = await prisma.team.findMany({
      include: {
        users: {
          where: { role: "agent" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teams);
  } catch {
    return NextResponse.json({ error: "Error al obtener equipos" }, { status: 500 });
  }
}
