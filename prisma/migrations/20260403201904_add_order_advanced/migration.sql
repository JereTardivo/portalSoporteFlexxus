-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TareaValor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "premium" TEXT NOT NULL,
    "basico" TEXT NOT NULL,
    "porCasos" TEXT NOT NULL,
    "sinSoporte" TEXT NOT NULL,
    "orderAdvanced" TEXT NOT NULL DEFAULT '-',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_TareaValor" ("basico", "id", "nombre", "orden", "porCasos", "premium", "sinSoporte", "updatedAt") SELECT "basico", "id", "nombre", "orden", "porCasos", "premium", "sinSoporte", "updatedAt" FROM "TareaValor";
DROP TABLE "TareaValor";
ALTER TABLE "new_TareaValor" RENAME TO "TareaValor";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
