import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const isAdmin = session.user.role === "admin";

  const { searchParams } = new URL(req.url);
  const equipoFilter = searchParams.get("equipo");

  let teamName: string | null = null;
  if (!isAdmin && session.user.teamId) {
    const team = await prisma.team.findUnique({ where: { id: session.user.teamId } });
    teamName = team?.name ?? null;
  }

  const where: Record<string, string> = {};
  if (isAdmin && equipoFilter) {
    where.equipo = equipoFilter;
  } else if (!isAdmin && teamName) {
    where.equipo = teamName;
  }

  const clientes = await prisma.clienteBasico.findMany({
    where,
    include: { llamadas: { orderBy: { createdAt: "asc" } } },
    orderBy: { empresa: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function DELETE(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { count } = await prisma.clienteBasico.deleteMany();
  return NextResponse.json({ ok: true, eliminados: count });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { empresa, equipo } = await req.json();
  if (!empresa?.trim() || !equipo?.trim())
    return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });

  const existe = await prisma.clienteBasico.findUnique({ where: { empresa: empresa.trim() } });
  if (existe) return NextResponse.json({ error: "Ya existe un cliente con ese nombre" }, { status: 409 });

  const cliente = await prisma.clienteBasico.create({
    data: { empresa: empresa.trim(), equipo: equipo.trim() },
    include: { llamadas: true },
  });
  return NextResponse.json(cliente, { status: 201 });
}
