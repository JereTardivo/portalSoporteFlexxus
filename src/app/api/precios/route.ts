import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const precios = await prisma.precioSoporte.findMany({
      orderBy: { orden: "asc" },
    });
    return NextResponse.json(precios);
  } catch {
    return NextResponse.json({ error: "Error al obtener precios" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const { id, valor } = await request.json();
    const precio = await prisma.precioSoporte.update({
      where: { id },
      data: { valor: parseFloat(valor) },
    });
    return NextResponse.json(precio);
  } catch {
    return NextResponse.json({ error: "Error al actualizar precio" }, { status: 500 });
  }
}
