import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  try {
    const vacacion = await prisma.vacacion.findUnique({ where: { id: params.id } });
    if (!vacacion) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    if (session.user.role !== "admin" && vacacion.userId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Agents cannot delete approved days
    if (session.user.role !== "admin" && vacacion.aprobado) {
      return NextResponse.json({ error: "Este día ya fue aprobado por tu líder. No podés modificarlo." }, { status: 403 });
    }

    await prisma.vacacion.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Error al eliminar vacacion" }, { status: 500 });
  }
}

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Solo los líderes pueden aprobar vacaciones" }, { status: 403 });

  try {
    const vacacion = await prisma.vacacion.findUnique({ where: { id: params.id } });
    if (!vacacion) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const updated = await prisma.vacacion.update({
      where: { id: params.id },
      data: { aprobado: !vacacion.aprobado },
    });

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Error al actualizar vacacion" }, { status: 500 });
  }
}
