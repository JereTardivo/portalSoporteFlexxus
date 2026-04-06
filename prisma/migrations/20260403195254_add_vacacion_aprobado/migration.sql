-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vacacion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "nota" TEXT,
    "aprobado" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vacacion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Vacacion" ("createdAt", "fecha", "id", "nota", "userId") SELECT "createdAt", "fecha", "id", "nota", "userId" FROM "Vacacion";
DROP TABLE "Vacacion";
ALTER TABLE "new_Vacacion" RENAME TO "Vacacion";
CREATE UNIQUE INDEX "Vacacion_userId_fecha_key" ON "Vacacion"("userId", "fecha");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
