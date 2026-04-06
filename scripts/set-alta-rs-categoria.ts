import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const tareas = await prisma.$queryRawUnsafe<{ id: string; nombre: string }[]>(
    `SELECT id, nombre FROM TareaValor ORDER BY orden ASC`
  );
  console.log("Tareas encontradas:");
  tareas.forEach(t => console.log(` - [${t.id}] ${t.nombre}`));

  const result = await prisma.$executeRawUnsafe(
    `UPDATE TareaValor SET categoriaEspecial = 'alta_razon_social' WHERE nombre LIKE '%ALTA RAZON SOCIAL%'`
  );

  console.log(`\n✅ Filas actualizadas: ${result}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
