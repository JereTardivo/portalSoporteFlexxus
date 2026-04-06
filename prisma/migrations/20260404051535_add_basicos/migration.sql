-- AlterTable
ALTER TABLE "TareaValor" ADD COLUMN "categoriaEspecial" TEXT;

-- CreateTable
CREATE TABLE "ClienteBasico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresa" TEXT NOT NULL,
    "equipo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LlamadaBasico" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clienteId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ticket" TEXT NOT NULL,
    "agente" TEXT NOT NULL,
    "agenteId" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LlamadaBasico_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "ClienteBasico" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ClienteBasico_empresa_key" ON "ClienteBasico"("empresa");
