import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const llamada = await prisma.llamadaBasico.findUnique({ where: { id: params.id } });
  if (!llamada) return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });

  const isAdmin = session.user.role === "admin";
  const isOwner = llamada.agenteId === session.user.id;
  if (!isAdmin && !isOwner)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { motivo, descripcion, ticket, modulo } = await req.json();

  if (motivo?.trim().length > 50)
    return NextResponse.json({ error: "Motivo máx. 50 caracteres" }, { status: 400 });

  if (descripcion?.trim().length > 250)
    return NextResponse.json({ error: "Descripción máx. 250 caracteres" }, { status: 400 });

  if (ticket && !/^\d{6}$/.test(ticket))
    return NextResponse.json({ error: "Ticket debe tener 6 dígitos numéricos" }, { status: 400 });

  const updated = await prisma.llamadaBasico.update({
    where: { id: params.id },
    data: {
      ...(motivo !== undefined && { motivo: motivo.trim() }),
      ...(descripcion !== undefined && { descripcion: descripcion.trim() }),
      ...(ticket !== undefined && { ticket }),
      ...(modulo !== undefined && { modulo: modulo.trim() }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const llamada = await prisma.llamadaBasico.findUnique({ where: { id: params.id } });
  if (!llamada) return NextResponse.json({ error: "Llamada no encontrada" }, { status: 404 });

  const isAdmin = session.user.role === "admin";
  const isOwner = llamada.agenteId === session.user.id;
  if (!isAdmin && !isOwner)
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await prisma.llamadaBasico.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
