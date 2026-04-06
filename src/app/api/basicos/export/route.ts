import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes"); // YYYY-MM

  const where = mes ? { mes } : {};

  const llamadas = await prisma.llamadaBasico.findMany({
    where,
    include: { cliente: true },
    orderBy: [{ cliente: { equipo: "asc" } }, { cliente: { empresa: "asc" } }, { createdAt: "asc" }],
  });

  const rows = llamadas.map((l: typeof llamadas[number]) => ({
    Equipo: l.cliente.equipo,
    Empresa: l.cliente.empresa,
    Mes: l.mes,
    Motivo: l.motivo,
    Descripción: l.descripcion,
    Ticket: l.ticket,
    Agente: l.agente,
    Fecha: l.createdAt.toLocaleDateString("es-AR"),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, mes ? `Llamadas ${mes}` : "Todas las llamadas");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = mes ? `informe_basicos_${mes}.xlsx` : `informe_basicos_todos.xlsx`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
