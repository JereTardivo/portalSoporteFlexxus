import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { empresa } = await req.json();
  if (!empresa?.trim())
    return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const existe = await prisma.clienteBasico.findUnique({ where: { empresa: empresa.trim() } });
  if (existe && existe.id !== params.id)
    return NextResponse.json({ error: "Ya existe un cliente con ese nombre" }, { status: 409 });

  const updated = await prisma.clienteBasico.update({
    where: { id: params.id },
    data: { empresa: empresa.trim() },
    include: { llamadas: true },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  await prisma.clienteBasico.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
