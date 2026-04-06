import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const body = await req.json();
  const { nombre, premium, basico, porCasos, sinSoporte, orderAdvanced, categoriaEspecial } = body;

  const db = prisma as any;
  const updated = await db.tareaValor.update({
    where: { id: params.id },
    data: { nombre, premium, basico, porCasos, sinSoporte, orderAdvanced, categoriaEspecial },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const db = prisma as any;
  await db.tareaValor.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
