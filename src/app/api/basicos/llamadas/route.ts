import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getMesId() {
  const now = new Date();
  const y = now.getFullYear();
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  return `${y}-${m}`;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { clienteId, motivo, descripcion, ticket, modulo } = await req.json();

  if (!clienteId || !motivo?.trim() || !descripcion?.trim() || !ticket || !modulo?.trim())
    return NextResponse.json({ error: "Campos requeridos" }, { status: 400 });

  if (motivo.trim().length > 50)
    return NextResponse.json({ error: "Motivo máx. 50 caracteres" }, { status: 400 });

  if (descripcion.trim().length > 250)
    return NextResponse.json({ error: "Descripción máx. 250 caracteres" }, { status: 400 });

  if (!/^\d{6}$/.test(ticket))
    return NextResponse.json({ error: "Ticket debe tener 6 dígitos numéricos" }, { status: 400 });

  const mes = getMesId();

  const countMes = await prisma.llamadaBasico.count({
    where: { clienteId, mes },
  });

  if (countMes >= 5)
    return NextResponse.json({ error: "Límite de 5 llamadas alcanzado para este mes" }, { status: 409 });

  const llamada = await prisma.llamadaBasico.create({
    data: {
      clienteId,
      motivo: motivo.trim(),
      descripcion: descripcion.trim(),
      ticket,
      modulo: modulo.trim(),
      agente: session.user.name ?? session.user.email ?? "Desconocido",
      agenteId: session.user.id,
      mes,
    },
  });

  return NextResponse.json(llamada, { status: 201 });
}
