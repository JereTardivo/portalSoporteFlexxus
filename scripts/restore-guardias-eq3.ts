import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const team = await prisma.team.findFirst({ where: { name: "Equipo 3" } });
  if (!team) throw new Error("Equipo 3 no encontrado");

  const users = await prisma.user.findMany({ where: { teamId: team.id } });
  const byName = (name: string) => {
    const u = users.find((u) => u.name === name);
    if (!u) throw new Error(`Usuario no encontrado: ${name}`);
    return u.id;
  };

  const guardias = [
    // ── Enero 2026 ──
    { weekStart: "2026-01-03", g1: "Juan Avila",          g2: "Agustin Masanti"   },
    { weekStart: "2026-01-10", g1: "Ignacio Tulian",       g2: "Benjamin De Giorgi"},
    { weekStart: "2026-01-17", g1: "Benjamin De Giorgi",   g2: "Gonzalo Acevedo"   },
    { weekStart: "2026-01-24", g1: "Gonzalo Acevedo",      g2: "Juan Avila"        },
    { weekStart: "2026-01-31", g1: "Gonzalo Acevedo",      g2: "Juan Avila"        },
    // ── Febrero 2026 ──
    { weekStart: "2026-02-07", g1: "Agustin Giuliani",     g2: "Gonzalo Acevedo"   },
    { weekStart: "2026-02-14", g1: "Juan Castro",          g2: "Ignacio Tulian"    },
    { weekStart: "2026-02-21", g1: "Juan Castro",          g2: "Ignacio Tulian"    },
    { weekStart: "2026-02-28", g1: "Juan Avila",           g2: "Benjamin De Giorgi"},
    // ── Marzo 2026 ──
    { weekStart: "2026-03-07", g1: "Benjamin De Giorgi",   g2: "Juan Avila"        },
    { weekStart: "2026-03-14", g1: "Gonzalo Acevedo",      g2: "Agustin Giuliani"  },
    { weekStart: "2026-03-21", g1: "Ignacio Tulian",       g2: "Gonzalo Acevedo"   },
    { weekStart: "2026-03-28", g1: "Juan Avila",           g2: "Agustin Masanti"   },
    // ── Abril 2026 ──
    { weekStart: "2026-04-04", g1: "Agustin Masanti",      g2: "Agustin Giuliani"  },
    { weekStart: "2026-04-11", g1: "Agustin Giuliani",     g2: "Benjamin De Giorgi"},
    { weekStart: "2026-04-18", g1: "Benjamin De Giorgi",   g2: "Agustin Masanti"   },
    { weekStart: "2026-04-25", g1: "Ignacio Tulian",       g2: "Juan Castro"       },
    // ── Mayo 2026 ──
    { weekStart: "2026-05-02", g1: "Agustin Masanti",      g2: "Juan Castro"       },
  ];

  for (const g of guardias) {
    await prisma.guardia.upsert({
      where: {
        teamId_weekStart: {
          teamId: team.id,
          weekStart: new Date(g.weekStart),
        },
      },
      update: {
        guardia1Id: byName(g.g1),
        guardia2Id: byName(g.g2),
      },
      create: {
        teamId: team.id,
        weekStart: new Date(g.weekStart),
        guardia1Id: byName(g.g1),
        guardia2Id: byName(g.g2),
      },
    });
    console.log(`✅ ${g.weekStart}: ${g.g1} / ${g.g2}`);
  }

  console.log(`\n🎉 ${guardias.length} guardias restauradas para Equipo 3`);
}

main()
  .catch((e) => { console.error("❌", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
