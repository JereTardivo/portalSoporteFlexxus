import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
    (eq) =>
      eq.toLowerCase() === lower ||
      eq.toLowerCase().replace("ó", "o") === lower.replace("ó", "o")
  );
  return match ?? sinParentesis;
}

async function main() {
  const clientes = await prisma.clienteBasico.findMany({ select: { id: true, empresa: true, equipo: true } });

  let actualizados = 0;
  let sinCambios = 0;

  for (const c of clientes) {
    const equipoNormalizado = normalizarEquipo(c.equipo);
    if (equipoNormalizado !== c.equipo) {
      await prisma.clienteBasico.update({
        where: { id: c.id },
        data: { equipo: equipoNormalizado },
      });
      console.log(`  ✅ "${c.empresa}": "${c.equipo}" → "${equipoNormalizado}"`);
      actualizados++;
    } else {
      sinCambios++;
    }
  }

  console.log(`\n🎉 ${actualizados} actualizados, ${sinCambios} ya estaban correctos`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
