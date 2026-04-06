-- CreateTable
CREATE TABLE "TareaValor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "premium" TEXT NOT NULL,
    "basico" TEXT NOT NULL,
    "porCasos" TEXT NOT NULL,
    "sinSoporte" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
