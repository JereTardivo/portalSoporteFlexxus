import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import * as XLSX from "xlsx";

const EQUIPOS_CANONICOS = [
  "Equipo 1",
  "Equipo 2",
  "Equipo 3",
  "Equipo 4",
  "Equipo 5",
  "Equipo Corralón",
];

function normalizarEquipo(raw: string): string {
  const sinParentesis = raw.replace(/\s*\(.*?\)\s*/g, "").trim();
  const lower = sinParentesis.toLowerCase().replace(/\s+/g, " ");
  const match = EQUIPOS_CANONICOS.find(
    (eq) => eq.toLowerCase() === lower || eq.toLowerCase().replace("ó", "o") === lower.replace("ó", "o")
  );
  return match ?? sinParentesis;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

  const validas = rows.filter((r) => {
    const razonsocial = r["RAZONSOCIAL"] as string | undefined;
    const nombre = r["NOMBRE"] as string | undefined;
    return razonsocial && typeof razonsocial === "string" && nombre && typeof nombre === "string";
  });

  if (validas.length === 0)
    return NextResponse.json(
      { error: "El archivo no tiene filas válidas. Requiere columnas RAZONSOCIAL y NOMBRE." },
      { status: 400 }
    );

  let agregadas = 0;
  let actualizadas = 0;

  for (const row of validas) {
    const empresa = (row["RAZONSOCIAL"] as string).trim();
    const equipo = normalizarEquipo((row["NOMBRE"] as string).trim());

    const existe = await prisma.clienteBasico.findUnique({ where: { empresa } });
    if (existe) {
      await prisma.clienteBasico.update({
        where: { empresa },
        data: { equipo },
      });
      actualizadas++;
    } else {
      await prisma.clienteBasico.create({ data: { empresa, equipo } });
      agregadas++;
    }
  }

  return NextResponse.json({ ok: true, agregadas, actualizadas, total: validas.length });
}
