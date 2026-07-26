-- CreateEnum
CREATE TYPE "tipo_acidente" AS ENUM ('TIPICO', 'DOENCA', 'TRAJETO');

-- CreateEnum
CREATE TYPE "tipo_cat" AS ENUM ('INICIAL', 'REABERTURA', 'COMUNICACAO_OBITO');

-- CreateEnum
CREATE TYPE "parte_atingida" AS ENUM ('CABECA', 'OLHOS', 'MAO', 'BRACO', 'TRONCO', 'PERNA', 'PE', 'MULTIPLAS');

-- CreateEnum
CREATE TYPE "agente_causador" AS ENUM ('MAQUINA', 'FERRAMENTA', 'QUEDA', 'VEICULO', 'SUBSTANCIA_QUIMICA', 'ELETRICIDADE', 'OUTRO');

-- CreateEnum
CREATE TYPE "tipo_lesao" AS ENUM ('CORTE', 'FRATURA', 'QUEIMADURA', 'CONTUSAO', 'ENTORSE', 'INTOXICACAO', 'OUTRA');

-- CreateTable
CREATE TABLE "acidentes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "colaborador_id" UUID NOT NULL,
    "data_acidente" DATE NOT NULL,
    "hora_acidente" VARCHAR(4) NOT NULL,
    "horas_trabalhadas_antes" VARCHAR(4) NOT NULL,
    "tipo_acidente" "tipo_acidente" NOT NULL,
    "tipo_cat" "tipo_cat" NOT NULL DEFAULT 'INICIAL',
    "obito" BOOLEAN NOT NULL DEFAULT false,
    "data_obito" DATE,
    "comunicado_policia" BOOLEAN NOT NULL DEFAULT false,
    "local_acidente" VARCHAR(255) NOT NULL,
    "parte_atingida" "parte_atingida" NOT NULL,
    "agente_causador" "agente_causador" NOT NULL,
    "tipo_lesao" "tipo_lesao" NOT NULL,
    "descricao" TEXT NOT NULL,
    "cid" VARCHAR(10),
    "data_atendimento" DATE NOT NULL,
    "hora_atendimento" VARCHAR(4) NOT NULL,
    "houve_internacao" BOOLEAN NOT NULL DEFAULT false,
    "houve_afastamento" BOOLEAN NOT NULL DEFAULT false,
    "duracao_tratamento_dias" INTEGER NOT NULL DEFAULT 0,
    "medico" VARCHAR(255) NOT NULL,
    "crm" VARCHAR(20) NOT NULL,
    "uf_crm" VARCHAR(2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "acidentes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acidentes_colaborador_id_idx" ON "acidentes"("colaborador_id");

-- AddForeignKey
ALTER TABLE "acidentes" ADD CONSTRAINT "acidentes_colaborador_id_fkey" FOREIGN KEY ("colaborador_id") REFERENCES "colaboradores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "eventos_esocial" ADD COLUMN "acidente_id" UUID;

-- CreateIndex
CREATE INDEX "eventos_esocial_acidente_id_idx" ON "eventos_esocial"("acidente_id");

-- AddForeignKey
ALTER TABLE "eventos_esocial" ADD CONSTRAINT "eventos_esocial_acidente_id_fkey" FOREIGN KEY ("acidente_id") REFERENCES "acidentes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
